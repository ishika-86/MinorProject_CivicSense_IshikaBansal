const logger = require('./logger');

const EMERGENCY_CONFIG = {
  'Fire Hazard':       { type: 'FIRE',           msg: '🔥 Fire hazard reported. Emergency response initiated.',              authorities: ['Fire Department', 'Civil Defence'],                  radius: 2000, priority: 'emergency' },
  'Accident':          { type: 'ACCIDENT',        msg: '🚗 Accident reported. Immediate assistance required.',               authorities: ['Police Department', 'Nearby Hospitals'],             radius: 3000, priority: 'emergency' },
  'Animal Attack':     { type: 'ANIMAL_ATTACK',   msg: '🐕 Dangerous animal reported nearby. Stay alert.',                  authorities: ['Animal Control (Nagar Nigam)', 'Police'],            radius: 1500, priority: 'high'      },
  'Dangerous Animal':  { type: 'DANGEROUS_ANIMAL',msg: '🐕 Dangerous animal reported nearby. Stay alert.',                  authorities: ['Animal Control (Nagar Nigam)'],                       radius: 1500, priority: 'high'      },
  'Electric Hazard':   { type: 'ELECTRIC_HAZARD', msg: '⚡ Electric hazard detected. Avoid the area immediately.',          authorities: ['Electricity Board (MPMKVVCL)', 'Civil Defence'],     radius: 1000, priority: 'emergency' },
  'Public Safety':     { type: 'PUBLIC_SAFETY',   msg: '🚨 Public safety threat reported. Stay cautious.',                  authorities: ['Police Department', 'Municipal Corp'],                radius: 2000, priority: 'emergency' },
};

const isEmergency = (category) => !!EMERGENCY_CONFIG[category];

const processEmergency = async (complaint) => {
  const config = EMERGENCY_CONFIG[complaint.category];
  if (!config) return null;

  try {
    const User         = require('../models/User');
    const { EmergencyLog, Notification } = require('../models/index');
    const { getIO }    = require('../socket/socketHandler');

    const nearbyUsers = await User.find({
      location: { $near: { $geometry: complaint.location, $maxDistance: config.radius } },
      status: 'active',
      'notificationPrefs.emergency': true,
    }).select('_id').lean();

    const admins = await User.find({ role: { $in: ['admin', 'officer'] }, status: 'active' }).select('_id').lean();

    const allIds = [...new Set([...nearbyUsers, ...admins].map(u => u._id.toString()))];

    const log = await EmergencyLog.create({
      complaint: complaint._id,
      category: complaint.category,
      triggerType: config.type,
      message: config.msg,
      notifiedAuthorities: config.authorities,
      notifiedUsers: nearbyUsers.map(u => u._id),
      location: complaint.location,
      area: complaint.area,
    });

    if (allIds.length > 0) {
      const notifs = allIds.map(uid => ({
        recipient: uid,
        type: 'emergency',
        title: `🚨 Emergency: ${complaint.category}`,
        message: config.msg,
        complaint: complaint._id,
        priority: 'emergency',
      }));
      await Notification.insertMany(notifs);
    }

    const io = getIO();
    const payload = {
      id: log._id,
      complaintId: complaint._id,
      complaintNumber: complaint.complaintNumber,
      category: complaint.category,
      triggerType: config.type,
      message: config.msg,
      authorities: config.authorities,
      area: complaint.area,
      location: complaint.location,
      priority: config.priority,
      timestamp: new Date(),
    };

    io.emit('emergency_alert', payload);
    allIds.forEach(uid => io.to(`user_${uid}`).emit('notification', { type: 'emergency', title: `🚨 Emergency: ${complaint.category}`, message: config.msg, priority: 'emergency' }));

    logger.info(`Emergency processed: ${config.type} | ${complaint.area} | ${allIds.length} users notified`);
    return log;
  } catch (err) {
    logger.error('Emergency processing failed: ' + err.message);
    return null;
  }
};

const getDepartment = (category) => {
  const map = { 'Road Damage':'PWD', 'Water Supply':'PHE', 'Electricity':'Electricity Board', 'Garbage':'Nagar Nigam', 'Sewage':'PHE', 'Street Light':'Electricity Board', 'Tree Fall':'Forest Dept', 'Fire Hazard':'Fire Department', 'Accident':'Police', 'Animal Attack':'Animal Control', 'Dangerous Animal':'Animal Control', 'Electric Hazard':'MPMKVVCL', 'Public Safety':'Police', 'Encroachment':'Nagar Nigam', 'Noise Pollution':'Police', 'Other':'General' };
  return map[category] || 'General';
};

module.exports = { isEmergency, processEmergency, getDepartment, EMERGENCY_CONFIG };
