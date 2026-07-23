import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, PlusCircle, Users, BarChart2,
  AlertTriangle, MessageSquare, Bot, User, LogOut,
  ChevronLeft, ChevronRight, Bell, Shield, Briefcase,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { useNotificationStore } from '../../store/appStore'
import NotificationPanel from './NotificationPanel.jsx'

const NAV = {
  citizen: [
    { to:'/citizen',            label:'Dashboard',     icon:LayoutDashboard, end:true },
    { to:'/citizen/raise',      label:'Raise Complaint',icon:PlusCircle },
    { to:'/citizen/complaints', label:'My Complaints',  icon:FileText },
    { to:'/citizen/community',  label:'Community',      icon:MessageSquare },
    { to:'/citizen/profile',    label:'Profile',        icon:User },
  ],
  admin: [
    { to:'/admin',            label:'Dashboard',     icon:LayoutDashboard, end:true },
    { to:'/admin/complaints', label:'All Complaints', icon:FileText },
    { to:'/admin/analytics',  label:'Analytics',     icon:BarChart2 },
    { to:'/admin/emergency',  label:'Emergency Panel',icon:AlertTriangle },
    { to:'/admin/users',      label:'User Management',icon:Users },
    { to:'/admin/community',  label:'Community',     icon:MessageSquare },
    { to:'/admin/profile',    label:'Profile',       icon:User },
  ],
  officer: [
    { to:'/officer',            label:'Dashboard',    icon:LayoutDashboard, end:true },
    { to:'/officer/complaints', label:'My Tasks',     icon:Briefcase },
    { to:'/officer/community',  label:'Community',    icon:MessageSquare },
    { to:'/officer/profile',    label:'Profile',      icon:User },
  ],
}

const ROLE_CONF = {
  citizen: { label:'Citizen Portal',  gradient:'from-auth-4 to-auth-3', Icon:User    },
  admin:   { label:'Admin Control',   gradient:'from-dash-1 to-dash-2', Icon:Shield  },
  officer: { label:'Officer Portal',  gradient:'from-dash-2 to-auth-4', Icon:Briefcase },
}

export default function DashboardLayout({ role }) {
  const [collapsed,   setCollapsed]   = useState(false)
  const [showNotifs,  setShowNotifs]  = useState(false)
  const { user, logout }              = useAuthStore()
  const { unreadCount }               = useNotificationStore()
  const navigate = useNavigate()
  const conf  = ROLE_CONF[role]
  const items = NAV[role] || []

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden bg-dash-4">
      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 252 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-shrink-0 bg-dash-1 flex flex-col relative z-20 shadow-glass-lg overflow-hidden"
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${conf.gradient} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-xs">CS</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }} transition={{ duration:0.15 }}>
                <p className="text-white font-bold text-sm leading-none">CivicSense</p>
                <p className="text-white/50 text-xs mt-0.5">{conf.label}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="whitespace-nowrap">
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="p-3 border-t border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-auth-3 to-auth-4 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                <p className="text-white/40 text-xs truncate">{user?.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-dash-2 hover:bg-dash-3 rounded-full flex items-center justify-center text-white shadow-md z-30 transition-colors"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-dash-3/20 flex items-center justify-between px-6 flex-shrink-0 z-10 relative">
          <div>
            <p className="text-dash-1 font-semibold text-sm">
              Welcome, <span className="text-auth-4">{user?.name?.split(' ')[0]}</span>
            </p>
            <p className="text-dash-2 text-xs">{new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 rounded-xl hover:bg-dash-4 transition-colors">
              <Bell size={18} className="text-dash-1" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-auth-3 to-auth-4 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
          <AnimatePresence>{showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}</AnimatePresence>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div key={location.pathname} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
