// User Gallery & Community Features
const userGalleryModule = {
  // Add poster to gallery
  submitCustomPosterToGallery(posterData) {
    const gallery = this.getGallery();
    const userId = localStorage.getItem('currentUserId') || 'anonymous_' + Date.now();
    
    const submission = {
      id: 'poster_' + Date.now(),
      userId,
      userName: posterData.userName || 'Anonymous Creator',
      image: posterData.image, // Base64 image
      title: posterData.title || 'Untitled Poster',
      description: posterData.description || '',
      size: posterData.size,
      likes: 0,
      likedBy: [],
      comments: [],
      submittedDate: new Date().toISOString(),
      featured: false,
      views: 0
    };

    gallery.push(submission);
    localStorage.setItem('userGallery', JSON.stringify(gallery));
    
    showToast('✨ Poster added to community gallery!', 'success');
    return submission;
  },

  // Get all gallery posters
  getGallery() {
    return JSON.parse(localStorage.getItem('userGallery') || '[]');
  },

  // Like poster
  likePoster(posterId) {
    const gallery = this.getGallery();
    const poster = gallery.find(p => p.id === posterId);
    const userId = localStorage.getItem('currentUserId');

    if (poster) {
      if (!poster.likedBy.includes(userId)) {
        poster.likes += 1;
        poster.likedBy.push(userId);
        localStorage.setItem('userGallery', JSON.stringify(gallery));
        showToast('❤️ Poster liked!', 'success');
      }
    }
  },

  // Add comment
  addComment(posterId, comment, userId = null) {
    const gallery = this.getGallery();
    const poster = gallery.find(p => p.id === posterId);
    
    userId = userId || localStorage.getItem('currentUserId') || 'anonymous';

    if (poster) {
      poster.comments.push({
        id: 'comment_' + Date.now(),
        userId,
        text: comment,
        date: new Date().toISOString()
      });

      localStorage.setItem('userGallery', JSON.stringify(gallery));
      showToast('✓ Comment added', 'success');
    }
  },

  // Get featured posters
  getFeaturedPosters(limit = 6) {
    const gallery = this.getGallery();
    return gallery
      .filter(p => p.featured)
      .slice(0, limit);
  },

  // Get trending posters (by likes)
  getTrendingPosters(limit = 6) {
    const gallery = this.getGallery();
    return gallery
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);
  },

  // Get recent posters
  getRecentPosters(limit = 6) {
    const gallery = this.getGallery();
    return gallery
      .sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate))
      .slice(0, limit);
  },

  // Render gallery page
  renderGalleryPage(filterType = 'trending', limit = 12) {
    const container = document.getElementById('galleryContainer');
    if (!container) return;

    let posters = [];

    switch (filterType) {
      case 'featured':
        posters = this.getFeaturedPosters(limit);
        break;
      case 'recent':
        posters = this.getRecentPosters(limit);
        break;
      default:
        posters = this.getTrendingPosters(limit);
    }

    if (posters.length === 0) {
      container.innerHTML = `
        <div class="gallery-empty">
          <h2>No Posters Yet</h2>
          <p>Be the first to create and share your custom poster!</p>
          <a href="index.html#custom-poster-builder-section" class="primary-button">Create Poster</a>
        </div>
      `;
      return;
    }

    container.innerHTML = posters.map((poster, idx) => `
      <div class="gallery-card" style="animation: fadeInUp 0.4s ease-out ${idx * 0.05}s both">
        <div class="gallery-image">
          <img src="${poster.image}" alt="${poster.title}" loading="lazy" />
          <div class="gallery-overlay">
            <button class="gallery-btn" onclick="userGalleryModule.likePoster('${poster.id}')">
              ❤️ ${poster.likes}
            </button>
            <button class="gallery-btn" onclick="userGalleryModule.shareDesign('${poster.id}')">
              🔗 Share
            </button>
          </div>
        </div>
        <div class="gallery-info">
          <h3>${poster.title}</h3>
          <p class="gallery-creator">by ${poster.userName}</p>
          <p class="gallery-description">${poster.description}</p>
          <div class="gallery-meta">
            <span>👁️ ${poster.views}</span>
            <span>💬 ${poster.comments.length}</span>
            <span>${poster.size}</span>
          </div>
          <button class="gallery-view-btn" onclick="userGalleryModule.viewPoster('${poster.id}')">
            View Details
          </button>
        </div>
      </div>
    `).join('');
  },

  // View poster details
  viewPoster(posterId) {
    const gallery = this.getGallery();
    const poster = gallery.find(p => p.id === posterId);

    if (!poster) return;

    poster.views += 1;
    localStorage.setItem('userGallery', JSON.stringify(gallery));

    // Show poster modal/page
    const container = document.getElementById('posterDetailModal');
    if (container) {
      container.innerHTML = `
        <div class="modal-overlay" onclick="this.remove()">
          <div class="modal-content" onclick="event.stopPropagation()">
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            
            <div class="poster-detail-grid">
              <div class="poster-detail-image">
                <img src="${poster.image}" alt="${poster.title}" />
              </div>
              
              <div class="poster-detail-info">
                <h2>${poster.title}</h2>
                <p class="detail-creator">Created by <strong>${poster.userName}</strong></p>
                <p class="detail-date">${new Date(poster.submittedDate).toLocaleDateString()}</p>
                
                <p class="detail-description">${poster.description}</p>
                
                <div class="detail-stats">
                  <div class="stat">
                    <span class="stat-icon">❤️</span>
                    <span>${poster.likes} likes</span>
                  </div>
                  <div class="stat">
                    <span class="stat-icon">👁️</span>
                    <span>${poster.views} views</span>
                  </div>
                  <div class="stat">
                    <span class="stat-icon">💬</span>
                    <span>${poster.comments.length} comments</span>
                  </div>
                </div>
                
                <div class="detail-size">
                  <strong>Size:</strong> ${poster.size}
                </div>
                
                <div class="detail-actions">
                  <button class="primary-button" onclick="userGalleryModule.createSimilar('${posterId}')">
                    Create Similar
                  </button>
                  <button class="secondary-button" onclick="userGalleryModule.shareDesign('${posterId}')">
                    Share Design
                  </button>
                </div>
                
                <div class="comments-section">
                  <h3>Comments</h3>
                  ${poster.comments.length === 0 ? `
                    <p class="no-comments">No comments yet. Be the first!</p>
                  ` : `
                    <div class="comments-list">
                      ${poster.comments.map(comment => `
                        <div class="comment">
                          <strong>${comment.userId}</strong>
                          <p>${comment.text}</p>
                          <small>${new Date(comment.date).toLocaleDateString()}</small>
                        </div>
                      `).join('')}
                    </div>
                  `}
                  
                  <div class="comment-form">
                    <input type="text" placeholder="Add a comment..." id="commentInput" />
                    <button onclick="userGalleryModule.addCommentFromForm('${posterId}')">Post</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(container);
    }
  },

  addCommentFromForm(posterId) {
    const input = document.getElementById('commentInput');
    if (input && input.value.trim()) {
      this.addComment(posterId, input.value);
      input.value = '';
    }
  },

  // Share design
  shareDesign(posterId) {
    const gallery = this.getGallery();
    const poster = gallery.find(p => p.id === posterId);

    if (poster) {
      const shareUrl = `${window.location.origin}?gallery=${posterId}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('✨ Design link copied!', 'success');
      });
    }
  },

  // Create similar poster
  createSimilar(posterId) {
    showToast('Opening poster builder with inspiration...', 'success');
    window.location.href = 'index.html#custom-poster-builder-section';
  }
};

// Initialize gallery
document.addEventListener('DOMContentLoaded', () => {
  const galleryCont = document.getElementById('galleryContainer');
  if (galleryCont) {
    const filterType = galleryCont.dataset.filterType || 'trending';
    userGalleryModule.renderGalleryPage(filterType);
  }
});
