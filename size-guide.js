// Size Guide & Room Setup Templates
const sizeGuideModule = {
  sizeGuides: {
    a5: {
      name: 'A5 (5.8" × 8.3")',
      inches: '5.8" × 8.3"',
      cm: '14.8cm × 21cm',
      bestFor: 'Small desk spaces, shelves, accent walls',
      rooms: ['bedroom', 'office', 'bathroom'],
      visualScale: 0.5,
      price: 79,
      description: 'Perfect for cozy corners and small spaces'
    },
    a4: {
      name: 'A4 (8.3" × 11.7")',
      inches: '8.3" × 11.7"',
      cm: '21cm × 29.7cm',
      bestFor: 'Standard wall décor, bedside tables',
      rooms: ['bedroom', 'office', 'kitchen'],
      visualScale: 1,
      price: 129,
      description: 'Most popular size for elegant wall displays'
    },
    a3: {
      name: 'A3 (11.7" × 16.5")',
      inches: '11.7" × 16.5"',
      cm: '29.7cm × 42cm',
      bestFor: 'Main focal point, feature walls',
      rooms: ['living-room', 'office', 'gaming'],
      visualScale: 1.5,
      price: 199,
      description: 'Statement size that commands attention'
    },
    '13x19': {
      name: '13" × 19"',
      inches: '13" × 19"',
      cm: '33cm × 48cm',
      bestFor: 'Feature walls, gallery layouts',
      rooms: ['living-room', 'bedroom', 'office'],
      visualScale: 2,
      price: 299,
      description: 'Premium size for impactful displays'
    },
    '18x24': {
      name: '18" × 24"',
      inches: '18" × 24"',
      cm: '46cm × 61cm',
      bestFor: 'Main focus, large wall spaces',
      rooms: ['living-room', 'gaming', 'office'],
      visualScale: 2.8,
      price: 399,
      description: 'Bold statement piece for any room'
    },
    '24x36': {
      name: '24" × 36"',
      inches: '24" × 36"',
      cm: '61cm × 91cm',
      bestFor: 'Dominant wall feature, professional spaces',
      rooms: ['living-room', 'gaming', 'office'],
      visualScale: 4,
      price: 599,
      description: 'Show-stopping display for maximum impact'
    }
  },

  roomTemplates: {
    bedroom: {
      name: 'Bedroom Setup',
      icon: '🛏️',
      layout: 'Above-bed or corner arrangement',
      recommendedSizes: ['a4', 'a3', '13x19'],
      suggestedCount: '2-3 posters',
      tips: [
        'Place above bed for dramatic effect',
        'Pair with soft lighting for ambiance',
        'Use calming colors for better sleep',
        'Frame size should be 60-80% of wall width'
      ],
      visualImage: 'https://images.unsplash.com/photo-1540932239986-310128078ceb?w=600&h=400&fit=crop'
    },
    gaming: {
      name: 'Gaming Corner',
      icon: '🎮',
      layout: 'Wall behind gaming setup',
      recommendedSizes: ['13x19', '18x24', '24x36'],
      suggestedCount: '3-5 posters',
      tips: [
        'Use bold colors and gaming themes',
        'Place at eye level for maximum visibility',
        'Mix vertical and horizontal orientations',
        'Consider RGB lighting effects'
      ],
      visualImage: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=600&h=400&fit=crop'
    },
    office: {
      name: 'Office Space',
      icon: '💼',
      layout: 'Desktop wall or gallery wall',
      recommendedSizes: ['a4', 'a3', '13x19'],
      suggestedCount: '2-4 posters',
      tips: [
        'Choose professional designs',
        'Motivational quotes work well',
        'Frame properly for formal look',
        'Space evenly for balanced appearance'
      ],
      visualImage: 'https://images.unsplash.com/photo-1593642632823-8f08a8f1f99e?w=600&h=400&fit=crop'
    },
    'living-room': {
      name: 'Living Room',
      icon: '🛋️',
      layout: 'Above couch or feature wall',
      recommendedSizes: ['18x24', '24x36', 'a3'],
      suggestedCount: '3-7 posters',
      tips: [
        'Make a bold statement with size',
        'Create a gallery wall effect',
        'Match your interior color scheme',
        'Use uniform frames for cohesion'
      ],
      visualImage: 'https://images.unsplash.com/photo-1565636192335-14a8ff829eb1?w=600&h=400&fit=crop'
    },
    kitchen: {
      name: 'Kitchen',
      icon: '🍳',
      layout: 'Accent walls or small spaces',
      recommendedSizes: ['a4', 'a3'],
      suggestedCount: '2-3 posters',
      tips: [
        'Choose weather-resistant finishes',
        'Use bright, cheerful designs',
        'Keep away from cooking areas',
        'Smaller sizes work best'
      ],
      visualImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop'
    },
    bathroom: {
      name: 'Bathroom',
      icon: '🚿',
      layout: 'Small accent pieces',
      recommendedSizes: ['a5', 'a4'],
      suggestedCount: '1-2 posters',
      tips: [
        'Use moisture-resistant materials',
        'Smaller sizes in limited space',
        'Avoid moisture-prone areas',
        'Matte finish works best'
      ],
      visualImage: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop'
    }
  },

  getSetupsByRoom(roomType) {
    const template = this.roomTemplates[roomType];
    if (!template) return null;
    
    return {
      ...template,
      sizes: template.recommendedSizes.map(sizeKey => this.sizeGuides[sizeKey])
    };
  },

  renderSizeGuide(containerId = 'sizeGuide') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="size-guide-section">
        <h2>📏 Size Guide & Room Templates</h2>
        
        <div class="guide-tabs">
          <button class="tab-btn active" onclick="sizeGuideModule.switchTab('sizes')">All Sizes</button>
          <button class="tab-btn" onclick="sizeGuideModule.switchTab('rooms')">Room Templates</button>
        </div>

        <div id="sizesTab" class="guide-tab-content">
          <div class="sizes-grid">
            ${Object.entries(this.sizeGuides).map(([key, guide]) => `
              <div class="size-guide-card" onclick="sizeGuideModule.showSizeDetail('${key}')">
                <div class="size-visual" style="width: ${100 * guide.visualScale}px; height: ${Math.random() * 100 + 100}px; border: 2px dashed #d6b578;"></div>
                <div class="size-info">
                  <h4>${guide.name}</h4>
                  <p>${guide.inches}</p>
                  <p class="price">₹${guide.price}</p>
                  <p class="description">${guide.description}</p>
                  <button class="secondary-button" onclick="event.stopPropagation(); sizeGuideModule.selectSize('${key}')">
                    Select Size
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div id="roomsTab" class="guide-tab-content" style="display: none;">
          <div class="rooms-grid">
            ${Object.entries(this.roomTemplates).map(([key, room]) => `
              <div class="room-card" onclick="sizeGuideModule.showRoomTemplate('${key}')">
                <div class="room-image-wrapper">
                  <img src="${room.visualImage}" alt="${room.name}" class="room-image" />
                  <span class="room-icon">${room.icon}</span>
                </div>
                <div class="room-info">
                  <h3>${room.name}</h3>
                  <p class="layout">${room.layout}</p>
                  <p class="suggested">${room.suggestedCount}</p>
                  <div class="room-actions">
                    <button class="primary-button" onclick="event.stopPropagation(); sizeGuideModule.showRoomTemplate('${key}')">
                      View Setup
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  switchTab(tabName) {
    document.querySelectorAll('.guide-tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabName === 'sizes' ? 'sizesTab' : 'roomsTab').style.display = 'block';
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
  },

  showSizeDetail(sizeKey) {
    const size = this.sizeGuides[sizeKey];
    const modal = document.createElement('div');
    modal.className = 'size-detail-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="modal-close" onclick="this.closest('.size-detail-modal').remove()">✕</span>
        <h2>${size.name}</h2>
        <div class="size-details">
          <div class="detail-item">
            <strong>Dimensions:</strong>
            <p>${size.inches} / ${size.cm}</p>
          </div>
          <div class="detail-item">
            <strong>Best For:</strong>
            <p>${size.bestFor}</p>
          </div>
          <div class="detail-item">
            <strong>Ideal Rooms:</strong>
            <p>${size.rooms.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}</p>
          </div>
          <div class="detail-item">
            <strong>Price:</strong>
            <p class="price-tag">₹${size.price}</p>
          </div>
        </div>
        <button class="primary-button" onclick="this.closest('.size-detail-modal').remove()">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
  },

  showRoomTemplate(roomKey) {
    const room = this.roomTemplates[roomKey];
    const modal = document.createElement('div');
    modal.className = 'room-template-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="modal-close" onclick="this.closest('.room-template-modal').remove()">✕</span>
        <div class="room-modal-header">
          <span class="room-icon-large">${room.icon}</span>
          <h2>${room.name} Setup</h2>
        </div>
        
        <img src="${room.visualImage}" alt="${room.name}" class="room-modal-image" />
        
        <div class="room-details">
          <div class="detail-section">
            <h3>Layout</h3>
            <p>${room.layout}</p>
          </div>
          
          <div class="detail-section">
            <h3>Recommended Sizes</h3>
            <div class="size-recommendations">
              ${room.recommendedSizes.map(sizeKey => {
                const size = this.sizeGuides[sizeKey];
                return `<span class="size-badge">${size.name}</span>`;
              }).join('')}
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Tips for Perfect Setup</h3>
            <ul>
              ${room.tips.map(tip => `<li>✓ ${tip}</li>`).join('')}
            </ul>
          </div>
          
          <button class="primary-button" onclick="document.location.href='category.html'">
            Explore Designs
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  selectSize(sizeKey) {
    const size = this.sizeGuides[sizeKey];
    if (typeof customPosterBuilder !== 'undefined') {
      customPosterBuilder.selections.size = sizeKey;
      customPosterBuilder.updatePrice();
      document.location.href = '#custom-poster-builder-section';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  sizeGuideModule.renderSizeGuide();
});
