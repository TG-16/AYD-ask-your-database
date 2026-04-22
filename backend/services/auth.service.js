// services/auth.service.js
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser, createDefaultWorkspace } = require('../models/user.model');
const { validateRegistrationInput } = require('../validators/auth.validator');
const { generateToken } = require("../utils/generateToken");
const SALT_ROUNDS = 12;

/**
 * Generate a signed JWT for the given user payload.
 *
 * @param {Object} payload - data to encode (e.g. { id, email })
 * @returns {string} signed JWT
 */


/**
 * Register a new user.
 *
 * Steps:
 *  1. Validate input
 *  2. Check email uniqueness
 *  3. Hash password
 *  4. Persist user
 *  5. Create default workspace
 *  6. Issue JWT
 *
 * @param {Object} registrationData - { full_name, email, password }
 * @returns {Promise<{ token: string, user: Object }>}
 */
const registerUser = async ({ full_name, email, password }) => {
  // 1. Validate
  validateRegistrationInput({ full_name, email, password });

  // 2. Email uniqueness
  const existing = await findUserByEmail(email);
  if (existing) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  // 3. Hash password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // 4. Create user
  const userId = uuidv4();
  const user = await createUser({
    id: userId,
    full_name: full_name.trim(),
    email,
    password_hash,
  });

  // 5. Create default workspace
  await createDefaultWorkspace({
    id: uuidv4(),
    userId: user.id,
    name: `${user.name}'s Workspace`,
  });

  // 6. Generate JWT
  const token = generateToken({ id: user.id, email: user.email });

  return { token, user };
};

module.exports = { registerUser };