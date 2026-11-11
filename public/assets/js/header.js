// Sayfa biraz kaydirilinca header'a "scrolled" sinifi ekler:
// golge gelir, ana sayfada header'daki mor serit beyaza doner (CSS gecisi).
(function () {
  var bar = document.querySelector('header.bar');
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

  // Ana sayfa: mozaigi kaydir, mor karo (kiz) header'da menu ile sag grubun tam ortasinda dursun
  // (menunun sonu ile mor karo arasi = mor karo ile sag grup arasi). Sonuc --mr degiskenine yazilir.
  var mosaic = document.querySelector('.hero .mosaic');
  var menu = bar.querySelector('.menu a:last-child');
  var right = bar.querySelector('.right');
  if (!mosaic || !menu || !right) return;
  var root = document.documentElement;
  function align() {
    root.style.removeProperty('--mr');
    if (window.innerWidth <= 960) return;
    var r = right.firstElementChild ? right.getBoundingClientRect().left : bar.clientWidth;
    var u = mosaic.getBoundingClientRect().width / 7;
    var left = (menu.getBoundingClientRect().right + r - u * 2) / 2; // mor karonun sol kenari
    var mr = bar.clientWidth - left - u * 5; // mor karo 2. sutunda, sagda 3 karo daha var
    root.style.setProperty('--mr', Math.max(0, mr) + 'px');
  }
  window.addEventListener('resize', align);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(align);
  align();
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
