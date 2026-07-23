const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/User')
const logger = require('../utils/logger')

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID     || 'GOOGLE_CLIENT_ID_NOT_SET',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET_NOT_SET',
  callbackURL:  process.env.GOOGLE_CALLBACK_URL  || 'http://localhost:5000/api/auth/google/callback',
  scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value
    if (!email) return done(new Error('No email from Google'), null)

    let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] })

    if (!user) {
      user = await User.create({
        name:       profile.displayName || 'Google User',
        email,
        password:   `GOOGLE_${profile.id}_${Date.now()}`,
        googleId:   profile.id,
        isGoogleAuth: true,
        avatar:     profile.photos?.[0]?.value || '',
        status:     'active',
        role:       'citizen',
      })
      logger.info(`New Google user registered: ${email}`)
    } else if (!user.googleId) {
      user.googleId = profile.id
      user.isGoogleAuth = true
      if (!user.avatar && profile.photos?.[0]?.value) user.avatar = profile.photos[0].value
      await user.save({ validateBeforeSave: false })
    }

    return done(null, user)
  } catch (err) {
    logger.error('Google OAuth error: ' + err.message)
    return done(err, null)
  }
}))

passport.serializeUser((user, done) => done(null, user._id))
passport.deserializeUser(async (id, done) => {
  try { const u = await User.findById(id); done(null, u) } catch (e) { done(e, null) }
})

module.exports = passport
