const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPush } = require('./push');

// Saves an in-app notification and, if the user registered an FCM token, also sends a push.
// Never lets a notification failure break the main request.
const notify = async (user_id, message, type = 'system') => {
  try {
    await Notification.create({ user_id, message, type });
    const user = await User.findById(user_id).select('fcmToken');
    if (user && user.fcmToken) await sendPush(user.fcmToken, type, message);
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

module.exports = notify;
