const pool = require("../db/connection");

/**
 * Bulk inserts multiple rows with dynamic column lists.
 */
const insertBulkIntoTable = async (physicalName, columns, flatValues, rowCount) => {
  const colCount = columns.length;
  const colString = columns.map(col => `"${col}"`).join(", ");

  // Construct the placeholder grid ($1, $2), ($3, $4)...
  const placeholderRows = [];
  for (let i = 0; i < rowCount; i++) {
    const rowPlaceholders = [];
    for (let j = 1; j <= colCount; j++) {
      rowPlaceholders.push(`$${(i * colCount) + j}`);
    }
    placeholderRows.push(`(${rowPlaceholders.join(", ")})`);
  }

  const query = `
    INSERT INTO "${physicalName}" (${colString})
    VALUES ${placeholderRows.join(", ")}
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, flatValues);
    return result.rows;
  } catch (error) {
    console.error(`[data.model] Bulk insert error:`, error);
    // 42703 is the Postgres error for "column does not exist"
    if (error.code === '42703') {
        error.message = "One or more columns do not exist in the target table.";
        error.statusCode = 400;
    }
    throw error;
  }
};

module.exports = { insertBulkIntoTable };