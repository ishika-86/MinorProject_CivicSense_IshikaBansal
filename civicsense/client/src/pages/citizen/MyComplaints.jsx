import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlusCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import { StatusBadge, PriorityBadge, SkeletonCard, EmptyState, Button, SearchInput } from '../../components/ui/index.jsx'

export default function MyComplaints() {
  const [complaints,  setComplaints]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [statusF,     setStatusF]     = useState('')
  const [pagination,  setPagination]  = useState({ page:1, pages:1, total:0 })

  const fetchComplaints = async (page = 1) => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page, limit: 10 })
      if (statusF) p.append('status', statusF)
      if (search)  p.append('search', search)
      const { data } = await api.get(`/complaints/my/list?${p}`)
      setComplaints(data.complaints || [])
      setPagination(data.pagination || { page:1, pages:1, total:0 })
    } catch {
      toast.error('Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchComplaints() }, [search, statusF])

  const STATUSES = ['', 'pending', 'assigned', 'in-progress', 'resolved', 'rejected']

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-dash-1 text-2xl font-bold">My Complaints</h1>
          <p className="text-dash-2 text-sm mt-0.5">{pagination.total} complaint(s) filed</p>
        </div>
        <Link to="/citizen/raise">
          <Button><PlusCircle size={14} /> New Complaint</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white/75 backdrop-blur-sm border border-white/60 shadow-glass p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-44">
          <SearchInput value={search} onChange={setSearch} placeholder="Search complaints…" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusF(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                statusF === s ? 'bg-dash-1 text-white' : 'bg-dash-4 text-dash-2 hover:bg-dash-3/40'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : complaints.length === 0
            ? (
              <EmptyState
                icon="📋"
                title="No complaints found"
                description={statusF ? `No ${statusF} complaints. Try a different filter.` : "You haven't filed any complaints yet."}
                action={
                  !statusF && (
                    <Link to="/citizen/raise">
                      <Button><PlusCircle size={14} /> File First Complaint</Button>
                    </Link>
                  )
                }
              />
            )
            : complaints.map((c, i) => (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ x: 3 }}
              >
                <Link to={`/citizen/complaints/${c._id}`}>
                  <div className="rounded-2xl bg-white/75 backdrop-blur-sm border border-white/60 shadow-glass p-4 hover:shadow-md transition-all group cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
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
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-dash-2/50">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                          </span>
                          {c.assignedTo && (
                            <span>👷 {c.assignedTo.name}</span>
                          )}
                          <span>👍 {c.upvoteCount || 0}</span>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    {/* Timeline dots */}
                    {c.timeline?.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-dash-4/50">
                        {c.timeline.slice(-4).map((t, ti) => (
                          <div key={ti} className="flex items-center gap-1">
                            {ti > 0 && <div className="w-4 h-px bg-dash-3/30" />}
                            <div className="w-2 h-2 rounded-full bg-auth-3" />
                            <span className="text-[9px] text-dash-2/50 capitalize hidden sm:inline">{t.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))
        }
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => fetchComplaints(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                p === pagination.page ? 'bg-dash-1 text-white' : 'bg-dash-4 text-dash-2 hover:bg-dash-3/40'
              }`}
            >{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
