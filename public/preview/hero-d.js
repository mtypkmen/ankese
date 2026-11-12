// ONIZLEME: sayfa biraz kaydirilinca header'a "scrolled" sinifi ekler.
// Mor bolge CSS gecisiyle yavasca beyaza doner; header zaten sticky.
(function () {
  var bar = document.querySelector('.bar');
  if (!bar) return;
  var ticking = false;
  function update() {
    bar.classList.toggle('scrolled', window.scrollY > 20);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  update();

  // Mozaigi kaydir: mor karo (kiz) header'da menu ile "Hyr / Regjistrohu" arasinda tam ortada dursun
  // (menunun sonu ile mor karo arasi = mor karo ile giris yazisi arasi).
  var menu = bar.querySelector('.menu a:last-child');
  var acc = bar.querySelector('.acc');
  var root = document.documentElement;
  function align() {
    if (!menu || !acc || window.innerWidth <= 960) { root.style.removeProperty('--mr'); return; }
    var u = parseFloat(getComputedStyle(document.querySelector('.mosaic')).width) / 7;
    var left = (menu.getBoundingClientRect().right + acc.getBoundingClientRect().left - u * 2) / 2; // mor karonun sol kenari
    var mr = bar.clientWidth - left - u * 5; // mor karo mozaikte 2. sutunda, sagda 3 karo daha var
    root.style.setProperty('--mr', Math.max(0, mr) + 'px');
  }
  window.addEventListener('resize', align);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(align);
  align();
})();

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

// "Kompanite me te suksesshme": aramali kategori dropdown'u + ilk 5 firma leaderboard.
// BEST_DEMO simdilik sahte veri: [ad, puan (100 uzerinden), cozulen ankesa, dunku sira].
// Backend gelince her kategori icin ayni alanlar donecek; degisim = dunku sira - bugunku sira.
(function () {
  var root = document.querySelector('.best');
  if (!root) return;
  var TOP = 4;
  var BEST_DEMO = {
    'telefoni-internet': [['Demo Telekom', 96, 412, 3], ['Demo Net', 92, 233, 1], ['Demo Mobile', 90, 518, 2], ['Demo Fiber', 86, 97, 4], ['Demo Kabllor', 82, 64, 7]],
    'banka-hua': [['Demo Banka', 94, 301, 1], ['Demo Kredi', 92, 122, 4], ['Demo Financa', 88, 188, 2], ['Demo Kursim', 84, 76, 3], ['Demo Pagesa', 80, 54, 5]],
    'sigurime': [['Demo Sigurime', 90, 143, 2], ['Demo Garanci', 88, 88, 1], ['Demo Mbrojtje', 84, 61, 3], ['Demo Siguria', 78, 47, 6], ['Demo Polica', 76, 39, 5]],
    'blerje-online': [['Demo Shop', 98, 640, 1], ['Demo Market', 92, 377, 3], ['Demo Dyqan', 90, 205, 2], ['Demo Porosi', 86, 118, 4], ['Demo Bli', 84, 92, 5]],
    'energji-uje': [['Demo Energji', 82, 512, 2], ['Demo Ujësjellës', 80, 260, 1], ['Demo Rrjeti', 76, 144, 3], ['Demo Drita', 72, 98, 5], ['Demo Ngrohje', 70, 40, 4]],
    'transport-poste': [['Demo Posta', 92, 284, 3], ['Demo Ajrore', 90, 190, 1], ['Demo Kargo', 88, 151, 2], ['Demo Linja', 82, 77, 4], ['Demo Taksi', 80, 58, 5]],
    'shendetesi': [['Demo Klinika', 96, 96, 1], ['Demo Spitali', 90, 141, 2], ['Demo Farmacia', 88, 73, 5], ['Demo Laborator', 86, 52, 3], ['Demo Dental', 84, 38, 4]],
    'restorante-ushqim': [['Demo Pica', 94, 120, 2], ['Demo Restorant', 92, 88, 1], ['Demo Delivery', 88, 203, 3], ['Demo Kafe', 86, 45, 4], ['Demo Furra', 82, 31, 6]],
    'pasuri-paluajtshme': [['Demo Ndërtim', 86, 67, 1], ['Demo Shtëpi', 84, 54, 3], ['Demo Agjenci', 80, 81, 2], ['Demo Rezidenca', 78, 29, 4], ['Demo Qira', 74, 22, 5]],
    'arsim': [['Demo Akademi', 96, 58, 2], ['Demo Kolegj', 94, 44, 1], ['Demo Kurse', 90, 63, 3], ['Demo Universitet', 86, 90, 5], ['Demo Shkolla', 84, 27, 4]]
  };

  var list = root.querySelector('.lb');
  var dd = root.querySelector('[data-dd]'), btn = dd.querySelector('.dd-btn'), val = dd.querySelector('.dd-val');
  var panel = dd.querySelector('.dd-panel'), input = dd.querySelector('input'), empty = dd.querySelector('.dd-empty');
  var opts = Array.prototype.slice.call(dd.querySelectorAll('[role="option"]'));
  var current = opts[0].getAttribute('data-v'), active = -1;
  opts.forEach(function (o, k) { o.id = 'dd-opt-' + k; });

  var UP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5l7 9H5z"/></svg>';
  var DN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19l7-9H5z"/></svg>';
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function initials(n) { return n.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase(); }
  function change(d) {
    if (d > 0) return '<span class="chg up" title="U ngjit ' + d + ' vende nga dje">' + UP + d + '</span>';
    if (d < 0) return '<span class="chg dn" title="Ra ' + (-d) + ' vende nga dje">' + DN + (-d) + '</span>';
    return '<span class="chg eq" title="Pa ndryshim nga dje">–</span>';
  }

  function render() {
    var rows = (BEST_DEMO[current] || []).slice().sort(function (a, b) { return b[1] - a[1]; }).slice(0, TOP);
    list.innerHTML = rows.map(function (r, k) {
      var rank = k + 1;
      return '<li style="animation-delay:' + (k * 60) + 'ms">' +
        '<div class="box">' + change(r[3] - rank) +
        '<span class="av av' + (k % 6) + '" aria-hidden="true">' + initials(r[0]) + '</span>' +
        '<div class="nm"><span class="rk">' + rank + '.</span><a href="#">' + esc(r[0]) + '</a></div>' +
        '<div class="sc5"><i>' + STAR + '</i><b>' + r[1] + '</b><span>/ 100</span></div></div></li>';
    }).join('');
  }

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
    close(true);
    render();
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
  render();
})();

// Top 20: ilk 10 firma. TOP20_DEMO simdilik sahte: [ad, kategori, ziyaretci baslangic, egim, seed].
// Backend gelince her firma icin: son 14 gunun gunluk ziyaretci + sikayet sayilari ve son 7 gunun sikayetleri donecek.
// Yuzde = son 7 gun ziyaretci toplami / onceki 7 gun toplami - 1.
// Satira tiklayinca altinda marka istatistikleri acilir (ayni anda tek satir acik):
//   - 14 gunluk grafik: ziyaretci = yesil cizgi, sikayet = acik gri sutun (ustleri yuvarlak)
//   - son 7 gunun sikayetleri: slider, yan yana 3 kart (isim, goruntulenme · tarih, baslik, destek + yorum), sagda yuvarlak oklar
(function () {
  var list = document.querySelector('.t20');
  if (!list) return;
  var TOP20_DEMO = [
    ['Demo Telekom', 'Telefonia dhe interneti', 820, 26, 3],
    ['Demo Shop', 'Blerjet online', 760, 22, 7],
    ['Demo Banka', 'Bankat dhe huatë', 690, 18, 11],
    ['Demo Posta', 'Transporti dhe posta', 610, 21, 5],
    ['Demo Energji', 'Energjia dhe uji', 580, 12, 9],
    ['Demo Mobile', 'Telefonia dhe interneti', 540, 15, 2],
    ['Demo Sigurime', 'Sigurimet', 470, 9, 13],
    ['Demo Delivery', 'Restorantet dhe ushqimi', 430, 14, 4],
    ['Demo Klinika', 'Shëndetësia', 390, -4, 8],
    ['Demo Akademi', 'Arsimi', 350, 7, 6]
  ];
  var TITLES = ['Interneti ndërpritet çdo mbrëmje', 'Pagesa u tërhoq dy herë nga karta', 'Faturë shumë e lartë pa arsye',
    'Porosia ka 10 ditë që vonon', 'Shërbimi i klientit nuk përgjigjet', 'Produkti erdhi i dëmtuar', 'Kontrata u rinovua pa pëlqimin tim',
    'Rimbursimi ende nuk ka ardhur', 'Komision i fshehtë në llogari', 'Takimi u anulua në minutën e fundit', 'Oferta nuk u zbatua në faturë',
    'Mungon garancia për produktin', 'Stafi u soll në mënyrë të pahijshme', 'Aplikacioni nuk funksionon prej një jave', 'Më ngarkuan për një shërbim që nuk e kërkova'];
  var NAMES = ['Arta K.', 'Blerim H.', 'Elira M.', 'Dritan S.', 'Teuta B.', 'Gentian R.', 'Valbona D.', 'Ilir P.', 'Lindita Q.', 'Arben T.', 'Mirela V.', 'Kujtim L.'];

  function rnd(seed) { var x = seed; return function () { x = (x * 9301 + 49297) % 233280; return x / 233280; }; }  // basit deterministik "rastgele"
  function series(base, slope, seed) {
    var r = rnd(seed), out = [];
    for (var i = 0; i < 14; i++) out.push(Math.max(10, Math.round(base + slope * i + (r() - 0.5) * base * 0.18)));
    return out;
  }
  function compSeries(seed, scale) {
    var r = rnd(seed * 7 + 1), out = [];
    for (var i = 0; i < 14; i++) out.push(Math.max(1, Math.round(scale * (0.5 + r()))));
    return out;
  }
  // sikayet: [isim, baslik, gun (0 = bugun .. 6), goruntulenme, destek (0 = desteklenmemis), yorum]
  function complaints(seed) {
    var r = rnd(seed * 13 + 5), n = 9 + Math.floor(r() * 7), out = [];
    for (var i = 0; i < n; i++) {
      var sup = r() < 0.65 ? 1 + Math.floor(r() * 40) : 0;
      out.push([NAMES[Math.floor(r() * NAMES.length)], TITLES[Math.floor(r() * TITLES.length)], Math.floor(i * 7 / n),
        120 + Math.floor(r() * 3200), sup, Math.floor(r() * 9)]);
    }
    return out;
  }
  var EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  var HAND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11v9H4v-9zM7 11l4-8a2.5 2.5 0 0 1 2.5 2.5V9h5.2a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.5 20H7"/></svg>';
  var BUBBLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5Z"/></svg>';
  function sum(a) { return a.reduce(function (s, x) { return s + x; }, 0); }
  function fmtN(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }   // 12345 -> 12.345
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function initials(n) { return n.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase(); }
  function spark(v) {
    var W = 220, H = 56, p = 4, mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), r = (mx - mn) || 1;
    var pts = v.map(function (y, i) { return (i * (W / (v.length - 1))).toFixed(1) + ',' + (H - p - (y - mn) / r * (H - 2 * p)).toFixed(1); }).join(' ');
    return '<svg class="sp" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts + '"/></svg>';
  }
  // son 14 gunun tarihleri (gg.aa)
  var DAYS = (function () {
    var out = [], d = new Date();
    for (var i = 13; i >= 0; i--) { var x = new Date(d); x.setDate(d.getDate() - i); out.push(('0' + x.getDate()).slice(-2) + '.' + ('0' + (x.getMonth() + 1)).slice(-2)); }
    return out;
  })();

  // grafik etiketleri: "28 Tet Hën" (gun, ay kisaltmasi, haftanin gunu)
  var MON = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj'];
  var WD = ['Die', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'];
  var LONG = (function () {
    var out = [], d = new Date();
    for (var i = 13; i >= 0; i--) { var x = new Date(d); x.setDate(d.getDate() - i); out.push(x.getDate() + ' ' + MON[x.getMonth()] + ' ' + WD[x.getDay()]); }
    return out;
  })();
  // eksen icin "yuvarlak" ust sinir: 1, 2, 2.5, 5 x 10^n (3 araliga bolunur)
  function niceMax(v) {
    var step = v / 3, p = Math.pow(10, Math.floor(Math.log10(step))), m = step / p;
    m = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
    return m * p * 3;
  }

  // birlesik grafik (sikayetvar Trend 100'deki marka grafigi gibi):
  //   sol eksen ziyaretci, sag eksen sikayet; sutunlar acik gri ve ustleri tam yuvarlak;
  //   ziyaretci yesil cizgi + altinda hafif yesil dolgu; uzerine gelince kesikli dikey cizgi, nokta ve koyu ipucu kutusu.
  // Gercek genislige gore cizilir (yuvarlak sutun uclari bozulmasin diye viewBox olceklenmiyor).
  function chart(box, vis, cmp) {
    var W = box.clientWidth, H = box.clientHeight;
    if (!W) return;
    box.classList.remove('hov');   // yeniden cizimde (ör. pencere boyutu degisince) eski hover durumu kalmasin
    var L = 48, R = 34, top = 12, bot = 30, cw = W - L - R, ch = H - top - bot, y0 = top + ch;
    var n = vis.length, slot = cw / n, bw = Math.min(22, slot * 0.42), rad = bw / 2;
    var vmax = niceMax(Math.max.apply(null, vis) * 1.08), cmax = niceMax(Math.max.apply(null, cmp) * 1.08);
    var svg = '<defs><linearGradient id="t20g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10B981" stop-opacity=".10"/><stop offset="1" stop-color="#10B981" stop-opacity="0"/></linearGradient></defs>';
    for (var g = 0; g <= 3; g++) {
      var gy = (y0 - ch * g / 3).toFixed(1);
      svg += '<line class="gl" x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '"/>' +
        '<text class="ax" x="' + (L - 10) + '" y="' + gy + '" dy="4" text-anchor="end">' + fmtN(Math.round(vmax * g / 3)) + '</text>' +
        '<text class="ax" x="' + (W - R + 10) + '" y="' + gy + '" dy="4">' + (Math.round(cmax * g / 3 * 10) / 10) + '</text>';
    }
    var pts = [];
    vis.forEach(function (v, i) {
      var cx = L + slot * i + slot / 2, h = Math.max(bw, cmp[i] / cmax * ch), x = cx - bw / 2, y = y0 - h;
      svg += '<path class="bar" d="M' + x.toFixed(1) + ' ' + y0 + 'V' + (y + rad).toFixed(1) + 'a' + rad + ' ' + rad + ' 0 0 1 ' + bw.toFixed(1) + ' 0V' + y0 + 'z"/>';
      pts.push([cx, y0 - v / vmax * ch]);
      if (i % 2 === 0) svg += '<text x="' + cx.toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + LONG[i] + '</text>';
    });
    var line = pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    svg += '<polygon class="area" points="' + pts[0][0].toFixed(1) + ',' + y0 + ' ' + line + ' ' + pts[n - 1][0].toFixed(1) + ',' + y0 + '"/>' +
      '<polyline class="ln" points="' + line + '"/>' +
      '<line class="guide" y1="' + top + '" y2="' + y0 + '"/><circle class="hdot" r="6"/>';
    box.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Vizitorët dhe ankesat në 14 ditët e fundit">' + svg + '</svg>' +
      '<div class="tip" hidden><b></b><p><span>Vizitorë</span><em class="tv"></em></p><p><span>Ankesa</span><em class="tc"></em></p></div>';

    var el = box.querySelector('svg'), guide = el.querySelector('.guide'), hdot = el.querySelector('.hdot'), tip = box.querySelector('.tip');
    function show(i) {
      var p = pts[i];
      guide.setAttribute('x1', p[0]); guide.setAttribute('x2', p[0]);
      hdot.setAttribute('cx', p[0]); hdot.setAttribute('cy', p[1]);
      box.classList.add('hov');
      tip.hidden = false;
      tip.querySelector('b').textContent = LONG[i];
      tip.querySelector('.tv').textContent = fmtN(vis[i]);
      tip.querySelector('.tc').textContent = cmp[i];
      // ipucu kutusu noktanin solunda; yer yoksa saginda
      var tw = tip.offsetWidth, th = tip.offsetHeight, left = p[0] - tw - 16, side = 'l';
      if (left < 0) { left = p[0] + 16; side = 'r'; }
      tip.className = 'tip ' + side;
      tip.style.left = left + 'px';
      tip.style.top = Math.max(0, Math.min(H - th, p[1] - th / 2)) + 'px';
    }
    el.addEventListener('mousemove', function (e) {
      var x = e.clientX - el.getBoundingClientRect().left, i = Math.floor((x - L) / slot);
      if (i < 0 || i >= n) { box.classList.remove('hov'); tip.hidden = true; return; }
      show(i);
    });
    el.addEventListener('mouseleave', function () { box.classList.remove('hov'); tip.hidden = true; });
  }

  var data = TOP20_DEMO.map(function (r) {
    return { name: r[0], cat: r[1], vis: series(r[2], r[3], r[4]), cmp: compSeries(r[4], 3 + r[2] / 120), list: complaints(r[4]) };
  });

  list.innerHTML = data.map(function (d, k) {
    var pct = Math.round((sum(d.vis.slice(7)) / sum(d.vis.slice(0, 7)) - 1) * 100);
    var sign = pct > 0 ? '+' : (pct < 0 ? '−' : '');
    var id = 't20p' + k;
    var cards = d.list.map(function (c, j) {
      return '<a class="t20c" href="#">' +
        '<div class="u"><span class="av av' + (j % 6) + '" aria-hidden="true">' + initials(c[0]) + '</span><div><b>' + esc(c[0]) + '</b>' +
        '<p class="meta">' + EYE + fmtN(c[3]) + ' shikime<i aria-hidden="true"></i><time>' + DAYS[13 - c[2]] + '</time></p></div></div>' +
        '<h5>' + esc(c[1]) + '</h5>' +
        '<p class="ft">' + (c[4] ? '<span class="sup">' + HAND + c[4] + ' mbështetje</span>' : '') +
        '<span>' + BUBBLE + c[5] + ' komente</span></p></a>';
    }).join('');
    return '<li>' +
      '<div class="t20-row" role="button" tabindex="0" aria-expanded="false" aria-controls="' + id + '">' +
        '<span class="n">' + (k + 1) + '</span>' +
        '<span class="av lg av' + (k % 6) + '" aria-hidden="true">' + initials(d.name) + '</span>' +
        '<div class="nm"><a href="#">' + esc(d.name) + '</a><small>' + esc(d.cat) + '</small></div>' +
        spark(d.vis) +
        '<div class="pc"><b' + (pct < 0 ? ' class="dn"' : '') + ' title="Ndryshimi i vizitorëve: 7 ditët e fundit kundrejt 7 ditëve më parë">' + sign + Math.abs(pct) + '%</b><small>2 javë</small></div>' +
        '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>' +
      '</div>' +
      '<div class="t20-pan" id="' + id + '"><div><div class="t20-in">' +
        '<div class="t20-h"><h4>Statistikat e markës<small>14 ditët e fundit</small></h4>' +
          '<div class="t20-lgd"><span><i></i>Vizitorë <b>' + fmtN(sum(d.vis)) + '</b></span><span><i class="c"></i>Ankesa <b>' + sum(d.cmp) + '</b></span></div></div>' +
        '<div class="t20-ch"></div>' +
        '<div class="t20-cmp">' +
          '<div class="t20-h"><div><h4>Ankesat e 7 ditëve të fundit</h4>' +
            '<p class="t20-co"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-5 5 5-5 5"/></svg><a href="#">' + esc(d.name) + '</a></p></div>' +
            '<div class="t20-nav"><button type="button" class="t20b prev" aria-label="Ankesat e mëparshme"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>' +
            '<button type="button" class="t20b next" aria-label="Ankesat e tjera"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></div></div>' +
          '<div class="t20-sl"><div class="t20-tr">' + cards + '</div></div>' +
        '</div>' +
      '</div></div></div></li>';
  }).join('');

  var items = Array.prototype.slice.call(list.children);
  items.forEach(function (li, k) {
    var row = li.querySelector('.t20-row'), chBox = li.querySelector('.t20-ch');
    var tr = li.querySelector('.t20-tr'), prev = li.querySelector('.prev'), next = li.querySelector('.next');
    var col = 0;
    function slide() {
      var max = Math.max(0, tr.children.length - 3);   // ayni anda yan yana 3 kart, oklar birer kart kaydirir
      col = Math.max(0, Math.min(col, max));
      var g = parseFloat(getComputedStyle(tr).columnGap) || 0;
      tr.style.transform = 'translateX(-' + (col * (tr.children[0].offsetWidth + g)) + 'px)';
      prev.disabled = col === 0; next.disabled = col >= max;
    }
    prev.addEventListener('click', function () { col--; slide(); });
    next.addEventListener('click', function () { col++; slide(); });
    li._draw = function () { chart(chBox, data[k].vis, data[k].cmp); slide(); };
    function toggle() {
      var open = !li.classList.contains('open');
      items.forEach(function (o) {
        if (o !== li && o.classList.contains('open')) { o.classList.remove('open'); o.querySelector('.t20-row').setAttribute('aria-expanded', 'false'); }
      });
      li.classList.toggle('open', open);
      row.setAttribute('aria-expanded', String(open));
      if (open) li._draw();
    }
    row.addEventListener('click', function (e) { if (!e.target.closest('a')) toggle(); });
    row.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === row) { e.preventDefault(); toggle(); } });
  });
  window.addEventListener('resize', function () { items.forEach(function (li) { if (li.classList.contains('open')) li._draw(); }); });
})();

// Footer dil secimi: butona tiklayinca liste yukari acilir; disari tiklayinca veya Esc ile kapanir.
(function () {
  var box = document.querySelector('[data-lang]');
  if (!box) return;
  var btn = box.querySelector('.f2-lang-btn'), list = box.querySelector('.f2-lang-list');
  function set(open) { list.hidden = !open; btn.setAttribute('aria-expanded', String(open)); }
  btn.addEventListener('click', function () { set(list.hidden); });
  document.addEventListener('click', function (e) { if (!box.contains(e.target)) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !list.hidden) { set(false); btn.focus(); } });
})();
