const express = require("express");
const router = express.Router();
const { createTable } = require("../controllers/schema.controller");
const { authenticateUser } = require("../middleware/auth.middleware"); // Assuming this exists

// POST /api/schema/table
// Protected route: sets req.user.workspaceId
router.post("/table", authenticateUser, createTable);

module.exports = router;