// Event Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('Event page loaded');
  
  // Mark active navigation item
  const navLinks = document.querySelectorAll('.navbar a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === 'event.html') {
      link.classList.add('active');
    }
  });
});
