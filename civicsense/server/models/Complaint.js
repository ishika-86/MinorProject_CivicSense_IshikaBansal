const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String, required: true,
    enum: ['Road Damage','Water Supply','Electricity','Garbage','Sewage','Street Light','Tree Fall','Fire Hazard','Accident','Animal Attack','Dangerous Animal','Electric Hazard','Public Safety','Encroachment','Noise Pollution','Other'],
  },
  status:   { type: String, enum: ['pending','assigned','in-progress','resolved','rejected','escalated','reopened'], default: 'pending' },
  priority: { type: String, enum: ['low','medium','high','emergency'], default: 'medium' },
  isAnonymous: { type: Boolean, default: false },
  isEmergency: { type: Boolean, default: false },

  citizen:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  area:    { type: String, required: true },
  address: { type: String, default: '' },
  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [78.1772, 26.2124] },
  },

  images:      [String],
  proofImages: [String],

  upvotes:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  upvoteCount: { type: Number, default: 0 },

  timeline: [{
    status:    String,
    message:   String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  }],

  feedback: { rating: { type: Number, min: 1, max: 5 }, comment: String, submittedAt: Date },

  adminNotes:      { type: String, default: '' },
  officerNotes:    { type: String, default: '' },
  rejectionReason: { type: String, default: '' },

  escalatedAt:    Date,
  escalationLevel:{ type: Number, default: 0 },
  resolvedAt:     Date,
  dueDate:        Date,

  isDuplicate: { type: Boolean, default: false },
  tags:        [String],
  department:  { type: String, default: '' },
  viewCount:   { type: Number, default: 0 },
  complaintNumber: { type: String, unique: true },
}, { timestamps: true });

complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ citizen: 1 });
complaintSchema.index({ assignedTo: 1 });

complaintSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Complaint').countDocuments();
    this.complaintNumber = 'CVC' + String(count + 1).padStart(6, '0');
    this.timeline.push({ status: 'pending', message: 'Complaint registered successfully.', timestamp: new Date() });
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
