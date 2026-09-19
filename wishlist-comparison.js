// Wishlist & Comparison System
const wishlistModule = {
  // Get or initialize wishlist from localStorage
  getWishlist() {
    return JSON.parse(localStorage.getItem('wishlist') || '[]');
  },

  saveWishlist(wishlist) {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    this.updateWishlistCount();
    this.dispatchEvent('wishlistUpdated', wishlist);
  },

  addToWishlist(productId) {
    const wishlist = this.getWishlist();
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
      this.saveWishlist(wishlist);
      showToast(`💕 Added to wishlist!`, 'success');
      this.updateWishlistButton(productId, true);
      return true;
    }
    return false;
  },

  removeFromWishlist(productId) {
    let wishlist = this.getWishlist();
    wishlist = wishlist.filter(id => id !== productId);
    this.saveWishlist(wishlist);
    showToast(`💔 Removed from wishlist`, 'info');
    this.updateWishlistButton(productId, false);
    return true;
  },

  toggleWishlist(productId) {
    const wishlist = this.getWishlist();
    if (wishlist.includes(productId)) {
      this.removeFromWishlist(productId);
    } else {
      this.addToWishlist(productId);
    }
  },

  isInWishlist(productId) {
    return this.getWishlist().includes(productId);
  },

  updateWishlistButton(productId, isWishlisted) {
    const buttons = document.querySelectorAll(`[data-wishlist-btn="${productId}"]`);
    buttons.forEach(btn => {
      btn.classList.toggle('wishlisted', isWishlisted);
      btn.innerHTML = isWishlisted ? '💕' : '🤍';
    });
  },

  updateWishlistCount() {
    const count = this.getWishlist().length;
    const countEl = document.getElementById('wishlistCount');
    if (countEl) {
      countEl.textContent = count;
      countEl.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  getWishlistProducts() {
    const wishlist = this.getWishlist();
    return products.filter(p => wishlist.includes(p.id));
  },

  renderWishlistPage() {
    const container = document.getElementById('wishlistItems');
    if (!container) return;

    const wishlistProducts = this.getWishlistProducts();

    if (wishlistProducts.length === 0) {
      container.innerHTML = `
        <div class="empty-wishlist">
          <div class="empty-icon">🤍</div>
          <h2>Your Wishlist is Empty</h2>
          <p>Start adding posters to your wishlist to save them for later</p>
          <a href="index.html" class="primary-button">Continue Shopping</a>
        </div>
      `;
      return;
    }

    container.innerHTML = wishlistProducts.map((product, idx) => `
      <div class="wishlist-item" style="animation: fadeInUp 0.4s ease-out ${idx * 0.05}s both">
        <div class="wishlist-item-image">
          <img src="${product.image}" alt="${product.name}" />
          <button class="wishlist-remove-btn" onclick="wishlistModule.removeFromWishlist('${product.id}')">✕</button>
        </div>
        <div class="wishlist-item-details">
          <h3>${product.name}</h3>
          <p class="wishlist-category">${product.category}</p>
          <div class="wishlist-price-range">
            ₹${Math.min(...product.sizes.map(s => s.price))} - ₹${Math.max(...product.sizes.map(s => s.price))}
          </div>
          <div class="wishlist-actions">
            <button class="secondary-button" onclick="addToCart('${product.id}', '${product.sizes[0].label}')">
              Add to Cart
            </button>
            <button class="compare-btn" onclick="comparisonModule.toggleCompare('${product.id}')">
              Compare
            </button>
          </div>
        </div>
      </div>
    `).join('');

    this.updateComparisonUI();
  },

  updateComparisonUI() {
    const compared = comparisonModule.getComparison();
    document.querySelectorAll('.compare-btn').forEach(btn => {
      const productId = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
      btn.classList.toggle('compared', compared.includes(productId));
      btn.textContent = compared.includes(productId) ? '✓ Comparing' : 'Compare';
    });
  },

  dispatchEvent(eventName, data) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }
};

