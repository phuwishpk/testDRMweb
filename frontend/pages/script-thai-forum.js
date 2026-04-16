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

  const fullscreenBtn = document.getElementById('fullscreenToggle');
  const fullscreenArea = document.getElementById('forumFullscreenArea');

  if (!fullscreenBtn || !fullscreenArea) return;

  const canFullscreen = typeof fullscreenArea.requestFullscreen === 'function' && typeof document.exitFullscreen === 'function';
  if (!canFullscreen) {
    fullscreenBtn.disabled = true;
    fullscreenBtn.setAttribute('aria-disabled', 'true');
    fullscreenBtn.title = 'เบราว์เซอร์นี้ไม่รองรับโหมดเต็มจอ';
    return;
  }

  function updateFullscreenButton() {
    const isFullscreen = document.fullscreenElement === fullscreenArea;
    fullscreenBtn.textContent = isFullscreen ? 'ออกเต็มจอ' : 'เต็มจอ';
    fullscreenBtn.setAttribute('aria-pressed', isFullscreen ? 'true' : 'false');
  }

  fullscreenBtn.addEventListener('click', function() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      fullscreenArea.requestFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', updateFullscreenButton);
  updateFullscreenButton();
});
