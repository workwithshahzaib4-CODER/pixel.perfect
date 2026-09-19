const WHATSAPP_NUMBER = '919372654780';
const CART_KEY = 'pixel-perfect-cart';
const WISHLIST_KEY = 'pixel-perfect-wishlist';
const CHECKOUT_DRAFT_KEY = 'pixel-perfect-checkout-draft';

function showToast(message, tone = 'default') {
  let toastRoot = document.getElementById('toastRoot');
  if (!toastRoot) {
    toastRoot = document.createElement('div');
    toastRoot.id = 'toastRoot';
    toastRoot.className = 'toast-root';
    toastRoot.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastRoot);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${tone}`;
  toast.textContent = message;
  toastRoot.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 220);
  }, 2600);
}

function initLucideIcons() {
  const iconScriptId = 'lucide-icons-script';
  const applyIcons = () => {
    if (!window.lucide) return;

    document.querySelectorAll('a[href*="cart.html"], .cart-link').forEach((element) => {
      if (!element.querySelector('[data-lucide]')) element.insertAdjacentHTML('afterbegin', '<i data-lucide="shopping-bag" class="ui-icon"></i>');
    });
    document.querySelectorAll('a[href*="wishlist.html"]').forEach((element) => {
      if (!element.querySelector('[data-lucide]')) element.insertAdjacentHTML('afterbegin', '<i data-lucide="heart" class="ui-icon"></i>');
    });
    document.querySelectorAll('a[href*="membership.html"]').forEach((element) => {
      if (!element.querySelector('[data-lucide]')) element.insertAdjacentHTML('afterbegin', '<i data-lucide="user-round" class="ui-icon"></i>');
    });
    document.querySelectorAll('a[href*="support.html"]').forEach((element) => {
      if (!element.querySelector('[data-lucide]')) element.insertAdjacentHTML('afterbegin', '<i data-lucide="circle-help" class="ui-icon"></i>');
    });
    document.querySelectorAll('a[href*="track-order.html"]').forEach((element) => {
      if (!element.querySelector('[data-lucide]')) element.insertAdjacentHTML('afterbegin', '<i data-lucide="package-check" class="ui-icon"></i>');
    });
    document.querySelectorAll('a[href*="collection=Stick%20It%20Up%20Collection"]').forEach((element) => {
      if (!element.querySelector('[data-lucide]')) element.insertAdjacentHTML('afterbegin', '<i data-lucide="sticker" class="ui-icon"></i>');
    });
    document.querySelectorAll('a[href*="collection=Posterized%20Collection"]').forEach((element) => {
      if (!element.querySelector('[data-lucide]')) element.insertAdjacentHTML('afterbegin', '<i data-lucide="image" class="ui-icon"></i>');
    });
    document.querySelectorAll('.controls input[type="text"]').forEach((input) => {
      if (!input.parentElement.querySelector('[data-lucide="search"]')) input.insertAdjacentHTML('beforebegin', '<i data-lucide="search" class="control-icon"></i>');
    });
    document.querySelectorAll('.controls select').forEach((select) => {
      if (!select.previousElementSibling?.matches('[data-lucide="sliders-horizontal"]')) select.insertAdjacentHTML('beforebegin', '<i data-lucide="sliders-horizontal" class="control-icon"></i>');
    });
    document.querySelectorAll('.trust-badge, .trust-pill').forEach((element) => {
      if (!element.querySelector('[data-lucide]')) element.insertAdjacentHTML('afterbegin', '<i data-lucide="shield-check" class="ui-icon"></i>');
    });
    document.querySelectorAll('.editorial-kicker').forEach((element) => {
      if (!element.querySelector('[data-lucide]')) element.insertAdjacentHTML('afterbegin', '<i data-lucide="sparkles" class="ui-icon"></i>');
    });
    document.querySelectorAll('.whatsapp-link, .whatsapp-cart-btn').forEach((element) => {
      if (!element.querySelector('[data-lucide]')) element.insertAdjacentHTML('afterbegin', '<i data-lucide="chevron-right" class="ui-icon"></i>');
    });
    if (window.lucide.createIcons) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
  };

  if (window.lucide) {
    applyIcons();
    return;
  }
  if (!document.getElementById(iconScriptId)) {
    const script = document.createElement('script');
    script.id = iconScriptId;
    script.src = 'https://unpkg.com/lucide@latest';
    script.onload = applyIcons;
    document.head.appendChild(script);
  }
}

function initProductTypeNavigation() {
  const stickerHref = 'category.html?category=all&collection=Stick%20It%20Up%20Collection';
  const posterHref = 'category.html?category=all&collection=Posterized%20Collection';
  const menus = [document.querySelector('.header-actions'), document.querySelector('.mobile-nav')].filter(Boolean);
  menus.forEach((menu) => {
    if (!menu.querySelector('[data-sticker-navigation]')) {
      const link = document.createElement('a');
      link.href = stickerHref;
      link.className = menu.classList.contains('mobile-nav') ? '' : 'header-link';
      link.dataset.stickerNavigation = 'true';
      link.textContent = 'Stickers';
      menu.insertBefore(link, menu.querySelector('.cart-link') || null);
    }
    if (!menu.querySelector('[data-poster-navigation]')) {
      const link = document.createElement('a');
      link.href = posterHref;
      link.className = menu.classList.contains('mobile-nav') ? '' : 'header-link';
      link.dataset.posterNavigation = 'true';
      link.textContent = 'Posters';
      menu.insertBefore(link, menu.querySelector('.cart-link') || null);
    }
  });
}

function readWishlist() {
  try {
    const wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    return Array.isArray(wishlist) ? wishlist : [];
  } catch {
    return [];
  }
}

function toggleWishlist(productId) {
  if (!productId) return false;
  const wishlist = readWishlist();
  const index = wishlist.indexOf(productId);
  const isSaved = index === -1;
  if (isSaved) wishlist.push(productId);
  else wishlist.splice(index, 1);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  updateWishlistButtons();
  showToast(isSaved ? 'Saved to wishlist' : 'Removed from wishlist', isSaved ? 'success' : 'default');
  return isSaved;
}

function updateWishlistButtons() {
  const wishlist = readWishlist();
  document.querySelectorAll('[data-wishlist-id]').forEach((button) => {
    const isSaved = wishlist.includes(button.dataset.wishlistId);
    button.classList.toggle('is-saved', isSaved);
    button.setAttribute('aria-pressed', String(isSaved));
    button.setAttribute('aria-label', isSaved ? 'Remove from wishlist' : 'Save to wishlist');
    button.textContent = isSaved ? '♥' : '♡';
  });
  const count = document.getElementById('wishlistCount');
  if (count) count.textContent = wishlist.length;
}

function initCollaborationBrand() {
  document.querySelectorAll('.brand').forEach((brand) => {
    if (brand.querySelector('.brand-partner')) return;
    const wordmark = brand.querySelector('.brand-wordmark');
    if (!wordmark) return;
    const partner = document.createElement('span');
    partner.className = 'brand-partner';
    partner.textContent = '';
    brand.insertBefore(partner, wordmark);
  });
}

function readCheckoutDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || '{}');
    return draft && typeof draft === 'object' ? draft : {};
  } catch {
    return {};
  }
}

function saveCheckoutDraft(form) {
  const fields = ['fullName', 'phone', 'email', 'address', 'city', 'state', 'pincode', 'note'];
  const draft = fields.reduce((result, field) => {
    result[field] = form[field]?.value || '';
    return result;
  }, {});
  localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
}

function clearCheckoutDraft() {
  localStorage.removeItem(CHECKOUT_DRAFT_KEY);
}

function checkPincode(pincode, resultRoot) {
  const normalized = String(pincode || '').trim();
  if (!/^[1-9][0-9]{5}$/.test(normalized)) {
    resultRoot.textContent = 'Enter a valid 6-digit Indian pincode.';
    resultRoot.className = 'pincode-result error';
    return;
  }

  const metroPrefixes = ['11', '12', '20', '40', '56', '60', '70'];
  const estimate = metroPrefixes.includes(normalized.slice(0, 2)) ? '3–5 working days' : '4–8 working days';
  resultRoot.textContent = `Delivery available · Estimated delivery in ${estimate} · COD available`;
  resultRoot.className = 'pincode-result success';
}

// ========== ANIMATION UTILITIES ==========
const animationUtils = {
  fadeInUp: (element, delay = 0) => {
    if (!element) return;
    element.style.animation = `fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`;
  },
  slideDown: (element, delay = 0) => {
    if (!element) return;
    element.style.animation = `slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s both`;
  },
  slideUp: (element, delay = 0) => {
    if (!element) return;
    element.style.animation = `slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s both`;
  },
  scaleIn: (element, delay = 0) => {
    if (!element) return;
    element.style.animation = `scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s both`;
  },
  bounce: (element) => {
    if (!element) return;
    element.style.animation = 'bounceLight 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => { element.style.animation = ''; }, 600);
  },
  pulse: (element) => {
    if (!element) return;
    element.style.animation = 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite';
  }
};

// Global function to update cart count (accessible from admin.html)
window.updateCartCount = function() {
  const cart = parseCart();
  // Find cart badge in header
  const navLinks = document.querySelectorAll('nav a, header a');
  navLinks.forEach(link => {
    if (link.href && link.href.includes('cart')) {
      const badge = link.querySelector('strong') || link.querySelector('span:last-child');
      if (badge) {
        const oldCount = parseInt(badge.textContent) || 0;
        const newCount = cart.length;
        badge.textContent = newCount;
        if (oldCount !== newCount) {
          animationUtils.bounce(badge);
        }
      }
    }
  });
};

let products = [];

function resolveAssetUrl(source) {
  if (!source) return source;
  if (String(source).startsWith('/assets/')) return String(source).slice(1);
  return source;
}

function normalizeProductImages(product) {
  const mediaFields = ['gallery', 'images', 'mockups', 'roomImages', 'packagingImages', 'sizeComparisonImages'];
  return {
    ...product,
    image: resolveAssetUrl(product.image),
    ...Object.fromEntries(mediaFields.map((field) => [
      field,
      Array.isArray(product[field]) ? product[field].map(resolveAssetUrl) : product[field]
    ]))
  };
}

// Expose products globally
window.products = products;

async function loadProducts() {
  let data;
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error(`Product catalog failed with status ${response.status}`);
    data = await response.json();
  } catch (error) {
    const localResponse = await fetch('data/products.json');
    if (!localResponse.ok) throw error;
    data = { products: await localResponse.json() };
  }
  products = Array.isArray(data.products) ? data.products.map(normalizeProductImages) : [];
  window.products = products; // Expose globally
  return products;
}

let customerReviews = [
  {
    id: 'review-001',
    name: 'Shahzaib Khan',
    location: 'Mumbai, India',
    rating: 5,
    title: 'Absolutely Premium Quality',
    review: 'The Porsche wall setup completely transformed my bedroom. The colors are vibrant, the packaging was premium, and the quality exceeded expectations. Worth every rupee!',
    wallPhoto: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=400&fit=crop',
    productBought: 'The Ultimate Porsche Wall Setup',
    verified: true
  },
  {
    id: 'review-002',
    name: 'Priya Desai',
    location: 'Bangalore, India',
    rating: 5,
    title: 'Perfect Gaming Corner Upgrade',
    review: 'My gaming setup looks incredible now with the Ultimate Fan Wall Setup. The poster quality is professional-grade. Highly recommend for anyone looking to level up their space.',
    wallPhoto: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop',
    productBought: 'Ultimate Fan Wall Setup',
    verified: true
  },
  {
    id: 'review-003',
    name: 'Arjun Patel',
    location: 'Delhi, India',
    rating: 5,
    title: 'Brilliant Design & Fast Delivery',
    review: 'Ordered the BMW M Series setup and got it delivered within 48 hours. The designs are stunning and the prints are crisp. Customer service was also very responsive.',
    wallPhoto: 'https://images.unsplash.com/photo-1565636192335-14a8ff829eb1?w=600&h=400&fit=crop',
    productBought: 'BMW M Series Wall Setup',
    verified: true
  },
  {
    id: 'review-004',
    name: 'Neha Sharma',
    location: 'Pune, India',
    rating: 5,
    title: 'Motivational Decor That Works',
    review: 'The Discipline and Greatness wall setup has been my constant motivation. Every morning I see those posters and feel inspired. Excellent value and quality.',
    wallPhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    productBought: 'Discipline and Greatness Wall Setup',
    verified: true
  },
  {
    id: 'review-005',
    name: 'Rohan Singh',
    location: 'Hyderabad, India',
    rating: 5,
    title: 'Exceeded All Expectations',
    review: 'Got the Ferrari Golden Era collection and it looks absolutely stunning on my wall. The gold accents catch the light perfectly. Premium packaging, premium product, premium experience.',
    wallPhoto: 'https://images.unsplash.com/photo-1597909409849-c80645c67d44?w=600&h=400&fit=crop',
    productBought: 'Ferrari Golden Era Combo',
    verified: true
  },
  {
    id: 'review-006',
    name: 'Anjali Verma',
    location: 'Jaipur, India',
    rating: 5,
    title: 'Customer Service was Amazing',
    review: 'Had a small issue with my order and the Pixel Perfect team resolved it immediately. The posters arrived beautifully packed and look professional on my wall. Definitely ordering again!',
    wallPhoto: 'https://images.unsplash.com/photo-1503778192313-52581002a659?w=600&h=400&fit=crop',
    productBought: 'Japanese Legends Combo',
    verified: true
  }
];

async function loadCustomerReviews() {
  try {
    const response = await fetch('/api/reviews');
    if (!response.ok) return false;
    const data = await response.json();
    if (Array.isArray(data.reviews)) customerReviews = data.reviews;
    return true;
  } catch {
    return false;
  }
}

const state = {
  category: 'all',
  collection: '',
  search: '',
  price: 'all',
  material: 'all',
  sort: 'featured'
};

const checkoutState = {
  couponCode: '',
  discount: 0,
  shipping: 0,
  paymentMethod: 'UPI'
};

const MEMBER_KEY = 'pixel-perfect-member';

function isMemberMode() {
  try {
    return localStorage.getItem(MEMBER_KEY) === 'true';
  } catch {
    return false;
  }
}

function getMemberPrice(price) {
  const base = Number(price) || 0;
  return isMemberMode() ? Math.round(base * 0.88) : base;
}

function initMemberMode() {
  document.body.classList.toggle('member-mode', isMemberMode());
}

function initCountdownTimer() {
  const countdown = document.getElementById('memberCountdown');
  if (!countdown) return;

  const deadline = Date.now() + 1000 * 60 * 60 * 26 + 1000 * 9;

  const update = () => {
    const remaining = Math.max(0, deadline - Date.now());
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    countdown.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  update();
  setInterval(update, 1000);
}

function openProductQuickView(productId) {
  const product = products.find((entry) => entry.id === productId);
  if (!product) return;

  const gallery = getProductGallery(product);
  const modalId = 'quickViewModal';
  let modal = document.getElementById(modalId);

  if (!modal) {
    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'quick-view-modal';
    modal.innerHTML = `
      <div class="quick-view-backdrop" data-close-quick-view="true"></div>
      <div class="quick-view-panel" role="dialog" aria-modal="true" aria-label="Quick product view">
        <button class="quick-view-close" type="button" aria-label="Close quick view">×</button>
        <div class="quick-view-media">
          <img src="" alt="" />
        </div>
        <div class="quick-view-copy">
          <span class="member-pill">${isMemberMode() ? 'Member price active' : 'Premium wall setup'}</span>
          <h3></h3>
          <p class="quick-view-price"></p>
          <p class="quick-view-description"></p>
          <div class="quick-view-size-wrap">
            <label for="quickViewSize">Select size</label>
            <select id="quickViewSize"></select>
          </div>
          <div class="quick-view-actions">
            <button class="primary quick-view-add" type="button">Add to cart</button>
            <button class="secondary quick-view-wishlist" type="button">Wishlist</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.quick-view-close')?.addEventListener('click', () => modal.classList.remove('open'));
    modal.querySelector('[data-close-quick-view]')?.addEventListener('click', () => modal.classList.remove('open'));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.classList.contains('open')) {
        modal.classList.remove('open');
      }
    });
  }

  const image = modal.querySelector('img');
  const title = modal.querySelector('h3');
  const price = modal.querySelector('.quick-view-price');
  const description = modal.querySelector('.quick-view-description');
  const sizeSelect = modal.querySelector('#quickViewSize');
  const addButton = modal.querySelector('.quick-view-add');
  const wishlistButton = modal.querySelector('.quick-view-wishlist');

  image.src = gallery[0];
  image.alt = product.name;
  title.textContent = product.name;
  description.textContent = getProductDescription(product);

  sizeSelect.innerHTML = product.sizes
    .map((size) => `<option value="${size.label}">${size.label} — ₹${getMemberPrice(size.price)}</option>`)
    .join('');

  const updatePrice = () => {
    const selectedSize = getSelectedSize(product, sizeSelect.value);
    const finalPrice = getMemberPrice(selectedSize.price);
    price.textContent = `₹${finalPrice}`;
  };

  sizeSelect.onchange = updatePrice;
  updatePrice();

  addButton.onclick = () => {
    addToCart(product.id, sizeSelect.value);
    modal.classList.remove('open');
  };

  wishlistButton.onclick = () => {
    toggleWishlist(product.id);
    wishlistButton.textContent = readWishlist().includes(product.id) ? 'Saved' : 'Wishlist';
  };

  modal.classList.add('open');
}

function getNumericPrice(value) {
  return Number(String(value).replace(/[^\d]/g, '')) || 0;
}

function parseCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(cart) ? cart.map((item) => ({ ...item, image: resolveAssetUrl(item.image) })) : [];
  } catch {
    return [];
  }
}

function getGuestCartSnapshotKey() {
  return 'pixel-perfect-guest-cart';
}

function saveGuestCartSnapshot(cart = parseCart()) {
  if (!Array.isArray(cart)) return [];
  localStorage.setItem(getGuestCartSnapshotKey(), JSON.stringify(cart));
  return cart;
}

function hydrateGuestCart() {
  const activeCart = parseCart();
  if (activeCart.length) {
    saveGuestCartSnapshot(activeCart);
    return activeCart;
  }

  try {
    const guestCart = JSON.parse(localStorage.getItem(getGuestCartSnapshotKey()) || '[]');
    if (Array.isArray(guestCart) && guestCart.length) {
      localStorage.setItem(CART_KEY, JSON.stringify(guestCart));
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
      return guestCart;
    }
  } catch (error) {
    console.warn('Guest cart restore failed', error);
  }

  return [];
}

function saveCart(cart) {
  const normalizedCart = Array.isArray(cart) ? cart : [];
  localStorage.setItem(CART_KEY, JSON.stringify(normalizedCart));
  saveGuestCartSnapshot(normalizedCart);
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  }
}

