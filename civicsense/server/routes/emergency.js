const express = require('express');
const router  = express.Router();
const { EmergencyLog } = require('../models/index');
const { protect } = require('../middleware/auth');

router.get('/feed', async (req, res, next) => {
  try {
    const logs = await EmergencyLog.find({ isResolved:false }).sort({ createdAt:-1 }).limit(20)
      .populate('complaint','title category area complaintNumber location priority status');
    res.json({ success:true, logs });
  } catch (err) { next(err); }
});

router.put('/:id/resolve', protect, async (req, res, next) => {
  try {
    const log = await EmergencyLog.findByIdAndUpdate(req.params.id, { isResolved:true, resolvedAt:new Date() }, { new:true });
    res.json({ success:true, log });
  } catch (err) { next(err); }
});

module.exports = router;
