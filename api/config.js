// api/config.js
// Serves public config to the frontend.
// Firebase client keys are not secret (they're protected by Firebase Security Rules),
// but keeping them here means you change one place (env vars) not the HTML.

module.exports = function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    res.setHeader('Cache-Control', 's-maxage=3600');
    res.status(200).json({
      firebase: {
        apiKey:            process.env.FIREBASE_API_KEY,
        authDomain:        process.env.FIREBASE_AUTH_DOMAIN,
        databaseURL:       process.env.FIREBASE_DATABASE_URL,
        projectId:         process.env.FIREBASE_PROJECT_ID,
        storageBucket:     process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId:             process.env.FIREBASE_APP_ID,
      },
      r2PublicBase: process.env.R2_PUBLIC_BASE,
    });
  };