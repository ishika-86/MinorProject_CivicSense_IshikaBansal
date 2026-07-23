const Complaint = require('../models/Complaint');
const User      = require('../models/User');
const { Notification, EmergencyLog, AuditLog } = require('../models/index');
const { getIO } = require('../socket/socketHandler');

exports.getAllComplaints = async (req, res, next) => {
  try {
    const { page=1, limit=20, status, category, priority, area, search, assignedTo } = req.query;
    const q = {};
    if (status)     q.status     = status;
    if (category)   q.category   = category;
    if (priority)   q.priority   = priority;
    if (area)       q.area       = area;
    if (assignedTo) q.assignedTo = assignedTo;
    if (search) q.$or = [{ title: { $regex: search, $options:'i' } }, { complaintNumber: { $regex: search, $options:'i' } }];

    const total = await Complaint.countDocuments(q);
    const complaints = await Complaint.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit)
      .populate('citizen','name email avatar phone area').populate('assignedTo','name email department').lean();
    res.json({ success: true, complaints, pagination: { page:+page, limit:+limit, total, pages: Math.ceil(total/limit) } });
  } catch (err) { next(err); }
};

exports.assignComplaint = async (req, res, next) => {
  try {
    const { officerId, notes = '' } = req.body;
    const officer = await User.findOne({ _id: officerId, role: 'officer', status: 'active' });
    if (!officer) return res.status(404).json({ success: false, message: 'Officer not found' });

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, {
      assignedTo: officerId, assignedBy: req.user._id, status: 'assigned', adminNotes: notes,
      $push: { timeline: { status: 'assigned', message: `Assigned to ${officer.name}`, updatedBy: req.user._id, timestamp: new Date() } },
    }, { new: true }).populate('citizen','name email _id').populate('assignedTo','name department');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    await Notification.insertMany([
      { recipient: officerId, type: 'assignment', title: 'New Complaint Assigned', message: `${complaint.complaintNumber}: ${complaint.title}`, complaint: complaint._id },
      { recipient: complaint.citizen._id, type: 'complaint_update', title: 'Complaint Assigned', message: `${complaint.complaintNumber} assigned to an officer.`, complaint: complaint._id },
    ]);

    const io = getIO();
    io.to(`user_${officerId}`).emit('new_assignment', complaint);
    io.to(`user_${complaint.citizen._id}`).emit('complaint_status_changed', { complaintId: complaint._id, status: 'assigned' });
    await AuditLog.create({ user: req.user._id, action: 'ASSIGN_COMPLAINT', targetId: complaint._id, details: { officerId } });
    await User.addReputation(req.user._id, 5); // Admin +5 for assignment

    res.json({ success: true, message: 'Assigned successfully', complaint });
  } catch (err) { next(err); }
};

exports.bulkAction = async (req, res, next) => {
  try {
    const { ids, action, data = {} } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: 'No IDs provided' });
    const updates = { assign: { assignedTo: data.officerId, status: 'assigned' }, escalate: { status: 'escalated' }, close: { status: 'resolved', resolvedAt: new Date() }, priority: { priority: data.priority } };
    if (!updates[action]) return res.status(400).json({ success: false, message: 'Invalid action' });
    await Complaint.updateMany({ _id: { $in: ids } }, updates[action]);
    await AuditLog.create({ user: req.user._id, action: `BULK_${action.toUpperCase()}`, details: { count: ids.length } });
    res.json({ success: true, message: `${ids.length} complaints updated` });
  } catch (err) { next(err); }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [total, pending, resolved, emergency, inProgress] = await Promise.all([
      Complaint.countDocuments(), Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'resolved' }), Complaint.countDocuments({ priority: 'emergency', status: { $ne: 'resolved' } }),
      Complaint.countDocuments({ status: 'in-progress' }),
    ]);
    const [totalUsers, citizens, officers] = await Promise.all([
      User.countDocuments({ status: 'active' }), User.countDocuments({ role: 'citizen', status: 'active' }), User.countDocuments({ role: 'officer', status: 'active' }),
    ]);
    const recentEmergencies = await EmergencyLog.find().sort({ createdAt: -1 }).limit(5).populate('complaint','title category area complaintNumber');
    res.json({ success: true, stats: { total, pending, resolved, emergency, inProgress }, users: { total: totalUsers, citizens, officers }, recentEmergencies });
  } catch (err) { next(err); }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const since = new Date(Date.now() - +period * 86400000);

    const [categoryData, areaData, trendData, deptData, statusData] = await Promise.all([
      Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Complaint.aggregate([{ $group: { _id: '$area', count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status','resolved'] }, 1, 0] } } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      Complaint.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Complaint.aggregate([{ $group: { _id: '$department', total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status','resolved'] }, 1, 0] } } } }, { $sort: { total: -1 } }]),
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const avgArr = await Complaint.aggregate([
      { $match: { status: 'resolved', resolvedAt: { $exists: true } } },
      { $project: { t: { $subtract: ['$resolvedAt', '$createdAt'] } } },
      { $group: { _id: null, avg: { $avg: '$t' } } },
    ]);

    const insights = {
      mostAffectedArea: areaData[0]?._id || 'N/A',
      topCategory:      categoryData[0]?._id || 'N/A',
      avgResolutionHours: avgArr[0] ? Math.round(avgArr[0].avg / 3600000) : 0,
      suggestions: [
        `${areaData[0]?._id || 'Lashkar'} has the highest complaint density — increase patrol.`,
        `${categoryData[0]?._id || 'Road Damage'} is the most reported issue — prioritize budget.`,
        'Consider deploying more officers during 9 AM – 12 PM peak hours.',
      ],
    };

    res.json({ success: true, categoryData, areaData, trendData, deptData, statusData, insights });
  } catch (err) { next(err); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page=1, limit=20, role, status, search } = req.query;
    const q = {};
    if (role)   q.role   = role;
    if (status) q.status = status;
    if (search) q.$or = [{ name: { $regex: search, $options:'i' } }, { email: { $regex: search, $options:'i' } }];
    const total = await User.countDocuments(q);
    const users = await User.find(q).select('-password -loginAttempts').sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit);
    res.json({ success: true, users, total });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await AuditLog.create({ user: req.user._id, action: 'UPDATE_USER', targetId: user._id, details: req.body });
    res.json({ success: true, message: 'User updated', user });
  } catch (err) { next(err); }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page=1, limit=50 } = req.query;
    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find().sort({ createdAt:-1 }).skip((page-1)*limit).limit(+limit).populate('user','name email role');
    res.json({ success: true, logs, total });
  } catch (err) { next(err); }
};

exports.getEmergencyLogs = async (req, res, next) => {
  try {
    const logs = await EmergencyLog.find().sort({ createdAt:-1 }).limit(50).populate('complaint','title category area complaintNumber status priority');
    res.json({ success: true, logs });
  } catch (err) { next(err); }
};

// ── ASSIGN with reputation ────────────────────────────────────────────────────
// (Existing assignComplaint already handles this; adding admin reputation boost)
// Called from route: PUT /api/admin/complaints/:id/assign
// The existing function in adminController handles this fine.
// We just need to add: Admin +5 reputation after successful assignment
