const {
  insertBulkService,
  listWorkspaceTables,
  listWorkspaceColumns,
  getTableRows,
  updateRowService,
  deleteRowService,
} = require("../services/data.service");

const handleError = (error, res, label) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode >= 500 ? "Failed to insert record." : error.message;

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
      vectorizeColumns,
    });

    return res.status(201).json({
      success: true,
      message: `${insertedRows.length} rows inserted successfully`,
      data: insertedRows,
    });
  } catch (error) {
    return handleError(error, res, "insertData");
  }
};

const getTables = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const tables = await listWorkspaceTables(workspaceId);
    return res.status(200).json({ success: true, tables });
  } catch (error) {
    return handleError(error, res, "getTables");
  }
};

const getTableColumns = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const schema = await listWorkspaceColumns(workspaceId);
    return res.status(200).json({ success: true, schema });
  } catch (error) {
    return handleError(error, res, "getTableColumns");
  }
};

const getTableData = async (req, res) => {
  try {
    const { tableName } = req.params;
    const { workspaceId } = req.user;
    const { page = 1, limit = 20 } = req.query;

    const result = await getTableRows({
      workspaceId,
      tableName,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(error, res, "getTableData");
  }
};

const updateRow = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const updatedData = await updateRowService(workspaceId, req.body);
    return res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    return handleError(error, res, "updateRow");
  }
};

const deleteRow = async (req, res) => {
  try {
    const { tableName, rowId } = req.body;
    const { workspaceId } = req.user;

    await deleteRowService(workspaceId, tableName, rowId);

    return res
      .status(200)
      .json({ success: true, message: "Row deleted successfully" });
  } catch (error) {
    return handleError(error, res, "deleteRow");
  }
};

module.exports = {
  insertData,
  getTables,
  getTableColumns,
  getTableData,
  updateRow,
  deleteRow,
};
