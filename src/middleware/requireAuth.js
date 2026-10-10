const { verifyToken } = require('../auth');

// Rejects requests without a valid "Authorization: Bearer <token>" header
// and exposes the authenticated user as req.user
function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: Number(payload.sub), email: payload.email };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;
