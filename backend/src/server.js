require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { scrapeBpiPromos } = require('./scrapers/bpi-scraper.js');


// Initialize the app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows cross-origin requests
app.use(express.json()); // Allows us to parse JSON in the request body


// --- 3. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully!'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// A simple test route
app.get('/', (req, res) => {
  res.send('Welcome to the FeedMeAi API! 🚀');
});

app.use('/api/promos', require('./routes/promoRoutes.js'))

app.post('/api/scrape', async (req, res) => {
  console.log('Scraping process initiated via API call...');
  try {
    // We don't use 'await' here so the server can respond immediately
    // while the scraper runs in the background.
    scrapeBpiPromos(); 
    res.status(202).json({ message: 'Scraping process started successfully.' });
  } catch (error) {
    console.error('Failed to start scraper:', error);
    res.status(500).json({ message: 'Failed to start scraping process.' });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});