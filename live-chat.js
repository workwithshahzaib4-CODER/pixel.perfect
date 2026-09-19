// Live Chat Support Bot
const chatBotModule = {
  // Predefined responses
  responses: {
    greetings: ['Hi there! 👋', 'Hello! How can I help you?', 'Welcome! What can I do for you?'],
    shipping: [
      'We dispatch orders within 24 hours! Standard delivery takes 3-5 working days.',
      'Shipping is ₹99 for orders under ₹2000. Free shipping on orders above ₹2000!',
      'You can track your order using the tracking link sent to your email.'
    ],
    return: [
      'We offer 30-day returns on all products in original condition.',
      'Just contact support@pixelperfect.com with your order ID for returns.',
      'Returns & refunds are processed within 7-10 days.'
    ],
    payment: [
      'We accept all major credit/debit cards, UPI, net banking, and wallets.',
      'Payments are 100% secure with SSL encryption.',
      'You can also choose Buy Now Pay Later options.'
    ],
    products: [
      'We have automotive, motivation, gaming, and sports poster collections!',
      'Check out our Wall Setup Packs - they come with multiple matching posters.',
      'Our custom poster builder lets you upload your own images!'
    ],
    custom: [
      'Our custom poster builder is easy to use! Just upload your image, select size, and add to cart.',
      'We support JPG, PNG, and WebP formats up to 10MB.',
      'You can choose between matte and glossy finishes, and add optional frames.'
    ],
    loyalty: [
      'Join Pixel Club! Earn points on every purchase and unlock exclusive benefits.',
      'Points can be redeemed for discounts on future orders.',
      'Members get up to 20% OFF and free express shipping!'
    ]
  },

  // Intent detection
  detectIntent(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) return 'greetings';
    if (msg.includes('ship') || msg.includes('delivery') || msg.includes('track')) return 'shipping';
    if (msg.includes('return') || msg.includes('refund') || msg.includes('exchange')) return 'return';
    if (msg.includes('payment') || msg.includes('pay') || msg.includes('card')) return 'payment';
    if (msg.includes('product') || msg.includes('poster') || msg.includes('collection')) return 'products';
    if (msg.includes('custom') || msg.includes('upload') || msg.includes('design')) return 'custom';
    if (msg.includes('loyalty') || msg.includes('points') || msg.includes('club') || msg.includes('member')) return 'loyalty';
    
    return 'general';
  },

  // Get random response
  getResponse(intent) {
    const responses = this.responses[intent] || [
      'Thanks for your question! Please contact support@pixelperfect.com for detailed assistance.',
      'I\'m here to help! Can you provide more details about your question?'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  },

  // Initialize chat
  initChat() {
    const container = document.getElementById('chatBot');
    if (!container) return;

    container.innerHTML = `
      <div class="chat-widget">
        <div class="chat-header">
          <h3>💬 PIXEL PERFECT Support</h3>
          <button class="chat-close" onclick="chatBotModule.closeChat()">✕</button>
        </div>
        
        <div class="chat-messages" id="chatMessages">
          <div class="chat-message bot">
            <div class="message-content">
              👋 Hi! Welcome to PIXEL PERFECT support. How can I help you today?
            </div>
          </div>
          <div class="chat-message bot">
            <div class="message-content">
              Ask me about: shipping, returns, payments, products, custom posters, or loyalty program!
            </div>
          </div>
        </div>
        
        <div class="chat-input-area">
          <input 
            type="text" 
            id="chatInput" 
            placeholder="Type your message..." 
            class="chat-input"
            onkeypress="event.key === 'Enter' && chatBotModule.sendMessage()"
          />
          <button class="chat-send" onclick="chatBotModule.sendMessage()">Send</button>
        </div>
      </div>

      <button class="chat-toggle" onclick="chatBotModule.toggleChat()" id="chatToggle">
        💬
      </button>
    `;

    this.attachEventListeners();
  },

  attachEventListeners() {
    const input = document.getElementById('chatInput');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }
  },

  sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input || !input.value.trim()) return;

    const message = input.value.trim();
    const messagesContainer = document.getElementById('chatMessages');

    // Add user message
    const userMessageEl = document.createElement('div');
    userMessageEl.className = 'chat-message user';
    userMessageEl.innerHTML = `<div class="message-content">${message}</div>`;
    messagesContainer.appendChild(userMessageEl);

    input.value = '';

    // Detect intent and respond
    setTimeout(() => {
      const intent = this.detectIntent(message);
      const response = this.getResponse(intent);

      const botMessageEl = document.createElement('div');
      botMessageEl.className = 'chat-message bot';
      botMessageEl.innerHTML = `<div class="message-content">${response}</div>`;
      messagesContainer.appendChild(botMessageEl);

      // Auto scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 500);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  toggleChat() {
    const widget = document.querySelector('.chat-widget');
    const toggle = document.getElementById('chatToggle');
    
    if (widget) {
      widget.classList.toggle('minimized');
      toggle.classList.toggle('minimized');
    }
  },

  closeChat() {
    this.toggleChat();
  }
};

// Initialize chat on page load
document.addEventListener('DOMContentLoaded', () => {
  if (document.body.innerHTML.includes('chatBot')) {
    chatBotModule.initChat();
  }
});
