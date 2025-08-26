const express = require('express');
const router = express.Router();
const { getPromotions, getUserData } = require('../controllers/index');

// Route to fetch credit card promotions
router.get('/promotions', getPromotions);

// Route to fetch user data
router.get('/user', getUserData);

module.exports = router;