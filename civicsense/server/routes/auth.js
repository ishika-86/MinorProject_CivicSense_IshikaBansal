const express    = require('express')
const router     = express.Router()
const ctrl       = require('../controllers/authController')
const { protect }= require('../middleware/auth')
const rateLimit  = require('express-rate-limit')
const jwt        = require('jsonwebtoken')
let passport

try { passport = require('../config/passport') } catch (_) {}

const lim = rateLimit({ windowMs:15*60*1000, max:30, message:{success:false,message:'Too many requests'} })

router.post('/register',   lim, ctrl.register)
router.post('/login',      lim, ctrl.login)
router.post('/demo-login', ctrl.demoLogin)
router.get('/me',          protect, ctrl.getMe)
router.post('/logout',     protect, ctrl.logout)

// Google OAuth routes
if (passport) {
  router.get('/google', passport.authenticate('google', { scope:['profile','email'], session:false }))

  router.get('/google/callback',
    passport.authenticate('google', { session:false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed` }),
    (req, res) => {
      const user  = req.user
      const token = jwt.sign({ id:user._id, role:user.role, email:user.email }, process.env.JWT_SECRET, { expiresIn:'7d' })
      // Redirect to client with token
      const userData = encodeURIComponent(JSON.stringify({
        _id:user._id, name:user.name, email:user.email,
        role:user.role, avatar:user.avatar, area:user.area,
        reputationScore:user.reputationScore, department:user.department,
      }))
      res.redirect(`${process.env.CLIENT_URL}/auth/google-callback?token=${token}&user=${userData}`)
    }
  )
} else {
  router.get('/google',          (req, res) => res.json({success:false, message:'Google OAuth not configured'}))
  router.get('/google/callback', (req, res) => res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_not_configured`))
}

module.exports = router
