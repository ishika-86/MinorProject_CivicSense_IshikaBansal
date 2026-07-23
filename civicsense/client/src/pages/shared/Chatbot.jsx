import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, Loader2, AlertTriangle, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

const detect = (t) => {
  const s = t.toLowerCase()
  if (/fire|आग/.test(s))                                     return 'FIRE'
  if (/accident|crash|collision|दुर्घटना/.test(s))          return 'ACCIDENT'
  if (/dog attack|animal attack|stray dog|कुत्ता/.test(s))   return 'ANIMAL'
  if (/electric|wire|current|बिजली/.test(s))                 return 'ELECTRIC'
  if (/water|नल|पाइप/.test(s))                               return 'WATER'
  if (/road|pothole|सड़क|गड्ढा/.test(s))                    return 'ROAD'
  if (/garbage|trash|कचरा/.test(s))                          return 'GARBAGE'
  if (/track|status|where.*complaint/.test(s))               return 'TRACK'
  if (/report|file|complaint|शिकायत/.test(s))                return 'REPORT'
  if (/emergency|help|urgent|मदद/.test(s))                   return 'HELP'
  if (/hello|hi|नमस्ते|helo/.test(s))                        return 'GREET'
  return 'GENERAL'
}

const RESPONSES = {
  FIRE:    { msg:'🔥 **FIRE EMERGENCY DETECTED!**\n\nI\'m alerting the Fire Department and nearby citizens immediately.\n\n• Call **101** (Fire Helpline)\n• Evacuate the area at once\n• Do NOT use elevators', urgent:true, replies:['🔥 File Fire Complaint','📞 Call 101','📍 Share Location'] },
  ACCIDENT:{ msg:'🚗 **ACCIDENT ALERT!**\n\nPolice and nearby hospitals are being notified.\n\n• Call **112** (Emergency)\n• Do not move injured persons\n• Keep the area clear', urgent:true, replies:['🚗 File Accident Complaint','📞 Call 112','🏥 Nearest Hospital'] },
  ANIMAL:  { msg:'🐕 **DANGEROUS ANIMAL ALERT!**\n\nAnimal Control (Nagar Nigam) and nearby residents are being notified.\n\n• Move away immediately\n• Do not provoke the animal\n• Get to a safe location', urgent:true, replies:['🐕 Report Animal Attack','📞 Animal Control','⚠️ Alert Residents'] },
  ELECTRIC:{ msg:'⚡ **ELECTRIC HAZARD DETECTED!**\n\nMPMKVVCL is being alerted immediately.\n\n• **Do NOT** touch exposed wires\n• Avoid the affected area\n• Keep children and animals away', urgent:true, replies:['⚡ File Electric Hazard','📞 MPMKVVCL Helpline','⚠️ Mark Area Dangerous'] },
  WATER:   { msg:'💧 Water issues are common in Gwalior. I can help you report it!\n\n**What type of issue?**', urgent:false, replies:['💧 No Water Supply','🔴 Contaminated Water','🚰 Pipe Leaking','📋 File Complaint'] },
  ROAD:    { msg:'🛣️ Road damage is among the top issues in Gwalior. Let\'s get it reported!\n\n**What kind of issue?**', urgent:false, replies:['🕳️ Pothole / Damage','🚧 Road Blocked','📋 File Road Complaint'] },
  GARBAGE: { msg:'🗑️ Garbage issues can spread disease. Let\'s report this to Nagar Nigam.\n\n**Select the issue:**', urgent:false, replies:['🗑️ Overflowing Dustbin','🐀 Garbage Not Collected','📋 File Garbage Complaint'] },
  TRACK:   { msg:'🔍 You can track your complaints in **My Complaints** section.\n\nEach complaint has a real-time timeline showing every update.', urgent:false, replies:['📋 My Complaints','🔢 Enter Complaint Number','🔔 Check Notifications'] },
  REPORT:  { msg:'📝 I\'ll help you file a complaint!\n\n**🚨 Emergency (instant alert):**\nFire · Accident · Animal Attack · Electric Hazard\n\n**🔧 Civic Issues:**\nRoad · Water · Garbage · Electricity', urgent:false, replies:['🚨 Emergency Issue','🛣️ Road Problem','💧 Water Issue','⚡ Electricity Issue'] },
  HELP:    { msg:'🚨 **EMERGENCY ASSISTANCE**\n\n• **Police:** 100\n• **Ambulance:** 108\n• **Fire:** 101\n• **All Emergencies:** 112\n\nWhat is the emergency?', urgent:true, replies:['🚗 Accident','🔥 Fire','🐕 Animal','🚨 Other'] },
  GREET:   { msg:'🙏 **Namaste! Welcome to CivicBot!**\n\nI\'m your AI assistant for Gwalior\'s civic issues.\n\n• 📋 **Report** issues\n• 🔍 **Track** complaints\n• 🚨 **Emergency** alerts\n• 📊 Area statistics\n\nHow can I help?', urgent:false, replies:['📋 Report Issue','🔍 Track Complaint','🚨 Emergency Help','📊 Statistics'] },
  GENERAL: { msg:'🤔 I can help with civic issues in Gwalior.\n\n**Try saying:**\n• "There\'s a fire near Lashkar"\n• "Pothole on Jhansi Road"\n• "No water supply in Morar"\n• "Dog attack at City Center"', urgent:false, replies:['📋 File Complaint','🔍 Track Status','🚨 Emergency','❓ Help'] },
}

