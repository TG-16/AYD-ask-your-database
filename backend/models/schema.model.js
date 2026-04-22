const pool = require("../db/connection");

/**
 * Executes the DDL to create a new table.
 * * @param {string} physicalName - Pre-sanitized physical table name
 */
const executeCreateTable = async (physicalName) => {
  // We use "IF NOT EXISTS" to prevent crashes on duplicate requests
  // The columns are set as per your requirements
  const query = `
    CREATE TABLE IF NOT EXISTS "${physicalName}" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(query);
  } catch (error) {
    // Check for specific Postgres errors (e.g., 42P07 is duplicate_table)
    console.error(`[schema.model] Database error:`, error);
    throw error;
  }
};

module.exports = { executeCreateTable };