function getCartTotals(cart = parseCart()) {
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const bundleDiscount = calculateBundleDiscounts(cart);
  const baseShipping = subtotal >= 200 ? 0 : 50;
  const isExpress = localStorage.getItem('cart-express-shipping') === 'true';
  const expressUpcharge = isExpress ? 299 : 0;
  const addonsTotal = typeof cartAddonsModule !== 'undefined' ? cartAddonsModule.getAddonsTotal() : 0;
  const tax = 0;
  const appliedCoupon = (() => {
    try {
      return JSON.parse(localStorage.getItem('appliedCoupon') || 'null');
    } catch {
      return null;
    }
  })();
  const couponDiscount = appliedCoupon ? Math.round((subtotal - bundleDiscount) * (Number(appliedCoupon.discountPercent) || 0) / 100) : 0;
  const loyaltyDiscount = Number(localStorage.getItem('loyaltyDiscount') || 0);
  const total = Math.max(0, subtotal + baseShipping + expressUpcharge + addonsTotal - bundleDiscount - couponDiscount - loyaltyDiscount);
  const remainingForFreeShipping = Math.max(0, 200 - subtotal);

  return {
    subtotal,
    bundleDiscount,
    shipping: baseShipping,
    expressUpcharge,
    addonsTotal,
    tax,
    couponDiscount,
    loyaltyDiscount,
    total,
    remainingForFreeShipping,
    freeShippingUnlocked: baseShipping === 0
  };
}

function calculateBundleDiscounts(cart = parseCart()) {
  if (!Array.isArray(cart) || cart.length === 0) return 0;
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  let discount = 0;
  const totalQty = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  
  if (totalQty >= 10) {
    discount = Math.round(subtotal * 0.15);
  } else if (totalQty >= 5) {
    discount = Math.round(subtotal * 0.10);
  } else if (totalQty >= 3) {
    discount = Math.round(subtotal * 0.05);
  }
  return discount;
}

function getDeliveryEta(cart = parseCart()) {
  const isExpress = cart.every((item) => Number(item.stock || 1) > 2);
  const date = new Date();
  date.setDate(date.getDate() + (isExpress ? 2 : 4));
  const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
  const dateStr = date.toLocaleDateString('en-IN');
  return {
    isExpress,
    eta: `${dayName}, ${dateStr}`,
    message: isExpress ? 'Express delivery available' : 'Standard delivery'
  };
}

function getProductStockStatus(productId, quantity = 1) {
  const product = products.find((p) => p.id === productId);
  if (!product) return { status: 'unknown', message: 'Stock unavailable' };
  
  const stock = Number(product.stock || 1);
  if (stock <= 0) return { status: 'out', message: 'Out of stock', color: '#ef4444' };
  if (stock <= quantity) return { status: 'critical', message: `Only ${stock} left`, color: '#f97316' };
  if (stock <= 5) return { status: 'low', message: `${stock} in stock`, color: '#eab308' };
  return { status: 'available', message: 'In stock', color: '#22c55e' };
}

function getCartUserId() {
  return localStorage.getItem('currentUser') || localStorage.getItem('activeUserId') || 'guest';
}

function getCartBundleSuggestions() {
  const cart = parseCart();
  const currentIds = new Set(cart.map((item) => item.id));
  const allProducts = Array.isArray(window.products) && window.products.length ? window.products : [];

  if (!allProducts.length) return [];

  const candidates = allProducts.filter((product) => !currentIds.has(product.id));
  return candidates.slice(0, 3).map((product) => ({
    ...product,
    price: Number(product.sizes?.[0]?.price ?? product.price ?? 0),
    sizeLabel: product.sizes?.[0]?.label || 'A4'
  }));
}

function getSmartUpsellSuggestions(cart = parseCart()) {
  const currentIds = new Set(cart.map((item) => item.id));
  const allProducts = Array.isArray(window.products) && window.products.length ? window.products : [];

  if (!allProducts.length) return [];

  const activeCartNames = new Set(cart.map((item) => String(item.name || '').toLowerCase()));
  const eligible = allProducts.filter((product) => !currentIds.has(product.id) && !activeCartNames.has(String(product.name || '').toLowerCase()));
  return eligible.slice(0, 2).map((product) => ({
    ...product,
    price: Number(product.sizes?.[0]?.price ?? product.price ?? 0),
    sizeLabel: product.sizes?.[0]?.label || 'A4'
  }));
}

function addCartBundleSuggestion(productId, sizeLabel = 'A4') {
  if (!productId) return;
  addToCart(productId, sizeLabel);
  showToast('Bundle item added to cart', 'success');
}

function renderCartPremiumExtras() {
  const cart = parseCart();
  const root = document.getElementById('cartExtras');
  if (!root || !cart.length) return;

  const bundles = getCartBundleSuggestions();
  const upsells = getSmartUpsellSuggestions(cart);
  const userId = getCartUserId();
  const loyaltyData = typeof loyaltyModule !== 'undefined' ? loyaltyModule.getUserLoyalty(userId) : { points: 0, tier: { name: 'Bronze' } };
  const availablePoints = Number(loyaltyData.points || 0);
  const defaultRedeemPoints = Math.min(availablePoints, 200);
  const pointsValue = Math.floor(defaultRedeemPoints / 10);

  root.innerHTML = `
    <div class="cart-extra-stack">
      <div class="cart-extra-panel">
        <div class="panel-header">
          <h3>✨ Smart upsells</h3>
          <span>Recommended</span>
        </div>
        <div class="bundle-product-grid">
          ${upsells.length ? upsells.map((product) => `
            <div class="bundle-product-card">
              <img src="${product.image}" alt="${product.name}" loading="lazy" />
              <div class="bundle-copy">
                <h4>${product.name}</h4>
                <p>${product.tag || 'Premium wall art'}</p>
                <div class="bundle-meta">
                  <strong>₹${product.price}</strong>
                  <button type="button" class="bundle-add-btn" data-bundle-id="${product.id}" data-bundle-size="${product.sizeLabel}">Add</button>
                </div>
              </div>
            </div>
          `).join('') : '<p class="empty-mini-copy">Smart suggestions are shown here based on your cart.</p>'}
        </div>
      </div>

      <div class="cart-extra-panel">
        <div class="panel-header">
          <h3>✨ Bundle up and save</h3>
          <span>Popular add-ons</span>
        </div>
        <div class="bundle-product-grid">
          ${bundles.length ? bundles.map((product) => `
            <div class="bundle-product-card">
              <img src="${product.image}" alt="${product.name}" loading="lazy" />
              <div class="bundle-copy">
                <h4>${product.name}</h4>
                <p>${product.tag || 'Premium wall art'}</p>
                <div class="bundle-meta">
                  <strong>₹${product.price}</strong>
                  <button type="button" class="bundle-add-btn" data-bundle-id="${product.id}" data-bundle-size="${product.sizeLabel}">Add</button>
                </div>
              </div>
            </div>
          `).join('') : '<p class="empty-mini-copy">Bundle picks will show here once more products load.</p>'}
        </div>
      </div>

      <div class="cart-extra-panel">
        <div class="panel-header">
          <h3>🏆 Loyalty rewards</h3>
          <span>${loyaltyData.tier?.name || 'Bronze'} tier</span>
        </div>
        <div class="loyalty-redemption-box">
          <div class="loyalty-score-row">
            <span>Available points</span>
            <strong>${availablePoints}</strong>
          </div>
          <div class="loyalty-range-header">
            <span>Redeem points</span>
            <strong id="loyaltyRedeemValue">${defaultRedeemPoints}</strong>
          </div>
          <input class="loyalty-slider" type="range" min="0" max="${Math.max(availablePoints, 0)}" step="10" value="${defaultRedeemPoints}" />
          <div class="loyalty-score-row">
            <span>Potential discount</span>
            <strong>₹${Math.floor(defaultRedeemPoints / 10)}</strong>
          </div>
          <button type="button" class="primary-button cart-loyalty-button" data-loyalty-points="${defaultRedeemPoints}">
            Apply reward
          </button>
          <small>10 points = ₹1 off your order</small>
        </div>
      </div>

      <div class="cart-extra-panel whatsapp-panel">
        <div class="panel-header">
          <h3>💬 Order on WhatsApp</h3>
          <span>Fast checkout</span>
        </div>
        <p>Send your cart summary to our team and get a quick confirmation in seconds.</p>
        <a class="primary-button whatsapp-cart-btn" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Pixel Perfect, I want to order these items:\n${cart.map((item) => `- ${item.name} (${item.size}) x${item.quantity} = ₹${item.price * item.quantity}`).join('\n')}\nTotal: ₹${getCartTotals(cart).total}`).trim()}" target="_blank" rel="noreferrer">
          Order via WhatsApp
        </a>
      </div>
    </div>
  `;

  root.querySelectorAll('.bundle-add-btn').forEach((button) => {
    button.addEventListener('click', () => {
      addCartBundleSuggestion(button.dataset.bundleId, button.dataset.bundleSize || 'A4');
    });
  });

  const loyaltySlider = root.querySelector('.loyalty-slider');
  const loyaltyValueNode = root.querySelector('#loyaltyRedeemValue');
  const loyaltyButton = root.querySelector('.cart-loyalty-button');

  if (loyaltySlider && loyaltyValueNode) {
    const syncValue = () => {
      const value = Number(loyaltySlider.value || 0);
      loyaltyValueNode.textContent = String(value);
      const discount = Math.floor(value / 10);
      const discountNode = root.querySelector('.loyalty-score-row strong');
      if (discountNode) {
        discountNode.textContent = `₹${discount}`;
      }
      if (loyaltyButton) {
        loyaltyButton.dataset.loyaltyPoints = String(value);
      }
    };

    loyaltySlider.addEventListener('input', syncValue);
    syncValue();
  }

  if (loyaltyButton && typeof loyaltyModule !== 'undefined') {
    loyaltyButton.addEventListener('click', () => {
      const redeemPoints = Number(loyaltyButton.dataset.loyaltyPoints || 0);
      const discountValue = loyaltyModule.redeemPoints(userId, redeemPoints);
      if (discountValue) {
        localStorage.setItem('loyaltyDiscount', String(Number(localStorage.getItem('loyaltyDiscount') || 0) + Number(discountValue)));
        renderCartPage();
      }
    });
  }
}

function trackEvent(type, productId = '') {
  fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, productId })
  }).catch(() => {});
}

function updateCartCount() {
  const cart = parseCart();
  const total = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

  const countEls = document.querySelectorAll('#cartCount, .cart-count, [data-cart-count]');
  countEls.forEach((element) => {
    const previousValue = Number(element.textContent || 0);
    element.textContent = total;
    if (previousValue !== total) {
      animationUtils.bounce(element);
    }
  });

  const navLink = document.querySelector('a[href="cart.html"], .cart-link');
  if (navLink && !navLink.querySelector('.cart-count')) {
    const badge = document.createElement('span');
    badge.className = 'cart-count';
    badge.textContent = total;
    navLink.appendChild(badge);
  }
}

function getSelectedSize(product, sizeLabel) {
  return product.sizes.find((size) => size.label === sizeLabel) || product.sizes[0];
}

function addToCart(productId, sizeLabel) {
  const cart = parseCart();
  const product = products.find((entry) => entry.id === productId);

  if (!product) return;

  const selectedSize = getSelectedSize(product, sizeLabel);
  const cartKey = `${product.id}-${selectedSize.label}`;
  const existing = cart.find((item) => item.cartKey === cartKey);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      cartKey,
      id: product.id,
      name: product.name,
      image: product.image,
      price: selectedSize.price,
      size: selectedSize.label,
      quantity: 1
    });
  }

  saveCart(cart);
  trackEvent('add_to_cart', productId);
  updateCartCount();
  showToast(`${product.name} added to cart`, 'success');
  window.location.href = 'cart.html';
}

function currency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

function getProductDisplayPrice(product) {
  return product?.sizes?.[0]?.price ?? product?.price ?? 0;
}

function getProductAvailability(product) {
  const stock = Number(product?.stock);
  if (Number.isFinite(stock) && stock <= 0) return 'Currently unavailable';
  if (Number.isFinite(stock) && stock <= 5) return `Only ${stock} left`;
  return 'In stock · Dispatches in 24–48 hours';
}

function buildDemoVisual(label, accent = '#111111', background = '#efe4d2') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="100%" stop-color="#f8f4ee" />
        </linearGradient>
      </defs>
      <rect width="900" height="1100" fill="url(#bg)" />
      <rect x="110" y="120" width="680" height="820" rx="32" fill="${accent}" opacity="0.9"/>
      <rect x="148" y="160" width="604" height="740" rx="24" fill="#f6f0ea" opacity="0.82"/>
      <circle cx="450" cy="380" r="120" fill="#d8b57b" opacity="0.8"/>
      <path d="M310 560 L450 420 L590 560 L450 720 Z" fill="${accent}" opacity="0.7"/>
      <text x="450" y="860" text-anchor="middle" fill="${accent}" font-size="54" font-family="Segoe UI, Arial, sans-serif" font-weight="700" letter-spacing="5">DEMO</text>
      <text x="450" y="930" text-anchor="middle" fill="${accent}" font-size="30" font-family="Segoe UI, Arial, sans-serif" font-weight="600" letter-spacing="2">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizeVisualSet(product, fieldName, fallbackLabel, fallbackAccent, fallbackBackground) {
  const items = Array.isArray(product?.[fieldName]) ? product[fieldName].filter(Boolean) : [];
  if (items.length) {
    return items;
  }

  const fallback = product?.image || buildDemoVisual(fallbackLabel, fallbackAccent, fallbackBackground);
  return [fallback];
}

function getProductGallery(product) {
  const main = product?.image || buildDemoVisual(`${product?.name || 'Product'} preview`, '#111111', '#efe4d2');
  const catalogGallery = Array.isArray(product?.gallery) ? product.gallery : [];
  const images = normalizeVisualSet(product, 'images', `${product?.name || 'Product'} detail`, '#111111', '#efe4d2');
  const mockups = normalizeVisualSet(product, 'mockups', `${product?.name || 'Product'} wall mockup`, '#1d1d1d', '#e7d9b6');
  const roomImages = normalizeVisualSet(product, 'roomImages', `${product?.name || 'Product'} room setup`, '#171717', '#dfe7f4');
  const packagingImages = Array.isArray(product?.packagingImages) ? product.packagingImages : [];
  const sizeComparisonImages = Array.isArray(product?.sizeComparisonImages) ? product.sizeComparisonImages : [];

  const normalized = [...new Set([main, ...catalogGallery, ...images, ...mockups, ...roomImages, ...packagingImages, ...sizeComparisonImages].filter(Boolean))];
  return normalized.length ? normalized : [main];
}

function renderCardGallery(product) {
  const gallery = getProductGallery(product).slice(0, 5);
  return `
    <div class="card-image-container card-gallery" data-card-gallery>
      <img class="card-gallery-main" src="${gallery[0]}" alt="${product.name}" loading="lazy" />
      <span class="card-tag">${product.tag || 'Featured'}</span>
      ${gallery.length > 1 ? `
        <div class="card-gallery-strip" aria-label="More images for ${product.name}">
          ${gallery.map((image, index) => `
            <button class="card-gallery-thumb ${index === 0 ? 'active' : ''}" type="button" data-gallery-image="${image}" aria-label="View image ${index + 1}">
              <img src="${image}" alt="" loading="lazy" />
            </button>
          `).join('')}
        </div>
        <span class="card-gallery-count">${gallery.length} views</span>
      ` : ''}
    </div>
  `;
}

function initCardGalleries(root = document) {
  root.querySelectorAll('[data-card-gallery]').forEach((gallery) => {
    const mainImage = gallery.querySelector('.card-gallery-main');
    gallery.querySelectorAll('.card-gallery-thumb').forEach((button) => {
      button.addEventListener('click', () => {
        if (!mainImage) return;
        mainImage.src = button.dataset.galleryImage;
        gallery.querySelectorAll('.card-gallery-thumb').forEach((thumb) => thumb.classList.toggle('active', thumb === button));
      });
    });
  });
}

function getProductRoomCategories() {
  return ['Gaming Room', 'Bedroom', 'Study Room', 'Living Room', 'Car Room'];
}

function getProductRoomPreview(product) {
  const roomImages = [...new Set([
    ...(Array.isArray(product?.gallery) ? product.gallery : []),
    ...normalizeVisualSet(product, 'roomImages', `${product?.name || 'Product'} room setup`, '#171717', '#dfe7f4')
  ])];
  const categories = getProductRoomCategories();

  return categories.map((category, index) => ({
    category,
    image: roomImages[index] || roomImages[0] || product?.image || buildDemoVisual(`${category} demo`, '#171717', '#dfe7f4'),
    label: `${category} demo`
  }));
}

function getProductBadge(product) {
  return product?.badge || product?.tag || 'Best seller';
}

function getProductDescription(product) {
  return product?.description || 'Premium quality wall poster designed for clean, bold room styling. Choose your preferred size and add it to your cart.';
}

function getProductTrustBadges(product) {
  return product?.trustBadges || [
    'Premium quality',
    'Secure packaging',
    'COD available',
    'UPI available',
    'Fast delivery'
  ];
}

function getProductIncludes(product) {
  return product?.includes || [
    'Poster pack in the selected size',
    'Premium print finish',
    'Secure protective packaging',
    'Easy WhatsApp support'
  ];
}

function getProductWallStyles(product) {
  return product?.wallStyles || [
    'Bedroom statement wall',
    'Gaming room setup',
    'Car garage wall',
    'Motivational workspace'
  ];
}

function getProductFaqs(product) {
  return product?.faqs || [
    {
      question: 'How long does delivery take?',
      answer: 'Most orders are dispatched within 24 to 48 hours and delivered across India in a few working days depending on the location.'
    },
    {
      question: 'What payment methods are available?',
      answer: 'You can order via UPI, cash on delivery, or WhatsApp support for quick confirmation.'
    },
    {
      question: 'Will the poster fit my wall?',
      answer: 'Each size is listed with dimensions, and the product is designed to look premium on bedrooms, garages, gaming rooms, and workspaces.'
    }
  ];
}

function getProductReviews(product) {
  if (Array.isArray(product?.reviews)) return product.reviews;
  const productName = String(product?.name || '').toLowerCase();
  return customerReviews
    .filter(isVerifiedPurchaseReview)
    .filter((review) => !productName || String(review.productBought || '').toLowerCase().includes(productName) || review.category === product?.category)
    .map((review) => ({
      ...review,
      stars: Number(review.rating || review.stars || 0)
    }));
}

function isVerifiedPurchaseReview(review) {
  return review?.verified === true && Boolean(review?.verifiedOrderId);
}

function getProductDiscount(product, selectedSizePrice) {
  const basePrice = Number(product?.regularPrice || selectedSizePrice || 0);
  const salePrice = Number(selectedSizePrice || getProductDisplayPrice(product) || 0);
  if (!basePrice || basePrice <= salePrice) {
    return 0;
  }

  return Math.round(((basePrice - salePrice) / basePrice) * 100);
}

function getProductSizeText(label) {
  const sizeMap = {
    A5: '14.8 × 21 cm',
    A4: '21 × 29.7 cm',
    A3: '29.7 × 42 cm',
    '13x19': '33 × 48 cm',
    '13 × 19': '33 × 48 cm'
  };

  return sizeMap[label] || 'Custom poster size';
}

function getProductSizeOptions(product) {
  return product?.sizes?.filter((size) => size && size.label) || [];
}

function readRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem('pixel-perfect-recently-viewed') || '[]');
  } catch {
    return [];
  }
}

function writeRecentlyViewed(productId) {
  if (!productId) return;
  const seen = readRecentlyViewed();
  const next = [productId, ...seen.filter((id) => id !== productId)].slice(0, 4);
  localStorage.setItem('pixel-perfect-recently-viewed', JSON.stringify(next));
}

function buyNow(productId, sizeLabel) {
  addToCart(productId, sizeLabel);
  window.location.href = 'checkout.html';
}

function filterAndSort(list) {
  let filtered = [...list];

  if (state.collection) {
    filtered = filtered.filter((item) => item.collection === state.collection);
  }

  if (state.category !== 'all') {
    filtered = filtered.filter((item) => item.category === state.category);
  }

  if (state.search) {
    filtered = filtered.filter((item) => `${item.name} ${item.description || ''} ${item.category || ''} ${item.material || ''}`.toLowerCase().includes(state.search));
  }

  if (state.material !== 'all') {
    filtered = filtered.filter((item) => String(item.material || '').toLowerCase() === state.material);
  }

  if (state.price !== 'all') {
    const itemPrice = (item) => getProductDisplayPrice(item);
    if (state.price === 'under-200') {
      filtered = filtered.filter((item) => itemPrice(item) < 200);
    } else if (state.price === '200-399') {
      filtered = filtered.filter((item) => itemPrice(item) >= 200 && itemPrice(item) <= 399);
    } else if (state.price === '400-plus') {
      filtered = filtered.filter((item) => itemPrice(item) >= 400);
    }
  }

  if (state.sort === 'low-to-high') {
    filtered.sort((a, b) => getProductDisplayPrice(a) - getProductDisplayPrice(b));
  } else if (state.sort === 'high-to-low') {
    filtered.sort((a, b) => getProductDisplayPrice(b) - getProductDisplayPrice(a));
  } else if (state.sort === 'newest') {
    filtered.sort((a, b) => b.newest - a.newest);
  } else if (state.sort === 'rating') {
    filtered.sort((a, b) => Number(b.rating || b.reviews?.rating || 0) - Number(a.rating || a.reviews?.rating || 0));
  } else if (state.sort === 'popular') {
    filtered.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || Number(b.reviewCount || b.reviews?.count || 0) - Number(a.reviewCount || a.reviews?.count || 0));
  }

  return filtered;
}

function getCategoryOptions() {
  return [
    { label: 'All', value: 'all' },
    { label: 'Cars', value: 'cars' },
    { label: 'Bikes', value: 'bikes' },
    { label: 'Gaming', value: 'gaming' },
    { label: 'Motivation', value: 'motivation' },
    { label: 'Football', value: 'football' }
  ];
}

function initCategoryChips() {
  const categoryChips = document.getElementById('categoryChips');
  if (!categoryChips) return;

  categoryChips.innerHTML = getCategoryOptions()
    .map(
      (chip) => `
        <button class="chip ${state.category === chip.value ? 'active' : ''}" data-category="${chip.value}" type="button">
          ${chip.label}
        </button>
      `
    )
    .join('');

  categoryChips.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.category = chip.dataset.category;
      initCategoryChips();
      renderCatalog();
    });
  });
}

function initControls() {
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const priceFilter = document.getElementById('priceFilter');
  const materialFilter = document.getElementById('materialFilter');
  const suggestions = document.getElementById('searchSuggestions');

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      state.search = event.target.value.trim().toLowerCase();
      if (suggestions) {
        const matches = products.filter((product) => product.name.toLowerCase().includes(state.search)).slice(0, 5);
        suggestions.innerHTML = matches.map((product) => `<option value="${product.name.replace(/"/g, '&quot;')}"></option>`).join('');
      }
      renderCatalog();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (event) => {
      state.sort = event.target.value;
      renderCatalog();
    });
  }

  if (priceFilter) {
    priceFilter.addEventListener('change', (event) => {
      state.price = event.target.value;
      renderCatalog();
    });
  }

  if (materialFilter) {
    materialFilter.addEventListener('change', (event) => {
      state.material = event.target.value;
      renderCatalog();
    });
  }
}

