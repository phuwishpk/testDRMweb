// Contact Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('Contact page loaded');
  
  // Mark active navigation item
  const navLinks = document.querySelectorAll('.navbar a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === 'contact.html') {
      link.classList.add('active');
    }
  });
});
