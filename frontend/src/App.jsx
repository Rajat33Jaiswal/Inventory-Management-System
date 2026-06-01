import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingBag, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info,
  ServerCrash
} from 'lucide-react';
import './App.css';

import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Customers from './components/Customers';
import Orders from './components/Orders';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  // Navigation & Interface State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Data Collections State
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_count: 0,
    low_stock_products: []
  });

  // Global loading/error state
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Initialize and apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch all database records
  const fetchAllData = async () => {
    setIsOffline(false);
    try {
      const [resProducts, resCustomers, resOrders, resStats] = await Promise.all([
        fetch(`${API_URL}/products`),
        fetch(`${API_URL}/customers`),
        fetch(`${API_URL}/orders`),
        fetch(`${API_URL}/dashboard/stats`)
      ]);

      if (!resProducts.ok || !resCustomers.ok || !resOrders.ok || !resStats.ok) {
        throw new Error('API server returned a failed response code.');
      }

      const dataProducts = await resProducts.json();
      const dataCustomers = await resCustomers.json();
      const dataOrders = await resOrders.json();
      const dataStats = await resStats.json();

      setProducts(dataProducts);
      setCustomers(dataCustomers);
      setOrders(dataOrders);
      setDashboardStats(dataStats);
    } catch (err) {
      console.error('Error fetching dashboard records:', err);
      setIsOffline(true);
      showToast('Backend connection offline. Verify the server is running.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Theme Toggler
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Toast System Helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // ==========================================
  // API MUTATION OPERATIONS
  // ==========================================

  // --- Product Mutations ---
  const addProduct = async (productData) => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create product');
      }

      showToast(`Product '${data.name}' created successfully!`, 'success');
      fetchAllData();
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update product');
      }

      showToast(`Product '${data.name}' updated successfully!`, 'success');
      fetchAllData();
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to delete product');
      }

      showToast(`Product '${data.name}' deleted successfully!`, 'success');
      fetchAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Customer Mutations ---
  const addCustomer = async (customerData) => {
    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to register customer');
      }

      showToast(`Customer '${data.name}' registered successfully!`, 'success');
      fetchAllData();
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm('Deleting a customer will cascade delete all their orders. Proceed?')) return;
    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to delete customer');
      }

      showToast(`Customer '${data.name}' deleted successfully!`, 'success');
      fetchAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Order Mutations ---
  const addOrder = async (orderData) => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to place order');
      }

      showToast(`Order #${data.id} placed successfully!`, 'success');
      fetchAllData();
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Cancelling this order will remove the receipt and restore stock inventory. Proceed?')) return;
    try {
      const response = await fetch(`${API_URL}/orders/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to cancel order');
      }

      showToast(`Order #${id} cancelled and inventory stock restored.`, 'success');
      fetchAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const fetchOrderDetails = async (id) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to load order receipt');
      }
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      return null;
    }
  };

  // Sidebar toggle for Mobile Responsive layout
  const toggleMobileSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const navigateTo = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <ShoppingBag size={28} />
          <span>StockSphere</span>
        </div>

        <ul className="sidebar-menu">
          <li 
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigateTo('dashboard')}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => navigateTo('products')}
          >
            <Package />
            <span>Products</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => navigateTo('customers')}
          >
            <Users />
            <span>Customers</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => navigateTo('orders')}
          >
            <ShoppingBag />
            <span>Orders</span>
          </li>
        </ul>

        <div className="sidebar-footer">
          <button className="sidebar-item" onClick={toggleTheme} style={{ width: '100%', background: 'none', border: 'none' }}>
            {theme === 'light' ? <Moon /> : <Sun />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <main className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="hamburger" onClick={toggleMobileSidebar} aria-label="Toggle navigation drawer">
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
            <div className="header-title">
              <h1 style={{ textTransform: 'capitalize' }}>
                {activeTab}
              </h1>
              <p>Inventory, Customer & Order Central Command</p>
            </div>
          </div>

          <div className="header-actions">
            <button className="theme-toggle" onClick={toggleTheme} title="Switch Theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: isOffline ? 'var(--danger-light)' : 'var(--success-light)',
              color: isOffline ? 'var(--danger)' : 'var(--success)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isOffline ? 'var(--danger)' : 'var(--success)'
              }}></span>
              {isOffline ? 'Offline' : 'Connected'}
            </div>
          </div>
        </header>

        {/* Dynamic Page Views Container */}
        {isOffline && (
          <div style={{
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '16px 20px',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: 600
          }}>
            <ServerCrash size={20} />
            <div>
              <span>API Gateway Connection Failed.</span>
              <button 
                onClick={fetchAllData} 
                className="btn btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '11px', marginLeft: '12px', border: '1px solid var(--danger)' }}
              >
                Reconnect
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            <div className="empty-state">
              <ShoppingBag size={48} style={{ animation: 'float 2s ease-in-out infinite' }} />
              <h3>Loading System Database...</h3>
              <p style={{ marginTop: '8px' }}>Fetching current products, customer registry, and orders from StockSphere api.</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard 
                stats={dashboardStats} 
                products={products}
                onNavigate={navigateTo} 
              />
            )}
            
            {activeTab === 'products' && (
              <Products 
                products={products} 
                onAdd={addProduct}
                onUpdate={updateProduct}
                onDelete={deleteProduct}
                showToast={showToast}
              />
            )}

            {activeTab === 'customers' && (
              <Customers 
                customers={customers} 
                onAdd={addCustomer}
                onDelete={deleteCustomer}
                showToast={showToast}
              />
            )}

            {activeTab === 'orders' && (
              <Orders 
                orders={orders} 
                customers={customers}
                products={products}
                onAdd={addOrder}
                onDelete={deleteOrder}
                showToast={showToast}
                fetchOrderDetails={fetchOrderDetails}
              />
            )}
          </>
        )}
      </main>

      {/* Global Slide-In Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`} onClick={() => handleDismissToast(toast.id)} style={{ cursor: 'pointer' }}>
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'warning' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            <span>{toast.message}</span>
            <button 
              className="btn-icon" 
              style={{ marginLeft: 'auto', padding: '2px', color: 'inherit', background: 'none' }}
              onClick={(e) => {
                e.stopPropagation();
                handleDismissToast(toast.id);
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
