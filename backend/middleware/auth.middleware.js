// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

/**
 * authenticateUser
 *
 * Express middleware that protects routes by verifying a JWT
 * supplied in the Authorization header.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 *
 * On success:  populates req.user with the decoded token payload
 *              { id, name, email } and calls next().
 * On failure:  returns a 401 JSON response and stops the chain.
 *
 * Usage:
 *   router.post('/create-table', authenticateUser, createTableController);
 */
const authenticateUser = (req, res, next) => {
  try {
    // ── Step 1: Read the Authorization header ──────────────────────────────
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is missing.',
      });
    }

    // ── Step 2: Validate "Bearer <token>" format ───────────────────────────
    // Split on the single space that separates the scheme from the token.
    // Any other format (no space, wrong scheme, extra parts) is rejected.
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header format must be: Bearer <token>.',
      });
    }

    const token = parts[1];

    // ── Step 3: Ensure JWT_SECRET is configured ────────────────────────────
    // Fail loudly on misconfiguration rather than silently accepting tokens.
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[auth.middleware] JWT_SECRET environment variable is not set.');
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred. Please try again later.',
      });
    }

    // ── Step 4: Verify the token ───────────────────────────────────────────
    // jwt.verify throws if the token is invalid, tampered with, or expired.
    // The decoded payload shape is: { id, name, email, iat, exp, iss }
    const decoded = jwt.verify(token, secret);

    // ── Step 5: Attach the decoded payload to the request ──────────────────
    // Downstream controllers access the authenticated user via req.user.
    req.user = {
      id:    decoded.id,
      name:  decoded.name,
      email: decoded.email,
      workspaceId: decoded.workspaceId,
    };

    // ── Step 6: Pass control to the next middleware / route handler ─────────
    return next();

  } catch (error) {
    // jwt.verify throws JsonWebTokenError (invalid signature / malformed)
    // and TokenExpiredError (exp in the past). Both map to 401.
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }

    // Any other unexpected error (e.g. missing secret caught above would not
    // reach here, but defensive fallback for future changes).
    console.error('[auth.middleware] unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
};

module.exports = { authenticateUser };
