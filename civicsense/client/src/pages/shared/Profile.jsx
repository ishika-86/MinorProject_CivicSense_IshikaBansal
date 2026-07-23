import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bell, Shield, Camera, Save, Star, CheckCircle, FileText, TrendingUp, BarChart2, Clock, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import { Button, Toggle } from '../../components/ui/index.jsx'

/* ─── Badge definitions (client mirror of server) ─── */
const BADGE_META = {
  first_complaint:   { label:'🌱 First Step',         desc:'Filed first complaint',         color:'bg-emerald-100 text-emerald-700 border-emerald-200' },
  active_citizen:    { label:'🥇 Active Citizen',     desc:'Reputation 10+',                color:'bg-amber-100 text-amber-700 border-amber-200'      },
  civic_hero:        { label:'🏆 Civic Hero',         desc:'Reputation 50+',                color:'bg-yellow-100 text-yellow-700 border-yellow-200'    },
  community_leader:  { label:'👑 Community Leader',   desc:'Reputation 100+',               color:'bg-purple-100 text-purple-700 border-purple-200'   },
  first_resolve:     { label:'🔧 Problem Solver',     desc:'Resolved first task',           color:'bg-blue-100 text-blue-700 border-blue-200'         },
  swift_officer:     { label:'⚡ Swift Officer',      desc:'Reputation 50+',                color:'bg-cyan-100 text-cyan-700 border-cyan-200'         },
  efficient_officer: { label:'🛠 Efficient Officer',  desc:'Reputation 100+',               color:'bg-indigo-100 text-indigo-700 border-indigo-200'   },
  top_officer:       { label:'🌟 Top Officer',        desc:'Reputation 200+',               color:'bg-violet-100 text-violet-700 border-violet-200'   },
  admin_active:      { label:'📋 Active Admin',       desc:'Managing system',               color:'bg-slate-100 text-slate-700 border-slate-200'      },
  smart_admin:       { label:'🧠 Smart Admin',        desc:'Reputation 50+',                color:'bg-teal-100 text-teal-700 border-teal-200'         },
  city_guardian:     { label:'🛡 City Guardian',      desc:'Reputation 100+',               color:'bg-red-100 text-red-700 border-red-200'            },
}

const ROLE_GRAD = {
  citizen: 'from-auth-3 to-auth-4',
  admin:   'from-dash-1 to-dash-2',
  officer: 'from-dash-2 to-auth-4',
}

