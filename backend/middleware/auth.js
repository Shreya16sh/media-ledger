// A beginner-friendly "gatekeeper" for protected routes.
// It checks that the request carries a token, and that the token
// is one our server itself handed out during login.
//
// NOTE: This is a simplified stand-in for real authentication (like JWT).
// It's intentionally simple so it's easy to understand line by line.

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization']; // expected: "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  // Our login route creates tokens shaped like "medialedger-<username>-<timestamp>"
  if (!token || !token.startsWith('medialedger-')) {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }

  next(); // token looks fine -> let the request continue to the actual route
}

module.exports = requireAuth;
