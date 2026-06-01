import React, { useState } from 'react';
import { Search, Plus, Trash2, X, AlertTriangle, Mail, Phone, User } from 'lucide-react';

export default function Customers({ customers, onAdd, onDelete, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setFormErrors({});
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    resetForm();
  };

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Full name is required';
    
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (!phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
      if (!phoneRegex.test(phone.trim().replace(/[-\s()]/g, ''))) {
        errors.phone = 'Please enter a valid 10-digit Indian mobile number';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const customerData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim()
    };

    try {
      const success = await onAdd(customerData);
      if (success) {
        handleCloseDrawer();
      }
    } catch (err) {
      showToast(err.message || 'An error occurred while registering the customer', 'error');
    }
  };

  // Filter customers by Name or Email
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Manage Customers</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Customer directory listing, contact registration, and profiles.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          Register Customer
        </button>
      </div>

      {/* Customers List Table */}
      <div className="table-container">
        <div className="table-header-bar">
          <div className="table-search">
            <Search />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Showing {filteredCustomers.length} of {customers.length} Customers
          </span>
        </div>

        <div className="data-table-wrapper">
          {filteredCustomers.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={36} />
              <h3>No Customers Found</h3>
              <p style={{ marginTop: '8px' }}>
                {searchTerm ? 'Try adjusting your search criteria.' : 'Start by clicking "Register Customer" to build your customer directory.'}
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer Profile</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifycontent: 'center',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          justifyContent: 'center'
                        }}>
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{customer.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ID: #{customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={14} style={{ color: 'var(--text-tertiary)' }} />
                        <span>{customer.email}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={14} style={{ color: 'var(--text-tertiary)' }} />
                        <span>{customer.phone}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-icon delete" 
                        title="Delete Customer"
                        onClick={() => onDelete(customer.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Slide-out Drawer Form (Register) */}
      <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={handleCloseDrawer}>
        <div className="drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <h2>Register Customer</h2>
            <button className="btn-icon" onClick={handleCloseDrawer}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 70px)' }}>
            <div className="drawer-body">
              {/* Name */}
              <div className="form-group">
                <label htmlFor="cust-name">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    id="cust-name"
                    className="form-control"
                    placeholder="e.g. Rajesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                {formErrors.name && <div className="form-error">{formErrors.name}</div>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="cust-email">Email Address</label>
                <input 
                  type="email" 
                  id="cust-email"
                  className="form-control"
                  placeholder="e.g. rajesh.kumar@example.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {formErrors.email && <div className="form-error">{formErrors.email}</div>}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label htmlFor="cust-phone">Phone Number</label>
                <input 
                  type="text" 
                  id="cust-phone"
                  className="form-control"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
              </div>
            </div>

            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseDrawer}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Register Customer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
