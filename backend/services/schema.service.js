const { v4: uuidv4 } = require("uuid"); // Your existing module
const { executeCreateTable, alterTableAddMultipleColumns } = require("../models/schema.model");
const { tableCreationValidator, validateColumnDefinitions } = require("../validators/schema.validator");
const { createError } = require("../utils/errors");
const { getPhysicalTableName } = require("../utils/tenant");

/**
 * Service to handle table creation logic.
 * * @param {{ tableName: string, workspaceId: string }} data
 * @returns {Promise<string>} The generated physical table name
 */
const createNewTable = async ({ tableName, workspaceId }) => {

    tableCreationValidator(tableName);
  // 3. Generate physical name: tenant_<workspaceId>_<tableName>
  // Note: Workspace IDs often contain hyphens if they are UUIDs; 
  // We sanitize the ID to ensure the SQL identifier is valid.
  const sanitizedWorkspaceId = workspaceId.replace(/-/g, "_");
  const physicalName = `tenant_${sanitizedWorkspaceId}_${tableName.toLowerCase()}`;

  // 4. Call Model to execute DDL
  await executeCreateTable(physicalName);

  return physicalName;
};




/**
 * Maps frontend types to PostgreSQL types.
 */
const mapType = (col) => {
  // Mapping standard types to Postgres types
  const typeMap = {
    "STRING": "TEXT",
    "NUMBER": "NUMERIC",
    "INTEGER": "INTEGER",
    "BOOLEAN": "BOOLEAN",
    "DATE": "DATE",
    "VECTOR": "vector(384)" // Adjusted to 384 to match MiniLM dimensions
  };
  return typeMap[col.type] || "TEXT";
};

const createColumnsService = async ({ workspaceId, tableName, columns }) => {
  validateColumnDefinitions(columns);
  const physicalName = getPhysicalTableName(workspaceId, tableName);

  const finalDefinitions = [];

  columns.forEach(col => {
    const pgType = mapType(col);
    const constraints = col.isPrimary ? "PRIMARY KEY" : "";
    
    // 1. Add the base column (e.g., "product_name")
    // If the type was passed as "VECTOR", we still create the base column as TEXT 
    // to store the original human-readable content.
    const baseType = col.type === "VECTOR" ? "TEXT" : pgType;
    finalDefinitions.push(`ADD COLUMN IF NOT EXISTS "${col.name}" ${baseType} ${constraints}`);

    // 2. If isVector is true, create the twin vector column (e.g., "product_name_vector")
    if (col.isVector === true) {
      // We use vector(384) for MiniLM. If you use OpenAI, change to 1536.
      finalDefinitions.push(`ADD COLUMN IF NOT EXISTS "${col.name}_vector" vector(384)`);
    }
  });

  const columnSQL = finalDefinitions.join(", ");
  
  // Only execute if we actually have columns to add
  if (finalDefinitions.length > 0) {
    await alterTableAddMultipleColumns(physicalName, columnSQL);
  }
};

module.exports = { createNewTable, createColumnsService };