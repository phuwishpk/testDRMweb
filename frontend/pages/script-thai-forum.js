// Thai Forum Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('Thai Forum page loaded');
  
  // Mark active navigation item
  const navLinks = document.querySelectorAll('.navbar a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === 'thai-forum.html') {
      link.classList.add('active');
    }
  });
});
