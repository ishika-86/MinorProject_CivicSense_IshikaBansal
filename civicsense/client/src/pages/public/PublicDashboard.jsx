import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, FileText, AlertTriangle } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../lib/axios'
import ComplaintMap from '../../components/maps/ComplaintMap.jsx'

const COLORS = ['#355872','#7AAACE','#9CD5FF','#4A628A','#7AB2D3','#A1C2BD','#B9E5E8','#708993']

export default function PublicDashboard() {
  const [data,   setData]   = useState(null)
  const [emg,    setEmg]    = useState([])
  const [loading,setLoading]= useState(true)

  useEffect(() => {
    Promise.all([api.get('/analytics/public'), api.get('/emergency/feed')])
      .then(([a, e]) => { setData(a.data); setEmg(e.data.logs || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = data?.stats || {}
  const tiles = [
    { label:'Total Complaints', value: stats.total,     icon:'📋', bg:'#355872' },
    { label:'Resolved',         value: stats.resolved,  icon:'✅', bg:'#22c55e' },
    { label:'Pending',          value: stats.pending,   icon:'⏳', bg:'#f59e0b' },
    { label:'Emergencies',      value: stats.emergency, icon:'🚨', bg:'#ef4444' },
  ]

  return (
    <div className="min-h-screen" style={{ background:'linear-gradient(160deg,#355872 0%,#7AAACE 45%,#F7F8F0 100%)' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/15" style={{ background:'rgba(247,248,240,0.75)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-pub-1 rounded-xl flex items-center justify-center shadow">
              <span className="text-white font-bold text-sm">CS</span>
            </div>
            <span className="font-display text-pub-1 font-bold text-lg">CivicSense<span className="text-pub-2 font-normal">.city</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"    className="text-pub-1 text-sm font-medium hover:text-pub-2 transition-colors">Sign In</Link>
            <Link to="/register" className="bg-pub-1 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-pub-1/90 transition-all shadow">Register</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-14 text-center">
        <motion.div initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}>
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-white/25">
            🏙️ Gwalior's Smart Civic Platform
          </span>
          <h1 className="font-display text-white text-5xl md:text-6xl font-bold leading-tight mb-4">
            Your Voice.<br /><span className="text-pub-3">Real Action.</span>
          </h1>
          <p className="text-white/75 text-lg max-w-xl mx-auto mb-8">
            Report civic issues, track resolutions in real time, and help build a smarter Gwalior.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register"
              className="bg-white text-pub-1 px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-pub-3 transition-all shadow-lg"
            >Get Started Free</Link>
            <a href="#map" className="flex items-center gap-2 text-white border border-white/25 px-6 py-3.5 rounded-2xl text-sm font-medium hover:bg-white/10 transition-all">
              View Live Map <ArrowRight size={15} />
            </a>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tiles.map((t, i) => (
            <motion.div key={t.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.09 }}
              className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20 text-center"
            >
              <p className="text-3xl mb-1">{t.icon}</p>
              <p className="text-2xl font-bold text-white">{loading ? '…' : (t.value ?? 0).toLocaleString()}</p>
              <p className="text-white/60 text-xs mt-0.5">{t.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Emergency Feed */}
      {emg.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-10">
          <div className="bg-red-500/12 border border-red-400/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <h3 className="font-bold text-red-700 text-sm">🚨 Active Emergency Alerts</h3>
            </div>
            <div className="space-y-2">
              {emg.slice(0, 3).map((log) => (
                <div key={log._id} className="flex items-center gap-3 bg-red-50 rounded-xl p-3">
                  <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-red-800 font-semibold text-sm truncate">{log.message}</p>
                    <p className="text-red-600/65 text-xs">{log.area} · {log.complaint?.complaintNumber}</p>
                  </div>
                  <span className="badge bg-red-100 text-red-700 text-xs">{log.category}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Map */}
      <section id="map" className="max-w-7xl mx-auto px-6 pb-12">
        <div className="mb-4">
          <h2 className="font-display text-white text-2xl font-bold">Live Complaint Map</h2>
          <p className="text-white/60 text-sm">Real-time civic issues across Gwalior</p>
        </div>
        <div className="relative rounded-3xl overflow-hidden h-96 shadow-glass-lg border border-white/20">
          <ComplaintMap height="100%" />
        </div>
      </section>

      {/* Charts */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
            <h3 className="font-bold text-pub-1 mb-4">Issues by Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data?.categoryData || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={75}
                  label={({ _id, percent }) => `${(_id||'').split(' ')[0]} ${(percent*100).toFixed(0)}%`}
                >
                  {(data?.categoryData || []).map((_, i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
            <h3 className="font-bold text-pub-1 mb-4">Top Affected Areas</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.areaData?.slice(0,6) || []} layout="vertical">
                <XAxis type="number" tick={{ fontSize:11 }} />
                <YAxis dataKey="_id" type="category" tick={{ fontSize:11 }} width={72} />
                <Tooltip />
                <Bar dataKey="count" fill="#7AAACE" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Recent Complaints */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <h2 className="font-display text-white text-2xl font-bold mb-5">Recent Complaints</h2>
        <div className="space-y-3">
          {loading
            ? Array(4).fill(0).map((_,i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
            : (data?.recentComplaints || []).map((c) => (
              <div key={c._id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/40 flex items-center gap-4">
                <div className="w-10 h-10 bg-pub-3/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-pub-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-pub-1 font-semibold text-sm truncate">{c.title}</p>
                  <p className="text-pub-1/55 text-xs mt-0.5">{c.category} · {c.area} · {c.complaintNumber}</p>
                </div>
                <span className={`badge text-xs ${c.status==='resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {c.status}
                </span>
              </div>
            ))
          }
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 text-center border border-white/40">
          <h2 className="font-display text-pub-1 text-3xl font-bold mb-3">Ready to make a difference?</h2>
          <p className="text-pub-1/60 text-sm mb-6 max-w-sm mx-auto">Join Gwalior's growing civic community and help build a better city.</p>
          <Link to="/register" className="inline-block bg-pub-1 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-pub-1/90 transition-all shadow-lg">
            Register Free — Get Started
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/15 py-6 text-center text-white/40 text-sm">
        © 2024 CivicSense.city — Smart Civic Platform for Gwalior, Madhya Pradesh
      </footer>
    </div>
  )
}
