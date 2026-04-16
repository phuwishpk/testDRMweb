// Login Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // Mark active navigation item
  const navLinks = document.querySelectorAll('.navbar a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === 'login.html') {
      link.classList.add('active');
    }
  });

  const loginStatus = document.getElementById('loginStatus');
  const loginForm = document.getElementById('loginForm');
  const usernameEl = document.getElementById('username');
  const passwordEl = document.getElementById('password');
  const logoutBtn = document.getElementById('logoutBtn');

  function setStatus(msg) {
    loginStatus.textContent = msg;
  }

  function getRedirectTarget() {
    const p = new URLSearchParams(window.location.search);
    const r = p.get('redirect');
    if (!r) return null;

    // Allow only same-folder relative redirects (basic safety)
    if (r.startsWith('http://') || r.startsWith('https://') || r.startsWith('//')) return null;
    if (r.includes('..')) return null;
    return r;
  }

  async function refreshStatus() {
    try {
      const res = await fetch('/api/admin/me', { credentials: 'include' });
      const data = await res.json();

      if (data && data.authenticated) {
        setStatus('Logged in as admin');
        logoutBtn.style.display = 'inline-block';
        usernameEl.disabled = true;
        passwordEl.disabled = true;
        return;
      }

      setStatus('');
      logoutBtn.style.display = 'none';
      usernameEl.disabled = false;
      passwordEl.disabled = false;
    } catch {
      setStatus('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = String(usernameEl.value || '').trim();
    const password = String(passwordEl.value || '');

    if (!username || !password) {
      setStatus('กรุณากรอก username และ password');
      return;
    }

    setStatus('กำลังเข้าสู่ระบบ...');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        setStatus('เข้าสู่ระบบไม่สำเร็จ');
        return;
      }

      const target = getRedirectTarget();
      if (target) {
        window.location.href = target;
      } else {
        window.location.href = 'thai-forum.html';
      }
    } catch {
      setStatus('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  });

  logoutBtn.addEventListener('click', async () => {
    setStatus('กำลังออกจากระบบ...');
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    usernameEl.value = '';
    passwordEl.value = '';
    await refreshStatus();
    setStatus('ออกจากระบบแล้ว');
  });

  refreshStatus();
});
