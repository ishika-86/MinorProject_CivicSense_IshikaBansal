const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

// Badge definitions — computed from reputationScore + activity
const BADGE_RULES = {
  citizen: [
    { id: 'first_complaint', label: '🌱 First Step',      desc: 'Filed first complaint',           min: 0  },
    { id: 'active_citizen',  label: '🥇 Active Citizen',  desc: '5+ complaints filed',             min: 10 },
    { id: 'civic_hero',      label: '🏆 Civic Hero',      desc: '20+ complaints resolved',         min: 50 },
    { id: 'community_leader',label: '👑 Community Leader',desc: 'Reputation above 100',            min: 100},
  ],
  officer: [
    { id: 'first_resolve',   label: '🔧 Problem Solver',  desc: 'Resolved first complaint',        min: 0  },
    { id: 'swift_officer',   label: '⚡ Swift Officer',   desc: 'Resolved 10+ complaints',         min: 50 },
    { id: 'efficient_officer',label: '🛠 Efficient Officer',desc: 'High resolution rate',          min: 100},
    { id: 'top_officer',     label: '🌟 Top Officer',     desc: 'Reputation above 200',            min: 200},
  ],
  admin: [
    { id: 'admin_active',    label: '📋 Active Admin',    desc: 'Managing complaints',             min: 0  },
    { id: 'smart_admin',     label: '🧠 Smart Admin',     desc: 'High assignment accuracy',        min: 50 },
    { id: 'city_guardian',   label: '🛡 City Guardian',   desc: 'Reputation above 100',            min: 100},
  ],
}

const getBadges = (role, score, complaintCount, resolvedCount) => {
  const rules = BADGE_RULES[role] || []
  return rules.filter(r => score >= r.min).map(r => r.id)
}

const userSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  email:           { type: String, required: true, unique: true, lowercase: true },
  password:        { type: String, required: true, minlength: 6 },
  role:            { type: String, enum: ['citizen','admin','officer'], default: 'citizen' },
  status:          { type: String, enum: ['active','pending','blocked'], default: 'active' },
  phone:           { type: String, default: '' },
  area:            { type: String, default: '' },
  avatar:          { type: String, default: '' },
  bio:             { type: String, default: '' },
  department:      { type: String, default: '' },
  assignedArea:    { type: String, default: '' },
  reputationScore: { type: Number, default: 0 },
  complaintCount:  { type: Number, default: 0 },
  resolvedCount:   { type: Number, default: 0 },
  badges:          [{ type: String }],  // array of badge IDs
  loginAttempts:   { type: Number, default: 0 },
  lockUntil:       { type: Date },
  lastLogin:       { type: Date },
  isGoogleAuth:    { type: Boolean, default: false },
  googleId:        { type: String, default: '' },
  notificationPrefs: {
    email:     { type: Boolean, default: true },
    push:      { type: Boolean, default: true },
    emergency: { type: Boolean, default: true },
    nearby:    { type: Boolean, default: true },
  },
  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [78.1772, 26.2124] },
  },
}, { timestamps: true })

userSchema.index({ location: '2dsphere' })

// Auto-compute badges before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12)
  }
  // Recompute badges whenever score/counts change
  if (this.isModified('reputationScore') || this.isModified('complaintCount') || this.isModified('resolvedCount')) {
    this.badges = getBadges(this.role, this.reputationScore, this.complaintCount, this.resolvedCount)
  }
  next()
})

userSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password)
}
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now())
}
userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1; this.lockUntil = undefined
  } else {
    this.loginAttempts += 1
    if (this.loginAttempts >= 5) this.lockUntil = Date.now() + 30 * 60 * 1000
  }
  return this.save()
}

// Static: add reputation points and trigger badge recompute
userSchema.statics.addReputation = async function (userId, points) {
  if (!userId || !points) return
  const user = await this.findByIdAndUpdate(
    userId,
    { $inc: { reputationScore: points } },
    { new: true }
  )
  if (user) {
    user.badges = getBadges(user.role, user.reputationScore, user.complaintCount, user.resolvedCount)
    await user.save({ validateBeforeSave: false })
  }
  return user
}

module.exports = mongoose.model('User', userSchema)
