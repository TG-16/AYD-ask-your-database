// validators/auth.validator.js
const { createError } = require('../utils/errors');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Validate registration input fields.
 *
 * @param {{ name: string, email: string, password: string }} fields
 * @throws {Error} 400 on invalid input
 */
const validateRegistrationInput = ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw createError('All fields (name, email, password) are required.', 400);
  }

  if (!EMAIL_REGEX.test(email)) {
    throw createError('Invalid email format.', 400);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      400
    );
  }
};

/**
 * Validate login input fields.
 * Password is only checked for presence — strength rules don't apply at
 * login and would leak policy information to attackers.
 *
 * @param {{ email: string, password: string }} fields
 * @throws {Error} 400 on invalid input
 */
const validateLoginInput = ({ email, password }) => {
  if (!email || !password) {
    throw createError('All fields (email, password) are required.', 400);
  }

  if (!EMAIL_REGEX.test(email)) {
    throw createError('Invalid email format.', 400);
  }
};

module.exports = { validateRegistrationInput, validateLoginInput };
