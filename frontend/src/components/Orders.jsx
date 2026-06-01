import React, { useState } from 'react';
import { Search, Plus, Eye, Trash2, X, AlertTriangle, Calendar, ShoppingBag, PlusCircle, MinusCircle } from 'lucide-react';

export default function Orders({ orders, customers, products, onAdd, onDelete, showToast, fetchOrderDetails }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); // For details dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State for creating a new order
  const [customerId, setCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);
  const [formErrors, setFormErrors] = useState({});

  const resetForm = () => {
    setCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1 }]);
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

  const handleViewDetails = async (orderId) => {
    try {
      const detailedOrder = await fetchOrderDetails(orderId);
      if (detailedOrder) {
        setSelectedOrder(detailedOrder);
        setIsDialogOpen(true);
      }
    } catch (err) {
      showToast('Failed to fetch detailed order information', 'error');
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedOrder(null);
  };

  // Dynamic Items builder controls
  const handleAddItemRow = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    setOrderItems(newItems);
  };

  // Calculate live order total for frontend visual feedback
  const calculateLiveTotal = () => {
    return orderItems.reduce((sum, item) => {
      const product = products.find(p => p.id === parseInt(item.product_id, 10));
      if (product) {
        return sum + (product.price * (parseInt(item.quantity, 10) || 0));
      }
      return sum;
    }, 0);
  };

  const validateForm = () => {
    const errors = {};
    if (!customerId) errors.customer = 'Please select a customer';

    const itemErrors = [];
    let hasItemError = false;

    // Filter out rows without product selected, or validate them
    orderItems.forEach((item, index) => {
      const errs = {};
      if (!item.product_id) {
        errs.product = 'Select a product';
        hasItemError = true;
      } else {
        const product = products.find(p => p.id === parseInt(item.product_id, 10));
        const qty = parseInt(item.quantity, 10);
        
        if (!product) {
          errs.product = 'Product not found';
          hasItemError = true;
        } else {
          if (isNaN(qty) || qty <= 0) {
            errs.quantity = 'Must be > 0';
            hasItemError = true;
          } else if (qty > product.quantity) {
            errs.quantity = `Insufficient stock (${product.quantity} available)`;
            hasItemError = true;
          }
        }
      }
      itemErrors[index] = errs;
    });

    if (hasItemError) {
      errors.items = itemErrors;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Format payload
    const orderData = {
      customer_id: parseInt(customerId, 10),
      items: orderItems.map(item => ({
        product_id: parseInt(item.product_id, 10),
        quantity: parseInt(item.quantity, 10)
      }))
    };

    try {
      const success = await onAdd(orderData);
      if (success) {
        handleCloseDrawer();
      }
    } catch (err) {
      showToast(err.message || 'Failed to place the order', 'error');
    }
  };

  // Filter orders by Customer Name or Order ID
  const filteredOrders = orders.filter(order => {
    const customerName = order.customer?.name || '';
    return customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           order.id.toString().includes(searchTerm);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Manage Orders</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Create transactions, view transaction receipts, and cancel orders.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          Create Order
        </button>
      </div>

      {/* Orders List Table */}
      <div className="table-container">
        <div className="table-header-bar">
          <div className="table-search">
            <Search />
            <input 
              type="text" 
              placeholder="Search by customer or order ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Showing {filteredOrders.length} of {orders.length} Orders
          </span>
        </div>

        <div className="data-table-wrapper">
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={36} />
              <h3>No Orders Found</h3>
              <p style={{ marginTop: '8px' }}>
                {searchTerm ? 'Try adjusting your search criteria.' : 'Click "Create Order" to record inventory transactions.'}
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Profile</th>
                  <th>Order Date</th>
                  <th style={{ textAlign: 'right' }}>Total Amount</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 700 }}>#{order.id}</td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{order.customer?.name || 'Unknown Customer'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{order.customer?.email}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{order.total_amount.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button 
                          className="btn-icon" 
                          title="View Order Items"
                          onClick={() => handleViewDetails(order.id)}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="btn-icon delete" 
                          title="Cancel/Delete Order"
                          onClick={() => onDelete(order.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Slide-out Drawer Form (Create Order) */}
      <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={handleCloseDrawer}>
        <div className="drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <h2>Create New Order</h2>
            <button className="btn-icon" onClick={handleCloseDrawer}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 70px)' }}>
            <div className="drawer-body">
              {/* Select Customer */}
              <div className="form-group">
                <label htmlFor="order-cust">Select Customer</label>
                <select 
                  id="order-cust"
                  className="form-control"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
                {formErrors.customer && <div className="form-error">{formErrors.customer}</div>}
              </div>

              {/* Order Items Builder */}
              <div className="order-items-builder">
                <div className="order-items-builder-title">
                  <span>Product Lines</span>
                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={handleAddItemRow}>
                    <PlusCircle size={14} /> Add Row
                  </button>
                </div>

                {orderItems.map((item, idx) => {
                  const errorRow = formErrors.items && formErrors.items[idx];
                  return (
                    <div key={idx} className="order-item-row-container" style={{ marginBottom: '16px' }}>
                      <div className="order-item-row">
                        {/* Select Product */}
                        <select 
                          className="form-control"
                          value={item.product_id}
                          onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                        >
                          <option value="">-- Product --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                              {p.name} (₹{p.price.toFixed(2)}) - {p.quantity} in stock {p.quantity === 0 && '(OUT)'}
                            </option>
                          ))}
                        </select>

                        {/* Quantity */}
                        <input 
                          type="number" 
                          min="1"
                          className="form-control"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        />

                        {/* Remove Button */}
                        <button 
                          type="button" 
                          className="btn-icon delete" 
                          style={{ padding: '6px' }}
                          disabled={orderItems.length === 1}
                          onClick={() => handleRemoveItemRow(idx)}
                        >
                          <MinusCircle size={16} />
                        </button>
                      </div>

                      {/* Line Errors */}
                      {errorRow && (errorRow.product || errorRow.quantity) && (
                        <div style={{ display: 'flex', gap: '12px', paddingLeft: '4px' }}>
                          {errorRow.product && <span className="form-error" style={{ margin: 0 }}>{errorRow.product}</span>}
                          {errorRow.quantity && <span className="form-error" style={{ margin: 0 }}>{errorRow.quantity}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Live Subtotal Visualizer */}
              <div className="order-summary-box">
                <span>Total Amount:</span>
                <span className="order-summary-total">₹{calculateLiveTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseDrawer}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={products.length === 0 || customers.length === 0}>
                Place Order
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Details Dialog Modal */}
      <div className={`dialog-overlay ${isDialogOpen ? 'open' : ''}`} onClick={handleCloseDialog}>
        <div className="dialog" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-header">
            <h2>Order Details Receipt</h2>
            <button className="btn-icon" onClick={handleCloseDialog}>
              <X size={20} />
            </button>
          </div>

          {selectedOrder && (
            <div className="dialog-body">
              {/* Receipt Header Grid */}
              <div className="detail-grid">
                <div>
                  <span className="detail-label">Order Reference</span>
                  <div className="detail-value" style={{ color: 'var(--primary)' }}>#{selectedOrder.id}</div>
                </div>
                <div>
                  <span className="detail-label">Transaction Date</span>
                  <div className="detail-value">{new Date(selectedOrder.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <span className="detail-label">Customer Profile</span>
                  <div className="detail-value">{selectedOrder.customer?.name}</div>
                </div>
                <div>
                  <span className="detail-label">Customer Email</span>
                  <div className="detail-value" style={{ fontSize: '13px', fontWeight: 'normal' }}>{selectedOrder.customer?.email}</div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Items Details</h4>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden' }}>
                  <table className="data-table" style={{ width: '100%' }}>
                    <thead style={{ background: 'var(--bg-tertiary)' }}>
                      <tr>
                        <th style={{ padding: '10px 16px', fontSize: '11px' }}>Product</th>
                        <th style={{ padding: '10px 16px', fontSize: '11px' }}>SKU</th>
                        <th style={{ padding: '10px 16px', fontSize: '11px', textAlign: 'right' }}>Price</th>
                        <th style={{ padding: '10px 16px', fontSize: '11px', textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: '10px 16px', fontSize: '11px', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td style={{ padding: '12px 16px' }}>{item.product?.name || `Product ID #${item.product_id}`}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <code style={{ fontSize: '11px', background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: '4px' }}>
                              {item.product?.sku || 'N/A'}
                            </code>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>₹{item.price_at_order.toFixed(2)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>{item.quantity}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                            ₹{(item.price_at_order * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', padding: '0 8px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Grand Total:</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>
                  ₹{selectedOrder.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="dialog-footer">
            <button className="btn btn-secondary" onClick={handleCloseDialog}>
              Close Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
