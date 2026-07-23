const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getNotifications, markRead } = require('../controllers/profileController');
router.use(protect);
router.get('/',       getNotifications);
router.put('/read',   markRead);
module.exports = router;
