import { create } from 'zustand'
import api from '../lib/axios'

export const useNotificationStore = create((set) => ({
  notifications:   [],
  unreadCount:     0,
  emergencyAlerts: [],

  fetchNotifications: async () => {
    try {
      const { data } = await api.get('/notifications?limit=25')
      set({ notifications: data.notifications || [], unreadCount: data.unreadCount || 0 })
    } catch {}
  },

  addNotification: (notif) => set((s) => ({
    notifications: [notif, ...s.notifications].slice(0, 50),
    unreadCount:   s.unreadCount + 1,
  })),

  addEmergencyAlert: (alert) => set((s) => ({
    emergencyAlerts: [alert, ...s.emergencyAlerts].slice(0, 8),
  })),

  markAllRead: async () => {
    try {
      await api.put('/notifications/read')
      set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, isRead: true })), unreadCount: 0 }))
    } catch {}
  },

  clearEmergency: (id) => set((s) => ({
    emergencyAlerts: s.emergencyAlerts.filter((a) => String(a.id || a.complaintId) !== String(id)),
  })),
}))

export const useComplaintStore = create((set) => ({
  complaints:       [],
  publicComplaints: [],
  isLoading:        false,
  pagination:       { page: 1, pages: 1, total: 0 },

  setComplaints:       (complaints, pagination) => set({ complaints, pagination }),
  setPublicComplaints: (publicComplaints)       => set({ publicComplaints }),
  setLoading:          (isLoading)              => set({ isLoading }),
  prependComplaint:    (c) => set((s) => ({ publicComplaints: [c, ...s.publicComplaints].slice(0, 60) })),
}))
