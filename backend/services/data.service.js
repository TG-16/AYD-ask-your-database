const {
  insertBulkIntoTable,
  fetchTablesByPrefix,
  fetchColumnsByPrefix,
  fetchRowsPaginated,
  updateRow
} = require("../models/data.model");
const {checkColumnExists} = require("../models/schema.model");
const { getPhysicalTableName } = require("../utils/tenant");
const { createError } = require("../utils/errors");
const { pipeline } = require("@xenova/transformers");

let extractor;
const getExtractor = async () => {
  if (!extractor) {
    // Note: ensure vector(size) in DB matches this model's output (384 for MiniLM)
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractor;
};

/**
 * Processes a single row to generate embeddings for specific columns.
 */
const processRowEmbeddings = async (
  row,
  vectorizeColumns,
  generateEmbedding,
) => {
  const processedRow = { ...row };

  for (const colName of vectorizeColumns) {
    const textToVectorize = row[colName];

    if (textToVectorize && typeof textToVectorize === "string") {
      const output = await generateEmbedding(textToVectorize, {
        pooling: "mean",
        normalize: true,
      });

      // Store in the twin column: <name>_vector
      processedRow[`${colName}_vector`] = JSON.stringify(
        Array.from(output.data),
      );
    }
  }
  return processedRow;
};

const insertBulkService = async ({
  workspaceId,
  tableName,
  data,
  vectorizeColumns = [],
}) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw createError("Data must be a non-empty array.", 400);
  }

  const generateEmbedding = await getExtractor();
  const physicalName = getPhysicalTableName(workspaceId, tableName);

  // 1. Process all rows in parallel for embeddings
  const processedDataArray = await Promise.all(
    data.map((row) =>
      processRowEmbeddings(row, vectorizeColumns, generateEmbedding),
    ),
  );

  // 2. Identify all columns (including the newly generated _vector columns)
  // We use the first processed row to determine the keys for the whole batch
  const columns = Object.keys(processedDataArray[0]);

  // 3. Flatten values for the PG driver
  const values = [];
  processedDataArray.forEach((row) => {
    columns.forEach((col) => {
      values.push(row[col]);
    });
  });

  // 4. Send to bulk model
  return await insertBulkIntoTable(
    physicalName,
    columns,
    values,
    processedDataArray.length,
  );
};

const listWorkspaceTables = async (workspaceId) => {
  const prefix = `tenant_${workspaceId.replace(/-/g, "_")}_`;
  return await fetchTablesByPrefix(prefix);
};

const listWorkspaceColumns = async (workspaceId) => {
  const prefix = `tenant_${workspaceId.replace(/-/g, "_")}_`;
  const rawData = await fetchColumnsByPrefix(prefix);

  // Group columns by tableName
  const grouped = rawData.reduce((acc, row) => {
    const { table_name, column_name, data_type, is_primary, is_vector } = row;

    // Clean the physical name back to the user-friendly name for the UI
    const cleanName = table_name.replace(prefix, "");

    if (!acc[cleanName]) {
      acc[cleanName] = { tableName: cleanName, columns: [] };
    }

    acc[cleanName].columns.push({
      columnName: column_name,
      dataType: data_type,
      isPrimaryKey: is_primary,
      isVector: is_vector,
    });

    return acc;
  }, {});

  return Object.values(grouped);
};

const getTableRows = async ({ workspaceId, tableName, page, limit }) => {
  const physicalName = getPhysicalTableName(workspaceId, tableName);
  const offset = (page - 1) * limit;

  // 1. Fetch the raw data and total count
  const { rows, total } = await fetchRowsPaginated(physicalName, limit, offset);

  // 2. Fetch column metadata for this specific table to identify vectors
  // We reuse our existing model method but filter it for this table
  const prefix = `tenant_${workspaceId.replace(/-/g, "_")}_`;
  const allColumns = await fetchColumnsByPrefix(prefix);
  
  const vectorColumns = allColumns
    .filter(col => col.table_name === physicalName && col.is_vector)
    .map(col => col.column_name);

  // 3. Clean the rows: Remove any key that is a vector column
  const cleanedRows = rows.map(row => {
    const newRow = { ...row };
    vectorColumns.forEach(vecCol => {
      delete newRow[vecCol];
    });
    return newRow;
  });

  return {
    data: cleanedRows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};


/**
 * API 3: Update Row with Vector Sync
 */
const updateRowService = async (workspaceId, { tableName, rowId, data }) => {
  const physicalTable = getPhysicalTableName(workspaceId, tableName);
  const generateEmbedding = await getExtractor();
  
  const finalUpdateData = { ...data };

  // Check if any updated field has a corresponding vector column in the DB
  for (const [key, value] of Object.entries(data)) {
    const vectorColName = `${key}_vector`;
    const hasVector = await checkColumnExists(physicalTable, vectorColName);
    
    if (hasVector && typeof value === 'string') {
      const output = await generateEmbedding(value, { pooling: 'mean', normalize: true });
      finalUpdateData[vectorColName] = JSON.stringify(Array.from(output.data));
    }
  }

  //should remove the vector section out of the response
  return await updateRow(physicalTable, rowId, finalUpdateData);
};

module.exports = {
  insertBulkService,
  listWorkspaceTables,
  listWorkspaceColumns,
  getTableRows,
  updateRowService
};