const INIT = {
  id:'init', role:'bot', timestamp: new Date(),
  text:'🙏 **Namaste! I\'m CivicBot**\n\nAI assistant for Gwalior\'s civic issues. I detect emergencies and help file complaints.\n\n**Try:** "There\'s a fire near Lashkar" or "Dog attack at City Center"',
  replies:['📋 Report Issue','🔍 Track Complaint','🚨 Emergency Help','🐕 Animal Issue'],
}

function MsgText({ text }) {
  return (
    <div className="space-y-0.5">
      {text.split('\n').map((line, i) => {
        const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        return (
          <p key={i} className={`text-sm leading-relaxed ${line.startsWith('•') ? 'ml-3' : ''}`}
            dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }}
          />
        )
      })}
    </div>
  )
}

export default function Chatbot() {
  const { user }        = useAuthStore()
  const navigate        = useNavigate()
  const [msgs,  setMsgs]  = useState([INIT])
  const [input, setInput] = useState('')
  const [busy,  setBusy]  = useState(false)
  const bottom            = useRef(null)

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const addMsg = (role, text, replies = [], urgent = false) => {
    setMsgs(m => [...m, { id: Date.now(), role, text, replies, urgent, timestamp: new Date() }])
  }

  const handle = async (text) => {
    const t = (text || input).trim()
    if (!t) return
    setInput('')
    addMsg('user', t)
    setBusy(true)
    await new Promise(r => setTimeout(r, 550))

    const intent = detect(t)
    const res    = RESPONSES[intent] || RESPONSES.GENERAL

    if (res.urgent) {
      toast.error(`🚨 Emergency detected: ${t.slice(0, 40)}…`, { duration: 6000, style: { background: '#dc2626', color: '#fff', fontWeight: '700' } })
    }

    addMsg('bot', res.msg, res.replies, res.urgent)
    setBusy(false)
  }

  const handleReply = (r) => {
    if (r.includes('My Complaints'))         { navigate('/citizen/complaints'); return }
    if (r.includes('Report Issue') || r.includes('File Complaint')) { navigate('/citizen/raise'); return }
    if (r.includes('Fire Complaint'))        { navigate('/citizen/raise?cat=Fire+Hazard'); return }
    if (r.includes('Accident Complaint'))    { navigate('/citizen/raise?cat=Accident'); return }
    if (r.includes('Animal Attack'))         { navigate('/citizen/raise?cat=Animal+Attack'); return }
    if (r.includes('Electric Hazard'))       { navigate('/citizen/raise?cat=Electric+Hazard'); return }
    if (r.includes('Road Complaint'))        { navigate('/citizen/raise?cat=Road+Damage'); return }
    handle(r)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 9rem)' }}>
      {/* Header */}
      <div className="card p-4 mb-4 flex items-center gap-3 border-0" style={{ background: 'linear-gradient(135deg,#0F2854,#1C4D8D)' }}>
        <div className="w-10 h-10 rounded-2xl bg-bot-3/30 flex items-center justify-center flex-shrink-0">
          <Bot size={20} className="text-bot-4" />
        </div>
        <div className="flex-1">
          <h2 className="text-white font-bold">CivicBot</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <p className="text-bot-4/60 text-xs">AI · Emergency Detection Active · Gwalior</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-bot-3/20 px-2.5 py-1 rounded-full border border-bot-3/30">
          <Zap size={11} className="text-bot-4" />
          <span className="text-bot-4 text-xs font-semibold">AI Active</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-3 pr-1">
        <AnimatePresence initial={false}>
          {msgs.map(msg => (
            <motion.div key={msg.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'bot' && (
                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 ${msg.urgent ? 'bg-red-500' : 'bg-bot-2'}`}>
                  {msg.urgent ? <AlertTriangle size={14} className="text-white" /> : <Bot size={14} className="text-bot-4" />}
                </div>
              )}

              <div className="max-w-sm">
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-dash-1 text-white rounded-tr-sm'
                    : msg.urgent
                      ? 'bg-red-50 border-2 border-red-200 rounded-tl-sm'
                      : 'bg-white border border-dash-3/20 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.urgent && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-red-600 text-[10px] font-bold uppercase tracking-wide">Emergency Detected</span>
                    </div>
                  )}
                  <div className={msg.role === 'user' ? 'text-white' : msg.urgent ? 'text-dash-1' : 'text-dash-1'}>
                    <MsgText text={msg.text} />
                  </div>
                </div>

                {msg.role === 'bot' && msg.replies?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.replies.map(r => (
                      <motion.button key={r} whileTap={{ scale: 0.95 }} onClick={() => handleReply(r)}
                        className="px-3 py-1.5 bg-white border border-bot-3/25 text-dash-1 rounded-xl text-xs font-medium hover:bg-bot-4/40 hover:border-bot-2 transition-all shadow-sm"
                      >{r}</motion.button>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-dash-2/40 mt-1 px-1">
                  {msg.timestamp?.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                </p>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-auth-3 to-auth-4 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs mt-0.5">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {busy && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-bot-2 flex items-center justify-center flex-shrink-0"><Bot size={14} className="text-bot-4"/></div>
            <div className="bg-white border border-dash-3/20 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                {[0,1,2].map(i => (
                  <motion.div key={i} animate={{ y:[0,-4,0] }} transition={{ repeat:Infinity, duration:0.75, delay:i*0.15 }}
                    className="w-2 h-2 bg-bot-3 rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottom} />
      </div>

      {/* Input */}
      <div className="card p-3 flex gap-2 items-center mt-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handle()}
          placeholder="Type a message… e.g. 'fire near Lashkar'" className="input flex-1 text-sm border-bot-3/25 focus:border-bot-2"
        />
        <motion.button whileTap={{ scale:0.9 }} onClick={() => handle()} disabled={busy || !input.trim()}
          className="w-10 h-10 bg-bot-2 text-white rounded-xl flex items-center justify-center hover:bg-bot-1 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {busy ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}
        </motion.button>
      </div>

      <p className="text-[10px] text-dash-2/35 text-center mt-1.5">CivicBot v2.0 · AI Emergency Detection · Gwalior, MP</p>
    </div>
  )
}
