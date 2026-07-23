const mongoose = require('mongoose');

// NOTIFICATION
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['complaint_update','assignment','emergency','community','system','escalation','resolution'], required: true },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  isRead:    { type: Boolean, default: false },
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  link:      { type: String, default: '' },
  priority:  { type: String, enum: ['normal','high','emergency'], default: 'normal' },
}, { timestamps: true });

// POST
const postSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true },
  content:  { type: String, required: true },
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  images:   [String],
  tags:     [String],
  area:     { type: String, default: '' },
  category: { type: String, default: 'General' },
  upvotes:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  upvoteCount:   { type: Number, default: 0 },
  downvoteCount: { type: Number, default: 0 },
  commentCount:  { type: Number, default: 0 },
  bookmarks:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  convertedToComplaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  isHot:     { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
}, { timestamps: true });

// COMMENT
const commentSchema = new mongoose.Schema({
  post:        { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:     { type: String, required: true },
  parent:      { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  upvotes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  upvoteCount: { type: Number, default: 0 },
}, { timestamps: true });

// EMERGENCY LOG
const emergencyLogSchema = new mongoose.Schema({
  complaint:           { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  category:            { type: String, required: true },
  triggerType:         { type: String, required: true },
  message:             { type: String, required: true },
  notifiedAuthorities: [String],
  notifiedUsers:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] },
  area:       { type: String },
  isResolved: { type: Boolean, default: false },
  resolvedAt: Date,
}, { timestamps: true });
emergencyLogSchema.index({ location: '2dsphere' });

// AUDIT LOG
const auditLogSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action:  { type: String, required: true },
  targetId:{ type: mongoose.Schema.Types.ObjectId },
  details: mongoose.Schema.Types.Mixed,
  ip:      String,
}, { timestamps: true });

module.exports = {
  Notification:  mongoose.model('Notification',  notificationSchema),
  Post:          mongoose.model('Post',           postSchema),
  Comment:       mongoose.model('Comment',        commentSchema),
  EmergencyLog:  mongoose.model('EmergencyLog',   emergencyLogSchema),
  AuditLog:      mongoose.model('AuditLog',       auditLogSchema),
};
