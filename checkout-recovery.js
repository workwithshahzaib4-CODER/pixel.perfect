// Abandoned Checkout Recovery
const checkoutRecoveryModule = {
  checkoutThresholdMinutes: 5,
  exitIntentDiscount: 15,

  initCheckoutTracking() {
    const checkoutStart = localStorage.getItem('checkoutStartTime');
    if (!checkoutStart) {
      localStorage.setItem('checkoutStartTime', Date.now().toString());
    }

    // Monitor page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onUserLeaving();
      }
    });

    // Track mouse leaving viewport (exit intent)
    document.addEventListener('mouseleave', () => {
      this.triggerExitIntent();
    });
  },

  onUserLeaving() {
    const cart = parseCart();
    if (cart.length === 0) return;

    const checkoutStart = localStorage.getItem('checkoutStartTime');
    const timeInCheckout = (Date.now() - parseInt(checkoutStart)) / 1000 / 60;

    if (timeInCheckout > this.checkoutThresholdMinutes) {
      this.triggerCheckoutReminder();
      
      // Schedule email reminder if email is available
      const email = localStorage.getItem('userEmail');
      if (email && typeof emailMarketingModule !== 'undefined') {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        emailMarketingModule.triggerAbandonedCart(email, cart, total);
      }
    }
  },

  triggerExitIntent() {
    const dismissed = localStorage.getItem('exitIntentDismissed_' + new Date().toDateString());
    if (dismissed) return;

    const cart = parseCart();
    if (cart.length === 0) return;

    const exitModal = document.createElement('div');
    exitModal.className = 'exit-intent-modal';
    exitModal.innerHTML = `
      <div class="exit-modal-content">
        <span class="modal-close" onclick="this.closest('.exit-intent-modal').remove(); localStorage.setItem('exitIntentDismissed_' + new Date().toDateString(), 'true')">✕</span>
        
        <div class="exit-modal-header">
          <h2>🛑 Wait Before You Go!</h2>
          <p>Get an exclusive discount</p>
        </div>

        <div class="exit-modal-body">
          <div class="discount-offer">
            <span class="discount-percent">${this.exitIntentDiscount}%</span>
            <span class="discount-text">OFF your order</span>
          </div>
          
          <p class="offer-subtitle">Use code: <strong>STAY${this.exitIntentDiscount}</strong></p>
          <p class="offer-details">This discount expires when you leave this page</p>

          <div class="cart-summary">
            <h3>Your Cart (${cart.length} items)</h3>
            ${cart.slice(0, 3).map(item => `
              <div class="cart-item-summary">
                <span>${item.name.substring(0, 30)}</span>
                <span>₹${item.price}</span>
              </div>
            `).join('')}
            ${cart.length > 3 ? `<p class="more-items">+ ${cart.length - 3} more items</p>` : ''}
          </div>
        </div>

        <div class="exit-modal-actions">
          <button class="primary-button" onclick="checkoutRecoveryModule.applyCouponAndCheckout('STAY${this.exitIntentDiscount}')">
            Complete Purchase with ${this.exitIntentDiscount}% OFF
          </button>
          <button class="secondary-button" onclick="this.closest('.exit-intent-modal').remove(); localStorage.setItem('exitIntentDismissed_' + new Date().toDateString(), 'true')">
            No, I'm leaving
          </button>
        </div>

        <div class="exit-modal-footer">
          <p>✓ Free Shipping on orders over ₹2000</p>
          <p>✓ 30-Day Money Back Guarantee</p>
          <p>✓ Live Chat Support Available</p>
        </div>
      </div>
    `;

    document.body.appendChild(exitModal);
  },

  triggerCheckoutReminder() {
    const reminders = JSON.parse(localStorage.getItem('checkoutReminders') || '{}');
    const today = new Date().toDateString();
    
    if (reminders[today]) return; // Already shown today
    
    reminders[today] = true;
    localStorage.setItem('checkoutReminders', JSON.stringify(reminders));

    const reminder = document.createElement('div');
    reminder.className = 'checkout-reminder-banner';
    reminder.innerHTML = `
      <div class="reminder-content">
        <span class="reminder-icon">⏰</span>
        <div class="reminder-text">
          <strong>Complete Your Order</strong>
          <p>You have ${parseCart().length} items waiting • Limited-time discounts available</p>
        </div>
        <button class="reminder-action" onclick="document.location.href='checkout.html'">
          Continue Checkout
        </button>
        <button class="reminder-close" onclick="this.closest('.checkout-reminder-banner').remove()">✕</button>
      </div>
    `;

    document.body.insertBefore(reminder, document.body.firstChild);
  },

  applyCouponAndCheckout(couponCode) {
    localStorage.setItem('appliedCoupon', couponCode);
    showToast(`✨ Coupon ${couponCode} applied! Redirecting to checkout...`, 'success');
    
    setTimeout(() => {
      window.location.href = 'checkout.html';
    }, 1000);
  },

  sendRecoveryEmail(email, cartItems) {
    if (typeof emailMarketingModule !== 'undefined') {
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      emailMarketingModule.triggerAbandonedCart(email, cartItems, total);
    }
  }
};

// Initialize checkout tracking on relevant pages
if (document.location.pathname.includes('checkout') || document.location.pathname.includes('cart')) {
  document.addEventListener('DOMContentLoaded', () => {
    checkoutRecoveryModule.initCheckoutTracking();
  });
}
