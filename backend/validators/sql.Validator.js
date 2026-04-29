const { createError } = require("../utils/errors");

/**
 * Validates that the LLM generated SQL is safe and tenant-compliant.
 */
const validateSQL = (sql, workspaceId) => {
  const normalizedSql = sql.toUpperCase();
  const physicalPrefix = `tenant_${workspaceId.replace(/-/g, "_")}_`.toUpperCase();

  // const normalizedSql = sql.toUpperCase();
  
  // 1. Strict Read-Only Check using Word Boundaries (\b)
  const forbiddenKeywords = [
    "INSERT", "UPDATE", "DELETE", "DROP", 
    "TRUNCATE", "ALTER", "CREATE", "GRANT", "REVOKE"
  ];
  
  for (const keyword of forbiddenKeywords) {
    // This regex looks for the keyword as a whole word only
    // 'i' flag makes it case-insensitive
    const regex = new RegExp(`\\b${keyword}\\b`, 'i'); 
    
    if (regex.test(sql)) {
      throw createError(`Security Violation: Forbidden keyword "${keyword}" detected.`, 403);
    }
  }

  // 2. Select-only enforcement
  if (!normalizedSql.trim().startsWith("SELECT")) {
    throw createError("Only SELECT queries are permitted.", 403);
  }

  // 3. Tenant Isolation Check
  // Ensure every table mentioned starts with the user's workspace prefix
  const tableMatches = sql.match(/tenant_[a-zA-Z0-9_]+/g) || [];
  for (const table of tableMatches) {
    if (!table.toUpperCase().startsWith(physicalPrefix)) {
      throw createError("Security Violation: Accessing unauthorized table detected.", 403);
    }
  }

  return true;
};

module.exports = { validateSQL };