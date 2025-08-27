import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { FaTrash, FaFileUpload, FaRupeeSign, FaCalendarAlt, FaTag, FaAlignLeft, FaPlus, FaReceipt, FaCreditCard, FaEdit } from 'react-icons/fa';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    subcategory: '',
    paymentMethod: '',
    date: '',
    billFile: null
  });
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [customSubcategories, setCustomSubcategories] = useState({});
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState('');

  // Categories with subcategories
  const categoriesData = {
    Food: {
      icon: '🍔',
      color: '#10B981',
      subcategories: ['Zomato', 'Street Food', 'Groceries', 'Restaurant', 'Cafe']
    },
    Transport: {
      icon: '🚗',
      color: '#3B82F6',
      subcategories: ['Uber', 'Bus', 'Train', 'Petrol', 'Auto']
    },
    Shopping: {
      icon: '🛍️',
      color: '#EC4899',
      subcategories: ['Amazon', 'Clothes', 'Electronics', 'Home', 'Online']
    },
    Entertainment: {
      icon: '🎬',
      color: '#F59E0B',
      subcategories: ['Movies', 'Games', 'Streaming', 'Events', 'Sports']
    },
    Bills: {
      icon: '🧾',
      color: '#8B5CF6',
      subcategories: ['Electricity', 'Internet', 'Phone', 'Water', 'Gas']
    },
    Healthcare: {
      icon: '🏥',
      color: '#EF4444',
      subcategories: ['Medicine', 'Doctor', 'Insurance', 'Hospital', 'Checkup']
    },
    Education: {
      icon: '📚',
      color: '#06B6D4',
      subcategories: ['Books', 'Course', 'Tuition', 'Online', 'Supplies']
    },
    Other: {
      icon: '📌',
      color: '#64748B',
      subcategories: ['Miscellaneous', 'Gift', 'Donation', 'Personal']
    }
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'card', label: 'Debit/Credit Card', icon: '💳' },
    { value: 'upi', label: 'UPI', icon: '📱' },
    { value: 'netbanking', label: 'Net Banking', icon: '🏦' },
    { value: 'wallet', label: 'Digital Wallet', icon: '👛' }
  ];

  const categories = Object.keys(categoriesData).map(key => ({
    value: key,
    ...categoriesData[key]
  }));

  // Load custom subcategories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customSubcategories');
    if (saved) {
      setCustomSubcategories(JSON.parse(saved));
    }
  }, []);

  // Save custom subcategories to localStorage
  useEffect(() => {
    localStorage.setItem('customSubcategories', JSON.stringify(customSubcategories));
  }, [customSubcategories]);

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

  const handleCategoryChange = (category) => {
    setFormData({ ...formData, category, subcategory: '' });
    setShowCustomInput(false);
    setNewSubcategory('');
  };

  const addCustomSubcategory = () => {
    if (newSubcategory.trim() && formData.category) {
      const updated = { ...customSubcategories };
      if (!updated[formData.category]) {
        updated[formData.category] = [];
      }
      if (!updated[formData.category].includes(newSubcategory.trim())) {
        updated[formData.category].push(newSubcategory.trim());
        setCustomSubcategories(updated);
        setFormData({ ...formData, subcategory: newSubcategory.trim() });
      }
      setNewSubcategory('');
      setShowCustomInput(false);
    }
  };

  const getAllSubcategories = (category) => {
    const defaults = categoriesData[category]?.subcategories || [];
    const customs = customSubcategories[category] || [];
    return [...defaults, ...customs];
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

      const expenseData = {
        userId,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        subcategory: formData.subcategory,
        paymentMethod: formData.paymentMethod,
        date: formData.date,
        billUrl: billUrl || (editingExpense?.billUrl || ''),
        createdAt: editingExpense?.createdAt || new Date().toISOString()
      };

      if (editingExpense) {
        // Update existing expense
        const expenseRef = doc(db, 'expenses', editingExpense.id);
        await updateDoc(expenseRef, expenseData);
        setEditingExpense(null);
      } else {
        // Add new expense
        await addDoc(collection(db, 'expenses'), expenseData);
      }

      setFormData({
        description: '',
        amount: '',
        category: '',
        subcategory: '',
        paymentMethod: '',
        date: '',
        billFile: null
      });
      document.getElementById('billInput').value = '';
      setShowForm(false);
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      subcategory: expense.subcategory || '',
      paymentMethod: expense.paymentMethod || '',
      date: expense.date,
      billFile: null
    });
    setEditingExpense(expense);
    setShowForm(true);
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

  const getCategoryColor = (category) => {
    return categoriesData[category]?.color || '#64748B';
  };

  const getCategoryIcon = (category) => {
    return categoriesData[category]?.icon || '📌';
  };

  const getPaymentIcon = (method) => {
    const payment = paymentMethods.find(p => p.value === method);
    return payment?.icon || '💳';
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
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingExpense(null);
              setFormData({
                description: '',
                amount: '',
                category: '',
                subcategory: '',
                paymentMethod: '',
                date: '',
                billFile: null
              });
            }
          }}
        >
          <FaPlus /> {showForm ? 'Cancel' : 'Add Expense'}
        </button>
      </header>
      
      {showForm && (
        <div className="expense-form-card">
          <div className="form-header">
            <FaReceipt className="form-icon" />
            <h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
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
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.icon} {cat.value}</option>
                  ))}
                </select>
              </div>

              {formData.category && (
                <div className="form-group">
                  <label><FaTag /> Subcategory</label>
                  <div className="subcategory-input-group">
                    <select
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      required
                    >
                      <option value="">Select Subcategory</option>
                      {getAllSubcategories(formData.category).map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="add-subcategory-btn"
                      onClick={() => setShowCustomInput(!showCustomInput)}
                    >
                      <FaPlus /> Add New
                    </button>
                  </div>
                  {showCustomInput && (
                    <div>
                      <input
                        type="text"
                        className="custom-subcategory-input"
                        placeholder="Enter new subcategory"
                        value={newSubcategory}
                        onChange={(e) => setNewSubcategory(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomSubcategory()}
                      />
                      <button
                        type="button"
                        className="save-subcategory-btn"
                        onClick={addCustomSubcategory}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label><FaCreditCard /> Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  required
                >
                  <option value="">Select Payment Method</option>
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.icon} {method.label}
                    </option>
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
                  <span className="spinner"></span> {editingExpense ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingExpense ? 'Update Expense' : 'Add Expense'
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
                    <th>Subcategory</th>
                    <th>Payment</th>
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
                      <td className="subcategory-cell">
                        {expense.subcategory && (
                          <span className="subcategory-tag">
                            {expense.subcategory}
                          </span>
                        )}
                      </td>
                      <td className="payment-cell">
                        {expense.paymentMethod && (
                          <span className="payment-tag">
                            {getPaymentIcon(expense.paymentMethod)} {expense.paymentMethod}
                          </span>
                        )}
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
                        <div className="action-buttons">
                          <button 
                            onClick={() => handleEdit(expense)} 
                            className="edit-btn"
                            aria-label="Edit expense"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => handleDelete(expense.id)} 
                            className="delete-btn"
                            aria-label="Delete expense"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
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