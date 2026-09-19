// Loyalty Program & Points System
const loyaltyModule = {
  // Points earning rates
  pointsRates: {
    purchase: 1, // 1 point per rupee spent
    review: 50, // 50 points for writing a review
    referral: 250, // 250 points for successful referral
    birthday: 500, // 500 bonus points on birthday
    firstPurchase: 100 // 100 bonus points on first purchase
  },

  // Rewards tiers
  tiers: [
    { name: 'Bronze', minPoints: 0, discount: 5, benefits: ['5% off all orders', 'Free shipping on orders over ₹1500'] },
    { name: 'Silver', minPoints: 1000, discount: 10, benefits: ['10% off all orders', 'Free shipping on all orders', 'Early access to new designs'] },
    { name: 'Gold', minPoints: 5000, discount: 15, benefits: ['15% off all orders', 'Free shipping', 'Priority customer support', 'Exclusive product early access'] },
    { name: 'Platinum', minPoints: 15000, discount: 20, benefits: ['20% off all orders', 'Free express shipping', '24/7 VIP support', 'Exclusive member-only products'] }
  ],

  // Get user loyalty data
  getUserLoyalty(userId) {
    const loyalty = JSON.parse(localStorage.getItem(`loyalty_${userId}`) || '{}');
    return {
      points: loyalty.points || 0,
      referralCode: loyalty.referralCode || this.generateReferralCode(userId),
      referrals: loyalty.referrals || 0,
      totalSpent: loyalty.totalSpent || 0,
      tier: this.calculateTier(loyalty.points || 0),
      joinDate: loyalty.joinDate || new Date().toISOString(),
      transactionHistory: loyalty.transactionHistory || []
    };
  },

  saveLoyalty(userId, loyalty) {
    localStorage.setItem(`loyalty_${userId}`, JSON.stringify(loyalty));
    this.updateLoyaltyUI(userId);
  },

  // Add points to user
  addPoints(userId, points, reason = 'purchase') {
    const loyalty = this.getUserLoyalty(userId);
    loyalty.points += points;
    loyalty.transactionHistory.push({
      date: new Date().toISOString(),
      points,
      reason,
      balance: loyalty.points
    });
    this.saveLoyalty(userId, loyalty);
    return loyalty;
  },

  // Redeem points for discount
  redeemPoints(userId, pointsToRedeem) {
    const loyalty = this.getUserLoyalty(userId);
    if (loyalty.points < pointsToRedeem) {
      showToast('Not enough points to redeem', 'error');
      return false;
    }
    
    loyalty.points -= pointsToRedeem;
    const discountAmount = Math.floor(pointsToRedeem / 10); // 10 points = ₹1
    loyalty.transactionHistory.push({
      date: new Date().toISOString(),
      points: -pointsToRedeem,
      reason: 'redemption',
      discountAmount,
      balance: loyalty.points
    });
    this.saveLoyalty(userId, loyalty);
    showToast(`🎉 Redeemed ₹${discountAmount} discount!`, 'success');
    return discountAmount;
  },

  // Generate referral code
  generateReferralCode(userId) {
    return `PIXEL_${userId}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  },

  // Process referral
  processReferral(referralCode, newUserId) {
    // Find user with this referral code
    const userIdMatch = referralCode.match(/PIXEL_(\d+)_/);
    if (!userIdMatch) {
      showToast('Invalid referral code', 'error');
      return false;
    }

    const referrerId = userIdMatch[1];
    const referrerLoyalty = this.getUserLoyalty(referrerId);
    referrerLoyalty.referrals += 1;
    referrerLoyalty.points += this.pointsRates.referral;
    this.saveLoyalty(referrerId, referrerLoyalty);

    // Give new user bonus
    const newUserLoyalty = this.getUserLoyalty(newUserId);
    newUserLoyalty.points += this.pointsRates.firstPurchase;
    this.saveLoyalty(newUserId, newUserLoyalty);

    showToast('✨ Welcome bonus applied!', 'success');
    return true;
  },

  // Calculate tier based on points
  calculateTier(points) {
    for (let i = this.tiers.length - 1; i >= 0; i--) {
      if (points >= this.tiers[i].minPoints) {
        return this.tiers[i];
      }
    }
    return this.tiers[0];
  },

  // Get discount percentage for tier
  getTierDiscount(userId) {
    const loyalty = this.getUserLoyalty(userId);
    return loyalty.tier.discount;
  },

  // Update loyalty UI
  updateLoyaltyUI(userId) {
    const loyalty = this.getUserLoyalty(userId);
    const tier = loyalty.tier;

    // Update tier badge
    const tierBadge = document.getElementById('tierBadge');
    if (tierBadge) {
      tierBadge.innerHTML = `
        <span class="tier-badge tier-${tier.name.toLowerCase()}">
          ${tier.name}
        </span>
      `;
    }

    // Update points display
    const pointsEl = document.getElementById('loyaltyPoints');
    if (pointsEl) {
      pointsEl.innerHTML = `
        <div class="loyalty-points">
          <span class="points-label">💰 Points</span>
          <span class="points-value">${loyalty.points}</span>
        </div>
      `;
    }

    // Update progress to next tier
    const nextTierIdx = this.tiers.findIndex(t => t.name === tier.name) + 1;
    if (nextTierIdx < this.tiers.length) {
      const nextTier = this.tiers[nextTierIdx];
      const pointsToNext = nextTier.minPoints - loyalty.points;
      const progress = ((loyalty.points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100;
      
      const progressEl = document.getElementById('tierProgress');
      if (progressEl) {
        progressEl.innerHTML = `
          <div class="tier-progress-bar">
            <div class="progress-fill" style="width: ${Math.min(100, Math.max(0, progress))}%"></div>
          </div>
          <p class="progress-text">${pointsToNext} points to ${nextTier.name}</p>
        `;
      }
    }
  },

  // Render loyalty dashboard
  renderLoyaltyPage(userId) {
    const loyalty = this.getUserLoyalty(userId);
    const tier = loyalty.tier;
    const container = document.getElementById('loyaltyDashboard');
    
    if (!container) return;

    container.innerHTML = `
      <div class="loyalty-hero">
        <div class="tier-display tier-${tier.name.toLowerCase()}">
          <h2>${tier.name} Member</h2>
          <p class="tier-subtitle">${loyalty.points} Points Earned</p>
        </div>
        <div class="loyalty-stats">
          <div class="stat">
            <span class="stat-value">${loyalty.points}</span>
            <span class="stat-label">Total Points</span>
          </div>
          <div class="stat">
            <span class="stat-value">₹${loyalty.totalSpent}</span>
            <span class="stat-label">Total Spent</span>
          </div>
          <div class="stat">
            <span class="stat-value">${loyalty.referrals}</span>
            <span class="stat-label">Referrals</span>
          </div>
        </div>
      </div>

      <div class="loyalty-section">
        <h3>🎁 Your Tier Benefits</h3>
        <div class="benefits-grid">
          ${tier.benefits.map(benefit => `
            <div class="benefit-card">
              <span class="benefit-check">✓</span>
              <span class="benefit-text">${benefit}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="loyalty-section">
        <h3>🔗 Refer & Earn</h3>
        <div class="referral-box">
          <p>Share your referral code and earn ₹50 for each friend who joins!</p>
          <div class="referral-code-display">
            <input type="text" value="${loyalty.referralCode}" readonly class="referral-input" id="referralCodeInput" />
            <button class="copy-btn" onclick="navigator.clipboard.writeText('${loyalty.referralCode}'); showToast('Referral code copied!', 'success')">
              Copy Code
            </button>
          </div>
        </div>
      </div>

      <div class="loyalty-section">
        <h3>📊 Points Transactions</h3>
        <div class="transaction-list">
          ${loyalty.transactionHistory.slice(-10).reverse().map(tx => `
            <div class="transaction-item">
              <div class="tx-info">
                <span class="tx-reason">${tx.reason}</span>
                <span class="tx-date">${new Date(tx.date).toLocaleDateString()}</span>
              </div>
              <span class="tx-points ${tx.points > 0 ? 'positive' : 'negative'}">
                ${tx.points > 0 ? '+' : ''}${tx.points}
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="loyalty-section">
        <h3>💳 Redeem Points</h3>
        <div class="redeem-options">
          <div class="redeem-card">
            <span class="redeem-points">100 Points</span>
            <span class="redeem-value">= ₹10 Off</span>
            <button class="redeem-btn" onclick="loyaltyModule.redeemPoints('${userId}', 100)">Redeem</button>
          </div>
          <div class="redeem-card">
            <span class="redeem-points">500 Points</span>
            <span class="redeem-value">= ₹50 Off</span>
            <button class="redeem-btn" onclick="loyaltyModule.redeemPoints('${userId}', 500)">Redeem</button>
          </div>
          <div class="redeem-card">
            <span class="redeem-points">1000 Points</span>
            <span class="redeem-value">= ₹100 Off</span>
            <button class="redeem-btn" onclick="loyaltyModule.redeemPoints('${userId}', 1000)">Redeem</button>
          </div>
        </div>
      </div>
    `;
  }
};

// Initialize loyalty system on checkout
function integratePointsAtCheckout(userId, orderTotal) {
  const discount = loyaltyModule.getTierDiscount(userId);
  const discountAmount = Math.floor(orderTotal * discount / 100);
  
  // Add points for this purchase
  const points = Math.floor(orderTotal);
  loyaltyModule.addPoints(userId, points, 'purchase');
  
  return discountAmount;
}
