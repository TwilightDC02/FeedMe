const promotionsController = require('./promotionsController');
const userController = require('./userController');

module.exports = {
  getPromotions: promotionsController.getPromotions,
  getUserData: userController.getUserData,
  // Add more controller exports as needed
};