import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNotificationStore } from '../../store/appStore'

export default function NotificationPanel({ onClose }) {
  const { notifications, unreadCount, fetchNotifications, markAllRead } = useNotificationStore()
  useEffect(() => { fetchNotifications() }, [])

  const icon = (p) => p === 'emergency' ? '🚨' : p === 'high' ? '⚠️' : '🔔'

  return (
    <motion.div
      initial={{ opacity:0, y:-8, scale:0.97 }}
      animate={{ opacity:1, y:0,  scale:1 }}
      exit={{   opacity:0, y:-8,  scale:0.97 }}
      transition={{ duration:0.18 }}
      className="absolute top-14 right-0 w-80 bg-white rounded-2xl shadow-glass-lg border border-dash-3/20 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-dash-4">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-dash-1" />
          <span className="font-bold text-dash-1 text-sm">Notifications</span>
          {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[11px] text-auth-4 hover:underline flex items-center gap-1 mr-1">
              <CheckCheck size={11} /> All read
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dash-4 transition-colors"><X size={13} className="text-dash-2" /></button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Bell size={28} className="text-dash-3 mx-auto mb-2" />
            <p className="text-dash-2 text-sm">No notifications yet</p>
          </div>
        ) : notifications.map((n) => (
          <div key={n._id} className={`px-4 py-3 border-b border-dash-4/60 hover:bg-dash-4/40 transition-colors ${!n.isRead ? 'bg-auth-1/20' : ''}`}>
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5 flex-shrink-0">{icon(n.priority)}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs text-dash-1 ${!n.isRead ? 'font-semibold' : 'font-medium'} leading-tight`}>{n.title}</p>
                <p className="text-xs text-dash-2 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-dash-2/50 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
              {!n.isRead && <div className="w-2 h-2 bg-auth-3 rounded-full mt-1 flex-shrink-0" />}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
