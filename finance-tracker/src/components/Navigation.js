import React from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { FaWallet, FaChartLine, FaMoneyBillWave, FaCalendarAlt, FaUser, FaSignOutAlt } from 'react-icons/fa';

function Navigation({ user }) {
  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <FaWallet className="brand-icon" />
        <span>Finance Tracker</span>
      </div>
      <div className="nav-links">
        <Link to="/dashboard">
          <FaChartLine className="nav-icon" />
          <span>Dashboard</span>
        </Link>
        <Link to="/expenses">
          <FaMoneyBillWave className="nav-icon" />
          <span>Expenses</span>
        </Link>
        <Link to="/subscriptions">
          <FaCalendarAlt className="nav-icon" />
          <span>Subscriptions</span>
        </Link>
        <Link to="/investments">
          <FaChartLine className="nav-icon" />
          <span>Investments</span>
        </Link>
      </div>
      <div className="nav-user">
        <FaUser className="user-icon" />
        <span className="user-email">{user.email}</span>
        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt className="logout-icon" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}

export default Navigation;