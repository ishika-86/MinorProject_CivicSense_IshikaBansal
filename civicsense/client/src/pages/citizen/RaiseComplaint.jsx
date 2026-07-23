import React, { useState, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { MapPin, Upload, X, AlertTriangle, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import api from '../../lib/axios'

const CATS = [
  { v:'Road Damage',     icon:'🛣️' }, { v:'Water Supply',    icon:'💧' },
  { v:'Electricity',     icon:'⚡' }, { v:'Garbage',         icon:'🗑️' },
  { v:'Sewage',          icon:'🚰' }, { v:'Street Light',    icon:'💡' },
  { v:'Tree Fall',       icon:'🌳' },
  { v:'Fire Hazard',     icon:'🔥', e:true }, { v:'Accident',       icon:'🚗', e:true },
  { v:'Animal Attack',   icon:'🐕', e:true }, { v:'Dangerous Animal',icon:'🦴',e:true },
  { v:'Electric Hazard', icon:'⚡', e:true }, { v:'Public Safety',  icon:'🚨', e:true },
  { v:'Encroachment',    icon:'🏗️' }, { v:'Noise Pollution', icon:'📢' },
  { v:'Other',           icon:'📋' },
]
const AREAS = [
  'Lashkar','Gwalior Fort','Morar','Thatipur','City Center','Phool Bagh',
  'DD Nagar','Govindpuri','Sirol','Hazira','Jhansi Road','Kampoo',
  'Maharaj Bada','Tansen Nagar','Roxy Pull','Anand Nagar','Bahodapur',
  'Sagartal','Vinay Nagar','Other',
]

const schema = z.object({
  title:       z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category:    z.string().min(1, 'Please select a category'),
  area:        z.string().min(1, 'Please select your area'),
  address:     z.string().optional(),
  customArea:  z.string().optional(),
  isAnonymous: z.boolean().optional(),
})

export default function RaiseComplaint() {
  const navigate = useNavigate()
  const [sp]     = useSearchParams()
  const defCat   = sp.get('cat') || ''

  const [images,       setImages]      = useState([])
  const [previews,     setPreviews]    = useState([])
  const [submitting,   setSubmitting]  = useState(false)
  const [showCustom,   setShowCustom]  = useState(false)
  const [dragging,     setDragging]    = useState(false)
  const [locState,     setLocState]    = useState('idle') // idle | loading | success | error
  const [coords,       setCoords]      = useState({ lat: 26.2124, lng: 78.1772 })
  const dropRef = useRef(null)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { category: defCat, isAnonymous: false },
  })

  const cat   = watch('category')
  const isEmg = CATS.find(c => c.v === cat)?.e

  /* ── File helpers ── */
  const addFiles = (files) => {
    const arr = Array.from(files).slice(0, 5 - images.length)
    setImages(a => [...a, ...arr].slice(0, 5))
    setPreviews(a => [...a, ...arr.map(f => URL.createObjectURL(f))].slice(0, 5))
  }
  const removeImg = (i) => {
    setImages(a => a.filter((_, idx) => idx !== i))
    setPreviews(a => a.filter((_, idx) => idx !== i))
  }
  const onDrop = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }

  /* ── Fixed geolocation ── */
  const detectLocation = () => {
    if (locState === 'loading') return // prevent double-click

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      setLocState('error')
      return
    }

    setLocState('loading')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // SUCCESS — one toast only
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocState('success')
        toast.success('📍 Location captured successfully!')
      },
      (err) => {
        // ERROR — one toast only, with helpful message
        setLocState('error')
        const messages = {
          1: 'Location permission denied. Please allow access in browser settings.',
          2: 'Could not determine your location. Try again.',
          3: 'Location request timed out. Please try again.',
        }
        toast.error(messages[err.code] || 'Could not get location')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,       // 10s timeout
        maximumAge: 60000,    // accept cached if < 1 min old
      }
    )
  }

  /* ── Submit ── */
  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const fd   = new FormData()
      const area = data.area === 'Other' ? (data.customArea || 'Other') : data.area
      const payload = { ...data, area, latitude: coords.lat, longitude: coords.lng }
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v))
      })
      images.forEach(img => fd.append('images', img))

      const res = await api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success(`✅ Complaint ${res.data.complaint.complaintNumber} filed!`)
      if (isEmg) toast.error('🚨 Emergency alert sent to authorities!', { duration: 5000, style: { background: '#dc2626', color: '#fff' } })
      navigate('/citizen/complaints')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const locButtonLabel = { idle:'Detect My Location', loading:'Detecting…', success:'Location Captured', error:'Retry Location' }
  const locButtonIcon  = { idle:<MapPin size={13}/>, loading:<Loader2 size={13} className="animate-spin"/>, success:<CheckCircle size={13}/>, error:<MapPin size={13}/> }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Back link */}
      <Link to="/citizen" className="inline-flex items-center gap-2 text-dash-2 hover:text-dash-1 text-sm transition-colors">
        <ArrowLeft size={15} /> Back to Dashboard
      </Link>

      <div>
        <h1 className="font-display text-dash-1 text-2xl font-bold">Raise a Complaint</h1>
        <p className="text-dash-2 text-sm mt-0.5">Report any civic issue in Gwalior — we'll ensure it gets resolved.</p>
      </div>

      {/* Emergency banner */}
      <AnimatePresence>
        {isEmg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-red-500 text-white rounded-2xl p-4 flex items-center gap-3 shadow-emergency"
          >
            <AlertTriangle size={20} className="flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">⚠️ Emergency Category Selected</p>
              <p className="text-xs opacity-85">This will instantly alert authorities and nearby residents via SMS and push notifications.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-glass p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Category ── */}
          <div>
            <label className="text-dash-1 text-sm font-semibold mb-3 block">Category *</label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {CATS.map(({ v, icon, e }) => (
                <motion.button key={v} type="button" whileTap={{ scale: 0.93 }}
                  onClick={() => setValue('category', v, { shouldValidate: true })}
                  className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                    cat === v
                      ? e ? 'border-red-400 bg-red-50' : 'border-auth-3 bg-auth-1/50'
                      : 'border-dash-3/20 bg-white/50 hover:border-dash-3 hover:bg-white'
                  }`}
                >
                  <span className="text-xl block">{icon}</span>
                  <span className={`text-[10px] mt-0.5 block leading-tight font-medium ${e ? 'text-red-600' : 'text-dash-1'}`}>{v}</span>
                </motion.button>
              ))}
            </div>
            {errors.category && <p className="text-red-500 text-xs mt-1.5">{errors.category.message}</p>}
          </div>

          {/* ── Title ── */}
          <div>
            <label className="text-dash-1 text-sm font-semibold mb-1.5 block">Title *</label>
            <input {...register('title')} placeholder="e.g. Large pothole on Jhansi Road near bus stand" className="input" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* ── Description ── */}
          <div>
            <label className="text-dash-1 text-sm font-semibold mb-1.5 block">Description *</label>
            <textarea {...register('description')} rows={4}
              placeholder="Describe the issue in detail — when it started, how severe it is, impact on residents…"
              className="input resize-none"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* ── Area + Landmark ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-dash-1 text-sm font-semibold mb-1.5 block">Area *</label>
              <select {...register('area')}
                onChange={e => { setShowCustom(e.target.value === 'Other') }}
                className="input"
              >
                <option value="">Select area</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area.message}</p>}
            </div>
            <div>
              <label className="text-dash-1 text-sm font-semibold mb-1.5 block">Landmark <span className="text-dash-2/50 font-normal">(optional)</span></label>
              <input {...register('address')} placeholder="Near bus stand, next to park…" className="input" />
            </div>
          </div>

          {/* Custom area input */}
          <AnimatePresence>
            {showCustom && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <input {...register('customArea')} placeholder="Type your area name" className="input" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Location ── */}
          <div>
            <label className="text-dash-1 text-sm font-semibold mb-1.5 block">GPS Location</label>
            <div className="flex gap-2 items-center">
              <div className={`flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 border transition-colors ${
                locState === 'success' ? 'bg-green-50 border-green-300' :
                locState === 'error'   ? 'bg-red-50 border-red-300' :
                'bg-dash-4/60 border-dash-3/30'
              }`}>
                <MapPin size={13} className={locState === 'success' ? 'text-green-600' : locState === 'error' ? 'text-red-500' : 'text-dash-2'} />
                <span className="text-xs font-mono text-dash-2">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  {locState === 'success' && <span className="text-green-600 ml-2 font-sans font-semibold">✓</span>}
                </span>
              </div>
              <motion.button
                type="button"
                onClick={detectLocation}
                disabled={locState === 'loading'}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all disabled:cursor-not-allowed ${
                  locState === 'success' ? 'bg-green-50 border-green-300 text-green-700' :
                  locState === 'error'   ? 'bg-red-50 border-red-300 text-red-600' :
                  'bg-white border-dash-3/40 text-dash-1 hover:bg-dash-4 hover:border-auth-3'
                }`}
              >
                {locButtonIcon[locState]}
                {locButtonLabel[locState]}
              </motion.button>
            </div>
            <p className="text-dash-2/50 text-xs mt-1.5">
              {locState === 'idle' && 'Click to auto-detect your current GPS location.'}
              {locState === 'loading' && 'Requesting location from your device…'}
              {locState === 'success' && 'Location captured! Coordinates will be sent with your complaint.'}
              {locState === 'error' && 'Location detection failed. Default Gwalior coordinates will be used.'}
            </p>
          </div>

          {/* ── Image Upload (Drag & Drop) ── */}
          <div>
            <label className="text-dash-1 text-sm font-semibold mb-1.5 block">
              Photos <span className="text-dash-2/50 font-normal">(up to 5 — helps faster resolution)</span>
            </label>
            <motion.div
              ref={dropRef}
              animate={{ borderColor: dragging ? '#7AB2D3' : 'rgba(161,194,189,0.35)' }}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${dragging ? 'bg-auth-1/30' : 'bg-white/40'}`}
            >
              <label className="cursor-pointer block">
                <input type="file" accept="image/*" multiple onChange={e => addFiles(e.target.files)} className="hidden" />
                <Upload size={24} className="text-dash-2 mx-auto mb-2" />
                <p className="text-dash-2 text-sm">
                  Drag & drop or <span className="text-auth-4 font-semibold">browse files</span>
                </p>
                <p className="text-dash-2/50 text-xs mt-1">JPEG, PNG, WebP · Max 5 MB each</p>
              </label>
            </motion.div>

            {previews.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {previews.map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="relative w-20 h-20 group"
                  >
                    <img src={p} alt="" className="w-full h-full object-cover rounded-xl border border-dash-3/20" />
                    <motion.button
                      type="button" onClick={() => removeImg(i)} whileHover={{ scale: 1.1 }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                    >
                      <X size={9} />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* ── Anonymous toggle ── */}
          <div className="flex items-center gap-3 p-3.5 bg-dash-4/50 rounded-xl border border-dash-3/20">
            <input type="checkbox" {...register('isAnonymous')} id="anon" className="w-4 h-4 accent-auth-4" />
            <label htmlFor="anon" className="text-sm text-dash-1 cursor-pointer">
              <span className="font-medium">Submit anonymously</span>
              <span className="text-dash-2/60 ml-1 text-xs">— your name won't be shown publicly</span>
            </label>
          </div>

          {/* ── Submit ── */}
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-60 ${
              isEmg ? 'bg-red-500 hover:bg-red-600 text-white shadow-emergency' : 'btn-primary'
            }`}
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {isEmg ? '🚨 Submit Emergency Complaint' : 'Submit Complaint'}
          </motion.button>
        </form>
      </div>
    </div>
  )
}
