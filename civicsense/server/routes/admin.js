const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));
router.get('/stats',                  ctrl.getDashboardStats);
router.get('/complaints',             ctrl.getAllComplaints);
router.put('/complaints/:id/assign',  ctrl.assignComplaint);
router.post('/complaints/bulk',       ctrl.bulkAction);
router.get('/analytics',              ctrl.getAnalytics);
router.get('/users',                  ctrl.getUsers);
router.put('/users/:id',              ctrl.updateUser);
router.get('/audit-logs',             ctrl.getAuditLogs);
router.get('/emergency-logs',         ctrl.getEmergencyLogs);

module.exports = router;
