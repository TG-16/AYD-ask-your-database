// services/auth.service.js
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const {
  findUserByEmail,
  createUser,
  createDefaultWorkspace,
  sanitizeUser,
} = require("../models/user.model");
const {
  validateRegistrationInput,
  validateLoginInput,
} = require("../validators/auth.validator");
const { generateToken } = require("../utils/token");
const { createError } = require("../utils/errors");

const SALT_ROUNDS = 12;

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
 * @param {{ name: string, email: string, password: string }} registrationData
 * @returns {Promise<{ token: string, user: Object }>}
 */
const registerUser = async ({ name, email, password }) => {
  // 1. Validate
  validateRegistrationInput({ name, email, password });

  // 2. Email uniqueness
  const existing = await findUserByEmail(email);
  if (existing) {
    throw createError("An account with this email already exists.", 409);
  }

  // 3. Hash password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // 4. Create user (RETURNING clause excludes password_hash)
  const userId = uuidv4();
  const user = await createUser({
    id: userId,
    name: name.trim(),
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
  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
  });

  return { token, user };
};

/**
 * Authenticate an existing user.
 *
 * Steps:
 *  1. Validate input
 *  2. Look up user by email
 *  3. Verify password against stored hash
 *  4. Issue JWT
 *  5. Return sanitized user
 *
 * Both "user not found" and "wrong password" return the same 401 message
 * to prevent user enumeration attacks.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ token: string, user: Object }>}
 */
const loginUser = async ({ email, password }) => {
  // 1. Validate
  validateLoginInput({ email, password });

  // 2. Look up user — fetch full row so we have password_hash for comparison
  const userRow = await findUserByEmail(email);

  // 3. Verify — deliberate generic message to prevent user enumeration
  const INVALID_CREDENTIALS_MSG = "Invalid email or password.";

  if (!userRow) {
    throw createError(INVALID_CREDENTIALS_MSG, 401);
  }

  const passwordMatch = await bcrypt.compare(password, userRow.password_hash);
  if (!passwordMatch) {
    throw createError(INVALID_CREDENTIALS_MSG, 401);
  }

  // 4. Generate JWT
  const token = generateToken({
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
  });

  // 5. Strip password_hash before returning
  const user = sanitizeUser(userRow);

  return { token, user };
};

module.exports = { registerUser, loginUser };
