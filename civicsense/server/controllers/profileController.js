const User = require('../models/User');
const { Notification } = require('../models/index');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -loginAttempts -lockUntil');
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, area, bio, notificationPrefs } = req.body;
    const update = {};
    if (name)  update.name  = name;
    if (phone) update.phone = phone;
    if (area)  update.area  = area;
    if (bio)   update.bio   = bio;
    if (notificationPrefs) update.notificationPrefs = typeof notificationPrefs === 'string' ? JSON.parse(notificationPrefs) : notificationPrefs;
    if (req.file) update.avatar = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password -loginAttempts');
    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) { next(err); }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const { page=1, limit=20 } = req.query;
    const total      = await Notification.countDocuments({ recipient: req.user._id });
    const unreadCount= await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt:-1 }).skip((page-1)*limit).limit(+limit).populate('complaint','complaintNumber title category');
    res.json({ success: true, notifications, total, unreadCount });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const q = { recipient: req.user._id, isRead: false };
    if (ids?.length) q._id = { $in: ids };
    await Notification.updateMany(q, { isRead: true });
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) { next(err); }
};
