// Futuristic Animations and Interactions
class NeuralAnimations {
  constructor() {
    this.initializeAnimations();
    this.initializeInteractions();
    this.initializeParticles();
  }

  initializeAnimations() {
    // Fade in animations on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
      observer.observe(el);
    });

    // Stat card animations
    document.querySelectorAll('.stat-card').forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
    });
  }

  initializeInteractions() {
    // Button ripple effect
    document.querySelectorAll('.btn').forEach(button => {
      button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
      });
    });

    // Card hover tilt effect
    document.querySelectorAll('.stat-card, .card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
      });
    });
  }

  initializeParticles() {
    // Create neural network background particles
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'neural-particles';
    document.body.appendChild(particlesContainer);

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (20 + Math.random() * 20) + 's';
      particlesContainer.appendChild(particle);
    }
  }

  // Smooth number counter animation
  animateCounter(element, target, duration = 1000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current).toLocaleString();
    }, 16);
  }

  // Typewriter effect
  typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    
    const type = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    };
    
    type();
  }
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new NeuralAnimations();
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  /* Ripple Effect */
  .btn {
    position: relative;
    overflow: hidden;
  }
  
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  /* Fade In Animation */
  .fade-in {
    opacity: 0;
    transform: translateY(30px);
  }
  
  .fade-in.animate-in {
    opacity: 1;
    transform: translateY(0);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Neural Particles */
  .neural-particles {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }
  
  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: var(--neural-glow);
    border-radius: 50%;
    opacity: 0.3;
    animation: float-particle linear infinite;
  }
  
  @keyframes float-particle {
    from {
      transform: translateY(100vh) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 0.3;
    }
    90% {
      opacity: 0.3;
    }
    to {
      transform: translateY(-100vh) rotate(360deg);
      opacity: 0;
    }
  }
  
  /* Card 3D Effect */
  .stat-card,
  .card {
    transform-style: preserve-3d;
    transition: transform 0.3s ease;
  }
  
  /* Loading Skeleton */
  .skeleton {
    background: linear-gradient(90deg, 
      rgba(255, 255, 255, 0.05) 25%, 
      rgba(255, 255, 255, 0.1) 50%, 
      rgba(255, 255, 255, 0.05) 75%
    );
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;
document.head.appendChild(style);