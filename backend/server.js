const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Health Checks for Render
app.get("/", (req, res) => res.send("VolSim-Pro API is Running..."));
app.get("/health", (req, res) => res.status(200).send("OK"));

// Routes
app.use("/api/auth", require("./api/auth"));
app.use("/api/autopilot", require("./api/autopilot"));
app.use("/api/payment", require("./api/payment"));

// DB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ VolSim-Pro DB Connected"))
    .catch(err => console.log("❌ DB Connection Error:", err));

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
    console.log("🚀 VolSim-Pro Engine started on port " + PORT);
});

// Sync Trigger: 02/28/2026 21:45:17
