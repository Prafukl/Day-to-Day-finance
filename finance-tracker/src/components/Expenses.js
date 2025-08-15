import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { FaTrash, FaFileUpload, FaRupeeSign, FaCalendarAlt, FaTag, FaAlignLeft, FaPlus, FaReceipt } from 'react-icons/fa';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: '',
    billFile: null
  });
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(collection(db, 'expenses'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, billFile: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const userId = auth.currentUser?.uid;
      let billUrl = '';

      if (formData.billFile) {
        const storageRef = ref(storage, `bills/${userId}/${Date.now()}_${formData.billFile.name}`);
        const snapshot = await uploadBytes(storageRef, formData.billFile);
        billUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'expenses'), {
        userId,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        billUrl,
        createdAt: new Date().toISOString()
      });

      setFormData({
        description: '',
        amount: '',
        category: '',
        date: '',
        billFile: null
      });
      document.getElementById('billInput').value = '';
      setShowForm(false);
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteDoc(doc(db, 'expenses', id));
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const filteredExpenses = activeTab === 'all' 
    ? expenses 
    : expenses.filter(exp => exp.category === activeTab);

  const categories = [
    { value: 'Food', color: '#10B981', icon: '🍔' },
    { value: 'Transport', color: '#3B82F6', icon: '🚗' },
    { value: 'Shopping', color: '#EC4899', icon: '🛍️' },
    { value: 'Entertainment', color: '#F59E0B', icon: '🎬' },
    { value: 'Bills', color: '#8B5CF6', icon: '🧾' },
    { value: 'Healthcare', color: '#EF4444', icon: '🏥' },
    { value: 'Education', color: '#06B6D4', icon: '📚' },
    { value: 'Other', color: '#64748B', icon: '📌' }
  ];

  const getCategoryColor = (category) => {
    const found = categories.find(cat => cat.value === category);
    return found ? found.color : '#64748B';
  };

  const getCategoryIcon = (category) => {
    const found = categories.find(cat => cat.value === category);
    return found ? found.icon : '📌';
  };

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="expenses-container">
      <header className="expenses-header">
        <div className="header-content">
          <h1>Expense Tracker</h1>
          <p>Track and manage your expenses efficiently</p>
        </div>
        <button 
          className="add-expense-btn"
          onClick={() => setShowForm(!showForm)}
        >
          <FaPlus /> {showForm ? 'Cancel' : 'Add Expense'}
        </button>
      </header>
      
      {showForm && (
        <div className="expense-form-card">
          <div className="form-header">
            <FaReceipt className="form-icon" />
            <h2>Add New Expense</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label><FaAlignLeft /> Description</label>
                <input
                  type="text"
                  placeholder="Dinner with friends"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                <label><FaTag /> Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.icon} {cat.value}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label><FaCalendarAlt /> Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group file-group">
                <label htmlFor="billInput" className="file-label">
                  <FaFileUpload /> {formData.billFile ? formData.billFile.name : 'Upload Bill (Optional)'}
                </label>
                <input
                  id="billInput"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="file-input"
                />
              </div>
            </div>
            
            <button type="submit" disabled={uploading} className="submit-btn">
              {uploading ? (
                <>
                  <span className="spinner"></span> Adding...
                </>
              ) : (
                'Add Expense'
              )}
            </button>
          </form>
        </div>
      )}

      <div className="expenses-list-container">
        <div className="expenses-header">
          <div className="header-left">
            <h2>Your Expenses</h2>
            <div className="total-expenses">
              Total: <span>₹{totalExpenses.toFixed(2)}</span>
            </div>
          </div>
          <div className="category-tabs">
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.value}
                className={`tab-btn ${activeTab === cat.value ? 'active' : ''}`}
                onClick={() => setActiveTab(cat.value)}
                style={{ '--category-color': cat.color }}
              >
                {cat.icon} {cat.value}
              </button>
            ))}
          </div>
        </div>
        
        <div className="expenses-list">
          {filteredExpenses.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Bill</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(expense => (
                    <tr key={expense.id}>
                      <td>
                        <div className="date-cell">
                          <div className="date-day">{new Date(expense.date).toLocaleDateString('en-US', { day: 'numeric' })}</div>
                          <div className="date-month">{new Date(expense.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                        </div>
                      </td>
                      <td className="description-cell">{expense.description}</td>
                      <td>
                        <span 
                          className="category-badge"
                          style={{ backgroundColor: getCategoryColor(expense.category) }}
                        >
                          {getCategoryIcon(expense.category)} {expense.category}
                        </span>
                      </td>
                      <td className="amount-cell">₹{expense.amount?.toFixed(2)}</td>
                      <td>
                        {expense.billUrl && (
                          <a 
                            href={expense.billUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bill-link"
                          >
                            View
                          </a>
                        )}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDelete(expense.id)} 
                          className="delete-btn"
                          aria-label="Delete expense"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <img src="/empty-expenses.svg" alt="No expenses" className="empty-image" />
              <h3>No expenses found {activeTab !== 'all' ? `for ${activeTab}` : ''}</h3>
              <p>Start by adding your first expense</p>
              <button 
                className="add-first-btn"
                onClick={() => setShowForm(true)}
              >
                <FaPlus /> Add Expense
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Expenses;