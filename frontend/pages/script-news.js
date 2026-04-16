// News Page JavaScript
document.addEventListener('DOMContentLoaded', async function() {
  console.log('News page loaded');

  // Mark active navigation item
  const navLinks = document.querySelectorAll('.navbar a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === 'news.html') {
      link.classList.add('active');
    }
  });

  const CATEGORY = 'news';
  const postsList = document.getElementById('postsList');
  const addBtn = document.getElementById('addContentBtn');

  function formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  }

  function renderPosts(posts) {
    if (!postsList) return;

    postsList.innerHTML = '';

    if (!Array.isArray(posts) || posts.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'posts-empty';
      empty.textContent = 'ยังไม่มีเนื้อหา';
      postsList.appendChild(empty);
      return;
    }

    posts.forEach(post => {
      const item = document.createElement('article');
      item.className = 'post-item';

      const titleLink = document.createElement('a');
      titleLink.className = 'post-title';
      titleLink.href = `post.html?slug=${encodeURIComponent(post.slug)}`;
      titleLink.textContent = post.title || '(untitled)';

      const meta = document.createElement('div');
      meta.className = 'post-meta';
      meta.textContent = formatDate(post.published_at);

      const summary = document.createElement('div');
      summary.className = 'post-summary';
      summary.textContent = post.summary || '';

      item.appendChild(titleLink);
      if (meta.textContent) item.appendChild(meta);
      if (summary.textContent) item.appendChild(summary);

      postsList.appendChild(item);
    });
  }

  async function loadPosts() {
    if (!postsList) return;

    const loading = document.createElement('p');
    loading.className = 'posts-loading';
    loading.textContent = 'กำลังโหลด...';
    postsList.innerHTML = '';
    postsList.appendChild(loading);

    try {
      const res = await fetch(`/api/posts?category=${encodeURIComponent(CATEGORY)}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const posts = Array.isArray(data) ? data : data && Array.isArray(data.posts) ? data.posts : [];
      renderPosts(posts);
    } catch (err) {
      postsList.innerHTML = '';
      const error = document.createElement('p');
      error.className = 'posts-error';
      error.textContent = 'โหลดรายการเนื้อหาไม่สำเร็จ';
      postsList.appendChild(error);
    }
  }

  async function refreshAdminButton() {
    if (!addBtn) return;

    try {
      const res = await fetch('/api/admin/me', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.authenticated) {
        addBtn.style.display = 'inline-block';
        if (!addBtn.dataset.bound) {
          addBtn.dataset.bound = '1';
          addBtn.addEventListener('click', function() {
            window.location.href = `editor.html?category=${encodeURIComponent(CATEGORY)}`;
          });
        }
      } else {
        addBtn.style.display = 'none';
      }
    } catch (err) {
      // ignore
    }
  }

  await Promise.all([loadPosts(), refreshAdminButton()]);
