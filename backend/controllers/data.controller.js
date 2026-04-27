const { insertBulkService } = require("../services/data.service");

const handleError = (error, res, label) => {
  const statusCode = error.statusCode || 500;
  const message = statusCode >= 500 ? "Failed to insert record." : error.message;
  
  if (statusCode >= 500) {
    console.error(`[data.controller] ${label} error:`, error);
  }

  return res.status(statusCode).json({ success: false, message });
};

const insertData = async (req, res) => {
  try {
    const { tableName, data, vectorizeColumns } = req.body;
    const { workspaceId } = req.user;

    const insertedRows = await insertBulkService({ 
      workspaceId, 
      tableName, 
      data, 
      vectorizeColumns 
    });

    return res.status(201).json({
      success: true,
      message: `${insertedRows.length} rows inserted successfully`,
      data: insertedRows
    });
  } catch (error) {
    return handleError(error, res, "insertData");
  }
};

module.exports = { insertData };