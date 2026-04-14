// News Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('News page loaded');
  
  // Mark active navigation item
  const navLinks = document.querySelectorAll('.navbar a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === 'news.html') {
      link.classList.add('active');
    }
  });
});
