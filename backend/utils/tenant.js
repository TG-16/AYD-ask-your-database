/**
 * Generates the physical PostgreSQL table name.
 * @param {string} workspaceId 
 * @param {string} tableName 
 * @returns {string}
 */
const getPhysicalTableName = (workspaceId, tableName) => {
  const sanitizedId = workspaceId.replace(/-/g, "_");
  return `tenant_${sanitizedId}_${tableName.toLowerCase()}`;
};

module.exports = { getPhysicalTableName };