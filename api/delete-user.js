// api/delete-user.js
// Deletes a Firebase Auth user by UID using Firebase Admin SDK.
//
// Required Vercel env var:
//   FIREBASE_SERVICE_ACCOUNT = full JSON content of Firebase service account key
//
// How to get service account key:
//   Firebase Console → Project Settings → Service Accounts → Generate new private key
//   Copy the entire JSON content into Vercel env var FIREBASE_SERVICE_ACCOUNT

let adminApp = null;

function getAdmin() {
  if (adminApp) return adminApp;
  const admin = require('firebase-admin');
  if (admin.apps.length) {
    adminApp = admin;
    return adminApp;
  }
  const svcRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svcRaw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set');
  const svc = JSON.parse(svcRaw);
  admin.initializeApp({ credential: admin.credential.cert(svc) });
  adminApp = admin;
  return adminApp;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid } = req.body || {};
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  try {
    const admin = getAdmin();
    await admin.auth().deleteUser(uid);
    console.log('Deleted Firebase Auth user:', uid);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('delete-user error:', e.code, e.message);

    // User not found — already deleted, treat as success
    if (e.code === 'auth/user-not-found') {
      return res.status(200).json({ ok: true, note: 'user not found' });
    }

    // Service account not configured
    if (e.message && e.message.includes('FIREBASE_SERVICE_ACCOUNT')) {
      return res.status(200).json({
        ok: false,
        error: 'Service account not configured. Add FIREBASE_SERVICE_ACCOUNT to Vercel env vars.',
      });
    }

    return res.status(500).json({ ok: false, error: e.message });
  }
};