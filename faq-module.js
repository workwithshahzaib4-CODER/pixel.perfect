// FAQ Accordion System
const faqModule = {
  faqs: [
    {
      category: 'Sizing & Dimensions',
      items: [
        {
          question: 'What size poster should I get?',
          answer: 'The right size depends on your space and wall dimensions. A4 is perfect for small rooms and desks, A3 for medium walls, and 13"x19" or larger for statement walls. Use our Size Guide tool to visualize different sizes in your room!'
        },
        {
          question: 'Do you have custom sizes?',
          answer: 'Yes! Our custom poster builder allows you to upload your own image and choose from 6 standard sizes (A5 to 24"x36"). You can also contact support for special custom dimensions.'
        },
        {
          question: 'How do I measure my wall for the right size?',
          answer: 'Measure your wall width in inches. The poster should typically be 60-80% of the wall width. Use this formula: Wall Width × 0.7 = Ideal Poster Width. Check our size guide for visual references!'
        }
      ]
    },
    {
      category: 'Shipping & Delivery',
      items: [
        {
          question: 'How long does shipping take?',
          answer: 'Standard shipping takes 3-5 working days within India. Metro cities may get delivery in 2-3 days. Express shipping available for ₹199 with 24-48 hour delivery. Free shipping on orders over ₹2000!'
        },
        {
          question: 'Do you ship internationally?',
          answer: 'Currently we ship within India. International shipping is coming soon! Subscribe to our newsletter to get updates on expansion.'
        },
        {
          question: 'Can I track my order?',
          answer: 'Absolutely! You\'ll receive a tracking link via email and SMS as soon as your order ships. You can track it in real-time on our tracking page or via your account dashboard.'
        },
        {
          question: 'What if my order doesn\'t arrive?',
          answer: 'We guarantee delivery! If your order doesn\'t arrive within the estimated time, contact our support team and we\'ll investigate immediately. You\'re covered by our 30-day delivery guarantee.'
        }
      ]
    },
    {
      category: 'Returns & Refunds',
      items: [
        {
          question: 'What is your return policy?',
          answer: 'We offer 30-day returns on all products in original condition. If you\'re not satisfied, simply contact support@pixelperfect.com with your order ID and photos. Returns are free!'
        },
        {
          question: 'How long does a refund take?',
          answer: 'Once we receive your return, refunds are processed within 7-10 working days. The refund goes back to your original payment method.'
        },
        {
          question: 'What about damaged products?',
          answer: 'We pack carefully, but accidents happen! If your order arrives damaged, contact us within 48 hours with photos. We\'ll replace it for free or issue a full refund, your choice.'
        },
        {
          question: 'Can I exchange a product?',
          answer: 'Yes! You can exchange for a different size, design, or finish within 30 days. Just contact support and we\'ll arrange it at no extra cost.'
        }
      ]
    },
    {
      category: 'Product Quality',
      items: [
        {
          question: 'What material are the posters printed on?',
          answer: 'Our posters are premium 240gsm art paper with eco-friendly inks. Choose between matte (non-reflective) or glossy (vibrant) finishes. All materials are sustainably sourced.'
        },
        {
          question: 'Are your prints fade-resistant?',
          answer: 'Yes! Our archival-quality inks are designed to last 10+ years without fading. They\'re also UV-resistant, making them perfect for sunny rooms.'
        },
        {
          question: 'Can I laminate or frame the posters?',
          answer: 'Absolutely! Posters work great with standard frames (available at any art supply store). We also offer optional wooden and metal frames during checkout for a complete look.'
        },
        {
          question: 'How do I care for my posters?',
          answer: 'Keep them away from direct sunlight and moisture. Dust gently with a soft cloth. Framing extends their life significantly. Avoid touching the printed side!'
        }
      ]
    },
    {
      category: 'Payment & Coupons',
      items: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards, debit cards, UPI, net banking, and digital wallets. We also offer Cash on Delivery (COD) for your convenience. Razorpay powers our secure payment gateway.'
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Yes! We use bank-grade SSL encryption and PCI-DSS compliance. Your payment data is never stored on our servers. Trust badges guarantee 100% secure transactions.'
        },
        {
          question: 'How do I use a coupon code?',
          answer: 'Enter your coupon code in the checkout page before confirming payment. The discount applies automatically. Check our promotions page for current active codes!'
        },
        {
          question: 'Do you have loyalty rewards?',
          answer: 'Yes! Every purchase earns loyalty points. Join Pixel Club (free!) to earn 5% points on all orders, with Bronze tier at 5% off, up to Platinum at 20% off. Redeem points for discounts!'
        }
      ]
    },
    {
      category: 'Custom Poster Builder',
      items: [
        {
          question: 'How does the custom poster builder work?',
          answer: 'Upload your image (JPG, PNG, WebP - max 10MB), choose your size (A5 to 24"x36"), select finish (matte/glossy) and frame option. We print and ship your custom design in 3-5 days!'
        },
        {
          question: 'What image formats do you accept?',
          answer: 'We support JPG, PNG, and WebP formats. Max file size is 10MB. Higher resolution images (300 DPI) produce better quality prints.'
        },
        {
          question: 'Can I preview my custom poster before ordering?',
          answer: 'Yes! The builder shows you a live preview as you select options. You can see exactly what your poster will look like before checkout.'
        },
        {
          question: 'How long does custom printing take?',
          answer: 'Custom orders are printed and shipped within 3-5 working days. Rush printing (1-2 days) available for ₹99 extra.'
        }
      ]
    },
    {
      category: 'Bundles & Offers',
      items: [
        {
          question: 'What savings can I get with bundles?',
          answer: 'Our bundles offer 25-33% savings! Buy 2+ posters for 10% off, 3+ for 15% off, 5+ for 20% off. Volume discounts apply automatically at checkout.'
        },
        {
          question: 'Are seasonal offers always available?',
          answer: 'Seasonal offers vary! Check our homepage for current deals. Newsletter subscribers get exclusive early access to sales and limited-time offers.'
        },
        {
          question: 'Can I combine coupons with bundle deals?',
          answer: 'Some coupons can be combined with bundles! Check the coupon terms. Loyalty tier discounts always stack with other offers for maximum savings.'
        }
      ]
    },
    {
      category: 'Account & Wishlist',
      items: [
        {
          question: 'How do I create an account?',
          answer: 'Click "Account" in the header and sign up with your email. You can also use Google or Facebook for quick sign-up. No credit card required!'
        },
        {
          question: 'Can I save items to my wishlist?',
          answer: 'Yes! Click the ❤️ heart icon on any product to save it. Your wishlist is private and synced across devices. Get notified when wishlist items go on sale!'
        },
        {
          question: 'Can I share my wishlist?',
          answer: 'Absolutely! Generate a shareable link or QR code from your wishlist. Perfect for gift registries or asking for gift ideas. Friends can see prices and add items too!'
        }
      ]
    },
    {
      category: 'Contact & Support',
      items: [
        {
          question: 'How can I contact customer support?',
          answer: 'Chat with us instantly via our live chat bot (💬 button). Email support@pixelperfect.com or WhatsApp +919372654780. Available Mon-Fri, 10 AM - 6 PM IST.'
        },
        {
          question: 'Do you have a return support number?',
          answer: 'Contact support@pixelperfect.com with "RETURN" in the subject line, or call us on WhatsApp for instant help. Average response time: under 1 hour!'
        },
        {
          question: 'Can I cancel an order?',
          answer: 'Yes, orders can be cancelled within 2 hours of placement for a full refund. After 2 hours, items may have entered production. Contact support immediately and we\'ll help!'
        }
      ]
    }
  ],

  renderFAQ(containerId = 'faqSection') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="faq-section">
        <div class="faq-header">
          <h2>❓ Frequently Asked Questions</h2>
          <p>Can't find what you're looking for? Chat with our support team</p>
        </div>

        <div class="faq-container">
          ${this.faqs.map((category, catIdx) => `
            <div class="faq-category" style="animation: fadeInUp 0.4s ease-out ${catIdx * 0.05}s both">
              <h3 class="category-title">${category.category}</h3>
              <div class="faq-items">
                ${category.items.map((item, itemIdx) => `
                  <div class="faq-item">
                    <button class="faq-question" onclick="faqModule.toggleFAQ(event)">
                      <span>${item.question}</span>
                      <span class="faq-icon">+</span>
                    </button>
                    <div class="faq-answer" style="display: none;">
                      <p>${item.answer}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="faq-footer">
          <h3>Still have questions?</h3>
          <p>Our support team is here to help! Reach out via chat, email, or WhatsApp.</p>
          <div class="faq-actions">
            <button class="primary-button" onclick="chatBotModule.initChat()">💬 Start Chat</button>
            <a href="mailto:support@pixelperfect.com" class="secondary-button">📧 Email Us</a>
            <a href="https://wa.me/919372654780" target="_blank" class="secondary-button">📱 WhatsApp</a>
          </div>
        </div>
      </div>
    `;
  },

  toggleFAQ(event) {
    const button = event.currentTarget;
    const answer = button.nextElementSibling;
    const icon = button.querySelector('.faq-icon');
    
    // Close other FAQs in same category
    button.parentElement.querySelectorAll('.faq-item').forEach(item => {
      if (item !== button.parentElement) {
        item.querySelector('.faq-answer').style.display = 'none';
        item.querySelector('.faq-icon').textContent = '+';
      }
    });

    // Toggle current
    const isOpen = answer.style.display === 'block';
    answer.style.display = isOpen ? 'none' : 'block';
    icon.textContent = isOpen ? '+' : '−';
    icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  }
};

// Initialize FAQ on page load
document.addEventListener('DOMContentLoaded', () => {
  faqModule.renderFAQ();
});
