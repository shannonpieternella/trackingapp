// Premium Animation Library
class PremiumAnimations {
  constructor() {
    this.init();
  }

  init() {
    this.initScrollTrigger();
    this.initHoverEffects();
    this.initPageTransitions();
    this.initCounters();
    this.initCharts();
    this.initMouseFollower();
  }

  // Scroll-triggered animations
  initScrollTrigger() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('in-view');
          }, index * 50);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe all animatable elements
    document.querySelectorAll('[data-animate]').forEach(el => {
      observer.observe(el);
    });
  }

  // Premium hover effects
  initHoverEffects() {
    // 3D tilt effect for cards
    document.querySelectorAll('.card, .stat-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        
        // Add shine effect
        const shine = card.querySelector('.card-shine') || this.createShine(card);
        shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.1) 0%, transparent 60%)`;
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        const shine = card.querySelector('.card-shine');
        if (shine) shine.style.background = 'none';
      });
    });

    // Magnetic buttons
    document.querySelectorAll('.btn').forEach(button => {
      button.addEventListener('mousemove', (e) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        button.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translate(0, 0)';
      });
    });
  }

  createShine(element) {
    const shine = document.createElement('div');
    shine.className = 'card-shine';
    shine.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      border-radius: inherit;
      z-index: 1;
    `;
    element.style.position = 'relative';
    element.appendChild(shine);
    return shine;
  }

  // Smooth page transitions
  initPageTransitions() {
    document.querySelectorAll('a[href^="/"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#') || link.hasAttribute('download')) return;
        
        e.preventDefault();
        document.body.classList.add('page-exit');
        
        setTimeout(() => {
          window.location.href = href;
        }, 300);
      });
    });
  }

  // Animated counters
  initCounters() {
    document.querySelectorAll('[data-counter]').forEach(counter => {
      const target = parseInt(counter.getAttribute('data-counter'));
      const duration = 2000;
      const start = 0;
      const increment = target / (duration / 16);
      let current = start;
      
      const updateCounter = () => {
        current += increment;
        if (current < target) {
          counter.textContent = Math.floor(current).toLocaleString();
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target.toLocaleString();
        }
      };
      
      // Start animation when in view
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          updateCounter();
          observer.disconnect();
        }
      });
      
      observer.observe(counter);
    });
  }

  // Animated charts
  initCharts() {
    document.querySelectorAll('[data-chart]').forEach(canvas => {
      const type = canvas.getAttribute('data-chart');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
      
      switch(type) {
        case 'line':
          this.drawLineChart(ctx, canvas);
          break;
        case 'bar':
          this.drawBarChart(ctx, canvas);
          break;
        case 'donut':
          this.drawDonutChart(ctx, canvas);
          break;
      }
    });
  }

  drawLineChart(ctx, canvas) {
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const data = [30, 45, 35, 50, 40, 60, 45, 70, 65, 80, 75, 90];
    const max = Math.max(...data);
    
    // Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(94, 58, 238, 0.4)');
    gradient.addColorStop(1, 'rgba(94, 58, 238, 0)');
    
    let progress = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (height * i) / 4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Draw line
      ctx.beginPath();
      ctx.strokeStyle = '#5E3AEE';
      ctx.lineWidth = 3;
      
      data.forEach((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - (value / max) * height * progress;
        
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
      
      // Draw points
      data.forEach((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - (value / max) * height * progress;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#5E3AEE';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      
      progress += 0.02;
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  drawBarChart(ctx, canvas) {
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const data = [60, 80, 45, 90, 70, 85];
    const max = Math.max(...data);
    const barWidth = width / data.length * 0.6;
    const spacing = width / data.length * 0.4;
    
    let progress = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      data.forEach((value, index) => {
        const x = index * (barWidth + spacing) + spacing / 2;
        const barHeight = (value / max) * height * progress;
        const y = height - barHeight;
        
        // Gradient
        const gradient = ctx.createLinearGradient(0, y, 0, height);
        gradient.addColorStop(0, '#7C5CFF');
        gradient.addColorStop(1, '#5E3AEE');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Rounded top
        ctx.beginPath();
        ctx.arc(x + barWidth / 2, y, barWidth / 2, Math.PI, 0);
        ctx.fill();
      });
      
      progress += 0.02;
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  drawDonutChart(ctx, canvas) {
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const innerRadius = radius * 0.6;
    
    const data = [35, 25, 20, 20];
    const colors = ['#5E3AEE', '#7C5CFF', '#4ECDC4', '#FF6B6B'];
    const total = data.reduce((a, b) => a + b, 0);
    
    let currentAngle = -Math.PI / 2;
    let progress = 0;
    
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      data.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI * progress;
        
        // Draw slice
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fillStyle = colors[index];
        ctx.fill();
        
        currentAngle += sliceAngle;
      });
      
      // Reset for next frame
      if (progress < 1) {
        currentAngle = -Math.PI / 2;
        progress += 0.02;
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  // Mouse follower
  initMouseFollower() {
    const follower = document.createElement('div');
    follower.className = 'mouse-follower';
    follower.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      border: 2px solid rgba(94, 58, 238, 0.3);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      transition: transform 0.15s ease-out, opacity 0.15s ease-out;
      opacity: 0;
    `;
    document.body.appendChild(follower);
    
    let mouseX = 0, mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      follower.style.opacity = '1';
      follower.style.transform = `translate(${mouseX - 20}px, ${mouseY - 20}px)`;
    });
    
    // Hide on mobile
    if ('ontouchstart' in window) {
      follower.style.display = 'none';
    }
  }
}

// Initialize animations
document.addEventListener('DOMContentLoaded', () => {
  new PremiumAnimations();
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  [data-animate] {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  [data-animate].in-view {
    opacity: 1;
    transform: translateY(0);
  }
  
  .page-exit {
    opacity: 0;
    transform: scale(0.98);
    transition: all 0.3s ease;
  }
  
  .card, .stat-card {
    transform-style: preserve-3d;
    transition: transform 0.3s ease;
  }
  
  .btn {
    transition: transform 0.2s ease;
  }
`;
document.head.appendChild(style);