const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 10000; // Matching your log port

app.use(cors());
app.use(express.json());

app.get("/api/data", (req, res) => {
    res.json({
        price: 65000 + (Math.random() * 100),
        status: "STABLE",
        engine: "EXPRESS_V2"
    });
});

app.get("/", (req, res) => {
    res.send("EXPRESS_ENGINE_ONLINE_NO_GRAPHQL");
});

app.listen(PORT, () => {
    console.log(`Express server active on port ${PORT}`);
});
