// DRM E-learning Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('DRM E-learning page loaded');
  
  // Mark active navigation item
  const navLinks = document.querySelectorAll('.navbar a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === 'drm-elearning.html') {
      link.classList.add('active');
    }
  });
});
