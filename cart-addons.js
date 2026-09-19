// Premium Cart Add-ons & Upgrades Module
const cartAddonsModule = {
  // Express Shipping
  expressShippingCost: 299,
  
  // Gift Options
  giftOptions: [
    { id: 'gift-wrap', name: 'Gift Wrapping', price: 99, description: 'Premium eco-friendly wrapping' },
    { id: 'gift-card', name: 'Personalized Card', price: 49, description: 'Custom message card' },
    { id: 'gift-box', name: 'Gift Box Upgrade', price: 149, description: 'Premium presentation box' }
  ],

  // Payment Methods
  paymentMethods: [
    { id: 'upi', name: 'UPI', icon: 'smartphone', desc: 'Instant payment' },
    { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card', desc: 'Secure payment' },
    { id: 'wallet', name: 'Digital Wallet', icon: 'wallet-cards', desc: 'Quick checkout' },
    { id: 'cod', name: 'Cash on Delivery', icon: 'banknote', desc: 'Pay at delivery' }
  ],

  // Get selected add-ons total
  getAddonsTotal() {
    let total = 0;
    const isExpress = localStorage.getItem('cart-express-shipping') === 'true';
    if (isExpress) total += this.expressShippingCost;
    
    try {
      const selectedGifts = JSON.parse(localStorage.getItem('cart-gift-options') || '[]');
      selectedGifts.forEach(giftId => {
        const gift = this.giftOptions.find(g => g.id === giftId);
        if (gift) total += gift.price;
      });
    } catch (e) {}
    
    return total;
  },

  // Toggle express shipping
  toggleExpressShipping() {
    const current = localStorage.getItem('cart-express-shipping') === 'true';
    localStorage.setItem('cart-express-shipping', String(!current));
    renderCartPage();
    if (typeof initLucideIcons === 'function') initLucideIcons();
    showToast(!current ? '⚡ Express shipping added' : 'Express shipping removed', 'success');
  },

  // Toggle gift option
  toggleGiftOption(giftId) {
    try {
      const selected = JSON.parse(localStorage.getItem('cart-gift-options') || '[]');
      const index = selected.indexOf(giftId);
      
      if (index === -1) {
        selected.push(giftId);
        showToast('Gift option added', 'success');
      } else {
        selected.splice(index, 1);
        showToast('Gift option removed', 'info');
      }
      
      localStorage.setItem('cart-gift-options', JSON.stringify(selected));
      renderCartPage();
      if (typeof initLucideIcons === 'function') initLucideIcons();
    } catch (e) {
      console.error('Gift option error:', e);
    }
  },

  // Get selected gift options
  getSelectedGifts() {
    try {
      return JSON.parse(localStorage.getItem('cart-gift-options') || '[]');
    } catch {
      return [];
    }
  },

  // Set payment method
  setPaymentMethod(methodId) {
    localStorage.setItem('selected-payment-method', methodId);
    renderCartPage();
    if (typeof initLucideIcons === 'function') initLucideIcons();
    showToast('Payment method selected', 'info');
  },

  // Get selected payment method
  getPaymentMethod() {
    return localStorage.getItem('selected-payment-method') || 'upi';
  },

  // Validate pincode
  validatePincode(pincode) {
    const normalized = String(pincode || '').trim();
    if (!/^[1-9][0-9]{5}$/.test(normalized)) {
      return { valid: false, message: 'Invalid pincode' };
    }
    
    const metroCodes = ['11', '12', '20', '40', '56', '60', '70'];
    const isMetro = metroCodes.includes(normalized.slice(0, 2));
    const days = isMetro ? 2 : 4;
    const date = new Date();
    date.setDate(date.getDate() + days);
    
    return {
      valid: true,
      message: `Delivery available in ${days}-${days + 1} days`,
      deliveryDate: date.toLocaleDateString('en-IN'),
      cod: true
    };
  },

  // Get quantity discount tier
  getQuantityDiscountTier(totalQty) {
    if (totalQty >= 10) return { qty: 10, discount: 15, save: '₹200+' };
    if (totalQty >= 5) return { qty: 5, discount: 10, save: '₹100+' };
    if (totalQty >= 3) return { qty: 3, discount: 5, save: '₹50+' };
    return null;
  },

  // Get next discount milestone
  getNextDiscountMilestone(currentQty) {
    if (currentQty < 3) return { need: 3, discount: 5 };
    if (currentQty < 5) return { need: 5, discount: 10 };
    if (currentQty < 10) return { need: 10, discount: 15 };
    return null;
  },

  // Render shipping options
  renderShippingOptions() {
    const root = document.getElementById('shippingOptionsPanel');
    if (!root) return;

    const isExpress = localStorage.getItem('cart-express-shipping') === 'true';
    const cart = parseCart();
    const totals = getCartTotals(cart);

    root.innerHTML = `
      <div class="addons-panel">
        <div class="panel-header">
          <h3><i data-lucide="truck" class="ui-icon"></i> Delivery Options</h3>
          <span>Choose your speed</span>
        </div>
        <div class="shipping-options-grid">
          <div class="shipping-option ${!isExpress ? 'selected' : ''}">
            <input type="radio" name="shipping" value="standard" ${!isExpress ? 'checked' : ''} onchange="cartAddonsModule.toggleExpressShipping()">
            <label>
              <strong>Standard Delivery</strong>
              <span>4-6 working days</span>
              <span class="price">₹${totals.shipping}</span>
            </label>
          </div>
          <div class="shipping-option ${isExpress ? 'selected' : ''}">
            <input type="radio" name="shipping" value="express" ${isExpress ? 'checked' : ''} onchange="cartAddonsModule.toggleExpressShipping()">
            <label>
              <strong><i data-lucide="zap" class="ui-icon"></i> Express Delivery</strong>
              <span>24-48 hours</span>
              <span class="price">₹${totals.shipping + this.expressShippingCost}</span>
            </label>
          </div>
        </div>
      </div>
    `;
  },

  // Render gift options
  renderGiftOptions() {
    const root = document.getElementById('giftOptionsPanel');
    if (!root) return;

    const selectedGifts = this.getSelectedGifts();

    root.innerHTML = `
      <div class="addons-panel">
        <div class="panel-header">
          <h3><i data-lucide="gift" class="ui-icon"></i> Gift Options</h3>
          <span>Make it special</span>
        </div>
        <div class="gift-options-grid">
          ${this.giftOptions.map(gift => `
            <div class="gift-option ${selectedGifts.includes(gift.id) ? 'selected' : ''}">
              <input type="checkbox" id="gift-${gift.id}" ${selectedGifts.includes(gift.id) ? 'checked' : ''} onchange="cartAddonsModule.toggleGiftOption('${gift.id}')">
              <label for="gift-${gift.id}">
                <div class="gift-name">${gift.name}</div>
                <div class="gift-desc">${gift.description}</div>
                <div class="gift-price">+₹${gift.price}</div>
              </label>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Render payment methods
  renderPaymentMethods() {
    const root = document.getElementById('paymentMethodsPanel');
    if (!root) return;

    const selected = this.getPaymentMethod();

    root.innerHTML = `
      <div class="addons-panel">
        <div class="panel-header">
          <h3><i data-lucide="credit-card" class="ui-icon"></i> Payment Method</h3>
          <span>Choose how to pay</span>
        </div>
        <div class="payment-methods-grid">
          ${this.paymentMethods.map(method => `
            <div class="payment-method ${selected === method.id ? 'selected' : ''}">
              <input type="radio" name="payment" value="${method.id}" ${selected === method.id ? 'checked' : ''} onchange="cartAddonsModule.setPaymentMethod('${method.id}')">
              <label>
                <span class="payment-icon"><i data-lucide="${method.icon}" class="ui-icon"></i></span>
                <strong>${method.name}</strong>
                <small>${method.desc}</small>
              </label>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Render discount showcase
  renderDiscountShowcase() {
    const root = document.getElementById('discountShowcasePanel');
    if (!root) return;

    const cart = parseCart();
    const totalQty = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
    const currentTier = this.getQuantityDiscountTier(totalQty);
    const nextMilestone = this.getNextDiscountMilestone(totalQty);

    root.innerHTML = `
      <div class="addons-panel discount-panel">
        <div class="panel-header">
          <h3>💰 Quantity Discounts</h3>
          <span>Current: ${totalQty} items</span>
        </div>
        ${currentTier ? `
          <div class="discount-active">
            <span class="badge">🎉 Active</span>
            <p>You're saving <strong>${currentTier.discount}%</strong> on all items! (${currentTier.save})</p>
          </div>
        ` : ''}
        ${nextMilestone ? `
          <div class="discount-milestone">
            <p>Buy <strong>${nextMilestone.need} items</strong> to unlock <strong>${nextMilestone.discount}%</strong> discount</p>
            <div class="milestone-progress">
              <span style="width: ${Math.min((totalQty / nextMilestone.need) * 100, 100)}%"></span>
            </div>
            <small>${nextMilestone.need - totalQty} more items needed</small>
          </div>
        ` : `
          <div class="discount-info">
            <p>💡 Buy more to save more!</p>
            <small>3 items → 5% off | 5 items → 10% off | 10 items → 15% off</small>
          </div>
        `}
      </div>
    `;
  },

  // Render product reviews in cart
  renderCartReviews() {
    const root = document.getElementById('cartReviewsPanel');
    if (!root) return;

    const cart = parseCart();
    if (!cart.length) return;

    root.innerHTML = `
      <div class="addons-panel">
        <div class="panel-header">
          <h3>⭐ Customer Reviews</h3>
          <span>What buyers say</span>
        </div>
        <div class="cart-reviews-list">
          ${cart.map(item => `
            <div class="cart-review-item">
              <strong>${item.name}</strong>
              <div class="review-stats">
                <span class="rating">⭐ 4.8/5</span>
                <span class="count">(2.3k reviews)</span>
              </div>
              <p class="review-text">"Premium quality, fast delivery, highly recommended!"</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Cart abandonment alert
  showAbandonmentAlert() {
    const cart = parseCart();
    if (!cart.length) return;

    const totals = getCartTotals(cart);
    const itemCount = cart.length;
    const itemsText = itemCount === 1 ? 'item' : 'items';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay abandonment-modal';
    modal.innerHTML = `
      <div class="modal-content abandonment-content">
        <h2>Wait! Don't miss out 👋</h2>
        <p>You have <strong>${itemCount} ${itemsText}</strong> in your cart worth <strong>₹${totals.total}</strong></p>
        <div class="abandonment-items">
          ${cart.slice(0, 3).map(item => `
            <div class="mini-item">
              <img src="${item.image}" alt="${item.name}" loading="lazy">
              <div>
                <strong>${item.name}</strong>
                <small>₹${item.price} x${item.quantity}</small>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="abandonment-actions">
          <button class="primary-button" onclick="this.closest('.modal-overlay').remove(); window.location.href='checkout.html'">
            Complete Checkout
          </button>
          <button class="secondary-button" onclick="this.closest('.modal-overlay').remove()">
            Keep Shopping
          </button>
        </div>
        <small>✓ Free returns | ✓ 100% secure | ✓ Fast delivery</small>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('open');
    
    setTimeout(() => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
    }, 100);
  }
};
