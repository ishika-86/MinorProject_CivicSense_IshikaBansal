import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'

/* ─── Stat Card ─── */
export function StatCard({ title, value, icon: Icon, color = 'bg-dash-4', loading }) {
  return (
    <motion.div whileHover={{ y: -3, scale: 1.01 }} className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-dash-2 text-xs font-medium uppercase tracking-wide">{title}</p>
          {loading
            ? <div className="skeleton h-8 w-20 mt-2" />
            : <p className="text-dash-1 text-2xl font-bold mt-1">{typeof value === 'number' ? value.toLocaleString() : value ?? '—'}</p>
          }
        </div>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className="text-dash-1" />
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Status Badge ─── */
export function StatusBadge({ status }) {
  const map = {
    pending:      'bg-amber-100 text-amber-700',
    assigned:     'bg-blue-100 text-blue-700',
    'in-progress':'bg-purple-100 text-purple-700',
    resolved:     'bg-green-100 text-green-700',
    rejected:     'bg-red-100 text-red-700',
    escalated:    'bg-orange-100 text-orange-700',
    reopened:     'bg-cyan-100 text-cyan-700',
  }
  return <span className={`badge ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status?.replace('-', ' ') || '—'}</span>
}

/* ─── Priority Badge ─── */
export function PriorityBadge({ priority }) {
  const map   = { emergency:'bg-red-100 text-red-700', high:'bg-orange-100 text-orange-700', medium:'bg-yellow-100 text-yellow-700', low:'bg-green-100 text-green-700' }
  const icons = { emergency:'🚨', high:'🔴', medium:'🟡', low:'🟢' }
  return <span className={`badge ${map[priority] || 'bg-gray-100 text-gray-600'}`}>{icons[priority]} {priority || '—'}</span>
}

/* ─── Skeleton ─── */
export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-5/6" />
    </div>
  )
}

/* ─── Button ─── */
export function Button({ children, loading, variant = 'primary', className = '', onClick, disabled, type = 'button' }) {
  const variants = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    danger:    'btn-danger',
    ghost:     'px-4 py-2 rounded-xl text-dash-2 hover:bg-dash-3/30 transition-colors font-medium text-sm',
  }
  return (
    <motion.button
      type={type} whileTap={{ scale: 0.97 }} onClick={onClick}
      className={`${variants[variant]} flex items-center gap-2 text-sm ${className}`}
      disabled={disabled || loading}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </motion.button>
  )
}

/* ─── Modal ─── */
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null
  const sizes = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0 }}
        exit={{   opacity: 0, scale: 0.93,  y: 16 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className={`relative w-full ${sizes[size]} bg-white rounded-2xl shadow-glass-lg border border-dash-3/20 overflow-hidden`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-dash-4">
            <h3 className="font-bold text-dash-1">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-dash-4 transition-colors"><X size={16} className="text-dash-2" /></button>
          </div>
        )}
        <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
      </motion.div>
    </div>
  )
}

/* ─── Empty State ─── */
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-3">{icon}</span>
      <h3 className="text-dash-1 font-semibold text-lg mb-1">{title}</h3>
      <p className="text-dash-2 text-sm mb-4 max-w-xs">{description}</p>
      {action}
    </div>
  )
}

/* ─── Search Input ─── */
export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-2 text-sm">🔍</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input pl-9" />
    </div>
  )
}

/* ─── Toggle Switch ─── */
export function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-auth-4' : 'bg-dash-3/50'}`}
    >
      <motion.div
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
      />
    </button>
  )
}
