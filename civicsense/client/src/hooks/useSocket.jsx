import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { useNotificationStore, useComplaintStore } from '../store/appStore'

let socket = null

export const useSocket = () => {
  const { token } = useAuthStore()
  const { addNotification, addEmergencyAlert } = useNotificationStore()
  const { prependComplaint } = useComplaintStore()
  const init = useRef(false)

  useEffect(() => {
    if (init.current) return
    init.current = true

  socket = io(import.meta.env.VITE_API_URL, {
    auth: { token: token || '' },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
  })
  
    socket.on('connect',    () => console.log('🔌 Socket connected'))
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'))

    socket.emit('join_public')

    socket.on('notification', (notif) => {
      addNotification(notif)
      if (notif.priority === 'emergency') {
        toast.error(`🚨 ${notif.title}: ${notif.message}`, { duration: 8000 })
      } else {
        toast(`🔔 ${notif.message}`, { duration: 4000 })
      }
    })

    socket.on('emergency_alert', (alert) => {
      addEmergencyAlert(alert)
      toast.error(`🚨 EMERGENCY: ${alert.message} — ${alert.area}`, {
        duration: 10000,
        style: { background: '#dc2626', color: '#fff', fontWeight: '700', borderRadius: '12px' },
      })
    })

    socket.on('complaint_feed_update', (c) => prependComplaint(c))

    socket.on('complaint_status_changed', ({ message }) => {
      if (message) toast.success(message, { duration: 5000 })
    })

    return () => {
      if (socket) { socket.disconnect(); socket = null; init.current = false }
    }
  }, [token])

  return socket
}

export const getSocket = () => socket
export default useSocket
