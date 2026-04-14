// DRM in World Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('DRM in World page loaded');
  
  // Server URLs configuration
  const servers = {
    server1: 'http://la6lukiwisdrth.ddns.net:8073',
    server2: 'http://109.129.87.221:8073'
  };

  // Mark active navigation item
  const navLinks = document.querySelectorAll('.navbar a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === 'drm-world.html') {
      link.classList.add('active');
    }
  });

  // Server selector functionality
  const serverSelect = document.getElementById('serverSelect');
  const drmWorldIframe = document.getElementById('drmWorldIframe');
  const helpMessage = document.querySelector('.help-message');

  if (serverSelect && drmWorldIframe) {
    // Load default server (Server 1)
    serverSelect.value = 'server1';
    drmWorldIframe.src = servers.server1;

    // Handle iframe load
    if (helpMessage) {
      const hideHelpMessage = function() {
        helpMessage.classList.add('hide');
        console.log('Content loaded, hiding help message');
      };
      
      drmWorldIframe.addEventListener('load', hideHelpMessage);
      window.addEventListener('load', function() {
        // If still showing after 5 seconds, keep it visible
        setTimeout(function() {
          if (helpMessage && !helpMessage.classList.contains('hide')) {
            console.log('Help message still visible - server might not be responding');
          }
        }, 5000);
      });
    }

    // Handle server selection change
    serverSelect.addEventListener('change', function() {
      const selectedServer = this.value;
      const serverUrl = servers[selectedServer];
      console.log('Server changed to:', selectedServer, 'URL:', serverUrl);
      
      // Show help message on server change
      if (helpMessage) {
        helpMessage.classList.remove('hide');
      }
      
      // Disable select temporarily during switch
      serverSelect.disabled = true;
      drmWorldIframe.src = serverUrl;
      
      // Re-enable after 1 second
      setTimeout(function() {
        serverSelect.disabled = false;
      }, 1000);
    });
  }

  // Reload functionality
  const reloadBtn = document.getElementById('reloadBtn');

  if (reloadBtn && drmWorldIframe) {
    reloadBtn.addEventListener('click', function() {
      console.log('Reload button clicked');
      reloadBtn.classList.add('loading');
      reloadBtn.textContent = '⟳ Loading...';
      reloadBtn.disabled = true;

      // Reload the iframe by resetting its src
      const currentServer = serverSelect ? serverSelect.value : 'server1';
      const src = servers[currentServer];
      drmWorldIframe.src = src;

      // Re-enable button after a short delay
      setTimeout(function() {
        reloadBtn.classList.remove('loading');
        reloadBtn.textContent = '↻ Reload';
        reloadBtn.disabled = false;
      }, 1500);
    });
  }

  // Fullscreen functionality
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const drmWorldEmbed = document.querySelector('.drm-world-embed');

  if (fullscreenBtn && drmWorldEmbed) {
    fullscreenBtn.addEventListener('click', function() {
      console.log('Fullscreen button clicked');
      
      if (!drmWorldEmbed.classList.contains('fullscreen-mode')) {
        // Enter fullscreen
        drmWorldEmbed.classList.add('fullscreen-mode');
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        fullscreenBtn.textContent = 'Exit Full Screen';
        console.log('Entered fullscreen mode');
      } else {
        // Exit fullscreen
        drmWorldEmbed.classList.remove('fullscreen-mode');
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        fullscreenBtn.textContent = 'Expand to Full Screen';
        console.log('Exited fullscreen mode');
      }
    });

    // Close fullscreen on ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && drmWorldEmbed.classList.contains('fullscreen-mode')) {
        drmWorldEmbed.classList.remove('fullscreen-mode');
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        fullscreenBtn.textContent = 'Expand to Full Screen';
        console.log('Exited fullscreen mode via ESC');
      }
    });
  } else {
    console.log('Fullscreen button or embed container not found');
  }
});



