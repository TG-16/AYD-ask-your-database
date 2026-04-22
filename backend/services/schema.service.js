const { v4: uuidv4 } = require("uuid"); // Your existing module
const { executeCreateTable } = require("../models/schema.model");
const { tableCreationValidator } = require("../validators/schema.validator");
const { createError } = require("../utils/errors");

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

module.exports = { createNewTable };