// Universal Navbar Component
function createNavbar() {
  const currentPath = window.location.pathname;
  const user = JSON.parse(localStorage.getItem('utm_user') || '{}');
  const userName = user.name || user.email || 'User';
  
  const navLinks = [
    { href: '/dashboard', text: 'Dashboard' },
    { href: '/journey', text: 'User Journey' },
    { href: '/utm-builder', text: 'UTM Builder' },
    { href: '/domains', text: 'Domains' },
    { href: '/setup-generator', text: 'Get Tracking Code' }
  ];
  
  const navbar = `
    <!-- Modern Navigation -->
    <nav class="dashboard-nav">
      <div class="nav-container">
        <div class="nav-brand">
          <a href="/dashboard" class="nav-logo">
            <div class="nav-logo-icon">🚀</div>
            <span>FlowTrack AI</span>
          </a>
          <button class="mobile-menu-btn" id="mobileMenuBtn">
            <div class="hamburger">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
        
        <div class="nav-menu">
          ${navLinks.map(link => `
            <a href="${link.href}" class="${currentPath === link.href ? 'active' : ''}">${link.text}</a>
          `).join('')}
        </div>
        
        <div class="nav-actions">
          <button class="notification-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span class="notification-badge"></span>
          </button>
          
          <button class="user-menu-btn" id="userMenuBtn">
            <div class="user-avatar">${userName.charAt(0).toUpperCase()}</div>
            <span class="user-name">${userName}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </nav>
    
    <!-- Mobile Navigation Drawer -->
    <div class="mobile-nav-drawer" id="mobileNavDrawer">
      <div class="mobile-nav-content">
        <div class="mobile-user-info">
          <div class="mobile-user-header">
            <div class="mobile-user-avatar">${userName.charAt(0).toUpperCase()}</div>
            <div class="mobile-user-details">
              <h3>${userName}</h3>
              <p>${user.email || ''}</p>
            </div>
          </div>
        </div>
        
        <div class="mobile-nav-links">
          ${navLinks.map(link => `
            <a href="${link.href}" class="${currentPath === link.href ? 'active' : ''}">${link.text}</a>
          `).join('')}
        </div>
        
        <div class="mobile-nav-divider"></div>
        
        <div class="mobile-nav-links">
          <a href="#" onclick="handleLogout()">Sign Out</a>
        </div>
      </div>
    </div>
    
    <div class="mobile-nav-overlay" id="mobileNavOverlay"></div>
  `;
  
  return navbar;
}

// Initialize navbar
function initNavbar() {
  // Find existing navbar
  const existingNav = document.querySelector('.navbar, nav');
  if (existingNav) {
    existingNav.outerHTML = createNavbar();
  } else {
    // Insert at beginning of body
    document.body.insertAdjacentHTML('afterbegin', createNavbar());
  }
  
  // Initialize mobile menu
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const mobileNavOverlay = document.getElementById('mobileNavOverlay');
  const userMenuBtn = document.getElementById('userMenuBtn');
  
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuBtn.classList.toggle('active');
      mobileNavDrawer.classList.toggle('open');
      mobileNavOverlay.classList.toggle('active');
    });
  }
  
  if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener('click', () => {
      mobileMenuBtn.classList.remove('active');
      mobileNavDrawer.classList.remove('open');
      mobileNavOverlay.classList.remove('active');
    });
  }
  
  if (userMenuBtn) {
    userMenuBtn.addEventListener('click', () => {
      if (confirm('Sign out?')) {
        handleLogout();
      }
    });
  }
}

// Logout handler
function handleLogout() {
  localStorage.removeItem('utm_token');
  localStorage.removeItem('utm_user');
  window.location.href = '/';
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavbar);
} else {
  initNavbar();
}