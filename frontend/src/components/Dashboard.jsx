import React from 'react';
import { Package, Users, ShoppingBag, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Dashboard({ stats, onNavigate, products }) {
  const { total_products, total_customers, total_orders, low_stock_count, low_stock_products } = stats;

  // Let's prepare chart data using the top 6 products by quantity or name
  const chartProducts = [...products]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  const maxQuantity = chartProducts.length > 0 
    ? Math.max(...chartProducts.map(p => p.quantity), 10) 
    : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      {/* Stat Cards Grid */}
      <div className="dashboard-grid">
        <div className="stat-card" onClick={() => onNavigate('products')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon products">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{total_products}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('customers')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon customers">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{total_customers}</span>
            <span className="stat-label">Total Customers</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('orders')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon orders">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{total_orders}</span>
            <span className="stat-label">Total Orders</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: low_stock_count > 0 ? '3px solid var(--danger)' : '1px solid var(--border-color)' }}>
          <div className="stat-icon low-stock">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{low_stock_count}</span>
            <span className="stat-label">Low Stock Products</span>
          </div>
        </div>
      </div>

      {/* Charts and Alerts Section */}
      <div className="dashboard-details">
        {/* SVG Chart Panel */}
        <div className="panel-card">
          <div className="panel-header">
            <h2>Inventory Stock Levels</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Top items in stock</span>
          </div>
          {chartProducts.length === 0 ? (
            <div className="empty-state">
              <Package />
              <p>No products available to chart. Add some products to visualize stock levels.</p>
            </div>
          ) : (
            <div className="chart-container">
              <svg viewBox="0 0 500 240" className="chart-svg">
                {/* Y Axis Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const yVal = 20 + ratio * 160;
                  const labelVal = Math.round(maxQuantity * (1 - ratio));
                  return (
                    <g key={index}>
                      <line 
                        x1="40" 
                        y1={yVal} 
                        x2="480" 
                        y2={yVal} 
                        stroke="var(--border-color)" 
                        strokeWidth="0.5" 
                        strokeDasharray="4 4" 
                      />
                      <text x="30" y={yVal + 4} textAnchor="end" className="chart-text">
                        {labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Line */}
                <line x1="40" y1="180" x2="480" y2="180" className="chart-axis-line" />

                {/* Bars */}
                {chartProducts.map((p, idx) => {
                  const barWidth = 40;
                  const spacing = (440 - barWidth * chartProducts.length) / (chartProducts.length + 1);
                  const xVal = 40 + spacing + idx * (barWidth + spacing);
                  
                  const barHeight = (p.quantity / maxQuantity) * 160;
                  const yVal = 180 - barHeight;

                  return (
                    <g key={p.id}>
                      {/* Bar shadow background */}
                      <rect 
                        x={xVal} 
                        y="20" 
                        width={barWidth} 
                        height="160" 
                        fill="var(--bg-tertiary)" 
                        opacity="0.2" 
                        rx="4" 
                      />
                      {/* Dynamic Bar */}
                      <rect
                        x={xVal}
                        y={yVal}
                        width={barWidth}
                        height={Math.max(barHeight, 2)}
                        className="chart-bar"
                        style={{ fill: p.quantity < 10 ? 'var(--danger)' : 'var(--primary)' }}
                      />
                      {/* SKU Label */}
                      <text x={xVal + barWidth / 2} y="198" className="chart-text" fontWeight="bold">
                        {p.sku}
                      </text>
                      {/* Quantity display on hover */}
                      <text x={xVal + barWidth / 2} y={yVal - 6} className="chart-text" fontWeight="bold" fill="var(--text-primary)">
                        {p.quantity}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Low Stock Panel */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <h2>Stock Alerts</h2>
            {low_stock_count > 0 && (
              <span className="badge badge-danger">Danger</span>
            )}
          </div>
          <div className="low-stock-list" style={{ flexGrow: 1 }}>
            {low_stock_products.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div style={{ color: 'var(--success)', marginBottom: '12px' }}>
                  <AlertTriangle size={32} style={{ transform: 'rotate(180deg)', color: 'var(--success)' }} />
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: '600' }}>All Clear!</h4>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>No items currently running low on stock (under 10 units).</p>
              </div>
            ) : (
              low_stock_products.map(p => (
                <div key={p.id} className="low-stock-item">
                  <div>
                    <div className="low-stock-name">{p.name}</div>
                    <div className="low-stock-sku">SKU: {p.sku}</div>
                  </div>
                  <div className="low-stock-badge">{p.quantity} left</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
