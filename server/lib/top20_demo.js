'use strict';
// Top 20 trend verisi. DEMO: ziyaretci ve sikayet serileri simdilik sahte (firma id'sinden turetilen sabit "rastgele" sayilar).
// Gercek veri gelince (gunluk ziyaretci + sikayet sayilari, son 7 gunun sikayetleri) yalniz build() degisir; istemci (top20.js) ayni kalir.
// Yalniz gelistirmede kullanilir (config.prod'da cagrilmaz): halka acik sitede gercek firmalar icin uydurma rakam gosterilmez.

const rnd = (seed) => { let x = seed; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; };
const series = (base, slope, seed) => { const r = rnd(seed); return Array.from({ length: 14 }, (_, i) => Math.max(10, Math.round(base + slope * i + (r() - 0.5) * base * 0.18))); };
const compSeries = (seed, scale) => { const r = rnd(seed * 7 + 1); return Array.from({ length: 14 }, () => Math.max(1, Math.round(scale * (0.5 + r())))); };

const TEXT = {
  sq: {
    titles: ['Interneti ndërpritet çdo mbrëmje', 'Pagesa u tërhoq dy herë nga karta', 'Faturë shumë e lartë pa arsye', 'Porosia ka 10 ditë që vonon',
      'Shërbimi i klientit nuk përgjigjet', 'Produkti erdhi i dëmtuar', 'Kontrata u rinovua pa pëlqimin tim', 'Rimbursimi ende nuk ka ardhur',
      'Komision i fshehtë në llogari', 'Oferta nuk u zbatua në faturë', 'Mungon garancia për produktin', 'Aplikacioni nuk funksionon prej një jave'],
    names: ['Arta K.', 'Blerim H.', 'Elira M.', 'Dritan S.', 'Teuta B.', 'Gentian R.', 'Valbona D.', 'Ilir P.', 'Lindita Q.', 'Arben T.', 'Mirela V.', 'Kujtim L.'],
    s: { sep: '.', mon: ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj'], wd: ['Die', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'],
      visitors: 'Vizitorë', complaints: 'Ankesa', views: 'shikime', support: 'mbështetje', comments: 'komente', twoWeeks: '2 javë',
      pctTitle: 'Ndryshimi i vizitorëve: 7 ditët e fundit kundrejt 7 ditëve më parë', chartAria: 'Vizitorët dhe ankesat në 14 ditët e fundit',
      brandStats: 'Statistikat e markës', last14: '14 ditët e fundit', last7: 'Ankesat e 7 ditëve të fundit', prev: 'Ankesat e mëparshme', next: 'Ankesat e tjera' },
  },
  en: {
    titles: ['Internet drops every evening', 'Payment was charged twice', 'Bill is far too high for no reason', 'Order is 10 days late',
      'Customer service does not reply', 'Product arrived damaged', 'Contract renewed without my consent', 'Refund has still not arrived',
      'Hidden fee on my account', 'Offer was not applied to the bill', 'No warranty for the product', 'App has not worked for a week'],
    names: ['Arta K.', 'Blerim H.', 'Elira M.', 'Dritan S.', 'Teuta B.', 'Gentian R.', 'Valbona D.', 'Ilir P.', 'Lindita Q.', 'Arben T.', 'Mirela V.', 'Kujtim L.'],
    s: { sep: ',', mon: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      visitors: 'Visitors', complaints: 'Complaints', views: 'views', support: 'support', comments: 'comments', twoWeeks: '2 weeks',
      pctTitle: 'Visitor change: last 7 days vs the 7 days before', chartAria: 'Visitors and complaints over the last 14 days',
      brandStats: 'Brand statistics', last14: 'Last 14 days', last7: 'Complaints of the last 7 days', prev: 'Previous complaints', next: 'More complaints' },
  },
};

// rows: top20 sorgusu satirlari (siraya gore). href ve alt metin cagiran tarafindan uretilir.
function build(rows, loc, hrefOf, catOf) {
  const T = TEXT[loc];
  const items = rows.map((r, i) => {
    const seed = (r.id % 997) + 1, base = Math.max(180, 860 - i * 32 + (seed % 40)), slope = ((seed * 7) % 27) - 4;
    const rr = rnd(seed * 13 + 5), n = 9 + Math.floor(rr() * 7), list = [];
    for (let k = 0; k < n; k++) {
      const sup = rr() < 0.65 ? 1 + Math.floor(rr() * 40) : 0;
      list.push([T.names[Math.floor(rr() * T.names.length)], T.titles[Math.floor(rr() * T.titles.length)], Math.floor(k * 7 / n), 120 + Math.floor(rr() * 3200), sup, Math.floor(rr() * 9)]);
    }
    return { name: r.name, href: hrefOf(r), logo: /^[a-z0-9-]{1,100}\.(png|jpg|webp|gif|ico)$/.test(r.logo || '') ? r.logo : null, cat: catOf(r),
      vis: series(base, slope, seed), cmp: compSeries(seed, 3 + base / 120), list };
  });
  return { s: T.s, items };
}

module.exports = { build };
