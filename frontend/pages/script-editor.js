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

    function swapBlocks(i, j) {
      if (!Number.isInteger(i) || !Number.isInteger(j)) return;
      if (i < 0 || j < 0 || i >= state.blocks.length || j >= state.blocks.length) return;
      const tmp = state.blocks[i];
      state.blocks[i] = state.blocks[j];
      state.blocks[j] = tmp;

      if (state.activeImageBlockIndex === i) state.activeImageBlockIndex = j;
      else if (state.activeImageBlockIndex === j) state.activeImageBlockIndex = i;

      renderBlocksEditor();
      renderPreview();
      renderMediaGallery();
    }

  const state = {
    contentHtml: '',
    editingPostId: null,
    selectedImage: null
  };

  function setEditorMode(isEdit) {
    const saveBtn = qs('saveBtn');
    const deleteBtn = qs('deleteBtn');
    const heading = document.querySelector('.page-content h2');

    if (saveBtn) saveBtn.textContent = isEdit ? 'บันทึกการแก้ไข' : 'บันทึก';
    if (deleteBtn) deleteBtn.style.display = isEdit ? 'inline-block' : 'none';
    if (heading) heading.textContent = isEdit ? 'แก้ไขเนื้อหา (Admin)' : 'เพิ่มเนื้อหา (Admin)';
  }

  function blocksToHtml(blocks) {
    if (!Array.isArray(blocks)) return '';
    const parts = [];
    blocks.forEach((b) => {
      if (!b || typeof b !== 'object') return;
      const type = String(b.type || '').toLowerCase();
      if (type === 'text') {
        const text = String(b.text || '').trim();
        if (!text) return;
        text.split(/\n+/).forEach(line => {
          parts.push(`<p>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`);
        });
        return;
      }
      if (type === 'link') {
        const url = String(b.url || '').trim();
        const label = String(b.label || '').trim() || url;
        if (!url) return;
        parts.push(`<p><a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a></p>`);
        return;
      }
      if (type === 'image') {
        const src = String(b.src || '').trim();
        if (!src) return;
        const align = String(b.align || 'center').toLowerCase();
        const width = Number(b.widthPercent);
        const widthPercent = Number.isFinite(width) ? Math.min(Math.max(width, 10), 100) : 100;
        const caption = String(b.caption || '').trim();
        parts.push(
          `<div style="text-align:${align};"><img src="${src}" style="width:${widthPercent}%;" alt="image" /></div>` +
            (caption ? `<div style="text-align:${align}; color:#666; font-size:0.95em;">${caption}</div>` : '')
        );
      }
    });
    return parts.join('');
  }

  function applyPostToForm(post) {
    state.editingPostId = Number(post.id) || null;

    const categoryEl = qs('category');
    const titleEl = qs('title');
    const summaryEl = qs('summary');
    const cancelLink = qs('cancelLink');
    const editor = qs('wysiwygEditor');

    if (categoryEl && post.category) categoryEl.value = post.category;
    if (titleEl) titleEl.value = post.title || '';
    if (summaryEl) summaryEl.value = post.summary || '';
    if (cancelLink) {
      const back = post.category === 'news' ? 'news.html' : post.category === 'event' ? 'event.html' : 'thai-forum.html';
      cancelLink.setAttribute('href', back);
    }

    const htmlFromPost = typeof post.content_html === 'string' ? post.content_html : '';
    if (editor) {
      editor.innerHTML = htmlFromPost || blocksToHtml(post.content?.blocks);
      state.contentHtml = editor.innerHTML;
    }

    setEditorMode(true);
  }

  async function loadPostForEdit(id) {
    const msg = qs('formMessage');
    try {
      const res = await fetch(`/api/admin/posts/${encodeURIComponent(id)}`, { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setText(msg, data?.error || 'โหลดข้อมูลที่แก้ไขไม่สำเร็จ');
        return false;
      }

      const post = await res.json();
      applyPostToForm(post);
      setText(msg, '');
      return true;
    } catch {
      setText(msg, 'โหลดข้อมูลที่แก้ไขไม่สำเร็จ');
      return false;
    }
  }

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

      const moveUp = document.createElement('button');
      moveUp.className = 'move';
      moveUp.type = 'button';
      moveUp.textContent = 'ขึ้น';
      moveUp.disabled = idx === 0;
      moveUp.addEventListener('click', () => {
        swapBlocks(idx, idx - 1);
      });

      const moveDown = document.createElement('button');
      moveDown.className = 'move';
      moveDown.type = 'button';
      moveDown.textContent = 'ลง';
      moveDown.disabled = idx === state.blocks.length - 1;
      moveDown.addEventListener('click', () => {
        swapBlocks(idx, idx + 1);
      });

      row.appendChild(title);
      row.appendChild(moveUp);
      row.appendChild(moveDown);
      row.appendChild(remove);
      card.appendChild(row);

      const fields = document.createElement('div');
      fields.className = 'block-fields';

      if (b.type === 'text') {
        const label = document.createElement('div');
        label.className = 'small';
        label.textContent = 'ข้อความ';

        // Rich text toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'text-toolbar';

        const boldBtn = document.createElement('button');
        boldBtn.type = 'button';
        boldBtn.textContent = 'ตัวหนา';
        boldBtn.className = 'fmt-btn';
        boldBtn.addEventListener('click', (e) => {
          e.preventDefault();
          editor.focus();
          document.execCommand('bold');
        });
        toolbar.appendChild(boldBtn);

        const italicBtn = document.createElement('button');
        italicBtn.type = 'button';
        italicBtn.textContent = 'ตัวเอียง';
        italicBtn.className = 'fmt-btn';
        italicBtn.addEventListener('click', (e) => {
          e.preventDefault();
          editor.focus();
          document.execCommand('italic');
        });
        toolbar.appendChild(italicBtn);

        const underlineBtn = document.createElement('button');
        underlineBtn.type = 'button';
        underlineBtn.textContent = 'เส้นใต้';
        underlineBtn.className = 'fmt-btn';
        underlineBtn.addEventListener('click', (e) => {
          e.preventDefault();
          editor.focus();
          document.execCommand('underline');
        });
        toolbar.appendChild(underlineBtn);

        const colorLabel = document.createElement('label');
        colorLabel.textContent = 'สี: ';
        colorLabel.style.display = 'flex';
        colorLabel.style.alignItems = 'center';
        colorLabel.style.gap = '6px';
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = '#000000';
        colorPicker.addEventListener('change', () => {
          editor.focus();
          document.execCommand('foreColor', false, colorPicker.value);
        });
        colorLabel.appendChild(colorPicker);
        toolbar.appendChild(colorLabel);

        const fontSizeLabel = document.createElement('label');
        fontSizeLabel.textContent = 'ขนาด: ';
        fontSizeLabel.style.display = 'flex';
        fontSizeLabel.style.alignItems = 'center';
        fontSizeLabel.style.gap = '6px';
        const fontSizeSelect = document.createElement('select');
        ['12', '14', '16', '18', '20', '24', '28', '32'].forEach(sz => {
          const opt = document.createElement('option');
          opt.value = sz;
          opt.textContent = sz + 'px';
          fontSizeSelect.appendChild(opt);
        });
        fontSizeSelect.value = '16';
        fontSizeSelect.addEventListener('change', () => {
          editor.focus();
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0 || sel.toString().length === 0) return;

          const range = sel.getRangeAt(0);
          const newSize = fontSizeSelect.value + 'px';

          // Replace the full selection with a single span so mixed sizes become uniform.
          const fragment = range.extractContents();
          const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT, null);
          const elementsToClean = [];

          while (walker.nextNode()) {
            elementsToClean.push(walker.currentNode);
          }

          elementsToClean.forEach((el) => {
            if (el && el.style && el.style.fontSize) {
              el.style.removeProperty('font-size');
              if (!el.getAttribute('style')) {
                el.removeAttribute('style');
              }
            }
          });

          const span = document.createElement('span');
          span.style.fontSize = newSize;
          span.appendChild(fragment);
          range.insertNode(span);

          // Re-select the inserted content so the user can keep editing it.
          sel.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          sel.addRange(newRange);

          editor.focus();
          b.html = editor.innerHTML;
          b.text = editor.innerText;
          renderPreview();
        });
        fontSizeLabel.appendChild(fontSizeSelect);
        toolbar.appendChild(fontSizeLabel);

        const fontFamilyLabel = document.createElement('label');
        fontFamilyLabel.textContent = 'Font: ';
        fontFamilyLabel.style.display = 'flex';
        fontFamilyLabel.style.alignItems = 'center';
        fontFamilyLabel.style.gap = '6px';
        const fontFamilySelect = document.createElement('select');
        [
          { label: 'Default', value: 'inherit' },
          { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
          { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
          { label: 'Courier', value: "'Courier New', Courier, monospace" },
          { label: 'Georgia', value: 'Georgia, serif' },
          { label: 'Verdana', value: 'Verdana, sans-serif' },
          { label: 'Segoe UI', value: "'Segoe UI', sans-serif" },
          { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
          { label: 'Impact', value: 'Impact, fantasy' },
          { label: 'Prompt (Thai)', value: "'Prompt', sans-serif" },
          { label: 'Sarabun (Thai)', value: "'Sarabun', sans-serif" },
          { label: 'Anuphan (Thai)', value: "'Anuphan', sans-serif" },
          { label: 'TH SarabunPSK', value: "'TH SarabunPSK', sans-serif" }
        ].forEach(font => {
          const opt = document.createElement('option');
          opt.value = font.value;
          opt.textContent = font.label;
          fontFamilySelect.appendChild(opt);
        });
        fontFamilySelect.value = 'inherit';
        fontFamilySelect.addEventListener('change', () => {
          editor.focus();
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0 || sel.toString().length === 0) return;

          const range = sel.getRangeAt(0);
          const newFamily = fontFamilySelect.value;

          // Extract and clean font-family styles
          const fragment = range.extractContents();
          const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT, null);
          const elementsToClean = [];

          while (walker.nextNode()) {
            elementsToClean.push(walker.currentNode);
          }

          elementsToClean.forEach((el) => {
            if (el && el.style && el.style.fontFamily) {
              el.style.removeProperty('font-family');
              if (!el.getAttribute('style')) {
                el.removeAttribute('style');
              }
            }
          });

          const span = document.createElement('span');
          if (newFamily !== 'inherit') {
            span.style.fontFamily = newFamily;
          }
          span.appendChild(fragment);
          range.insertNode(span);

          // Re-select the inserted content
          sel.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          sel.addRange(newRange);

          editor.focus();
          b.html = editor.innerHTML;
          b.text = editor.innerText;
          renderPreview();
        });
        fontFamilyLabel.appendChild(fontFamilySelect);
        toolbar.appendChild(fontFamilyLabel);

        // Contenteditable div for rich text
        const editor = document.createElement('div');
        editor.className = 'text-editor';
        editor.contentEditable = 'true';
        editor.innerHTML = b.html || b.text || '';
        editor.style.minHeight = '120px';
        editor.style.border = '1px solid rgba(0, 0, 0, 0.15)';
        editor.style.borderRadius = '8px';
        editor.style.padding = '10px 12px';
        editor.style.fontSize = '1em';
        editor.style.fontFamily = 'inherit';
        editor.addEventListener('input', () => {
          b.html = editor.innerHTML;
          b.text = editor.innerText;
          renderPreview();
        });

        fields.appendChild(toolbar);
        fields.appendChild(label);
        fields.appendChild(editor);
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

    // simulate final post width so percentage-based image sizes match real scale
    const sim = document.createElement('div');
    sim.className = 'preview-sim';

    const blocks = state.blocks;
    if (!blocks.length) {
      const empty = document.createElement('div');
      empty.className = 'small';
      empty.textContent = 'ยังไม่มีเนื้อหา';
      sim.appendChild(empty);
      preview.appendChild(sim);
      return;
    }

    blocks.forEach((b) => {
      if (b.type === 'text') {
        const html = String(b.html || '').trim();
        const text = String(b.text || '').trim();
        if (!text) return;

        // If we have rich HTML, use it; otherwise use plain text
        if (html) {
          const p = document.createElement('p');
          p.className = 'p';
          p.innerHTML = html;
          sim.appendChild(p);
        } else {
          text.split(/\n+/).forEach(line => {
            const p = document.createElement('p');
            p.className = 'p';
            p.textContent = line;
            sim.appendChild(p);
          });
        }
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

        sim.appendChild(p);
        return;
      }

      if (b.type === 'image') {
        if (!b.src) {
          const warn = document.createElement('div');
          warn.className = 'small';
          warn.textContent = 'บล็อกรูป: ยังไม่ได้เลือกรูป';
          sim.appendChild(warn);
          return;
        }

        const wrap = document.createElement('div');
        wrap.className = 'img-wrap';

        // align using flex so percentage widths are calculated against the simulated post width
        const align = String(b.align || 'center').toLowerCase();
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.alignItems = align === 'right' ? 'flex-end' : align === 'left' ? 'flex-start' : 'center';

        const img = document.createElement('img');
        img.src = b.src;
        img.alt = b.caption ? String(b.caption) : 'image';
        const w = Number(b.widthPercent);
        img.style.width = `${Number.isFinite(w) ? Math.min(Math.max(w, 10), 100) : 100}%`;
        img.style.maxWidth = '100%';
        img.style.display = 'block';

        wrap.appendChild(img);

        if (b.caption && String(b.caption).trim()) {
          const cap = document.createElement('div');
          cap.className = 'img-caption';
          cap.textContent = String(b.caption);
          wrap.appendChild(cap);
        }

        sim.appendChild(wrap);
      }
    });

    preview.appendChild(sim);
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

  function insertHtmlAtCursor(html) {
    if (document.queryCommandSupported && document.queryCommandSupported('insertHTML')) {
      document.execCommand('insertHTML', false, html);
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const el = document.createElement('div');
    el.innerHTML = html;
    const frag = document.createDocumentFragment();
    while (el.firstChild) frag.appendChild(el.firstChild);
    range.insertNode(frag);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function applyInlineStyle(editor, styleProp, value) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.toString().length === 0) return;
    const range = sel.getRangeAt(0);

    // Ensure selection is inside editor
    const container = range.commonAncestorContainer;
    if (!editor.contains(container)) return;

    const fragment = range.extractContents();
    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT, null);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((el) => {
      if (el && el.style && el.style[styleProp]) {
        el.style.removeProperty(styleProp);
        if (!el.getAttribute('style')) el.removeAttribute('style');
      }
    });

    const span = document.createElement('span');
    if (value !== 'inherit') {
      span.style[styleProp] = value;
    }
    span.appendChild(fragment);
    range.insertNode(span);

    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.addRange(newRange);
  }

  function setupWysiwyg(editor) {
    const toolbar = qs('wysiwygToolbar');
    const colorPicker = qs('fontColorPicker');
    const fontSizeSelect = qs('fontSizeSelect');
    const fontFamilySelect = qs('fontFamilySelect');
    const lineHeightSelect = qs('lineHeightSelect');
    const insertLinkBtn = qs('insertLinkBtn');
    const imgSizeRange = qs('imgSizeRange');
    const imgAlignLeft = qs('imgAlignLeft');
    const imgAlignCenter = qs('imgAlignCenter');
    const imgAlignRight = qs('imgAlignRight');
    const imgReset = qs('imgReset');
    const imgCaptionBtn = qs('imgCaptionBtn');

    function clearImageSelection() {
      if (state.selectedImage) {
        state.selectedImage.classList.remove('img-selected');
      }
      state.selectedImage = null;
    }

    function getImageWidthPercent(img) {
      if (!img) return 100;
      const styleWidth = img.style.width || '';
      const match = styleWidth.match(/(\d+(?:\.\d+)?)%/);
      if (match) return Math.round(Number(match[1]));
      const imgWidth = img.getBoundingClientRect().width || 0;
      const editorWidth = editor.getBoundingClientRect().width || 1;
      return Math.max(10, Math.min(100, Math.round((imgWidth / editorWidth) * 100)));
    }

    function updateImageControls(img) {
      if (!imgSizeRange) return;
      imgSizeRange.value = String(getImageWidthPercent(img));
    }

    function ensureFigure(img) {
      if (!img) return null;
      const figure = img.closest('figure');
      if (figure) return figure;

      const wrapper = document.createElement('figure');
      wrapper.className = 'img-figure';
      const parent = img.parentNode;
      parent.insertBefore(wrapper, img);
      wrapper.appendChild(img);
      return wrapper;
    }

    function ensureCaption(img) {
      const figure = ensureFigure(img);
      if (!figure) return null;
      let cap = figure.querySelector('figcaption');
      if (!cap) {
        cap = document.createElement('figcaption');
        cap.setAttribute('contenteditable', 'true');
        cap.setAttribute('data-placeholder', 'พิมพ์คำอธิบายใต้รูป...');
        figure.appendChild(cap);
      }
      return cap;
    }

    function setImageAlign(img, align) {
      if (!img) return;
      const figure = ensureFigure(img);
      img.style.display = 'block';
      if (align === 'left') {
        img.style.marginLeft = '0';
        img.style.marginRight = 'auto';
      } else if (align === 'right') {
        img.style.marginLeft = 'auto';
        img.style.marginRight = '0';
      } else {
        img.style.marginLeft = 'auto';
        img.style.marginRight = 'auto';
      }
      img.dataset.align = align;
      if (figure) figure.style.textAlign = align;
    }

    if (toolbar) {
      toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-cmd]');
        if (!btn) return;
        e.preventDefault();
        editor.focus();
        const cmd = btn.getAttribute('data-cmd');
        const value = btn.getAttribute('data-value');
        if (cmd === 'formatBlock' && value) {
          document.execCommand('formatBlock', false, value);
        } else {
          document.execCommand(cmd);
        }
      });
    }

    if (insertLinkBtn) {
      insertLinkBtn.addEventListener('click', () => {
        editor.focus();
        const url = window.prompt('ใส่ลิงก์ (https://...)');
        if (!url) return;
        document.execCommand('createLink', false, url);
      });
    }

    if (imgSizeRange) {
      imgSizeRange.addEventListener('input', () => {
        if (!state.selectedImage) return;
        const value = Math.max(10, Math.min(100, Number(imgSizeRange.value) || 100));
        state.selectedImage.style.width = `${value}%`;
      });
    }

    if (imgAlignLeft) {
      imgAlignLeft.addEventListener('click', () => {
        if (!state.selectedImage) return;
        setImageAlign(state.selectedImage, 'left');
      });
    }

    if (imgAlignCenter) {
      imgAlignCenter.addEventListener('click', () => {
        if (!state.selectedImage) return;
        setImageAlign(state.selectedImage, 'center');
      });
    }

    if (imgAlignRight) {
      imgAlignRight.addEventListener('click', () => {
        if (!state.selectedImage) return;
        setImageAlign(state.selectedImage, 'right');
      });
    }

    if (imgReset) {
      imgReset.addEventListener('click', () => {
        if (!state.selectedImage) return;
        state.selectedImage.style.width = '100%';
        setImageAlign(state.selectedImage, 'center');
        if (imgSizeRange) imgSizeRange.value = '100';
        const fig = state.selectedImage.closest('figure');
        if (fig) {
          const cap = fig.querySelector('figcaption');
          if (cap) cap.remove();
        }
      });
    }

    if (imgCaptionBtn) {
      imgCaptionBtn.addEventListener('click', () => {
        if (!state.selectedImage) {
          window.alert('กรุณาคลิกรูปก่อน');
          return;
        }
        const cap = ensureCaption(state.selectedImage);
        if (cap) {
          cap.focus();
        }
      });
    }

    if (colorPicker) {
      colorPicker.addEventListener('change', () => {
        editor.focus();
        applyInlineStyle(editor, 'color', colorPicker.value);
      });
    }

    if (fontSizeSelect) {
      fontSizeSelect.addEventListener('change', () => {
        editor.focus();
        applyInlineStyle(editor, 'font-size', `${fontSizeSelect.value}px`);
      });
    }

    if (fontFamilySelect) {
      fontFamilySelect.addEventListener('change', () => {
        editor.focus();
        applyInlineStyle(editor, 'font-family', fontFamilySelect.value);
      });
    }

    if (lineHeightSelect) {
      lineHeightSelect.addEventListener('change', () => {
        editor.focus();
        applyInlineStyle(editor, 'line-height', lineHeightSelect.value);
      });
    }

    editor.addEventListener('paste', (e) => {
      if (!e.clipboardData || !e.clipboardData.items) return;
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find(item => item.type && item.type.startsWith('image/'));
      if (!imageItem) return;

      const file = imageItem.getAsFile();
      if (!file) return;
      const maxBytes = 20 * 1024 * 1024;
      if (file.size > maxBytes) {
        e.preventDefault();
        window.alert('รูปใหญ่เกิน 20MB');
        return;
      }

      e.preventDefault();
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        insertHtmlAtCursor(
          `<figure class="img-figure"><img src="${dataUrl}" alt="pasted image" /></figure>`
        );
        editor.focus();
      };
      reader.readAsDataURL(file);
    });

    editor.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.tagName === 'IMG') {
        if (state.selectedImage && state.selectedImage !== target) {
          state.selectedImage.classList.remove('img-selected');
        }
        state.selectedImage = target;
        target.classList.add('img-selected');
        updateImageControls(target);
      } else {
        clearImageSelection();
      }
    });

    editor.addEventListener('input', (e) => {
      const target = e.target;
      if (target && target.tagName === 'FIGCAPTION') {
        // Keep caption editable and within the editor
        target.setAttribute('contenteditable', 'true');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await ensureAdmin();

    const notAdmin = qs('notAdmin');
    const form = qs('postForm');
    const editor = qs('wysiwygEditor');

    if (!isAdmin) {
      notAdmin.style.display = 'block';
      form.style.display = 'none';
      return;
    }

    notAdmin.style.display = 'none';
    form.style.display = 'grid';

    setEditorMode(false);

    if (editor) {
      setupWysiwyg(editor);
      editor.addEventListener('input', () => {
        state.contentHtml = editor.innerHTML;
      });
    }

    const p = new URLSearchParams(window.location.search);
    const editId = Number(p.get('id'));
    const categoryEl = qs('category');

    if (Number.isInteger(editId) && editId > 0) {
      const loaded = await loadPostForEdit(editId);
      if (!loaded) return;
    } else {
      const cat = normalizeCategory(p.get('category'));
      if (cat) categoryEl.value = cat;
    }

    const cancelLink = qs('cancelLink');
    const currentCategory = normalizeCategory(categoryEl && categoryEl.value ? categoryEl.value : p.get('category'));
    const back = currentCategory === 'news' ? 'news.html' : currentCategory === 'event' ? 'event.html' : 'thai-forum.html';
    cancelLink.setAttribute('href', back);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const msg = qs('formMessage');
      const category = qs('category').value;
      const title = String(qs('title').value || '').trim();
      const summary = String(qs('summary').value || '').trim();
      const html = editor ? String(editor.innerHTML || '').trim() : '';
      const plain = editor ? String(editor.textContent || '').trim() : '';

      if (!title) {
        setText(msg, 'กรุณากรอกหัวข้อ');
        return;
      }

      if (!plain) {
        setText(msg, 'กรุณากรอกเนื้อหา');
        return;
      }

      setText(msg, 'กำลังบันทึก...');

      const payload = {
        category,
        title,
        summary,
        content_html: html
      };

      try {
        const isEdit = Number.isInteger(state.editingPostId) && state.editingPostId > 0;
        const res = await fetch(isEdit ? `/api/admin/posts/${encodeURIComponent(state.editingPostId)}` : '/api/admin/posts', {
          method: isEdit ? 'PUT' : 'POST',
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

    const deleteBtn = qs('deleteBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!Number.isInteger(state.editingPostId) || state.editingPostId <= 0) return;

        const confirmed = window.confirm('ลบเนื้อหานี้ถาวรหรือไม่?');
        if (!confirmed) return;

        const msg = qs('formMessage');
        setText(msg, 'กำลังลบ...');

        try {
          const res = await fetch(`/api/admin/posts/${encodeURIComponent(state.editingPostId)}`, {
            method: 'DELETE',
            credentials: 'include'
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setText(msg, data?.error || 'ลบไม่สำเร็จ');
            return;
          }

          window.location.href = qs('category').value === 'news' ? 'news.html' : qs('category').value === 'event' ? 'event.html' : 'thai-forum.html';
        } catch {
          setText(msg, 'ลบไม่สำเร็จ');
        }
      });
    }
  });
})();
