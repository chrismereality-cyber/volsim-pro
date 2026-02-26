const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ VolSim-Pro DB Connected'))
  .catch(err => console.error('❌ DB Connection Error:', err));

// Routes
app.use('/api/auth', require('./api/auth'));
app.use('/api/autopilot', require('./api/autopilot'));
app.use('/api/payment', require('./api/payment')); // Payment Route Active

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('🚀 VolSim-Pro Backend running on port ' + PORT));
