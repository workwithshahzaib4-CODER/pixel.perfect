// Smart Bundle Offers & One-Click Upsells
const bundleModule = {
  bundles: [
    {
      id: 'gaming-complete',
      name: 'The Ultimate Gaming Setup',
      description: 'Complete gaming wall collection with premium frames',
      products: ['gaming-1', 'gaming-2', 'gaming-3'],
      regularPrice: 1197,
      bundlePrice: 899,
      discount: '25% OFF',
      imageUrl: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=400&h=300&fit=crop',
      tag: 'BESTSELLER'
    },
    {
      id: 'motivation-trio',
      name: 'Motivation Wall Pack',
      description: '3 motivational posters + free matching frame',
      products: ['motivation-1', 'motivation-2', 'motivation-3'],
      regularPrice: 597,
      bundlePrice: 399,
      discount: '33% OFF',
      imageUrl: 'https://images.unsplash.com/photo-1552084898-04f87f92064b?w=400&h=300&fit=crop',
      tag: 'POPULAR'
    },
    {
      id: 'automotive-dream',
      name: 'Car Enthusiast Bundle',
      description: 'Premium automotive collection with glossy finish',
      products: ['automotive-1', 'automotive-2', 'automotive-3'],
      regularPrice: 1497,
      bundlePrice: 1099,
      discount: '27% OFF',
      imageUrl: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=400&h=300&fit=crop',
      tag: 'TRENDING'
    },
    {
      id: 'minimalist-suite',
      name: 'Minimalist Art Collection',
      description: '4 elegant minimalist posters for modern spaces',
      products: ['minimalist-1', 'minimalist-2', 'minimalist-3', 'minimalist-4'],
      regularPrice: 796,
      bundlePrice: 549,
      discount: '31% OFF',
      imageUrl: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=300&fit=crop',
      tag: 'TRENDING'
    }
  ],

  getSmartBundles(cartItems) {
    if (!cartItems || cartItems.length === 0) return [];
    
    const cartProductIds = cartItems.map(item => item.id);
    
    // Find bundles that complement cart items
    return this.bundles.filter(bundle => {
      const matchCount = bundle.products.filter(p => cartProductIds.includes(p)).length;
      return matchCount > 0 && matchCount < bundle.products.length;
    });
  },

  calculateVolumeDiscount(quantity) {
    if (quantity >= 5) return 0.20; // 20% off for 5+ items
    if (quantity >= 3) return 0.15; // 15% off for 3+ items
    if (quantity >= 2) return 0.10; // 10% off for 2 items
    return 0;
  },

  getSeasonalOffers() {
    const month = new Date().getMonth();
    const offers = {
      0: { name: 'New Year Refresh', discount: 0.20 }, // Jan
      1: { name: 'Love Month Special', discount: 0.15 }, // Feb
      5: { name: 'Summer Vibes', discount: 0.18 }, // Jun
      10: { name: 'Festival Lights', discount: 0.22 }, // Nov
      11: { name: 'Year-End Clearance', discount: 0.25 } // Dec
    };
    
    return offers[month] || { name: 'Regular Pricing', discount: 0 };
  },

  addBundleToCart(bundleId) {
    const bundle = this.bundles.find(b => b.id === bundleId);
    if (!bundle) {
      showToast('Bundle not found', 'error');
      return false;
    }

    const cart = parseCart();
    
    bundle.products.forEach(productId => {
      const product = products.find(p => p.id === productId);
      if (product) {
        const existingItem = cart.find(item => item.id === productId);
        if (!existingItem) {
          cart.push({
            id: productId,
            name: product.name,
            price: product.sizes[0].price,
            quantity: 1,
            size: product.sizes[0].label,
            image: product.image,
            bundle: bundleId,
            bundleDiscount: bundle.discount
          });
        }
      }
    });

    localStorage.setItem('pixel-perfect-cart', JSON.stringify(cart));
    showToast(`✨ Bundle "${bundle.name}" added! Save ${bundle.discount}!`, 'success');
    
    if (typeof updateCartCount === 'function') {
      updateCartCount();
    }
    
    return true;
  },

  renderBundleCarousel(containerId = 'bundleCarousel') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cart = parseCart();
    const recommendedBundles = this.getSmartBundles(cart);
    const displayBundles = recommendedBundles.length > 0 ? recommendedBundles : this.bundles;

    container.innerHTML = `
      <div class="bundle-section">
        <div class="bundle-header">
          <h2>🎁 Limited-Time Bundles</h2>
          <p>Save more when you bundle</p>
        </div>
        <div class="bundle-carousel">
          ${displayBundles.slice(0, 4).map((bundle, idx) => `
            <div class="bundle-card" style="animation: slideInUp 0.5s ease-out ${idx * 0.1}s both">
              <div class="bundle-image-wrapper">
                <img src="${bundle.imageUrl}" alt="${bundle.name}" class="bundle-image" />
                <span class="bundle-tag">${bundle.tag}</span>
                <span class="bundle-discount-badge">${bundle.discount}</span>
              </div>
              <div class="bundle-info">
                <h3>${bundle.name}</h3>
                <p class="bundle-desc">${bundle.description}</p>
                <div class="bundle-pricing">
                  <span class="original-price">₹${bundle.regularPrice}</span>
                  <span class="bundle-price">₹${bundle.bundlePrice}</span>
                  <span class="savings">Save ₹${bundle.regularPrice - bundle.bundlePrice}</span>
                </div>
                <div class="bundle-products">
                  ${bundle.products.slice(0, 3).map(pid => `
                    <span class="product-badge">+ ${products.find(p => p.id === pid)?.name.substring(0, 15)}</span>
                  `).join('')}
                  ${bundle.products.length > 3 ? `<span class="product-badge">+ ${bundle.products.length - 3} more</span>` : ''}
                </div>
                <button class="primary-button bundle-add-btn" onclick="bundleModule.addBundleToCart('${bundle.id}')">
                  Add Bundle to Cart
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderVolumeDiscountInfo(containerId = 'volumeDiscountInfo') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="volume-discount-info">
        <h3>💰 Volume Discounts</h3>
        <div class="discount-tiers">
          <div class="tier">
            <span class="qty">2 items</span>
            <span class="discount">10% OFF</span>
          </div>
          <div class="tier">
            <span class="qty">3+ items</span>
            <span class="discount">15% OFF</span>
          </div>
          <div class="tier">
            <span class="qty">5+ items</span>
            <span class="discount">20% OFF</span>
          </div>
        </div>
        <p class="info-text">Discounts auto-apply at checkout</p>
      </div>
    `;
  },

  renderSeasonalOffer(containerId = 'seasonalOffer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const offer = this.getSeasonalOffers();
    if (offer.discount === 0) return;

    container.innerHTML = `
      <div class="seasonal-banner">
        <span class="seasonal-icon">🎉</span>
        <div class="seasonal-text">
          <strong>${offer.name}</strong>
          <p>Get ${Math.round(offer.discount * 100)}% OFF on all orders!</p>
        </div>
        <button class="secondary-button" onclick="document.location.href='category.html'">Shop Now</button>
      </div>
    `;
  }
};

// Initialize bundles on page load
document.addEventListener('DOMContentLoaded', () => {
  bundleModule.renderBundleCarousel();
  bundleModule.renderVolumeDiscountInfo();
  bundleModule.renderSeasonalOffer();
});
