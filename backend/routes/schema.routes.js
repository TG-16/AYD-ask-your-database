const express = require("express");
const router = express.Router();
const { 
    createTable,
    addColumns,
 } = require("../controllers/schema.controller");
const { authenticateUser } = require("../middleware/auth.middleware");

// POST /api/schema/table
// Protected route: sets req.user.workspaceId
router.post("/table", authenticateUser, createTable);
router.post("/columns", authenticateUser, addColumns);



module.exports = router;