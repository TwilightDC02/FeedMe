import React, { useState, useEffect } from 'react';
import { fetchSubscriptionData, updateSubscription } from '../utils/api';

const Subscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getSubscriptionData = async () => {
      try {
        const data = await fetchSubscriptionData();
        setSubscription(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getSubscriptionData();
  }, []);

  const handleUpdate = async (newSubscription) => {
    try {
      await updateSubscription(newSubscription);
      setSubscription(newSubscription);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Manage Your Subscription</h2>
      {subscription ? (
        <div>
          <p>Current Plan: {subscription.plan}</p>
          <button onClick={() => handleUpdate({ plan: 'premium' })}>
            Upgrade to Premium
          </button>
          <button onClick={() => handleUpdate({ plan: 'basic' })}>
            Downgrade to Basic
          </button>
        </div>
      ) : (
        <p>No subscription found.</p>
      )}
    </div>
  );
};

export default Subscription;