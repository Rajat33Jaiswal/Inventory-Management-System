import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, X, AlertTriangle } from 'lucide-react';

export default function Products({ products, onAdd, onUpdate, onDelete, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means adding a new product

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const resetForm = () => {
    setName('');
    setSku('');
    setPrice('');
    setQuantity('');
    setFormErrors({});
    setEditingProduct(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setPrice(product.price.toString());
    setQuantity(product.quantity.toString());
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    resetForm();
  };

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Product name is required';
    if (!sku.trim()) errors.sku = 'Product SKU/code is required';
    
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      errors.price = 'Price is required and must be a number';
    } else if (parsedPrice < 0) {
      errors.price = 'Price cannot be negative';
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty)) {
      errors.quantity = 'Quantity is required and must be an integer';
    } else if (parsedQty < 0) {
      errors.quantity = 'Quantity cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const productData = {
      name: name.trim(),
      sku: sku.trim(),
      price: parseFloat(price),
      quantity: parseInt(quantity, 10)
    };

    try {
      if (editingProduct) {
        // Run update API
        const success = await onUpdate(editingProduct.id, productData);
        if (success) {
          handleCloseDrawer();
        }
      } else {
        // Run create API
        const success = await onAdd(productData);
        if (success) {
          handleCloseDrawer();
        }
      }
    } catch (err) {
      showToast(err.message || 'An error occurred while saving the product', 'error');
    }
  };

  // Filter products by Name or SKU
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Manage Products</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Catalog listing, stock adjustments, and product registrations.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Products Catalog Table */}
      <div className="table-container">
        <div className="table-header-bar">
          <div className="table-search">
            <Search />
            <input 
              type="text" 
              placeholder="Search by name or SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Showing {filteredProducts.length} of {products.length} Products
          </span>
        </div>

        <div className="data-table-wrapper">
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={36} />
              <h3>No Products Found</h3>
              <p style={{ marginTop: '8px' }}>
                {searchTerm ? 'Try adjusting your search criteria.' : 'Start by clicking "Add Product" to create your inventory catalog.'}
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU / Code</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Quantity in Stock</th>
                  <th>Stock Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isLowStock = product.quantity < 10;
                  const isOutOfStock = product.quantity === 0;
                  
                  return (
                    <tr key={product.id}>
                      <td style={{ fontWeight: 600 }}>{product.name}</td>
                      <td>
                        <code style={{ fontSize: '12px', background: 'var(--bg-tertiary)', padding: '3px 6px', borderRadius: '4px' }}>
                          {product.sku}
                        </code>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ${product.price.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {product.quantity}
                      </td>
                      <td>
                        {isOutOfStock ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">In Stock</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button 
                            className="btn-icon" 
                            title="Edit Product"
                            onClick={() => handleOpenEdit(product)}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="btn-icon delete" 
                            title="Delete Product"
                            onClick={() => onDelete(product.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Slide-out Drawer Form (Add / Edit) */}
      <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={handleCloseDrawer}>
        <div className="drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <h2>{editingProduct ? 'Update Product' : 'Add New Product'}</h2>
            <button className="btn-icon" onClick={handleCloseDrawer}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 70px)' }}>
            <div className="drawer-body">
              {/* Name */}
              <div className="form-group">
                <label htmlFor="prod-name">Product Name</label>
                <input 
                  type="text" 
                  id="prod-name"
                  className="form-control"
                  placeholder="e.g. Mechanical Keyboard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {formErrors.name && <div className="form-error">{formErrors.name}</div>}
              </div>

              {/* SKU */}
              <div className="form-group">
                <label htmlFor="prod-sku">SKU / Code</label>
                <input 
                  type="text" 
                  id="prod-sku"
                  className="form-control"
                  placeholder="e.g. KB-MECH-87"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  disabled={!!editingProduct} // Frequently SKUs are immutable post creation, but let database validate if editable. We block editing to avoid SKU migration issues.
                />
                {formErrors.sku && <div className="form-error">{formErrors.sku}</div>}
              </div>

              {/* Price */}
              <div className="form-group">
                <label htmlFor="prod-price">Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  id="prod-price"
                  className="form-control"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                {formErrors.price && <div className="form-error">{formErrors.price}</div>}
              </div>

              {/* Quantity */}
              <div className="form-group">
                <label htmlFor="prod-qty">Initial Quantity in Stock</label>
                <input 
                  type="number" 
                  id="prod-qty"
                  className="form-control"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                {formErrors.quantity && <div className="form-error">{formErrors.quantity}</div>}
              </div>
            </div>

            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseDrawer}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
