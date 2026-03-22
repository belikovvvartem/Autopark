// api/config.js — serves Firebase + R2 config from Vercel env vars

module.exports = function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const cfg = {
      firebase: {
        apiKey:            process.env.FIREBASE_API_KEY            || null,
        authDomain:        process.env.FIREBASE_AUTH_DOMAIN        || null,
        databaseURL:       process.env.FIREBASE_DATABASE_URL       || null,
        projectId:         process.env.FIREBASE_PROJECT_ID         || null,
        storageBucket:     process.env.FIREBASE_STORAGE_BUCKET     || null,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || null,
        appId:             process.env.FIREBASE_APP_ID             || null,
      },
      r2PublicBase: process.env.R2_PUBLIC_BASE || null,
    };
  
    // Check that critical vars are set
    if (!cfg.firebase.apiKey || !cfg.firebase.databaseURL) {
      console.error('Missing env vars:', JSON.stringify({
        FIREBASE_API_KEY:      !!process.env.FIREBASE_API_KEY,
        FIREBASE_DATABASE_URL: !!process.env.FIREBASE_DATABASE_URL,
        FIREBASE_PROJECT_ID:   !!process.env.FIREBASE_PROJECT_ID,
      }));
      return res.status(500).json({
        error: 'Server misconfiguration: environment variables not set. Add them in Vercel Dashboard → Settings → Environment Variables.'
      });
    }
  
    res.setHeader('Cache-Control', 'no-store'); // don't cache during debugging
    return res.status(200).json(cfg);
  };