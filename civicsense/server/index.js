require('dotenv').config()
const express   = require('express')
const http      = require('http')
const cors      = require('cors')
const helmet    = require('helmet')
const morgan    = require('morgan')
const path      = require('path')
const rateLimit = require('express-rate-limit')

const connectDB      = require('./config/db')
const { initSocket } = require('./socket/socketHandler')
const errorHandler   = require('./middleware/errorHandler')
const logger         = require('./utils/logger')

// Optional passport (Google OAuth)
let passport
try {
  passport = require('./config/passport')
} catch (e) {
  logger.warn('Passport not loaded (Google OAuth optional): ' + e.message)
}

const app    = express()
const server = http.createServer(app)

initSocket(server)
connectDB()

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true, methods: ['GET','POST','PUT','DELETE','PATCH'] }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan('dev', { stream: { write: m => logger.info(m.trim()) } }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

if (passport) {
  app.use(require('express').json()) // already above, passport needs no session
  app.use(passport.initialize())
}

const limiter = rateLimit({ windowMs: 15*60*1000, max: 200 })
app.use('/api/', limiter)

app.use('/api/auth',          require('./routes/auth'))
app.use('/api/complaints',    require('./routes/complaints'))
app.use('/api/admin',         require('./routes/admin'))
app.use('/api/officer',       require('./routes/officer'))
app.use('/api/community',     require('./routes/community'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/analytics',     require('./routes/analytics'))
app.use('/api/emergency',     require('./routes/emergency'))
app.use('/api/profile',       require('./routes/profile'))

app.get('/api/health', (req, res) => res.json({ status:'ok', time:new Date() }))
app.use(errorHandler)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => logger.info(`🚀 CivicSense server running on port ${PORT}`))
module.exports = { app, server }
