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
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const sidebarWidth = isCollapsed ? '80px' : '256px';

  return (
    <Router>
      {user ? (
        <div style={{ display: 'flex', height: '100vh' }}>
          <Navigation 
            user={user} 
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
          <main style={{ 
            flex: 1, 
            marginLeft: sidebarWidth, 
            overflowY: 'auto',
            transition: 'margin-left 0.3s ease'
          }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;