/* ─── Reputation progress bar ─── */
function RepBar({ score }) {
  const levels = [
    { label:'Newcomer',  min:0,   max:9   },
    { label:'Active',    min:10,  max:49  },
    { label:'Hero',      min:50,  max:99  },
    { label:'Leader',    min:100, max:199 },
    { label:'Legend',    min:200, max:500 },
  ]
  const current = levels.findLast(l => score >= l.min) || levels[0]
  const next    = levels[levels.indexOf(current) + 1]
  const pct     = next ? Math.round(((score - current.min) / (next.min - current.min)) * 100) : 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-dash-1">{current.label}</span>
        {next && <span className="text-xs text-dash-2">{next.min - score} pts to {next.label}</span>}
      </div>
      <div className="h-3 bg-dash-4 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-auth-3 to-auth-4 rounded-full"
        />
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [tab,     setTab]     = useState('info')
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({ name: user?.name||'', phone: user?.phone||'', area: user?.area||'', bio: user?.bio||'' })
  const [prefs,   setPrefs]   = useState(user?.notificationPrefs || { email:true, push:true, emergency:true, nearby:true })
  const [avatar,  setAvatar]  = useState(null)
  const [preview, setPreview] = useState(null)

  const onAvatar = (e) => {
    const f = e.target.files[0]
    if (f) { setAvatar(f); setPreview(URL.createObjectURL(f)) }
  }

  const save = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      fd.append('notificationPrefs', JSON.stringify(prefs))
      if (avatar) fd.append('avatar', avatar)
      const { data } = await api.put('/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUser(data.user)
      toast.success('Profile saved!')
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }

  const tabs = [
    { id:'info',     label:'Profile',     icon:User   },
    { id:'badges',   label:'Badges',      icon:Award  },
    { id:'notifs',   label:'Alerts',      icon:Bell   },
    { id:'security', label:'Security',    icon:Shield },
  ]

  /* Role-specific stat cards */
  const statCards = user?.role === 'citizen' ? [
    { label:'Complaints Filed', val: user?.complaintCount || 0,  icon: FileText,   color:'bg-blue-50'   },
    { label:'Resolved',         val: user?.resolvedCount  || 0,  icon: CheckCircle,color:'bg-green-50'  },
    { label:'Reputation',       val: user?.reputationScore|| 0,  icon: Star,       color:'bg-amber-50'  },
    { label:'Resolution %',     val: user?.complaintCount ? `${Math.round((user.resolvedCount/user.complaintCount)*100)}%` : '0%', icon:TrendingUp, color:'bg-purple-50' },
  ] : user?.role === 'officer' ? [
    { label:'Tasks Assigned',  val: user?.complaintCount || 0,   icon: FileText,   color:'bg-blue-50'   },
    { label:'Resolved',        val: user?.resolvedCount  || 0,   icon: CheckCircle,color:'bg-green-50'  },
    { label:'Performance Score',val: user?.reputationScore||0,   icon: Star,       color:'bg-amber-50'  },
    { label:'Efficiency',      val: user?.complaintCount ? `${Math.round((user.resolvedCount/user.complaintCount)*100)}%` : '0%', icon:TrendingUp, color:'bg-purple-50' },
  ] : [
    { label:'Complaints Managed',val: '—', icon: FileText,   color:'bg-blue-50'   },
    { label:'Officers Active',   val: '—', icon: User,       color:'bg-green-50'  },
    { label:'Admin Score',       val: user?.reputationScore||0, icon:Star, color:'bg-amber-50' },
    { label:'System Efficiency', val: '—', icon: TrendingUp, color:'bg-purple-50' },
  ]

  const userBadges = user?.badges || []

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Header Card ── */}
      <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
        className={`rounded-3xl p-6 bg-gradient-to-br ${ROLE_GRAD[user?.role]} text-white border-0 shadow-glass-lg`}
      >
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center">
              {(preview || user?.avatar)
                ? <img src={preview || user.avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
              }
            </div>
            <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:scale-110 transition-transform">
              <input type="file" accept="image/*" onChange={onAvatar} className="hidden" />
              <Camera size={13} className="text-dash-1" />
            </label>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{user?.name}</h2>
            <p className="text-white/65 text-sm truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize">{user?.role}</span>
              {user?.department && <span className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full">{user.department}</span>}
              {user?.area && <span className="text-white/55 text-xs">📍 {user.area}</span>}
            </div>
            {/* Top badge */}
            {userBadges.length > 0 && (
              <div className="mt-2">
                {(() => {
                  const top = BADGE_META[userBadges[userBadges.length - 1]]
                  return top ? <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{top.label}</span> : null
                })()}
              </div>
            )}
          </div>

          {/* Reputation */}
          <div className="text-right flex-shrink-0">
            <p className="text-white/55 text-xs mb-1">{user?.role === 'officer' ? 'Performance' : 'Reputation'}</p>
            <p className="text-3xl font-bold text-white">{user?.reputationScore || 0}</p>
            <div className="flex justify-end mt-1.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={12} className={s <= Math.ceil((user?.reputationScore || 0) / 20) ? 'text-yellow-300 fill-yellow-300' : 'text-white/20'} />
              ))}
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/15">
          {statCards.map(({ label, val }) => (
            <div key={label} className="text-center">
              <p className="text-white text-lg font-bold leading-none">{val}</p>
              <p className="text-white/50 text-[10px] mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-white/60 p-1 rounded-2xl border border-dash-3/20 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap px-3 ${tab === id ? 'bg-white shadow-sm text-dash-1' : 'text-dash-2 hover:text-dash-1'}`}
          >
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── INFO TAB ── */}
        {tab === 'info' && (
          <motion.div key="info" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="space-y-4">
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-glass p-6 space-y-4">
              <h3 className="font-bold text-dash-1">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-dash-1 text-xs font-semibold mb-1.5 block">Full Name</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="input text-sm"/></div>
                <div><label className="text-dash-1 text-xs font-semibold mb-1.5 block">Phone</label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="input text-sm" placeholder="9876543210"/></div>
                <div className="col-span-2"><label className="text-dash-1 text-xs font-semibold mb-1.5 block">Area in Gwalior</label><input value={form.area} onChange={e=>setForm(f=>({...f,area:e.target.value}))} className="input text-sm"/></div>
                <div className="col-span-2"><label className="text-dash-1 text-xs font-semibold mb-1.5 block">Bio</label><textarea value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} rows={3} className="input text-sm resize-none" placeholder="Tell us about yourself…"/></div>
              </div>
              <Button onClick={save} loading={saving}><Save size={13}/> Save Changes</Button>
            </div>

            {/* Reputation progress */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-glass p-5">
              <h3 className="font-bold text-dash-1 mb-4 flex items-center gap-2"><TrendingUp size={15} className="text-auth-4"/>Reputation Progress</h3>
              <RepBar score={user?.reputationScore || 0} />
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-dash-2">
                <span>+2 pts: Submit complaint</span>
                <span>+1 pt: Receive upvote</span>
                <span>+10 pts: Complaint resolved</span>
                <span>+5 pts: Submit feedback</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── BADGES TAB ── */}
        {tab === 'badges' && (
          <motion.div key="badges" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-glass p-6"
          >
            <h3 className="font-bold text-dash-1 mb-5 flex items-center gap-2"><Award size={16} className="text-auth-4"/>Your Badges</h3>

            {userBadges.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">🏅</p>
                <p className="text-dash-1 font-semibold">No badges yet</p>
                <p className="text-dash-2 text-sm mt-1">Start filing complaints to earn your first badge!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {userBadges.map((id, i) => {
                  const m = BADGE_META[id]
                  if (!m) return null
                  return (
                    <motion.div key={id} initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.06 }}
                      whileHover={{ scale:1.03 }}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border ${m.color}`}
                    >
                      <span className="text-2xl">{m.label.split(' ')[0]}</span>
                      <div>
                        <p className="font-semibold text-sm">{m.label.split(' ').slice(1).join(' ')}</p>
                        <p className="text-xs opacity-70">{m.desc}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Locked badges (next to earn) */}
            <div>
              <p className="text-dash-2 text-xs font-semibold uppercase tracking-wide mb-3">Next to Unlock</p>
              <div className="space-y-2">
                {Object.entries(BADGE_META)
                  .filter(([id]) => !userBadges.includes(id) && id.includes(user?.role?.substring(0,6) || ''))
                  .slice(0,3)
                  .map(([id, m]) => (
                    <div key={id} className="flex items-center gap-3 p-3 rounded-xl bg-dash-4/60 border border-dash-3/20 opacity-60">
                      <span className="text-xl grayscale">{m.label.split(' ')[0]}</span>
                      <div>
                        <p className="font-semibold text-xs text-dash-1">{m.label.split(' ').slice(1).join(' ')}</p>
                        <p className="text-[10px] text-dash-2">{m.desc}</p>
                      </div>
                      <span className="ml-auto text-[10px] text-dash-2 bg-white px-2 py-0.5 rounded-full">🔒 Locked</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </motion.div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {tab === 'notifs' && (
          <motion.div key="notifs" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-glass p-6 space-y-4"
          >
            <h3 className="font-bold text-dash-1">Notification Preferences</h3>
            <div className="space-y-3">
              {[
                { key:'email',     label:'Email Notifications',  desc:'Receive updates via email',                    critical:false },
                { key:'push',      label:'Push Notifications',   desc:'In-app real-time alerts',                      critical:false },
                { key:'emergency', label:'Emergency Alerts 🚨',  desc:'Critical alerts for emergencies in your area', critical:true  },
                { key:'nearby',    label:'Nearby Activity',      desc:'Updates on complaints near you',               critical:false },
              ].map(({ key, label, desc, critical }) => (
                <div key={key} className={`flex items-center justify-between p-3.5 rounded-xl ${critical ? 'bg-red-50 border border-red-100' : 'bg-dash-4/50'}`}>
                  <div>
                    <p className={`text-sm font-semibold ${critical ? 'text-red-700' : 'text-dash-1'}`}>{label}</p>
                    <p className="text-xs text-dash-2/65 mt-0.5">{desc}</p>
                  </div>
                  <Toggle checked={prefs[key]} onChange={v => setPrefs(p => ({ ...p, [key]: v }))} />
                </div>
              ))}
            </div>
            <Button onClick={save} loading={saving}><Save size={13}/> Save Preferences</Button>
          </motion.div>
        )}

        {/* ── SECURITY TAB ── */}
        {tab === 'security' && (
          <motion.div key="security" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-glass p-6 space-y-4"
          >
            <h3 className="font-bold text-dash-1">Security Settings</h3>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-700 text-sm font-semibold">✅ Your account is secure</p>
              <p className="text-green-600/70 text-xs mt-0.5">Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN') : 'N/A'}</p>
              {user?.isGoogleAuth && <p className="text-blue-600 text-xs mt-1.5">🔵 Signed in via Google OAuth</p>}
            </div>
            <div className="space-y-3">
              <div><label className="text-dash-1 text-xs font-semibold mb-1.5 block">Current Password</label><input type="password" placeholder="Enter current password" className="input text-sm"/></div>
              <div><label className="text-dash-1 text-xs font-semibold mb-1.5 block">New Password</label><input type="password" placeholder="Minimum 8 characters" className="input text-sm"/></div>
              <div><label className="text-dash-1 text-xs font-semibold mb-1.5 block">Confirm New Password</label><input type="password" placeholder="Repeat new password" className="input text-sm"/></div>
            </div>
            <Button><Shield size={13}/> Update Password</Button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

// Fix: Save is from lucide-react but imported above — ensure it's included