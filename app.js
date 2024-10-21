const express = require('express');
const connectDB = require('./config/db');
const landRoutes = require('./routes/landRoutes');
const userRoutes = require('./routes/userRoutes');
const path = require('path');

// Initialize express app
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB
connectDB();

// Ensure uploads directory exists
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/lands', landRoutes);
app.use('/api/users', userRoutes);

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});