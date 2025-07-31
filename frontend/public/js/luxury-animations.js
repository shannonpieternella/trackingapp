class LuxuryAnimations {
  constructor() {
    this.initScrollAnimations();
    this.initHoverEffects();
    this.initParallax();
    this.initCursorEffects();
    this.initPageTransitions();
  }

  initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          
          // Stagger animations for child elements
          const children = entry.target.querySelectorAll('[data-animate-child]');
          children.forEach((child, index) => {
            child.style.animationDelay = `${index * 100}ms`;
            child.classList.add('animate-in');
          });
        }
      });
    }, observerOptions);

    // Observe all animatable elements
    document.querySelectorAll('[data-animate]').forEach(el => {
      observer.observe(el);
    });
  }

  initHoverEffects() {
    // Magnetic buttons
    document.querySelectorAll('.btn').forEach(button => {
      button.addEventListener('mousemove', (e) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const deltaX = (x - centerX) / centerX;
        const deltaY = (y - centerY) / centerY;
        
        button.style.transform = `translate(${deltaX * 2}px, ${deltaY * 2}px)`;
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translate(0, 0)';
      });
    });

    // Card tilt effect
    document.querySelectorAll('.stat-card, .data-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
      });
    });
  }

  initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      
      parallaxElements.forEach(element => {
        const speed = element.dataset.parallax || 0.5;
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    });
  }

  initCursorEffects() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    const cursorDot = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    document.body.appendChild(cursorDot);

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Smooth cursor animation
    const animateCursor = () => {
      const dx = mouseX - cursorX;
      const dy = mouseY - cursorY;
      
      cursorX += dx * 0.1;
      cursorY += dy * 0.1;
      
      cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      
      requestAnimationFrame(animateCursor);
    };
    animateCursor();

    // Cursor interactions
    const interactiveElements = document.querySelectorAll('a, button, .btn, .stat-card, .data-card');
    
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('cursor-hover');
        cursorDot.classList.add('cursor-hover');
      });
      
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('cursor-hover');
        cursorDot.classList.remove('cursor-hover');
      });
    });
  }

  initPageTransitions() {
    const links = document.querySelectorAll('a[href^="/"]');
    
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Skip if it's a hash link or download
        if (href.startsWith('#') || link.hasAttribute('download')) return;
        
        e.preventDefault();
        
        // Add page transition
        document.body.classList.add('page-transitioning');
        
        setTimeout(() => {
          window.location.href = href;
        }, 300);
      });
    });
  }

  // Utility method for smooth number animations
  animateValue(element, start, end, duration) {
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + (end - start) * easeOutQuart);
      
      element.textContent = current.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  // Chart animations
  animateChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0)');
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0.3)');
    
    // Animate chart drawing
    let progress = 0;
    const animateChart = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw chart with current progress
      ctx.beginPath();
      ctx.strokeStyle = '#667eea';
      ctx.lineWidth = 2;
      
      const step = width / (data.length - 1);
      data.forEach((value, index) => {
        const x = index * step;
        const y = height - (value / Math.max(...data)) * height * progress;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Fill area
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      
      progress += 0.02;
      if (progress < 1) {
        requestAnimationFrame(animateChart);
      }
    };
    
    animateChart();
  }
}

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new LuxuryAnimations();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  [data-animate] {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  [data-animate].animate-in {
    opacity: 1;
    transform: translateY(0);
  }
  
  [data-animate-child] {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  [data-animate-child].animate-in {
    opacity: 1;
    transform: translateY(0);
  }
  
  .custom-cursor {
    position: fixed;
    width: 40px;
    height: 40px;
    border: 2px solid rgba(102, 126, 234, 0.5);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    transition: all 0.1s ease;
    transform-origin: center;
  }
  
  .cursor-dot {
    position: fixed;
    width: 6px;
    height: 6px;
    background: #667eea;
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
  }
  
  .custom-cursor.cursor-hover {
    width: 60px;
    height: 60px;
    border-color: rgba(102, 126, 234, 0.3);
    background: rgba(102, 126, 234, 0.1);
  }
  
  .cursor-dot.cursor-hover {
    transform: translate(-50%, -50%) scale(0.5);
  }
  
  .page-transitioning {
    opacity: 0;
    transform: scale(0.98);
    transition: all 0.3s ease;
  }
  
  @media (hover: none) {
    .custom-cursor,
    .cursor-dot {
      display: none;
    }
  }
`;
document.head.appendChild(style);