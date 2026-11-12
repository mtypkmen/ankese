(function () {
  var input = document.getElementById('faqq');
  if (!input) return;
  var norm = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var cards = [].slice.call(document.querySelectorAll('.lcard[id^="g"]'));
  var toc = [].slice.call(document.querySelectorAll('.ltoc a'));
  var none = document.getElementById('faqnone');
  input.addEventListener('input', function () {
    var q = norm(input.value.trim()), shown = 0;
    cards.forEach(function (c) {
      var n = 0;
      [].forEach.call(c.querySelectorAll('details'), function (d) {
        var ok = !q || norm(d.textContent).indexOf(q) > -1;
        d.hidden = !ok;
        if (ok) n++;
      });
      c.hidden = n === 0;
      shown += n;
      toc.forEach(function (a) { if (a.getAttribute('href') === '#' + c.id) a.hidden = n === 0; });
    });
    if (none) none.hidden = shown > 0;
  });
})();
