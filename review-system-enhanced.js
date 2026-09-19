// Enhanced Review System with Photos & Advanced Filtering
const reviewSystemModule = {
  getReviewStats(productId) {
    const allReviews = JSON.parse(localStorage.getItem('productReviews') || '{}');
    const productReviews = allReviews[productId] || [];
    
    if (productReviews.length === 0) {
      return {
        averageRating: 4.5,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = (sum / productReviews.length).toFixed(1);
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    productReviews.forEach(review => {
      distribution[review.rating]++;
    });

    return {
      averageRating: parseFloat(avg),
      totalReviews: productReviews.length,
      ratingDistribution: distribution,
      percentHelpful: Math.round((productReviews.filter(r => r.helpful).length / productReviews.length) * 100)
    };
  },

  submitReviewWithPhoto(productId, rating, title, text, photoData = null) {
    if (rating < 1 || rating > 5) {
      showToast('Rating must be between 1 and 5', 'error');
      return false;
    }

    const reviews = JSON.parse(localStorage.getItem('productReviews') || '{}');
    if (!reviews[productId]) reviews[productId] = [];

    const review = {
      id: 'review_' + Date.now(),
      productId,
      rating,
      title,
      text,
      photo: photoData,
      author: localStorage.getItem('currentUserName') || 'Anonymous',
      date: new Date().toISOString(),
      verified: Math.random() > 0.3, // 70% verified purchases
      helpful: 0,
      unhelpful: 0,
      replies: []
    };

    reviews[productId].push(review);
    localStorage.setItem('productReviews', JSON.stringify(reviews));
    
    // Award loyalty points for review
    if (typeof loyaltyModule !== 'undefined') {
      const userId = localStorage.getItem('currentUser') || 'guest';
      loyaltyModule.addPoints(userId, 50);
    }

    showToast('✨ Review submitted! +50 Loyalty Points earned', 'success');
    return true;
  },

  getHelpfulReviews(productId, sortBy = 'helpful') {
    const reviews = JSON.parse(localStorage.getItem('productReviews') || '{}');
    let productReviews = reviews[productId] || [];

    // Sort based on criteria
    switch (sortBy) {
      case 'helpful':
        return productReviews.sort((a, b) => (b.helpful - b.unhelpful) - (a.helpful - a.unhelpful));
      case 'recent':
        return productReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
      case 'rating-high':
        return productReviews.sort((a, b) => b.rating - a.rating);
      case 'rating-low':
        return productReviews.sort((a, b) => a.rating - b.rating);
      default:
        return productReviews;
    }
  },

  filterReviewsByRating(productId, minRating) {
    const reviews = JSON.parse(localStorage.getItem('productReviews') || '{}');
    return (reviews[productId] || []).filter(r => r.rating === minRating);
  },

  markAsHelpful(reviewId, productId) {
    const reviews = JSON.parse(localStorage.getItem('productReviews') || '{}');
    const review = reviews[productId]?.find(r => r.id === reviewId);
    
    if (review) {
      review.helpful = (review.helpful || 0) + 1;
      localStorage.setItem('productReviews', JSON.stringify(reviews));
      showToast('👍 Thanks for your feedback!', 'success');
      return true;
    }
    return false;
  },

  renderReviewCarousel(productId, containerId = 'reviewCarousel') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stats = this.getReviewStats(productId);
    const reviews = this.getHelpfulReviews(productId, 'helpful').slice(0, 5);

    container.innerHTML = `
      <div class="review-section">
        <div class="review-stats">
          <div class="rating-summary">
            <div class="rating-number">⭐ ${stats.averageRating}</div>
            <div class="rating-bar">
              <div class="bar-fill" style="width: ${(stats.averageRating / 5) * 100}%"></div>
            </div>
            <div class="review-count">${stats.totalReviews} verified reviews</div>
          </div>
          
          <div class="rating-distribution">
            ${[5, 4, 3, 2, 1].map(rating => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return `
                <div class="distribution-row">
                  <span class="star-label">${rating}★</span>
                  <div class="dist-bar">
                    <div class="dist-fill" style="width: ${percentage}%"></div>
                  </div>
                  <span class="dist-count">${count}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="reviews-list">
          <div class="review-header">
            <h3>Customer Reviews</h3>
            <select onchange="reviewSystemModule.updateDisplayedReviews('${productId}', this.value)" class="sort-select">
              <option value="helpful">Most Helpful</option>
              <option value="recent">Most Recent</option>
              <option value="rating-high">Highest Rated</option>
              <option value="rating-low">Lowest Rated</option>
            </select>
          </div>

          ${reviews.map(review => `
            <div class="review-card">
              <div class="review-header-info">
                <div class="reviewer-info">
                  <strong>${review.author}</strong>
                  ${review.verified ? '<span class="verified-badge">✓ Verified Purchase</span>' : ''}
                </div>
                <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
              </div>
              
              <div class="review-rating">
                ${'⭐'.repeat(review.rating)}
                <span class="review-title">${review.title}</span>
              </div>
              
              <p class="review-text">${review.text}</p>
              
              ${review.photo ? `<img src="${review.photo}" alt="Review photo" class="review-photo" />` : ''}
              
              <div class="review-actions">
                <button class="helpful-btn" onclick="reviewSystemModule.markAsHelpful('${review.id}', '${productId}')">
                  👍 Helpful (${review.helpful})
                </button>
                <span class="helpful-count">${review.helpful > 0 ? review.helpful + ' found this helpful' : ''}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <button class="secondary-button write-review-btn" onclick="reviewSystemModule.showReviewForm('${productId}')">
          ✍️ Write a Review
        </button>
      </div>
    `;
  },

  showReviewForm(productId) {
    const modal = document.createElement('div');
    modal.className = 'review-modal';
    modal.innerHTML = `
      <div class="review-modal-content">
        <span class="modal-close" onclick="this.closest('.review-modal').remove()">✕</span>
        <h2>Share Your Review</h2>
        <form onsubmit="reviewSystemModule.handleReviewSubmit(event, '${productId}')">
          <div class="form-group">
            <label>Rating</label>
            <div class="star-rating">
              ${[1, 2, 3, 4, 5].map(i => `
                <input type="radio" name="rating" value="${i}" id="star${i}" />
                <label for="star${i}">⭐</label>
              `).join('')}
            </div>
          </div>
          
          <div class="form-group">
            <label>Review Title</label>
            <input type="text" name="title" placeholder="Summarize your experience" required />
          </div>
          
          <div class="form-group">
            <label>Your Review</label>
            <textarea name="text" placeholder="Share details about this product..." rows="4" required></textarea>
          </div>
          
          <div class="form-group">
            <label>Upload Photo (optional)</label>
            <input type="file" name="photo" accept="image/*" />
          </div>
          
          <button type="submit" class="primary-button">Submit Review</button>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
  },

  handleReviewSubmit(event, productId) {
    event.preventDefault();
    const form = event.target;
    
    const rating = parseInt(form.querySelector('[name="rating"]:checked').value);
    const title = form.querySelector('[name="title"]').value;
    const text = form.querySelector('[name="text"]').value;
    const photoInput = form.querySelector('[name="photo"]');
    
    if (photoInput.files.length > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.submitReviewWithPhoto(productId, rating, title, text, e.target.result);
        form.closest('.review-modal').remove();
      };
      reader.readAsDataURL(photoInput.files[0]);
    } else {
      this.submitReviewWithPhoto(productId, rating, title, text);
      form.closest('.review-modal').remove();
    }
  },

  updateDisplayedReviews(productId, sortBy) {
    this.renderReviewCarousel(productId);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('reviewCarousel')) {
    const productId = document.body.dataset.productId || 'featured-product';
    reviewSystemModule.renderReviewCarousel(productId);
  }
});
