// controllers/auth.controller.js
const { registerUser } = require("../services/auth.service");

/**
 * POST /api/auth/register
 *
 * Request body:
 *   { full_name: string, email: string, password: string }
 *
 * Success response (201):
 *   { success: true, message: { token, user } }
 *
 * Error response (4xx / 5xx):
 *   { success: false, message: string }
 */
const register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    const { token, user } = await registerUser({ full_name, email, password });

    return res.status(201).json({
      success: true,
      message: {
        token,
        user,
      },
    });
  } catch (error) {
    // Structured errors thrown from the service layer carry a statusCode
    const statusCode = error.statusCode || 500;
    const message =
      statusCode === 500
        ? "An unexpected error occurred. Please try again later."
        : error.message;

    // Log unexpected server errors for observability
    if (statusCode === 500) {
      console.error("[auth.controller] register error:", error);
    }

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

module.exports = { register };
