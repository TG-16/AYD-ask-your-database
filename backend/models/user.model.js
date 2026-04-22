// models/user.model.js
const pool = require('../db/connection');

/**
 * Find a user by their email address.
 * @param {string} email
 * @returns {Promise<Object|null>} user row or null
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
 * @param {Object} params
 * @param {string} params.id        - UUID
 * @param {string} params.full_name
 * @param {string} params.email
 * @param {string} params.password_hash
 * @returns {Promise<Object>} created user row (without password_hash)
 */
const createUser = async ({ id, full_name, email, password_hash }) => {
  const query = `
    INSERT INTO users (id, name, email, password_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, created_at;
  `;
  const values = [id, full_name, email.toLowerCase().trim(), password_hash];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Create a default workspace for a newly registered user.
 * @param {Object} params
 * @param {string} params.id      - UUID for the workspace
 * @param {string} params.userId  - owner user UUID
 * @param {string} params.name    - workspace display name
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

module.exports = {
  findUserByEmail,
  createUser,
  createDefaultWorkspace,
};