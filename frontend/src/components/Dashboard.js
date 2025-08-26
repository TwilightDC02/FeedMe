import React, { useEffect, useState } from 'react';
import { fetchOrders, fetchSavings } from '../utils/api';
import Orders from './Orders';
import Savings from './Savings';

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [savings, setSavings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedOrders = await fetchOrders();
        const fetchedSavings = await fetchSavings();
        setOrders(fetchedOrders);
        setSavings(fetchedSavings);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>User Dashboard</h1>
      <Savings savings={savings} />
      <Orders orders={orders} />
    </div>
  );
};

export default Dashboard;