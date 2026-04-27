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
 */
const alterTableAddMultipleColumns = async (physicalName, columnDefinitions) => {
  try {
    // Ensure pgvector extension is active in case this is the first vector column
    if (columnDefinitions.includes("vector(")) {
      await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
    }

    const query = `ALTER TABLE "${physicalName}" ${columnDefinitions};`;
    await pool.query(query);
    
  } catch (error) {
    console.error(`[schema.model] Batch column addition failed:`, error);
    
    // Handle specific case where table might not exist
    if (error.code === '42P01') {
      error.message = "The target table does not exist.";
      error.statusCode = 404;
    } else {
      error.statusCode = 400;
    }
    
    throw error;
  }
};

module.exports = { executeCreateTable, alterTableAddMultipleColumns };
