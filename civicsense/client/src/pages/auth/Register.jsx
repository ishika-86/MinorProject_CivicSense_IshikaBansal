import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, User, Shield, Briefcase, Check } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const AREAS = ['Lashkar','Gwalior Fort','Morar','Thatipur','City Center','Phool Bagh','DD Nagar','Govindpuri','Sirol','Hazira','Jhansi Road','Kampoo','Maharaj Bada','Tansen Nagar','Roxy Pull','Anand Nagar','Bahodapur','Sagartal','Vinay Nagar','Other']

const schema = z.object({
  name:     z.string().min(2, 'Min 2 characters'),
  email:    z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters'),
  phone:    z.string().optional(),
  area:     z.string().min(1, 'Select your area'),
  customArea: z.string().optional(),
  adminCode:  z.string().optional(),
})

const ROLES = [
  { id:'citizen', label:'Citizen',  Icon:User,      desc:'Report & track',  grad:'from-auth-3 to-auth-2', auto:true  },
  { id:'admin',   label:'Admin',    Icon:Shield,    desc:'Manage system',   grad:'from-auth-4 to-dash-2', auto:false },
  { id:'officer', label:'Officer',  Icon:Briefcase, desc:'Resolve tasks',   grad:'from-dash-2 to-dash-1', auto:false },
]

const strengthScore = (p) => [p.length>=8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length
const strengthColor = ['','bg-red-400','bg-orange-400','bg-yellow-400','bg-green-400']
const strengthLabel = ['','Weak','Fair','Good','Strong']

const REDIRECT = { citizen:'/citizen', admin:'/admin', officer:'/officer' }

export default function Register() {
  const [role,       setRole]       = useState('citizen')
  const [showPwd,    setShowPwd]    = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const { register: reg, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { area:'' } })
  const pwd      = watch('password') || ''
  const strength = strengthScore(pwd)

  const onSubmit = async (data) => {
    try {
      const area = data.area === 'Other' ? (data.customArea || 'Other') : data.area
      const res  = await reg({ ...data, role, area })
      toast.success('Account created!')
      navigate(REDIRECT[res.user.role])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background:'linear-gradient(135deg,#DFF2EB 0%,#B9E5E8 50%,#7AB2D3 100%)' }}>
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="font-display text-auth-4 text-3xl font-bold">Join CivicSense</h1>
          <p className="text-auth-4/55 text-sm mt-1">Be the change Gwalior needs</p>
        </div>

        <div className="glass rounded-3xl p-8 shadow-glass-lg">
          {/* Role Selector */}
          <p className="text-auth-4/60 text-[11px] uppercase tracking-wider font-bold mb-3">Select Role</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {ROLES.map(({ id, label, Icon, desc, grad, auto }) => (
              <motion.button key={id} type="button" whileTap={{ scale:0.96 }} onClick={() => setRole(id)}
                className={`relative p-3 rounded-xl border-2 text-left transition-all ${role===id ? 'border-auth-4 bg-auth-4/8' : 'border-auth-3/25 bg-white/30 hover:border-auth-3'}`}
              >
                {role === id && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-auth-4 rounded-full flex items-center justify-center">
                    <Check size={9} className="text-white" />
                  </div>
                )}
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center mb-2`}>
                  <Icon size={13} className="text-white" />
                </div>
                <p className="text-auth-4 text-xs font-bold leading-none">{label}</p>
                <p className="text-auth-4/50 text-[10px] mt-0.5">{desc}</p>
                <p className={`text-[10px] mt-1 font-semibold ${auto ? 'text-green-600' : 'text-orange-500'}`}>
                  {auto ? '✓ Auto approved' : '⚑ Code needed'}
                </p>
              </motion.button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-auth-4 text-xs font-semibold mb-1 block">Full Name *</label>
              <input {...register('name')} placeholder="Rahul Sharma" className="input border-auth-3/30 bg-white/55 text-sm" />
              {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-auth-4 text-xs font-semibold mb-1 block">Email *</label>
                <input {...register('email')} type="email" placeholder="you@example.com" className="input border-auth-3/30 bg-white/55 text-sm" />
                {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-auth-4 text-xs font-semibold mb-1 block">Phone</label>
                <input {...register('phone')} placeholder="9876543210" className="input border-auth-3/30 bg-white/55 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-auth-4 text-xs font-semibold mb-1 block">Password *</label>
              <div className="relative">
                <input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="Min 8 characters"
                  className="input border-auth-3/30 bg-white/55 text-sm pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-auth-4/40">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {pwd && (
                <div className="mt-1.5">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-[11px] mt-0.5 ${strength < 2 ? 'text-red-500' : strength < 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {strengthLabel[strength] || ''}
                  </p>
                </div>
              )}
              {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password.message}</p>}
            </div>

            <div>
              <label className="text-auth-4 text-xs font-semibold mb-1 block">Area in Gwalior *</label>
              <select {...register('area')} onChange={(e) => setShowCustom(e.target.value === 'Other')} className="input border-auth-3/30 bg-white/55 text-sm">
                <option value="">Select your area</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.area && <p className="text-red-500 text-xs mt-0.5">{errors.area.message}</p>}
            </div>

            <AnimatePresence>
              {showCustom && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                  <input {...register('customArea')} placeholder="Type your area name" className="input border-auth-3/30 bg-white/55 text-sm" />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {(role === 'admin' || role === 'officer') && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                  <label className="text-auth-4 text-xs font-semibold mb-1 block">
                    {role === 'admin' ? 'Admin' : 'Officer'} Code *
                  </label>
                  <input {...register('adminCode')} placeholder="Contact your administrator for the code"
                    className="input border-orange-300 bg-orange-50/50 text-sm" />
                  <p className="text-orange-500 text-[11px] mt-0.5">
                    Admin: CIVIC_ADMIN_2024 &nbsp;·&nbsp; Officer: CIVIC_OFFICER_2024
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={isLoading} whileTap={{ scale:0.98 }}
              className="w-full py-3 bg-auth-4 text-white rounded-xl font-semibold text-sm hover:bg-auth-4/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading && <Loader2 size={15} className="animate-spin" />}
              Create {role.charAt(0).toUpperCase() + role.slice(1)} Account
            </motion.button>
          </form>

          <p className="text-center text-auth-4/55 text-sm mt-4">
            Have an account? <Link to="/login" className="text-auth-4 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
