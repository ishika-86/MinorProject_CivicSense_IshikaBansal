const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/profileController');
const createUpload = require('../middleware/upload');
router.use(protect);
router.get('/',  getProfile);
router.put('/',  createUpload('avatars').single('avatar'), updateProfile);
module.exports = router;
