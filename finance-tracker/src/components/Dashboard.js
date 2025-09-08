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

  // Updated color scheme to match analytics dashboard
  const COLORS = ['#4285F4', '#34A853', '#EA4335', '#FBBC04', '#9AA0A6', '#FF6D01'];

  const monthlyData = [
    { name: 'Expenses', amount: totalExpenses },
    { name: 'Subscriptions', amount: totalSubscriptions },
    { name: 'Investments', amount: totalInvestments }
  ];

  // Get category icon with blue theme
  const getCategoryIcon = (category) => {
    const iconStyle = { fontSize: '16px', color: '#4285F4' };
    switch(category) {
      case 'Food': return <FaUtensils style={iconStyle} />;
      case 'Shopping': return <FaShoppingCart style={iconStyle} />;
      case 'Housing': return <FaHome style={iconStyle} />;
      case 'Transport': return <FaCar style={iconStyle} />;
      case 'Entertainment': return <FaGamepad style={iconStyle} />;
      case 'Health': return <FaMedkit style={iconStyle} />;
      default: return <FaWallet style={iconStyle} />;
    }
  };

  const allLoaded = !loading.expenses && !loading.subscriptions && !loading.investments;

  if (!allLoaded) return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '3px solid #e9ecef',
          borderTop: '3px solid #4285F4',
          borderRadius: '50%',
          margin: '0 auto 16px',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#6c757d', marginTop: '16px' }}>Loading your financial dashboard...</p>
        {subscriptionError && <p style={{ color: '#dc3545', marginTop: '8px' }}>{subscriptionError}</p>}
      </div>
      <style>
        {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
      </style>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      padding: '24px' 
    }}>
      {/* Header */}
      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{
            backgroundColor: '#4285F4',
            padding: '16px',
            borderRadius: '12px',
            marginRight: '16px',
            boxShadow: '0 2px 8px rgba(66, 133, 244, 0.15)'
          }}>
            <FaChartLine style={{ fontSize: '32px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '600', 
              color: '#202124', 
              margin: '0 0 4px 0'
            }}>
              Financial Dashboard
            </h1>
            <p style={{ color: '#5f6368', margin: 0, fontSize: '16px' }}>Overview of your financial health</p>
          </div>
        </div>
      </header>
      
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {[
          {
            title: 'Total Expenses',
            amount: `₹${totalExpenses.toFixed(2)}`,
            period: 'This Month',
            icon: FaMoneyBillWave,
            backgroundColor: '#8E24AA',
            hoverColor: '#7B1FA2'
          },
          {
            title: 'Active Subscriptions', 
            amount: subscriptionError ? 'Error' : `₹${totalSubscriptions.toFixed(2)}`,
            period: 'Monthly',
            icon: MdSubscriptions,
            backgroundColor: '#1976D2',
            hoverColor: '#1565C0'
          },
          {
            title: 'Total Investments',
            amount: `₹${totalInvestments.toFixed(2)}`,
            period: 'Portfolio',
            icon: MdTrendingUp,
            backgroundColor: '#388E3C',
            hoverColor: '#2E7D32'
          },
          {
            title: 'Net Worth',
            amount: `₹${netWorth.toFixed(2)}`,
            period: 'Current',
            icon: MdAccountBalance,
            backgroundColor: netWorth >= 0 ? '#F57C00' : '#D32F2F',
            hoverColor: netWorth >= 0 ? '#EF6C00' : '#C62828'
          }
        ].map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div key={index} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
              border: '1px solid #e8eaed',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  backgroundColor: card.backgroundColor,
                  padding: '12px',
                  borderRadius: '8px',
                  marginRight: '16px'
                }}>
                  <IconComponent style={{ fontSize: '24px', color: 'white' }} />
                </div>
                <div>
                  <p style={{
                    color: '#5f6368',
                    fontSize: '14px',
                    fontWeight: '500',
                    margin: '0 0 4px 0'
                  }}>
                    {card.title}
                  </p>
                  <p style={{
                    fontSize: '28px',
                    fontWeight: '600',
                    color: '#202124',
                    margin: '0 0 4px 0'
                  }}>
                    {card.amount}
                  </p>
                  <p style={{ color: '#5f6368', fontSize: '14px', margin: 0 }}>{card.period}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expense Analysis Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        border: '1px solid #e8eaed'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 1024 ? 'column' : 'row',
          alignItems: window.innerWidth < 1024 ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          gap: window.innerWidth < 1024 ? '16px' : '0'
        }}>
          <h3 style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '20px',
            fontWeight: '600',
            color: '#202124',
            margin: 0
          }}>
            <MdFilterList style={{ fontSize: '24px', color: '#4285F4', marginRight: '8px' }} />
            Expense Analysis
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth < 640 ? 'column' : 'row',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['daily', 'weekly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setExpenseFilter(period)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontWeight: '500',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid #dadce0',
                    cursor: 'pointer',
                    backgroundColor: expenseFilter === period ? '#4285F4' : 'white',
                    color: expenseFilter === period ? 'white' : '#5f6368'
                  }}
                >
                  {period === 'daily' ? <FaCalendarDay style={{ fontSize: '14px' }} /> : <FaCalendarWeek style={{ fontSize: '14px' }} />}
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #dadce0',
                borderRadius: '4px',
                outline: 'none',
                backgroundColor: 'white',
                color: '#202124',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {[
            {
              title: `${expenseFilter === 'daily' ? 'Daily' : 'Weekly'} Total`,
              amount: `₹${filteredTotal.toFixed(2)}`,
              subtitle: `${filteredExpenses.length} transaction${filteredExpenses.length !== 1 ? 's' : ''}`,
              backgroundColor: '#4285F4'
            },
            {
              title: 'Top Category',
              amount: (() => {
                const topCategory = Object.entries(filteredCategoryData).sort((a, b) => b[1] - a[1])[0];
                return topCategory ? topCategory[0] : 'No expenses';
              })(),
              subtitle: (() => {
                const topCategory = Object.entries(filteredCategoryData).sort((a, b) => b[1] - a[1])[0];
                return topCategory ? `₹${topCategory[1].toFixed(2)}` : '';
              })(),
              backgroundColor: '#34A853'
            },
            {
              title: 'Avg per Day',
              amount: `₹${(expenseFilter === 'weekly' ? filteredTotal / 7 : filteredTotal).toFixed(2)}`,
              subtitle: expenseFilter === 'weekly' ? 'This week' : 'Today',
              backgroundColor: '#EA4335'
            }
          ].map((card, index) => (
            <div key={index} style={{
              backgroundColor: card.backgroundColor,
              borderRadius: '8px',
              padding: '20px',
              color: 'white',
              transition: 'transform 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
            }}
            >
              <h4 style={{
                fontSize: '14px',
                opacity: 0.9,
                margin: '0 0 8px 0',
                fontWeight: '500'
              }}>
                {card.title}
              </h4>
              <p style={{
                fontSize: '24px',
                fontWeight: '600',
                margin: '0 0 4px 0'
              }}>
                {card.amount}
              </p>
              <span style={{
                fontSize: '12px',
                opacity: 0.8
              }}>
                {card.subtitle}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 1fr',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          border: '1px solid #e8eaed'
        }}>
          <h3 style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '18px',
            fontWeight: '600',
            color: '#202124',
            margin: '0 0 16px 0'
          }}>
            <FaChartPie style={{ fontSize: '20px', color: '#4285F4', marginRight: '8px' }} />
            Expense Categories
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
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
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e8eaed',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    color: '#202124'
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: '#5f6368' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          border: '1px solid #e8eaed'
        }}>
          <h3 style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '18px',
            fontWeight: '600',
            color: '#202124',
            margin: '0 0 16px 0'
          }}>
            <MdShowChart style={{ fontSize: '20px', color: '#4285F4', marginRight: '8px' }} />
            Financial Overview
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                <XAxis dataKey="name" stroke="#5f6368" fontSize={12} />
                <YAxis stroke="#5f6368" fontSize={12} />
                <Tooltip 
                  formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e8eaed',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    color: '#202124'
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  radius={[4, 4, 0, 0]} 
                  fill="#4285F4"
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        border: '1px solid #e8eaed'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <h3 style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '18px',
            fontWeight: '600',
            color: '#202124',
            margin: 0
          }}>
            <FaMoneyBillWave style={{ fontSize: '20px', color: '#4285F4', marginRight: '8px' }} />
            Recent Transactions
          </h3>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#4285F4',
            color: 'white',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: '500',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#3367D6';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#4285F4';
          }}
          >
            View All
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e8eaed' }}>
                {['Date', 'Description', 'Category', 'Amount'].map((header) => (
                  <th key={header} style={{
                    textAlign: header === 'Amount' ? 'right' : 'left',
                    padding: '12px 8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    color: '#5f6368'
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.slice(0, 5).map((exp, index) => (
                <tr key={exp.id} style={{
                  borderBottom: '1px solid #f1f3f4',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
                >
                  <td style={{
                    padding: '12px 8px',
                    color: '#5f6368',
                    fontSize: '14px'
                  }}>
                    {new Date(exp.date).toLocaleDateString()}
                  </td>
                  <td style={{
                    padding: '12px 8px',
                    color: '#202124',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    {exp.description}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {getCategoryIcon(exp.category)}
                      <span style={{ color: '#5f6368', fontSize: '14px' }}>{exp.category || 'Other'}</span>
                    </div>
                  </td>
                  <td style={{
                    padding: '12px 8px',
                    textAlign: 'right',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#ea4335'
                  }}>
                    -₹{parseFloat(exp.amount).toFixed(2)}
                  </td>
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