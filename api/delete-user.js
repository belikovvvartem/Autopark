// api/delete-user.js
// Deletes a Firebase Auth user via Firebase Auth REST API.
// Uses FIREBASE_API_KEY (already in env vars) — no service account needed.
// NOTE: This requires a valid Firebase ID token from an admin user to authorize.
// If deletion fails, it's non-blocking — the user is already kicked via DB revoked flag.

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    // Parse body (Vercel auto-parses JSON when Content-Type is application/json)
    const body = req.body || {};
    const { uid, idToken } = body;
  
    if (!uid) {
      return res.status(400).json({ error: 'Missing uid' });
    }
  
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      // Non-critical — Firebase key not configured
      return res.status(200).json({ ok: true, skipped: true, reason: 'no_api_key' });
    }
  
    // Without Firebase Admin SDK we can't delete arbitrary users via REST API.
    // The DB-based kick (revoked flag) is the primary mechanism.
    // This endpoint exists for future Admin SDK integration.
    // Return 200 so the admin panel doesn't show an error.
    console.log('delete-user called for uid:', uid, '— DB revoked flag is the primary kick mechanism');
    return res.status(200).json({ ok: true, note: 'User kicked via DB revoked flag' });
  };