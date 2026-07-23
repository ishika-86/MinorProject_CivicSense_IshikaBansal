import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, Loader2, AlertTriangle, ChevronDown, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'

const detect = (t) => {
  const s = t.toLowerCase()
  if (/fire|आग/.test(s))                                   return 'FIRE'
  if (/accident|crash|collision|दुर्घटना/.test(s))        return 'ACCIDENT'
  if (/dog.attack|animal.attack|stray|कुत्ता/.test(s))    return 'ANIMAL'
  if (/electric|wire|current|बिजली/.test(s))              return 'ELECTRIC'
  if (/track|status|complaint.*status|where.*complaint/.test(s)) return 'TRACK'
  if (/water|नल|pipe/.test(s))                             return 'WATER'
  if (/road|pothole|सड़क|गड्ढा/.test(s))                  return 'ROAD'
  if (/garbage|trash|कचरा/.test(s))                        return 'GARBAGE'
  if (/how long|resolution time|when.*fixed/.test(s))      return 'FAQ_TIME'
  if (/how.*(report|file)|steps|guide/.test(s))            return 'FAQ_HOW'
  if (/area|lashkar|morar|thatipur|city center|issues in/.test(s)) return 'AREA'
  if (/report|file|complaint|शिकायत/.test(s))              return 'REPORT'
  if (/hello|hi|नमस्ते|hey/.test(s))                       return 'GREET'
  return 'GENERAL'
}

const RESP = {
  FIRE:     { msg:'🔥 **FIRE EMERGENCY!**\nI\'m alerting Fire Dept and nearby residents!\n\n• Call **101** immediately\n• Evacuate now\n• Don\'t use lifts', urgent:true, replies:['🔥 File Fire Complaint','📞 Call 101'] },
  ACCIDENT: { msg:'🚗 **ACCIDENT ALERT!**\nPolice & hospitals being notified!\n\n• Call **112** now\n• Don\'t move injured persons', urgent:true, replies:['🚗 File Accident Report','📞 Call 112'] },
  ANIMAL:   { msg:'🐕 **ANIMAL DANGER!**\nAnimal Control being alerted!\n\n• Move away immediately\n• High priority case\n• Stay safe!', urgent:true, replies:['🐕 Report Animal Attack','📞 Animal Control'] },
  ELECTRIC: { msg:'⚡ **ELECTRIC HAZARD!**\nMPMKVVCL alerted immediately!\n\n• **Don\'t touch** exposed wires\n• Clear the area now', urgent:true, replies:['⚡ File Electric Hazard','📞 MPMKVVCL'] },
  TRACK:    { msg:'🔍 **Track Your Complaint**\n\nGo to **My Complaints** to see:\n• Real-time status\n• Timeline updates\n• Officer assignment', urgent:false, replies:['📋 My Complaints','🔔 Notifications'] },
  WATER:    { msg:'💧 Water issues in Gwalior?\n\nCommon problems:\n• No supply → PHE Dept\n• Contaminated → Health Dept\n• Pipe leak → Nagar Nigam', urgent:false, replies:['💧 Report Water Issue','📋 File Complaint'] },
  ROAD:     { msg:'🛣️ Road damage is the #1 complaint!\n\nI\'ll help you report it to PWD.\nPlease provide:\n• Exact location\n• Type of damage\n• Photo if possible', urgent:false, replies:['🛣️ Report Road Damage','📋 File Complaint'] },
  GARBAGE:  { msg:'🗑️ Garbage issues go to **Nagar Nigam**.\n\nInclude:\n• Exact location\n• How long it\'s been there\n• Photo helps a lot!', urgent:false, replies:['🗑️ Report Garbage','📋 File Complaint'] },
  FAQ_TIME: { msg:'⏱️ **Resolution Times:**\n\n🚨 Emergency: 2-4 hours\n🔴 High priority: 24-48 hours\n🟡 Medium: 3-5 days\n🟢 Low: 7-10 days\n\nYou\'ll get SMS/email updates.', urgent:false, replies:['📋 Check My Status','📊 View Statistics'] },
  FAQ_HOW:  { msg:'📋 **How to File a Complaint:**\n\n1. Click **Raise Complaint**\n2. Select category\n3. Describe the issue\n4. Add photos (optional)\n5. Drop your location pin\n6. Submit — done!', urgent:false, replies:['📝 Raise Complaint Now','❓ More Help'] },
  AREA:     { msg:'📍 **Area Insights**\n\nI can show you:\n• Active complaints nearby\n• Most common issues\n• Resolution trends\n\nCheck the **Live Map** for real-time data!', urgent:false, replies:['🗺️ View Live Map','📊 Area Statistics'] },
  REPORT:   { msg:'📝 Let me help you file a complaint!\n\n**Quick categories:**\n🚨 Emergency: Fire, Accident, Stray Dog\n🔧 Civic: Road, Water, Garbage', urgent:false, replies:['🚗 Accident','🔥 Fire','🛣️ Road','💧 Water','🗑️ Garbage'] },
  GREET:    { msg:'🙏 **Namaste! I\'m CivicBot!**\n\nGwalior\'s AI civic assistant.\n\nI can help you:\n• 📋 File complaints\n• 🔍 Track status\n• 🚨 Handle emergencies\n• 📊 Get area insights', urgent:false, replies:['📋 File Complaint','🔍 Track Complaint','🚨 Emergency','📊 Area Stats'] },
  GENERAL:  { msg:'🤔 I\'m here to help with Gwalior\'s civic issues!\n\nTry asking:\n• "Fire on Jhansi Road"\n• "Track my complaint"\n• "Water problem in Lashkar"\n• "How long does it take?"', urgent:false, replies:['📋 File Complaint','🔍 Track Status','🚨 Emergency','❓ FAQ'] },
}

