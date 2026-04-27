const express = require("express");
const router = express.Router();
const { 
    createTable,
    addColumns,
    renameTable,
    updateColumn,
    deleteTable,
    deleteColumn
 } = require("../controllers/schema.controller");
const { authenticateUser } = require("../middleware/auth.middleware");

// POST /api/schema/table
// Protected route: sets req.user.workspaceId
router.post("/table", authenticateUser, createTable);
router.post("/columns", authenticateUser, addColumns);

// Schema Updates
router.patch("/table-name", authenticateUser, renameTable);
router.patch("/column", authenticateUser, updateColumn);

// Schema deletions
router.delete("/table/:tableName", authenticateUser, deleteTable);
//if the column name ends with "_vector" the delete process needs evaluation
router.delete("/column", authenticateUser, deleteColumn);

module.exports = router;