const queryService = require("../services/query.service");

const handleNLQuery = async (req, res) => {
  try {
    const { prompt } = req.body;
    const { workspaceId } = req.user;

    if (!prompt) return res.status(400).json({ success: false, message: "Prompt is required" });

    const response = await queryService.executeNLQuery(workspaceId, prompt);

    return res.status(200).json({
      success: true,
      ...response
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "An error occurred during natural language processing."
    });
  }
};

module.exports = { handleNLQuery };