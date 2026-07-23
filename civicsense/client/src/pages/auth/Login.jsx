import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, MapPin, Shield, User, Briefcase } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const schema = z.object({
  email:    z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
})

const DEMO = [
  { role:'citizen', label:'Citizen',  Icon:User,      grad:'from-auth-3 to-auth-4' },
  { role:'admin',   label:'Admin',    Icon:Shield,    grad:'from-dash-1 to-dash-2' },
  { role:'officer', label:'Officer',  Icon:Briefcase, grad:'from-dash-2 to-auth-4' },
]
const REDIRECT = { citizen:'/citizen', admin:'/admin', officer:'/officer' }

function CountUp({ end, duration = 1.8 }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, v => Math.round(v).toLocaleString())
  useEffect(() => { const c = animate(count, end, { duration }); return c.stop }, [end])
  return <motion.span>{rounded}</motion.span>
}

const FLOATERS = Array.from({length:8},(_,i)=>({ id:i, size:60+Math.random()*80, x:Math.random()*100, y:Math.random()*100, dur:8+Math.random()*10 }))

export default function Login() {
  const [showPwd,      setShowPwd]      = useState(false)
  const [demoRole,     setDemoRole]     = useState(null)
  const [googleState,  setGoogleState]  = useState('idle') // idle | loading | done
  const [googleUser,   setGoogleUser]   = useState(null)
  const { login, demoLogin, isLoading, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Handle Google OAuth callback
  useEffect(() => {
    const token = searchParams.get('token')
    const userData = searchParams.get('user')
    if (token && userData) {
      try {
        const u = JSON.parse(decodeURIComponent(userData))
        setUser(u, token)
        toast.success(`Welcome, ${u.name}!`)
        navigate(REDIRECT[u.role] || '/citizen')
      } catch {}
    }
    const err = searchParams.get('error')
    if (err) toast.error('Google login failed. Please try again.')
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email, password }) => {
    try {
      const res = await login(email, password)
      toast.success(`Welcome back, ${res.user.name}!`)
      navigate(REDIRECT[res.user.role] || '/citizen')
    } catch (err) { toast.error(err.response?.data?.message || 'Login failed') }
  }

  const handleDemo = async (role) => {
    setDemoRole(role)
    try {
      const res = await demoLogin(role)
      toast.success(`Demo ${role} — Welcome!`)
      navigate(REDIRECT[res.user.role])
    } catch { toast.error('Demo login failed — is the server running?') }
    finally { setDemoRole(null) }
  }

  const handleGoogle = () => {
    setGoogleState('loading')
    setTimeout(() => {
      window.location.href = '/api/auth/google'
    }, 800)
  }

  const stats = [
    { label:'Roads Fixed',     value:2400 },
    { label:'Water Issues',    value:1200 },
    { label:'Lights Restored', value:890  },
  ]

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background:'linear-gradient(135deg,#DFF2EB 0%,#B9E5E8 45%,#7AB2D3 100%)' }}>
      {/* Animated floating shapes */}
      {FLOATERS.map(f => (
        <motion.div key={f.id}
          style={{ width:f.size, height:f.size, left:`${f.x}%`, top:`${f.y}%`, position:'absolute' }}
          animate={{ y:[0,-30,0], x:[0,15,0], rotate:[0,180,360] }}
          transition={{ duration:f.dur, repeat:Infinity, ease:'easeInOut', delay:f.id*0.5 }}
          className="rounded-full bg-white/10 backdrop-blur-sm border border-white/20 pointer-events-none"
        />
      ))}

      {/* LEFT PANEL */}
      <motion.div initial={{ opacity:0, x:-40 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.6 }}
        className="hidden lg:flex flex-1 flex-col justify-center px-16 relative z-10"
      >
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
          <div className="flex items-center gap-3 mb-10">
            <motion.div whileHover={{ rotate:15, scale:1.1 }} className="w-12 h-12 bg-auth-4 rounded-2xl flex items-center justify-center shadow-lg">
              <MapPin size={22} className="text-white" />
            </motion.div>
            <div>
              <h1 className="font-display text-auth-4 text-2xl font-bold">CivicSense.city</h1>
              <p className="text-auth-4/60 text-sm">Gwalior, Madhya Pradesh</p>
            </div>
          </div>

          <h2 className="font-display text-auth-4 text-5xl font-bold leading-tight mb-5">
            Your city.<br />Your voice.<br /><span className="text-auth-3">Real change.</span>
          </h2>
          <p className="text-auth-4/65 text-lg leading-relaxed max-w-sm mb-10">
            Report civic issues, track resolutions in real time, and help build a smarter Gwalior.
          </p>

          {/* Animated stat tiles */}
          <div className="grid grid-cols-3 gap-3 max-w-sm">
            {stats.map(({ label, value }, i) => (
              <motion.div key={label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 + i*0.15 }}
                whileHover={{ scale:1.05, y:-4 }}
                className="glass rounded-xl p-3 text-center"
              >
                <p className="text-auth-4 font-bold text-lg leading-none">
                  <CountUp end={value} />
                </p>
                <p className="text-auth-4/55 text-xs mt-1">{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* RIGHT PANEL */}
      <motion.div initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.6 }}
        className="flex-1 lg:max-w-md flex items-center justify-center p-6 relative z-10"
      >
        <div className="w-full max-w-sm">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
            className="glass rounded-3xl p-8 shadow-glass-lg"
          >
            <div className="text-center mb-6">
              <h2 className="font-display text-auth-4 text-2xl font-bold">Sign In</h2>
              <p className="text-auth-4/55 text-sm mt-1">Access your CivicSense account</p>
            </div>

            {/* Google Sign-In */}
            <motion.button onClick={handleGoogle} disabled={googleState==='loading'}
              whileHover={{ scale:1.02, y:-2 }} whileTap={{ scale:0.98 }}
              className="btn-google mb-4 relative overflow-hidden"
            >
              {/* Ripple effect on hover */}
              <motion.div
                className="absolute inset-0 bg-blue-50 rounded-xl"
                initial={{ scale:0, opacity:0 }}
                whileHover={{ scale:1, opacity:1 }}
                transition={{ duration:0.3 }}
              />
              <span className="relative flex items-center justify-center gap-3 w-full">
                {googleState === 'loading' ? (
                  <><Loader2 size={18} className="animate-spin text-blue-500" /><span className="text-gray-600">Connecting to Google…</span></>
                ) : (
                  <>
                    <motion.svg width="18" height="18" viewBox="0 0 18 18"
                      initial={{ rotate:0 }} whileHover={{ rotate:360 }} transition={{ duration:0.6 }}
                    >
                      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                    </motion.svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </span>
            </motion.button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-auth-3/25" />
              <span className="text-auth-4/40 text-xs">or use email</span>
              <div className="flex-1 h-px bg-auth-3/25" />
            </div>

            {/* Quick Demo */}
            <p className="text-auth-4/45 text-[11px] uppercase tracking-wider font-semibold text-center mb-2">Quick Demo Access</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {DEMO.map(({ role, label, Icon, grad }) => (
                <motion.button key={role} whileTap={{ scale:0.95 }} whileHover={{ y:-2 }} onClick={() => handleDemo(role)}
                  disabled={!!demoRole}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-br ${grad} text-white text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-60 shadow-sm`}
                >
                  {demoRole === role ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                  {label}
                </motion.button>
              ))}
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-auth-4 text-xs font-semibold mb-1 block">Email</label>
                <motion.input {...register('email')} type="email" placeholder="you@example.com"
                  whileFocus={{ scale:1.01 }}
                  className={`input border-auth-3/35 bg-white/55 ${errors.email?'border-red-400':''}`}
                />
                {errors.email && <motion.p initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} className="text-red-500 text-xs mt-1">{errors.email.message}</motion.p>}
              </div>

              <div>
                <label className="text-auth-4 text-xs font-semibold mb-1 block">Password</label>
                <div className="relative">
                  <motion.input {...register('password')} type={showPwd?'text':'password'} placeholder="••••••••"
                    whileFocus={{ scale:1.01 }}
                    className={`input border-auth-3/35 bg-white/55 pr-10 ${errors.password?'border-red-400':''}`}
                  />
                  <motion.button type="button" onClick={() => setShowPwd(!showPwd)}
                    whileTap={{ scale:0.85 }} whileHover={{ scale:1.1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-auth-4/40 hover:text-auth-4"
                  >
                    <motion.div animate={{ rotate: showPwd ? 180 : 0 }} transition={{ duration:0.2 }}>
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </motion.div>
                  </motion.button>
                </div>
                {errors.password && <motion.p initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} className="text-red-500 text-xs mt-1">{errors.password.message}</motion.p>}
              </div>

              <motion.button type="submit" disabled={isLoading}
                whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:0.98 }}
                className="w-full py-3 bg-auth-4 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 relative overflow-hidden"
              >
                <motion.div className="absolute inset-0 bg-white/10" initial={{x:'-100%'}} whileHover={{x:'100%'}} transition={{duration:0.4}} />
                {isLoading && <Loader2 size={15} className="animate-spin" />}
                <span className="relative">Sign In</span>
              </motion.button>
            </form>

            <p className="text-center text-auth-4/55 text-sm mt-4">
              No account? <Link to="/register" className="text-auth-4 font-semibold hover:underline">Register free</Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
