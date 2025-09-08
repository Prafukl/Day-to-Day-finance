import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { FaWallet, FaChartLine, FaMoneyBillWave, FaCalendarAlt, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

function Navigation({ user, isCollapsed, setIsCollapsed }) {
  const location = useLocation();

  const handleLogout = () => {
    signOut(auth);
  };

  const sidebarWidth = isCollapsed ? '80px' : '256px';

  return (
    <nav style={{
      backgroundColor: 'white',
      color: '#202124',
      height: '100vh',
      width: sidebarWidth,
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 50,
      transition: 'width 0.3s ease',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e8eaed'
    }}>
      {/* Header Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isCollapsed ? '24px 20px' : '24px',
        borderBottom: '1px solid #e8eaed',
        minHeight: '80px',
        backgroundColor: '#f8f9fa'
      }}>
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              backgroundColor: '#4285F4',
              padding: '10px',
              borderRadius: '8px',
              marginRight: '12px'
            }}>
              <FaWallet style={{ fontSize: '20px', color: 'white' }} />
            </div>
            <span style={{ 
              fontWeight: '600', 
              fontSize: '18px', 
              color: '#202124'
            }}>
              Finance Tracker
            </span>
          </div>
        )}
        
        {isCollapsed && (
          <div style={{
            backgroundColor: '#4285F4',
            padding: '10px',
            borderRadius: '8px',
            margin: '0 auto'
          }}>
            <FaWallet style={{ fontSize: '20px', color: 'white' }} />
          </div>
        )}
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            backgroundColor: '#f1f3f4',
            border: '1px solid #dadce0',
            color: '#5f6368',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            transition: 'all 0.2s',
            marginLeft: isCollapsed ? '0' : 'auto'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#e8eaed';
            e.target.style.color = '#202124';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#f1f3f4';
            e.target.style.color = '#5f6368';
          }}
        >
          {isCollapsed ? <FaBars size={16} /> : <FaTimes size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div style={{ flex: 1, paddingTop: '16px' }}>
        {[
          { to: '/dashboard', icon: FaChartLine, label: 'Dashboard', color: '#4285F4' },
          { to: '/expenses', icon: FaMoneyBillWave, label: 'Expenses', color: '#EA4335' },
          { to: '/subscriptions', icon: FaCalendarAlt, label: 'Subscriptions', color: '#FBBC04' },
          { to: '/investments', icon: FaChartLine, label: 'Investments', color: '#34A853' }
        ].map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.to || (item.to === '/dashboard' && location.pathname === '/');
          
          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '12px' : '12px 20px',
                margin: isCollapsed ? '0 12px 4px 12px' : '0 12px 4px 12px',
                borderRadius: '24px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: isActive ? item.color : 'transparent',
                color: isActive ? 'white' : '#5f6368',
                position: 'relative',
                fontWeight: isActive ? '500' : '400',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.target.style.backgroundColor = '#f1f3f4';
                  e.target.style.color = '#202124';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#5f6368';
                }
              }}
              title={isCollapsed ? item.label : ""}
            >
              <IconComponent style={{ 
                fontSize: '18px', 
                marginRight: isCollapsed ? '0' : '12px'
              }} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* User Section */}
      <div style={{ 
        borderTop: '1px solid #e8eaed', 
        padding: isCollapsed ? '16px 12px' : '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          marginBottom: '12px' 
        }}>
          <div style={{
            backgroundColor: '#5f6368',
            padding: '8px',
            borderRadius: '50%',
            marginRight: isCollapsed ? '0' : '12px'
          }}>
            <FaUser style={{ color: 'white', fontSize: '14px' }} />
          </div>
          {!isCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#202124',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user?.email || 'User'}
              </p>
            </div>
          )}
        </div>
        
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: '8px 12px',
            borderRadius: '20px',
            border: '1px solid #dadce0',
            backgroundColor: 'white',
            color: '#ea4335',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#ea4335';
            e.target.style.color = 'white';
            e.target.style.borderColor = '#ea4335';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white';
            e.target.style.color = '#ea4335';
            e.target.style.borderColor = '#dadce0';
          }}
          title={isCollapsed ? "Logout" : ""}
        >
          <FaSignOutAlt style={{ 
            fontSize: '16px', 
            marginRight: isCollapsed ? '0' : '8px' 
          }} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </nav>
  );
}

export default Navigation;