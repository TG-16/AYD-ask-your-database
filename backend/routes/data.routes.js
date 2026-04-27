const express = require("express");
const router = express.Router();
const { insertData } = require("../controllers/data.controller");
const { authenticateUser } = require("../middleware/auth.middleware"); // Assuming this exists

// POST /api/data/insert
router.post("/insert", authenticateUser, insertData);

module.exports = router;