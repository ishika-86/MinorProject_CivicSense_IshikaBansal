import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, AlertTriangle, MapPin } from 'lucide-react'
import { useNotificationStore } from '../../store/appStore'
import { formatDistanceToNow } from 'date-fns'

const ICONS = { FIRE:'🔥', ACCIDENT:'🚗', ANIMAL_ATTACK:'🐕', DANGEROUS_ANIMAL:'🦴', ELECTRIC_HAZARD:'⚡', PUBLIC_SAFETY:'🚨' }

export default function EmergencyOverlay() {
  const { emergencyAlerts, clearEmergency } = useNotificationStore()

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {emergencyAlerts.slice(0, 3).map((alert) => {
          const key = alert.id || alert.complaintId || Math.random()
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: 80, scale: 0.92 }}
              animate={{ opacity: 1, x: 0,  scale: 1 }}
              exit={{   opacity: 0, x: 80,  scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="pointer-events-auto"
            >
              <div className="bg-red-600 text-white rounded-2xl overflow-hidden shadow-emergency">
                <div className="h-1 bg-gradient-to-r from-yellow-400 via-red-400 to-orange-400 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0 animate-pulse-slow">
                        {ICONS[alert.triggerType] || '🚨'}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-200">Emergency Alert</p>
                        <p className="font-bold text-sm leading-tight">{alert.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => clearEmergency(key)}
                      className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-sm mt-2 text-red-100 leading-snug">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-red-200">
                    <span className="flex items-center gap-1"><MapPin size={11} />{alert.area}</span>
                    <span>{alert.timestamp ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true }) : 'Just now'}</span>
                  </div>
                  {alert.authorities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {alert.authorities.map((a) => (
                        <span key={a} className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
