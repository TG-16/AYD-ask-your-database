const { 
  createNewTable,
createColumnsService,
renameTableService,
updateColumnService,
deleteTableService,
deleteColumnService,
 } = require("../services/schema.service");

/**
 * Handles error responses consistent with your auth controller.
 */
const handleError = (error, res, label) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode >= 500
      ? "An unexpected error occurred while processing the schema."
      : error.message;

  if (statusCode >= 500) {
    console.error(`[schema.controller] ${label} error:`, error);
  }

  return res.status(statusCode).json({ success: false, message });
};

/**
 * POST /api/schema/table
 */
const createTable = async (req, res) => {
  try {
    const { tableName } = req.body;
    const { workspaceId } = req.user;

    const generatedTableName = await createNewTable({ tableName, workspaceId });

    return res.status(201).json({
      success: true,
      message: { tableName: generatedTableName },
    });
  } catch (error) {
    return handleError(error, res, "createTable");
  }
};



// const handleError = (error, res, label) => {
//   const statusCode = error.statusCode || 500;
//   const message = statusCode >= 500 ? "Internal server error" : error.message;
//   if (statusCode >= 500) console.error(`[schema.controller] ${label}:`, error);
//   return res.status(statusCode).json({ success: false, message });
// };

const addColumns = async (req, res) => {
  try {
    const { tableName, columns } = req.body;
    const { workspaceId } = req.user;

    await createColumnsService({ workspaceId, tableName, columns });

    return res.status(200).json({
      success: true,
      message: "Columns added successfully"
    });
  } catch (error) {
    return handleError(error, res, "addColumns");
  }
};


const renameTable = async (req, res) => {
  try {
    const { oldTableName, newTableName } = req.body;
    const { workspaceId } = req.user;
    await renameTableService(workspaceId, oldTableName, newTableName);
    return res.status(200).json({ success: true, message: "Table renamed successfully" });
  } catch (error) {
    return handleError(error, res, "renameTable");
  }
};

const updateColumn = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    await updateColumnService(workspaceId, req.body);
    return res.status(200).json({ success: true, message: "Column updated successfully" });
  } catch (error) {
    return handleError(error, res, "updateColumn");
  }
};


const deleteTable = async (req, res) => {
  try {
    const { tableName } = req.params;
    const { workspaceId } = req.user;

    await deleteTableService(workspaceId, tableName);

    return res.status(200).json({ success: true, message: "Table deleted successfully" });
  } catch (error) {
    return handleError(error, res, "deleteTable");
  }
};

const deleteColumn = async (req, res) => {
  try {
    const { tableName, columnName } = req.body;
    const { workspaceId } = req.user;

    await deleteColumnService(workspaceId, tableName, columnName);

    return res.status(200).json({ success: true, message: "Column deleted successfully" });
  } catch (error) {
    return handleError(error, res, "deleteColumn");
  }
};


module.exports = { 
  createTable,
  addColumns,
  renameTable,
  updateColumn,
  deleteTable,
  deleteColumn
 };
