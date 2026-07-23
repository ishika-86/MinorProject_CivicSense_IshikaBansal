import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ThumbsUp, Bookmark, RotateCcw, Star, MapPin, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import { StatusBadge, PriorityBadge, SkeletonCard, EmptyState, Button } from '../../components/ui/index.jsx'
import ComplaintMap from '../../components/maps/ComplaintMap.jsx'

export default function ComplaintDetail() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const [c,          setC]          = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [rating,     setRating]     = useState(0)
  const [comment,    setComment]    = useState('')
  const [submFb,     setSubmFb]     = useState(false)
  const [reopenTxt,  setReopenTxt]  = useState('')
  const [showReopen, setShowReopen] = useState(false)

  useEffect(() => {
    api.get(`/complaints/${id}`)
      .then(r => setC(r.data.complaint))
      .catch(() => toast.error('Complaint not found'))
      .finally(() => setLoading(false))
  }, [id])

  const upvote = async () => {
    try {
      const r = await api.post(`/complaints/${id}/upvote`)
      setC(x => ({ ...x, upvoteCount: r.data.upvoteCount }))
      toast.success(r.data.upvoted ? 'Upvoted! +1 rep to author' : 'Upvote removed')
    } catch { toast.error('Failed') }
  }

  const bookmark = async () => {
    try {
      const r = await api.post(`/complaints/${id}/bookmark`)
      toast.success(r.data.bookmarked ? 'Bookmarked!' : 'Bookmark removed')
    } catch { toast.error('Failed') }
  }

  const reopen = async () => {
    try {
      await api.post(`/complaints/${id}/reopen`, { reason: reopenTxt })
      toast.success('Complaint reopened')
      setC(x => ({ ...x, status: 'reopened' }))
      setShowReopen(false)
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to reopen') }
  }

  const submitFeedback = async () => {
    if (!rating) return toast.error('Please select a rating first')
    setSubmFb(true)
    try {
      await api.post(`/complaints/${id}/feedback`, { rating, comment })
      toast.success('Feedback submitted! +5 reputation points')
      setC(x => ({ ...x, feedback: { rating, comment, submittedAt: new Date() } }))
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setSubmFb(false) }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )

  if (!c) return (
    <div className="max-w-3xl mx-auto">
      <EmptyState icon="🔍" title="Complaint not found" description="This complaint may have been removed or doesn't exist." />
    </div>
  )

  const borderMap = {
    pending:       'border-amber-200',
    resolved:      'border-green-200',
    rejected:      'border-red-200',
    'in-progress': 'border-purple-200',
    escalated:     'border-orange-200',
    reopened:      'border-cyan-200',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-dash-2 hover:text-dash-1 text-sm transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Main Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl bg-white/80 backdrop-blur-sm border-2 shadow-glass p-6 ${borderMap[c.status] || 'border-dash-3/20'}`}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="font-mono text-[10px] text-dash-2/60 bg-dash-4 px-1.5 py-0.5 rounded">
              {c.complaintNumber}
            </span>
            <h1 className="text-dash-1 text-xl font-bold mt-1.5">{c.title}</h1>
            <p className="text-dash-2 text-sm mt-0.5">{c.category} · {c.area}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <StatusBadge status={c.status} />
            <PriorityBadge priority={c.priority} />
          </div>
        </div>

        <p className="text-dash-2 text-sm mt-4 leading-relaxed">{c.description}</p>

        <div className="flex items-center gap-4 mt-4 text-xs text-dash-2/60 flex-wrap">
          <span className="flex items-center gap-1"><MapPin size={11} />{c.address || c.area}</span>
          <span className="flex items-center gap-1">
            <Clock size={11} />{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
          </span>
          {c.assignedTo && <span>👷 {c.assignedTo.name} ({c.assignedTo.department})</span>}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-5 flex-wrap">
          <button onClick={upvote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dash-4 hover:bg-dash-3/40 text-sm font-medium text-dash-1 transition-colors"
          >
            <ThumbsUp size={13} /> {c.upvoteCount || 0}
          </button>
          <button onClick={bookmark}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dash-4 hover:bg-dash-3/40 text-sm font-medium text-dash-1 transition-colors"
          >
            <Bookmark size={13} /> Bookmark
          </button>
          {c.status === 'resolved' && !showReopen && (
            <button onClick={() => setShowReopen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 text-sm font-medium transition-colors"
            >
              <RotateCcw size={13} /> Reopen
            </button>
          )}
        </div>

        {showReopen && (
          <div className="mt-3 space-y-2">
            <input value={reopenTxt} onChange={e => setReopenTxt(e.target.value)}
              placeholder="Reason for reopening…" className="input text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={reopen} variant="danger">Confirm Reopen</Button>
              <Button onClick={() => setShowReopen(false)} variant="ghost">Cancel</Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Complaint Images */}
      {c.images?.length > 0 && (
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-glass p-5">
          <h3 className="font-bold text-dash-1 mb-3">Complaint Photos</h3>
          <div className="grid grid-cols-3 gap-2">
            {c.images.map((img, i) => (
              <img key={i} src={img} alt="" className="rounded-xl w-full h-28 object-cover border border-dash-3/20" />
            ))}
          </div>
        </div>
      )}

      {/* Proof Images (from officer) */}
      {c.proofImages?.length > 0 && (
        <div className="rounded-2xl bg-green-50 border border-green-200 shadow-glass p-5">
          <h3 className="font-bold text-green-800 mb-3">✅ Resolution Proof (from Officer)</h3>
          <div className="grid grid-cols-3 gap-2">
            {c.proofImages.map((img, i) => (
              <img key={i} src={img} alt="" className="rounded-xl w-full h-28 object-cover border border-green-200" />
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-glass p-5">
        <h3 className="font-bold text-dash-1 mb-4">Status Timeline</h3>
        <div className="space-y-3">
          {(c.timeline || []).map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex gap-3"
            >
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-auth-3 flex-shrink-0 mt-0.5" />
                {i < (c.timeline?.length || 0) - 1 && <div className="w-px flex-1 bg-dash-3/30 mt-1" />}
              </div>
              <div className="pb-4">
                <p className="text-dash-1 text-sm font-semibold capitalize">{t.status?.replace('-', ' ')}</p>
                <p className="text-dash-2 text-xs mt-0.5">{t.message}</p>
                <p className="text-dash-2/50 text-xs mt-1">
                  {new Date(t.timestamp).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-white/50 shadow-glass" style={{ height: '220px' }}>
        <ComplaintMap selectedComplaint={c} height="100%" />
      </div>

      {/* Feedback (only for resolved, not yet rated) */}
      {c.status === 'resolved' && !c.feedback?.rating && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-glass p-5"
        >
          <h3 className="font-bold text-dash-1 mb-1">Rate the Resolution ⭐</h3>
          <p className="text-dash-2 text-xs mb-3">Your feedback helps improve the system. Earn +5 reputation points!</p>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <motion.button key={s} onClick={() => setRating(s)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                <Star size={26} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-dash-3'} />
              </motion.button>
            ))}
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="How was the resolution? Any feedback for the officer? (optional)"
            rows={2} className="input text-sm resize-none mb-3"
          />
          <Button onClick={submitFeedback} loading={submFb}>Submit Feedback</Button>
        </motion.div>
      )}

      {/* Existing feedback */}
      {c.feedback?.rating && (
        <div className="rounded-2xl bg-green-50 border border-green-200 shadow-glass p-5">
          <p className="font-bold text-green-800 mb-2">Your Feedback ✅</p>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={16} className={s <= c.feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
            ))}
          </div>
          {c.feedback.comment && <p className="text-green-700 text-sm">{c.feedback.comment}</p>}
          <p className="text-green-600/60 text-xs mt-1">
            Submitted {formatDistanceToNow(new Date(c.feedback.submittedAt || c.updatedAt), { addSuffix: true })}
          </p>
        </div>
      )}
    </div>
  )
}
