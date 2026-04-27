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



const renameTable = async (oldName, newName) => {
  // PostgreSQL: RENAME TO does not take the full path, just the new name
  const rawNewName = newName.split('.').pop(); 
  return await pool.query(`ALTER TABLE "${oldName}" RENAME TO "${rawNewName}";`);
};

const renameColumn = async (table, oldCol, newCol) => {
  return await pool.query(`ALTER TABLE "${table}" RENAME COLUMN "${oldCol}" TO "${newCol}";`);
};

const renameColumnIfExists = async (table, oldCol, newCol) => {
  const check = await pool.query(
    "SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2", 
    [table, oldCol]
  );
  if (check.rowCount > 0) {
    await pool.query(`ALTER TABLE "${table}" RENAME COLUMN "${oldCol}" TO "${newCol}";`);
  }
};

const changeColumnType = async (table, col, type) => {
  return await pool.query(`ALTER TABLE "${table}" ALTER COLUMN "${col}" TYPE ${type} USING "${col}"::${type};`);
};

const addVectorColumn = async (table, baseCol) => {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
  return await pool.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${baseCol}_vector" vector(384);`);
};

const dropColumnIfExists = async (table, col) => {
  return await pool.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${col}";`);
};

const checkColumnExists = async (table, col) => {
  const res = await pool.query(
    "SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2", 
    [table, col]
  );
  return res.rowCount > 0;
};

module.exports = { executeCreateTable, alterTableAddMultipleColumns,
  renameTable, renameColumn, renameColumnIfExists, 
  changeColumnType, addVectorColumn, dropColumnIfExists, 
  checkColumnExists,
 };
