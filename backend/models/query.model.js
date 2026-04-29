const pool = require("../db/connection");

const executeSafeQuery = async (sql, params) => {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("[query.model] Execution error:", error);
    // Mask raw DB errors for security
    error.message = "The generated query failed to execute.";
    error.statusCode = 400;
    throw error;
  }
};

module.exports = { executeSafeQuery };