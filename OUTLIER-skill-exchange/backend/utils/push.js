// Firebase Cloud Messaging push (optional).
// Push only turns on if a service account key file exists at ./serviceAccountKey.json
// (or the path in FIREBASE_KEY_PATH). Without it, the app still works with in-app notifications only.
const fs = require('fs');
const path = require('path');

let messaging = null;
let tried = false;

const init = () => {
  if (tried) return messaging;
  tried = true;
  try {
    const keyPath = process.env.FIREBASE_KEY_PATH || path.join(__dirname, '..', 'serviceAccountKey.json');
    if (!fs.existsSync(keyPath)) {
      console.log('Push notifications disabled (no serviceAccountKey.json found). In-app notifications still work.');
      return null;
    }
    const { initializeApp, cert } = require('firebase-admin/app');
    const { getMessaging } = require('firebase-admin/messaging');
    initializeApp({ credential: cert(JSON.parse(fs.readFileSync(keyPath, 'utf8'))) });
    messaging = getMessaging();
    console.log('Firebase push notifications enabled');
  } catch (err) {
    console.error('Firebase init failed, push disabled:', err.message);
  }
  return messaging;
};

const TITLES = {
  teacher_alert: 'New Learner Request! 🎓',
  rescue_match: '🎉 Rescue Match Found!',
  session: 'Session update',
  system: 'OUTLIER'
};

// Never throws; push is best-effort
const sendPush = async (fcmToken, type, body) => {
  const m = init();
  if (!m || !fcmToken) return false;
  try {
    await m.send({
      token: fcmToken,
      notification: { title: TITLES[type] || TITLES.system, body },
      data: { type: String(type) }
    });
    return true;
  } catch (err) {
    console.error('Push failed:', err.message);
    return false;
  }
};

module.exports = { sendPush };
