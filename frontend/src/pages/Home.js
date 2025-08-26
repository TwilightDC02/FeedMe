import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home">
      <h1>Welcome to FeedMeAi</h1>
      <p>Your one-stop solution for credit card promotions and dining offers.</p>
      <p>Visualize your orders and savings with our user-friendly dashboard.</p>
      <p>Subscribe for premium features and maximize your savings!</p>
      <Link to="/login" className="btn">Login</Link>
    </div>
  );
};

export default Home;