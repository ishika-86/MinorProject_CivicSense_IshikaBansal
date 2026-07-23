import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FileText, Users, AlertTriangle, CheckCircle, Clock, TrendingUp, BarChart2, Zap, UserCheck, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import { StatCard, StatusBadge, PriorityBadge, SkeletonCard, Modal, Button, EmptyState, SearchInput } from '../../components/ui/index.jsx'

const COLORS = ['#19183B','#708993','#A1C2BD','#4A628A','#7AB2D3','#B9E5E8','#DFF2EB','#355872']

/* ══════════ ADMIN DASHBOARD ══════════ */
export function AdminDashboard() {
  const [stats,     setStats]     = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading,   setLoading]   = useState(true)

  const load = async () => {
    try {
      const [s,a] = await Promise.all([api.get('/admin/stats'),api.get('/admin/analytics')])
      setStats(s.data); setAnalytics(a.data)
    } catch {} finally { setLoading(false) }
  }
  useEffect(()=>{ load(); const iv=setInterval(load,30000); return()=>clearInterval(iv) },[])

  const s=stats?.stats||{}, u=stats?.users||{}
  const cards=[
    {title:'Total',       value:s.total,     icon:FileText,     color:'bg-dash-4'},
    {title:'Pending',     value:s.pending,   icon:Clock,        color:'bg-amber-50'},
    {title:'Resolved',    value:s.resolved,  icon:CheckCircle,  color:'bg-green-50'},
    {title:'Emergencies', value:s.emergency, icon:AlertTriangle,color:'bg-red-50'},
    {title:'Citizens',    value:u.citizens,  icon:Users,        color:'bg-blue-50'},
    {title:'Officers',    value:u.officers,  icon:TrendingUp,   color:'bg-purple-50'},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-display text-dash-1 text-2xl font-bold">Admin Dashboard</h1><p className="text-dash-2 text-sm">Real-time overview — Gwalior</p></div>
        <button onClick={load} className="btn-secondary text-sm">⟳ Refresh</button>
      </div>

      {(s.emergency||0)>0 && (
        <motion.div animate={{opacity:[1,0.85,1]}} transition={{repeat:Infinity,duration:1.5}}
          className="bg-red-500 text-white rounded-2xl p-4 flex items-center justify-between shadow-emergency"
        >
          <div className="flex items-center gap-3"><AlertTriangle size={20}/><div><p className="font-bold">🚨 {s.emergency} Active Emergency</p><p className="text-sm opacity-85">Immediate action required</p></div></div>
          <a href="/admin/emergency" className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">View →</a>
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c,i)=>(
          <motion.div key={c.title} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
            <StatCard {...c} loading={loading}/>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 card p-5">
          <h3 className="font-bold text-dash-1 mb-4">Complaint Trend (30 days)</h3>
          {loading?<div className="skeleton h-40"/>:(
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={analytics?.trendData||[]}>
                <XAxis dataKey="_id" tick={{fontSize:10}} tickFormatter={d=>d?.slice(5)}/>
                <YAxis tick={{fontSize:10}}/><Tooltip/>
                <Line type="monotone" dataKey="count" stroke="#19183B" strokeWidth={2.5} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-dash-1 mb-4">By Category</h3>
          {loading?<div className="skeleton h-40"/>:(
            <ResponsiveContainer width="100%" height={160}>
              <PieChart><Pie data={analytics?.categoryData?.slice(0,6)||[]} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={62}>
                {(analytics?.categoryData?.slice(0,6)||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie><Tooltip/></PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4"><Zap size={15} className="text-auth-4"/><h3 className="font-bold text-dash-1">AI Insights</h3></div>
          {loading?<div className="space-y-2">{Array(3).fill(0).map((_,i)=><div key={i} className="skeleton h-10"/>)}</div>:(
            <div className="space-y-2">
              <div className="bg-dash-4 rounded-xl p-3"><p className="text-xs text-dash-2 font-medium">Most Affected Area</p><p className="text-dash-1 font-bold">{analytics?.insights?.mostAffectedArea}</p></div>
              <div className="bg-dash-4 rounded-xl p-3"><p className="text-xs text-dash-2 font-medium">Avg Resolution</p><p className="text-dash-1 font-bold">{analytics?.insights?.avgResolutionHours}h</p></div>
              {analytics?.insights?.suggestions?.map((s,i)=><p key={i} className="text-xs text-dash-2 bg-dash-4 rounded-xl p-2.5">💡 {s}</p>)}
            </div>
          )}
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4"><div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"/><h3 className="font-bold text-dash-1">Recent Emergencies</h3></div>
          <div className="space-y-2">
            {!stats?.recentEmergencies?.length?<p className="text-dash-2 text-sm text-center py-6">No active emergencies 🎉</p>
              :stats?.recentEmergencies?.map(log=>(
              <div key={log._id} className="flex items-center gap-3 bg-red-50 rounded-xl p-3 border border-red-100">
                <AlertTriangle size={13} className="text-red-500 flex-shrink-0"/>
                <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-dash-1 truncate">{log.complaint?.title}</p><p className="text-xs text-dash-2/60">{log.category} · {log.complaint?.area}</p></div>
                <span className="text-xs text-red-600 font-mono">{log.complaint?.complaintNumber}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════ ADMIN COMPLAINTS ══════════ */
export function AdminComplaints() {
  const [complaints, setComplaints] = useState([])
  const [officers,   setOfficers]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [pagination, setPagination] = useState({page:1,pages:1,total:0})
  const [filters,    setFilters]    = useState({status:'',priority:'',category:'',search:''})
  const [selected,   setSelected]   = useState([])
  const [assignC,    setAssignC]    = useState(null)
  const [officerId,  setOfficerId]  = useState('')
  const [notes,      setNotes]      = useState('')
  const [assigning,  setAssigning]  = useState(false)

  const load = useCallback(async (page=1) => {
    setLoading(true)
    try {
      const p=new URLSearchParams({page,limit:15})
      Object.entries(filters).forEach(([k,v])=>{ if(v) p.append(k,v) })
      const {data}=await api.get(`/admin/complaints?${p}`)
      setComplaints(data.complaints); setPagination(data.pagination)
    } catch { toast.error('Failed') } finally { setLoading(false) }
  },[filters])

  useEffect(()=>{ load() },[filters])
  useEffect(()=>{ api.get('/admin/users?role=officer&status=active&limit=100').then(r=>setOfficers(r.data.users||[])).catch(()=>{}) },[])

  const assign = async () => {
    if(!officerId) return toast.error('Select officer')
    setAssigning(true)
    try { await api.put(`/admin/complaints/${assignC._id}/assign`,{officerId,notes}); toast.success('Assigned!'); setAssignC(null); setOfficerId(''); load(pagination.page) }
    catch(e){toast.error(e.response?.data?.message||'Failed')} finally{setAssigning(false)}
  }

  const bulk = async (action) => {
    if(!selected.length) return toast.error('Select complaints')
    await api.post('/admin/complaints/bulk',{ids:selected,action}); toast.success(`${selected.length} updated`); setSelected([]); load(pagination.page)
  }

  const toggleAll = () => setSelected(s=>s.length===complaints.length?[]:complaints.map(c=>c._id))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-display text-dash-1 text-2xl font-bold">All Complaints</h1><p className="text-dash-2 text-sm">{pagination.total} total</p></div>
        {selected.length>0&&<div className="flex gap-2"><Button variant="secondary" onClick={()=>bulk('escalate')}>⬆ Escalate ({selected.length})</Button><Button variant="danger" onClick={()=>bulk('close')}>✓ Close ({selected.length})</Button></div>}
      </div>

      <div className="card p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <SearchInput value={filters.search} onChange={v=>setFilters(f=>({...f,search:v}))} placeholder="Search…"/>
        <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))} className="input text-sm"><option value="">All Statuses</option>{['pending','assigned','in-progress','resolved','rejected','escalated'].map(s=><option key={s} value={s}>{s}</option>)}</select>
        <select value={filters.priority} onChange={e=>setFilters(f=>({...f,priority:e.target.value}))} className="input text-sm"><option value="">All Priorities</option>{['emergency','high','medium','low'].map(p=><option key={p} value={p}>{p}</option>)}</select>
        <select value={filters.category} onChange={e=>setFilters(f=>({...f,category:e.target.value}))} className="input text-sm"><option value="">All Categories</option>{['Road Damage','Water Supply','Fire Hazard','Accident','Animal Attack','Electric Hazard','Public Safety','Other'].map(c=><option key={c} value={c}>{c}</option>)}</select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dash-4/60 border-b border-dash-3/20">
              <tr><th className="p-3 w-10"><input type="checkbox" checked={selected.length===complaints.length&&complaints.length>0} onChange={toggleAll} className="accent-auth-4"/></th>{['Complaint','Category','Area','Priority','Status','Filed','Officer','Action'].map(h=><th key={h} className="p-3 text-left text-xs text-dash-2 font-semibold uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-dash-4/60">
              {loading?Array(8).fill(0).map((_,i)=><tr key={i}><td colSpan={9} className="p-2"><div className="skeleton h-10"/></td></tr>)
                :complaints.length===0?<tr><td colSpan={9} className="py-16"><EmptyState icon="📋" title="No complaints" description="Try different filters."/></td></tr>
                :complaints.map((c,i)=>(
                <motion.tr key={c._id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                  className={`hover:bg-dash-4/30 transition-colors ${c.priority==='emergency'?'bg-red-50/40':''}`}
                >
                  <td className="p-3"><input type="checkbox" checked={selected.includes(c._id)} onChange={()=>setSelected(s=>s.includes(c._id)?s.filter(x=>x!==c._id):[...s,c._id])} className="accent-auth-4"/></td>
                  <td className="p-3 max-w-[180px]"><p className="font-semibold text-dash-1 text-xs truncate">{c.title}</p><p className="text-dash-2/60 text-xs font-mono">{c.complaintNumber}</p></td>
                  <td className="p-3 text-xs text-dash-2">{c.category}</td>
                  <td className="p-3 text-xs text-dash-2">{c.area}</td>
                  <td className="p-3"><PriorityBadge priority={c.priority}/></td>
                  <td className="p-3"><StatusBadge status={c.status}/></td>
                  <td className="p-3 text-xs text-dash-2/60">{formatDistanceToNow(new Date(c.createdAt),{addSuffix:true})}</td>
                  <td className="p-3 text-xs text-dash-2">{c.assignedTo?.name||'—'}</td>
                  <td className="p-3"><button onClick={()=>setAssignC(c)} className="px-2.5 py-1.5 bg-auth-1 text-auth-4 rounded-lg text-xs font-semibold hover:bg-auth-2 transition-colors flex items-center gap-1"><UserCheck size={11}/>Assign</button></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.pages>1&&<div className="flex items-center justify-between px-4 py-3 border-t border-dash-4/50">
          <p className="text-xs text-dash-2">Page {pagination.page} of {pagination.pages}</p>
          <div className="flex gap-1">{[<button key="prev" onClick={()=>load(pagination.page-1)} disabled={pagination.page<=1} className="p-1.5 rounded-lg hover:bg-dash-4 disabled:opacity-40"><ChevronLeft size={15} className="text-dash-1"/></button>,<button key="next" onClick={()=>load(pagination.page+1)} disabled={pagination.page>=pagination.pages} className="p-1.5 rounded-lg hover:bg-dash-4 disabled:opacity-40"><ChevronRight size={15} className="text-dash-1"/></button>]}</div>
        </div>}
      </div>

      <Modal isOpen={!!assignC} onClose={()=>setAssignC(null)} title={`Assign: ${assignC?.complaintNumber}`}>
        <div className="space-y-4">
          <div><label className="text-dash-1 text-sm font-semibold mb-1 block">Select Officer</label>
            <select value={officerId} onChange={e=>setOfficerId(e.target.value)} className="input">
              <option value="">Choose officer…</option>{officers.map(o=><option key={o._id} value={o._id}>{o.name} — {o.department||'General'}</option>)}
            </select></div>
          <div><label className="text-dash-1 text-sm font-semibold mb-1 block">Notes</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} className="input resize-none" placeholder="Instructions…"/></div>
          <div className="flex gap-3"><Button onClick={assign} loading={assigning}>Assign</Button><Button variant="ghost" onClick={()=>setAssignC(null)}>Cancel</Button></div>
        </div>
      </Modal>
    </div>
  )
}

/* ══════════ ADMIN ANALYTICS ══════════ */
export function AdminAnalytics() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [period,  setPeriod]  = useState('30')

  useEffect(()=>{ setLoading(true); api.get(`/admin/analytics?period=${period}`).then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false)) },[period])

  const exportCSV = () => {
    const rows=[['Category','Count'],...(data?.categoryData||[]).map(d=>[d._id,d.count])]
    const a=document.createElement('a'); a.href='data:text/csv,'+encodeURIComponent(rows.map(r=>r.join(',')).join('\n')); a.download='analytics.csv'; a.click(); toast.success('Exported!')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-display text-dash-1 text-2xl font-bold">Analytics</h1><p className="text-dash-2 text-sm">Trends & department insights</p></div>
        <div className="flex gap-2"><select value={period} onChange={e=>setPeriod(e.target.value)} className="input text-sm w-36"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><Button variant="secondary" onClick={exportCSV}><Download size={13}/>CSV</Button></div>
      </div>

      <div className="card p-5"><h3 className="font-bold text-dash-1 mb-4">Daily Volume</h3>{loading?<div className="skeleton h-48"/>:(
        <ResponsiveContainer width="100%" height={200}><LineChart data={data?.trendData||[]}><XAxis dataKey="_id" tick={{fontSize:10}} tickFormatter={d=>d?.slice(5)}/><YAxis tick={{fontSize:10}}/><Tooltip/><Line type="monotone" dataKey="count" stroke="#19183B" strokeWidth={2.5} dot={{r:3,fill:'#19183B'}}/></LineChart></ResponsiveContainer>
      )}</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5"><h3 className="font-bold text-dash-1 mb-4">Category Split</h3>{loading?<div className="skeleton h-52"/>:(
          <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={data?.categoryData?.slice(0,8)||[]} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({_id,percent})=>`${(_id||'').split(' ')[0]} ${(percent*100).toFixed(0)}%`}>{(data?.categoryData?.slice(0,8)||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
        )}</div>
        <div className="card p-5"><h3 className="font-bold text-dash-1 mb-4">Status Breakdown</h3>{loading?<div className="skeleton h-52"/>:(
          <ResponsiveContainer width="100%" height={220}><BarChart data={data?.statusData||[]}><XAxis dataKey="_id" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Bar dataKey="count" radius={[6,6,0,0]}>{(data?.statusData||[]).map((s,i)=>{const c={pending:'#f59e0b',resolved:'#10b981','in-progress':'#8b5cf6',assigned:'#3b82f6',rejected:'#ef4444'};return<Cell key={i} fill={c[s._id]||'#708993'}/>})}</Bar></BarChart></ResponsiveContainer>
        )}</div>
      </div>

      <div className="card p-5 bg-gradient-to-br from-dash-1 to-dash-2 text-white">
        <div className="flex items-center gap-2 mb-4"><Zap size={16} className="text-yellow-400"/><h3 className="font-bold">AI Insights</h3></div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/10 rounded-xl p-3"><p className="text-white/60 text-xs">Most Affected</p><p className="text-xl font-bold">{data?.insights?.mostAffectedArea||'N/A'}</p></div>
          <div className="bg-white/10 rounded-xl p-3"><p className="text-white/60 text-xs">Avg Resolution</p><p className="text-xl font-bold">{data?.insights?.avgResolutionHours||0}h</p></div>
          <div className="bg-white/10 rounded-xl p-3"><p className="text-white/60 text-xs">Top Issue</p><p className="text-xl font-bold truncate">{data?.insights?.topCategory||'N/A'}</p></div>
        </div>
        {data?.insights?.suggestions?.map((s,i)=><div key={i} className="bg-white/10 rounded-xl px-3 py-2 text-sm mb-2">💡 {s}</div>)}
      </div>
    </div>
  )
}

/* ══════════ ADMIN USERS ══════════ */
export function AdminUsers() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [roleF,   setRoleF]   = useState('')
  const [search,  setSearch]  = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const p=new URLSearchParams({limit:50}); if(roleF)p.append('role',roleF); if(search)p.append('search',search)
      const {data}=await api.get(`/admin/users?${p}`); setUsers(data.users||[])
    } catch{} finally{setLoading(false)}
  }
  useEffect(()=>{load()},[roleF,search])

  const update = async (id, body) => {
    await api.put(`/admin/users/${id}`,body); toast.success('Updated'); load()
  }

  const rc={citizen:'bg-blue-100 text-blue-700',admin:'bg-purple-100 text-purple-700',officer:'bg-green-100 text-green-700'}
  const sc={active:'bg-green-100 text-green-700',pending:'bg-amber-100 text-amber-700',blocked:'bg-red-100 text-red-700'}

  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-dash-1 text-2xl font-bold">User Management</h1><p className="text-dash-2 text-sm">{users.length} users</p></div>
      <div className="card p-4 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-40"><SearchInput value={search} onChange={setSearch} placeholder="Search users…"/></div>
        {['','citizen','admin','officer'].map(r=><button key={r} onClick={()=>setRoleF(r)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${roleF===r?'bg-dash-1 text-white':'bg-dash-4 text-dash-2'}`}>{r||'All'}</button>)}
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-dash-4/60 border-b border-dash-3/20"><tr>{['User','Role','Area','Status','Rep','Joined','Action'].map(h=><th key={h} className="p-3 text-left text-xs text-dash-2 font-semibold uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-dash-4/60">
            {loading?Array(6).fill(0).map((_,i)=><tr key={i}><td colSpan={7} className="p-2"><div className="skeleton h-10"/></td></tr>)
              :users.map((u,i)=>(
              <motion.tr key={u._id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}} className="hover:bg-dash-4/30">
                <td className="p-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gradient-to-br from-auth-3 to-auth-4 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.name?.charAt(0).toUpperCase()}</div><div><p className="font-semibold text-dash-1 text-xs">{u.name}</p><p className="text-dash-2/60 text-xs">{u.email}</p></div></div></td>
                <td className="p-3"><span className={`badge ${rc[u.role]}`}>{u.role}</span></td>
                <td className="p-3 text-xs text-dash-2">{u.area||'—'}</td>
                <td className="p-3"><span className={`badge ${sc[u.status]}`}>{u.status}</span></td>
                <td className="p-3 text-xs font-semibold text-dash-1">{u.reputationScore}</td>
                <td className="p-3 text-xs text-dash-2/60">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="p-3">{u.status!=='blocked'?<button onClick={()=>update(u._id,{status:'blocked'})} className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">Block</button>:<button onClick={()=>update(u._id,{status:'active'})} className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">Unblock</button>}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════ ADMIN EMERGENCY ══════════ */
export function AdminEmergency() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => { setLoading(true); try{ const {data}=await api.get('/admin/emergency-logs'); setLogs(data.logs||[]) }catch{} finally{setLoading(false)} }
  useEffect(()=>{ load(); const iv=setInterval(load,15000); return()=>clearInterval(iv) },[])

  const resolve = async (id) => { await api.put(`/emergency/${id}/resolve`); toast.success('Resolved'); load() }

  const ICONS = { Accident:'🚗', 'Fire Hazard':'🔥', 'Animal Attack':'🐕', 'Dangerous Animal':'🦴', 'Electric Hazard':'⚡', 'Public Safety':'🚨' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-display text-dash-1 text-2xl font-bold">Emergency Panel</h1><div className="flex items-center gap-2 mt-0.5"><div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"/><p className="text-dash-2 text-sm">Live · Auto-refresh every 15s</p></div></div>
        <button onClick={load} className="btn-secondary text-sm">⟳ Refresh</button>
      </div>
      {loading?<div className="space-y-3">{Array(3).fill(0).map((_,i)=><div key={i} className="skeleton h-28 rounded-2xl"/>)}</div>
        :logs.length===0?<div className="card p-16 text-center"><p className="text-5xl mb-3">✅</p><p className="text-dash-1 font-bold text-lg">All Clear</p><p className="text-dash-2 text-sm">No active emergencies in Gwalior.</p></div>
        :logs.map((log,i)=>(
        <motion.div key={log._id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
          className={`rounded-2xl border-2 overflow-hidden ${log.isResolved?'border-green-200 bg-green-50':'border-red-300 bg-red-50 shadow-emergency'}`}
        >
          {!log.isResolved&&<div className="h-1.5 bg-gradient-to-r from-red-500 via-orange-400 to-red-500 animate-shimmer" style={{backgroundSize:'200% 100%'}}/>}
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{ICONS[log.category]||'🚨'}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap"><span className={`badge font-bold ${log.isResolved?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{log.isResolved?'✓ Resolved':'🔴 ACTIVE'}</span><span className="badge bg-orange-100 text-orange-700">{log.category}</span></div>
                  <p className="text-dash-1 font-bold mt-1">{log.message}</p>
                  <p className="text-dash-2 text-sm mt-0.5">{log.area} · {log.complaint?.complaintNumber}</p>
                  <p className="text-dash-2/60 text-xs mt-1">{formatDistanceToNow(new Date(log.createdAt),{addSuffix:true})}</p>
                </div>
              </div>
              {!log.isResolved&&<button onClick={()=>resolve(log._id)} className="flex-shrink-0 px-3 py-1.5 bg-green-500 text-white rounded-xl text-xs font-semibold hover:bg-green-600 transition-colors">Mark Resolved</button>}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {log.notifiedAuthorities?.map(a=><span key={a} className="badge bg-white/60 text-dash-2">{a}</span>)}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default AdminDashboard
