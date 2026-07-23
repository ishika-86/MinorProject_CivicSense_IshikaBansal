const express   = require('express');
const router    = express.Router();
const Complaint = require('../models/Complaint');
const { EmergencyLog } = require('../models/index');

router.get('/public', async (req, res, next) => {
  try {
    const [total, resolved, pending, emergency] = await Promise.all([
      Complaint.countDocuments(), Complaint.countDocuments({ status:'resolved' }),
      Complaint.countDocuments({ status:'pending' }), Complaint.countDocuments({ priority:'emergency' }),
    ]);
    const [categoryData, areaData, recentComplaints, emergencyComplaints] = await Promise.all([
      Complaint.aggregate([{ $group:{ _id:'$category', count:{ $sum:1 } } }, { $sort:{ count:-1 } }, { $limit:8 }]),
      Complaint.aggregate([{ $group:{ _id:'$area', count:{ $sum:1 } } }, { $sort:{ count:-1 } }, { $limit:10 }]),
      Complaint.find({ isAnonymous:false }).sort({ createdAt:-1 }).limit(10).populate('citizen','name avatar').select('title category area status priority createdAt upvoteCount complaintNumber location').lean(),
      Complaint.find({ isEmergency:true, status:{ $ne:'resolved' } }).sort({ createdAt:-1 }).limit(5).select('title category area priority createdAt complaintNumber location').lean(),
    ]);
    res.json({ success:true, stats:{ total, resolved, pending, emergency }, categoryData, areaData, recentComplaints, emergencyComplaints });
  } catch (err) { next(err); }
});

router.get('/map', async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ 'location.coordinates':{ $exists:true } })
      .select('location category priority status area complaintNumber isEmergency title').limit(500).lean();
    res.json({ success:true, complaints });
  } catch (err) { next(err); }
});

module.exports = router;
