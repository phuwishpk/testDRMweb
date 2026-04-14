// Basic homepage JavaScript for interactivity
document.addEventListener('DOMContentLoaded', function() {
  console.log('Homepage loaded successfully');
  
  // Add active state to current navigation item
  const currentPage = window.location.pathname;
  const navLinks = document.querySelectorAll('.navbar a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === 'index.html' && currentPage.endsWith('/frontend/index.html')) {
      link.classList.add('active');
    }
  });
});

// Optional: Add smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});
