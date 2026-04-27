const { 
  createNewTable,
createColumnsService } = require("../services/schema.service");

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



module.exports = { 
  createTable,
addColumns
 };
