const express = require('express');
const cors = require('cors');

// Initialize the app
const app = express();

// Middleware
app.use(cors()); // Allows cross-origin requests
app.use(express.json()); // Allows us to parse JSON in the request body

// A simple test route
app.get('/', (req, res) => {
  res.send('Welcome to the FeedMeAi API! 🚀');
});

// Define the port
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});