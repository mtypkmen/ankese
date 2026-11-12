// "On this page" kutusunu beyaz kartlarin basladigi hizada sabitler: sticky top = kartlarin sayfadaki yeri,
// yani kutu sayfa basinda kartlarla ayni hizada baslar ve kaydirirken hic yer degistirmez.
(function () {
  var t = document.querySelector('.lpin .ltoc'), m = document.querySelector('.lpin .lmain');
  if (!t || !m) return;
  function pin() {
    if (innerWidth <= 860) { t.style.top = ''; t.style.maxHeight = ''; return; }   // dar ekranda ust cubuk (CSS)
    var y = Math.round(m.getBoundingClientRect().top + scrollY);
    if (innerHeight - y < 240) y = 104;   // kisa pencerede kutu ekrana sigsin
    t.style.top = y + 'px';
    t.style.maxHeight = (innerHeight - y - 16) + 'px';
  }
  pin();
  addEventListener('resize', pin);
  addEventListener('load', pin);
})();
