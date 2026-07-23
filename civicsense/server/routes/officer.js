// officer.js
const express = require('express');
const r1 = express.Router();
const oc = require('../controllers/officerController');
const { protect, authorize } = require('../middleware/auth');
const createUpload = require('../middleware/upload');
r1.use(protect, authorize('officer','admin'));
r1.get('/complaints',                 oc.getAssigned);
r1.put('/complaints/:id/status',      createUpload('proof').array('proofImages',5), oc.updateStatus);
r1.put('/complaints/:id/respond',     oc.respondToAssignment);
r1.get('/performance',                oc.getPerformance);
module.exports = r1;
