// Product Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('Product page loaded');
  
  // Mark active navigation item
  const navLinks = document.querySelectorAll('.navbar a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === 'product.html') {
      link.classList.add('active');
    }
  });
});
