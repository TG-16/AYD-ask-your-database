require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/auth.routes");
const schemaRoutes = require("./routes/schema.routes");
const dataRoute = require("./routes/data.routes");
const morgan = require("morgan");
const PORT = process.env.PORT || 5000;

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/schema", schemaRoutes);
app.use("/api/data", dataRoute);

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