function renderCatalog() {
  const productGrid = document.getElementById('productGrid');
  const resultCount = document.getElementById('resultCount');

  if (!productGrid) return;

  const visible = filterAndSort(products);

  if (resultCount) {
    resultCount.textContent = `${visible.length} product${visible.length === 1 ? '' : 's'}`;
  }

  if (!visible.length) {
    productGrid.innerHTML = `
      <div class="empty">
        <h3>No posters found</h3>
        <p>Try another category, price range, or keyword.</p>
      </div>
    `;
    return;
  }

  productGrid.innerHTML = visible
    .map((product, idx) => {
      const defaultSize = product.sizes[0];
      const productReviews = getProductReviews(product);
      const rating = Number(product.rating || product.reviews?.rating || 0);
      const reviewCount = Number(product.reviewCount || product.reviews?.count || productReviews.length || 0);
      const reviewLabel = reviewCount ? `(${reviewCount})` : 'No reviews yet';
      const defaultPrice = getMemberPrice(Number(defaultSize.price));
      return `
        <article class="card reveal product-card page-transition-enter" style="animation-delay: ${idx * 0.05}s;">
          ${renderCardGallery(product)}
          <div class="card-image-overlay-content">
            ${isMemberMode() ? '<span class="member-tag">Member -12%</span>' : ''}
            <button class="wishlist-button" type="button" data-wishlist-id="${product.id}" aria-pressed="false" aria-label="Save to wishlist">♡</button>
          </div>
          <div class="card-body">
            <div class="card-rating">
              <span class="stars">${'★'.repeat(Math.floor(rating))}${rating % 1 >= 0.5 ? '★' : ''}</span>
              <span class="rating-text">${rating.toFixed(1)}</span>
              <span class="review-count">${reviewLabel}</span>
            </div>
            <h3>${product.name}</h3>
            <div class="meta">
              <span class="price">₹${defaultPrice}</span>
              <span class="price-note">starting price</span>
            </div>
            <p class="product-availability">${getProductAvailability(product)}</p>
            <div class="product-card-specs">
              <span>${product.material || 'Premium print'}</span>
              <span>${product.sizes.length} sizes</span>
            </div>
            <div class="size-row">
              <label for="size-${product.id}">Size</label>
              <select class="size-select" id="size-${product.id}" data-product-id="${product.id}">
                ${product.sizes
                  .map(
                    (size) => `<option value="${size.label}" ${size.label === defaultSize.label ? 'selected' : ''}>${size.label} - ₹${getMemberPrice(Number(size.price))}</option>`
                  )
                  .join('')}
              </select>
            </div>
            <div class="card-actions">
              <button class="secondary quick-view-button" type="button" data-quick-view-id="${product.id}">Quick view</button>
              <button class="primary add-button" type="button" data-product-id="${product.id}">Add</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  productGrid.querySelectorAll('.quick-view-button').forEach((button) => {
    button.addEventListener('click', () => openProductQuickView(button.dataset.quickViewId));
  });

  productGrid.querySelectorAll('.add-button').forEach((button) => {
    const productId = button.dataset.productId;
    const sizeSelect = productGrid.querySelector(`#size-${productId}`);
    button.addEventListener('click', () => {
      animationUtils.bounce(button);
      addToCart(productId, sizeSelect?.value || 'A5');
    });
  });

  productGrid.querySelectorAll('.wishlist-button').forEach((button) => {
    button.addEventListener('click', () => toggleWishlist(button.dataset.wishlistId));
  });

  initCardGalleries(productGrid);
  updateWishlistButtons();
  initRevealAnimation();
}

function renderReferenceCollection() {
  const collectionRoot = document.getElementById('referenceCollectionGrid');
  if (!collectionRoot) return;

  const collectionIds = [
    'the-ultimate-porsche-wall-setup',
    'dream-garage-wall-collection',
    'discipline-and-greatness-wall-setup-combo',
    'dharma-destiny-wall-pack',
    'ultimate-fan-wall-setup',
    'skyline-legacy-wall-set'
  ];
  const featuredProducts = collectionIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean);

  collectionRoot.innerHTML = featuredProducts
    .map((product, index) => {
      const defaultSize = getProductSizeOptions(product)[0];
      const reviewCount = product.reviewCount || 0;
      const rating = product.rating || 4.8;
      return `
        <article class="card reveal" style="animation-delay: ${index * 0.06}s;">
          ${renderCardGallery(product)}
          <div class="card-body">
            <div class="card-rating">
              <span class="stars">★★★★★</span>
              <span class="rating-text">${rating.toFixed(1)}</span>
              <span class="review-count">(${reviewCount})</span>
            </div>
            <h3>${product.name}</h3>
            <div class="meta"><span class="price">₹${defaultSize?.price || getProductDisplayPrice(product)}</span></div>
            <p class="product-availability">${getProductAvailability(product)}</p>
            <div class="card-actions">
              <a class="secondary button-link" href="product.html?id=${product.id}">View</a>
              <button class="primary add-button" type="button" data-product-id="${product.id}">Add</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  collectionRoot.querySelectorAll('.add-button').forEach((button) => {
    const productId = button.dataset.productId;
    const sizeSelect = collectionRoot.querySelector(`#size-${productId}-referenceCollectionGrid`);
    button.addEventListener('click', () => {
      animationUtils.bounce(button);
      addToCart(productId, sizeSelect?.value || 'A4');
    });
  });
  initCardGalleries(collectionRoot);
  initRevealAnimation();
}

function renderCarCollection() {
  const collectionRoot = document.getElementById('carCollectionGrid');
  if (!collectionRoot) return;

  const carProducts = products
    .filter((product) => product.category === 'cars' && !/sticker|decal/i.test(product.name))
    .filter((product) => /porsche|mustang|bmw|nissan|ferrari|skyline|mercedes|lamborghini|supra|gt3|m4|911|gtr|honda|civic|defender|audi|mclaren|aston martin|jdm|amg|formula 1/i.test(product.name))
    .slice(0, 6);

  if (!carProducts.length) return;

  collectionRoot.innerHTML = carProducts
    .map((product, index) => {
      const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : [{ label: 'A4', price: getProductDisplayPrice(product) }];
      const defaultSize = sizes[0];
      return `
        <article class="card reveal product-card car-editorial-card ${index === 0 ? 'car-editorial-card--hero' : ''}" style="animation-delay: ${index * 0.06}s;">
          ${renderCardGallery(product)}
          <div class="card-body">
            <div class="card-rating">
              <span class="stars">★★★★★</span>
              <span class="rating-text">${Number(product.rating || product.reviews?.rating || 4.8).toFixed(1)}</span>
            </div>
            <h3>${product.name}</h3>
            <div class="meta">
              <span class="price">₹${getMemberPrice(Number(defaultSize.price || getProductDisplayPrice(product)))}</span>
            </div>
            <p class="product-availability">${getProductAvailability(product)}</p>
            <div class="size-row">
              <label for="size-${product.id}-carCollectionGrid">Size</label>
              <select class="size-select" id="size-${product.id}-carCollectionGrid" data-product-id="${product.id}">
                ${sizes
                  .map(
                    (size) => `<option value="${size.label}" ${size.label === defaultSize.label ? 'selected' : ''}>${size.label} - ₹${getMemberPrice(Number(size.price || getProductDisplayPrice(product)))}</option>`
                  )
                  .join('')}
              </select>
            </div>
            <div class="card-actions">
              <a class="secondary button-link" href="product.html?id=${product.id}">View</a>
              <button class="primary add-button" type="button" data-product-id="${product.id}">Add</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  collectionRoot.querySelectorAll('.add-button').forEach((button) => {
    const productId = button.dataset.productId;
    const sizeSelect = collectionRoot.querySelector(`#size-${productId}-carCollectionGrid`);
    button.addEventListener('click', () => {
      animationUtils.bounce(button);
      addToCart(productId, sizeSelect?.value || 'A4');
    });
  });

  initCardGalleries(collectionRoot);
  initRevealAnimation();
}

function renderMarvelCollection() {
  const collectionRoot = document.getElementById('marvelCollectionGrid');
  if (!collectionRoot) return;

  const marvelProducts = products.filter((product) => product.category === 'marvel').slice(0, 6);
  collectionRoot.innerHTML = marvelProducts
    .map((product, index) => {
      const defaultSize = getProductSizeOptions(product)[0];
      return `
        <article class="card reveal" style="animation-delay: ${index * 0.06}s;">
          ${renderCardGallery(product)}
          <div class="card-body">
            <div class="card-rating"><span class="stars">★★★★★</span><span class="rating-text">4.8</span></div>
            <h3>${product.name}</h3>
            <div class="meta"><span class="price">₹${getMemberPrice(Number(defaultSize?.price || getProductDisplayPrice(product)))}</span></div>
            <p class="product-availability">${getProductAvailability(product)}</p>
            <div class="size-row">
              <label for="size-${product.id}-marvelCollectionGrid">Size</label>
              <select class="size-select" id="size-${product.id}-marvelCollectionGrid" data-product-id="${product.id}">
                ${getProductSizeOptions(product)
                  .map((size) => `<option value="${size.label}" ${size.label === defaultSize?.label ? 'selected' : ''}>${size.label} - ₹${getMemberPrice(Number(size.price))}</option>`)
                  .join('')}
              </select>
            </div>
            <div class="card-actions">
              <a class="secondary button-link" href="product.html?id=${product.id}">View</a>
              <button class="primary add-button" type="button" data-product-id="${product.id}">Add</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  collectionRoot.querySelectorAll('.add-button').forEach((button) => {
    const productId = button.dataset.productId;
    const sizeSelect = collectionRoot.querySelector(`#size-${productId}-marvelCollectionGrid`);
    button.addEventListener('click', () => {
      animationUtils.bounce(button);
      addToCart(productId, sizeSelect?.value || 'A4');
    });
  });
  initCardGalleries(collectionRoot);
  initRevealAnimation();
}

function renderDCCollection() {
  const collectionRoot = document.getElementById('dcCollectionGrid');
  if (!collectionRoot) return;

  const dcProducts = products.filter((product) => product.category === 'dc').slice(0, 6);
  collectionRoot.innerHTML = dcProducts
    .map((product, index) => {
      const defaultSize = getProductSizeOptions(product)[0];
      return `
        <article class="card reveal" style="animation-delay: ${index * 0.06}s;">
          ${renderCardGallery(product)}
          <div class="card-body">
            <div class="card-rating"><span class="stars">★★★★★</span><span class="rating-text">4.8</span></div>
            <h3>${product.name}</h3>
            <div class="meta"><span class="price">₹${getMemberPrice(Number(defaultSize?.price || getProductDisplayPrice(product)))}</span></div>
            <p class="product-availability">${getProductAvailability(product)}</p>
            <div class="size-row">
              <label for="size-${product.id}-dcCollectionGrid">Size</label>
              <select class="size-select" id="size-${product.id}-dcCollectionGrid" data-product-id="${product.id}">
                ${getProductSizeOptions(product)
                  .map((size) => `<option value="${size.label}" ${size.label === defaultSize?.label ? 'selected' : ''}>${size.label} - ₹${getMemberPrice(Number(size.price))}</option>`)
                  .join('')}
              </select>
            </div>
            <div class="card-actions">
              <a class="secondary button-link" href="product.html?id=${product.id}">View</a>
              <button class="primary add-button" type="button" data-product-id="${product.id}">Add</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  collectionRoot.querySelectorAll('.add-button').forEach((button) => {
    const productId = button.dataset.productId;
    const sizeSelect = collectionRoot.querySelector(`#size-${productId}-dcCollectionGrid`);
    button.addEventListener('click', () => {
      animationUtils.bounce(button);
      addToCart(productId, sizeSelect?.value || 'A4');
    });
  });
  initCardGalleries(collectionRoot);
  initRevealAnimation();
}

function renderFootballCollection() {
  const collectionRoot = document.getElementById('footballCollectionGrid');
  if (!collectionRoot) return;

  const footballProducts = products.filter((product) => product.category === 'football').slice(0, 6);
  collectionRoot.innerHTML = footballProducts
    .map((product, index) => {
      const defaultSize = getProductSizeOptions(product)[0];
      return `
        <article class="card reveal" style="animation-delay: ${index * 0.06}s;">
          ${renderCardGallery(product)}
          <div class="card-body">
            <div class="card-rating"><span class="stars">★★★★★</span><span class="rating-text">4.8</span></div>
            <h3>${product.name}</h3>
            <div class="meta"><span class="price">₹${getMemberPrice(Number(defaultSize?.price || getProductDisplayPrice(product)))}</span></div>
            <p class="product-availability">${getProductAvailability(product)}</p>
            <div class="size-row">
              <label for="size-${product.id}-footballCollectionGrid">Size</label>
              <select class="size-select" id="size-${product.id}-footballCollectionGrid" data-product-id="${product.id}">
                ${getProductSizeOptions(product)
                  .map((size) => `<option value="${size.label}" ${size.label === defaultSize?.label ? 'selected' : ''}>${size.label} - ₹${getMemberPrice(Number(size.price))}</option>`)
                  .join('')}
              </select>
            </div>
            <div class="card-actions">
              <a class="secondary button-link" href="product.html?id=${product.id}">View</a>
              <button class="primary add-button" type="button" data-product-id="${product.id}">Add</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  collectionRoot.querySelectorAll('.add-button').forEach((button) => {
    const productId = button.dataset.productId;
    const sizeSelect = collectionRoot.querySelector(`#size-${productId}-footballCollectionGrid`);
    button.addEventListener('click', () => {
      animationUtils.bounce(button);
      addToCart(productId, sizeSelect?.value || 'A4');
    });
  });
  initCardGalleries(collectionRoot);
  initRevealAnimation();
}

function renderCricketCollection() {
  const collectionRoot = document.getElementById('cricketCollectionGrid');
  if (!collectionRoot) return;

  const cricketProducts = products.filter((product) => product.category === 'cricket');
  collectionRoot.innerHTML = cricketProducts
    .map((product, index) => {
      const defaultSize = getProductSizeOptions(product)[0];
      return `
        <article class="card reveal" style="animation-delay: ${index * 0.04}s;">
          ${renderCardGallery(product)}
          <div class="card-body">
            <div class="card-rating"><span class="stars">★★★★★</span><span class="rating-text">4.8</span></div>
            <h3>${product.name}</h3>
            <div class="meta"><span class="price">₹${getMemberPrice(Number(defaultSize?.price || getProductDisplayPrice(product)))}</span></div>
            <p class="product-availability">${getProductAvailability(product)}</p>
            <div class="size-row">
              <label for="size-${product.id}-cricketCollectionGrid">Size</label>
              <select class="size-select" id="size-${product.id}-cricketCollectionGrid" data-product-id="${product.id}">
                ${getProductSizeOptions(product)
                  .map((size) => `<option value="${size.label}" ${size.label === defaultSize?.label ? 'selected' : ''}>${size.label} - ₹${getMemberPrice(Number(size.price))}</option>`)
                  .join('')}
              </select>
            </div>
            <div class="card-actions">
              <a class="secondary button-link" href="product.html?id=${product.id}">View</a>
              <button class="primary add-button" type="button" data-product-id="${product.id}">Add</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  collectionRoot.querySelectorAll('.add-button').forEach((button) => {
    const productId = button.dataset.productId;
    const sizeSelect = collectionRoot.querySelector(`#size-${productId}-cricketCollectionGrid`);
    button.addEventListener('click', () => {
      animationUtils.bounce(button);
      addToCart(productId, sizeSelect?.value || 'A4');
    });
  });
  initRevealAnimation();
}

