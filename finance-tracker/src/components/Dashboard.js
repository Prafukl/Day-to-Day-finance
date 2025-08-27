import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaMoneyBillWave, FaChartPie, FaChartLine, FaWallet, FaUtensils, FaShoppingCart, FaHome, FaCar, FaGamepad, FaMedkit, FaCalendarDay, FaCalendarWeek } from 'react-icons/fa';
import { MdSubscriptions, MdTrendingUp, MdShowChart, MdAccountBalance, MdFilterList } from 'react-icons/md';

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
  
  // New state for expense filtering
  const [expenseFilter, setExpenseFilter] = useState('daily');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

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

  // Expense filtering function
  const getFilteredExpenses = () => {
    const selected = new Date(filterDate);
    
    if (expenseFilter === 'daily') {
      return expenses.filter(exp => {
        const expDate = new Date(exp.date).toDateString();
        return expDate === selected.toDateString();
      });
    } else {
      const weekStart = new Date(selected);
      weekStart.setDate(selected.getDate() - selected.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= weekStart && expDate <= weekEnd;
      });
    }
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const totalSubscriptions = subscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
  const totalInvestments = investments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  const netWorth = totalInvestments - totalExpenses - totalSubscriptions;

  // Filtered expense calculations
  const filteredExpenses = getFilteredExpenses();
  const filteredTotal = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const filteredCategoryData = filteredExpenses.reduce((acc, exp) => {
    const category = exp.category || 'Other';
    acc[category] = (acc[category] || 0) + parseFloat(exp.amount || 0);
    return acc;
  }, {});

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

      {/* Mobile Responsive Expense Filter Section */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: window.innerWidth < 768 ? '15px' : '20px',
        marginBottom: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* Header - Stack on mobile */}
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
          marginBottom: '20px',
          gap: window.innerWidth < 768 ? '15px' : '0'
        }}>
          <h3 style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: 0,
            fontSize: window.innerWidth < 768 ? '16px' : '18px'
          }}>
            <MdFilterList style={{color: '#4F46E5'}} />
            Expense Analysis
          </h3>
          
          {/* Controls - Stack on mobile */}
          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            gap: '10px',
            alignItems: 'stretch',
            width: window.innerWidth < 768 ? '100%' : 'auto'
          }}>
            <div style={{
              display: 'flex',
              gap: '5px',
              width: '100%'
            }}>
              <button
                onClick={() => setExpenseFilter('daily')}
                style={{
                  padding: window.innerWidth < 768 ? '12px 16px' : '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: window.innerWidth < 768 ? '14px' : '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: expenseFilter === 'daily' ? '#4F46E5' : '#f3f4f6',
                  color: expenseFilter === 'daily' ? 'white' : '#6b7280',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  flex: '1',
                  whiteSpace: 'nowrap'
                }}
              >
                <FaCalendarDay size={12} />
                Daily
              </button>
              <button
                onClick={() => setExpenseFilter('weekly')}
                style={{
                  padding: window.innerWidth < 768 ? '12px 16px' : '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: window.innerWidth < 768 ? '14px' : '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: expenseFilter === 'weekly' ? '#4F46E5' : '#f3f4f6',
                  color: expenseFilter === 'weekly' ? 'white' : '#6b7280',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  flex: '1',
                  whiteSpace: 'nowrap'
                }}
              >
                <FaCalendarWeek size={12} />
                Weekly
              </button>
            </div>
            <div style={{
              width: '100%',
              maxWidth: window.innerWidth < 768 ? '100%' : '150px'
            }}>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{
                  padding: window.innerWidth < 768 ? '12px 10px' : '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: window.innerWidth < 768 ? '14px' : '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  width: '100%',
                  boxSizing: 'border-box',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>
        </div>
        
        {/* Cards - Single column on mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: window.innerWidth < 768 ? '12px' : '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: window.innerWidth < 768 ? '14px' : '16px',
            borderRadius: '8px'
          }}>
            <h4 style={{
              margin: '0 0 6px 0',
              fontSize: window.innerWidth < 768 ? '13px' : '14px',
              opacity: 0.9
            }}>
              {expenseFilter === 'daily' ? 'Daily' : 'Weekly'} Total
            </h4>
            <p style={{
              margin: 0,
              fontSize: window.innerWidth < 768 ? '20px' : '24px',
              fontWeight: 'bold'
            }}>
              ₹{filteredTotal.toFixed(2)}
            </p>
            <span style={{
              fontSize: window.innerWidth < 768 ? '11px' : '12px',
              opacity: 0.8
            }}>
              {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            padding: window.innerWidth < 768 ? '14px' : '16px',
            borderRadius: '8px'
          }}>
            <h4 style={{
              margin: '0 0 6px 0',
              fontSize: window.innerWidth < 768 ? '13px' : '14px',
              opacity: 0.9
            }}>
              Top Category
            </h4>
            {(() => {
              const topCategory = Object.entries(filteredCategoryData).sort((a, b) => b[1] - a[1])[0];
              return topCategory ? (
                <>
                  <p style={{
                    margin: 0,
                    fontSize: window.innerWidth < 768 ? '14px' : '16px',
                    fontWeight: '600'
                  }}>
                    {topCategory[0]}
                  </p>
                  <span style={{
                    fontSize: window.innerWidth < 768 ? '12px' : '14px',
                    opacity: 0.8
                  }}>
                    ₹{topCategory[1].toFixed(2)}
                  </span>
                </>
              ) : (
                <p style={{
                  margin: 0,
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  opacity: 0.8
                }}>
                  No expenses
                </p>
              );
            })()}
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            padding: window.innerWidth < 768 ? '14px' : '16px',
            borderRadius: '8px'
          }}>
            <h4 style={{
              margin: '0 0 6px 0',
              fontSize: window.innerWidth < 768 ? '13px' : '14px',
              opacity: 0.9
            }}>
              Avg per Day
            </h4>
            <p style={{
              margin: 0,
              fontSize: window.innerWidth < 768 ? '14px' : '16px',
              fontWeight: '600'
            }}>
              ₹{expenseFilter === 'weekly' ? (filteredTotal / 7).toFixed(2) : filteredTotal.toFixed(2)}
            </p>
            <span style={{
              fontSize: window.innerWidth < 768 ? '11px' : '12px',
              opacity: 0.8
            }}>
              {expenseFilter === 'weekly' ? 'This week' : 'Today'}
            </span>
          </div>
        </div>
        
        {/* Transaction List */}
        {filteredExpenses.length > 0 && (
          <div>
            <h4 style={{
              marginBottom: '12px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: window.innerWidth < 768 ? '14px' : '16px'
            }}>
              <FaMoneyBillWave style={{color: '#4F46E5'}} />
              Filtered Transactions
            </h4>
            <div style={{
              maxHeight: window.innerWidth < 768 ? '150px' : '200px',
              overflowY: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}>
              {filteredExpenses.map(exp => (
                <div key={exp.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: window.innerWidth < 768 ? '10px 12px' : '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  background: 'white',
                  transition: 'background 0.2s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: window.innerWidth < 768 ? '8px' : '10px',
                    flex: 1,
                    minWidth: 0
                  }}>
                    {getCategoryIcon(exp.category)}
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{
                        color: '#374151',
                        fontSize: window.innerWidth < 768 ? '13px' : '14px',
                        fontWeight: '500',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {exp.description}
                      </div>
                      <div style={{
                        color: '#9ca3af',
                        fontSize: window.innerWidth < 768 ? '11px' : '12px',
                        display: window.innerWidth < 480 ? 'block' : 'inline'
                      }}>
                        {new Date(exp.date).toLocaleDateString()}
                        {window.innerWidth >= 480 && ` • ${exp.category || 'Other'}`}
                      </div>
                      {window.innerWidth < 480 && (
                        <div style={{
                          color: '#9ca3af',
                          fontSize: '11px'
                        }}>
                          {exp.category || 'Other'}
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{
                    fontWeight: '600',
                    color: '#dc2626',
                    fontSize: window.innerWidth < 768 ? '13px' : '14px',
                    marginLeft: '8px',
                    flexShrink: 0
                  }}>
                    -₹{parseFloat(exp.amount || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
        
        {/* Mobile-friendly transaction list */}
        {window.innerWidth < 768 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '10px 0'
          }}>
            {expenses.slice(0, 5).map(exp => (
              <div key={exp.id} style={{
                background: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      {getCategoryIcon(exp.category)}
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {exp.description}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {new Date(exp.date).toLocaleDateString()} • {exp.category || 'Other'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#dc2626',
                    marginLeft: '12px',
                    flexShrink: 0
                  }}>
                    -₹{parseFloat(exp.amount).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

export default Dashboard;