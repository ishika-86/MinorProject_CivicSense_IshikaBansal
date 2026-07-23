const Complaint  = require('../models/Complaint')
const User       = require('../models/User')
const { Notification } = require('../models/index')
const { isEmergency, processEmergency, getDepartment } = require('../utils/emergencyDetector')
const { getIO }  = require('../socket/socketHandler')

// ── CREATE COMPLAINT ──────────────────────────────────────────────────────────
exports.createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, area, address = '', isAnonymous = false, latitude, longitude, tags } = req.body
    const images   = (req.files || []).map(f => `/uploads/complaints/${f.filename}`)
    const emergency = isEmergency(category)

    // Validate & coerce coordinates
    const lng = parseFloat(longitude)
    const lat  = parseFloat(latitude)
    const coords = [
      !isNaN(lng) ? lng : 78.1772,
      !isNaN(lat) ? lat : 26.2124,
    ]

    const complaint = await Complaint.create({
      title, description, category,
      area: area || 'Gwalior City',
      address,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      isEmergency: emergency,
      priority:    emergency ? 'emergency' : 'medium',
      citizen:     req.user._id,
      images,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      location:   { type: 'Point', coordinates: coords },
      department: getDepartment(category),
      dueDate:    new Date(Date.now() + 48 * 60 * 60 * 1000),
    })

    // +2 reputation for citizen: valid complaint submitted
    await User.findByIdAndUpdate(req.user._id, { $inc: { complaintCount: 1 } })
    await User.addReputation(req.user._id, 2)

    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id')
    if (admins.length) {
      await Notification.insertMany(admins.map(a => ({
        recipient: a._id, type: 'complaint_update',
        title:     `New ${emergency ? 'EMERGENCY ' : ''}complaint: ${category}`,
        message:   `${isAnonymous ? 'Anonymous' : req.user.name} filed: ${title}`,
        complaint: complaint._id,
        priority:  emergency ? 'emergency' : 'normal',
      })))
    }

    const io = getIO()
    io.to('role_admin').emit('new_complaint', { complaint })
    io.emit('complaint_feed_update', complaint)

    if (emergency) processEmergency(complaint)

    res.status(201).json({ success: true, message: 'Complaint filed successfully', complaint })
  } catch (err) { next(err) }
}

// ── GET MY COMPLAINTS (with proper stats) ────────────────────────────────────
exports.getMyComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query
    const q = { citizen: req.user._id }
    if (status)   q.status   = status
    if (category) q.category = category
    if (search)   q.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ]

    const total = await Complaint.countDocuments(q)
    const complaints = await Complaint.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * +limit)
      .limit(+limit)
      .populate('assignedTo', 'name department')
      .lean()

    res.json({ success: true, complaints, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) } })
  } catch (err) { next(err) }
}

// ── GET DASHBOARD STATS for citizen ─────────────────────────────────────────
exports.getMyCitizenStats = async (req, res, next) => {
  try {
    const uid = req.user._id
    const [total, pending, inProgress, resolved, rejected] = await Promise.all([
      Complaint.countDocuments({ citizen: uid }),
      Complaint.countDocuments({ citizen: uid, status: 'pending' }),
      Complaint.countDocuments({ citizen: uid, status: 'in-progress' }),
      Complaint.countDocuments({ citizen: uid, status: 'resolved' }),
      Complaint.countDocuments({ citizen: uid, status: 'rejected' }),
    ])
    // Recent 5 for dashboard feed
    const recent = await Complaint.find({ citizen: uid })
      .sort({ createdAt: -1 }).limit(5)
      .populate('assignedTo', 'name department')
      .lean()

    res.json({ success: true, stats: { total, pending, inProgress, resolved, rejected }, recent })
  } catch (err) { next(err) }
}

