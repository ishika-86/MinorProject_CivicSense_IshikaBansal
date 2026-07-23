import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, TrendingUp, Star, Upload, X, Loader2, MapPin, AlertTriangle, Play, ThumbsUp, ThumbsDown, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formatDistanceToNow, differenceInHours } from 'date-fns'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import { StatCard, StatusBadge, PriorityBadge, SkeletonCard, EmptyState, Modal, Button } from '../../components/ui/index.jsx'
import ComplaintMap from '../../components/maps/ComplaintMap.jsx'

const KANBAN = [
  { id:'assigned',    label:'New',         dot:'bg-blue-500',   bg:'bg-blue-50 border-blue-200'      },
  { id:'in-progress', label:'In Progress', dot:'bg-purple-500', bg:'bg-purple-50 border-purple-200'  },
  { id:'resolved',    label:'Resolved',    dot:'bg-green-500',  bg:'bg-green-50 border-green-200'    },
  { id:'rejected',    label:'Rejected',    dot:'bg-red-500',    bg:'bg-red-50 border-red-200'        },
]

export default function OfficerDashboard() {
  const { user }      = useAuthStore()
  const [complaints,  setComplaints]  = useState([])
  const [perf,        setPerf]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [view,        setView]        = useState('smart')
  const [modal,       setModal]       = useState(null)
  const [newStatus,   setNewStatus]   = useState('in-progress')
  const [notes,       setNotes]       = useState('')
  const [proofFiles,  setProofFiles]  = useState([])
  const [proofPreviews, setProofPreviews] = useState([])
  const [updating,    setUpdating]    = useState(false)
  const [newTaskAlert,setNewTaskAlert]= useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [c, p] = await Promise.all([api.get('/officer/complaints?limit=80'), api.get('/officer/performance')])
      const prev = complaints.length
      const fresh = c.data.complaints || []
      if (prev > 0 && fresh.length > prev) {
        const newest = fresh[0]
        setNewTaskAlert(newest)
        setTimeout(() => setNewTaskAlert(null), 6000)
      }
      setComplaints(fresh)
      setPerf(p.data.performance)
    } catch { toast.error('Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv) }, [])

  const openModal = (c) => { setModal(c); setNewStatus(c.status==='assigned'?'in-progress':c.status); setNotes('') }
  const closeModal = () => { setModal(null); setProofFiles([]); setProofPreviews([]) }

  const handleProofFiles = (files) => {
    const f = Array.from(files).slice(0,5)
    setProofFiles(f); setProofPreviews(f.map(x=>URL.createObjectURL(x)))
  }

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      const fd = new FormData()
      fd.append('status', newStatus); fd.append('notes', notes)
      proofFiles.forEach(f => fd.append('proofImages', f))
      await api.put(`/officer/complaints/${modal._id}/status`, fd, { headers:{'Content-Type':'multipart/form-data'} })
      toast.success(`Updated to ${newStatus}`)
      closeModal(); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') } finally { setUpdating(false) }
  }

  const respond = async (id, action) => {
    try {
      await api.put(`/officer/complaints/${id}/respond`, { action })
      toast.success(`Assignment ${action}ed`)
      load()
    } catch (e) { toast.error('Failed') }
  }

  // Smart groupings
  const highPriority = complaints.filter(c => ['emergency','high'].includes(c.priority) && c.status !== 'resolved')
  const dueSoon      = complaints.filter(c => c.dueDate && differenceInHours(new Date(c.dueDate), new Date()) < 24 && c.status !== 'resolved')
  const kanban       = KANBAN.reduce((acc, col) => { acc[col.id] = complaints.filter(c => c.status === col.id); return acc }, {})

  // Today resolved
  const todayResolved = complaints.filter(c => c.status==='resolved' && c.resolvedAt && new Date(c.resolvedAt).toDateString()===new Date().toDateString()).length

  const statCards = [
    { title:'Total Assigned', value:perf?.total,          icon:Clock,       color:'bg-dash-4'    },
    { title:'Resolved',       value:perf?.resolved,       icon:CheckCircle, color:'bg-green-50'  },
    { title:'Today Done',     value:todayResolved,         icon:Zap,         color:'bg-yellow-50' },
    { title:'Resolution Rate',value:perf?.resolutionRate!==undefined?`${perf.resolutionRate}%`:'—', icon:Star, color:'bg-amber-50' },
  ]

  return (
    <div className="space-y-6">
      {/* New Task Alert */}
      <AnimatePresence>
        {newTaskAlert && (
          <motion.div initial={{opacity:0,y:-30}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-30}}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-dash-1 text-white rounded-2xl px-5 py-3 shadow-glass-lg flex items-center gap-3 border border-white/15"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            <p className="font-semibold text-sm">🆕 New task assigned: {newTaskAlert.complaintNumber}</p>
            <button onClick={()=>setNewTaskAlert(null)} className="p-1 hover:bg-white/10 rounded-lg"><X size={13}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-dash-1 text-2xl font-bold">Officer Dashboard</h1>
          <p className="text-dash-2 text-sm">{user?.department||'General'} · {user?.area} · <span className="text-green-600 font-medium">● Live</span></p>
        </div>
        <div className="flex gap-2">
          {['smart','kanban','list','map'].map(m=>(
            <button key={m} onClick={()=>setView(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${view===m?'bg-dash-1 text-white':'bg-white text-dash-2 border border-dash-3/30 hover:bg-dash-4'}`}
            >
              {m==='smart'?'🧠 Smart':m==='kanban'?'🗂 Kanban':m==='list'?'📋 List':'🗺️ Map'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((c,i)=>(
          <motion.div key={c.title} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}>
            <StatCard {...c} loading={loading}/>
          </motion.div>
        ))}
      </div>

      {/* ── SMART VIEW ── */}
      {view==='smart' && (
        <div className="space-y-6">
          {/* High Priority */}
          {highPriority.length>0 && (
            <div>
              <h2 className="font-bold text-dash-1 flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-red-500"/>High Priority Tasks <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{highPriority.length}</span></h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {highPriority.slice(0,4).map((c,i)=><ComplaintCard key={c._id} c={c} i={i} onOpen={openModal} onRespond={respond}/>)}
              </div>
            </div>
          )}

          {/* Due Soon */}
          {dueSoon.length>0 && (
            <div>
              <h2 className="font-bold text-dash-1 flex items-center gap-2 mb-3"><Clock size={16} className="text-orange-500"/>Due Soon <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{dueSoon.length}</span></h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dueSoon.slice(0,4).map((c,i)=><ComplaintCard key={c._id} c={c} i={i} onOpen={openModal} onRespond={respond} showDue/>)}
              </div>
            </div>
          )}

          {/* All active */}
          <div>
            <h2 className="font-bold text-dash-1 mb-3">All Active Tasks ({complaints.filter(c=>c.status!=='resolved').length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {loading?Array(6).fill(0).map((_,i)=><SkeletonCard key={i}/>)
                :complaints.filter(c=>c.status!=='resolved').length===0?<EmptyState icon="✅" title="All caught up!" description="No active tasks right now."/>
                :complaints.filter(c=>c.status!=='resolved').map((c,i)=><ComplaintCard key={c._id} c={c} i={i} onOpen={openModal} onRespond={respond}/>)
              }
            </div>
          </div>
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {view==='kanban' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN.map(col=>(
            <div key={col.id} className={`rounded-2xl border-2 ${col.bg} p-3`}>
              <div className="flex items-center gap-2 mb-3"><div className={`w-2.5 h-2.5 rounded-full ${col.dot}`}/><span className="font-semibold text-dash-1 text-sm">{col.label}</span><span className="ml-auto text-xs bg-white/60 text-dash-2 px-2 py-0.5 rounded-full font-semibold">{kanban[col.id]?.length||0}</span></div>
              <div className="space-y-2 min-h-16">
                {loading?Array(2).fill(0).map((_,i)=><div key={i} className="skeleton h-20"/>)
                  :kanban[col.id]?.length===0?<p className="text-dash-2/40 text-xs text-center py-4">Empty</p>
                  :kanban[col.id].map(c=>(
                  <motion.div key={c._id} whileHover={{scale:1.01}} onClick={()=>openModal(c)}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm cursor-pointer border border-white/60 hover:shadow-md transition-all"
                  >
                    <PriorityBadge priority={c.priority}/>
                    <p className="text-dash-1 text-xs font-semibold mt-1.5 line-clamp-2">{c.title}</p>
                    <p className="text-dash-2/60 text-xs mt-1">{c.area}</p>
                    <p className="text-dash-2/50 text-[10px] mt-0.5">{formatDistanceToNow(new Date(c.createdAt),{addSuffix:true})}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view==='list' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dash-4/60 border-b border-dash-3/20"><tr>{['Complaint','Category','Area','Priority','Status','Due','Action'].map(h=><th key={h} className="p-3 text-left text-xs text-dash-2 font-semibold uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-dash-4/50">
                {loading?Array(5).fill(0).map((_,i)=><tr key={i}><td colSpan={7} className="p-2"><div className="skeleton h-10"/></td></tr>)
                  :complaints.map((c,i)=>(
                  <motion.tr key={c._id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}} className={`hover:bg-dash-4/30 ${c.priority==='emergency'?'bg-red-50/40':''}`}>
                    <td className="p-3"><p className="font-semibold text-dash-1 text-xs">{c.title}</p><p className="text-dash-2/60 text-xs font-mono">{c.complaintNumber}</p></td>
                    <td className="p-3 text-xs text-dash-2">{c.category}</td>
                    <td className="p-3 text-xs text-dash-2">{c.area}</td>
                    <td className="p-3"><PriorityBadge priority={c.priority}/></td>
                    <td className="p-3"><StatusBadge status={c.status}/></td>
                    <td className="p-3 text-xs text-dash-2/60">{c.dueDate?new Date(c.dueDate).toLocaleDateString('en-IN'):'—'}</td>
                    <td className="p-3"><button onClick={()=>openModal(c)} className="px-2.5 py-1.5 bg-auth-1 text-auth-4 rounded-lg text-xs font-semibold hover:bg-auth-2">Update</button></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MAP VIEW ── */}
      {view==='map' && (
        <div className="space-y-3">
          <p className="text-dash-2 text-sm">Showing your assigned complaints on map — click markers for details.</p>
          <div className="card p-0 overflow-hidden" style={{height:'480px'}}><ComplaintMap height="100%"/></div>
        </div>
      )}

      {/* ── Update Modal ── */}
      <Modal isOpen={!!modal} onClose={closeModal} title={`Update: ${modal?.complaintNumber}`} size="lg">
        {modal && (
          <div className="space-y-4">
            <div className="bg-dash-4/60 rounded-xl p-3">
              <p className="font-semibold text-dash-1">{modal.title}</p>
              <p className="text-dash-2 text-xs mt-0.5 line-clamp-2">{modal.description}</p>
              <div className="flex gap-2 mt-2"><PriorityBadge priority={modal.priority}/><StatusBadge status={modal.status}/></div>
            </div>

            {modal.status==='assigned' && (
              <div className="flex gap-3">
                <button onClick={()=>respond(modal._id,'accept')} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 border-2 border-green-200 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-100 transition-colors">
                  <ThumbsUp size={15}/> Accept Task
                </button>
                <button onClick={()=>respond(modal._id,'reject')} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
                  <ThumbsDown size={15}/> Reject
                </button>
              </div>
            )}

            <div>
              <label className="text-dash-1 text-sm font-semibold mb-2 block">Update Status</label>
              <div className="flex gap-2 flex-wrap">
                {['in-progress','resolved','rejected'].map(s=>(
                  <button key={s} type="button" onClick={()=>setNewStatus(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all border-2 flex items-center gap-1.5 ${newStatus===s?'border-auth-4 bg-auth-1/50 text-auth-4':'border-dash-3/20 text-dash-2 hover:border-dash-3'}`}
                  >
                    {s==='in-progress'&&<Play size={11}/>}{s==='resolved'&&<CheckCircle size={11}/>}{s.replace('-',' ')}
                  </button>
                ))}
              </div>
            </div>

            <div><label className="text-dash-1 text-sm font-semibold mb-1 block">Officer Notes</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Describe actions taken…" className="input resize-none"/></div>

            {/* Proof Images with Preview */}
            <div>
              <label className="text-dash-1 text-sm font-semibold mb-1 block">Upload Proof Images</label>
              <label className="flex items-center gap-2 border-2 border-dashed border-dash-3/30 rounded-xl p-3 cursor-pointer hover:border-auth-3 transition-colors">
                <input type="file" accept="image/*" multiple onChange={e=>handleProofFiles(e.target.files)} className="hidden"/>
                <Upload size={16} className="text-dash-2"/>
                <span className="text-dash-2 text-sm">{proofFiles.length>0?`${proofFiles.length} selected`:'Click to upload proof photos'}</span>
              </label>
              {proofPreviews.length>0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {proofPreviews.map((p,i)=>(
                    <div key={i} className="relative w-16 h-16">
                      <img src={p} alt="" className="w-full h-full object-cover rounded-xl"/>
                      <button type="button" onClick={()=>{setProofFiles(f=>f.filter((_,idx)=>idx!==i));setProofPreviews(v=>v.filter((_,idx)=>idx!==i))}}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"><X size={8}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1"><Button onClick={handleUpdate} loading={updating}>Save Update</Button><Button variant="ghost" onClick={closeModal}>Cancel</Button></div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// Complaint card component for Smart view
function ComplaintCard({ c, i, onOpen, onRespond, showDue }) {
  const urgentColors = { emergency:'border-red-300 bg-red-50/50', high:'border-orange-200 bg-orange-50/30', medium:'border-dash-3/20 bg-white/80', low:'border-dash-3/10 bg-white/60' }
  const hours = c.dueDate ? differenceInHours(new Date(c.dueDate), new Date()) : null

  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} whileHover={{y:-2}}
      className={`rounded-2xl border-2 p-4 cursor-pointer transition-all shadow-sm hover:shadow-md backdrop-blur-sm ${urgentColors[c.priority]||urgentColors.medium}`}
    >
      <div className="flex items-start justify-between mb-2">
        <PriorityBadge priority={c.priority}/>
        <StatusBadge status={c.status}/>
      </div>
      <p className="text-dash-1 font-semibold text-sm leading-snug line-clamp-2">{c.title}</p>
      <p className="text-dash-2 text-xs mt-1">{c.category}</p>
      <div className="flex items-center gap-2 mt-1.5 text-xs text-dash-2/60">
        <MapPin size={10}/>{c.area}
        {showDue && hours !== null && <span className={`ml-auto font-semibold ${hours<6?'text-red-600':hours<12?'text-orange-600':'text-dash-2'}`}>Due {hours}h</span>}
      </div>
      {c.citizen && <p className="text-xs text-dash-2/50 mt-1">👤 {c.citizen.name}</p>}

      {/* Action buttons */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-dash-3/15">
        {c.status==='assigned' && (
          <>
            <button onClick={(e)=>{e.stopPropagation();onRespond(c._id,'accept')}} className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-1">
              <ThumbsUp size={10}/> Accept
            </button>
            <button onClick={(e)=>{e.stopPropagation();onRespond(c._id,'reject')}} className="flex-1 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors">Reject</button>
          </>
        )}
        {c.status==='in-progress' && (
          <button onClick={(e)=>{e.stopPropagation();onOpen(c)}} className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-1">
            <CheckCircle size={10}/> Mark Resolved
          </button>
        )}
        <button onClick={(e)=>{e.stopPropagation();onOpen(c)}} className="py-1.5 px-3 bg-dash-4 text-dash-1 rounded-lg text-xs font-semibold hover:bg-dash-3/40 transition-colors">Details</button>
      </div>
    </motion.div>
  )
}
