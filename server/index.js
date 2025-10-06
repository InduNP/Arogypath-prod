// server/index.js
const cors = require('cors');
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');

// ✅ Load environment variables from root .env
dotenv.config();


console.log("ENV keys loaded:", Object.keys(process.env));
console.log("GEMINI_API_KEY value:", process.env.GEMINI_API_KEY);

// Debug check
console.log("Loaded GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✅ Found" : "❌ Missing");

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev')); // Log HTTP requests in console

// Serve uploaded files (profile pictures, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/meals', require('./routes/mealRoutes'));
app.use('/api/diet', require('./routes/dietRoutes'));
app.use('/api/analysis', require('./routes/analysisRoutes'));

// Test route
app.get('/', (req, res) => {
  res.send('Ayurveda Diet App API is running...');
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
