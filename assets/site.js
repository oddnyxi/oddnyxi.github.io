(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const motion = root.classList.contains('motion');
  const icon = (id) => `<svg class="i"><use href="#i-${id}"/></svg>`;

  // ------------------------------------------------------------ mobile nav
  const menuBtn = $('.menu-btn');
  const setNav = (open) => {
    document.body.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.innerHTML = icon(open ? 'close' : 'menu');
  };
  menuBtn.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
  $$('.side a').forEach((a) => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });

  // ------------------------------------------------------------ active tab on scroll
  const tabs = $$('.tab');
  const sections = tabs.map((t) => $(t.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      tabs.forEach((t) => t.classList.toggle('on', t.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach((s) => spy.observe(s));

  // ------------------------------------------------------------ reveal
  if (motion) {
    const groups = new Map();
    $$('.rv').forEach((el) => {
      const p = el.parentElement;
      const i = groups.get(p) || 0;
      groups.set(p, i + 1);
      el.style.setProperty('--d', Math.min(i, 6) * 0.07 + 's');
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.rv').forEach((el) => io.observe(el));
  }

  // ------------------------------------------------------------ screenshots + lightbox
  const lb = $('#lb');
  const lbImg = $('img', lb);
  const lbCap = $('.lb-cap', lb);
  let lbList = [];
  let lbIndex = 0;
  const shotSrc = (name) => `assets/shots/${name}.webp`;
  const showLb = (i) => {
    lbIndex = (i + lbList.length) % lbList.length;
    const [name, cap] = lbList[lbIndex];
    lbImg.src = shotSrc(name);
    lbImg.alt = cap;
    lbCap.textContent = lbList.length > 1 ? `${cap}  ·  ${lbIndex + 1} / ${lbList.length}` : cap;
    $('.lb-prev', lb).hidden = $('.lb-next', lb).hidden = lbList.length < 2;
  };
  const openLb = (list, i) => {
    lbList = list;
    showLb(i);
    if (typeof lb.showModal === 'function') lb.showModal(); else window.open(shotSrc(list[i][0]), '_blank');
  };
  $('.lb-close', lb).onclick = () => lb.close();
  $('.lb-prev', lb).onclick = () => showLb(lbIndex - 1);
  $('.lb-next', lb).onclick = () => showLb(lbIndex + 1);
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
    if (e.key === 'ArrowRight') showLb(lbIndex + 1);
  });

  $$('.viewer').forEach((v) => {
    const shots = JSON.parse(v.dataset.shots);
    v.innerHTML = `
      <figure class="stage">
        <button type="button" aria-label="Open screenshot"><img alt="" loading="lazy"></button>
        <span class="ibtn expand" aria-hidden="true">${icon('expand')}</span>
        <figcaption></figcaption>
      </figure>
      <div class="thumbs" role="tablist" aria-label="Screenshots"></div>`;
    const img = $('.stage img', v);
    const cap = $('figcaption', v);
    const thumbs = $('.thumbs', v);
    let cur = 0;
    const select = (i) => {
      cur = i;
      img.src = shotSrc(shots[i][0]);
      img.alt = shots[i][1];
      cap.textContent = shots[i][1];
      $$('button', thumbs).forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-selected', String(j === i)); });
    };
    shots.forEach(([name, label], i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', label);
      b.innerHTML = `<img src="${shotSrc(name)}" alt="" loading="lazy">`;
      b.onclick = () => select(i);
      thumbs.appendChild(b);
    });
    $('.stage button', v).onclick = () => openLb(shots, cur);
    select(0);
  });
  $$('.shot-btn').forEach((b) => {
    const group = $$('.shot-btn', b.parentElement).map((x) => [x.dataset.full, x.dataset.cap]);
    b.onclick = () => openLb(group, group.findIndex((g) => g[0] === b.dataset.full));
  });

  // ------------------------------------------------------------ music
  const fmt = (s) => { s = Math.floor(s || 0); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const tracks = $$('.trk');
  const mini = {
    label: $('.mini-label'), title: $('.mini-title'), bar: $('.mini-bar i'),
    play: $('.mini-play'), next: $('.mini-next'), time: $('.mini-time'),
  };
  let current = null;

  const setUi = (trk, playing) => {
    trk.classList.toggle('on', playing);
    $('.pl', trk).innerHTML = icon(playing ? 'pause' : 'play');
    $('.pl', trk).setAttribute('aria-label', (playing ? 'Pause ' : 'Play ') + $('h3', trk).textContent);
    const any = tracks.some((t) => t.classList.contains('on'));
    document.body.classList.toggle('playing', any);
    mini.play.innerHTML = icon(any ? 'pause' : 'play');
    mini.play.setAttribute('aria-label', any ? 'Pause' : 'Play');
    if (current) {
      mini.label.textContent = any ? 'Now playing' : 'Paused';
      mini.title.textContent = $('h3', current).textContent;
    }
  };
  const playTrack = (trk) => {
    const a = $('audio', trk);
    if (current && current !== trk) { $('audio', current).pause(); setUi(current, false); }
    current = trk;
    const p = a.play();
    setUi(trk, true);
    if (p && p.catch) p.catch(() => setUi(trk, false));
  };

  tracks.forEach((trk, idx) => {
    const a = $('audio', trk);
    const bar = $('.bar', trk);
    const fill = $('.bar i', trk);
    a.addEventListener('loadedmetadata', () => { $('.du', trk).textContent = fmt(a.duration); });
    a.addEventListener('timeupdate', () => {
      const pct = a.duration ? (a.currentTime / a.duration) * 100 : 0;
      fill.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', String(Math.round(pct)));
      $('.cu', trk).textContent = fmt(a.currentTime);
      if (trk === current) { mini.bar.style.width = pct + '%'; mini.time.textContent = fmt(a.currentTime); }
    });
    a.addEventListener('ended', () => { setUi(trk, false); fill.style.width = '0'; a.currentTime = 0; playTrack(tracks[(idx + 1) % tracks.length]); });
    a.addEventListener('error', () => { setUi(trk, false); window.open(trk.dataset.url, '_blank', 'noopener'); });
    $('.pl', trk).addEventListener('click', () => { if (a.paused) playTrack(trk); else { a.pause(); setUi(trk, false); } });
    bar.addEventListener('click', (e) => { const r = bar.getBoundingClientRect(); if (a.duration) a.currentTime = ((e.clientX - r.left) / r.width) * a.duration; });
    bar.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { a.currentTime += 5; e.preventDefault(); }
      if (e.key === 'ArrowLeft') { a.currentTime -= 5; e.preventDefault(); }
    });
  });
  mini.play.addEventListener('click', () => {
    const trk = current || tracks[0];
    const a = $('audio', trk);
    if (a.paused) playTrack(trk); else { a.pause(); setUi(trk, false); }
  });
  mini.next.addEventListener('click', () => playTrack(tracks[(tracks.indexOf(current) + 1) % tracks.length]));

  // ------------------------------------------------------------ visuals follow the beat
  if (!motion || !window.BEATS) return;
  const beats = new Map();
  tracks.forEach((t) => {
    const b = atob(window.BEATS[t.dataset.id] || '');
    const u = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    beats.set($('audio', t), u);
  });
  let level = 0, raf = 0, active = null, tilt = 0, target = 0, dir = -1, lastHit = 0, prev = 0;
  const frame = () => {
    let v = 0;
    const playing = active && !active.paused;
    if (playing) {
      const u = beats.get(active), i = Math.floor(active.currentTime * 50);
      for (let k = -2; k <= 1; k++) { const x = u[i + k]; if (x > v) v = x; }
      v /= 255;
    }
    level = Math.max(v, level * 0.9);
    const now = performance.now();
    if (playing && v > 0.55 && prev <= 0.55 && now - lastHit > 160) { dir = -dir; target = dir * 9; lastHit = now; }
    prev = v;
    if (!playing) target = 0;
    tilt += (target - tilt) * 0.32;
    root.style.setProperty('--tilt', tilt.toFixed(2) + 'deg');
    root.style.setProperty('--glow', level.toFixed(3));
    if (level > 0.01 || playing || Math.abs(tilt) > 0.1) raf = requestAnimationFrame(frame);
    else { raf = 0; root.style.removeProperty('--glow'); root.style.removeProperty('--tilt'); }
  };
  document.addEventListener('play', (e) => {
    if (beats.has(e.target)) { active = e.target; if (!raf) raf = requestAnimationFrame(frame); }
  }, true);
})();
