const { insertBulkIntoTable } = require("../models/data.model");
const { getPhysicalTableName } = require("../utils/tenant");
const { createError } = require("../utils/errors");
const { pipeline } = require("@xenova/transformers");


let extractor;
const getExtractor = async () => {
  if (!extractor) {
    // Note: ensure vector(size) in DB matches this model's output (384 for MiniLM)
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
};

/**
 * Processes a single row to generate embeddings for specific columns.
 */
const processRowEmbeddings = async (row, vectorizeColumns, generateEmbedding) => {
  const processedRow = { ...row };
  
  for (const colName of vectorizeColumns) {
    const textToVectorize = row[colName];
    
    if (textToVectorize && typeof textToVectorize === 'string') {
      const output = await generateEmbedding(textToVectorize, { 
        pooling: 'mean', 
        normalize: true 
      });
      
      // Store in the twin column: <name>_vector
      processedRow[`${colName}_vector`] = JSON.stringify(Array.from(output.data));
    }
  }
  return processedRow;
};

const insertBulkService = async ({ workspaceId, tableName, data, vectorizeColumns = [] }) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw createError("Data must be a non-empty array.", 400);
  }

  const generateEmbedding = await getExtractor();
  const physicalName = getPhysicalTableName(workspaceId, tableName);

  // 1. Process all rows in parallel for embeddings
  const processedDataArray = await Promise.all(
    data.map(row => processRowEmbeddings(row, vectorizeColumns, generateEmbedding))
  );

  // 2. Identify all columns (including the newly generated _vector columns)
  // We use the first processed row to determine the keys for the whole batch
  const columns = Object.keys(processedDataArray[0]);

  // 3. Flatten values for the PG driver
  const values = [];
  processedDataArray.forEach(row => {
    columns.forEach(col => {
      values.push(row[col]);
    });
  });

  // 4. Send to bulk model
  return await insertBulkIntoTable(physicalName, columns, values, processedDataArray.length);
};

module.exports = { insertBulkService };