// api/delete-file.js
// Deletes a file from R2 by key
// Keys never leave the server

const crypto = require('crypto');

function sha256hex(data) {
  return crypto.createHash('sha256').update(
    typeof data === 'string' ? data : Buffer.from(data)
  ).digest('hex');
}
function hmac(key, msg) {
  return crypto.createHmac('sha256',
    Buffer.isBuffer(key) ? key : Buffer.from(key)
  ).update(msg).digest();
}

function presignDelete(objectKey, expiresIn = 600) {
  const endpoint  = process.env.R2_ENDPOINT;
  const bucket    = process.env.R2_BUCKET;
  const accessKey = process.env.R2_ACCESS_KEY;
  const secretKey = process.env.R2_SECRET_KEY;
  const region    = process.env.R2_REGION || 'auto';

  const now        = new Date();
  const isoDate    = now.toISOString().replace(/[-:]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const shortDate  = isoDate.slice(0, 8);
  const host       = endpoint.replace(/^https?:\/\//, '');
  const path       = `/${bucket}/${objectKey}`;
  const credScope  = `${shortDate}/${region}/s3/aws4_request`;
  const credential = `${accessKey}/${credScope}`;

  const qp = [
    ['X-Amz-Algorithm',     'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential',    credential],
    ['X-Amz-Date',          isoDate],
    ['X-Amz-Expires',       String(expiresIn)],
    ['X-Amz-SignedHeaders', 'host'],
  ].sort(([a], [b]) => a.localeCompare(b));

  const canonQuery   = qp.map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
  const canonHeaders = `host:${host}\n`;
  const canonReq     = ['DELETE', path, canonQuery, canonHeaders, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const strToSign    = `AWS4-HMAC-SHA256\n${isoDate}\n${credScope}\n${sha256hex(canonReq)}`;

  const kDate    = hmac('AWS4' + secretKey, shortDate);
  const kRegion  = hmac(kDate,    region);
  const kService = hmac(kRegion,  's3');
  const kSigning = hmac(kService, 'aws4_request');
  const sig      = hmac(kSigning, strToSign).toString('hex');

  return `${endpoint}/${bucket}/${objectKey}?${canonQuery}&X-Amz-Signature=${sig}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { key } = req.body || {};
  if (!key) {
    return res.status(400).json({ error: 'key required' });
  }

  // Security: only allow deleting from cars/ prefix
  if (!key.startsWith('cars/')) {
    return res.status(403).json({ error: 'Forbidden key path' });
  }

  try {
    const deleteUrl = presignDelete(key);
    const r2res = await fetch(deleteUrl, { method: 'DELETE' });
    if (!r2res.ok && r2res.status !== 204 && r2res.status !== 404) {
      const txt = await r2res.text().catch(() => '');
      return res.status(500).json({ error: `R2 delete failed: ${r2res.status} ${txt.slice(0, 100)}` });
    }
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};