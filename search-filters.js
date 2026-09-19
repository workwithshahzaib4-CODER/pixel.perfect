// Advanced Search & Filter System
const searchFiltersModule = {
  // Cache DOM references
  searchInput: null,
  categoryFilter: null,
  priceRangeSlider: null,
  sizeFilter: null,
  sortSelect: null,
  resultsContainer: null,
  
  // Filter state
  currentFilters: {
    search: '',
    category: 'all',
    priceMin: 0,
    priceMax: 2000,
    size: 'all',
    sortBy: 'newest'
  },

  // Initialize the search system
  init() {
    this.cacheDOM();
    this.setupEventListeners();
    this.renderFilters();
  },

  cacheDOM() {
    this.searchInput = document.getElementById('searchInput');
    this.categoryFilter = document.getElementById('categoryFilter');
    this.priceRangeSlider = document.getElementById('priceRange');
    this.sizeFilter = document.getElementById('sizeFilter');
    this.sortSelect = document.getElementById('sortBy');
    this.resultsContainer = document.getElementById('filteredResults');
  },

  setupEventListeners() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.currentFilters.search = e.target.value.toLowerCase();
        this.applyFilters();
      });
    }

    if (this.categoryFilter) {
      this.categoryFilter.addEventListener('change', (e) => {
        this.currentFilters.category = e.target.value;
        this.applyFilters();
      });
    }

    if (this.priceRangeSlider) {
      this.priceRangeSlider.addEventListener('input', (e) => {
        this.currentFilters.priceMax = parseInt(e.target.value);
        document.getElementById('priceValue').textContent = `₹${this.currentFilters.priceMax}`;
        this.applyFilters();
      });
    }

    if (this.sizeFilter) {
      this.sizeFilter.addEventListener('change', (e) => {
        this.currentFilters.size = e.target.value;
        this.applyFilters();
      });
    }

    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        this.currentFilters.sortBy = e.target.value;
        this.applyFilters();
      });
    }
  },

  renderFilters() {
    // Get unique categories
    const categories = [...new Set(products.map(p => p.category))];
    if (this.categoryFilter) {
      this.categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
        categories.map(cat => `<option value="${cat}">${this.formatCategoryName(cat)}</option>`).join('');
    }

    // Get unique sizes
    const sizes = [...new Set(products.flatMap(p => p.sizes.map(s => s.label)))];
    if (this.sizeFilter) {
      this.sizeFilter.innerHTML = '<option value="all">All Sizes</option>' +
        sizes.map(size => `<option value="${size}">${size}</option>`).join('');
    }
  },

  formatCategoryName(category) {
    return category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  },

  applyFilters() {
    let filtered = [...products];

    // Search filter
    if (this.currentFilters.search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(this.currentFilters.search) ||
        p.category.toLowerCase().includes(this.currentFilters.search)
      );
    }

    // Category filter
    if (this.currentFilters.category !== 'all') {
      filtered = filtered.filter(p => p.category === this.currentFilters.category);
    }

    // Price filter
    filtered = filtered.filter(p => {
      const minPrice = Math.min(...p.sizes.map(s => s.price));
      return minPrice >= this.currentFilters.priceMin && minPrice <= this.currentFilters.priceMax;
    });

    // Size filter
    if (this.currentFilters.size !== 'all') {
      filtered = filtered.filter(p => 
        p.sizes.some(s => s.label === this.currentFilters.size)
      );
    }

    // Sorting
    filtered = this.sortResults(filtered);

    // Display results
    this.displayResults(filtered);
    this.updateResultsCount(filtered.length);
  },

  sortResults(results) {
    const sorted = [...results];
    
    switch (this.currentFilters.sortBy) {
      case 'price-low':
        sorted.sort((a, b) => Math.min(...a.sizes.map(s => s.price)) - Math.min(...b.sizes.map(s => s.price)));
        break;
      case 'price-high':
        sorted.sort((a, b) => Math.max(...b.sizes.map(s => s.price)) - Math.max(...a.sizes.map(s => s.price)));
        break;
      case 'trending':
        sorted.sort((a, b) => (b.purchases || 0) - (a.purchases || 0));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => (b.newest || 0) - (a.newest || 0));
    }
    
    return sorted;
  },

  displayResults(results) {
    if (!this.resultsContainer) return;

    if (results.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <h3>No Posters Found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      `;
      return;
    }

    this.resultsContainer.innerHTML = results.map(product => `
      <div class="product-card-search" data-product-id="${product.id}">
        <div class="product-image-container">
          <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" />
          ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ''}
        </div>
        <div class="product-info-search">
          <h3 class="product-name-search">${product.name}</h3>
          <div class="product-category-badge">${this.formatCategoryName(product.category)}</div>
          <div class="product-price-search">
            <span class="price-range">₹${Math.min(...product.sizes.map(s => s.price))} - ₹${Math.max(...product.sizes.map(s => s.price))}</span>
          </div>
          <div class="product-rating-search">
            ${this.renderStars(product.rating || 4.9)}
            <span class="rating-count">(${product.reviewCount || 100})</span>
          </div>
          <button class="btn-add-to-cart-search" onclick="addToCart('${product.id}', '${product.sizes[0].label}')">
            Add to Cart
          </button>
        </div>
      </div>
    `).join('');

    // Add animation
    document.querySelectorAll('.product-card-search').forEach((card, idx) => {
      card.style.animation = `fadeInUp 0.4s ease-out ${idx * 0.05}s both`;
    });
  },

  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    let html = '';
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) html += '⭐';
      else if (i === fullStars && hasHalf) html += '⭐️';
      else html += '☆';
    }
    
    return `<span class="stars">${html}</span>`;
  },

  updateResultsCount(count) {
    const countEl = document.getElementById('resultsCount');
    if (countEl) {
      countEl.textContent = `Showing ${count} ${count === 1 ? 'poster' : 'posters'}`;
      countEl.style.animation = 'slideInDown 0.3s ease-out';
    }
  },

  clearFilters() {
    this.currentFilters = {
      search: '',
      category: 'all',
      priceMin: 0,
      priceMax: 2000,
      size: 'all',
      sortBy: 'newest'
    };

    if (this.searchInput) this.searchInput.value = '';
    if (this.categoryFilter) this.categoryFilter.value = 'all';
    if (this.priceRangeSlider) {
      this.priceRangeSlider.value = 2000;
      document.getElementById('priceValue').textContent = '₹2000';
    }
    if (this.sizeFilter) this.sizeFilter.value = 'all';
    if (this.sortSelect) this.sortSelect.value = 'newest';

    this.applyFilters();
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('searchInput')) {
    searchFiltersModule.init();
  }
});