const INIT = {
  id:'init', role:'bot', timestamp:new Date(),
  text:'🙏 **Namaste! I\'m CivicBot**\n\nYour AI civic assistant for Gwalior. I detect emergencies & help file complaints instantly.\n\nWhat can I help you with?',
  replies:['📋 File Complaint','🔍 Track Complaint','🚨 Emergency Help','🐕 Animal Issue'],
  urgent:false,
}

function MsgText({ text }) {
  return (
    <div className="space-y-0.5">
      {text.split('\n').map((line, i) => {
        const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        return <p key={i} className={`text-sm leading-relaxed ${line.startsWith('•') ? 'ml-3' : ''}`} dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />
      })}
    </div>
  )
}

export default function FloatingChatbot() {
  const { user }      = useAuthStore()
  const navigate      = useNavigate()
  const [open,setOpen]= useState(false)
  const [msgs,setMsgs]= useState([INIT])
  const [input,setInput]=useState('')
  const [busy,setBusy]=useState(false)
  const [unread,setUnread]=useState(0)
  const bottom = useRef(null)

  useEffect(() => { if(open){ bottom.current?.scrollIntoView({behavior:'smooth'}); setUnread(0) } }, [msgs, open])

  const addMsg = (role, text, replies=[], urgent=false) =>
    setMsgs(m=>[...m,{id:Date.now(),role,text,replies,urgent,timestamp:new Date()}])

  const handle = async (text) => {
    const t = (text||input).trim()
    if (!t) return
    setInput('')
    addMsg('user', t)
    setBusy(true)
    await new Promise(r=>setTimeout(r,500))

    const intent = detect(t)
    const res    = RESP[intent] || RESP.GENERAL

    if (res.urgent) {
      toast.error(`🚨 Emergency detected! Alerting authorities…`, { duration:6000, style:{background:'#dc2626',color:'#fff',fontWeight:'700'} })
    }
    addMsg('bot', res.msg, res.replies, res.urgent)
    if (!open) setUnread(u=>u+1)
    setBusy(false)
  }

  const handleReply = (r) => {
    if (r.includes('My Complaints'))   { navigate('/citizen/complaints'); setOpen(false); return }
    if (r.includes('Raise Complaint') || r.includes('File Complaint') || r.includes('Complaint Now')) { navigate('/citizen/raise'); setOpen(false); return }
    if (r.includes('Fire Complaint'))  { navigate('/citizen/raise?cat=Fire+Hazard'); setOpen(false); return }
    if (r.includes('Accident Report')) { navigate('/citizen/raise?cat=Accident'); setOpen(false); return }
    if (r.includes('Animal Attack'))   { navigate('/citizen/raise?cat=Animal+Attack'); setOpen(false); return }
    if (r.includes('Electric Hazard')) { navigate('/citizen/raise?cat=Electric+Hazard'); setOpen(false); return }
    if (r.includes('Road Damage'))     { navigate('/citizen/raise?cat=Road+Damage'); setOpen(false); return }
    if (r.includes('Water Issue'))     { navigate('/citizen/raise?cat=Water+Supply'); setOpen(false); return }
    if (r.includes('Garbage'))         { navigate('/citizen/raise?cat=Garbage'); setOpen(false); return }
    if (r.includes('Notifications'))   { navigate('/citizen/profile'); setOpen(false); return }
    handle(r)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9000] flex flex-col items-end gap-3">
      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, scale:0.85, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.85, y:20 }}
            transition={{ type:'spring', stiffness:320, damping:28 }}
            className="w-80 sm:w-96 rounded-3xl overflow-hidden shadow-glass-lg border border-white/20"
            style={{ maxHeight:'520px', display:'flex', flexDirection:'column' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background:'linear-gradient(135deg,#0F2854,#1C4D8D)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-bot-3/30 rounded-xl flex items-center justify-center">
                  <Bot size={16} className="text-bot-4" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">CivicBot</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-bot-4/60 text-[10px]">AI Active · Emergency Ready</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-bot-3/20 text-bot-4 px-2 py-0.5 rounded-full border border-bot-3/20 flex items-center gap-1">
                  <Zap size={9} />AI
                </span>
                <motion.button onClick={()=>setOpen(false)} whileTap={{scale:0.85}} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors">
                  <ChevronDown size={16} className="text-white/70" />
                </motion.button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-dash-4/80 backdrop-blur-sm">
              <AnimatePresence initial={false}>
                {msgs.map(msg => (
                  <motion.div key={msg.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.2}}
                    className={`flex gap-2 ${msg.role==='user'?'justify-end':'justify-start'}`}
                  >
                    {msg.role==='bot' && (
                      <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 ${msg.urgent?'bg-red-500':'bg-bot-2'}`}>
                        {msg.urgent ? <AlertTriangle size={11} className="text-white"/> : <Bot size={11} className="text-bot-4"/>}
                      </div>
                    )}
                    <div className="max-w-[240px]">
                      <div className={`rounded-2xl px-3 py-2 ${msg.role==='user'?'bg-dash-1 text-white rounded-tr-sm':'text-dash-1 rounded-tl-sm shadow-sm '+(msg.urgent?'bg-red-50 border border-red-200':'bg-white border border-dash-3/20')}`}>
                        {msg.urgent && <div className="flex items-center gap-1 mb-1"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/><span className="text-red-600 text-[9px] font-bold uppercase">Emergency</span></div>}
                        <MsgText text={msg.text} />
                      </div>
                      {msg.role==='bot' && msg.replies?.length>0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {msg.replies.map(r=>(
                            <motion.button key={r} whileTap={{scale:0.93}} onClick={()=>handleReply(r)}
                              className="px-2.5 py-1 bg-white border border-dash-3/25 text-dash-1 rounded-xl text-[11px] font-medium hover:bg-auth-1/50 hover:border-auth-3 transition-all shadow-sm"
                            >{r}</motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.role==='user' && (
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-auth-3 to-auth-4 flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px] mt-0.5">
                        {user?.name?.charAt(0).toUpperCase()||'U'}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {busy && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg bg-bot-2 flex items-center justify-center"><Bot size={11} className="text-bot-4"/></div>
                  <div className="bg-white border border-dash-3/20 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm">
                    <div className="flex gap-1">
                      {[0,1,2].map(i=>(
                        <motion.div key={i} animate={{y:[0,-3,0]}} transition={{repeat:Infinity,duration:0.7,delay:i*0.12}}
                          className="w-1.5 h-1.5 bg-bot-3 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottom} />
            </div>

            {/* Input */}
            <div className="flex gap-2 p-3 bg-white/90 backdrop-blur-sm border-t border-dash-3/20 flex-shrink-0">
              <input value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&handle()}
                placeholder="Type a message…"
                className="flex-1 bg-dash-4/60 border border-dash-3/30 rounded-xl px-3 py-2 text-sm text-dash-1 placeholder-dash-2/50 focus:outline-none focus:ring-2 focus:ring-bot-3/40 focus:border-bot-3"
              />
              <motion.button whileTap={{scale:0.9}} onClick={()=>handle()} disabled={busy||!input.trim()}
                className="w-9 h-9 bg-bot-2 text-white rounded-xl flex items-center justify-center hover:bg-bot-1 transition-colors disabled:opacity-50"
              >
                {busy ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale:1.08, y:-2 }} whileTap={{ scale:0.92 }}
        className="w-14 h-14 rounded-2xl shadow-glass-lg flex items-center justify-center relative"
        style={{ background:'linear-gradient(135deg,#1C4D8D,#0F2854)' }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{rotate:-90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:90,opacity:0}}>
              <X size={22} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{rotate:90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:-90,opacity:0}}>
              <MessageSquare size={22} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pulse ring */}
        {!open && <div className="absolute inset-0 rounded-2xl bg-bot-2 animate-pulse-slow opacity-30 -z-10 scale-110" />}
        {/* Unread badge */}
        {unread > 0 && !open && (
          <motion.span initial={{scale:0}} animate={{scale:1}} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
            {unread}
          </motion.span>
        )}
      </motion.button>
    </div>
  )
}
