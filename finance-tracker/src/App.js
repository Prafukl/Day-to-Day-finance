// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Expenses from './components/Expenses';
import Subscriptions from './components/Subscriptions';
import Investments from './components/Investments';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        {user ? (
          <>
            <Navigation user={user} />
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </>
        ) : (
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;