function renderCategoryPage() {
  const title = document.getElementById('categoryTitle');
  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get('category');
  state.collection = params.get('collection') || '';

  if (categoryParam) {
    state.category = categoryParam;
  }

  if (title) {
    const currentLabel = state.collection || getCategoryOptions().find((option) => option.value === state.category)?.label || 'All';
    title.textContent = currentLabel === 'All' ? 'All Posters' : `${currentLabel} Posters`;
  }
  const racingNote = document.getElementById('racingCollectionNote');
  if (racingNote) racingNote.style.display = state.collection === 'Cars, Bikes & Racing' ? 'block' : 'none';

  initCategoryChips();
  initControls();
  renderCatalog();
  
  // Enhance category page animations
  const grid = document.getElementById('productGrid');
  const hero = document.querySelector('[role="region"]');
  const filters = document.querySelector('.filter-controls');
  
  if (hero) hero.classList.add('category-hero');
  if (filters) filters.classList.add('filter-controls');
  if (grid) {
    grid.classList.add('product-grid');
    // Trigger staggered card animations
    setTimeout(() => {
      grid.querySelectorAll('.product-card').forEach((card, idx) => {
        card.style.animationDelay = `${idx * 0.05}s`;
      });
    }, 100);
  }
  
  initRevealAnimation();
}

function renderCartPage() {
  const cartRoot = document.getElementById('cartItems');
  if (!cartRoot) return;

  const cart = parseCart();
  if (!cart.length) {
    cartRoot.innerHTML = `
      <div class="empty-cart reveal">
        <div class="empty-cart-illustration">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Start by shopping our premium poster collections and build your wall story.</p>
        <a class="primary-button" href="index.html">Shop now</a>
      </div>
    `;
    animationUtils.slideUp(cartRoot.querySelector('.empty-cart'));

    const summaryRoot = document.getElementById('cartSummary');
    if (summaryRoot) {
      summaryRoot.innerHTML = `
        <div class="summary-card reveal">
          <h3>Cart is waiting</h3>
          <div class="summary-row"><span>Subtotal</span><strong>₹0</strong></div>
          <div class="summary-row"><span>Shipping</span><strong>₹0</strong></div>
          <div class="summary-row total"><span>Total</span><strong>₹0</strong></div>
          <a class="primary-button checkout-button" href="index.html">Continue shopping</a>
        </div>
      `;
    }

    const mobileBar = document.getElementById('mobileCheckoutBar');
    if (mobileBar) mobileBar.remove();
    return;
  }

  const totals = getCartTotals(cart);

  cartRoot.innerHTML = cart
    .map(
      (item, idx) => {
        const stockStatus = getProductStockStatus(item.id, item.quantity);
        return `
        <div class="cart-item reveal" style="animation-delay: ${idx * 0.08}s;">
          <img src="${item.image}" alt="${item.name}" loading="lazy" />
          <div class="cart-item-copy">
            <h3>${item.name}</h3>
            <p>${item.size || 'Standard size'} • ${currency(item.price)} each</p>
            ${stockStatus.status !== 'available' ? `<div class="stock-warning" style="color: ${stockStatus.color};">${stockStatus.message}</div>` : ''}
            <div class="qty-box">
              <button class="qty-btn" data-action="decrease" data-id="${item.id}" data-size="${item.size || 'A4'}" type="button" aria-label="Decrease quantity">−</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" data-action="increase" data-id="${item.id}" data-size="${item.size || 'A4'}" type="button" aria-label="Increase quantity">+</button>
            </div>
            <button class="remove-cart-item" type="button" data-remove-id="${item.id}" data-remove-size="${item.size || 'A4'}">Remove</button>
          </div>
          <div class="cart-item-total-wrap">
            <div class="cart-item-total">${currency(item.price * item.quantity)}</div>
          </div>
        </div>
      `;
      }
    )
    .join('');

  const summaryRoot = document.getElementById('cartSummary');
  if (summaryRoot) {
    const freeShippingProgress = Math.min((totals.subtotal / 200) * 100, 100);
    const eta = getDeliveryEta(cart);
    summaryRoot.innerHTML = `
      <div class="summary-card reveal">
        <h3>Order Summary</h3>
        <div class="eta-badge" style="background: ${eta.isExpress ? '#dbeafe' : '#fef3c7'};">
          <span>📦 ${eta.message}</span>
          <strong>${eta.eta}</strong>
        </div>
        <div class="shipping-progress-wrap">
          <div class="shipping-progress-label">
            <span>${totals.freeShippingUnlocked ? 'Free shipping unlocked' : `Add ${currency(totals.remainingForFreeShipping)} for free shipping`}</span>
          </div>
          <div class="shipping-progress-bar">
            <span style="width:${freeShippingProgress}%"></span>
          </div>
        </div>
        <div class="summary-row"><span>Subtotal</span><strong>${currency(totals.subtotal)}</strong></div>
        ${totals.bundleDiscount > 0 ? `<div class="summary-row discount-row"><span>Bundle saving</span><strong>-${currency(totals.bundleDiscount)}</strong></div>` : ''}
        <div class="summary-row"><span>Shipping</span><strong>${totals.shipping === 0 ? 'Free' : currency(totals.shipping)}</strong></div>
        ${totals.expressUpcharge > 0 ? `<div class="summary-row"><span>Express upcharge</span><strong>+${currency(totals.expressUpcharge)}</strong></div>` : ''}
        ${totals.addonsTotal > 0 ? `<div class="summary-row"><span>Add-ons</span><strong>+${currency(totals.addonsTotal)}</strong></div>` : ''}
        ${totals.couponDiscount > 0 ? `<div class="summary-row discount-row"><span>Coupon</span><strong>-${currency(totals.couponDiscount)}</strong></div>` : ''}
        ${totals.loyaltyDiscount > 0 ? `<div class="summary-row discount-row"><span>Loyalty</span><strong>-${currency(totals.loyaltyDiscount)}</strong></div>` : ''}
        <div class="summary-row total"><span>Total</span><strong>${currency(totals.total)}</strong></div>
        <button class="primary-button checkout-button" type="button" onclick="window.location.href='checkout.html'">Proceed to checkout</button>
        <a class="secondary-button whatsapp-cart-btn" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Pixel Perfect, I want to buy these items:\n${cart.map((item) => `- ${item.name} (${item.size}) x${item.quantity} = ₹${item.price * item.quantity}`).join('\n')}\nTotal: ₹${totals.total}`).trim()}" target="_blank" rel="noreferrer">WhatsApp checkout</a>
        <div class="cart-summary-actions">
          <button class="action-button" type="button" onclick="enhancedCartModule.saveCartForLater()">Save cart</button>
          <button class="action-button" type="button" onclick="enhancedCartModule.showSavedCarts()">Saved</button>
          <button class="action-button" type="button" onclick="enhancedCartModule.shareCart()">Share</button>
        </div>
      </div>
    `;
    animationUtils.slideUp(summaryRoot.querySelector('.summary-card'), 0.2);
  }

  const extrasRoot = document.getElementById('cartExtras');
  if (extrasRoot) {
    renderCartPremiumExtras();
  }

  const addonsRoot = document.getElementById('cartAddons');
  if (addonsRoot && typeof cartAddonsModule !== 'undefined') {
    addonsRoot.innerHTML = '';
    if (document.getElementById('shippingOptionsPanel')) {
      cartAddonsModule.renderShippingOptions();
    }
    if (document.getElementById('giftOptionsPanel')) {
      cartAddonsModule.renderGiftOptions();
    }
    if (document.getElementById('paymentMethodsPanel')) {
      cartAddonsModule.renderPaymentMethods();
    }
    if (document.getElementById('discountShowcasePanel')) {
      cartAddonsModule.renderDiscountShowcase();
    }
    if (document.getElementById('cartReviewsPanel')) {
      cartAddonsModule.renderCartReviews();
    }
  }

  const mobileBar = document.getElementById('mobileCheckoutBar');
  if (mobileBar) {
    mobileBar.innerHTML = `<strong>${currency(totals.total)}</strong><a class="primary-button small" href="checkout.html">Checkout</a>`;
  } else {
    const newBar = document.createElement('div');
    newBar.id = 'mobileCheckoutBar';
    newBar.className = 'mobile-checkout-bar';
    newBar.innerHTML = `<strong>${currency(totals.total)}</strong><a class="primary-button small" href="checkout.html">Checkout</a>`;
    document.body.appendChild(newBar);
  }

  cartRoot.querySelectorAll('.qty-btn').forEach((button) => {
    button.addEventListener('click', () => {
      animationUtils.bounce(button);
      updateCartQuantity(button.dataset.id, button.dataset.action, button.dataset.size || 'A4');
    });
  });

  cartRoot.querySelectorAll('.remove-cart-item').forEach((button) => {
    button.addEventListener('click', () => {
      removeCartItem(button.dataset.removeId, button.dataset.removeSize || 'A4');
    });
  });

  initRevealAnimation();
}

function renderWishlistPage() {
  const root = document.getElementById('wishlistItems');
  if (!root) return;

  const savedIds = readWishlist();
  const savedProducts = savedIds.map((id) => products.find((product) => product.id === id)).filter(Boolean);
  if (!savedProducts.length) {
    root.innerHTML = `
      <div class="empty-wishlist">
        <h2>Your wishlist is waiting</h2>
        <p>Save posters you love and come back when you are ready.</p>
        <a class="primary-button" href="category.html?category=all">Explore posters</a>
      </div>
    `;
    updateWishlistButtons();
    return;
  }

  root.innerHTML = savedProducts.map((product, index) => `
    <article class="card wishlist-card reveal" style="animation-delay: ${index * 0.06}s;">
      <div class="card-image-container">
        <img src="${product.image}" alt="${product.name}" loading="lazy" />
        <button class="wishlist-button is-saved" type="button" data-wishlist-id="${product.id}" aria-pressed="true" aria-label="Remove from wishlist">♥</button>
      </div>
      <div class="card-body">
        <span class="eyebrow">${getProductBadge(product)}</span>
        <h3>${product.name}</h3>
        <div class="meta"><span class="price">₹${getProductDisplayPrice(product)}</span></div>
        <div class="card-actions">
          <a class="secondary button-link" href="product.html?id=${product.id}">View</a>
          <button class="primary add-button" type="button" data-product-id="${product.id}">Add</button>
        </div>
      </div>
    </article>
  `).join('');

  root.querySelectorAll('.wishlist-button').forEach((button) => {
    button.addEventListener('click', () => {
      toggleWishlist(button.dataset.wishlistId);
      renderWishlistPage();
    });
  });
  root.querySelectorAll('.add-button').forEach((button) => {
    button.addEventListener('click', () => addToCart(button.dataset.productId, getProductSizeOptions(products.find((product) => product.id === button.dataset.productId))[0]?.label));
  });
  initRevealAnimation();
}

function initWishlistNavigation() {
  const headerActions = document.querySelector('.header-actions');
  if (headerActions && !headerActions.querySelector('[data-wishlist-link]')) {
    const link = document.createElement('a');
    link.href = 'wishlist.html';
    link.className = 'header-link wishlist-nav-link';
    link.dataset.wishlistLink = 'true';
    link.innerHTML = 'Wishlist <span id="wishlistCount" class="wishlist-count">0</span>';
    headerActions.insertBefore(link, headerActions.querySelector('.cart-link'));
  }

  if (headerActions && !headerActions.querySelector('[data-membership-link]')) {
    const link = document.createElement('a');
    link.href = 'membership.html';
    link.className = 'header-link membership-nav-link';
    link.dataset.membershipLink = 'true';
    link.textContent = 'Pixel Club';
    headerActions.insertBefore(link, headerActions.querySelector('[data-wishlist-link]') || headerActions.querySelector('.cart-link'));
  }

  const mobileNav = document.querySelector('.mobile-nav');
  if (mobileNav && !mobileNav.querySelector('[data-wishlist-link]')) {
    const link = document.createElement('a');
    link.href = 'wishlist.html';
    link.dataset.wishlistLink = 'true';
    link.textContent = 'Wishlist';
    mobileNav.insertBefore(link, mobileNav.querySelector('a[href="cart.html"]'));
  }
  if (mobileNav && !mobileNav.querySelector('[data-membership-link]')) {
    const link = document.createElement('a');
    link.href = 'membership.html';
    link.dataset.membershipLink = 'true';
    link.textContent = 'Pixel Club';
    mobileNav.insertBefore(link, mobileNav.querySelector('[data-wishlist-link]') || mobileNav.querySelector('a[href="cart.html"]'));
  }
  updateWishlistButtons();
}

function updateCartQuantity(productId, action, sizeLabel = 'A5') {
  const cart = parseCart();
  const cartKey = `${productId}-${sizeLabel}`;
  const item = cart.find((entry) => entry.cartKey === cartKey || (entry.id === productId && (entry.size || 'A4') === sizeLabel));
  if (!item) return;

  if (action === 'increase') {
    item.quantity += 1;
  } else {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      const index = cart.findIndex((entry) => entry.cartKey === cartKey || (entry.id === productId && (entry.size || 'A4') === sizeLabel));
      cart.splice(index, 1);
    }
  }

  saveCart(cart);
  updateCartCount();
  renderCartPage();
}

function removeCartItem(productId, sizeLabel = 'A4') {
  const cart = parseCart();
  const nextCart = cart.filter((entry) => !(entry.id === productId && (entry.size || 'A4') === sizeLabel));
  saveCart(nextCart);
  updateCartCount();
  renderCartPage();
  showToast('Item removed from cart', 'info');
}

function setCheckoutMessage(message, tone = 'error') {
  const root = document.getElementById('checkoutStatus');
  if (!root) return;

  root.innerHTML = `
    <div class="checkout-message ${tone}">${message}</div>
  `;
}

function clearCheckoutMessage() {
  const root = document.getElementById('checkoutStatus');
  if (root) {
    root.innerHTML = '';
  }
}

function setSubmitState(isSubmitting) {
  const form = document.getElementById('checkoutForm');
  const submitButton = document.getElementById('checkoutSubmitButton');
  if (!form || !submitButton) return;

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting
    ? 'Preparing WhatsApp order...'
    : submitButton.dataset.whatsappCheckout === 'true' ? 'Send order on WhatsApp' : 'Place Order';
  submitButton.classList.toggle('is-loading', isSubmitting);
}

function renderCheckoutPage() {
  const cart = parseCart();
  const root = document.getElementById('checkoutContent');
  if (!root) return;
  const draft = readCheckoutDraft();

  if (!cart.length) {
    root.innerHTML = `
      <div class="empty-checkout">
        <h2>Your cart is empty</h2>
        <p>Add a few posters to continue with checkout.</p>
        <a class="primary-button" href="index.html">Shop now</a>
      </div>
    `;
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  checkoutState.shipping = subtotal >= 200 ? 0 : 50; // Free shipping for orders of ₹200 or more
  const shipping = checkoutState.shipping;
  const discount = checkoutState.discount;
  const total = subtotal + shipping - discount;
  const upiLink = `upi://pay?pa=shahzaibkhan9%40fam&pn=Pixel%20Perfect&am=${total.toFixed(2)}&cu=INR`;
  const addBusinessDays = (date, days) => {
    const result = new Date(date);
    let remaining = days;
    while (remaining > 0) {
      result.setDate(result.getDate() + 1);
      if (result.getDay() !== 0 && result.getDay() !== 6) remaining -= 1;
    }
    return result;
  };
  const deliveryStart = addBusinessDays(new Date(), 3);
  const deliveryEnd = addBusinessDays(new Date(), 8);
  const deliveryWindow = `${deliveryStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${deliveryEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;

  root.innerHTML = `
    <div class="checkout-layout">
      <div class="checkout-main">
        <div class="checkout-progress" aria-label="Checkout progress">
          <span class="checkout-progress-step active"><b>1</b> Details</span>
          <span class="checkout-progress-line"></span>
          <span class="checkout-progress-step active"><b>2</b> Delivery</span>
          <span class="checkout-progress-line"></span>
          <span class="checkout-progress-step"><b>3</b> Payment</span>
        </div>
        <div class="checkout-step">
          <div class="step-title-row">
            <span class="step-number">1</span>
            <h3>Order</h3>
          </div>
          <div class="checkout-order-list">
            ${cart
              .map(
                (item) => `
                  <div class="checkout-item-row">
                    <img src="${item.image}" alt="${item.name}" loading="lazy" />
                    <div class="checkout-item-copy">
                      <h4>${item.name}</h4>
                      <p>Size: ${item.size}</p>
                      <p>Qty: ${item.quantity}</p>
                    </div>
                    <div class="checkout-price-copy">
                      <strong>${currency(item.price * item.quantity)}</strong>
                    </div>
                  </div>
                `
              )
              .join('')}
          </div>
        </div>

        <div class="checkout-step">
          <div class="step-title-row">
            <span class="step-number">2</span>
            <h3>Delivery</h3>
          </div>
          <div class="form-grid">
            <label>
              <span>Full name</span>
              <input type="text" name="fullName" placeholder="Enter your full name" value="${draft.fullName || ''}" required />
            </label>
            <label>
              <span>Mobile number</span>
              <input type="tel" name="phone" placeholder="Enter your mobile number" inputmode="numeric" value="${draft.phone || ''}" required />
            </label>
            <label>
              <span>Email address (for order updates)</span>
              <input type="email" name="email" placeholder="your.email@example.com" value="${draft.email || ''}" />
            </label>
            <label class="full-width">
              <span>Address</span>
              <textarea name="address" rows="3" placeholder="House no., area, landmark" required>${draft.address || ''}</textarea>
            </label>
            <label>
              <span>City</span>
              <input type="text" name="city" placeholder="City" value="${draft.city || ''}" required />
            </label>
            <label>
              <span>State</span>
              <input type="text" name="state" placeholder="State" value="${draft.state || ''}" />
            </label>
            <label>
              <span>Pincode</span>
              <input type="text" name="pincode" placeholder="Pincode" inputmode="numeric" value="${draft.pincode || ''}" required />
              <button type="button" class="pincode-button" id="checkPincodeButton">Check delivery</button>
              <div id="pincodeResult" class="pincode-result" aria-live="polite"></div>
            </label>
            <label class="full-width">
              <span>Delivery note (optional)</span>
              <textarea name="note" rows="3" placeholder="Add any delivery instructions">${draft.note || ''}</textarea>
            </label>
          </div>
        </div>

        <div class="checkout-step">
          <div class="step-title-row">
            <span class="step-number">3</span>
            <h3>Confirm on WhatsApp</h3>
          </div>
          <input type="hidden" name="paymentMethod" value="WHATSAPP" />
          <div class="whatsapp-checkout-panel">
            <strong>Order through WhatsApp</strong>
            <p>Send your order to <a href="https://wa.me/919372654780" target="_blank" rel="noreferrer">+91 93726 54780</a>. We will confirm availability, share the UPI QR or UPI ID, and verify your payment there.</p>
            <div class="checkout-whatsapp-steps">
              <span>1. Send order</span>
              <span>2. Receive UPI details</span>
              <span>3. Pay and share screenshot</span>
            </div>
          </div>
        </div>
      </div>

      <aside class="checkout-summary-panel">
        <div class="summary-header">
          <h3>Order Summary</h3>
          <span>Secure checkout</span>
        </div>

        <div class="summary-line">
          <span>Subtotal</span>
          <strong>${currency(subtotal)}</strong>
        </div>
        <div class="summary-line">
          <span>Shipping</span>
          <strong>${shipping === 0 ? 'Free' : currency(shipping)}</strong>
        </div>
        <div class="summary-line">
          <span>Discount</span>
          <strong>${currency(discount)}</strong>
        </div>

        <div class="coupon-row">
          <input type="text" id="couponCode" placeholder="Coupon code" value="${checkoutState.couponCode}" aria-label="Coupon code" />
          <button type="button" class="secondary-button small" id="applyCouponButton">Apply</button>
        </div>
        <div id="couponMessage" class="coupon-message" aria-live="polite"></div>

        <div class="checkout-delivery-summary">
          <div>
            <span>Estimated delivery</span>
            <strong>${deliveryWindow}</strong>
          </div>
          <div>
            <span>Shipping policy</span>
            <strong>${shipping === 0 ? 'Free shipping unlocked' : `${currency(shipping)} delivery charge`}</strong>
          </div>
          <div>
            <span>Cash on delivery</span>
            <strong>Available on eligible pincodes</strong>
          </div>
        </div>

        <div class="summary-total">
          <span>Total</span>
          <strong>${currency(total)}</strong>
        </div>

        <div class="trust-list">
          <span>✓ Secure checkout</span>
          <span>✓ Safe packaging</span>
          <span>✓ Customer support</span>
          <span>✓ Order confirmation</span>
        </div>

        <div class="checkout-trust-note">
          <strong>Why buyers trust this flow</strong>
          <span>Quick confirmation, protected delivery details, and clear payment steps before your order is finalized.</span>
        </div>

        <div class="checkout-payment-trust" aria-label="Payment security information">
          <span>Razorpay</span>
          <span>UPI</span>
          <span>COD</span>
          <a href="shipping-policy.html">Shipping &amp; returns</a>
        </div>

        <button type="submit" class="primary-button checkout-submit" id="checkoutSubmitButton" data-whatsapp-checkout="true">Send order on WhatsApp</button>
      </aside>
    </div>

    <div class="checkout-upsells reveal">
      <div class="upsell-header">
        <h3>Complete your wall setup</h3>
        <p>Add bestsellers to get the full bundle experience</p>
      </div>
      <div class="upsell-grid">
        ${products.slice(0, 3).map(product => {
          const isInCart = cart.some(item => item.id === product.id);
          return `
            <div class="upsell-card ${isInCart ? 'in-cart' : ''}">
              <img src="${product.image}" alt="${product.name}" />
              <h4>${product.name}</h4>
              <p class="upsell-price">₹${getMemberPrice(getProductDisplayPrice(product))}</p>
              ${!isInCart ? `<button type="button" class="secondary-button small upsell-add-button" data-product-id="${product.id}">Add to cart</button>` : '<span class="in-cart-label">✓ In your cart</span>'}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Handle upsell buttons
  root.querySelectorAll('.upsell-add-button').forEach(button => {
    button.addEventListener('click', () => {
      const productId = button.dataset.productId;
      const product = products.find(p => p.id === productId);
      if (product) {
        const defaultSize = product.sizes?.[0] || { label: 'A5', price: getProductDisplayPrice(product) };
        addToCart(productId, defaultSize.label);
      }
    });
  });

  root.querySelectorAll('input[name], textarea[name]').forEach((field) => {
    field.addEventListener('input', () => saveCheckoutDraft(root.closest('form')));
  });

  const checkPincodeButton = root.querySelector('#checkPincodeButton');
  const pincodeResult = root.querySelector('#pincodeResult');
  checkPincodeButton?.addEventListener('click', () => checkPincode(root.querySelector('[name="pincode"]')?.value, pincodeResult));
  if (draft.pincode) checkPincode(draft.pincode, pincodeResult);

  // Handle copy UPI button
  const copyButton = root.querySelector('#copyUpiButton');
  if (copyButton) {
    copyButton.addEventListener('click', (e) => {
      e.preventDefault();
      const upiId = 'shahzaibkhan9@fam';
      navigator.clipboard.writeText(upiId).then(() => {
        const originalText = copyButton.querySelector('.copy-text');
        if (originalText) {
          originalText.textContent = 'Copied ✓';
          copyButton.classList.add('copied');
          setTimeout(() => {
            originalText.textContent = 'Copy UPI ID';
            copyButton.classList.remove('copied');
          }, 2000);
        }
      });
    });
  }

  const applyCouponButton = root.querySelector('#applyCouponButton');
  if (applyCouponButton) {
    applyCouponButton.addEventListener('click', async () => {
      const couponInput = root.querySelector('#couponCode');
      const couponMessage = root.querySelector('#couponMessage');
      const code = couponInput?.value.trim().toUpperCase() || '';
      if (!code) return;
      applyCouponButton.disabled = true;
      try {
        const response = await fetch('/api/coupons/validate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, subtotal })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Coupon could not be applied.');
        checkoutState.couponCode = data.code;
        checkoutState.discount = Number(data.discount || 0);
        if (couponMessage) couponMessage.textContent = `Coupon applied: ${currency(checkoutState.discount)} off`;
        renderCheckoutPage();
      } catch (error) {
        if (couponMessage) couponMessage.textContent = error.message;
      } finally {
        applyCouponButton.disabled = false;
      }
    });
  }

  const paymentMethodInputs = root.querySelectorAll('input[name="paymentMethod"]');
  const upiPaymentCard = root.querySelector('#upiPaymentCard');
  const paymentScreenshotSection = root.querySelector('#paymentScreenshotSection');
  const codPaymentNote = root.querySelector('#codPaymentNote');
  const fileInput = root.querySelector('#screenshotInput');
  const syncPaymentMethod = () => {
    const selectedMethod = root.querySelector('input[name="paymentMethod"]:checked')?.value || 'UPI';
    const isUpi = selectedMethod === 'UPI';
    upiPaymentCard?.classList.toggle('hidden', !isUpi);
    paymentScreenshotSection?.classList.toggle('hidden', !isUpi);
    codPaymentNote?.classList.toggle('hidden', isUpi);
    if (!isUpi && fileInput) {
      fileInput.value = '';
    }
  };
  paymentMethodInputs.forEach((input) => input.addEventListener('change', () => {
    checkoutState.paymentMethod = input.value;
    syncPaymentMethod();
  }));
  syncPaymentMethod();

  // Handle screenshot preview
  const preview = root.querySelector('#screenshotPreview');
  if (fileInput && preview) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          preview.innerHTML = `<img src="${event.target?.result}" alt="Payment screenshot" />`;
          preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

function normalizePaymentMethod(value) {
  return 'UPI';
}

function openAdminWhatsApp(whatsappUrl) {
  if (!whatsappUrl) return;
  const popup = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  if (!popup) window.location.href = whatsappUrl;
}

function validateCheckoutForm(form) {
  const name = form.fullName.value.trim();
  const phone = form.phone.value.trim();
  const address = form.address.value.trim();
  const city = form.city.value.trim();
  const state = form.state.value.trim();
  const pincode = form.pincode.value.trim();
  const screenshotFile = form.paymentScreenshot?.files?.[0];
  const paymentMethod = form.paymentMethod?.value || 'UPI';

  if (!name || name.length < 2) {
    return 'Please enter your full name.';
  }

  if (!/^[0-9+\s-]{10,15}$/.test(phone)) {
    return 'Enter a valid mobile number.';
  }

  if (!address || address.length < 8) {
    return 'Please provide a complete delivery address.';
  }

  if (!city || city.length < 2) {
    return 'Please enter your city.';
  }

  if (state && state.length < 2) {
    return 'State name looks too short.';
  }

  if (!/^[0-9]{4,8}$/.test(pincode)) {
    return 'Please enter a valid pincode.';
  }

  if (paymentMethod === 'UPI' && !screenshotFile) {
    return 'Please upload a payment screenshot to proceed.';
  }

  const validExtensions = ['jpg', 'jpeg', 'png'];
  if (paymentMethod !== 'UPI') return null;

  const fileName = screenshotFile.name.toLowerCase();
  const fileExt = fileName.split('.').pop();
  if (!validExtensions.includes(fileExt)) {
    return 'Payment screenshot must be JPG, JPEG, or PNG format.';
  }

  if (screenshotFile.size > 5 * 1024 * 1024) {
    return 'Screenshot file size must be less than 5MB.';
  }

  return null;
}

async function submitCheckout(event) {
  event.preventDefault();
  const form = event.target;
  const validationMessage = validateCheckoutForm(form);

  if (validationMessage) {
    setCheckoutMessage(validationMessage, 'error');
    return;
  }

  const cart = parseCart();
  if (!cart.length) {
    setCheckoutMessage('Your cart is empty. Add a product before checkout.', 'error');
    return;
  }

  const paymentMethod = form.paymentMethod?.value || 'COD';
  const screenshotFile = form.paymentScreenshot?.files?.[0];
  if (paymentMethod === 'UPI' && !screenshotFile) {
    setCheckoutMessage('Payment screenshot is required for UPI.', 'error');
    return;
  }

  if (window.__pixelPerfectSubmitting) {
    return;
  }

  window.__pixelPerfectSubmitting = true;
  setSubmitState(true);
  clearCheckoutMessage();

  try {
    // Prepare customer data
    const customer = {
      name: form.fullName.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email?.value?.trim() || '',
      address: form.address.value.trim(),
      city: form.city.value.trim(),
      pincode: form.pincode.value.trim(),
      state: form.state.value.trim(),
      note: form.note.value.trim(),
      paymentMethod,
      paymentStatus: paymentMethod === 'UPI' ? 'Submitted for verification' : 'Pending',
      upiId: paymentMethod === 'UPI' ? 'shahzaibkhan9@fam' : '',
      paymentScreenshot: '',
      paymentScreenshotBase64: ''
    };

    const payload = {
      customer,
      couponCode: checkoutState.couponCode,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0)
      }))
    };

    // Handle Razorpay payment flow
    if (paymentMethod === 'Razorpay') {
      return handleRazorpayCheckout(form, customer, payload);
    }

    // Handle UPI/COD flow (existing logic)
    const screenshotBase64 = paymentMethod === 'UPI' && screenshotFile ? await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(screenshotFile);
    }) : '';

    if (paymentMethod === 'UPI') {
      customer.paymentScreenshot = `screenshot-${Date.now()}.${screenshotFile.name.split('.').pop().toLowerCase()}`;
      customer.paymentScreenshotBase64 = screenshotBase64;
    }

    payload.customer = customer;

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to place your order.');

    localStorage.removeItem(CART_KEY);
    clearCheckoutDraft();
    updateCartCount();
    form.reset();

    const orderId = data.order?.id || 'unknown';
    trackEvent('order_complete');
    openAdminWhatsApp(data.whatsappUrl);
    window.location.href = `order-success.html?orderId=${encodeURIComponent(orderId)}`;
  } catch (error) {
    console.error('Checkout error:', error);
    setCheckoutMessage(error.message || 'Something went wrong. Please try again.', 'error');
    window.__pixelPerfectSubmitting = false;
    setSubmitState(false);
  }
}

async function handleRazorpayCheckout(form, customer, payload) {
  try {
    // Create order first without payment details
    const tempPayload = { ...payload, customer: { ...customer, paymentMethod: 'COD' } };
    const orderResponse = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tempPayload)
    });

    const orderData = await orderResponse.json();
    if (!orderResponse.ok) throw new Error(orderData.message || 'Unable to create order.');

    const orderId = orderData.order?.id;
    const orderTotal = orderData.order?.total || 0;

    // Create Razorpay payment order
    const paymentOrderResponse = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: orderTotal,
        orderId: orderId,
        customerEmail: customer.email
      })
    });

    const paymentOrderData = await paymentOrderResponse.json();
    if (!paymentOrderResponse.ok) {
      if (paymentOrderData.available === false) {
        setCheckoutMessage('Razorpay is not available. Please use UPI or COD.', 'error');
        window.__pixelPerfectSubmitting = false;
        setSubmitState(false);
        return;
      }
      throw new Error(paymentOrderData.message || 'Failed to create payment order.');
    }

    // Open Razorpay checkout
    const options = {
      key: paymentOrderData.key_id,
      amount: paymentOrderData.amount,
      currency: paymentOrderData.currency,
      name: 'Pixel Perfect',
      description: `Order ${orderId}`,
      order_id: paymentOrderData.razorpay_order_id,
      handler: async (response) => {
        try {
          // Verify payment
          const verifyResponse = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId
            })
          });

          const verifyData = await verifyResponse.json();
          if (!verifyResponse.ok) throw new Error(verifyData.message || 'Payment verification failed.');

          localStorage.removeItem(CART_KEY);
          clearCheckoutDraft();
          updateCartCount();
          form.reset();
          trackEvent('order_complete');
          openAdminWhatsApp(verifyData.whatsappUrl);
          window.location.href = `order-success.html?orderId=${encodeURIComponent(orderId)}`;
        } catch (error) {
          console.error('Payment verification error:', error);
          setCheckoutMessage(error.message || 'Payment verification failed. Please contact support.', 'error');
          window.__pixelPerfectSubmitting = false;
          setSubmitState(false);
        }
      },
      prefill: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone
      },
      theme: {
        color: '#d6b578'
      },
      modal: {
        ondismiss: () => {
          setCheckoutMessage('Payment cancelled by user.', 'error');
          window.__pixelPerfectSubmitting = false;
          setSubmitState(false);
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error('Razorpay checkout error:', error);
    setCheckoutMessage(error.message || 'Failed to process payment. Please try again.', 'error');
    window.__pixelPerfectSubmitting = false;
    setSubmitState(false);
  }
}

function initMobileMenu() {
  const menuButton = document.querySelector('.menu-button');
  const closeMenu = document.querySelector('.close-menu');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!menuButton || !mobileMenu) return;

  menuButton.addEventListener('click', () => mobileMenu.classList.add('open'));
  closeMenu?.addEventListener('click', () => mobileMenu.classList.remove('open'));
  mobileMenu.addEventListener('click', (event) => {
    if (event.target === mobileMenu) {
      mobileMenu.classList.remove('open');
    }
  });
}

function initCheckoutForm() {
  const form = document.getElementById('checkoutForm');
  if (!form) return;

  renderCheckoutPage();
  trackEvent('checkout_start');
  form.addEventListener('submit', submitCheckout);
}

function initTrackOrderPage() {
  const form = document.getElementById('trackOrderForm');
  const result = document.getElementById('trackOrderResult');
  if (!form || !result) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const orderId = form.orderId.value.trim();
    const phone = form.phone.value.trim();
    result.innerHTML = '<div class="track-loading">Finding your order...</div>';

    try {
      const params = new URLSearchParams({ orderId, phone });
      const response = await fetch(`/api/orders/track?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Order not found.');
      renderTrackedOrder(result, data);
    } catch (error) {
      result.innerHTML = `<div class="track-message error">${error.message}</div>`;
    }
  });
}

