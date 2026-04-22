// utils/token.js
const jwt = require('jsonwebtoken');
const { createError } = require('./errors');

/**
 * Generate a signed JWT for the given user payload.
 *
 * @param {{ id: string, name: string, email: string }} payload
 * @returns {string} signed JWT
 * @throws {Error} if JWT_SECRET is not set in environment
 */
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw createError('JWT_SECRET environment variable is not set.', 500);

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'your-app-name',
  });
};

module.exports = { generateToken };
