// Limited-Time Offers & Urgency Module
const urgencyModule = {
  activeSales: [
    {
      id: 'flash-sale-1',
      name: 'Flash Sale!',
      discount: 30,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      type: 'flash',
      productIds: ['porsche-setup', 'gaming-bundle', 'motivation-trio']
    },
    {
      id: 'weekend-special',
      name: 'Weekend Special',
      discount: 20,
      startTime: new Date(Date.now()),
      endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      type: 'weekend',
      productIds: []
    }
  ],

  stockLevels: {
    'porsche-setup': 5,
    'gaming-bundle': 8,
    'motivation-trio': 3,
    'automotive-collection': 12,
    'minimalist-set': 2
  },

  getActiveSales() {
    const now = Date.now();
    return this.activeSales.filter(sale => {
      const start = new Date(sale.startTime).getTime();
      const end = new Date(sale.endTime).getTime();
      return now >= start && now <= end;
    });
  },

  getSaleTimer(saleId) {
    const sale = this.activeSales.find(s => s.id === saleId);
    if (!sale) return null;

    const now = Date.now();
    const endTime = new Date(sale.endTime).getTime();
    const timeRemaining = endTime - now;

    if (timeRemaining <= 0) return null;

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      displayText: `${hours}h ${minutes}m ${seconds}s`,
      timeRemaining
    };
  },

  getStockLevel(productId) {
    const stock = this.stockLevels[productId];
    if (!stock) return null;

    return {
      level: stock,
      status: stock === 0 ? 'out-of-stock' : stock <= 3 ? 'low-stock' : 'in-stock',
      message: stock === 0 ? 'Out of Stock' : stock <= 3 ? `Only ${stock} left!` : 'In Stock'
    };
  },

  notifyRestock(productId, email) {
    const notifications = JSON.parse(localStorage.getItem('restockNotifications') || '{}');
    if (!notifications[productId]) notifications[productId] = [];
    
    if (!notifications[productId].includes(email)) {
      notifications[productId].push(email);
      localStorage.setItem('restockNotifications', JSON.stringify(notifications));
      showToast('🔔 We\'ll notify you when this item is back in stock!', 'success');
      return true;
    }
    return false;
  },

  renderFlashSaleWidget(containerId = 'flashSaleWidget') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const activeSales = this.getActiveSales();
    if (activeSales.length === 0) return;

    const sale = activeSales[0];
    const timer = this.getSaleTimer(sale.id);

    if (!timer) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="flash-sale-banner">
        <div class="flash-sale-content">
          <span class="flash-badge">⚡ ${sale.name}</span>
          <h2>${sale.discount}% OFF</h2>
          <p>Limited time only!</p>
        </div>
        
        <div class="sale-timer">
          <div class="timer-box">
            <span class="timer-value">${timer.hours}</span>
            <span class="timer-label">Hours</span>
          </div>
          <span class="timer-separator">:</span>
          <div class="timer-box">
            <span class="timer-value">${timer.minutes}</span>
            <span class="timer-label">Min</span>
          </div>
          <span class="timer-separator">:</span>
          <div class="timer-box">
            <span class="timer-value">${timer.seconds}</span>
            <span class="timer-label">Sec</span>
          </div>
        </div>

        <button class="primary-button" onclick="document.location.href='category.html'">
          Shop Sale
        </button>
      </div>
    `;

    // Update timer every second
    setInterval(() => {
      const updated = this.getSaleTimer(sale.id);
      if (updated) {
        container.querySelector('.timer-value:nth-of-type(1)').textContent = updated.hours;
        container.querySelector('.timer-value:nth-of-type(2)').textContent = updated.minutes;
        container.querySelector('.timer-value:nth-of-type(3)').textContent = updated.seconds;
      }
    }, 1000);
  },

  renderStockUrgency(productId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stock = this.getStockLevel(productId);
    if (!stock) return;

    const className = `stock-urgency stock-${stock.status}`;
    
    container.innerHTML = `
      <div class="${className}">
        ${stock.status === 'low-stock' ? `
          <span class="urgency-icon">⚠️</span>
          <span class="urgency-text">${stock.message}</span>
        ` : stock.status === 'out-of-stock' ? `
          <div class="out-of-stock">
            <span class="oos-text">${stock.message}</span>
            <button class="notify-btn" onclick="urgencyModule.notifyRestock('${productId}', prompt('Enter your email:'))">
              Notify Me
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  renderUrgencyBadges(productId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const badges = [];
    const stock = this.getStockLevel(productId);
    
    if (stock && stock.status === 'low-stock') {
      badges.push(`<span class="badge badge-urgent">${stock.message}</span>`);
    }

    // Check if product is in a flash sale
    const sales = this.getActiveSales();
    sales.forEach(sale => {
      if (sale.productIds.includes(productId)) {
        const timer = this.getSaleTimer(sale.id);
        if (timer) {
          badges.push(`<span class="badge badge-sale">${sale.discount}% OFF • ${timer.displayText}</span>`);
        }
      }
    });

    if (badges.length > 0) {
      container.innerHTML = `<div class="urgency-badges">${badges.join('')}</div>`;
    }
  }
};

// Initialize flash sale widget
document.addEventListener('DOMContentLoaded', () => {
  urgencyModule.renderFlashSaleWidget();
  
  // Update flash sale timer every second
  setInterval(() => {
    urgencyModule.renderFlashSaleWidget();
  }, 1000);
});
