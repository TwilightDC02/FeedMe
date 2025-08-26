import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust the base URL as needed

// Function to fetch promotions
export const fetchPromotions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/promotions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching promotions:', error);
    throw error;
  }
};

// Function to fetch user orders
export const fetchUserOrders = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/orders`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};

// Function to fetch user savings
export const fetchUserSavings = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/savings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user savings:', error);
    throw error;
  }
};

// Function to update subscription
export const updateSubscription = async (userId, subscriptionData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/users/${userId}/subscription`, subscriptionData);
    return response.data;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};