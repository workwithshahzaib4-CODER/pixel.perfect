// Influencer & Referral Program
const affiliateModule = {
  affiliates: JSON.parse(localStorage.getItem('affiliates') || '{}'),

  generateAffiliateLink(userId, userName) {
    const affiliateCode = `PIXEL_${userName.toUpperCase().replace(/\s+/g, '_')}_${userId.substring(0, 6)}`;
    
    this.affiliates[userId] = {
      code: affiliateCode,
      userName,
      joinDate: new Date().toISOString(),
      sales: 0,
      earnings: 0,
      referrals: 0,
      commissionRate: 0.15, // 15% commission
      tier: 'bronze',
      status: 'active'
    };

    localStorage.setItem('affiliates', JSON.stringify(this.affiliates));
    return {
      code: affiliateCode,
      link: `${window.location.origin}?ref=${affiliateCode}`,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '?ref=' + affiliateCode)}`
    };
  },

  trackReferralSale(referralCode, orderAmount) {
    for (const [userId, affiliate] of Object.entries(this.affiliates)) {
      if (affiliate.code === referralCode) {
        const commission = orderAmount * affiliate.commissionRate;
        affiliate.sales += 1;
        affiliate.earnings += commission;
        affiliate.referrals += 1;

        // Upgrade tier based on sales
        if (affiliate.sales >= 50 && affiliate.tier === 'bronze') {
          affiliate.tier = 'silver';
          affiliate.commissionRate = 0.18; // Upgrade to 18%
        } else if (affiliate.sales >= 100 && affiliate.tier === 'silver') {
          affiliate.tier = 'gold';
          affiliate.commissionRate = 0.20; // Upgrade to 20%
        } else if (affiliate.sales >= 200 && affiliate.tier === 'gold') {
          affiliate.tier = 'platinum';
          affiliate.commissionRate = 0.25; // Upgrade to 25%
        }

        localStorage.setItem('affiliates', JSON.stringify(this.affiliates));
        return commission;
      }
    }
    return 0;
  },

  calculateCommission(userId) {
    const affiliate = this.affiliates[userId];
    if (!affiliate) return null;

    return {
      totalEarnings: affiliate.earnings,
      totalSales: affiliate.sales,
      totalReferrals: affiliate.referrals,
      commissionRate: (affiliate.commissionRate * 100) + '%',
      tier: affiliate.tier,
      nextTierRequirement: {
        'bronze': 50,
        'silver': 100,
        'gold': 200,
        'platinum': Infinity
      }[affiliate.tier],
      salesToNextTier: Math.max(0, {
        'bronze': 50,
        'silver': 100,
        'gold': 200,
        'platinum': Infinity
      }[affiliate.tier] - affiliate.sales),
      payoutStatus: affiliate.earnings >= 500 ? 'ready' : 'pending',
      nextPayout: affiliate.earnings >= 500 ? 'Available Now' : `₹${Math.round(500 - affiliate.earnings)} more to unlock`
    };
  },

  renderAffiliateDashboard(userId, containerId = 'affiliateDashboard') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const affiliate = this.affiliates[userId];
    if (!affiliate) {
      container.innerHTML = `
        <div class="affiliate-onboarding">
          <h2>🤝 Join Our Affiliate Program</h2>
          <p>Earn 15% commission on every referral! Upgrade to 25% commission as you reach higher tiers.</p>
          <button class="primary-button" onclick="affiliateModule.enrollAffiliate('${userId}', prompt('Enter your name:'))">
            Start Earning Now
          </button>
        </div>
      `;
      return;
    }

    const stats = this.calculateCommission(userId);
    const { code, link, qrCode } = this.generateAffiliateLink(userId, affiliate.userName);

    container.innerHTML = `
      <div class="affiliate-dashboard">
        <div class="affiliate-header">
          <h2>🎉 Affiliate Dashboard</h2>
          <span class="affiliate-tier tier-${stats.tier.toLowerCase()}">${stats.tier.toUpperCase()}</span>
        </div>

        <div class="affiliate-stats">
          <div class="stat-card">
            <div class="stat-value">₹${stats.totalEarnings.toFixed(0)}</div>
            <div class="stat-label">Total Earnings</div>
            <div class="stat-detail">${stats.payoutStatus === 'ready' ? '✅ Ready for Payout' : stats.nextPayout}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalSales}</div>
            <div class="stat-label">Successful Sales</div>
            <div class="stat-detail">${stats.salesToNextTier > 0 ? stats.salesToNextTier + ' to next tier' : 'Max tier!'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalReferrals}</div>
            <div class="stat-label">Total Referrals</div>
            <div class="stat-detail">Commission: ${stats.commissionRate}</div>
          </div>
        </div>

        <div class="affiliate-promo">
          <h3>📢 Your Referral Link</h3>
          <div class="referral-link-box">
            <input type="text" class="referral-link" value="${link}" readonly />
            <button class="copy-btn" onclick="navigator.clipboard.writeText('${link}'); showToast('Link copied!', 'success')">
              Copy Link
            </button>
          </div>

          <div class="referral-qr">
            <h4>Share QR Code</h4>
            <img src="${qrCode}" alt="Referral QR Code" class="qr-code" />
            <p>Scan to share your referral</p>
          </div>

          <div class="referral-code">
            <h4>Referral Code</h4>
            <input type="text" class="referral-code-input" value="${code}" readonly />
            <button class="copy-btn" onclick="navigator.clipboard.writeText('${code}'); showToast('Code copied!', 'success')">
              Copy Code
            </button>
          </div>
        </div>

        <div class="tier-progress">
          <h3>🏆 Tier Progress</h3>
          <div class="tier-info">
            <div class="tier-level">
              <span class="tier-name">Bronze</span>
              <span class="tier-status">Current</span>
              <span class="commission">15%</span>
            </div>
            ${stats.salesToNextTier > 0 ? `
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${(stats.totalSales / 50) * 100}%"></div>
              </div>
              <p>${stats.totalSales} / 50 sales to Silver tier</p>
            ` : ''}
          </div>
        </div>

        <div class="payout-section">
          <h3>💰 Payout Settings</h3>
          ${stats.payoutStatus === 'ready' ? `
            <button class="primary-button" onclick="affiliateModule.requestPayout('${userId}')">
              Request Payout (₹${stats.totalEarnings.toFixed(0)})
            </button>
          ` : `
            <p>Minimum ₹500 required for payout. You need ₹${Math.round(500 - stats.totalEarnings)} more.</p>
          `}
        </div>
      </div>
    `;
  },

  enrollAffiliate(userId, userName) {
    if (!userName) {
      showToast('Please enter your name', 'error');
      return false;
    }

    this.generateAffiliateLink(userId, userName);
    showToast('🎉 Welcome to the Affiliate Program! Start sharing to earn.', 'success');
    return true;
  },

  requestPayout(userId) {
    const affiliate = this.affiliates[userId];
    if (!affiliate) return false;

    const payout = {
      id: 'payout_' + Date.now(),
      userId,
      amount: affiliate.earnings,
      date: new Date().toISOString(),
      status: 'pending'
    };

    const payouts = JSON.parse(localStorage.getItem('affiliate_payouts') || '[]');
    payouts.push(payout);
    localStorage.setItem('affiliate_payouts', JSON.stringify(payouts));

    affiliate.earnings = 0;
    localStorage.setItem('affiliates', JSON.stringify(this.affiliates));

    showToast('✅ Payout requested! You\'ll receive it within 3-5 business days.', 'success');
    return true;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const userId = localStorage.getItem('currentUser') || 'guest';
  if (document.getElementById('affiliateDashboard')) {
    affiliateModule.renderAffiliateDashboard(userId);
  }
});