function renderTrackedOrder(root, order) {
  const steps = ['pending', 'whatsapp_contacted', 'payment_pending', 'payment_confirmed', 'processing', 'shipped', 'delivered'];
  const labels = {
    pending: 'New order',
    whatsapp_contacted: 'WhatsApp contacted',
    payment_pending: 'Payment pending',
    payment_confirmed: 'Payment confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  const statusAliases = { confirmed: 'payment_confirmed', completed: 'delivered' };
  const normalizedStatus = statusAliases[order.status] || order.status || 'pending';
  const currentIndex = steps.indexOf(normalizedStatus);
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const estimatedDelivery = order.estimatedDelivery
    ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '3–8 working days';
  const itemRows = (order.items || []).map((item) => `<li><span>${item.name} · ${item.size} × ${item.quantity}</span><strong>${currency(item.price * item.quantity)}</strong></li>`).join('');

  root.innerHTML = `
    <div class="tracked-order-card reveal is-visible">
      <div class="tracked-order-header">
        <div><span class="eyebrow">Order ${order.id}</span><h2>${labels[normalizedStatus] || 'Order update'}</h2><p>Placed on ${orderDate} for ${order.customer?.name || 'you'}.</p><p class="tracking-meta">Tracking ID: <strong>${order.trackingId || order.id}</strong> · Estimated delivery: <strong>${estimatedDelivery}</strong></p></div>
        <div class="tracked-payment"><span>Payment</span><strong>${order.paymentMethod}</strong><small>${order.paymentStatus}</small></div>
      </div>
      ${normalizedStatus === 'cancelled' ? '<div class="tracking-cancelled">This order has been cancelled. Please contact us on WhatsApp if you need help.</div>' : `<div class="tracking-timeline">${steps.map((step, index) => `<div class="tracking-step ${index <= currentIndex ? 'active' : ''}"><span>${index <= currentIndex ? '✓' : index + 1}</span><strong>${labels[step]}</strong></div>`).join('')}</div>`}
      <div class="tracked-order-content">
        <div><h3>Items</h3><ul class="tracked-items">${itemRows}</ul></div>
        <div class="tracked-total"><span>Subtotal</span><strong>${currency(order.subtotal)}</strong><span>Shipping</span><strong>${order.shipping ? currency(order.shipping) : 'Free'}</strong><span>Discount</span><strong>${currency(order.discount)}</strong><b>Total</b><b>${currency(order.total)}</b></div>
      </div>
      <a class="primary-button" href="https://wa.me/919372654780?text=${encodeURIComponent(`Hi, I need help tracking order ${order.id}`)}" target="_blank" rel="noreferrer">Chat on WhatsApp</a>
    </div>
  `;
}

async function loadOrderSuccessPage() {
  const root = document.getElementById('orderSuccessState');
  if (!root) return;

  const orderId = new URLSearchParams(window.location.search).get('orderId');
  if (!orderId) {
    root.innerHTML = `
      <div class="success-card error-state">
        <h2>Order not found</h2>
        <p>No order ID was provided. Please check your order confirmation email or contact support.</p>
        <a class="primary-button" href="index.html">Return to home</a>
      </div>
    `;
    return;
  }

  root.innerHTML = `<div class="success-loading">Loading order details...</div>`;

  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
    if (!response.ok) {
      throw new Error(`Order retrieval failed with status ${response.status}`);
    }

    const order = await response.json();
    renderOrderSuccessContent(root, order);
  } catch (error) {
    console.error('Error loading order:', error);
    root.innerHTML = `
      <div class="success-card error-state">
        <h2>Order details unavailable</h2>
        <p>We're having trouble loading your order details. Please save your order ID and contact support.</p>
        <div class="error-order-id">Order ID: <strong>${orderId}</strong></div>
        <a class="primary-button" href="index.html">Return to home</a>
      </div>
    `;
  }
}

