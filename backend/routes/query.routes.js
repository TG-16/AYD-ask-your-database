const express = require("express");
const router = express.Router();
const { handleNLQuery } = require("../controllers/query.controller");
const { authenticateUser } = require("../middleware/auth.middleware"); // Assuming this exists

// Route Definition (routes/query.routes.js)
// router.post("/nl", authenticateToken, queryController.handleNLQuery);

router.post("/nl", authenticateUser, handleNLQuery);

module.exports = router;