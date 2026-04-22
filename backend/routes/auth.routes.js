// routes/auth.routes.js
const { Router } = require('express');
const { register, login } = require('../controllers/auth.controller');
const { authenticateUser } = require("../middleware/auth.middleware");

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Create a new account and return a JWT
 * @access  Public
 *
 * Body:
 *   full_name  {string} required
 *   email      {string} required – valid email format
 *   password   {string} required – minimum 8 characters
 *
 * Responses:
 *   201  { success: true,  message: { token, user } }
 *   400  { success: false, message: "<validation error>" }
 *   409  { success: false, message: "An account with this email already exists." }
 *   500  { success: false, message: "An unexpected error occurred. Please try again later." }
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate an existing user and return a JWT
 * @access  Public
 *
 * Body:
 *   email     {string} required – valid email format
 *   password  {string} required
 *
 * Responses:
 *   200  { success: true, message: "Login successful", token, user }
 *   400  { success: false, message: "<validation error>" }
 *   401  { success: false, message: "Invalid email or password." }
 *   500  { success: false, message: "An unexpected error occurred. Please try again later." }
 */
router.post('/login', login);
router.post("/protecte", authenticateUser, (req, res) => {
    return res.status(200).send("hello");
})

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
