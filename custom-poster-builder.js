// Custom Poster Builder Module
const customPosterBuilder = {
  // Poster size options with prices (based on Posterized pricing)
  sizes: [
    { id: 'a5', name: 'A5', dimensions: '5.8" × 8.3"', price: 79 },
    { id: 'a4', name: 'A4', dimensions: '8.3" × 11.7"', price: 129 },
    { id: 'a3', name: 'A3', dimensions: '11.7" × 16.5"', price: 199 },
    { id: '13x19', name: '13" × 19"', dimensions: '33cm × 48cm', price: 299 },
    { id: '18x24', name: '18" × 24"', dimensions: '46cm × 61cm', price: 399 },
    { id: '24x36', name: '24" × 36"', dimensions: '61cm × 91cm', price: 599 }
  ],

  // Frame options with prices
  frames: {
    none: { name: 'No Frame', price: 0 },
    wood: { name: 'Wooden Frame', price: 299 },
    black: { name: 'Black Frame', price: 249 }
  },

  // Current selections
  selections: {
    image: null,
    imageData: null,
    size: 'a4',
    finish: 'matte',
    frame: 'none'
  },

  init() {
    this.setupEventListeners();
    this.renderSizeOptions();
  },

  setupEventListeners() {
    const uploadZone = document.getElementById('uploadZone');
    const posterImageInput = document.getElementById('posterImageInput');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const addCartBtn = document.getElementById('addCustomPosterBtn');

    if (!uploadZone || !posterImageInput) return;

    // Upload zone click with scale animation
    uploadZone.addEventListener('click', () => {
      uploadZone.classList.add('click-pulse');
      setTimeout(() => uploadZone.classList.remove('click-pulse'), 600);
      posterImageInput.click();
    });

    // Hover effects
    uploadZone.addEventListener('mouseenter', () => {
      uploadZone.classList.add('hover-lift');
    });

    uploadZone.addEventListener('mouseleave', () => {
      uploadZone.classList.remove('hover-lift', 'dragover');
    });

    // Drag and drop with enhanced visual feedback
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleImageUpload(files[0]);
      }
    });

    // File input change
    posterImageInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleImageUpload(e.target.files[0]);
      }
    });

    // Remove image
    if (removeImageBtn) {
      removeImageBtn.addEventListener('click', () => this.removeImage());
    }

    // Size options with animation
    document.getElementById('sizeOptions')?.addEventListener('change', (e) => {
      if (e.target.name === 'posterSize') {
        const selectedOption = e.target.closest('.size-option');
        if (selectedOption) {
          selectedOption.classList.add('selected-bounce');
        }
        this.selections.size = e.target.value;
        this.updatePrice();
      }
    });

    // Frame options animation
    document.getElementById('sizeOptions')?.addEventListener('change', (e) => {
      if (e.target.name === 'posterSize') {
        // Animate all size options
        document.querySelectorAll('.size-option').forEach(opt => {
          opt.style.animation = 'none';
          setTimeout(() => {
            opt.style.animation = opt.querySelector('input:checked') ? 'sizeSelected 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : '';
          }, 10);
        });
      }
    });

    // Customization options
    document.addEventListener('change', (e) => {
      if (e.target.name === 'finish') {
        this.selections.finish = e.target.value;
      } else if (e.target.name === 'frame') {
        this.selections.frame = e.target.value;
        this.updateFrameDisplay();
        this.updatePrice();
      }
    });

    // Add to cart
    if (addCartBtn) {
      addCartBtn.addEventListener('click', () => this.addToCart());
    }
  },

  handleImageUpload(file) {
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Please upload a JPG, PNG, or WebP image', 'error');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be less than 10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.selections.image = file.name;
      this.selections.imageData = e.target.result;
      this.displayPreview(e.target.result);
      showToast('Image uploaded successfully!', 'success');
    };

    reader.readAsDataURL(file);
  },

  displayPreview(imageData) {
    const preview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');

    if (preview && previewImage) {
      previewImage.src = imageData;
      preview.style.display = 'block';

      // Animate preview
      preview.style.animation = 'none';
      setTimeout(() => {
        preview.style.animation = 'imageSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }, 10);
    }
  },

  removeImage() {
    this.selections.image = null;
    this.selections.imageData = null;

    const preview = document.getElementById('imagePreview');
    const input = document.getElementById('posterImageInput');

    if (preview) preview.style.display = 'none';
    if (input) input.value = '';

    showToast('Image removed', 'info');
  },

  renderSizeOptions() {
    const sizeOptions = document.getElementById('sizeOptions');
    if (!sizeOptions) return;

    sizeOptions.innerHTML = this.sizes.map((size, idx) => `
      <div class="size-option" style="animation-delay: ${idx * 0.08}s">
        <input 
          type="radio" 
          id="size-${size.id}" 
          name="posterSize" 
          value="${size.id}"
          ${size.id === this.selections.size ? 'checked' : ''}
        />
        <label for="size-${size.id}" class="size-label">
          <span class="size-name">${size.name}</span>
          <span class="size-dimensions">${size.dimensions}</span>
        </label>
        <div class="size-price-badge">₹${size.price}</div>
      </div>
    `).join('');

    this.updatePrice();
  },

  updateFrameDisplay() {
    const frameRow = document.getElementById('frameRow');
    if (frameRow) {
      frameRow.style.display = this.selections.frame !== 'none' ? 'flex' : 'none';
    }
  },

  updatePrice() {
    const selectedSize = this.sizes.find(s => s.id === this.selections.size);
    let framePrice = 0;

    if (this.selections.frame !== 'none') {
      framePrice = this.frames[this.selections.frame].price;
    }

    const posterPrice = selectedSize ? selectedSize.price : 0;
    const total = posterPrice + framePrice;

    // Update price displays with animation
    const posterPriceEl = document.getElementById('posterPrice');
    const framePriceEl = document.getElementById('framePrice');
    const totalPriceEl = document.getElementById('totalPrice');

    if (posterPriceEl) {
      posterPriceEl.classList.add('price-updating');
      setTimeout(() => {
        posterPriceEl.textContent = `₹${posterPrice}`;
        posterPriceEl.classList.remove('price-updating');
      }, 150);
    }
    if (framePriceEl) {
      framePriceEl.classList.add('price-updating');
      setTimeout(() => {
        framePriceEl.textContent = `₹${framePrice}`;
        framePriceEl.classList.remove('price-updating');
      }, 150);
    }
    if (totalPriceEl) {
      totalPriceEl.classList.add('price-updating');
      setTimeout(() => {
        totalPriceEl.textContent = `₹${total}`;
        totalPriceEl.classList.remove('price-updating');
      }, 150);
    }

    this.updateFrameDisplay();
  },

  addToCart() {
    // Validate image is uploaded
    if (!this.selections.imageData) {
      showToast('Please upload an image first', 'error');
      return;
    }

    const addBtn = document.getElementById('addCustomPosterBtn');
    if (addBtn) {
      addBtn.classList.add('btn-loading');
      addBtn.disabled = true;
    }

    const selectedSize = this.sizes.find(s => s.id === this.selections.size);
    let framePrice = 0;

    if (this.selections.frame !== 'none') {
      framePrice = this.frames[this.selections.frame].price;
    }

    // Create custom poster cart item
    const cartKey = `custom-poster-${selectedSize.id}-${Date.now()}`;
    const cartItem = {
      cartKey,
      id: `custom-poster-${selectedSize.id}`,
      name: `Custom Poster (${selectedSize.name})`,
      image: this.selections.imageData,
      price: selectedSize.price + framePrice,
      size: selectedSize.name,
      quantity: 1,
      isCustom: true,
      customImage: this.selections.imageData,
      customImageName: this.selections.image,
      finish: this.selections.finish,
      frame: this.selections.frame,
      framePrice: framePrice,
      posterPrice: selectedSize.price
    };

    // Get existing cart
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Add new item
    cart.push(cartItem);
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    showToast(`✨ Custom poster added to cart! ₹${cartItem.price}`, 'success');

    // Update cart count if available
    if (typeof updateCartCount === 'function') {
      updateCartCount();
    }

    // Redirect to cart after 1 second
    setTimeout(() => {
      window.location.href = 'cart.html';
    }, 1000);

    // Reset form
    this.removeImage();
    this.selections.size = 'a4';
    this.selections.finish = 'matte';
    this.selections.frame = 'none';
    this.renderSizeOptions();
  }
};

// Initialize custom poster builder when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('sizeOptions')) {
    customPosterBuilder.init();
  }
});
