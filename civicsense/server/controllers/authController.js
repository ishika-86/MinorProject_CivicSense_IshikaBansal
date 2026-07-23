const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { AuditLog } = require('../models/index');

const genToken = (user) => jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const userObj = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, status: u.status, avatar: u.avatar, area: u.area, phone: u.phone, reputationScore: u.reputationScore, department: u.department, assignedArea: u.assignedArea });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'citizen', phone = '', area = '', adminCode } = req.body;

    if (role === 'admin'   && adminCode !== process.env.ADMIN_CODE)   return res.status(400).json({ success: false, message: 'Invalid admin registration code' });
    if (role === 'officer' && adminCode !== process.env.OFFICER_CODE) return res.status(400).json({ success: false, message: 'Invalid officer registration code' });

    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, role, phone, area, status: 'active' });
    await AuditLog.create({ user: user._id, action: 'REGISTER', details: { role } });

    res.status(201).json({ success: true, message: 'Registration successful', token: genToken(user), user: userObj(user) });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (user.isLocked()) {
      const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ success: false, message: `Account locked. Try again in ${mins} minute(s).` });
    }

    if (!(await user.matchPassword(password))) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status === 'blocked') return res.status(403).json({ success: false, message: 'Account blocked. Contact admin.' });

    user.loginAttempts = 0; user.lockUntil = undefined; user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    await AuditLog.create({ user: user._id, action: 'LOGIN', ip: req.ip });

    res.json({ success: true, message: 'Login successful', token: genToken(user), user: userObj(user) });
  } catch (err) { next(err); }
};

exports.demoLogin = async (req, res, next) => {
  try {
    const { role } = req.body;
    const emails = { citizen: 'citizen@demo.civicsense.city', admin: 'admin@demo.civicsense.city', officer: 'officer@demo.civicsense.city' };
    const email = emails[role];
    if (!email) return res.status(400).json({ success: false, message: 'Invalid demo role' });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`, email, password: 'Demo@123456!', role, status: 'active', area: 'Lashkar', phone: '9876543210', department: role === 'officer' ? 'Road & Infrastructure' : '' });
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: `Demo ${role} login`, token: genToken(user), user: userObj(user) });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -loginAttempts -lockUntil');
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.logout = async (req, res) => {
  await AuditLog.create({ user: req.user._id, action: 'LOGOUT' }).catch(() => {});
  res.json({ success: true, message: 'Logged out' });
};
