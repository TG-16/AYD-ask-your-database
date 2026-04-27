const express = require("express");
const router = express.Router();
const { 
    insertData,
    getTables, 
    getTableColumns, 
    getTableData 
 } = require("../controllers/data.controller");
const { authenticateUser } = require("../middleware/auth.middleware"); // Assuming this exists

// POST /api/data/insert
router.post("/insert", authenticateUser, insertData);


// GET /api/data/tables - List all user tables
router.get("/tables", authenticateUser, getTables);

// GET /api/data/columns - List all tables with their columns
router.get("/columns", authenticateUser, getTableColumns);

// GET /api/data/table/:tableName - Get rows for a specific table
router.get("/table/:tableName", authenticateUser, getTableData);

module.exports = router;