// Comparison Module
const comparisonModule = {
  maxCompare: 3,

  getComparison() {
    return JSON.parse(localStorage.getItem('comparison') || '[]');
  },

  saveComparison(comparison) {
    localStorage.setItem('comparison', JSON.stringify(comparison));
    this.updateComparisonCount();
  },

  toggleCompare(productId) {
    let comparison = this.getComparison();
    
    if (comparison.includes(productId)) {
      comparison = comparison.filter(id => id !== productId);
      showToast('Removed from comparison', 'info');
    } else {
      if (comparison.length >= this.maxCompare) {
        showToast(`You can only compare ${this.maxCompare} posters at a time`, 'warning');
        return;
      }
      comparison.push(productId);
      showToast('Added to comparison', 'success');
    }
    
    this.saveComparison(comparison);
  },

  updateComparisonCount() {
    const count = this.getComparison().length;
    const countEl = document.getElementById('comparisonCount');
    if (countEl) {
      countEl.textContent = count;
      countEl.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  renderComparisonPage() {
    const container = document.getElementById('comparisonContainer');
    if (!container) return;

    const compared = this.getComparison();
    const comparedProducts = products.filter(p => compared.includes(p.id));

    if (comparedProducts.length === 0) {
      container.innerHTML = `
        <div class="empty-comparison">
          <div class="empty-icon">📊</div>
          <h2>No Posters to Compare</h2>
          <p>Add up to 3 posters to compare their features and prices</p>
          <a href="index.html" class="primary-button">Start Comparing</a>
        </div>
      `;
      return;
    }

    // Get all sizes from compared products
    const allSizes = [...new Set(comparedProducts.flatMap(p => p.sizes.map(s => s.label)))];

    const comparisonHTML = `
      <div class="comparison-table">
        <div class="comparison-row header">
          <div class="comparison-cell attribute">Attribute</div>
          ${comparedProducts.map((p, idx) => `
            <div class="comparison-cell product" style="animation: fadeInRight 0.4s ease-out ${(idx + 1) * 0.1}s both">
              <img src="${p.image}" alt="${p.name}" class="comparison-image" />
              <h4>${p.name}</h4>
              <button class="remove-compare" onclick="comparisonModule.toggleCompare('${p.id}')">✕ Remove</button>
            </div>
          `).join('')}
        </div>

        <div class="comparison-row">
          <div class="comparison-cell attribute">Category</div>
          ${comparedProducts.map(p => `
            <div class="comparison-cell">${p.category}</div>
          `).join('')}
        </div>

        <div class="comparison-row">
          <div class="comparison-cell attribute">Rating</div>
          ${comparedProducts.map(p => `
            <div class="comparison-cell">${p.rating || 4.9}⭐ (${p.reviewCount || 100})</div>
          `).join('')}
        </div>

        ${allSizes.map(size => `
          <div class="comparison-row">
            <div class="comparison-cell attribute">${size} Size</div>
            ${comparedProducts.map(p => {
              const sizePrice = p.sizes.find(s => s.label === size);
              return `<div class="comparison-cell">₹${sizePrice ? sizePrice.price : 'N/A'}</div>`;
            }).join('')}
          </div>
        `).join('')}

        <div class="comparison-row">
          <div class="comparison-cell attribute">Action</div>
          ${comparedProducts.map(p => `
            <div class="comparison-cell">
              <button class="primary-button small" onclick="addToCart('${p.id}', '${p.sizes[0].label}')">
                Add to Cart
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = comparisonHTML;
  },

  clearComparison() {
    localStorage.removeItem('comparison');
    this.updateComparisonCount();
    showToast('Comparison cleared', 'info');
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  wishlistModule.updateWishlistCount();
  comparisonModule.updateComparisonCount();

  // Listen for wishlist updates
  window.addEventListener('wishlistUpdated', (e) => {
    wishlistModule.renderWishlistPage();
  });
});
