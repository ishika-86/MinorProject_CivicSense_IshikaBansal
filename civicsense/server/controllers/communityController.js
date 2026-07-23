const { Post, Comment, Notification } = require('../models/index');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

exports.createPost = async (req, res, next) => {
  try {
    const { title, content, tags, area = '', category = 'General' } = req.body;
    const images = (req.files || []).map(f => `/uploads/community/${f.filename}`);
    const post = await Post.create({ title, content, tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [], area, category, author: req.user._id, images });
    await post.populate('author', 'name avatar area reputationScore');
    res.status(201).json({ success: true, post });
  } catch (err) { next(err); }
};

exports.getPosts = async (req, res, next) => {
  try {
    const { page=1, limit=15, search, area, category, sort='new' } = req.query;
    const q = {};
    if (area)     q.area     = area;
    if (category && category !== 'All') q.category = category;
    if (search)   q.$or = [{ title: { $regex: search, $options:'i' } }, { content: { $regex: search, $options:'i' } }];
    const sortMap = { new: { createdAt:-1 }, hot: { upvoteCount:-1 }, top: { upvoteCount:-1 } };
    const total = await Post.countDocuments(q);
    const posts = await Post.find(q).sort(sortMap[sort] || { createdAt:-1 }).skip((page-1)*limit).limit(+limit).populate('author','name avatar reputationScore area').lean();
    res.json({ success: true, posts, total });
  } catch (err) { next(err); }
};

exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }, { new: true }).populate('author','name avatar reputationScore');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) { next(err); }
};

exports.votePost = async (req, res, next) => {
  try {
    const { type } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Not found' });
    const uid = req.user._id.toString();
    const upIdx   = post.upvotes.findIndex(id => id.toString() === uid);
    const downIdx = post.downvotes.findIndex(id => id.toString() === uid);
    if (type === 'up') {
      if (upIdx === -1)   { post.upvotes.push(req.user._id); post.upvoteCount += 1; }
      else                { post.upvotes.splice(upIdx,1); post.upvoteCount -= 1; }
      if (downIdx !== -1) { post.downvotes.splice(downIdx,1); post.downvoteCount = Math.max(0, post.downvoteCount-1); }
    } else {
      if (downIdx === -1) { post.downvotes.push(req.user._id); post.downvoteCount += 1; }
      else                { post.downvotes.splice(downIdx,1); post.downvoteCount -= 1; }
      if (upIdx !== -1)   { post.upvotes.splice(upIdx,1); post.upvoteCount = Math.max(0, post.upvoteCount-1); }
    }
    await post.save();
    res.json({ success: true, upvoteCount: post.upvoteCount, downvoteCount: post.downvoteCount });
  } catch (err) { next(err); }
};

exports.addComment = async (req, res, next) => {
  try {
    const { content, parentId } = req.body;
    const comment = await Comment.create({ post: req.params.id, author: req.user._id, content, parent: parentId || null });
    await Post.findByIdAndUpdate(req.params.id, { $inc: { commentCount: 1 } });
    await comment.populate('author', 'name avatar reputationScore');
    res.status(201).json({ success: true, comment });
  } catch (err) { next(err); }
};

exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.id, parent: null }).sort({ createdAt:-1 }).populate('author','name avatar reputationScore').lean();
    res.json({ success: true, comments });
  } catch (err) { next(err); }
};

exports.convertToComplaint = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const { category = 'Other', area, latitude, longitude } = req.body;
    const complaint = await Complaint.create({
      title: post.title, description: post.content, category, area: area || post.area || 'Gwalior City',
      citizen: req.user._id, images: post.images,
      location: { type: 'Point', coordinates: [parseFloat(longitude)||78.1772, parseFloat(latitude)||26.2124] },
    });
    post.convertedToComplaint = complaint._id;
    await post.save();
    res.json({ success: true, message: 'Converted to complaint', complaint });
  } catch (err) { next(err); }
};
