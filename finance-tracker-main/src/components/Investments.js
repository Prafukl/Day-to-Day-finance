import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function Investments() {
  const [investments, setInvestments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    amount: '',
    purchaseDate: '',
    currentValue: '',
    notes: ''
  });

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(collection(db, 'investments'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvestments(data);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const userId = auth.currentUser?.uid;
      await addDoc(collection(db, 'investments'), {
        userId,
        ...formData,
        amount: parseFloat(formData.amount),
        currentValue: parseFloat(formData.currentValue || formData.amount),
        createdAt: new Date().toISOString()
      });

      setFormData({
        name: '',
        type: '',
        amount: '',
        purchaseDate: '',
        currentValue: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding investment:', error);
    }
  };

  const handleUpdateValue = async (id, newValue) => {
    try {
      await updateDoc(doc(db, 'investments', id), {
        currentValue: parseFloat(newValue)
      });
    } catch (error) {
      console.error('Error updating investment:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        await deleteDoc(doc(db, 'investments', id));
      } catch (error) {
        console.error('Error deleting investment:', error);
      }
    }
  };

  const investmentTypes = ['Stocks', 'Mutual Funds', 'Bonds', 'Real Estate', 'Crypto', 'Gold', 'FD', 'Other'];

  // Calculate portfolio data
  const portfolioData = investmentTypes.map(type => {
    const total = investments
      .filter(inv => inv.type === type)
      .reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
    return { name: type, value: total };
  }).filter(item => item.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

  const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const currentValue = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
  const totalReturns = currentValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(2) : 0;

  return (
    <div className="investments-container">
      <h1>Investment Portfolio</h1>
      
      <div className="portfolio-summary">
        <div className="summary-card">
          <h3>Total Invested</h3>
          <p>₹{totalInvested.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Current Value</h3>
          <p>₹{currentValue.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Returns</h3>
          <p className={totalReturns >= 0 ? 'profit' : 'loss'}>
            ₹{totalReturns.toFixed(2)} ({returnPercentage}%)
          </p>
        </div>
      </div>

      <div className="investment-content">
        <div className="investment-form-section">
          <div className="investment-form-card">
            <h2>Add New Investment</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Investment Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="">Select Type</option>
                {investmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Investment Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Current Value (optional)"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
              />
              <input
                type="date"
                placeholder="Purchase Date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                required
              />
              <textarea
                placeholder="Notes (optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
              />
              <button type="submit">Add Investment</button>
            </form>
          </div>
        </div>

        <div className="portfolio-chart">
          <h2>Portfolio Distribution</h2>
          {portfolioData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={portfolioData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {portfolioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No investments yet</p>
          )}
        </div>
      </div>

      <div className="investments-list">
        <h2>Your Investments</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Purchase Date</th>
              <th>Invested</th>
              <th>Current Value</th>
              <th>Returns</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {investments.map(inv => {
              const returns = (inv.currentValue || inv.amount) - inv.amount;
              const returnPct = inv.amount > 0 ? (returns / inv.amount * 100).toFixed(2) : 0;
              
              return (
                <tr key={inv.id}>
                  <td>{inv.name}</td>
                  <td><span className="type-badge">{inv.type}</span></td>
                  <td>{inv.purchaseDate}</td>
                  <td>₹{inv.amount?.toFixed(2)}</td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={inv.currentValue || inv.amount}
                      onChange={(e) => handleUpdateValue(inv.id, e.target.value)}
                      className="value-input"
                    />
                  </td>
                  <td className={returns >= 0 ? 'profit' : 'loss'}>
                    ₹{returns.toFixed(2)} ({returnPct}%)
                  </td>
                  <td>
                    <button onClick={() => handleDelete(inv.id)} className="delete-btn">
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Investments;