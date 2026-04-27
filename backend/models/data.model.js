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


/**
 * API 1: Fetch tables with metadata
 */
const fetchTablesByPrefix = async (prefix) => {
  const query = `
    SELECT 
      table_name as "tableName",
      (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as "totalColumns"
    FROM information_schema.tables t
    WHERE table_name LIKE $1 AND table_schema = 'public'
    ORDER BY table_name;
  `;
  const result = await pool.query(query, [`${prefix}%`]);
  
  // Strip prefix from results for user-facing API
  return result.rows.map(r => ({
    ...r,
    tableName: r.tableName.replace(prefix, "")
  }));
};

/**
 * API 2: Fetch all columns and detect PKs/Vectors
 */
const fetchColumnsByPrefix = async (prefix) => {
  const query = `
    SELECT 
      cols.table_name,
      cols.column_name,
      cols.data_type,
      EXISTS (
        SELECT 1 FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
        WHERE kcu.table_name = cols.table_name 
        AND kcu.column_name = cols.column_name 
        AND tc.constraint_type = 'PRIMARY KEY'
      ) as is_primary,
      (cols.data_type = 'USER-DEFINED' AND cols.udt_name = 'vector') as is_vector
    FROM information_schema.columns cols
    WHERE cols.table_name LIKE $1 AND cols.table_schema = 'public'
    ORDER BY cols.table_name, cols.ordinal_position;
  `;
  const result = await pool.query(query, [`${prefix}%`]);
  return result.rows;
};

/**
 * API 3: Paginated Row Retrieval
 */
const fetchRowsPaginated = async (physicalName, limit, offset) => {
  // We use two queries: one for data, one for total count
  const dataQuery = `SELECT * FROM "${physicalName}" LIMIT $1 OFFSET $2;`;
  const countQuery = `SELECT COUNT(*) FROM "${physicalName}";`;

  try {
    const [dataRes, countRes] = await Promise.all([
      pool.query(dataQuery, [limit, offset]),
      pool.query(countQuery)
    ]);

    return {
      rows: dataRes.rows,
      total: parseInt(countRes.rows[0].count)
    };
  } catch (error) {
    if (error.code === '42P01') {
      const err = new Error("Table not found");
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
};


const updateRow = async (table, rowId, data) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  
  const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(", ");
  
  const query = `
    UPDATE "${table}"
    SET ${setClause}
    WHERE id = $${keys.length + 1}
    RETURNING *;
  `;

  const result = await pool.query(query, [...values, rowId]);
  return result.rows[0];
};

module.exports = { insertBulkIntoTable, fetchTablesByPrefix, fetchColumnsByPrefix, fetchRowsPaginated, updateRow };
