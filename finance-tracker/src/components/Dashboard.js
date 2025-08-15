import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaMoneyBillWave, FaChartPie, FaChartLine, FaWallet, FaUtensils, FaShoppingCart, FaHome, FaCar, FaGamepad, FaMedkit } from 'react-icons/fa';
import { MdSubscriptions, MdTrendingUp, MdShowChart, MdAccountBalance } from 'react-icons/md';

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState({
    expenses: true,
    subscriptions: true,
    investments: true
  });
  const [subscriptionError, setSubscriptionError] = useState(null);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Fetch expenses
    const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', userId));
    const unsubExpenses = onSnapshot(expensesQuery, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExpenses(data);
        setLoading(prev => ({ ...prev, expenses: false }));
      },
      (error) => {
        console.error("Error fetching expenses:", error);
      }
    );

    // Fetch subscriptions with retry logic
    const setupSubscriptionsListener = () => {
      try {
        const subscriptionsQuery = query(collection(db, 'subscriptions'), where('userId', '==', userId));
        return onSnapshot(
          subscriptionsQuery,
          (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSubscriptions(data);
            setLoading(prev => ({ ...prev, subscriptions: false }));
            setSubscriptionError(null);
          },
          (error) => {
            console.error('Subscription listener error:', error);
            setSubscriptionError('Connection issue. Retrying...');
            setLoading(prev => ({ ...prev, subscriptions: true }));
            setTimeout(setupSubscriptionsListener, 5000);
          }
        );
      } catch (error) {
        console.error('Error setting up subscription listener:', error);
        setSubscriptionError('Failed to load subscriptions');
        return () => {};
      }
    };

    const unsubSubscriptions = setupSubscriptionsListener();

    // Fetch investments
    const investmentsQuery = query(collection(db, 'investments'), where('userId', '==', userId));
    const unsubInvestments = onSnapshot(investmentsQuery, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInvestments(data);
        setLoading(prev => ({ ...prev, investments: false }));
      },
      (error) => {
        console.error("Error fetching investments:", error);
      }
    );

    return () => {
      unsubExpenses();
      unsubSubscriptions();
      unsubInvestments();
    };
  }, []);

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const totalSubscriptions = subscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
  const totalInvestments = investments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  const netWorth = totalInvestments - totalExpenses - totalSubscriptions;

  // Prepare data for charts
  const categoryData = expenses.reduce((acc, exp) => {
    const category = exp.category || 'Other';
    acc[category] = (acc[category] || 0) + parseFloat(exp.amount || 0);
    return acc;
  }, {});

  const pieData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const monthlyData = [
    { name: 'Expenses', amount: totalExpenses },
    { name: 'Subscriptions', amount: totalSubscriptions },
    { name: 'Investments', amount: totalInvestments }
  ];

  // Get category icon
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Food': return <FaUtensils className="category-icon" />;
      case 'Shopping': return <FaShoppingCart className="category-icon" />;
      case 'Housing': return <FaHome className="category-icon" />;
      case 'Transport': return <FaCar className="category-icon" />;
      case 'Entertainment': return <FaGamepad className="category-icon" />;
      case 'Health': return <FaMedkit className="category-icon" />;
      default: return <FaWallet className="category-icon" />;
    }
  };

  const allLoaded = !loading.expenses && !loading.subscriptions && !loading.investments;

  if (!allLoaded) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading your financial dashboard...</p>
      {subscriptionError && <p className="error-message">{subscriptionError}</p>}
    </div>
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1><FaChartLine className="header-icon" /> Financial Dashboard</h1>
        <p className="subtitle">Overview of your financial health</p>
      </header>
      
      <div className="stats-grid">
        <div className="stat-card expense-card">
          <div className="stat-icon">
            <FaMoneyBillWave />
          </div>
          <div className="stat-content">
            <h3>Total Expenses</h3>
            <p className="amount">₹{totalExpenses.toFixed(2)}</p>
            <span className="period">This Month</span>
          </div>
        </div>
        
        <div className="stat-card subscription-card">
          <div className="stat-icon">
            <MdSubscriptions />
          </div>
          <div className="stat-content">
            <h3>Active Subscriptions</h3>
            {subscriptionError ? (
              <p className="error-message">{subscriptionError}</p>
            ) : (
              <>
                <p className="amount">₹{totalSubscriptions.toFixed(2)}</p>
                <span className="period">Monthly</span>
              </>
            )}
          </div>
        </div>
        
        <div className="stat-card investment-card">
          <div className="stat-icon">
            <MdTrendingUp />
          </div>
          <div className="stat-content">
            <h3>Total Investments</h3>
            <p className="amount">₹{totalInvestments.toFixed(2)}</p>
            <span className="period">Portfolio</span>
          </div>
        </div>
        
        <div className={`stat-card networth-card ${netWorth >= 0 ? 'positive' : 'negative'}`}>
          <div className="stat-icon">
            <MdAccountBalance />
          </div>
          <div className="stat-content">
            <h3>Net Worth</h3>
            <p className="amount">₹{netWorth.toFixed(2)}</p>
            <span className="period">Current</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3><FaChartPie /> Expense Categories</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3><MdShowChart /> Financial Overview</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar 
                  dataKey="amount" 
                  radius={[4, 4, 0, 0]} 
                  fill="#4F46E5" 
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="recent-transactions">
        <div className="transactions-header">
          <h3><FaMoneyBillWave /> Recent Transactions</h3>
          <button className="view-all-btn">View All</button>
        </div>
        <div className="transactions-table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.slice(0, 5).map(exp => (
                <tr key={exp.id}>
                  <td>{new Date(exp.date).toLocaleDateString()}</td>
                  <td>{exp.description}</td>
                  <td>
                    <div className="category-cell">
                      {getCategoryIcon(exp.category)}
                      {exp.category || 'Other'}
                    </div>
                  </td>
                  <td className="amount-cell negative">-₹{parseFloat(exp.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;