const express = require('express');
const router = express.Router();
const Promo = require('../models/PromoModel')

// Route to fetch credit card promotions
router.get('/', async (req, res) => {
  try{
    const promos = await Promo.find({});
    res.json(promos);
  } catch(err){
    console.error(err.message);
    res.status(500).send('Server Error')
  }
});

// Route to fetch user data
router.get('/user', getUserData);

module.exports = router;