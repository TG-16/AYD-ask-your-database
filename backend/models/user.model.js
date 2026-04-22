// models/user.model.js
const pool = require('../db/connection');

/**
 * Find a user by their email address.
 * Returns the full row including password_hash so the service
 * layer can run bcrypt.compare(). Always call sanitizeUser()
 * before sending the result to the client.
 *
 * Schema ref: users(id, name, email, password_hash, created_at)
 *
 * @param {string} email
 * @returns {Promise<Object|null>} full user row or null
 */
const findUserByEmail = async (email) => {
  const query = `
    SELECT id, name, email, password_hash, created_at
    FROM users
    WHERE email = $1
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [email.toLowerCase().trim()]);
  return rows[0] || null;
};

/**
 * Insert a new user into the database.
 *
 * Schema ref: users(id, name, email, password_hash, created_at)
 *
 * @param {{ id: string, name: string, email: string, password_hash: string }} params
 * @returns {Promise<Object>} created user row (without password_hash)
 */
const createUser = async ({ id, name, email, password_hash }) => {
  const query = `
    INSERT INTO users (id, name, email, password_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, created_at;
  `;
  const values = [id, name, email.toLowerCase().trim(), password_hash];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Create a default workspace for a newly registered user.
 *
 * Schema ref: workspaces(id, user_id, name, created_at)
 *
 * @param {{ id: string, userId: string, name: string }} params
 * @returns {Promise<Object>} created workspace row
 */
const createDefaultWorkspace = async ({ id, userId, name }) => {
  const query = `
    INSERT INTO workspaces (id, user_id, name)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, name, created_at;
  `;
  const { rows } = await pool.query(query, [id, userId, name]);
  return rows[0];
};

/**
 * Strip sensitive fields from a raw DB user row.
 * Always call this before including a user object in any API response.
 *
 * @param {Object} user - raw DB row (may include password_hash)
 * @returns {{ id: string, name: string, email: string, created_at: string }}
 */
const sanitizeUser = ({ id, name, email, created_at }) => ({
  id,
  name,
  email,
  created_at,
});

module.exports = {
  findUserByEmail,
  createUser,
  createDefaultWorkspace,
  sanitizeUser,
};
