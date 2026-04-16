// Post Page JavaScript
(function () {
  function qs(id) {
    return document.getElementById(id);
  }

  function setText(el, text) {
    el.textContent = text;
  }

  function isValidHttpUrl(value) {
    try {
      const u = new URL(value);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function formatDate(value) {
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleString('th-TH');
    } catch {
      return '';
    }
  }

  function categoryToBackLink(category) {
    if (category === 'news') return { href: 'news.html', label: '← กลับไปหน้า News' };
    if (category === 'event') return { href: 'event.html', label: '← กลับไปหน้า Event' };
    return { href: 'thai-forum.html', label: '← กลับไปหน้า Thai Forum' };
  }

  function renderContent(container, content) {
    container.innerHTML = '';

    const blocks = content && Array.isArray(content.blocks) ? content.blocks : [];
    if (!blocks.length) {
      const p = document.createElement('p');
      p.textContent = 'ไม่มีเนื้อหา';
      container.appendChild(p);
      return;
    }

    blocks.forEach((b) => {
      if (!b || typeof b !== 'object') return;
      const type = String(b.type || '').toLowerCase();

      if (type === 'text') {
        const text = String(b.text || '').trim();
        if (!text) return;
        text.split(/\n+/).forEach(line => {
          const p = document.createElement('p');
          p.textContent = line;
          container.appendChild(p);
        });
        return;
      }

      if (type === 'link') {
        const url = String(b.url || '').trim();
        const label = String(b.label || '').trim() || url;

        const p = document.createElement('p');
        if (isValidHttpUrl(url)) {
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = label;
          p.appendChild(a);
        } else {
          p.textContent = label;
        }

        container.appendChild(p);
        return;
      }

      if (type === 'image') {
        const src = String(b.src || '').trim();
        if (!src) return;

        const wrap = document.createElement('div');
        wrap.className = 'img-wrap';
        wrap.style.textAlign = String(b.align || 'center');

        const img = document.createElement('img');
        img.src = src;
        img.alt = String(b.caption || 'image');

        const w = Number(b.widthPercent);
        img.style.width = `${Number.isFinite(w) ? Math.min(Math.max(w, 10), 100) : 100}%`;

        wrap.appendChild(img);

        const capText = String(b.caption || '').trim();
        if (capText) {
          const cap = document.createElement('div');
          cap.className = 'img-caption';
          cap.textContent = capText;
          wrap.appendChild(cap);
        }

        container.appendChild(wrap);
      }
    });
  }

  async function loadComments(slug) {
    const list = qs('commentsList');
    list.innerHTML = '';

    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/comments`);
      if (!res.ok) throw new Error('not ok');
      const data = await res.json();

      const comments = Array.isArray(data) ? data : [];
      if (!comments.length) {
        const empty = document.createElement('div');
        empty.textContent = 'ยังไม่มีคอมเมนต์';
        empty.style.color = '#777';
        list.appendChild(empty);
        return;
      }

      comments.forEach((c) => {
        const card = document.createElement('div');
        card.className = 'comment';

        const head = document.createElement('div');
        head.className = 'head';

        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = c.author_name || 'Guest';

        const time = document.createElement('div');
        time.className = 'time';
        time.textContent = formatDate(c.created_at);

        head.appendChild(name);
        head.appendChild(time);

        const msg = document.createElement('div');
        msg.className = 'msg';
        msg.textContent = c.message || '';

        card.appendChild(head);
        card.appendChild(msg);
        list.appendChild(card);
      });
    } catch {
      const err = document.createElement('div');
      err.textContent = 'โหลดคอมเมนต์ไม่สำเร็จ';
      err.style.color = '#777';
      list.appendChild(err);
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const p = new URLSearchParams(window.location.search);
    const slug = p.get('slug');

    const titleEl = qs('postTitle');
    const metaEl = qs('postMeta');
    const contentEl = qs('postContent');
    const backLink = qs('backLink');

    if (!slug) {
      setText(titleEl, 'ไม่พบ slug');
      return;
    }

    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`);
      if (!res.ok) {
        setText(titleEl, 'ไม่พบเนื้อหา');
        return;
      }

      const post = await res.json();
      setText(titleEl, post.title || '');
      setText(metaEl, post.published_at ? `เผยแพร่: ${formatDate(post.published_at)}` : '');

      const back = categoryToBackLink(post.category);
      backLink.href = back.href;
      backLink.textContent = back.label;

      renderContent(contentEl, post.content);
    } catch {
      setText(titleEl, 'โหลดเนื้อหาไม่สำเร็จ');
      return;
    }

    await loadComments(slug);

    const form = qs('commentForm');
    const nameEl = qs('commentName');
    const msgEl = qs('commentMessage');
    const statusEl = qs('commentStatus');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const authorName = String(nameEl.value || '').trim();
      const message = String(msgEl.value || '').trim();

      if (!message) {
        setText(statusEl, 'กรุณาพิมพ์ข้อความคอมเมนต์');
        return;
      }

      setText(statusEl, 'กำลังส่ง...');

      try {
        const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorName, message })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setText(statusEl, data?.error || 'ส่งไม่สำเร็จ');
          return;
        }

        msgEl.value = '';
        setText(statusEl, 'ส่งแล้ว');
        await loadComments(slug);
      } catch {
        setText(statusEl, 'ส่งไม่สำเร็จ');
      }
    });
  });
})();
