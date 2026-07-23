const Complaint = require('../models/Complaint')
const User      = require('../models/User')
const { Notification } = require('../models/index')
const { getIO } = require('../socket/socketHandler')

exports.getAssigned = async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query
    const q = { assignedTo: req.user._id }
    if (status)   q.status   = status
    if (priority) q.priority = priority
    const total = await Complaint.countDocuments(q)
    const complaints = await Complaint.find(q)
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * +limit).limit(+limit)
      .populate('citizen', 'name email avatar phone')
      .lean()
    res.json({ success: true, complaints, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) } })
  } catch (err) { next(err) }
}

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, notes = '' } = req.body
    if (!['in-progress', 'resolved', 'rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' })

    const c = await Complaint.findOne({ _id: req.params.id, assignedTo: req.user._id })
    if (!c) return res.status(404).json({ success: false, message: 'Complaint not found or not assigned to you' })

    const proofImages = (req.files || []).map(f => `/uploads/proof/${f.filename}`)
    c.status       = status
    c.officerNotes = notes || c.officerNotes
    c.timeline.push({ status, message: notes || `Status updated to ${status}`, updatedBy: req.user._id, timestamp: new Date() })
    if (proofImages.length) c.proofImages.push(...proofImages)

    if (status === 'resolved') {
      c.resolvedAt = new Date()
      // Citizen: +10 for complaint resolved
      await User.findByIdAndUpdate(c.citizen, { $inc: { resolvedCount: 1 } })
      await User.addReputation(c.citizen, 10)
      // Officer: +15 for resolving complaint
      await User.addReputation(req.user._id, 15)
    }

    await c.save()
    await c.populate('citizen', 'name email _id')

    const msgs = {
      'in-progress': 'Your complaint is now being worked on.',
      resolved:      '✅ Your complaint has been resolved!',
      rejected:      'Your complaint was rejected. See officer notes.',
    }
    await Notification.create({
      recipient: c.citizen._id,
      type:      'complaint_update',
      title:     status === 'resolved' ? 'Complaint Resolved ✅' : 'Complaint Updated',
      message:   `${c.complaintNumber}: ${msgs[status]}`,
      complaint: c._id,
    })

    const io = getIO()
    io.to(`user_${c.citizen._id}`).emit('complaint_status_changed', { complaintId: c._id, status, message: msgs[status] })
    io.to('role_admin').emit('complaint_updated', { complaintId: c._id, status })

    res.json({ success: true, message: 'Status updated', complaint: c })
  } catch (err) { next(err) }
}

exports.respondToAssignment = async (req, res, next) => {
  try {
    const { action, reason = '' } = req.body
    const c = await Complaint.findOne({ _id: req.params.id, assignedTo: req.user._id })
    if (!c) return res.status(404).json({ success: false, message: 'Not found' })
    if (action === 'accept') {
      c.status = 'in-progress'
      c.timeline.push({ status: 'in-progress', message: 'Officer accepted the assignment', updatedBy: req.user._id })
      // Officer: +5 for accepting complaint
      await User.addReputation(req.user._id, 5)
    } else {
      c.assignedTo = null; c.status = 'pending'; c.rejectionReason = reason
      c.timeline.push({ status: 'pending', message: `Officer rejected: ${reason || 'No reason given'}`, updatedBy: req.user._id })
    }
    await c.save()
    res.json({ success: true, message: `Assignment ${action}ed`, complaint: c })
  } catch (err) { next(err) }
}

exports.getPerformance = async (req, res, next) => {
  try {
    const id = req.user._id
    const [total, resolved, inProgress, pending] = await Promise.all([
      Complaint.countDocuments({ assignedTo: id }),
      Complaint.countDocuments({ assignedTo: id, status: 'resolved' }),
      Complaint.countDocuments({ assignedTo: id, status: 'in-progress' }),
      Complaint.countDocuments({ assignedTo: id, status: { $in: ['assigned', 'pending'] } }),
    ])
    const recent = await Complaint.find({ assignedTo: id, status: 'resolved' })
      .sort({ resolvedAt: -1 }).limit(5)
      .select('title complaintNumber resolvedAt category')
    res.json({ success: true, performance: { total, resolved, inProgress, pending, resolutionRate: total ? Math.round((resolved / total) * 100) : 0 }, recentResolved: recent })
  } catch (err) { next(err) }
}
