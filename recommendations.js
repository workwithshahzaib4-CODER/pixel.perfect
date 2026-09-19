// Smart Product Recommendations Engine
const recommendationEngine = {
  // Track user behavior
  userBehavior: {
    viewed: [],
    purchased: [],
    cart: [],
    wishlist: []
  },

  init() {
    this.loadBehavior();
    if (typeof this.trackPageViews === 'function') {
      this.trackPageViews();
    }
  },

  loadBehavior() {
    const userId = this.getCurrentUserId();
    const saved = localStorage.getItem(`behavior_${userId}`);
    if (!saved) {
      this.userBehavior = {
        viewed: [],
        purchased: [],
        cart: [],
        wishlist: [],
        pageViews: []
      };
      return;
    }

    try {
      this.userBehavior = { ...this.userBehavior, ...JSON.parse(saved) };
      if (!Array.isArray(this.userBehavior.viewed)) this.userBehavior.viewed = [];
      if (!Array.isArray(this.userBehavior.purchased)) this.userBehavior.purchased = [];
      if (!Array.isArray(this.userBehavior.cart)) this.userBehavior.cart = [];
      if (!Array.isArray(this.userBehavior.wishlist)) this.userBehavior.wishlist = [];
      if (!Array.isArray(this.userBehavior.pageViews)) this.userBehavior.pageViews = [];
    } catch (error) {
      this.userBehavior = {
        viewed: [],
        purchased: [],
        cart: [],
        wishlist: [],
        pageViews: []
      };
    }
  },

  trackPageViews() {
    const productId = document.body?.dataset?.productId || null;
    const page = {
      url: window.location.pathname + window.location.search + window.location.hash,
      time: Date.now()
    };

    if (!this.userBehavior.pageViews) this.userBehavior.pageViews = [];
    this.userBehavior.pageViews = this.userBehavior.pageViews.filter(entry => entry && entry.url !== page.url);
    this.userBehavior.pageViews.push(page);
    this.userBehavior.pageViews = this.userBehavior.pageViews.slice(-50);

    if (productId) {
      this.trackView(productId);
    }

    this.saveBehavior();
  },

  saveBehavior() {
    const userId = this.getCurrentUserId();
    localStorage.setItem(`behavior_${userId}`, JSON.stringify(this.userBehavior));
  },

  getCurrentUserId() {
    return localStorage.getItem('currentUser') || 'guest';
  },

  // Track product view
  trackView(productId) {
    if (!this.userBehavior.viewed) this.userBehavior.viewed = [];
    
    this.userBehavior.viewed = this.userBehavior.viewed.filter(id => id !== productId);
    this.userBehavior.viewed.unshift(productId);
    this.userBehavior.viewed = this.userBehavior.viewed.slice(0, 50); // Keep last 50
    
    this.saveBehavior();
  },

  // Track purchase
  trackPurchase(productId, category) {
    if (!this.userBehavior.purchased) this.userBehavior.purchased = [];
    this.userBehavior.purchased.push({ id: productId, category, date: Date.now() });
    this.saveBehavior();
  },

  // Get products similar to viewed items
  getSimilarProducts(productId, count = 4) {
    const product = products.find(p => p.id === productId);
    if (!product) return [];

    const similar = products.filter(p => 
      p.id !== productId && p.category === product.category
    );

    return similar.slice(0, count);
  },

  // Get frequently bought together
  getFrequentlyBoughtTogether(productId, count = 3) {
    const product = products.find(p => p.id === productId);
    if (!product) return [];

    // Get products from same category or similar price range
    const compatible = products.filter(p => 
      p.id !== productId && (
        p.category === product.category ||
        this.getPriceRange(p) === this.getPriceRange(product)
      )
    ).sort(() => Math.random() - 0.5);

    return compatible.slice(0, count);
  },

  getPriceRange(product) {
    const minPrice = Math.min(...product.sizes.map(s => s.price));
    if (minPrice < 500) return 'budget';
    if (minPrice < 1000) return 'mid-range';
    return 'premium';
  },

  // Get trending products
  getTrendingProducts(count = 6) {
    return products
      .sort((a, b) => (b.purchases || 0) - (a.purchases || 0))
      .slice(0, count);
  },

  // Get personalized recommendations based on user behavior
  getPersonalizedRecommendations(count = 8) {
    const viewed = this.userBehavior.viewed || [];
    
    if (viewed.length === 0) {
      return this.getTrendingProducts(count);
    }

    const lastViewed = viewed[0];
    const lastProduct = products.find(p => p.id === lastViewed);

    if (!lastProduct) {
      return this.getTrendingProducts(count);
    }

    const recommendations = products.filter(p => 
      p.id !== lastProduct.id && (
        p.category === lastProduct.category ||
        viewed.includes(p.id) === false
      )
    ).sort((a, b) => {
      // Score based on category match and popularity
      const aScore = (a.category === lastProduct.category ? 10 : 0) + (a.purchases || 0);
      const bScore = (b.category === lastProduct.category ? 10 : 0) + (b.purchases || 0);
      return bScore - aScore;
    });

    return recommendations.slice(0, count);
  },

  // Render recommendations section
  renderRecommendations(containerId, type = 'personalized', count = 6) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let recommendedProducts = [];
    
    switch (type) {
      case 'trending':
        recommendedProducts = this.getTrendingProducts(count);
        break;
      case 'similar':
        const productId = container.dataset.productId;
        recommendedProducts = this.getSimilarProducts(productId, count);
        break;
      case 'bought-together':
        const pId = container.dataset.productId;
        recommendedProducts = this.getFrequentlyBoughtTogether(pId, count);
        break;
      default:
        recommendedProducts = this.getPersonalizedRecommendations(count);
    }

    if (recommendedProducts.length === 0) {
      return;
    }

    container.innerHTML = recommendedProducts.map((product, idx) => `
      <div class="recommendation-card" style="animation: slideInUp 0.4s ease-out ${idx * 0.08}s both">
        <div class="rec-image-container">
          <img src="${product.image}" alt="${product.name}" class="rec-image" loading="lazy" />
          ${product.tag ? `<span class="rec-badge">${product.tag}</span>` : ''}
        </div>
        <div class="rec-info">
          <h3 class="rec-name">${product.name.substring(0, 50)}${product.name.length > 50 ? '...' : ''}</h3>
          <div class="rec-rating">
            ${'⭐'.repeat(Math.round(product.rating || 4))}
            <span>(${product.reviewCount || 100})</span>
          </div>
          <div class="rec-price">
            <span class="price-from">From ₹${Math.min(...product.sizes.map(s => s.price))}</span>
          </div>
          <div class="rec-actions">
            <button class="rec-add-btn" onclick="addToCart('${product.id}', '${product.sizes[0].label}')">
              Add to Cart
            </button>
            <button class="rec-wishlist-btn" onclick="wishlistModule.toggleWishlist('${product.id}'); event.target.classList.toggle('wishlisted')">
              🤍
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  // Render "You might also like" section
  renderAlsoLike(productId, containerId = 'alsoLike') {
    this.renderRecommendations(containerId, 'similar', 4);
  },

  // Render "Frequently bought together" section
  renderBoughtTogether(productId, containerId = 'boughtTogether') {
    this.renderRecommendations(containerId, 'bought-together', 3);
  }
};

// Track views when product page is loaded
function trackProductView(productId) {
  recommendationEngine.trackView(productId);
}

// Initialize recommendations on page load
document.addEventListener('DOMContentLoaded', () => {
  recommendationEngine.init();
  
  // Auto-render trending section on homepage
  const trendingContainer = document.getElementById('trendingProducts');
  if (trendingContainer) {
    recommendationEngine.renderRecommendations('trendingProducts', 'trending', 6);
  }

  // Auto-render personalized on checkout page
  const personalizedContainer = document.getElementById('recommendedForYou');
  if (personalizedContainer) {
    recommendationEngine.renderRecommendations('recommendedForYou', 'personalized', 6);
  }
});
