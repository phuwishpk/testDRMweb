// Editor Page JavaScript
(function () {
  function qs(id) {
    return document.getElementById(id);
  }

  function setText(el, text) {
    el.textContent = text;
  }

  function normalizeCategory(input) {
    const v = String(input || '').trim().toLowerCase();
    if (v === 'thai-forum') return 'thai_forum';
    if (v === 'thai_forum' || v === 'news' || v === 'event') return v;
    return null;
  }

  function isValidHttpUrl(value) {
    try {
      const u = new URL(value);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  const state = {
    blocks: [],
    activeImageBlockIndex: null,
    media: []
  };

  function renderBlocksEditor() {
    const container = qs('blocks');
    container.innerHTML = '';

    state.blocks.forEach((b, idx) => {
      const card = document.createElement('div');
      card.className = 'block-card';

      const row = document.createElement('div');
      row.className = 'row';

      const title = document.createElement('div');
      title.className = 'block-title';
      title.textContent = b.type === 'text' ? `Text #${idx + 1}` : b.type === 'link' ? `Link #${idx + 1}` : `Image #${idx + 1}`;

      const remove = document.createElement('button');
      remove.className = 'remove';
      remove.type = 'button';
      remove.textContent = 'ลบ';
      remove.addEventListener('click', () => {
        state.blocks.splice(idx, 1);
        if (state.activeImageBlockIndex === idx) state.activeImageBlockIndex = null;
        if (state.activeImageBlockIndex !== null && state.activeImageBlockIndex > idx) {
          state.activeImageBlockIndex -= 1;
        }
        renderBlocksEditor();
        renderPreview();
        renderMediaGallery();
      });

      row.appendChild(title);
      row.appendChild(remove);
      card.appendChild(row);

      const fields = document.createElement('div');
      fields.className = 'block-fields';

      if (b.type === 'text') {
        const label = document.createElement('div');
        label.className = 'small';
        label.textContent = 'ข้อความ';

        const textarea = document.createElement('textarea');
        textarea.rows = 4;
        textarea.value = b.text || '';
        textarea.addEventListener('input', () => {
          b.text = textarea.value;
          renderPreview();
        });

        fields.appendChild(label);
        fields.appendChild(textarea);
      }

      if (b.type === 'link') {
        const wrap = document.createElement('div');
        wrap.className = 'inline';

        const urlLabel = document.createElement('label');
        urlLabel.className = 'field';
        urlLabel.innerHTML = '<span>URL (http/https)</span>';
        const urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.value = b.url || '';
        urlInput.placeholder = 'https://...';
        urlInput.addEventListener('input', () => {
          b.url = urlInput.value;
          renderPreview();
        });
        urlLabel.appendChild(urlInput);

        const textLabel = document.createElement('label');
        textLabel.className = 'field';
        textLabel.innerHTML = '<span>ข้อความลิงก์</span>';
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = b.label || '';
        textInput.placeholder = 'เช่น อ่านเพิ่มเติม';
        textInput.addEventListener('input', () => {
          b.label = textInput.value;
          renderPreview();
        });
        textLabel.appendChild(textInput);

        wrap.appendChild(urlLabel);
        wrap.appendChild(textLabel);
        fields.appendChild(wrap);
      }

      if (b.type === 'image') {
        const wrap = document.createElement('div');
        wrap.className = 'inline3';

        const alignLabel = document.createElement('label');
        alignLabel.className = 'field';
        alignLabel.innerHTML = '<span>ตำแหน่ง</span>';
        const alignSel = document.createElement('select');
        ['left', 'center', 'right'].forEach(v => {
          const opt = document.createElement('option');
          opt.value = v;
          opt.textContent = v;
          alignSel.appendChild(opt);
        });
        alignSel.value = b.align || 'center';
        alignSel.addEventListener('change', () => {
          b.align = alignSel.value;
          renderPreview();
        });
        alignLabel.appendChild(alignSel);

        const widthLabel = document.createElement('label');
        widthLabel.className = 'field';
        widthLabel.innerHTML = '<span>ขนาด (%)</span>';
        const widthInput = document.createElement('input');
        widthInput.type = 'number';
        widthInput.min = '10';
        widthInput.max = '100';
        widthInput.step = '1';
        widthInput.value = String(b.widthPercent || 100);
        widthInput.addEventListener('input', () => {
          const n = Number(widthInput.value);
          b.widthPercent = Number.isFinite(n) ? n : 100;
          renderPreview();
        });
        widthLabel.appendChild(widthInput);

        const pickLabel = document.createElement('div');
        pickLabel.className = 'field';
        const pickSpan = document.createElement('span');
        pickSpan.textContent = 'รูป';
        const pickBtn = document.createElement('button');
        pickBtn.type = 'button';
        pickBtn.textContent = 'เลือกจากคลัง';
        pickBtn.style.background = '#333';
        pickBtn.style.color = '#fff';
        pickBtn.style.border = '0';
        pickBtn.style.padding = '10px 12px';
        pickBtn.style.borderRadius = '8px';
        pickBtn.style.cursor = 'pointer';
        pickBtn.addEventListener('click', () => {
          state.activeImageBlockIndex = idx;
          renderMediaGallery();
        });
        pickLabel.appendChild(pickSpan);
        pickLabel.appendChild(pickBtn);

        wrap.appendChild(alignLabel);
        wrap.appendChild(widthLabel);
        wrap.appendChild(pickLabel);

        fields.appendChild(wrap);

        const captionLabel = document.createElement('label');
        captionLabel.className = 'field';
        captionLabel.innerHTML = '<span>คำอธิบายรูป (ไม่บังคับ)</span>';
        const capInput = document.createElement('input');
        capInput.type = 'text';
        capInput.value = b.caption || '';
        capInput.addEventListener('input', () => {
          b.caption = capInput.value;
          renderPreview();
        });
        captionLabel.appendChild(capInput);
        fields.appendChild(captionLabel);

        const current = document.createElement('div');
        current.className = 'small';
        current.textContent = b.src ? `เลือกแล้ว: ${b.src}` : 'ยังไม่ได้เลือกรูป (กด “เลือกจากคลัง”)';
        fields.appendChild(current);
      }

      card.appendChild(fields);
      container.appendChild(card);
    });
  }

  function renderPreview() {
    const preview = qs('preview');
    preview.innerHTML = '';

    const blocks = state.blocks;
    if (!blocks.length) {
      const empty = document.createElement('div');
      empty.className = 'small';
      empty.textContent = 'ยังไม่มีเนื้อหา';
      preview.appendChild(empty);
      return;
    }

    blocks.forEach((b) => {
      if (b.type === 'text') {
        const text = String(b.text || '').trim();
        if (!text) return;

        text.split(/\n+/).forEach(line => {
          const p = document.createElement('p');
          p.className = 'p';
          p.textContent = line;
          preview.appendChild(p);
        });
        return;
      }

      if (b.type === 'link') {
        const url = String(b.url || '').trim();
        const label = String(b.label || '').trim() || url;

        const p = document.createElement('p');
        p.className = 'p';

        if (isValidHttpUrl(url)) {
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = label;
          p.appendChild(a);
        } else {
          p.textContent = 'ลิงก์ไม่ถูกต้อง';
        }

        preview.appendChild(p);
        return;
      }

      if (b.type === 'image') {
        if (!b.src) {
          const warn = document.createElement('div');
          warn.className = 'small';
          warn.textContent = 'บล็อกรูป: ยังไม่ได้เลือกรูป';
          preview.appendChild(warn);
          return;
        }

        const wrap = document.createElement('div');
        wrap.className = 'img-wrap';
        wrap.style.textAlign = b.align || 'center';

        const img = document.createElement('img');
        img.src = b.src;
        img.alt = b.caption ? String(b.caption) : 'image';
        const w = Number(b.widthPercent);
        img.style.width = `${Number.isFinite(w) ? Math.min(Math.max(w, 10), 100) : 100}%`;

        wrap.appendChild(img);

        if (b.caption && String(b.caption).trim()) {
          const cap = document.createElement('div');
          cap.className = 'img-caption';
          cap.textContent = String(b.caption);
          wrap.appendChild(cap);
        }

        preview.appendChild(wrap);
      }
    });
  }

  function renderMediaGallery() {
    const gallery = qs('mediaGallery');
    gallery.innerHTML = '';

    if (!state.media.length) {
      const empty = document.createElement('div');
      empty.className = 'small';
      empty.textContent = 'ยังไม่มีรูปในคลัง (อัปโหลดได้ด้านบน)';
      gallery.appendChild(empty);
      return;
    }

    state.media.forEach((m) => {
      const item = document.createElement('div');
      item.className = 'media-item';
      if (state.activeImageBlockIndex !== null) item.classList.toggle('active', false);

      const img = document.createElement('img');
      img.src = m.url;
      img.alt = m.original_name || 'image';

      const caption = document.createElement('div');
      caption.className = 'caption';
      caption.textContent = m.original_name || m.url;

      item.appendChild(img);
      item.appendChild(caption);

      item.addEventListener('click', () => {
        if (state.activeImageBlockIndex === null) return;
        const b = state.blocks[state.activeImageBlockIndex];
        if (!b || b.type !== 'image') return;
        b.src = m.url;
        state.activeImageBlockIndex = null;
        renderBlocksEditor();
        renderPreview();
        renderMediaGallery();
      });

      gallery.appendChild(item);
    });

    if (state.activeImageBlockIndex !== null) {
      // highlight hint
      const hint = document.createElement('div');
      hint.className = 'small';
      hint.textContent = 'กำลังเลือกภาพ: คลิกภาพในคลังเพื่อใส่ให้บล็อกที่เลือก';
      gallery.prepend(hint);
    }
  }

  async function loadMedia() {
    try {
      const res = await fetch('/api/admin/media', { credentials: 'include' });
      if (!res.ok) throw new Error('not ok');
      const data = await res.json();
      state.media = Array.isArray(data) ? data : [];
    } catch {
      state.media = [];
    }
    renderMediaGallery();
  }

  async function ensureAdmin() {
    try {
      const res = await fetch('/api/admin/me', { credentials: 'include' });
      const data = await res.json();
      return !!data?.authenticated;
    } catch {
      return false;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await ensureAdmin();

    const notAdmin = qs('notAdmin');
    const form = qs('postForm');

    if (!isAdmin) {
      notAdmin.style.display = 'block';
      form.style.display = 'none';
      return;
    }

    notAdmin.style.display = 'none';
    form.style.display = 'grid';

    // init category from query param
    const p = new URLSearchParams(window.location.search);
    const cat = normalizeCategory(p.get('category'));
    const categoryEl = qs('category');
    if (cat) categoryEl.value = cat;

    // cancel link back to category page
    const cancelLink = qs('cancelLink');
    const back = cat === 'news' ? 'news.html' : cat === 'event' ? 'event.html' : 'thai-forum.html';
    cancelLink.setAttribute('href', back);

    qs('addText').addEventListener('click', () => {
      state.blocks.push({ type: 'text', text: '' });
      renderBlocksEditor();
      renderPreview();
    });

    qs('addLink').addEventListener('click', () => {
      state.blocks.push({ type: 'link', url: '', label: '' });
      renderBlocksEditor();
      renderPreview();
    });

    qs('addImage').addEventListener('click', () => {
      state.blocks.push({ type: 'image', src: '', align: 'center', widthPercent: 100, caption: '' });
      renderBlocksEditor();
      renderPreview();
    });

    qs('uploadMedia').addEventListener('click', async () => {
      const fileInput = qs('mediaFile');
      const file = fileInput.files && fileInput.files[0];
      const msg = qs('formMessage');

      if (!file) {
        setText(msg, 'กรุณาเลือกไฟล์รูปก่อนอัปโหลด');
        return;
      }

      setText(msg, 'กำลังอัปโหลดรูป...');

      const fd = new FormData();
      fd.append('image', file);

      try {
        const res = await fetch('/api/admin/media', {
          method: 'POST',
          credentials: 'include',
          body: fd
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setText(msg, data?.error || 'อัปโหลดไม่สำเร็จ');
          return;
        }

        fileInput.value = '';
        setText(msg, 'อัปโหลดสำเร็จ');
        await loadMedia();
      } catch {
        setText(msg, 'อัปโหลดไม่สำเร็จ');
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const msg = qs('formMessage');
      const category = qs('category').value;
      const title = String(qs('title').value || '').trim();
      const summary = String(qs('summary').value || '').trim();

      if (!title) {
        setText(msg, 'กรุณากรอกหัวข้อ');
        return;
      }

      setText(msg, 'กำลังบันทึก...');

      const payload = {
        category,
        title,
        summary,
        content: { blocks: state.blocks }
      };

      try {
        const res = await fetch('/api/admin/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setText(msg, data?.error || 'บันทึกไม่สำเร็จ');
          return;
        }

        const slug = data.slug;
        if (slug) {
          window.location.href = `post.html?slug=${encodeURIComponent(slug)}`;
          return;
        }

        setText(msg, 'บันทึกสำเร็จ');
      } catch {
        setText(msg, 'บันทึกไม่สำเร็จ');
      }
    });

    renderBlocksEditor();
    renderPreview();
    await loadMedia();
  });
})();
