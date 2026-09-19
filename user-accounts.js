// User Accounts & Profiles System
const userAccountModule = {
  // Get current user
  getCurrentUser() {
    const userId = localStorage.getItem('currentUserId');
    if (!userId) return null;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.find(u => u.id === userId);
  },

  // Create user account
  createAccount(email, name, phone) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if email already exists
    if (users.some(u => u.email === email)) {
      showToast('Email already registered', 'error');
      return null;
    }

    const userId = 'user_' + Date.now();
    const newUser = {
      id: userId,
      email,
      name,
      phone,
      createdAt: new Date().toISOString(),
      orders: [],
      addresses: [],
      preferences: {
        newsletter: true,
        notifications: true,
        smsAlerts: false
      },
      paymentMethods: []
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUserId', userId);

    // Initialize loyalty for new user
    loyaltyModule.getUserLoyalty(userId);
    loyaltyModule.addPoints(userId, loyaltyModule.pointsRates.firstPurchase, 'welcome');

    showToast('✨ Account created successfully!', 'success');
    return newUser;
  },

  // Login
  login(email, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email);

    if (!user) {
      showToast('User not found', 'error');
      return null;
    }

    localStorage.setItem('currentUserId', user.id);
    showToast(`Welcome back, ${user.name}!`, 'success');
    return user;
  },

  // Logout
  logout() {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('cart');
    showToast('Logged out successfully', 'info');
  },

  // Update profile
  updateProfile(userId, updates) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return null;

    users[userIndex] = { ...users[userIndex], ...updates, id: userId };
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUserId', userId);

    showToast('Profile updated successfully', 'success');
    return users[userIndex];
  },

  // Add address
  addAddress(userId, address) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return null;

    if (!users[userIndex].addresses) users[userIndex].addresses = [];

    const newAddress = {
      id: 'addr_' + Date.now(),
      ...address,
      createdAt: new Date().toISOString()
    };

    users[userIndex].addresses.push(newAddress);
    localStorage.setItem('users', JSON.stringify(users));

    showToast('Address added', 'success');
    return newAddress;
  },

  // Remove address
  removeAddress(userId, addressId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return false;

    users[userIndex].addresses = users[userIndex].addresses.filter(a => a.id !== addressId);
    localStorage.setItem('users', JSON.stringify(users));

    return true;
  },

  // Add payment method
  addPaymentMethod(userId, method) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return null;

    const newMethod = {
      id: 'pm_' + Date.now(),
      ...method,
      maskedNumber: '**** **** **** ' + method.cardNumber.slice(-4),
      createdAt: new Date().toISOString()
    };

    users[userIndex].paymentMethods.push(newMethod);
    localStorage.setItem('users', JSON.stringify(users));

    return newMethod;
  },

  // Render account dashboard
  renderAccountDashboard(userId = null) {
    const user = userId ? this.getCurrentUserById(userId) : this.getCurrentUser();
    if (!user) return;

    const container = document.getElementById('accountDashboard');
    if (!container) return;

    container.innerHTML = `
      <div class="account-header">
        <div class="account-avatar">
          ${user.name.charAt(0).toUpperCase()}
        </div>
        <div class="account-info">
          <h2>${user.name}</h2>
          <p>${user.email}</p>
          <p class="member-since">Member since ${new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div class="account-sections">
        <div class="section quick-actions">
          <h3>Quick Actions</h3>
          <div class="actions-grid">
            <button class="action-btn" onclick="document.getElementById('profileTab').click()">
              <span class="action-icon">👤</span> Edit Profile
            </button>
            <button class="action-btn" onclick="document.getElementById('addressesTab').click()">
              <span class="action-icon">📍</span> Addresses
            </button>
            <button class="action-btn" onclick="document.getElementById('ordersTab').click()">
              <span class="action-icon">📦</span> Orders
            </button>
            <button class="action-btn" onclick="document.getElementById('paymentsTab').click()">
              <span class="action-icon">💳</span> Payments
            </button>
          </div>
        </div>

        <div class="section recent-orders">
          <h3>Recent Orders</h3>
          ${user.orders && user.orders.length > 0 ? `
            <div class="orders-list">
              ${user.orders.slice(-3).reverse().map(order => `
                <div class="order-item">
                  <div class="order-id">Order #${order.id}</div>
                  <div class="order-date">${new Date(order.date).toLocaleDateString()}</div>
                  <div class="order-amount">₹${order.total}</div>
                  <div class="order-status ${order.status}">${order.status}</div>
                </div>
              `).join('')}
            </div>
          ` : '<p class="empty-state">No orders yet</p>'}
          <a href="#orders" class="view-all-link">View all orders →</a>
        </div>
      </div>
    `;
  },

  // Render profile edit form
  renderProfileForm(userId = null) {
    const user = userId ? this.getCurrentUserById(userId) : this.getCurrentUser();
    if (!user) return;

    const container = document.getElementById('profileForm');
    if (!container) return;

    container.innerHTML = `
      <div class="form-section">
        <h3>Edit Profile</h3>
        <form onsubmit="userAccountModule.handleProfileUpdate(event, '${user.id}')">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" value="${user.name}" name="name" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" value="${user.email}" name="email" required />
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="tel" value="${user.phone || ''}" name="phone" />
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="newsletter" ${user.preferences?.newsletter ? 'checked' : ''} />
              Subscribe to newsletter
            </label>
          </div>
          <button type="submit" class="primary-button">Save Changes</button>
        </form>
      </div>
    `;
  },

  // Render addresses
  renderAddresses(userId = null) {
    const user = userId ? this.getCurrentUserById(userId) : this.getCurrentUser();
    if (!user) return;

    const container = document.getElementById('addressesContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="addresses-section">
        <h3>Saved Addresses</h3>
        ${user.addresses && user.addresses.length > 0 ? `
          <div class="addresses-grid">
            ${user.addresses.map(addr => `
              <div class="address-card">
                <div class="address-label">${addr.label}</div>
                <div class="address-text">${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}</div>
                <div class="address-phone">${addr.phone}</div>
                <div class="address-actions">
                  <button class="small-btn" onclick="userAccountModule.editAddress('${user.id}', '${addr.id}')">Edit</button>
                  <button class="small-btn danger" onclick="userAccountModule.removeAddress('${user.id}', '${addr.id}')">Delete</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="empty-state">No addresses saved</p>'}
        
        <button class="secondary-button" onclick="userAccountModule.showAddAddressForm('${user.id}')">
          + Add New Address
        </button>
      </div>
    `;
  },

  // Render payment methods
  renderPaymentMethods(userId = null) {
    const user = userId ? this.getCurrentUserById(userId) : this.getCurrentUser();
    if (!user) return;

    const container = document.getElementById('paymentsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="payments-section">
        <h3>Payment Methods</h3>
        ${user.paymentMethods && user.paymentMethods.length > 0 ? `
          <div class="payment-cards">
            ${user.paymentMethods.map(method => `
              <div class="payment-card">
                <div class="card-type">${method.type || 'Credit Card'}</div>
                <div class="card-number">${method.maskedNumber}</div>
                <div class="card-holder">${method.holderName}</div>
                <div class="card-actions">
                  <button class="small-btn" onclick="userAccountModule.deletePaymentMethod('${user.id}', '${method.id}')">Delete</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="empty-state">No payment methods saved</p>'}
        
        <button class="secondary-button" onclick="userAccountModule.showAddPaymentForm('${user.id}')">
          + Add Payment Method
        </button>
      </div>
    `;
  },

  // Render order history
  renderOrderHistory(userId = null) {
    const user = userId ? this.getCurrentUserById(userId) : this.getCurrentUser();
    if (!user) return;

    const container = document.getElementById('orderHistory');
    if (!container) return;

    if (!user.orders || user.orders.length === 0) {
      container.innerHTML = '<p class="empty-state">No orders yet</p>';
      return;
    }

    container.innerHTML = `
      <div class="orders-table">
        ${user.orders.reverse().map(order => `
          <div class="order-row">
            <div class="order-col order-id">
              <strong>#${order.id}</strong>
            </div>
            <div class="order-col">
              ${new Date(order.date).toLocaleDateString()}
            </div>
            <div class="order-col">
              ₹${order.total}
            </div>
            <div class="order-col">
              <span class="status-badge ${order.status}">${order.status}</span>
            </div>
            <div class="order-col">
              <a href="/track-order.html?id=${order.id}" class="link-btn">Track</a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // Helper methods
  getCurrentUserById(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.find(u => u.id === userId);
  },

  handleProfileUpdate(event, userId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const updates = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      preferences: {
        newsletter: formData.get('newsletter') === 'on'
      }
    };

    this.updateProfile(userId, updates);
  },

  showAddAddressForm(userId) {
    // Show modal for adding address
    showToast('Address form would open here', 'info');
  },

  showAddPaymentForm(userId) {
    // Show modal for adding payment
    showToast('Payment form would open here', 'info');
  },

  deletePaymentMethod(userId, methodId) {
    // Delete payment method
    showToast('Payment method deleted', 'info');
  },

  editAddress(userId, addressId) {
    showToast('Edit address form would open here', 'info');
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const user = userAccountModule.getCurrentUser();
  if (user) {
    userAccountModule.renderAccountDashboard();
  }
});
