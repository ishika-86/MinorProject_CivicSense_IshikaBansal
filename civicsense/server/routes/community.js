const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/communityController');
const { protect } = require('../middleware/auth');
const createUpload = require('../middleware/upload');

router.get('/',                 ctrl.getPosts);
router.get('/:id',              ctrl.getPost);
router.get('/:id/comments',     ctrl.getComments);

router.use(protect);
router.post('/',                createUpload('community').array('images',3), ctrl.createPost);
router.post('/:id/vote',        ctrl.votePost);
router.post('/:id/comment',     ctrl.addComment);
router.post('/:id/convert',     ctrl.convertToComplaint);

module.exports = router;
