const { createError } = require("../utils/errors");

const tableCreationValidator = (tableName) => {
  // 1. Validate presence
  if (!tableName) {
    throw createError("Table name is required.", 400);
  }

  // 2. Validate safe characters (letters, numbers, underscores)
  const safeNameRegex = /^[a-zA-Z0-9_]+$/;
  if (!safeNameRegex.test(tableName)) {
    throw createError("Table name contains invalid characters.", 400);
  }
};


const VALID_TYPES = [
  "STRING",
  "NUMBER",
  "INTEGER",
  "BOOLEAN",
  "DATE",
  "VECTOR",
];
const SAFE_NAME_REGEX = /^[a-zA-Z0-9_]+$/;

const validateColumnDefinitions = (columns) => {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw createError("Columns must be a non-empty array.", 400);
  }

  let primaryKeyCount = 0;

  for (const col of columns) {
    if (!col.name || !SAFE_NAME_REGEX.test(col.name)) {
      throw createError(`Invalid column name: ${col.name}`, 400);
    }
    if (!VALID_TYPES.includes(col.type)) {
      throw createError(`Unsupported column type: ${col.type}`, 400);
    }
    if (col.isPrimary) primaryKeyCount++;
  }

  if (primaryKeyCount > 1) {
    throw createError("A table can only have one primary key.", 400);
  }
};

module.exports = {
  tableCreationValidator,
  validateColumnDefinitions,
};
