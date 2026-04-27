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

/**
 * Adds multiple columns in a single SQL execution.
 * @param {string} physicalName
 * @param {string} columnDefinitions - Comma-separated ADD COLUMN clauses
 */
const alterTableAddMultipleColumns = async (
  physicalName,
  columnDefinitions,
) => {
  // Example of final query:
  // ALTER TABLE "tenant_123_products" ADD COLUMN "price" NUMERIC, ADD COLUMN "desc" TEXT;
  const query = `ALTER TABLE "${physicalName}" ${columnDefinitions};`;

  try {
    await pool.query(query);
  } catch (error) {
    console.error(`[schema.model] Batch column addition failed:`, error);
    // Attach status code for the controller's handleError
    error.statusCode = 400;
    throw error;
  }
};

module.exports = { executeCreateTable, alterTableAddMultipleColumns };
