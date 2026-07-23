import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import {
  PlusCircle, FileText, CheckCircle, Clock, TrendingUp,
  Star, MapPin, Flame, Zap, AlertTriangle, ArrowRight, Activity
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import { StatusBadge, PriorityBadge, SkeletonCard } from '../../components/ui/index.jsx'
import ComplaintMap from '../../components/maps/ComplaintMap.jsx'

/* ── Count-up number animation ── */
function CountUp({ end = 0, suffix = '', duration = 1.4 }) {
  const count   = useMotionValue(0)
  const display = useTransform(count, v => Math.round(v).toLocaleString() + suffix)
  useEffect(() => {
    const ctrl = animate(count, end, { duration, ease: 'easeOut' })
    return ctrl.stop
  }, [end])
  return <motion.span>{display}</motion.span>
}

/* ── Progress bar ── */
function ProgressBar({ value = 0, color = 'bg-green-500', label, count }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-dash-2 font-medium">{label}</span>
        <span className="text-xs font-bold text-dash-1">{count}</span>
      </div>
      <div className="h-2 bg-dash-4 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  )
}

/* ── Badge chip ── */
const BADGE_META = {
  first_complaint:  { label:'🌱 First Step',       color:'bg-emerald-100 text-emerald-700' },
  active_citizen:   { label:'🥇 Active Citizen',   color:'bg-amber-100 text-amber-700'    },
  civic_hero:       { label:'🏆 Civic Hero',       color:'bg-yellow-100 text-yellow-700'  },
  community_leader: { label:'👑 Community Leader', color:'bg-purple-100 text-purple-700'  },
  first_resolve:    { label:'🔧 Problem Solver',   color:'bg-blue-100 text-blue-700'      },
  swift_officer:    { label:'⚡ Swift Officer',    color:'bg-cyan-100 text-cyan-700'      },
  efficient_officer:{ label:'🛠 Efficient Officer',color:'bg-indigo-100 text-indigo-700'  },
  top_officer:      { label:'🌟 Top Officer',      color:'bg-violet-100 text-violet-700'  },
  admin_active:     { label:'📋 Active Admin',     color:'bg-slate-100 text-slate-700'    },
  smart_admin:      { label:'🧠 Smart Admin',      color:'bg-teal-100 text-teal-700'      },
  city_guardian:    { label:'🛡 City Guardian',    color:'bg-red-100 text-red-700'        },
}

function BadgeChip({ id }) {
  const meta = BADGE_META[id]
  if (!meta) return null
  return (
    <motion.span whileHover={{ scale: 1.06 }} className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
      {meta.label}
    </motion.span>
  )
}

/* ══════════════════════════════════════════════════════ */
/*  MAIN CITIZEN DASHBOARD                               */
/* ══════════════════════════════════════════════════════ */
export function CitizenDashboard() {
  const { user }         = useAuthStore()
  const [stats,          setStats]         = useState({ total:0, pending:0, inProgress:0, resolved:0, rejected:0 })
  const [recent,         setRecent]        = useState([])
  const [trending,       setTrending]      = useState([])
  const [suggestions,    setSuggestions]   = useState([])
  const [loading,        setLoading]       = useState(true)
  const [loadErr,        setLoadErr]       = useState(false)

  useEffect(() => {
    setLoading(true)
    setLoadErr(false)

    Promise.all([
      api.get('/complaints/my/stats'),   // ← proper stats endpoint
      api.get('/analytics/public'),
    ])
      .then(([statRes, pubRes]) => {
        setStats(statRes.data.stats || { total:0, pending:0, inProgress:0, resolved:0, rejected:0 })
        setRecent(statRes.data.recent || [])

        const pub = pubRes.data
        const trend = (pub.recentComplaints || [])
          .sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0))
          .slice(0, 4)
        setTrending(trend)

        // Build smart suggestions
        const tips = []
        if (statRes.data.stats?.pending > 0) tips.push(`⏳ You have ${statRes.data.stats.pending} complaint(s) awaiting assignment.`)
        if (pub.categoryData?.[0]) tips.push(`📈 "${pub.categoryData[0]._id}" is the top civic issue in Gwalior right now.`)
        if ((statRes.data.stats?.total || 0) === 0) tips.push('🚀 Start by raising a complaint — it only takes 30 seconds!')
        if (statRes.data.stats?.resolved > 0) tips.push(`✅ ${statRes.data.stats.resolved} of your complaints have been resolved — great job!`)
        setSuggestions(tips.slice(0, 3))
      })
      .catch(() => setLoadErr(true))
      .finally(() => setLoading(false))
  }, [])

  const resolutionPct = stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0

  /* ── Render ── */
  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ══ HERO CARD ════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#19183B 0%,#4A628A 55%,#7AB2D3 100%)' }}
      >
        {/* decorative rings */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[120,200,280].map((s, i) => (
            <div key={i} style={{ width:s, height:s, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.08)', position:'absolute', top:-s/3, right:-s/4 }} />
          ))}
        </div>

        <div className="relative p-6 md:p-8">
          {/* top row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white/55 text-sm font-medium tracking-wide">Welcome back 👋</p>
              <h1 className="font-display text-white text-3xl font-bold mt-0.5 leading-tight">
                {user?.name?.split(' ')[0]}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-white/50 text-xs flex items-center gap-1"><MapPin size={11}/>{user?.area || 'Gwalior'}</span>
                <span className="text-white/30">·</span>
                <span className="text-white/50 text-xs capitalize">{user?.role}</span>
              </div>
              {/* Badges */}
              {user?.badges?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {user.badges.slice(0, 3).map(b => <BadgeChip key={b} id={b} />)}
                </div>
              )}
            </div>

            {/* Reputation circle */}
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 min-w-[90px]">
              <p className="text-white/55 text-xs font-medium mb-1">Reputation</p>
              <p className="text-white text-3xl font-bold leading-none">
                {loading ? '—' : <CountUp end={user?.reputationScore || 0} />}
              </p>
              <div className="flex mt-2">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={11} className={s <= Math.ceil((user?.reputationScore || 0) / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />
                ))}
              </div>
            </div>
          </div>

          {/* stat strip */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/10">
            {[
              { label:'Total Filed',     val: stats.total    },
              { label:'Resolution Rate', val: resolutionPct, suffix:'%' },
              { label:'Active',          val: stats.inProgress + stats.pending },
            ].map(({ label, val, suffix = '' }) => (
              <div key={label} className="text-center">
                <p className="text-white text-2xl font-bold">
                  {loading ? '—' : <CountUp end={val} suffix={suffix} />}
                </p>
                <p className="text-white/50 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Raise Complaint CTA */}
        <Link to="/citizen/raise">
          <motion.div
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.22)' }}
            className="mx-6 mb-6 py-3.5 bg-white/14 border border-white/20 rounded-2xl text-white font-semibold text-sm text-center flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <PlusCircle size={16} /> Raise a New Complaint
          </motion.div>
        </Link>
      </motion.div>

      {/* ══ STAT CARDS ════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Filed',   val:stats.total,      icon:FileText,    from:'#DFF2EB', to:'#B9E5E8' },
          { label:'Pending',       val:stats.pending,    icon:Clock,       from:'#fef3c7', to:'#fde68a' },
          { label:'In Progress',   val:stats.inProgress, icon:TrendingUp,  from:'#ede9fe', to:'#ddd6fe' },
          { label:'Resolved',      val:stats.resolved,   icon:CheckCircle, from:'#d1fae5', to:'#a7f3d0' },
        ].map(({ label, val, icon: Icon, from, to }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="rounded-2xl p-5 border border-white/60 shadow-glass backdrop-blur-sm"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dash-2 text-xs font-semibold uppercase tracking-wide">{label}</p>
                <p className="text-dash-1 text-2xl font-bold mt-1.5">
                  {loading ? <span className="skeleton inline-block w-10 h-7 rounded" /> : <CountUp end={val || 0} />}
                </p>
              </div>
              <div className="w-10 h-10 bg-white/50 rounded-xl flex items-center justify-center">
                <Icon size={18} className="text-dash-1" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ══ MAIN GRID ════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Recent Complaints + Trending ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recent Complaints */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-dash-1 flex items-center gap-2">
                <Activity size={16} className="text-auth-4" /> Recent Complaints
              </h2>
              <Link to="/citizen/complaints" className="text-auth-4 text-xs font-semibold hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {loadErr ? (
              /* ── Error state ── */
              <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
                <p className="text-red-500 font-semibold text-sm mb-1">Failed to load complaints</p>
                <p className="text-red-400 text-xs">Make sure the server is running, then refresh.</p>
                <button onClick={() => window.location.reload()} className="mt-3 text-xs text-red-600 underline">Retry</button>
              </div>
            ) : loading ? (
              Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : recent.length === 0 ? (
              /* ── Empty state (no error!) ── */
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl bg-white/70 backdrop-blur-sm border border-dash-3/20 p-10 text-center shadow-glass"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="text-5xl mb-3"
                >📋</motion.div>
                <h3 className="text-dash-1 font-bold text-base mb-1">No complaints yet</h3>
                <p className="text-dash-2 text-sm mb-4">Start by raising one — it takes less than a minute!</p>
                <Link to="/citizen/raise">
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    className="btn-primary inline-flex items-center gap-2 text-sm"
                  >
                    <PlusCircle size={15} /> Raise First Complaint
                  </motion.button>
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {recent.map((c, i) => (
                  <motion.div
                    key={c._id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    whileHover={{ x: 3 }}
                  >
                    <Link to={`/citizen/complaints/${c._id}`}>
                      <div className="rounded-2xl bg-white/75 backdrop-blur-sm border border-white/60 shadow-glass p-4 hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-mono text-[10px] text-dash-2/60 bg-dash-4 px-1.5 py-0.5 rounded">
                                {c.complaintNumber}
                              </span>
                              <PriorityBadge priority={c.priority} />
                            </div>
                            <p className="text-dash-1 font-semibold text-sm truncate group-hover:text-auth-4 transition-colors">
                              {c.title}
                            </p>
                            <p className="text-dash-2 text-xs mt-0.5">{c.category} · {c.area}</p>
                            <p className="text-dash-2/50 text-xs mt-1.5">
                              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <StatusBadge status={c.status} />
                        </div>

                        {/* Mini timeline dots */}
                        {c.timeline?.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-dash-4/60">
                            {c.timeline.slice(-4).map((t, ti) => (
                              <div key={ti} className="flex items-center gap-1">
                                {ti > 0 && <div className="w-4 h-px bg-dash-3/40" />}
                                <div className="w-2 h-2 rounded-full bg-auth-3" />
                                <span className="text-[9px] text-dash-2/50 capitalize hidden sm:inline">{t.status}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Status Overview */}
          {!loading && stats.total > 0 && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="rounded-2xl bg-white/75 backdrop-blur-sm border border-white/60 shadow-glass p-5"
            >
              <h2 className="font-bold text-dash-1 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-auth-4" /> Status Overview
              </h2>
              <div className="space-y-3">
                <ProgressBar label="Resolved" count={stats.resolved} value={stats.total ? (stats.resolved/stats.total)*100 : 0} color="bg-green-500" />
                <ProgressBar label="In Progress" count={stats.inProgress} value={stats.total ? (stats.inProgress/stats.total)*100 : 0} color="bg-purple-500" />
                <ProgressBar label="Pending" count={stats.pending} value={stats.total ? (stats.pending/stats.total)*100 : 0} color="bg-amber-400" />
                <ProgressBar label="Rejected" count={stats.rejected} value={stats.total ? (stats.rejected/stats.total)*100 : 0} color="bg-red-400" />
              </div>
            </motion.section>
          )}

          {/* Trending Issues */}
          {trending.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h2 className="font-bold text-dash-1 flex items-center gap-2 mb-3">
                <Flame size={16} className="text-orange-500" /> Trending in Gwalior
              </h2>
              <div className="space-y-2">
                {trending.map((c, i) => (
                  <motion.div key={c._id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                    className="rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 p-3 flex items-center gap-3 hover:bg-white/80 transition-colors"
                  >
                    <span className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0">
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-dash-1 text-xs font-semibold truncate">{c.title}</p>
                      <p className="text-dash-2/60 text-[10px]">{c.category} · {c.area}</p>
                    </div>
                    <span className="text-xs text-dash-2/60 flex items-center gap-1 flex-shrink-0">
                      👍 {c.upvoteCount || 0}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-5">

          {/* Emergency Quick Action */}
          <Link to="/citizen/raise?cat=Accident">
            <motion.div
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              animate={{ boxShadow: ['0 0 0 0 rgba(239,68,68,0)', '0 0 0 8px rgba(239,68,68,0.15)', '0 0 0 0 rgba(239,68,68,0)'] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="bg-red-500 rounded-2xl p-4 text-white cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm">Emergency Report</p>
                  <p className="text-red-200 text-xs">Fire · Accident · Animal Attack</p>
                </div>
                <ArrowRight size={16} className="ml-auto opacity-70" />
              </div>
            </motion.div>
          </Link>

          {/* Mini Map */}
          <div>
            <h3 className="font-bold text-dash-1 text-sm mb-2 flex items-center gap-2">
              <MapPin size={14} className="text-auth-4" /> Nearby Issues
            </h3>
            <div className="rounded-2xl overflow-hidden border border-white/50 shadow-glass" style={{ height: '185px' }}>
              <ComplaintMap height="100%" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl bg-white/75 backdrop-blur-sm border border-white/60 shadow-glass p-4">
            <h3 className="font-bold text-dash-1 text-sm mb-3">Quick Report</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon:'🛣️', label:'Road Damage',   cat:'Road Damage'   },
                { icon:'💧', label:'Water Issue',   cat:'Water Supply'  },
                { icon:'💡', label:'Street Light',  cat:'Street Light'  },
                { icon:'🗑️', label:'Garbage',       cat:'Garbage'       },
                { icon:'⚡', label:'Electricity',   cat:'Electricity'   },
                { icon:'🌳', label:'Tree Fall',     cat:'Tree Fall'     },
              ].map(({ icon, label, cat }) => (
                <Link key={cat} to={`/citizen/raise?cat=${encodeURIComponent(cat)}`}>
                  <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}
                    className="flex flex-col items-center gap-1 p-3 bg-dash-4/60 rounded-xl hover:bg-auth-1/40 border border-transparent hover:border-auth-3/30 transition-all cursor-pointer"
                  >
                    <span className="text-xl">{icon}</span>
                    <span className="text-[11px] font-medium text-dash-1 text-center leading-tight">{label}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="rounded-2xl bg-white/75 backdrop-blur-sm border border-white/60 shadow-glass p-4"
            >
              <h3 className="font-bold text-dash-1 text-sm mb-3 flex items-center gap-2">
                <Zap size={14} className="text-auth-4" /> Smart Insights
              </h3>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }}
                    className="text-xs text-dash-2 bg-auth-1/30 border border-auth-3/20 rounded-xl p-2.5 leading-relaxed"
                  >
                    {s}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CitizenDashboard
