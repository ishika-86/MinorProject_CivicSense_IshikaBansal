const express    = require('express')
const router     = express.Router()
const ctrl       = require('../controllers/complaintController')
const { protect }= require('../middleware/auth')
const createUpload = require('../middleware/upload')

// Public
router.get('/public', ctrl.getPublicComplaints)
router.get('/:id',    ctrl.getComplaint)

// Protected
router.use(protect)
router.post('/', createUpload('complaints').array('images', 5), ctrl.createComplaint)
router.get('/my/list',      ctrl.getMyComplaints)
router.get('/my/stats',     ctrl.getMyCitizenStats)   // NEW: proper stats endpoint
router.post('/:id/upvote',  ctrl.upvoteComplaint)
router.post('/:id/bookmark',ctrl.bookmarkComplaint)
router.post('/:id/feedback',ctrl.submitFeedback)
router.post('/:id/reopen',  ctrl.reopenComplaint)

module.exports = router
