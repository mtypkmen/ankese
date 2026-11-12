// Ana sayfa bolumleri (public/preview/hero-d.js'ten tasindi, 2026-11-10).
// Header kaydirma ve mozaik hizalama header.js'te.

// "Ankesat ne trend": kartlar iki satir halinde ekranin solundan sagina surekli kayar.
// JS yoksa kartlar normal izgarada (.sgrid) kalir.
(function () {
  var grid = document.querySelector('.sgrid');
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.children);
  function shuffled() {
    var a = cards.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  var wrap = document.createElement('div');
  wrap.className = 'marquee';
  [{ speed: 38 }, { speed: 30 }].forEach(function (cfg, r) {
    var row = document.createElement('div');
    row.className = 'mrow';
    var track = document.createElement('div');
    track.className = 'mtrack';
    var list = shuffled();
    if (r === 1) list.push(list.shift()); // iki satirda ayni kart ust uste gelmesin
    list.forEach(function (c) { track.appendChild(c.cloneNode(true)); });
    // kesintisiz dongu icin ikinci kopya (ekran okuyucu ve klavye icin gizli)
    list.forEach(function (c) {
      var d = c.cloneNode(true);
      d.setAttribute('aria-hidden', 'true');
      d.querySelectorAll('a').forEach(function (x) { x.tabIndex = -1; });
      track.appendChild(d);
    });
    track.style.setProperty('--px', cfg.speed);
    row.appendChild(track);
    wrap.appendChild(row);
  });
  grid.parentNode.replaceWith(wrap);
  function timing() {
    wrap.querySelectorAll('.mtrack').forEach(function (t) {
      var half = t.scrollWidth / 2;
      t.style.animationDuration = (half / parseFloat(t.style.getPropertyValue('--px'))) + 's';
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(timing);
  timing();
})();

// "Ankesat e fundit": yatay kart karuseli. Oklar .ltrack'i translateX ile kaydirir.
// 5 saniyede bir otomatik ilerler. Sona gelince basa doner.
// Ekranda ayni anda tam 2 kart: kart genisligi = (basligin solundan ekranin sagina - sag bosluk - kartlar arasi bosluk) / 2
(function () {
  var section = document.querySelector('.latest2');
  var wrap = document.querySelector('.ltrack-wrap'), track = document.querySelector('.ltrack');
  if (!section || !wrap || !track) return;
  var cards = Array.prototype.slice.call(track.children);
  var next = document.querySelector('.lnext'), prev = document.querySelector('.lprev');
  var n = cards.length, i = 0, DELAY = 5000, timer = null;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function gap() { return parseFloat(getComputedStyle(track).columnGap) || 0; } // CSS'teki gap (mobilde 20, genis ekranda 36)
  function size() {
    if (window.innerWidth <= 800) { section.style.removeProperty('--lcw'); return; }
    var vis = document.documentElement.clientWidth - wrap.getBoundingClientRect().left - 32;
    section.style.setProperty('--lcw', Math.floor((vis - gap()) / 2) + 'px');
  }
  function slide() {
    if (!cards[i]) return;
    var g = gap(), offset = 0;
    for (var k = 0; k < i; k++) offset += cards[k].offsetWidth + g;
    track.style.transform = 'translateX(-' + offset + 'px)';
    // ana slayt beyaz (on), siradakiler saydam + ince beyaz cerceve
    cards.forEach(function (c, k) { c.classList.toggle('on', k === i); });
  }
  function go(d) {
    i = (i + d + n) % n;
    slide();
    restart();
  }
  function restart() {
    clearTimeout(timer);
    // sag butonun etrafindaki halka: her yeni 5 saniyede bastan dolar
    if (next) { next.classList.remove('run'); void next.offsetWidth; }
    if (reduce) return;
    if (next) next.classList.add('run');
    timer = setTimeout(function () { go(1); }, DELAY);
  }
  if (next) next.addEventListener('click', function () { go(1); });
  if (prev) prev.addEventListener('click', function () { go(-1); });
  // boyut degisince once kart genisligi, sonra kayma miktari yeniden hesaplanir (aktif kart hizada kalir)
  window.addEventListener('resize', function () { size(); slide(); });
  size(); slide(); restart();
})();

// "Kompanite me te suksesshme": aramali kategori dropdown'u.
// Siralama verisi (puan) henuz yok; secilen kategori sadece etikette gosterilir. Puanlama yazilinca
// secim degisince leaderboard bu kategori icin yeniden yuklenecek.
(function () {
  var root = document.querySelector('.best');
  if (!root) return;
  var dd = root.querySelector('[data-dd]');
  if (!dd) return;
  var btn = dd.querySelector('.dd-btn'), val = dd.querySelector('.dd-val');
  var panel = dd.querySelector('.dd-panel'), input = dd.querySelector('input'), empty = dd.querySelector('.dd-empty');
  var opts = Array.prototype.slice.call(dd.querySelectorAll('[role="option"]'));
  if (!opts.length) return;
  var current = opts[0].getAttribute('data-v'), active = -1;
  opts.forEach(function (o, k) { o.id = 'dd-opt-' + k; });

  // --- dropdown ---
  function visible() { return opts.filter(function (o) { return !o.hidden; }); }
  function setActive(k) {
    var v = visible();
    opts.forEach(function (o) { o.classList.remove('act'); });
    active = v.length ? (k + v.length) % v.length : -1;
    if (active < 0) { input.removeAttribute('aria-activedescendant'); return; }
    v[active].classList.add('act');
    input.setAttribute('aria-activedescendant', v[active].id);
    v[active].scrollIntoView({ block: 'nearest' });
  }
  // aksan farki gozetmeden ara (e = ë, c = ç)
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function filter() {
    var q = norm(input.value.trim());
    opts.forEach(function (o) { o.hidden = !!q && norm(o.textContent).indexOf(q) === -1; });
    empty.hidden = visible().length > 0;
    setActive(0);
  }
  function open() {
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    input.value = ''; filter();
    var sel = 0;
    visible().forEach(function (o, k) { if (o.getAttribute('data-v') === current) sel = k; });
    setActive(sel);
    input.focus();
  }
  function close(refocus) {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (refocus) btn.focus();
  }
  function choose(o) {
    current = o.getAttribute('data-v');
    val.textContent = o.textContent;
    opts.forEach(function (x) { x.setAttribute('aria-selected', x === o ? 'true' : 'false'); });
    // secilen kategorinin listesini goster (listeler sunucudan hazir gelir)
    Array.prototype.forEach.call(root.querySelectorAll('.lb'), function (l) { l.hidden = l.getAttribute('data-pane') !== current; });
    close(true);
  }

  btn.addEventListener('click', function () { if (panel.hidden) open(); else close(true); });
  input.addEventListener('input', filter);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); var v = visible(); if (v[active]) choose(v[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'Tab') close(false);
  });
  opts.forEach(function (o) {
    o.addEventListener('mousedown', function (e) { e.preventDefault(); }); // arama kutusu odagi kaybetmesin
    o.addEventListener('click', function () { choose(o); });
    o.addEventListener('mousemove', function () { var k = visible().indexOf(o); if (k !== active) setActive(k); });
  });
  document.addEventListener('mousedown', function (e) { if (!panel.hidden && !dd.contains(e.target)) close(false); });

  opts[0].setAttribute('aria-selected', 'true');
})();
