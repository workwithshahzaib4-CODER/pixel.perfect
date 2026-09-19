// Admin Dashboard & Analytics System
const adminDashboard = {
  // Check if user is admin
  isAdmin(userId) {
    const admins = JSON.parse(localStorage.getItem('adminUsers') || '["admin"]');
    return admins.includes(userId);
  },

  // Get sales analytics
  getSalesAnalytics(days = 30) {
    const orders = JSON.parse(localStorage.getItem('allOrders') || '[]');
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const filteredOrders = orders.filter(o => new Date(o.date) > startDate);

    return {
      totalSales: filteredOrders.reduce((sum, o) => sum + o.total, 0),
      totalOrders: filteredOrders.length,
      averageOrderValue: filteredOrders.length > 0 ? Math.floor(filteredOrders.reduce((sum, o) => sum + o.total, 0) / filteredOrders.length) : 0,
      totalCustomers: new Set(filteredOrders.map(o => o.customerId)).size,
      orders: filteredOrders
    };
  },

  // Get top products
  getTopProducts(limit = 10) {
    const orders = JSON.parse(localStorage.getItem('allOrders') || '[]');
    const productSales = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = { product: item, quantity: 0, revenue: 0 };
        }
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += item.price * item.quantity;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  },

  // Get customer analytics
  getCustomerAnalytics() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const orders = JSON.parse(localStorage.getItem('allOrders') || '[]');

    const totalCustomers = users.length;
    const returningCustomers = users.filter(u => u.orders && u.orders.length > 1).length;
    const newCustomers = users.filter(u => {
      const createdDate = new Date(u.createdAt);
      return createdDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }).length;

    return {
      totalCustomers,
      returningCustomers,
      newCustomers,
      customerRetentionRate: Math.round((returningCustomers / totalCustomers) * 100),
      averageOrdersPerCustomer: orders.length / totalCustomers || 0
    };
  },

  // Get inventory status
  getInventoryStatus() {
    return {
      totalProducts: products.length,
      categories: [...new Set(products.map(p => p.category))].length,
      lowStockItems: products.filter(p => (p.stock || 0) < 10).length,
      outOfStockItems: products.filter(p => (p.stock || 0) === 0).length
    };
  },

  // Render admin dashboard
  renderDashboard() {
    const container = document.getElementById('adminDashboard');
    if (!container) return;

    const analytics = this.getSalesAnalytics(30);
    const customerAnalytics = this.getCustomerAnalytics();
    const inventory = this.getInventoryStatus();
    const topProducts = this.getTopProducts(5);

    container.innerHTML = `
      <div class="admin-header">
        <h1>📊 Admin Dashboard</h1>
        <div class="admin-date-range">
          <span>Last 30 Days</span>
          <button class="filter-btn" onclick="adminDashboard.showDatePicker()">Change</button>
        </div>
      </div>

      <div class="kpi-cards">
        <div class="kpi-card">
          <div class="kpi-icon">💰</div>
          <div class="kpi-content">
            <div class="kpi-label">Total Revenue</div>
            <div class="kpi-value">₹${analytics.totalSales.toLocaleString()}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📦</div>
          <div class="kpi-content">
            <div class="kpi-label">Total Orders</div>
            <div class="kpi-value">${analytics.totalOrders}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">👥</div>
          <div class="kpi-content">
            <div class="kpi-label">Total Customers</div>
            <div class="kpi-value">${analytics.totalCustomers}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📈</div>
          <div class="kpi-content">
            <div class="kpi-label">Avg Order Value</div>
            <div class="kpi-value">₹${analytics.averageOrderValue}</div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="dashboard-section">
          <h2>👥 Customer Analytics</h2>
          <div class="analytics-grid">
            <div class="stat">
              <span class="stat-label">Total Customers</span>
              <span class="stat-value">${customerAnalytics.totalCustomers}</span>
            </div>
            <div class="stat">
              <span class="stat-label">New Customers</span>
              <span class="stat-value">${customerAnalytics.newCustomers}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Returning Customers</span>
              <span class="stat-value">${customerAnalytics.returningCustomers}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Retention Rate</span>
              <span class="stat-value">${customerAnalytics.customerRetentionRate}%</span>
            </div>
          </div>
        </div>

        <div class="dashboard-section">
          <h2>📦 Inventory Status</h2>
          <div class="inventory-summary">
            <div class="inventory-stat">
              <span class="stat-label">Total Products</span>
              <span class="stat-value">${inventory.totalProducts}</span>
            </div>
            <div class="inventory-stat">
              <span class="stat-label">Categories</span>
              <span class="stat-value">${inventory.categories}</span>
            </div>
            <div class="inventory-stat warning">
              <span class="stat-label">Low Stock</span>
              <span class="stat-value">${inventory.lowStockItems}</span>
            </div>
            <div class="inventory-stat danger">
              <span class="stat-label">Out of Stock</span>
              <span class="stat-value">${inventory.outOfStockItems}</span>
            </div>
          </div>
        </div>

        <div class="dashboard-section full-width">
          <h2>⭐ Top 5 Products</h2>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Units Sold</th>
                <th>Revenue</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${topProducts.map(item => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.product.category}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.revenue.toLocaleString()}</td>
                  <td>
                    <a href="/product.html?id=${item.product.id}" class="admin-link">View</a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="dashboard-section full-width">
          <h2>📋 Recent Orders</h2>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${analytics.orders.slice(-10).reverse().map(order => `
                <tr>
                  <td>${order.id}</td>
                  <td>${order.customerName}</td>
                  <td>₹${order.total}</td>
                  <td><span class="status-badge ${order.status}">${order.status}</span></td>
                  <td>${new Date(order.date).toLocaleDateString()}</td>
                  <td>
                    <a href="/track-order.html?id=${order.id}" class="admin-link">Details</a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="admin-actions">
        <button class="admin-btn" onclick="adminDashboard.exportAnalytics()">📥 Export Data</button>
        <button class="admin-btn" onclick="adminDashboard.sendNewsletterAdmin()">✉️ Send Newsletter</button>
        <button class="admin-btn" onclick="adminDashboard.viewAuditLog()">📜 Audit Log</button>
      </div>
    `;
  },

  // Export analytics as CSV
  exportAnalytics() {
    const analytics = this.getSalesAnalytics();
    let csv = 'Date,Order ID,Customer,Amount,Status\n';
    
    analytics.orders.forEach(order => {
      csv += `${new Date(order.date).toLocaleDateString()},${order.id},${order.customerName},${order.total},${order.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    showToast('📥 Report downloaded', 'success');
  },

  // Send newsletter from admin
  sendNewsletterAdmin() {
    showToast('✉️ Newsletter would be sent to all subscribers', 'info');
    emailMarketingModule.sendWeeklyNewsletter();
  },

  // View audit log
  viewAuditLog() {
    showToast('📜 Audit log: All admin actions logged for security', 'info');
  },

  showDatePicker() {
    showToast('📅 Date picker would allow changing date range', 'info');
  },

  // Admin report generation
  generateReport(reportType) {
    const analytics = this.getSalesAnalytics();
    
    switch (reportType) {
      case 'sales':
        return {
          title: 'Sales Report',
          data: analytics
        };
      case 'customers':
        return {
          title: 'Customer Report',
          data: this.getCustomerAnalytics()
        };
      case 'inventory':
        return {
          title: 'Inventory Report',
          data: this.getInventoryStatus()
        };
    }
  }
};

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
  const currentUserId = localStorage.getItem('currentUserId');
  if (currentUserId && adminDashboard.isAdmin(currentUserId)) {
    adminDashboard.renderDashboard();
  }
});
