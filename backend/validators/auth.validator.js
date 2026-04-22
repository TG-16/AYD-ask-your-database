// validators/auth.validator.js

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Create a structured 400 validation error.
 * @param {string} message
 * @returns {Error}
 */
const validationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

/**
 * Validate registration input fields.
 * Throws a structured error on failure so the service layer
 * can propagate it to the controller for HTTP mapping.
 *
 * @param {Object} fields
 * @param {string} fields.full_name
 * @param {string} fields.email
 * @param {string} fields.password
 * @throws {Error} with .statusCode = 400 on invalid input
 */
const validateRegistrationInput = ({ full_name, email, password }) => {
  if (!full_name || !email || !password) {
    throw validationError('All fields (full_name, email, password) are required.');
  }

  if (!EMAIL_REGEX.test(email)) {
    throw validationError('Invalid email format.');
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw validationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }
};

module.exports = { validateRegistrationInput };