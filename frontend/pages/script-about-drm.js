// About DRM Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('About DRM page loaded');
  
  // Mark active navigation item
  const navLinks = document.querySelectorAll('.navbar a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === 'about-drm.html') {
      link.classList.add('active');
    }
  });
});
