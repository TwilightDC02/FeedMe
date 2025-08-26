import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Savings from './components/Savings';
import Subscription from './components/Subscription';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/orders" component={Orders} />
        <Route path="/savings" component={Savings} />
        <Route path="/subscription" component={Subscription} />
      </Switch>
    </Router>
  );
}

export default App;