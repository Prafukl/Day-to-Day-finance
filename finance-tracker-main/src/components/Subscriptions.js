import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { FaTrash, FaPause, FaPlay, FaPlus, FaRupeeSign, FaCalendarAlt, FaTags, FaSyncAlt } from 'react-icons/fa';

function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    nextBilling: '',
    category: '',
    active: true
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(collection(db, 'subscriptions'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by next billing date (closest first)
      setSubscriptions(data.sort((a, b) => new Date(a.nextBilling) - new Date(b.nextBilling)));
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userId = auth.currentUser?.uid;
      await addDoc(collection(db, 'subscriptions'), {
        userId,
        ...formData,
        amount: parseFloat(formData.amount),
        createdAt: new Date().toISOString()
      });

      setFormData({
        name: '',
        amount: '',
        frequency: 'monthly',
        nextBilling: '',
        category: '',
        active: true
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, 'subscriptions', id), {
        active: !currentStatus
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        await deleteDoc(doc(db, 'subscriptions', id));
      } catch (error) {
        console.error('Error deleting subscription:', error);
      }
    }
  };

  const categories = [
    { name: 'Entertainment', color: '#F59E0B', icon: '🎬' },
    { name: 'Software', color: '#3B82F6', icon: '💻' },
    { name: 'Education', color: '#06B6D4', icon: '📚' },
    { name: 'Health', color: '#EF4444', icon: '🏥' },
    { name: 'News', color: '#8B5CF6', icon: '📰' },
    { name: 'Other', color: '#64748B', icon: '📌' }
  ];

  const getCategoryColor = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.color : '#64748B';
  };

  const getCategoryIcon = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.icon : '📌';
  };

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const totalMonthly = subscriptions
    .filter(sub => sub.active && sub.frequency === 'monthly')
    .reduce((sum, sub) => sum + sub.amount, 0);

  const totalYearly = subscriptions
    .filter(sub => sub.active && sub.frequency === 'yearly')
    .reduce((sum, sub) => sum + sub.amount, 0);

  return (
    <div className="subscriptions-container">
      <header className="subscriptions-header">
        <div className="header-content">
          <h1>Subscription Manager</h1>
          <p>Track and manage your recurring payments</p>
        </div>
        <button 
          className="add-subscription-btn"
          onClick={() => setShowForm(!showForm)}
        >
          <FaPlus /> {showForm ? 'Cancel' : 'Add Subscription'}
        </button>
      </header>

      <div className="subscription-stats">
        <div className="stat-card">
          <h3>Active Subscriptions</h3>
          <p>{subscriptions.filter(sub => sub.active).length}</p>
        </div>
        <div className="stat-card">
          <h3>Monthly Total</h3>
          <p>₹{totalMonthly.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Yearly Total</h3>
          <p>₹{totalYearly.toFixed(2)}</p>
        </div>
      </div>

      {showForm && (
        <div className="subscription-form-card">
          <h2>Add New Subscription</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Service Name</label>
                <input
                  type="text"
                  placeholder="Netflix, Spotify, etc."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label><FaRupeeSign /> Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label><FaSyncAlt /> Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              
              <div className="form-group">
                <label><FaCalendarAlt /> Next Billing</label>
                <input
                  type="date"
                  value={formData.nextBilling}
                  onChange={(e) => setFormData({ ...formData, nextBilling: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label><FaTags /> Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.name} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <>
                  <span className="spinner"></span> Adding...
                </>
              ) : (
                'Add Subscription'
              )}
            </button>
          </form>
        </div>
      )}

      <div className="subscriptions-grid">
        {subscriptions.length > 0 ? (
          subscriptions.map(sub => (
            <div key={sub.id} className={`subscription-card ${!sub.active ? 'inactive' : ''}`}>
              <div className="sub-header">
                <div className="sub-title">
                  <span 
                    className="category-badge"
                    style={{ backgroundColor: getCategoryColor(sub.category) }}
                  >
                    {getCategoryIcon(sub.category)}
                  </span>
                  <h3>{sub.name}</h3>
                </div>
                <span className={`status ${sub.active ? 'active' : 'paused'}`}>
                  {sub.active ? 'Active' : 'Paused'}
                </span>
              </div>
              <div className="sub-details">
                <div className="detail-item">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value">₹{sub.amount}/{sub.frequency}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Next Billing:</span>
                  <span className="detail-value">{formatDate(sub.nextBilling)}</span>
                </div>
              </div>
              <div className="sub-actions">
                <button 
                  onClick={() => toggleStatus(sub.id, sub.active)} 
                  className={`toggle-btn ${sub.active ? 'pause' : 'resume'}`}
                >
                  {sub.active ? <FaPause /> : <FaPlay />}
                  {sub.active ? 'Pause' : 'Resume'}
                </button>
                <button 
                  onClick={() => handleDelete(sub.id)} 
                  className="delete-btn"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <img src="/empty-subscriptions.svg" alt="No subscriptions" className="empty-image" />
            <h3>No subscriptions found</h3>
            <p>Start by adding your first subscription</p>
            <button 
              className="add-first-btn"
              onClick={() => setShowForm(true)}
            >
              <FaPlus /> Add Subscription
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Subscriptions;