function renderOrderSuccessContent(root, order) {
  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const estimatedDelivery = order.estimatedDelivery
    ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : 'Within 7 working days';
  const statusIndex = ['pending', 'confirmed', 'processing', 'shipped', 'completed'].indexOf(order.status || 'pending');
  const whatsappNumber = '919372654780';
  const whatsappMessage = encodeURIComponent(`Hi, I'd like to track my order ${order.id}`);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  root.innerHTML = `
    <div class="success-card reveal">
      <div class="success-header">
        <div class="success-badge">✓</div>
        <h1>Order Confirmed!</h1>
        <p class="success-subtitle">Thank you for shopping with Pixel Perfect</p>
      </div>

      <div class="order-details-card">
        <div class="details-row">
          <div class="detail-item">
            <span class="detail-label">Order ID</span>
            <div class="detail-value-with-copy">
              <strong id="orderIdDisplay">${order.id}</strong>
              <button type="button" class="copy-button" aria-label="Copy order ID" data-copy-value="${order.id}">Copy</button>
            </div>
            <p class="save-note">✓ Save your Order ID. You'll need it to track your order.</p>
          </div>
          <div class="detail-item">
            <span class="detail-label">Order Date</span>
            <strong>${formattedDate}</strong>
            <small>${formattedTime}</small>
          </div>
        </div>
        <div class="details-row tracking-highlight">
          <div class="detail-item">
            <span class="detail-label">Tracking ID</span>
            <div class="detail-value-with-copy">
              <strong>${order.trackingId || order.id}</strong>
              <button type="button" class="copy-button" aria-label="Copy tracking ID" data-copy-value="${order.trackingId || order.id}">Copy</button>
            </div>
            <p class="save-note">Use this ID on the Track Order page for updates.</p>
          </div>
          <div class="detail-item">
            <span class="detail-label">Estimated delivery</span>
            <strong>${estimatedDelivery}</strong>
            <small>Delivery estimate</small>
          </div>
        </div>
        <div class="details-row">
          <div class="detail-item">
            <span class="detail-label">Customer</span>
            <strong>${order.customer?.name || 'Guest'}</strong>
          </div>
          <div class="detail-item">
            <span class="detail-label">Payment Method</span>
            <strong>${order.paymentMethod || 'Cash on Delivery'}</strong>
          </div>
        </div>
        <div class="details-row full-width">
          <div class="detail-item">
            <span class="detail-label">Order Total</span>
            <div class="order-total">${currency(order.total || 0)}</div>
          </div>
        </div>
      </div>

      <div class="progress-tracker">
        <h3>Order Progress</h3>
        <div class="progress-steps">
          ${renderProgressStep('placed', 'Order Placed', statusIndex >= 0)}
          ${renderProgressStep('confirmed', 'Confirmed', statusIndex >= 1)}
          ${renderProgressStep('processing', 'Processing', statusIndex >= 2)}
          ${renderProgressStep('shipped', 'Shipped', statusIndex >= 3)}
          ${renderProgressStep('delivered', 'Delivered', statusIndex >= 4)}
        </div>
      </div>

      <div class="order-items-section">
        <h3>Your Items</h3>
        <div class="items-list">
          ${(order.items || [])
            .map(
              (item) => `
                <div class="success-item-row">
                  <div class="item-image-placeholder">📄</div>
                  <div class="item-details">
                    <h4>${item.name || 'Poster'}</h4>
                    <p class="item-size">Size: ${item.size || 'N/A'}</p>
                    <p class="item-qty">Qty: ${item.quantity || 1}</p>
                  </div>
                  <div class="item-price">
                    <strong>${currency(item.price * item.quantity)}</strong>
                    <small class="unit-price">${currency(item.price)} each</small>
                  </div>
                </div>
              `
            )
            .join('')}
        </div>
      </div>

      <div class="success-delivery-info">
        <h3>Delivery Timeline</h3>
        <div class="timeline-steps">
          <div class="timeline-step active">
            <span class="timeline-dot">✓</span>
            <div><strong>Order Confirmed</strong><small>Just now</small></div>
          </div>
          <div class="timeline-step">
            <span class="timeline-dot">2</span>
            <div><strong>Processing</strong><small>Within 24 hours</small></div>
          </div>
          <div class="timeline-step">
            <span class="timeline-dot">3</span>
            <div><strong>Shipped</strong><small>1-2 working days</small></div>
          </div>
          <div class="timeline-step">
            <span class="timeline-dot">4</span>
            <div><strong>Delivered</strong><small>${estimatedDelivery}</small></div>
          </div>
        </div>
      </div>

      <div class="success-member-promo">
        <h3>Join Pixel Club for Exclusive Deals</h3>
        <p>Save 12% on every order + early access to limited drops</p>
        <a href="membership.html" class="primary-button">Explore Membership</a>
      </div>

      <div class="success-actions">
        <a href="${whatsappUrl}" class="primary-button" target="_blank" rel="noopener noreferrer">
          💬 Chat on WhatsApp
        </a>
        <a href="index.html#customer-reviews" class="secondary-button">
          Share a verified review
        </a>
        <a href="index.html" class="secondary-button">
          Continue Shopping
        </a>
      </div>
    </div>
  `;

  root.querySelectorAll('.copy-button').forEach((copyButton) => {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copyButton.dataset.copyValue);
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        showToast('Copied to clipboard', 'success');
        setTimeout(() => { copyButton.textContent = originalText; }, 2000);
      } catch {
        showToast('Copy failed. Please select the ID manually.', 'error');
      }
    });
  });
}

function renderProgressStep(status, label, isActive) {
  return `
    <div class="progress-step ${isActive ? 'active' : 'inactive'}" data-status="${status}">
      <div class="step-indicator">${isActive ? '✓' : ''}</div>
      <span class="step-label">${label}</span>
    </div>
  `;
}

function injectProductSchema(product, reviews) {
  document.getElementById('productSchema')?.remove();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: getProductDescription(product),
    image: [product.image].filter(Boolean).map((image) => new URL(image, window.location.href).href),
    brand: { '@type': 'Brand', name: 'Pixel Perfect' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: Number(getProductDisplayPrice(product) || 0),
      availability: Number(product.stock) === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: window.location.href
    }
  };
  const ratedReviews = reviews.filter((review) => Number(review.rating || review.stars) > 0);
  if (ratedReviews.length) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: (ratedReviews.reduce((sum, review) => sum + Number(review.rating || review.stars), 0) / ratedReviews.length).toFixed(1),
      reviewCount: ratedReviews.length
    };
  }
  const script = document.createElement('script');
  script.id = 'productSchema';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

