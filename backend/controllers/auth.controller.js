// controllers/auth.controller.js
const { registerUser, loginUser } = require("../services/auth.service");

/**
 * Centralised error responder.
 * Reads the statusCode attached by the service/validator layer.
 * Masks all 5xx errors from the client and logs them server-side.
 *
 * @param {Error}  error
 * @param {Object} res   - Express response object
 * @param {string} label - log prefix, e.g. 'register' | 'login'
 */
const handleError = (error, res, label) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode >= 500
      ? "An unexpected error occurred. Please try again later."
      : error.message;

  if (statusCode >= 500) {
    console.error(`[auth.controller] ${label} error:`, error);
  }

  return res.status(statusCode).json({ success: false, message });
};

/**
 * POST /api/auth/register
 *
 * Body:   { name, email, password }
 * 201     { success: true, message: { token, user } }
 * 400     { success: false, message: "<validation error>" }
 * 409     { success: false, message: "An account with this email already exists." }
 * 500     { success: false, message: "An unexpected error occurred…" }
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const { token, user } = await registerUser({ name, email, password });

    return res.status(201).json({
      success: true,
      message: { token, user },
    });
  } catch (error) {
    return handleError(error, res, "register");
  }
};

/**
 * POST /api/auth/login
 *
 * Body:   { email, password }
 * 200     { success: true, message: "Login successful", token, user }
 * 400     { success: false, message: "<validation error>" }
 * 401     { success: false, message: "Invalid email or password." }
 * 500     { success: false, message: "An unexpected error occurred…" }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: { token, user },
    });
  } catch (error) {
    return handleError(error, res, "login");
  }
};



module.exports = { register, login };
