// routes/auth.routes.js
const { Router } = require('express');
const { register } = require('../controllers/auth.controller');

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user and return a JWT
 * @access  Public
 *
 * Body:
 *   full_name  {string} required
 *   email      {string} required – must be a valid email
 *   password   {string} required – minimum 8 characters
 *
 * Responses:
 *   201  { success: true,  message: { token, user } }
 *   400  { success: false, message: "<validation error>" }
 *   409  { success: false, message: "An account with this email already exists." }
 *   500  { success: false, message: "An unexpected error occurred. Please try again later." }
 */
router.post('/register', register);

module.exports = router;

// ─── Mount in your Express app ────────────────────────────────────────────────
//
// app.js (or server.js):
//
//   const express = require('express');
//   const authRoutes = require('./routes/auth.routes');
//
//   const app = express();
//   app.use(express.json());
//   app.use('/api/auth', authRoutes);
//
// ─────────────────────────────────────────────────────────────────────────────