function renderProductDetail() {
  const detailRoot = document.getElementById('productDetail');
  if (!detailRoot) return;

  const productId = new URLSearchParams(window.location.search).get('id');
  const product = products.find((entry) => entry.id === productId) || products[0];

  if (!product) {
    detailRoot.innerHTML = `
      <div class="empty">
        <h3>Product not found</h3>
        <p>The poster you selected is not available right now.</p>
      </div>
    `;
    return;
  }

  document.title = `${product.name} | Pixel Perfect`;

  trackEvent('product_view', product.id);

  writeRecentlyViewed(product.id);

  const gallery = getProductGallery(product);
  const roomPreview = getProductRoomPreview(product);
  const defaultSize = getProductSizeOptions(product)[0] || { label: 'A5', price: getProductDisplayPrice(product) };
  const productReviews = getProductReviews(product);
  const rating = Number(product.rating || 0);
  const reviewCount = Number(product.reviewCount || productReviews.length || 0);
  injectProductSchema(product, productReviews);
  const discount = getProductDiscount(product, defaultSize.price);
  const relatedProducts = products.filter((entry) => entry.id !== product.id && entry.category === product.category).slice(0, 3);
  const recentProducts = products.filter((entry) => entry.id !== product.id && readRecentlyViewed().includes(entry.id)).slice(0, 3);

  const roomButtons = getProductRoomCategories()
    .map((category, index) => `<button class="room-category-btn ${index === 0 ? 'active' : ''}" type="button" data-room-category="${category}">${category}</button>`)
    .join('');

  detailRoot.innerHTML = `
    <div class="product-detail-layout reveal">
      <div class="detail-gallery" aria-label="Product gallery">
        <div class="detail-image-box main-gallery-image" role="button" tabindex="0" aria-label="Open image viewer">
          <img id="mainGalleryImage" src="${gallery[0]}" alt="${product.name}" fetchpriority="high" loading="eager" />
        </div>
        <div class="detail-gallery-strip">
          ${gallery
            .map(
              (image, index) => `
                <button class="mini-gallery-image ${index === 0 ? 'active' : ''}" type="button" data-gallery-index="${index}" aria-label="View image ${index + 1}">
                  <img src="${image}" alt="${product.name} view ${index + 1}" loading="lazy" />
                </button>
              `
            )
            .join('')}
          
          <div class="size-guide-row">
            <button type="button" class="size-guide-button" id="sizeGuideButton"><i data-lucide="ruler" class="ui-icon" aria-hidden="true"></i> Size guide</button>
            <div class="size-guide-popup hidden" id="sizeGuidePopup">
              <div class="size-guide-content">
                <h4>Poster Sizes</h4>
                <ul class="size-specs">
                  <li><strong>A5</strong> – 148 × 210 mm (small desk)</li>
                  <li><strong>A4</strong> – 210 × 297 mm (standard wall)</li>
                  <li><strong>A3</strong> – 297 × 420 mm (statement wall)</li>
                  <li><strong>13×19"</strong> – 330 × 483 mm (premium large)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-copy sticky" id="detailStickyCopy">
        <span class="eyebrow">${getProductBadge(product)}</span>
          ${isMemberMode() ? '<span class="member-badge-pill">Member Price Active</span>' : ''}

        <div class="rating-row">
          <span class="stars">${rating ? '★'.repeat(Math.floor(rating)) : '☆'}</span>
          <span>${rating ? `${rating.toFixed(1)} rating` : 'New product'}</span>
          <span class="muted">(${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})</span>
        </div>

        <div class="trust-badges-row">
          <span class="trust-badge">✓ Fast shipping</span>
          <span class="trust-badge">✓ COD available</span>
          <span class="trust-badge">✓ Premium quality</span>
        </div>

        <div class="detail-price-row">
          <span class="regular">₹${product.regularPrice}</span>
          <span class="sale" id="detailSelectedPrice">₹${defaultSize.price}</span>
          <span class="discount-pill">${discount}% OFF</span>
        </div>

        <div class="detail-purchase-meta">
          <span>Material: <strong>${product.material || 'Premium print'}</strong></span>
          <span>Dispatch: <strong>24–48 hours</strong></span>
          <span>Delivery: <strong>3–8 working days</strong></span>
        </div>

        <div class="trust-banner">
          ${getProductTrustBadges(product)
            .map((badge) => `<span class="trust-pill">${badge}</span>`)
            .join('')}
        </div>

        <p>${getProductDescription(product)}</p>

        <div class="detail-luxury-guarantees" aria-label="Premium benefits">
          <span>Premium finish</span>
          <span>Secure packaging</span>
          <span>Fast India dispatch</span>
        </div>

        <div class="detail-extra">
          <label for="detailSizeSelect">Choose your size</label>
          <select id="detailSizeSelect" class="size-select large-select">
            ${getProductSizeOptions(product)
              .map(
                (size) => `<option value="${size.label}" ${size.label === defaultSize.label ? 'selected' : ''}>${size.label} — ${size.price} • ${getProductSizeText(size.label)}</option>`
              )
              .join('')}
          </select>
        </div>

        <div class="detail-extra">
          <label for="detailMaterialSelect">Choose your material</label>
          <select id="detailMaterialSelect" class="size-select large-select">
            ${[product.material || 'Premium waterproof vinyl', 'Matte paper', 'Gloss paper', 'Holographic vinyl', 'Reflective vinyl']
              .filter((material, index, options) => options.indexOf(material) === index)
              .map((material) => `<option value="${material}">${material}</option>`)
              .join('')}
          </select>
        </div>

        <div class="detail-extra detail-delivery-check">
          <label for="detailPincodeInput">Check delivery to your pincode</label>
          <div class="detail-pincode-row">
            <input id="detailPincodeInput" class="size-select" type="text" inputmode="numeric" maxlength="6" placeholder="Enter pincode" aria-describedby="detailPincodeResult" />
            <button type="button" class="secondary-button small" id="detailPincodeButton">Check</button>
          </div>
          <div id="detailPincodeResult" class="pincode-result" aria-live="polite"></div>
        </div>

        <div class="quantity-row">
          <label>Quantity</label>
          <div class="quantity-box">
            <button type="button" class="qty-adjust" data-action="decrease" aria-label="Decrease quantity">−</button>
            <span id="detailQuantityValue">1</span>
            <button type="button" class="qty-adjust" data-action="increase" aria-label="Increase quantity">+</button>
          </div>
        </div>

        <div class="quantity-bundles" aria-label="Quantity bundles">
          <span class="bundle-label">Save more with bundles</span>
          <div class="bundle-options">
            <button type="button" class="bundle-option" data-bundle-quantity="1">1</button>
            <button type="button" class="bundle-option" data-bundle-quantity="3">3</button>
            <button type="button" class="bundle-option" data-bundle-quantity="5">5</button>
            <button type="button" class="bundle-option" data-bundle-quantity="10">10</button>
          </div>
          <strong id="detailBundlePrice">₹${defaultSize.price}</strong>
        </div>

        <div class="detail-actions">
          <button class="primary add-button large" type="button" id="detailAddButton">Add to cart</button>
          <button class="secondary detail-buy-button" type="button" id="detailBuyButton">Buy now</button>
          <a class="detail-button whatsapp-link" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Pixel Perfect, I want to order ${product.name}. Please share the available size and price details.`)}" target="_blank" rel="noreferrer">WhatsApp order</a>
        </div>
      </div>
    </div>

    <div class="mobile-product-bar" id="mobileProductBar">
      <strong id="mobileProductPrice">₹${defaultSize.price}</strong>
      <button class="primary-button" type="button" id="mobileProductAddButton">Order on WhatsApp</button>
    </div>

    <div class="premium-info-grid reveal">
      <div class="premium-panel">
        <h3>What's included</h3>
        <ul>
          ${getProductIncludes(product)
            .map((item) => `<li>${item}</li>`)
            .join('')}
        </ul>
      </div>
      <div class="premium-panel">
        <h3>How it looks on the wall</h3>
        <ul>
          ${getProductWallStyles(product)
            .map((item) => `<li>${item}</li>`)
            .join('')}
        </ul>
      </div>
    </div>

    <div class="wall-preview reveal">
      <div class="section-heading slim-heading">
        <span class="eyebrow">See it on the wall</span>
        <h2>Styled for real spaces</h2>
      </div>
      <div class="room-category-bar">${roomButtons}</div>
      <div class="room-preview-card">
        <div class="room-preview-visual">
          <img id="roomPreviewImage" src="${roomPreview[0].image}" alt="${roomPreview[0].category} demo" loading="lazy" />
        </div>
        <div class="room-preview-copy">
          <span class="room-label">Room preview</span>
          <h3 id="roomPreviewTitle">${roomPreview[0].category}</h3>
          <p>See how this product can sit within a styled room setup. Actual appearance may vary with lighting and display.</p>
        </div>
      </div>
    </div>

    <div class="size-compare reveal">
      <div class="section-heading slim-heading">
        <span class="eyebrow">Size guide</span>
        <h2>Choose the right size for your wall</h2>
      </div>
      <div class="size-compare-grid">
        ${getProductSizeOptions(product)
          .map(
            (size) => `
              <div class="size-box">
                <strong>${size.label}</strong>
                <span>${getProductSizeText(size.label)}</span>
                <em>₹${size.price}</em>
              </div>
            `
          )
          .join('')}
      </div>
    </div>

    <div class="detail-content-grid reveal">
      <div class="info-panel">
        <h3>Product description</h3>
        <p>${getProductDescription(product)}</p>
      </div>
      <div class="info-panel">
        <h3>Shipping info</h3>
        <p>We dispatch most orders within 24 to 48 hours. Delivery is available across India with secure packaging and fast support.</p>
      </div>
      <div class="info-panel">
        <h3>Returns & replacements</h3>
        <p>If your order arrives damaged, incorrect, or defective, we will help with replacement or a suitable resolution as quickly as possible.</p>
      </div>
    </div>

    <div class="detail-review-section reveal">
      <div class="section-heading slim-heading">
        <span class="eyebrow">Customer reviews</span>
        <h2>What people are saying</h2>
      </div>
      <div class="review-grid">
        ${getProductReviews(product)
          .map(
            (review) => `
              <article class="review-card premium-review">
                <div class="review-stars">${'★'.repeat(review.stars)}${'☆'.repeat(5 - review.stars)}</div>
                <p>“${review.review}”</p>
                <h3>${review.name} ${isVerifiedPurchaseReview(review) ? '<span class="verified-review-label">Verified purchase</span>' : ''}</h3>
                <span>${review.location}</span>
              </article>
            `
          )
          .join('') || '<div class="empty-review-state">No approved reviews yet. Be the first to share your experience.</div>'}
      </div>
      <form class="review-submission-form" id="reviewSubmissionForm">
        <h3>Share your experience</h3>
        <p>Your review will appear after approval. Add your order ID and checkout phone to receive a verified-purchase label.</p>
        <div class="review-form-grid">
          <label><span>Your name</span><input name="name" required minlength="2" /></label>
          <label><span>Rating</span><select name="rating" required><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></label>
          <label><span>Order ID (optional)</span><input name="orderId" placeholder="PP-..." /></label>
          <label><span>Checkout phone (optional)</span><input name="orderPhone" inputmode="tel" /></label>
          <label class="full-width"><span>Review</span><textarea name="review" required minlength="10" rows="4" placeholder="What did you like about it?"></textarea></label>
        </div>
        <button class="primary-button" type="submit">Submit review</button>
        <div class="review-form-status" id="reviewFormStatus" aria-live="polite"></div>
      </form>
    </div>

    <div class="faq-section reveal">
      <div class="section-heading slim-heading">
        <span class="eyebrow">FAQ</span>
        <h2>Common questions</h2>
      </div>
      <div class="faq-list">
        ${getProductFaqs(product)
          .map(
            (faq, index) => `
              <div class="faq-item ${index === 0 ? 'open' : ''}">
                <button class="faq-question" type="button">${faq.question}</button>
                <div class="faq-answer">
                  <p>${faq.answer}</p>
                </div>
              </div>
            `
          )
          .join('')}
      </div>
    </div>

    <div class="related-products reveal">
      <div class="section-heading slim-heading">
        <span class="eyebrow">Related products</span>
        <h2>You may also like</h2>
      </div>
      <div class="related-grid">
        ${relatedProducts.length ? relatedProducts.map((item) => {
          const itemReviews = getProductReviews(item);
          const itemRating = Number(item.rating || 0);
          const itemReviewCount = Number(item.reviewCount || itemReviews.length || 0);
          return `
          <article class="card mini-card">
            <div class="card-image-container">
              <img src="${item.image}" alt="${item.name}" loading="lazy" />
              <span class="card-tag">${getProductBadge(item)}</span>
            </div>
            <div class="card-body">
              <div class="card-rating">
                <span class="stars">${itemRating ? '★'.repeat(Math.floor(itemRating)) : '☆'}</span>
                <span class="rating-text">${itemRating ? itemRating.toFixed(1) : 'New'}</span>
                <span class="review-count">(${itemReviewCount} reviews)</span>
              </div>
              <h3>${item.name}</h3>
              <div class="meta">
                <span class="price">₹${getProductDisplayPrice(item)}</span>
              </div>
              <div class="card-actions compact-actions">
                <a class="secondary button-link" href="product.html?id=${item.id}">View</a>
              </div>
            </div>
          </article>
        `}).join('') : '<div class="empty">More products coming soon.</div>'}
      </div>
    </div>

    <div class="related-products reveal">
      <div class="section-heading slim-heading">
        <span class="eyebrow">Recently viewed</span>
        <h2>Keep exploring</h2>
      </div>
      <div class="related-grid">
        ${recentProducts.length ? recentProducts.map((item) => {
          const itemReviews = getProductReviews(item);
          const itemRating = Number(item.rating || 0);
          const itemReviewCount = Number(item.reviewCount || itemReviews.length || 0);
          return `
          <article class="card mini-card">
            <div class="card-image-container">
              <img src="${item.image}" alt="${item.name}" loading="lazy" />
              <span class="card-tag">${getProductBadge(item)}</span>
            </div>
            <div class="card-body">
              <div class="card-rating">
                <span class="stars">${itemRating ? '★'.repeat(Math.floor(itemRating)) : '☆'}</span>
                <span class="rating-text">${itemRating ? itemRating.toFixed(1) : 'New'}</span>
                <span class="review-count">(${itemReviewCount} reviews)</span>
              </div>
              <h3>${item.name}</h3>
              <div class="meta">
                <span class="price">₹${getProductDisplayPrice(item)}</span>
              </div>
              <div class="card-actions compact-actions">
                <a class="secondary button-link" href="product.html?id=${item.id}">View</a>
              </div>
            </div>
          </article>
        `}).join('') : '<div class="empty">No recent products yet.</div>'}
      </div>
    </div>
  `;

  const galleryRoot = detailRoot.querySelector('.detail-gallery');
  const mainGalleryImage = detailRoot.querySelector('#mainGalleryImage');
  const galleryButtons = detailRoot.querySelectorAll('.mini-gallery-image');
  const sizeSelect = detailRoot.querySelector('#detailSizeSelect');
  const materialSelect = detailRoot.querySelector('#detailMaterialSelect');
  const detailButton = detailRoot.querySelector('#detailAddButton');
  const detailBuyButton = detailRoot.querySelector('#detailBuyButton');
  const detailQuantityValue = detailRoot.querySelector('#detailQuantityValue');
  const priceNode = detailRoot.querySelector('#detailSelectedPrice');
  const roomPreviewImage = detailRoot.querySelector('#roomPreviewImage');
  const roomPreviewTitle = detailRoot.querySelector('#roomPreviewTitle');
  const roomCategoryButtons = detailRoot.querySelectorAll('.room-category-btn');
  const bundlePrice = detailRoot.querySelector('#detailBundlePrice');
  const mobileProductPrice = detailRoot.querySelector('#mobileProductPrice');
  const mobileProductAddButton = detailRoot.querySelector('#mobileProductAddButton');
  const detailPincodeInput = detailRoot.querySelector('#detailPincodeInput');
  const detailPincodeButton = detailRoot.querySelector('#detailPincodeButton');
  const detailPincodeResult = detailRoot.querySelector('#detailPincodeResult');
  const reviewForm = detailRoot.querySelector('#reviewSubmissionForm');
  const reviewFormStatus = detailRoot.querySelector('#reviewFormStatus');

  let selectedGalleryIndex = 0;
  let currentQuantity = 1;

  detailPincodeButton?.addEventListener('click', () => {
    checkPincode(detailPincodeInput?.value, detailPincodeResult);
  });

  reviewForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(reviewForm);
    const payload = {
      name: formData.get('name'),
      rating: Number(formData.get('rating')),
      review: formData.get('review'),
      productBought: product.name,
      category: product.category,
      orderId: formData.get('orderId'),
      orderPhone: formData.get('orderPhone')
    };
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Review could not be submitted.');
      reviewForm.reset();
      if (reviewFormStatus) reviewFormStatus.textContent = data.message || 'Review submitted for approval.';
    } catch (error) {
      if (reviewFormStatus) reviewFormStatus.textContent = error.message;
    }
  });

  const updateSelectedState = () => {
    const selectedSize = getSelectedSize(product, sizeSelect?.value || defaultSize.label);
    const currentPrice = Number(selectedSize.price || 0);
    if (priceNode) {
      priceNode.textContent = `₹${currentPrice}`;
    }
    if (bundlePrice) bundlePrice.textContent = `₹${currentPrice * currentQuantity}`;
    if (mobileProductPrice) mobileProductPrice.textContent = `₹${currentPrice * currentQuantity}`;
    const discountValue = getProductDiscount(product, currentPrice);
    const discountNode = detailRoot.querySelector('.discount-pill');
    if (discountNode) {
      discountNode.textContent = `${discountValue}% OFF`;
    }
  };

  const updateGallery = (index) => {
    if (!gallery.length || !mainGalleryImage) return;
    const previousIndex = selectedGalleryIndex;
    selectedGalleryIndex = (index + gallery.length) % gallery.length;
    const direction = selectedGalleryIndex >= previousIndex ? 'forward' : 'backward';
    mainGalleryImage.classList.remove('gallery-transition-forward', 'gallery-transition-backward');
    void mainGalleryImage.offsetWidth;
    mainGalleryImage.classList.add(`gallery-transition-${direction}`);
    mainGalleryImage.src = gallery[selectedGalleryIndex];
    galleryButtons.forEach((button, buttonIndex) => {
      button.classList.toggle('active', buttonIndex === selectedGalleryIndex);
    });
  };

  const openLightbox = (index) => {
    const lightbox = document.getElementById('productVisualViewer');
    if (!lightbox) return;

    const image = gallery[index] || gallery[0];
    const viewerImage = lightbox.querySelector('img');
    const viewerLabel = lightbox.querySelector('.viewer-caption');
    if (viewerImage) {
      viewerImage.src = image;
      viewerImage.alt = `${product.name} preview ${index + 1}`;
    }
    if (viewerLabel) {
      viewerLabel.textContent = `${product.name} • ${index + 1} / ${gallery.length}`;
    }

    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    const lightbox = document.getElementById('productVisualViewer');
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };

  if (!document.getElementById('productVisualViewer')) {
    const lightbox = document.createElement('div');
    lightbox.id = 'productVisualViewer';
    lightbox.className = 'product-visual-viewer';
    lightbox.innerHTML = `
      <div class="viewer-backdrop" aria-hidden="true"></div>
      <div class="viewer-shell" role="dialog" aria-modal="true" aria-label="Product image viewer">
        <button class="viewer-close" type="button" aria-label="Close image viewer">×</button>
        <div class="viewer-image-wrap">
          <img src="${gallery[0]}" alt="${product.name}" />
        </div>
        <div class="viewer-caption">${product.name}</div>
      </div>
    `;
    document.body.appendChild(lightbox);

    lightbox.querySelector('.viewer-close')?.addEventListener('click', closeLightbox);
    lightbox.querySelector('.viewer-backdrop')?.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeLightbox();
      }
    });
  }

  if (mainGalleryImage) {
    mainGalleryImage.addEventListener('click', () => openLightbox(selectedGalleryIndex));
    mainGalleryImage.parentElement?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(selectedGalleryIndex);
      }
    });
  }

  galleryButtons.forEach((button) => {
    button.addEventListener('click', () => updateGallery(Number(button.dataset.galleryIndex)));
  });

  // Size guide popup
  const sizeGuideButton = detailRoot.querySelector('#sizeGuideButton');
  const sizeGuidePopup = detailRoot.querySelector('#sizeGuidePopup');
  if (sizeGuideButton && sizeGuidePopup) {
    sizeGuideButton.addEventListener('click', () => {
      sizeGuidePopup.classList.toggle('hidden');
    });
    sizeGuidePopup.addEventListener('click', (e) => {
      if (e.target === sizeGuidePopup) sizeGuidePopup.classList.add('hidden');
    });
  }

  if (galleryRoot) {
    let touchStartX = null;
    galleryRoot.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });

    galleryRoot.addEventListener('touchend', (event) => {
      if (touchStartX === null) return;
      const distance = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(distance) > 40) {
        updateGallery(selectedGalleryIndex + (distance < 0 ? 1 : -1));
      }
      touchStartX = null;
    }, { passive: true });

    galleryRoot.addEventListener('pointermove', (event) => {
      if (window.innerWidth < 768) return;
      const rect = galleryRoot.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      mainGalleryImage.style.transformOrigin = `${x}% ${y}%`;
      mainGalleryImage.style.transform = 'scale(1.55)';
    });

    galleryRoot.addEventListener('pointerleave', () => {
      if (mainGalleryImage) {
        mainGalleryImage.style.transform = 'scale(1)';
        mainGalleryImage.style.transformOrigin = 'center center';
      }
    });
  }

  roomCategoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.roomCategory;
      const match = roomPreview.find((entry) => entry.category === target) || roomPreview[0];
      roomPreviewTitle.textContent = match.category;
      if (roomPreviewImage) {
        roomPreviewImage.src = match.image;
        roomPreviewImage.alt = `${match.category} demo`;
      }
      roomCategoryButtons.forEach((item) => item.classList.toggle('active', item === button));
    });
  });

  sizeSelect?.addEventListener('change', updateSelectedState);
  materialSelect?.addEventListener('change', updateSelectedState);
  detailRoot.querySelectorAll('.bundle-option').forEach((button) => {
    button.addEventListener('click', () => {
      currentQuantity = Number(button.dataset.bundleQuantity) || 1;
      detailRoot.querySelectorAll('.bundle-option').forEach((option) => option.classList.toggle('active', option === button));
      if (detailQuantityValue) detailQuantityValue.textContent = String(currentQuantity);
      updateSelectedState();
    });
  });
  detailRoot.querySelector('.detail-wishlist-button')?.addEventListener('click', (event) => {
    toggleWishlist(event.currentTarget.dataset.wishlistId);
  });
  updateWishlistButtons();
  updateSelectedState();

  detailButton?.addEventListener('click', () => {
    const selectedSize = getSelectedSize(product, sizeSelect?.value || defaultSize.label);
    const cartKey = `${product.id}-${selectedSize.label}`;
    const existing = parseCart().find((item) => item.cartKey === cartKey);
    const currentItem = {
      cartKey,
      id: product.id,
      name: product.name,
      image: product.image,
      price: selectedSize.price,
      size: selectedSize.label,
      quantity: currentQuantity + (existing ? existing.quantity : 0)
    };

    const cart = parseCart();
    const index = cart.findIndex((item) => item.cartKey === cartKey);
    if (index >= 0) {
      cart[index].quantity += currentQuantity;
    } else {
      cart.push(currentItem);
    }

    saveCart(cart);
    updateCartCount();
    showToast(`${product.name} added to cart`, 'success');
    window.location.href = 'cart.html';
  });

  mobileProductAddButton?.addEventListener('click', () => {
    const selectedSize = getSelectedSize(product, sizeSelect?.value || defaultSize.label);
    const message = `Hello Pixel Perfect, I want to order ${product.name} (${selectedSize.label}) for ₹${selectedSize.price}. Please confirm availability.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  });

  detailBuyButton?.addEventListener('click', () => {
    const selectedSize = getSelectedSize(product, sizeSelect?.value || defaultSize.label);
    const cart = parseCart();
    const cartKey = `${product.id}-${selectedSize.label}`;
    const index = cart.findIndex((item) => item.cartKey === cartKey);
    if (index >= 0) {
      cart[index].quantity += currentQuantity;
    } else {
      cart.push({
        cartKey,
        id: product.id,
        name: product.name,
        image: product.image,
        price: selectedSize.price,
        size: selectedSize.label,
        quantity: currentQuantity
      });
    }

    saveCart(cart);
    updateCartCount();
    showToast(`${product.name} added to cart`, 'success');
    window.location.href = 'checkout.html';
  });

  detailRoot.querySelectorAll('.qty-adjust').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      const nextValue = action === 'increase' ? currentQuantity + 1 : currentQuantity - 1;
      currentQuantity = Math.max(1, nextValue);
      if (detailQuantityValue) {
        detailQuantityValue.textContent = String(currentQuantity);
      }
    });
  });

  detailRoot.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      const answer = item?.querySelector('.faq-answer');
      if (!answer) return;
      item.classList.toggle('open');
      answer.style.maxHeight = item.classList.contains('open') ? `${answer.scrollHeight}px` : '0px';
    });
  });

  detailRoot.querySelectorAll('.faq-answer').forEach((answer) => {
    answer.style.maxHeight = answer.parentElement?.classList.contains('open') ? `${answer.scrollHeight}px` : '0px';
  });

  initRevealAnimation();
}