// ── GET SINGLE COMPLAINT ──────────────────────────────────────────────────────
exports.getComplaint = async (req, res, next) => {
  try {
    const c = await Complaint.findById(req.params.id)
      .populate('citizen',    'name email avatar area')
      .populate('assignedTo', 'name email department')
      .populate('assignedBy', 'name')
    if (!c) return res.status(404).json({ success: false, message: 'Complaint not found' })
    c.viewCount += 1; await c.save()
    res.json({ success: true, complaint: c })
  } catch (err) { next(err) }
}

// ── PUBLIC COMPLAINTS ─────────────────────────────────────────────────────────
exports.getPublicComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, area, category, status } = req.query
    const q = {}
    if (area)     q.area     = area
    if (category) q.category = category
    if (status)   q.status   = status
    const total = await Complaint.countDocuments(q)
    const complaints = await Complaint.find(q)
      .sort({ createdAt: -1 }).skip((page-1)*+limit).limit(+limit)
      .populate('citizen', 'name avatar area')
      .select('-adminNotes -officerNotes').lean()
    res.json({ success: true, complaints, total })
  } catch (err) { next(err) }
}

// ── UPVOTE ────────────────────────────────────────────────────────────────────
exports.upvoteComplaint = async (req, res, next) => {
  try {
    const c = await Complaint.findById(req.params.id)
    if (!c) return res.status(404).json({ success: false, message: 'Not found' })
    const idx = c.upvotes.findIndex(id => id.toString() === req.user._id.toString())
    let upvoted = false
    if (idx === -1) {
      c.upvotes.push(req.user._id); c.upvoteCount += 1; upvoted = true
      // +1 reputation to complaint's citizen when they receive an upvote
      if (c.citizen.toString() !== req.user._id.toString()) {
        await User.addReputation(c.citizen, 1)
      }
    } else {
      c.upvotes.splice(idx, 1); c.upvoteCount = Math.max(0, c.upvoteCount - 1)
    }
    await c.save()
    res.json({ success: true, upvoteCount: c.upvoteCount, upvoted })
  } catch (err) { next(err) }
}

// ── BOOKMARK ──────────────────────────────────────────────────────────────────
exports.bookmarkComplaint = async (req, res, next) => {
  try {
    const c = await Complaint.findById(req.params.id)
    if (!c) return res.status(404).json({ success: false, message: 'Not found' })
    const idx = c.bookmarks.findIndex(id => id.toString() === req.user._id.toString())
    if (idx === -1) c.bookmarks.push(req.user._id); else c.bookmarks.splice(idx, 1)
    await c.save()
    res.json({ success: true, bookmarked: idx === -1 })
  } catch (err) { next(err) }
}

// ── FEEDBACK / RATING ─────────────────────────────────────────────────────────
exports.submitFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body
    const c = await Complaint.findOne({ _id: req.params.id, citizen: req.user._id })
    if (!c) return res.status(404).json({ success: false, message: 'Not found' })
    if (c.status !== 'resolved') return res.status(400).json({ success: false, message: 'Only resolved complaints can be rated' })
    c.feedback = { rating, comment, submittedAt: new Date() }
    await c.save()
    // +5 reputation for citizen submitting feedback
    await User.addReputation(req.user._id, 5)
    res.json({ success: true, message: 'Feedback submitted' })
  } catch (err) { next(err) }
}

// ── REOPEN ────────────────────────────────────────────────────────────────────
exports.reopenComplaint = async (req, res, next) => {
  try {
    const c = await Complaint.findOne({ _id: req.params.id, citizen: req.user._id })
    if (!c) return res.status(404).json({ success: false, message: 'Not found' })
    if (c.status !== 'resolved') return res.status(400).json({ success: false, message: 'Only resolved complaints can be reopened' })
    c.status = 'reopened'
    c.timeline.push({ status: 'reopened', message: req.body.reason || 'Reopened by citizen', timestamp: new Date() })
    await c.save()
    getIO().to('role_admin').emit('complaint_reopened', { complaintId: c._id })
    res.json({ success: true, message: 'Complaint reopened' })
  } catch (err) { next(err) }
}
