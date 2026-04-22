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

module.exports = { tableCreationValidator };
