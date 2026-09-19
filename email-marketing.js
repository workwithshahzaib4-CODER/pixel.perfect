// Email Marketing & Notifications System
const emailMarketingModule = {
  templates: {
    welcome: {
      subject: '🎉 Welcome to PIXEL PERFECT! 10% OFF your first order',
      body: `
        Hi [NAME],

        Welcome to PIXEL PERFECT! We're thrilled to have you join our community of poster lovers.

        As a welcome gift, use code: WELCOME10
        Get 10% OFF your first order!

        Explore our curated collections:
        - Automotive Wall Collections
        - Motivation & Fitness Posters
        - Gaming & Entertainment Setups
        - Sports & Legends Collections

        Click here to start shopping: [SHOP_LINK]

        Questions? We're here to help at support@pixelperfect.com

        Happy decorating!
        The PIXEL PERFECT Team
      `
    },

    orderConfirmation: {
      subject: '✓ Order Confirmed! Your Order #[ORDER_ID]',
      body: `
        Hi [NAME],

        Great! Your order has been confirmed.

        Order ID: [ORDER_ID]
        Total: ₹[TOTAL]
        Estimated Delivery: [DELIVERY_DATE]

        You'll receive a tracking link soon. Meanwhile, check out related items you might like:
        [RECOMMENDATIONS]

        Track your order: [TRACK_LINK]

        Thanks for your purchase!
        The PIXEL PERFECT Team
      `
    },

    abandoned: {
      subject: '😢 Don\'t forget your cart! 15% OFF code inside',
      body: `
        Hi [NAME],

        You left some amazing posters in your cart!

        Items in your cart:
        [CART_ITEMS]

        Don't miss out! Use code: CARTBACK15
        Get 15% OFF - This offer expires in 24 hours

        Complete your order: [CART_LINK]

        Questions about sizing or materials? Check our FAQ: [FAQ_LINK]

        The PIXEL PERFECT Team
      `
    },

    shipmentUpdate: {
      subject: '📦 Your order is on its way! [ORDER_ID]',
      body: `
        Hi [NAME],

        Exciting news! Your order has shipped!

        Order ID: [ORDER_ID]
        Tracking Number: [TRACKING_NO]
        Expected Delivery: [DELIVERY_DATE]

        Track your package: [TRACKING_LINK]

        While you wait, explore our new arrivals: [NEW_PRODUCTS]

        The PIXEL PERFECT Team
      `
    },

    review: {
      subject: '⭐ Share your experience! Earn 50 Loyalty Points',
      body: `
        Hi [NAME],

        We'd love to hear what you think about your recent order!

        Order: [ORDER_ID]

        Leave a review and earn 50 loyalty points + be featured on our gallery!

        Write a review: [REVIEW_LINK]

        Your feedback helps us improve!

        The PIXEL PERFECT Team
      `
    },

    newsletter: {
      subject: '✨ This week at PIXEL PERFECT: New Designs & Exclusive Offers',
      body: `
        Hi [NAME],

        Here's what's new this week:

        🎨 NEW COLLECTIONS:
        [NEW_PRODUCTS]

        💰 EXCLUSIVE DEALS:
        [FEATURED_DEALS]

        🏆 TRENDING NOW:
        [TRENDING_PRODUCTS]

        👥 MEMBER EXCLUSIVE:
        [MEMBER_DEALS]

        Shop now: [SHOP_LINK]
        Manage preferences: [PREFS_LINK]

        The PIXEL PERFECT Team
      `
    }
  },

  getSubscribers() {
    try {
      const subscribers = JSON.parse(localStorage.getItem('emailSubscribers') || '[]');
      return Array.isArray(subscribers) ? subscribers : [];
    } catch (error) {
      return [];
    }
  },

  saveSubscribers(subscribers) {
    localStorage.setItem('emailSubscribers', JSON.stringify(subscribers));
  },

  subscribe(email, name = '') {
    const subscribers = this.getSubscribers();

    if (!email || subscribers.some((s) => s.email === email)) {
      showToast('Already subscribed with this email', 'info');
      return false;
    }

    subscribers.push({
      email,
      name,
      joinDate: new Date().toISOString(),
      preferences: {
        weekly: true,
        promotions: true,
        newProducts: true,
        reviews: true
      }
    });

    this.saveSubscribers(subscribers);
    showToast('✨ Thanks for subscribing! Check your email for welcome offer', 'success');
    return true;
  },

  unsubscribe(email) {
    let subscribers = this.getSubscribers();
    subscribers = subscribers.filter((s) => s.email !== email);
    this.saveSubscribers(subscribers);
    showToast('Unsubscribed', 'info');
  },

  async sendEmail(email, templateName, data = {}) {
    const template = this.templates[templateName];
    if (!template) {
      console.error('Template not found:', templateName);
      return false;
    }

    let body = template.body;
    let subject = template.subject;

    Object.keys(data).forEach((key) => {
      const placeholder = new RegExp(`\\[${key}\\]`, 'g');
      subject = subject.replace(placeholder, String(data[key]));
      body = body.replace(placeholder, String(data[key]));
    });

    console.log('📧 Email sent:', { email, subject, body });
    this.addEmailToHistory(email, templateName, subject);
    return true;
  },

  addEmailToHistory(email, template, subject) {
    try {
      const history = JSON.parse(localStorage.getItem('emailHistory') || '[]');
      history.push({
        email,
        template,
        subject,
        sentDate: new Date().toISOString(),
        status: 'sent'
      });
      localStorage.setItem('emailHistory', JSON.stringify(history.slice(-100)));
    } catch (error) {
      console.warn('Email history unavailable:', error.message);
    }
  },

  triggerWelcomeEmail(userId, email, name) {
    return this.sendEmail(email, 'welcome', {
      NAME: name,
      WELCOME10: 'WELCOME10',
      SHOP_LINK: '/index.html'
    });
  },

  triggerOrderConfirmation(userId, email, order) {
    return this.sendEmail(email, 'orderConfirmation', {
      NAME: order.customerName,
      ORDER_ID: order.id,
      TOTAL: order.total,
      DELIVERY_DATE: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      TRACK_LINK: `/track-order.html?id=${order.id}`
    });
  },

  triggerAbandonedCart(email, cartItems, cartTotal) {
    const itemsList = cartItems.map((item) => `• ${item.name} - ₹${item.price}`).join('\n');

    return this.sendEmail(email, 'abandoned', {
      NAME: 'Valued Customer',
      CART_ITEMS: itemsList,
      CARTBACK15: 'CARTBACK15',
      CART_LINK: '/cart.html',
      FAQ_LINK: '/support.html'
    });
  },

  triggerShipmentUpdate(email, order, trackingNumber) {
    return this.sendEmail(email, 'shipmentUpdate', {
      NAME: order.customerName,
      ORDER_ID: order.id,
      TRACKING_NO: trackingNumber,
      DELIVERY_DATE: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      TRACKING_LINK: `https://tracking.example.com/${trackingNumber}`,
      NEW_PRODUCTS: 'pixelperfect.com/new'
    });
  },

  triggerReviewRequest(email, order) {
    return this.sendEmail(email, 'review', {
      NAME: order.customerName,
      ORDER_ID: order.id,
      REVIEW_LINK: `/product.html?id=${order.items[0].id}#reviews`
    });
  },

  async sendWeeklyNewsletter() {
    const subscribers = this.getSubscribers();
    const weeklySubscribers = subscribers.filter((s) => s.preferences && s.preferences.weekly);

    const newProducts = products.slice(0, 3).map((p) => `• ${p.name} - ₹${Math.min(...p.sizes.map((s) => s.price))}`).join('\n');
    const trendingProducts = products
      .slice()
      .sort((a, b) => (b.purchases || 0) - (a.purchases || 0))
      .slice(0, 3)
      .map((p) => `• ${p.name}`)
      .join('\n');

    for (const subscriber of weeklySubscribers) {
      await this.sendEmail(subscriber.email, 'newsletter', {
        NAME: subscriber.name || 'Friend',
        NEW_PRODUCTS: newProducts,
        FEATURED_DEALS: '• Save 20% on Collections\n• Free shipping on orders over ₹2000',
        TRENDING_PRODUCTS: trendingProducts,
        MEMBER_DEALS: '• Platinum Members: 20% OFF all orders\n• Free express shipping',
        SHOP_LINK: '/index.html',
        PREFS_LINK: '/preferences.html'
      });
    }

    console.log(`📧 Newsletter sent to ${weeklySubscribers.length} subscribers`);
  },

  renderSubscriptionForm(containerId = 'newsletterForm') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="newsletter-form">
        <h3>✨ Stay Updated</h3>
        <p>Get weekly inspiration, exclusive offers & new designs</p>
        <form onsubmit="emailMarketingModule.handleSubscribe(event)">
          <input type="email" placeholder="Your email" required class="newsletter-email-input" />
          <input type="text" placeholder="Your name (optional)" class="newsletter-name-input" />
          <button type="submit" class="newsletter-submit-btn">Subscribe & Get 10% OFF</button>
        </form>
        <p class="newsletter-disclaimer">We respect your privacy. Unsubscribe anytime.</p>
      </div>
    `;
  },

  handleSubscribe(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.querySelector('.newsletter-email-input').value.trim();
    const name = form.querySelector('.newsletter-name-input').value.trim();

    if (this.subscribe(email, name)) {
      form.reset();
    }
  }
};

function checkAbandonedCart() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const lastCartTime = localStorage.getItem('cartTime');

  if (cart.length > 0 && lastCartTime) {
    const timeSinceCart = Date.now() - parseInt(lastCartTime, 10);
    if (timeSinceCart > 2 * 60 * 60 * 1000) {
      const email = localStorage.getItem('userEmail');
      if (email) {
        const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
        emailMarketingModule.triggerAbandonedCart(email, cart, total);
        localStorage.removeItem('cartTime');
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAbandonedCart();
  emailMarketingModule.renderSubscriptionForm('newsletterForm');
  emailMarketingModule.renderSubscriptionForm('footerNewsletter');
});
