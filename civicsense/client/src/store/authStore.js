import { create } from 'zustand'
import api from '../lib/axios'

const useAuthStore = create((set, get) => ({
  user:      JSON.parse(localStorage.getItem('cs_user') || 'null'),
  token:     localStorage.getItem('cs_token') || null,
  isLoading: false,
  error:     null,

  setUser: (user, token) => {
    localStorage.setItem('cs_user', JSON.stringify(user))
    if (token) localStorage.setItem('cs_token', token)
    set({ user, token: token || get().token })
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('cs_token', data.token)
      localStorage.setItem('cs_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, isLoading: false })
      return data
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed'
      set({ error: msg, isLoading: false })
      throw err
    }
  },

  demoLogin: async (role) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/demo-login', { role })
      localStorage.setItem('cs_token', data.token)
      localStorage.setItem('cs_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, isLoading: false })
      return data
    } catch (err) {
      set({ error: err.response?.data?.message || 'Demo login failed', isLoading: false })
      throw err
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/register', payload)
      localStorage.setItem('cs_token', data.token)
      localStorage.setItem('cs_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, isLoading: false })
      return data
    } catch (err) {
      set({ error: err.response?.data?.message || 'Registration failed', isLoading: false })
      throw err
    }
  },

  logout: async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('cs_token')
    localStorage.removeItem('cs_user')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data.user })
      localStorage.setItem('cs_user', JSON.stringify(data.user))
    } catch {}
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
