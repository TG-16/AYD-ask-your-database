// utils/errors.js

/**
 * Create a structured HTTP error with a statusCode property.
 * The statusCode is read by the controller to set the HTTP response status.
 *
 * @param {string} message   - Human-readable error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @returns {Error}
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = { createError };