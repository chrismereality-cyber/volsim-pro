const express = require('express');
const cors = require('cors');
const app = express();

// Updated CORS: Allow EVERYTHING for debugging
app.use(cors({ origin: '*' })); 
app.use(express.json());

const experts = [
    { id: 1, name: "Risk Manager AI", specialty: "risk", bio: "Focused on hedging and drawdown protection." },
    { id: 2, name: "Volatility Bot", specialty: "volatility", bio: "Expert in high-volatility breakout trades." },
    { id: 3, name: "Scalp Master", specialty: "fast", bio: "High-frequency specialist for quick scalps." }
];

app.get('/health', (req, res) => res.json({ status: "ok" }));
app.get('/api/experts', (req, res) => res.json(experts));

app.post('/api/journal', (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });
    const lowerText = text.toLowerCase();
    let suggested = experts.filter(e => lowerText.includes(e.specialty));
    if (suggested.length === 0) suggested = [experts[0]]; 
    res.json({ suggestedExperts: suggested });
});

app.get('/', (req, res) => res.send("Titan Bridge Root Online"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Titan Server running on port ${PORT}`));
