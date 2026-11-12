// Top 20 sayfasi: satir (trend cizgisi + 7 gun yuzdesi), tiklayinca 14 gunluk grafik ve son 7 gunun sikayetleri.
// Veri sunucudan #t20-data JSON olarak gelir (hero-d onizlemesindeki bilesenin ayni davranisi).
(function () {
  var list = document.querySelector('.t20'), raw = document.getElementById('t20-data');
  if (!list || !raw) return;
  var D;
  try { D = JSON.parse(raw.textContent); } catch (e) { return; }
  var S = D.s, data = D.items;

  function sum(a) { return a.reduce(function (s, x) { return s + x; }, 0); }
  function fmtN(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, S.sep); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function initials(n) { return n.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase(); }
  function spark(v) {
    var W = 220, H = 56, p = 4, mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), r = (mx - mn) || 1;
    var pts = v.map(function (y, i) { return (i * (W / (v.length - 1))).toFixed(1) + ',' + (H - p - (y - mn) / r * (H - 2 * p)).toFixed(1); }).join(' ');
    return '<svg class="sp" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts + '"/></svg>';
  }
  // gunler sunucudan (UTC, YYYY-MM-DD), en eskiden bugune
  var DAYS = [], LONG = [];
  S.days.forEach(function (s) {
    var x = new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)));
    DAYS.push(s.slice(8, 10) + '.' + s.slice(5, 7));
    LONG.push(x.getUTCDate() + ' ' + S.mon[x.getUTCMonth()] + ' ' + S.wd[x.getUTCDay()]);
  });
  function niceMax(v) {
    v = Math.max(v, 3);   // tum degerler sifirsa eksen yine de cizilsin
    var step = v / 3, p = Math.pow(10, Math.floor(Math.log10(step))), m = step / p;
    m = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
    return m * p * 3;
  }

  function chart(box, vis, cmp) {
    var W = box.clientWidth, H = box.clientHeight;
    if (!W) return;
    box.classList.remove('hov');
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
    box.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(S.chartAria) + '">' + svg + '</svg>' +
      '<div class="tip" hidden><b></b><p><span>' + esc(S.visitors) + '</span><em class="tv"></em></p><p><span>' + esc(S.complaints) + '</span><em class="tc"></em></p></div>';
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

  list.classList.add('live');
  list.innerHTML = data.map(function (d, k) {
    var prevSum = sum(d.vis.slice(0, 7)), curSum = sum(d.vis.slice(7));
    var pct = prevSum ? Math.round((curSum / prevSum - 1) * 100) : null;   // onceki 7 gun 0 ise yuzde tanimsiz
    var sign = pct > 0 ? '+' : (pct < 0 ? '−' : '');
    var id = 't20p' + k;
    var cards = d.list.map(function (c, j) {
      return '<a class="t20c" href="' + esc(c[3]) + '">' +
        '<div class="u"><span class="av av' + (j % 6) + '" aria-hidden="true">' + initials(c[0]) + '</span><div><b>' + esc(c[0]) + '</b>' +
        '<p class="meta"><time>' + DAYS[13 - c[2]] + '</time></p></div></div>' +
        '<h5>' + esc(c[1]) + '</h5></a>';
    }).join('');
    var logo = d.logo ? '<img class="lg" src="/assets/logos/' + esc(d.logo) + '" width="92" height="64" alt="' + esc(d.name) + '" loading="lazy">'
      : '<span class="av lg av' + (k % 6) + '" aria-hidden="true">' + initials(d.name) + '</span>';
    return '<li>' +
      '<div class="t20-row" role="button" tabindex="0" aria-expanded="false" aria-controls="' + id + '">' +
        '<span class="n">' + (k + 1) + '</span>' + logo +
        '<div class="nm"><a href="' + esc(d.href) + '">' + esc(d.name) + '</a><small>' + esc(d.cat) + '</small></div>' +
        spark(d.vis) +
        '<div class="pc"><b' + (pct !== null && pct < 0 ? ' class="dn"' : '') + ' title="' + esc(S.pctTitle) + '">' + (pct === null ? '–' : sign + Math.abs(pct) + '%') + '</b><small>' + esc(S.twoWeeks) + '</small></div>' +
        '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>' +
      '</div>' +
      '<div class="t20-pan" id="' + id + '"><div><div class="t20-in">' +
        '<div class="t20-h"><h4>' + esc(S.brandStats) + '<small>' + esc(S.last14) + '</small></h4>' +
          '<div class="t20-lgd"><span><i></i>' + esc(S.visitors) + ' <b>' + fmtN(sum(d.vis)) + '</b></span><span><i class="c"></i>' + esc(S.complaints) + ' <b>' + sum(d.cmp) + '</b></span></div></div>' +
        '<div class="t20-ch"></div>' +
        '<div class="t20-cmp">' +
          '<div class="t20-h"><div><h4>' + esc(S.last7) + '</h4>' +
            '<p class="t20-co"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-5 5 5-5 5"/></svg><a href="' + esc(d.href) + '">' + esc(d.name) + '</a></p></div>' +
            '<div class="t20-nav"><button type="button" class="t20b prev" aria-label="' + esc(S.prev) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>' +
            '<button type="button" class="t20b next" aria-label="' + esc(S.next) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></div></div>' +
          (cards ? '<div class="t20-sl"><div class="t20-tr">' + cards + '</div></div>' : '<p class="t20-none">' + esc(S.none) + '</p>') +
        '</div>' +
      '</div></div></div></li>';
  }).join('');

  var items = Array.prototype.slice.call(list.children);
  items.forEach(function (li, k) {
    var row = li.querySelector('.t20-row'), chBox = li.querySelector('.t20-ch');
    var tr = li.querySelector('.t20-tr'), prev = li.querySelector('.prev'), next = li.querySelector('.next');
    var col = 0;
    function slide() {
      if (!tr || !tr.children.length) { prev.disabled = next.disabled = true; return; }
      var max = Math.max(0, tr.children.length - 3);
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
