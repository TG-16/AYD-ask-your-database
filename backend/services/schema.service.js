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
  if (col.isVector && col.type === "VECTOR") return "vector(1536)";
  const typeMap = {
    "STRING": "TEXT",
    "NUMBER": "NUMERIC",
    "INTEGER": "INTEGER",
    "BOOLEAN": "BOOLEAN",
    "DATE": "DATE"
  };
  return typeMap[col.type];
};

const createColumnsService = async ({ workspaceId, tableName, columns }) => {
  // 1. Validation
  validateColumnDefinitions(columns);

  // 2. Resolve physical table name
  const physicalName = getPhysicalTableName(workspaceId, tableName);

  // 3. Build the SQL fragment for all columns
  // Result format: ADD COLUMN "col1" TYPE, ADD COLUMN "col2" TYPE...
  const columnDefinitions = columns.map(col => {
    const pgType = mapType(col);
    const constraints = col.isPrimary ? "PRIMARY KEY" : "";
    return `ADD COLUMN IF NOT EXISTS "${col.name}" ${pgType} ${constraints}`;
  }).join(", ");

  // 4. Single call to the model
  await alterTableAddMultipleColumns(physicalName, columnDefinitions);
};

module.exports = { createNewTable, createColumnsService };