function renderCustomerReviews() {
  const reviewsGrid = document.getElementById('customerReviewsGrid');
  if (!reviewsGrid) return;

  const verifiedReviews = customerReviews.filter(isVerifiedPurchaseReview);
  reviewsGrid.innerHTML = verifiedReviews.length ? verifiedReviews
    .map((review, index) => {
      const initials = review.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
      return `
        <article class="customer-review-card" style="animation-delay: ${index * 0.1}s;">
          <div class="customer-review-content">
            <div class="review-stars-section">
              ${Array.from({ length: review.rating }, () => '<span class="star">★</span>').join('')}
            </div>
            <h3 class="customer-review-title">${review.title}</h3>
            <p class="customer-review-text">"${review.review}"</p>
            <div class="customer-info">
              <div class="customer-avatar">${initials}</div>
              <div class="customer-details">
                <p class="customer-name">
                  ${review.name}
                  ${isVerifiedPurchaseReview(review) ? '<span class="verified-badge">✓</span>' : ''}
                </p>
                <div class="customer-location">${review.location}</div>
                <div class="customer-product">${review.productBought}</div>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('') : '<div class="empty-review-state">Verified customer reviews will appear here after real orders are matched and approved.</div>';

  const form = document.getElementById('customerReviewForm');
  if (form && !form.dataset.bound) {
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submit = form.querySelector('button[type="submit"]');
      const send = async () => {
        const payload = {
          name: form.name.value.trim(), location: form.location.value.trim(), rating: Number(form.rating.value),
          title: form.title.value.trim(), review: form.review.value.trim(), productBought: form.productBought.value.trim(),
          category: form.category.value, orderId: form.orderId.value.trim(), orderPhone: form.orderPhone.value.trim()
        };
        const response = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Review submission failed.');
        form.reset();
        const message = document.getElementById('reviewFormMessage');
        if (message) message.textContent = data.message;
      };
      try {
        submit.disabled = true;
        await send();
        submit.disabled = false;
      } catch (error) {
        document.getElementById('reviewFormMessage').textContent = error.message;
        submit.disabled = false;
      }
    });
  }
}

function initHomeFaq() {
  document.querySelectorAll('.faq-accordion-toggle').forEach((button) => {
    const content = button.nextElementSibling;
    if (!content) return;

    if (button.classList.contains('is-open')) {
      content.style.maxHeight = `${content.scrollHeight}px`;
    }

    button.addEventListener('click', () => {
      const isOpen = button.classList.contains('is-open');

      document.querySelectorAll('.faq-accordion-toggle').forEach((otherButton) => {
        const otherContent = otherButton.nextElementSibling;
        otherButton.classList.remove('is-open');
        otherButton.setAttribute('aria-expanded', 'false');
        if (otherButton.querySelector('em')) {
          otherButton.querySelector('em').textContent = '+';
        }
        if (otherContent) {
          otherContent.style.maxHeight = '0px';
        }
      });

      if (!isOpen) {
        button.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        if (button.querySelector('em')) {
          button.querySelector('em').textContent = '−';
        }
        content.style.maxHeight = `${content.scrollHeight}px`;
      }
    });
  });
}

function initRevealAnimation() {
  document.querySelectorAll('.reveal').forEach((element) => {
    element.classList.add('is-visible');
    element.style.opacity = '1';
    element.style.transform = 'none';
  });
}

function initPremiumScrollTargets() {
  document.querySelectorAll('.reveal').forEach((element) => {
    element.classList.add('is-visible');
    element.style.opacity = '1';
    element.style.transform = 'none';
  });
}

function initImagePerformance() {
  document.querySelectorAll('main img:not(.hero-background-image):not([fetchpriority="high"])').forEach((image) => {
    if (!image.hasAttribute('loading')) image.loading = 'lazy';
    if (!image.hasAttribute('decoding')) image.decoding = 'async';
  });
}

function initGlobalAnimations() {
  const animatedTargets = document.querySelectorAll([
    'main > section',
    '.product-card',
    '.card',
    '.category-card',
    '.review-card',
    '.stat-card',
    '.experience-card',
    '.story-card',
    '.faq-item',
    '.collection-panel',
    '.editorial-pack-card',
    '.bundle-card',
    '.roadmap-card'
  ].join(','));

  animatedTargets.forEach((element, index) => {
    if (element.dataset.animReady === 'true') return;
    element.dataset.animReady = 'true';
    element.classList.add('site-animate');
    element.style.setProperty('--anim-delay', `${Math.min(index * 40, 220)}ms`);
  });
}

function initReviewSlider() {
  const slider = document.getElementById('reviewSlider');
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll('.review-slide'));
  const prevButton = document.getElementById('prevReview');
  const nextButton = document.getElementById('nextReview');

  if (!slides.length) return;

  let index = 0;

  const updateSlider = () => {
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('active', slideIndex === index);
    });
  };

  prevButton?.addEventListener('click', () => {
    index = (index - 1 + slides.length) % slides.length;
    updateSlider();
  });

  nextButton?.addEventListener('click', () => {
    index = (index + 1) % slides.length;
    updateSlider();
  });

  updateSlider();
}

function initWallBuilder() {
  const preview = document.getElementById('builderPreview');
  const countInput = document.getElementById('builderCount');
  const countValue = document.getElementById('builderCountValue');
  const priceRoot = document.getElementById('builderPrice');
  const labelRoot = document.getElementById('builderPreviewLabel');
  const sizeRoot = document.getElementById('builderPreviewSize');
  const previewCountRoot = document.getElementById('builderPreviewCount');
  const orderButton = document.getElementById('builderOrderButton');
  if (!preview || !countInput) return;

  const themeLabels = { cars: 'Cars', gaming: 'Gaming', motivation: 'Motivation', minimal: 'Minimal' };
  const layoutLabels = { grid: 'Balanced grid', feature: 'Feature wall', gallery: 'Gallery row' };
  const sizeLabels = { A5: 'A5 prints', A4: 'A4 prints', A3: 'A3 prints' };
  const basePrices = { A5: 399, A4: 549, A3: 799 };
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'custom') {
    document.querySelector('input[name="builderTheme"][value="minimal"]')?.click();
  }

  const render = () => {
    const theme = document.querySelector('input[name="builderTheme"]:checked')?.value || 'cars';
    const layout = document.querySelector('input[name="builderLayout"]:checked')?.value || 'grid';
    const size = document.getElementById('builderSize')?.value || 'A4';
    const count = Number(countInput.value);
    const price = basePrices[size] + Math.max(0, count - 9) * (size === 'A3' ? 48 : 32);
    preview.dataset.theme = theme;
    preview.dataset.layout = layout;
    preview.innerHTML = Array.from({ length: count }, (_, index) => `<span class="builder-tile" style="--tile-index: ${index}"><b>${String(index + 1).padStart(2, '0')}</b><small>${themeLabels[theme]}</small></span>`).join('');
    countValue.textContent = String(count);
    priceRoot.textContent = currency(price);
    labelRoot.textContent = `${themeLabels[theme]} · ${layoutLabels[layout]}`;
    sizeRoot.textContent = sizeLabels[size];
    previewCountRoot.textContent = `${count} posters`;
    const message = `Hello Pixel Perfect, I want to build a custom wall setup. Theme: ${themeLabels[theme]}. Layout: ${layoutLabels[layout]}. Size: ${size}. Posters: ${count}. Estimated price: ${currency(price)}.`;
    orderButton.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  document.querySelectorAll('input[name="builderTheme"], input[name="builderLayout"]').forEach((input) => input.addEventListener('change', render));
  document.getElementById('builderSize')?.addEventListener('change', render);
  countInput.addEventListener('input', render);
  render();
}

function initMembershipPage() {
  document.querySelectorAll('.membership-join[data-plan]').forEach((button) => {
    const plan = button.dataset.plan;
    const message = `Hello Pixel Perfect, I would like to join Pixel Club with the ${plan} plan. Please share the payment and activation details.`;
    const target = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    button.href = target;
    button.addEventListener('click', () => {
      localStorage.setItem(MEMBER_KEY, 'true');
      document.body.classList.add('member-mode');
      showToast('Member access unlocked', 'success');
    });
  });
}

async function initMain() {
  initMobileMenu();
  initCollaborationBrand();
  initProductTypeNavigation();
  initLucideIcons();
  updateCartCount();
  initWishlistNavigation();
  initImagePerformance();
  initGlobalAnimations();
  initPremiumScrollTargets();
  initRevealAnimation();
  initReviewSlider();

  try {
    await loadProducts();
  } catch (error) {
    console.error('Product catalog error:', error);
  }

  const page = document.body.dataset.page;
  if (page === 'home') {
    const reviewsLoaded = await loadCustomerReviews();
    if (!reviewsLoaded) console.warn('Reviews API unavailable; showing local verified reviews.');
    initMemberMode();
    initCountdownTimer();
    renderCustomerReviews();
    initHomeFaq();
    initCategoryChips();
    initControls();
    renderCatalog();
    renderCarCollection();
    renderReferenceCollection();
    renderMarvelCollection();
    renderDCCollection();
    renderFootballCollection();
    renderCricketCollection();
  }

  if (page === 'category') {
    renderCategoryPage();
  }

  if (page === 'product') {
    renderProductDetail();
  }

  if (page === 'cart') {
    renderCartPage();
  }

  if (page === 'wishlist') {
    renderWishlistPage();
  }

  if (page === 'builder') {
    initWallBuilder();
  }

  if (page === 'membership') {
    initMembershipPage();
  }

  if (page === 'checkout') {
    initCheckoutForm();
  }

  if (page === 'order-success') {
    loadOrderSuccessPage();
  }

  if (page === 'track-order') {
    initTrackOrderPage();
  }

  initLucideIcons();
}

// ========== ENHANCED INTERACTIVE FEATURES ==========

// Ripple effect for buttons
function initRippleEffects() {
  document.addEventListener('click', function(e) {
    const button = e.target.closest('.primary-button, .secondary, .add-button, button[type="submit"], button[type="button"]');
    if (!button) return;
    
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  });
}

// Lazy load images with intersection observer
function initLazyLoading() {
  if (!('IntersectionObserver' in window)) return;
  
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      
      const img = entry.target;
      const src = img.dataset.src || img.src;
      
      if (src) {
        const tempImg = new Image();
        tempImg.onload = () => {
          img.src = src;
          img.classList.add('loaded');
          obs.unobserve(img);
        };
        tempImg.onerror = () => {
          img.classList.add('error');
          obs.unobserve(img);
        };
        tempImg.src = src;
      }
    });
  }, { rootMargin: '50px' });
  
  document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
}

// Advanced search and filtering
const searchFiltering = {
  filters: {
    searchQuery: '',
    category: 'all',
    priceMin: 0,
    priceMax: 10000,
    sortBy: 'featured',
    sizes: [],
    ratings: []
  },
  
  applyFilters() {
    const productsToFilter = window.products && Array.isArray(window.products) && window.products.length > 0 ? window.products : products;
    if (!productsToFilter || !Array.isArray(productsToFilter)) return [];
    
    let results = [...productsToFilter];
    
    // Search query
    if (this.filters.searchQuery) {
      const query = this.filters.searchQuery.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }
    
    // Category filter
    if (this.filters.category && this.filters.category !== 'all') {
      results = results.filter(p => p.category === this.filters.category);
    }
    
    // Price filter
    results = results.filter(p => {
      const price = parseFloat(p.sizes?.[0]?.price ?? p.price ?? 0);
      return price >= this.filters.priceMin && price <= this.filters.priceMax;
    });
    
    // Rating filter
    if (this.filters.ratings.length > 0) {
      results = results.filter(p => {
        const rating = parseFloat(p.rating) || 0;
        return this.filters.ratings.some(r => rating >= r);
      });
    }
    
    // Sort results
    results = this.sortResults(results);
    
    return results;
  },
  
  sortResults(items) {
    const sorted = [...items];
    
    switch(this.filters.sortBy) {
      case 'price-low':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.sizes?.[0]?.price ?? a.price ?? 0);
          const priceB = parseFloat(b.sizes?.[0]?.price ?? b.price ?? 0);
          return priceA - priceB;
        });
        break;
      case 'price-high':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.sizes?.[0]?.price ?? a.price ?? 0);
          const priceB = parseFloat(b.sizes?.[0]?.price ?? b.price ?? 0);
          return priceB - priceA;
        });
        break;
      case 'rating':
        sorted.sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
        break;
      case 'newest':
        sorted.sort((a, b) => {
          // If newest field exists, use it; otherwise use position in array
          const aNewest = a.newest || 999;
          const bNewest = b.newest || 999;
          return bNewest - aNewest;
        });
        break;
      case 'featured':
      default:
        break;
    }
    
    return sorted;
  },
  
  setFilter(filterName, value) {
    if (filterName in this.filters) {
      this.filters[filterName] = value;
    }
  },
  
  getActiveFilters() {
    return Object.keys(this.filters).filter(key => {
      const value = this.filters[key];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value !== '' && value !== 'all' && value !== 'featured';
      return false;
    });
  },
  
  clearFilters() {
    this.filters = {
      searchQuery: '',
      category: 'all',
      priceMin: 0,
      priceMax: 10000,
      sortBy: 'featured',
      sizes: [],
      ratings: []
    };
  }
};

// Product comparison
const productComparison = {
  compareList: [],
  MAX_COMPARE: 4,
  
  addToCompare(productId) {
    if (this.compareList.includes(productId)) return false;
    if (this.compareList.length >= this.MAX_COMPARE) {
      showToast(`You can only compare up to ${this.MAX_COMPARE} products`, 'warning');
      return false;
    }
    this.compareList.push(productId);
    this.save();
    showToast('Added to comparison', 'success');
    return true;
  },
  
  removeFromCompare(productId) {
    const index = this.compareList.indexOf(productId);
    if (index > -1) {
      this.compareList.splice(index, 1);
      this.save();
      showToast('Removed from comparison', 'success');
      return true;
    }
    return false;
  },
  
  toggleCompare(productId) {
    if (this.compareList.includes(productId)) {
      this.removeFromCompare(productId);
    } else {
      this.addToCompare(productId);
    }
  },
  
  isInCompare(productId) {
    return this.compareList.includes(productId);
  },
  
  getCompareList() {
    if (!window.products) return [];
    return window.products.filter(p => this.compareList.includes(p.id));
  },
  
  save() {
    localStorage.setItem('pixel-perfect-compare', JSON.stringify(this.compareList));
  },
  
  load() {
    try {
      const saved = localStorage.getItem('pixel-perfect-compare');
      this.compareList = saved ? JSON.parse(saved) : [];
    } catch {
      this.compareList = [];
    }
  },
  
  clear() {
    this.compareList = [];
    this.save();
  }
};

// Cart recovery system
const cartRecovery = {
  STORAGE_KEY: 'pixel-perfect-cart-backup',
  RECOVERY_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  
  saveBackup(cart) {
    const backup = {
      items: cart,
      timestamp: Date.now(),
      recovered: false
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backup));
  },
  
  getBackup() {
    try {
      const backup = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      if (backup.timestamp && Date.now() - backup.timestamp < this.RECOVERY_TIMEOUT) {
        return backup;
      }
      this.clearBackup();
      return null;
    } catch {
      return null;
    }
  },
  
  restoreBackup() {
    const backup = this.getBackup();
    if (!backup || backup.recovered) return false;
    
    const currentCart = parseCart();
    backup.items.forEach(item => {
      const existing = currentCart.find(c => c.id === item.id && c.size === item.size);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        currentCart.push(item);
      }
    });
    
    saveCart(currentCart);
    backup.recovered = true;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backup));
    showToast('Cart restored from backup', 'success');
    return true;
  },
  
  clearBackup() {
    localStorage.removeItem(this.STORAGE_KEY);
  },
  
  hasBackup() {
    return this.getBackup() !== null;
  }
};

// Enhanced form validation
const formValidation = {
  validators: {
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    phone: (value) => /^[0-9]{10}$/.test(value.replace(/[^\d]/g, '')),
    pincode: (value) => /^[1-9][0-9]{5}$/.test(value),
    name: (value) => value && value.trim().length >= 2,
    address: (value) => value && value.trim().length >= 5,
    password: (value) => value && value.length >= 6,
    required: (value) => value && String(value).trim().length > 0
  },
  
  validateField(fieldName, value) {
    if (!(fieldName in this.validators)) return true;
    return this.validators[fieldName](value);
  },
  
  getErrorMessage(fieldName) {
    const messages = {
      email: 'Please enter a valid email address',
      phone: 'Please enter a valid 10-digit phone number',
      pincode: 'Please enter a valid 6-digit pincode',
      name: 'Name must be at least 2 characters',
      address: 'Address must be at least 5 characters',
      password: 'Password must be at least 6 characters',
      required: 'This field is required'
    };
    return messages[fieldName] || 'Invalid input';
  },
  
  validateForm(formElement) {
    if (!formElement) return false;
    let isValid = true;
    
    formElement.querySelectorAll('[required]').forEach(field => {
      const fieldName = field.name || field.id;
      const value = field.value;
      const fieldType = field.type || 'text';
      
      let validator = this.validators[fieldName] || this.validators[fieldType] || this.validators.required;
      const isFieldValid = validator(value);
      
      if (!isFieldValid) {
        field.classList.add('error');
        isValid = false;
      } else {
        field.classList.remove('error');
      }
    });
    
    return isValid;
  }
};

// Smooth page transitions
const pageTransitions = {
  enableTransitions() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]:not([href^="#"]):not([href^="javascript"])');
      if (!link || link.getAttribute('target') === '_blank') return;
      
      const href = link.getAttribute('href');
      if (!href || href.includes('mailto:') || href.includes('tel:')) return;
      
      // Allow default navigation, but add fade effect
      e.preventDefault();
      
      const pageContainer = document.querySelector('main, .page-content, #root');
      if (pageContainer) {
        pageContainer.classList.add('page-transition-exit');
        setTimeout(() => {
          window.location.href = href;
        }, 300);
      } else {
        window.location.href = href;
      }
    });
  }
};

// Performance utilities
const performanceUtils = {
  // Debounce function for search/filter events
  debounce(func, delay = 300) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },
  
  // Throttle function for scroll events
  throttle(func, limit = 100) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Request idle callback polyfill
  requestIdleCallback(callback) {
    if ('requestIdleCallback' in window) {
      return window.requestIdleCallback(callback);
    }
    return setTimeout(callback, 1);
  },
  
  // Prefetch resources
  prefetchResource(url, type = 'script') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = type;
    link.href = url;
    document.head.appendChild(link);
  },
  
  // Measure performance
  measurePerformance(label) {
    const startTime = performance.now();
    return {
      end() {
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        console.log(`${label}: ${duration}ms`);
        return duration;
      }
    };
  }
};

// Initialize all enhancements on page load
function initializeEnhancements() {
  // Initialize ripple effects
  initRippleEffects();
  
  // Initialize lazy loading
  initLazyLoading();
  
  // Add premium motion polish to page sections
  initHomePageMotion();
  initAdvancedMotion();
  
  // Load comparison list
  productComparison.load();
  
  // Initialize collaboration animations
  initCollaborationAnimations();
  
  // Check for cart backup and offer recovery
  performanceUtils.requestIdleCallback(() => {
    if (cartRecovery.hasBackup() && !localStorage.getItem('cart-recovery-shown')) {
      setTimeout(() => {
        const shouldRecover = confirm('We found your previous cart. Would you like to restore it?');
        if (shouldRecover) {
          cartRecovery.restoreBackup();
        }
        localStorage.setItem('cart-recovery-shown', 'true');
      }, 2000);
    }
  });
  
  // Setup smooth page transitions
  pageTransitions.enableTransitions();
  
  // Auto-save cart as backup
  setInterval(() => {
    const cart = parseCart();
    if (cart && cart.length > 0) {
      cartRecovery.saveBackup(cart);
    }
  }, 60000); // Every minute
}

// Collaboration animations
function initHomePageMotion() {
  const homePage = document.body.dataset.page === 'home';
  if (!homePage) return;

  const heroVisual = document.querySelector('.hero-visual');
  const motionCards = document.querySelectorAll('.visual-card, .stat-card, .collection-card, .review-card');

  motionCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 90}ms`;
  });

  if (heroVisual) {
    heroVisual.addEventListener('pointermove', (event) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (event.clientX - (rect.left + rect.width / 2)) / 22;
      const y = (event.clientY - (rect.top + rect.height / 2)) / 22;

      heroVisual.querySelectorAll('.visual-card').forEach((card, idx) => {
        const direction = idx === 0 ? -1 : idx === 1 ? 1 : 0.5;
        card.style.transform = `translate3d(${x * direction * 0.75}px, ${y * direction * 0.75}px, 0) rotate(${idx === 0 ? -4 : idx === 1 ? 4 : 0}deg)`;
      });
    });

    heroVisual.addEventListener('pointerleave', () => {
      heroVisual.querySelectorAll('.visual-card').forEach((card, idx) => {
        const def = idx === 0 ? 'rotate(-8deg)' : idx === 1 ? 'rotate(8deg)' : 'rotate(0deg)';
        card.style.transform = def;
      });
    });
  }
}

function initAdvancedMotion() {
  const animatedTargets = document.querySelectorAll(
    '.product-card, .card, .category-card, .stat-card, .review-card, .collection-panel'
  );

  animatedTargets.forEach((element, index) => {
    if (!element.classList.contains('reveal')) {
      element.classList.add('reveal');
    }

    element.style.transitionDelay = `${Math.min(index * 40, 180)}ms`;

    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - (rect.left + rect.width / 2)) / 18;
      const y = (event.clientY - (rect.top + rect.height / 2)) / 18;
      element.style.transform = `translate3d(${x * 0.7}px, ${y * 0.7}px, 0) rotateX(${y * -0.8}deg) rotateY(${x * 0.8}deg)`;
    });

    element.addEventListener('pointerleave', () => {
      element.style.transform = '';
    });
  });
}

function initCollaborationAnimations() {
  // Animate brand separator pulse
  const separators = document.querySelectorAll('.brand-separator');
  separators.forEach(sep => {
    sep.addEventListener('mouseenter', () => {
      sep.style.animation = 'none';
      setTimeout(() => {
        sep.style.animation = 'pulse 1.5s ease-in-out infinite';
      }, 10);
    });
  });

  // Add parallax to collaboration visual cards
  const collabCards = document.querySelectorAll('.collab-visual-card');
  if (collabCards.length > 0) {
    document.addEventListener('mousemove', (e) => {
      const x = (window.innerWidth / 2 - e.clientX) / 50;
      const y = (window.innerHeight / 2 - e.clientY) / 50;
      
      collabCards.forEach((card, index) => {
        const movement = index === 0 ? -1 : 1;
        card.style.transform = `rotate(${index === 0 ? -8 : 8}deg) translateX(${x * movement}px) translateY(${y * movement}px)`;
      });
    });
  }

  // Animate collaboration section on scroll into view
  const collabSections = document.querySelectorAll(
    '.collab-story-section, .collab-products-section, .collab-partners'
  );
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    collabSections.forEach(section => observer.observe(section));
  }

  // Count up animation for stats
  const statCards = document.querySelectorAll('.stat-card strong');
  statCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (card.textContent.includes('★') || card.textContent === 'WhatsApp') return;
      
      const text = card.textContent;
      if (text === '5★') {
        card.style.animation = 'none';
        setTimeout(() => {
          card.style.animation = 'heartBeat 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }, 10);
      }
    });
  });
}

// Utility to wait for products to be loaded
window.waitForProducts = function(callback) {
  if (window.products && Array.isArray(window.products) && window.products.length > 0) {
    callback();
  } else {
    const checkInterval = setInterval(() => {
      if (window.products && Array.isArray(window.products) && window.products.length > 0) {
        clearInterval(checkInterval);
        callback();
      }
    }, 50);
    
    // Timeout after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    products,
    getSelectedSize,
    getProductDisplayPrice,
    currency
  };
}

window.addEventListener('DOMContentLoaded', () => {
  hydrateGuestCart();
  initMain();
  initializeEnhancements();
});

window.addEventListener('beforeunload', () => {
  const cart = parseCart();
  if (cart.length > 0 && !window.checkoutInProgress) {
    setTimeout(() => {
      if (typeof cartAddonsModule !== 'undefined' && Math.random() < 0.5) {
        cartAddonsModule.showAbandonmentAlert();
      }
    }, 2000);
  }
});
