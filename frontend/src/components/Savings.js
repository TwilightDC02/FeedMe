import React from 'react';

const Savings = ({ totalSavings }) => {
  return (
    <div className="savings-container">
      <h2>Total Savings</h2>
      <p>You have saved a total of: ${totalSavings}</p>
    </div>
  );
};

export default Savings;