const Notification = require('../models/Notification');

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user._id }).sort({ createdAt: -1 });
    res.json({ unread: notifications.filter(n => !n.isRead).length, notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id }, { isRead: true }, { new: true });
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    res.json(n);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user_id: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
