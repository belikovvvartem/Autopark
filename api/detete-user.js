// api/delete-user.js
// Deletes a Firebase Auth user by UID.
// Requires FIREBASE_SERVICE_ACCOUNT env var (JSON of service account key).

const https = require('https');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { uid } = req.body || {};
  if (!uid) return res.status(400).json({ error: 'Missing uid' });

  // Get service account from env
  const svcRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svcRaw) {
    // No service account configured — return 200 silently (non-critical)
    console.warn('FIREBASE_SERVICE_ACCOUNT not set — skipping Auth deletion');
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    // Lazy-load firebase-admin
    let admin;
    try { admin = require('firebase-admin'); } catch(e) {
      console.warn('firebase-admin not installed');
      return res.status(200).json({ ok: true, skipped: true });
    }

    // Init only once
    if (!admin.apps.length) {
      const svc = JSON.parse(svcRaw);
      admin.initializeApp({ credential: admin.credential.cert(svc) });
    }

    await admin.auth().deleteUser(uid);
    return res.status(200).json({ ok: true });
  } catch(e) {
    console.error('delete-user error:', e.message);
    // Non-critical — don't block the admin panel if this fails
    return res.status(200).json({ ok: true, error: e.message });
  }
};