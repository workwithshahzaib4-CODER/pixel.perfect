// Smart Notifications System (Push, In-App, SMS)
const notificationsModule = {
  notifications: [],
  maxNotifications: 5,

  addNotification(type, title, message, duration = 5000, action = null) {
    const notification = {
      id: 'notif_' + Date.now(),
      type, // 'success', 'error', 'warning', 'info', 'promotion'
      title,
      message,
      timestamp: new Date(),
      action
    };

    this.notifications.push(notification);
    this.renderNotifications();

    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, duration);
    }

    return notification.id;
  },

  removeNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.renderNotifications();
  },

  renderNotifications() {
    let container = document.getElementById('notificationsContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationsContainer';
      container.className = 'notifications-container';
      document.body.appendChild(container);
    }

    container.innerHTML = this.notifications.map((notif, idx) => `
      <div class="notification notification-${notif.type}" style="animation: slideInRight 0.3s ease-out ${idx * 0.05}s both">
        <div class="notification-icon">
          ${notif.type === 'success' ? '✓' : 
            notif.type === 'error' ? '✕' : 
            notif.type === 'warning' ? '⚠️' : 
            notif.type === 'promotion' ? '🎉' : 'ℹ️'}
        </div>
        <div class="notification-content">
          <div class="notification-title">${notif.title}</div>
          <div class="notification-message">${notif.message}</div>
        </div>
        ${notif.action ? `
          <button class="notification-action" onclick="${notif.action}">
            Take Action
          </button>
        ` : ''}
        <button class="notification-close" onclick="notificationsModule.removeNotification('${notif.id}')">✕</button>
      </div>
    `).join('');
  },

  // Browser Push Notifications
  requestPushPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showToast('🔔 Push notifications enabled!', 'success');
        }
      });
    }
  },

  sendPushNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo.png',
        badge: '/badge.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  },

  // In-App Notifications
  notifyNewArrival(productName) {
    this.addNotification(
      'info',
      '✨ New Design Available',
      `${productName} just dropped!`,
      6000,
      'document.location.href="category.html"'
    );
  },

  notifyRestock(productName) {
    this.addNotification(
      'promotion',
      '🎉 Back in Stock!',
      `${productName} is available again`,
      6000,
      'document.location.href="category.html"'
    );
  },

  notifyFlashSale(discount, hoursRemaining) {
    this.addNotification(
      'promotion',
      '⚡ Flash Sale!',
      `${discount}% OFF - ${hoursRemaining} hours left!`,
      8000,
      'document.location.href="category.html"'
    );
  },

  notifyLoyaltyReward(points, tier) {
    this.addNotification(
      'success',
      '🏆 Loyalty Reward Unlocked',
      `You earned ${points} points! You're in ${tier} tier.`,
      6000
    );
  },

  notifyOrderStatus(orderId, status) {
    const messages = {
      confirmed: 'Your order has been confirmed!',
      processing: 'We\'re preparing your order...',
      shipped: 'Your order is on the way!',
      delivered: 'Your order has arrived!'
    };

    this.addNotification(
      status === 'delivered' ? 'success' : 'info',
      `📦 Order ${orderId}`,
      messages[status] || 'Order status updated',
      6000
    );
  },

  // Price Drop Alerts
  notifyPriceDrop(productName, oldPrice, newPrice) {
    const savings = oldPrice - newPrice;
    this.addNotification(
      'promotion',
      '💰 Price Drop!',
      `${productName} dropped from ₹${oldPrice} to ₹${newPrice}! Save ₹${savings}`,
      8000
    );
  },

  // Wishlist alerts
  notifyWishlistPriceDrop(items) {
    const itemNames = items.slice(0, 2).map(i => i.name).join(', ');
    const moreText = items.length > 2 ? ` + ${items.length - 2} more` : '';
    
    this.addNotification(
      'promotion',
      '🛍️ Wishlist Alert',
      `${itemNames}${moreText} have price drops!`,
      8000
    );
  }
};

// Enable push notifications on user interaction
document.addEventListener('DOMContentLoaded', () => {
  // Show notification permission prompt after 2 seconds
  setTimeout(() => {
    notificationsModule.requestPushPermission();
  }, 2000);
});
