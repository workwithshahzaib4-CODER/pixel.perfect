// Enhanced Cart Experience
const enhancedCartModule = {
  // Save cart for later
  saveCartForLater() {
    const cart = parseCart();
    if (cart.length === 0) {
      showToast('Your cart is empty', 'warning');
      return;
    }

    const savedCarts = JSON.parse(localStorage.getItem('savedCarts') || '[]');
    const cartName = prompt('Name this cart:', `Cart - ${new Date().toLocaleDateString()}`);
    
    if (cartName) {
      savedCarts.push({
        id: 'saved_' + Date.now(),
        name: cartName,
        items: cart,
        savedDate: new Date().toISOString(),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      });

      localStorage.setItem('savedCarts', JSON.stringify(savedCarts));
      showToast(`💾 Cart saved as "${cartName}"`, 'success');
    }
  },

  // Load saved cart
  loadSavedCart(cartId) {
    const savedCarts = JSON.parse(localStorage.getItem('savedCarts') || '[]');
    const savedCart = savedCarts.find(c => c.id === cartId);

    if (savedCart) {
      localStorage.setItem(CART_KEY, JSON.stringify(savedCart.items));
      saveGuestCartSnapshot(savedCart.items);
      showToast(`✨ Cart "${savedCart.name}" restored`, 'success');
      window.location.href = 'cart.html';
    }
  },

  // Get saved carts
  getSavedCarts() {
    return JSON.parse(localStorage.getItem('savedCarts') || '[]');
  },

  // Remove saved cart
  removeSavedCart(cartId) {
    let savedCarts = JSON.parse(localStorage.getItem('savedCarts') || '[]');
    savedCarts = savedCarts.filter(c => c.id !== cartId);
    localStorage.setItem('savedCarts', JSON.stringify(savedCarts));
    showToast('Saved cart deleted', 'info');
  },

  // Share cart via link
  shareCart() {
    const cart = parseCart();
    if (cart.length === 0) {
      showToast('Your cart is empty', 'warning');
      return;
    }

    const cartData = btoa(JSON.stringify(cart)); // Base64 encode
    const shareLink = `${window.location.origin}?cart=${cartData}`;
    
    navigator.clipboard.writeText(shareLink).then(() => {
      showToast('✨ Cart link copied! Share with friends', 'success');
    });
  },

  // Apply quantity discounts
  getQuantityDiscount(quantity, basePrice) {
    if (quantity >= 10) return Math.floor(basePrice * 0.15); // 15% off
    if (quantity >= 5) return Math.floor(basePrice * 0.10); // 10% off
    if (quantity >= 3) return Math.floor(basePrice * 0.05); // 5% off
    return basePrice;
  },

  // Calculate free shipping
  calculateFreeshipping(subtotal) {
    const freeShippingThreshold = 200;
    const standardShippingCost = 99;

    if (subtotal >= freeShippingThreshold) {
      return { cost: 0, message: '🎉 FREE SHIPPING!' };
    }

    const remaining = freeShippingThreshold - subtotal;
    return { 
      cost: standardShippingCost, 
      message: `Add ₹${remaining} more for free shipping` 
    };
  },

  // Render enhanced cart summary
  renderCartSummary() {
    const cart = parseCart();
    const container = document.getElementById('cartSummary');
    
    if (!container) return;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = this.calculateFreeshipping(subtotal);
    const loyaltyDiscount = localStorage.getItem('loyaltyDiscount') ? parseInt(localStorage.getItem('loyaltyDiscount')) : 0;
    const appliedCoupon = (() => {
      try {
        return JSON.parse(localStorage.getItem('appliedCoupon') || 'null');
      } catch {
        return null;
      }
    })();
    
    let couponDiscount = 0;
    if (appliedCoupon) {
      couponDiscount = Math.floor(subtotal * Number(appliedCoupon.discountPercent || 0) / 100);
    }

    const total = subtotal + shipping.cost - loyaltyDiscount - couponDiscount;

    container.innerHTML = `
      <div class="cart-summary-box">
        <h3>Order Summary</h3>
        
        <div class="summary-row">
          <span>Subtotal (${cart.length} items)</span>
          <span>₹${subtotal}</span>
        </div>

        ${shipping.cost === 0 ? `
          <div class="summary-row free-shipping">
            <span>🚚 Shipping</span>
            <span class="discount">FREE</span>
          </div>
        ` : `
          <div class="summary-row">
            <span>🚚 Shipping</span>
            <span>₹${shipping.cost}</span>
          </div>
          <div class="shipping-message">${shipping.message}</div>
        `}

        ${appliedCoupon ? `
          <div class="summary-row discount-applied">
            <span>💳 Coupon: ${appliedCoupon.code}</span>
            <span class="discount">-₹${couponDiscount}</span>
          </div>
        ` : ''}

        ${loyaltyDiscount > 0 ? `
          <div class="summary-row discount-applied">
            <span>💰 Loyalty Discount</span>
            <span class="discount">-₹${loyaltyDiscount}</span>
          </div>
        ` : ''}

        <div class="summary-row tax">
          <span>📋 Tax (estimated)</span>
          <span>₹${Math.floor(subtotal * 0.05)}</span>
        </div>

        <div class="summary-row total">
          <span>Total Amount</span>
          <strong>₹${subtotal + shipping.cost + Math.floor(subtotal * 0.05) - loyaltyDiscount - couponDiscount}</strong>
        </div>

        <button class="checkout-btn" onclick="window.location.href='checkout.html'">
          Proceed to Checkout
        </button>

        <div class="cart-actions">
          <button class="action-link" onclick="enhancedCartModule.saveCartForLater()">
            💾 Save Cart
          </button>
          <button class="action-link" onclick="enhancedCartModule.shareCart()">
            🔗 Share Cart
          </button>
          <button class="action-link" onclick="enhancedCartModule.showSavedCarts()">
            📂 Saved Carts
          </button>
        </div>

        <div class="promo-section">
          <input type="text" id="couponCode" placeholder="Enter coupon code" class="coupon-input" />
          <button class="apply-coupon-btn" onclick="enhancedCartModule.applyCoupon()">Apply</button>
        </div>

        <div class="trust-badges">
          ✓ 100% Secure Payment
          ✓ Free Returns
          ✓ Same-day Dispatch
        </div>
      </div>
    `;
  },

  // Apply coupon code
  applyCoupon() {
    const code = document.getElementById('couponCode')?.value;
    if (!code) {
      showToast('Enter a coupon code', 'warning');
      return;
    }

    // Sample coupon codes
    const coupons = {
      'WELCOME10': { discountPercent: 10, maxUses: 1, minAmount: 0 },
      'SAVE20': { discountPercent: 20, maxUses: 100, minAmount: 1000 },
      'FRIEND50': { discountPercent: 50, maxUses: 1, minAmount: 0 },
      'SUMMER15': { discountPercent: 15, maxUses: 1000, minAmount: 500 }
    };

    const coupon = coupons[code.toUpperCase()];
    if (!coupon) {
      showToast('Invalid coupon code', 'error');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (subtotal < coupon.minAmount) {
      showToast(`Minimum order value ₹${coupon.minAmount} required`, 'error');
      return;
    }

    localStorage.setItem('appliedCoupon', JSON.stringify({
      code: code.toUpperCase(),
      discountPercent: coupon.discountPercent
    }));

    showToast(`✨ Coupon applied! ${coupon.discountPercent}% OFF`, 'success');
    document.getElementById('couponCode').value = '';
    this.renderCartSummary();
  },

  // Show saved carts in modal
  showSavedCarts() {
    const savedCarts = this.getSavedCarts();
    let modalRoot = document.getElementById('savedCartsModal');
    
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'savedCartsModal';
      modalRoot.className = 'modal-overlay';
      document.body.appendChild(modalRoot);
    }

    modalRoot.innerHTML = `
      <div class="modal-content saved-carts-modal">
        <div class="modal-header">
          <h2>💾 Saved Carts</h2>
          <button class="modal-close" type="button" aria-label="Close">×</button>
        </div>
        <div class="modal-body">
          ${savedCarts.length === 0 ? `
            <div class="empty-state">
              <p>No saved carts yet</p>
              <small>Save your current cart to access it later</small>
            </div>
          ` : `
            <div class="saved-carts-list">
              ${savedCarts.map(cart => `
                <div class="saved-cart-item">
                  <div class="cart-item-header">
                    <h4>${cart.name}</h4>
                    <span class="cart-date">${new Date(cart.savedDate).toLocaleDateString()}</span>
                  </div>
                  <div class="cart-item-meta">
                    <span>${cart.items.length} items</span>
                    <span>₹${cart.total}</span>
                  </div>
                  <div class="cart-item-actions">
                    <button class="btn-small primary" onclick="enhancedCartModule.loadSavedCart('${cart.id}')">Load</button>
                    <button class="btn-small danger" onclick="enhancedCartModule.removeSavedCart('${cart.id}'); enhancedCartModule.showSavedCarts();">Delete</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    modalRoot.classList.add('open');
    modalRoot.querySelector('.modal-close').addEventListener('click', () => {
      modalRoot.classList.remove('open');
    });
    modalRoot.addEventListener('click', (e) => {
      if (e.target === modalRoot) modalRoot.classList.remove('open');
    });
  },

  // Calculate quantity discounts
  renderQuantityDiscounts(item) {
    const discounts = [
      { quantity: 3, discount: 5 },
      { quantity: 5, discount: 10 },
      { quantity: 10, discount: 15 }
    ];

    return discounts
      .filter(d => d.quantity > item.quantity)
      .map(d => `Buy ${d.quantity} for ${d.discount}% OFF`)
      .join(' | ');
  }
};

// Initialize enhanced cart features
document.addEventListener('DOMContentLoaded', () => {
  enhancedCartModule.renderCartSummary();
  
  // Listen for cart changes
  window.addEventListener('cartUpdated', () => {
    enhancedCartModule.renderCartSummary();
  });
});
