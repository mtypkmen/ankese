'use strict';
// "Anetaresimi per biznese" ve "Cmimet vjetore" sayfa metinleri (sq/en). Fiyat YOK: iletisim WhatsApp uzerinden.
// Blok tipleri (legal.js blocks()): string = paragraf; {ul:[]} = liste; {cards:[[baslik, metin]]} = ozellik kartlari;
// {steps:[[baslik, metin]]} = numarali adimlar; {faq:[[soru, cevap]]} = acilir sorular.
// NOT: ekip hesaplari, aylik rapor, dogrudan destek ve "Dogrulanmis firma" rozeti benim onerim; sunulmadan once gercekten var olmali.
module.exports = {
  sq: {
    business: {
      title: 'Anëtarësimi për biznese',
      intro: 'Përgjigjuni ankesave më shpejt, tregoni se kujdeseni për klientët dhe ndiqni se si po ecni, gjithçka nga një vend.',
      cta: { h: 'Na shkruani në WhatsApp', p: 'Tregoni emrin e kompanisë dhe do t’ju dërgojmë ofertën dhe hapat për aktivizim.', btn: 'Shkruaj në WhatsApp' },
      sections: [
        { h: 'Çfarë përfshin anëtarësimi', p: ['Anëtarësimi Pro u jep kompanive mjete për të menaxhuar ankesat dhe për t’u përgjigjur me shpejtësi dhe saktësi.',
          { cards: [
            ['Mjete për përgjigje të shpejta', 'Njoftim për çdo ankesë të re dhe përgjigje publike direkt nga paneli i kompanisë.'],
            ['Profili i kompanisë', 'Logo, faqja e internetit, kontaktet dhe shenja “Kompani e verifikuar” te faqja juaj.'],
            ['Statistika përgjigjeje dhe zgjidhjeje', 'Përqindja e ankesave të zgjidhura, koha mesatare e përgjigjes, vizitat dhe ankesat me grafik.'],
            ['Përmbledhje javore me email', 'Një email në javë me ankesat e reja dhe çfarë ka mbetur pa u zgjidhur.'],
            ['Disa llogari për ekipin', 'Stafi juaj i shërbimit ndaj klientit mund të përgjigjet nga llogari të ndara.'],
            ['Raport mujor', 'Përmbledhje e muajit që mund ta shkarkoni dhe ta ndani me drejtimin.'],
            ['Mbështetje e drejtpërdrejtë', 'Ekipi ynë ju ndihmon me konfigurimin dhe pyetjet rreth platformës.'],
          ] }] },
        { h: 'Çfarë nuk blihet me anëtarësim', p: ['Anëtarësimi ju ndihmon të përgjigjeni, jo të ndikoni te përmbajtja. Rregullat janë të njëjta për të gjitha kompanitë, anëtare apo jo.',
          { ul: ['Nuk mund të hiqet ose të ndryshohet një ankesë me pagesë.', 'Nuk ndryshon vlerësimi dhe nuk përmirësohet renditja në Top 20.', 'E drejta e përgjigjes publike është falas për çdo kompani; anëtarësimi shton vetëm mjetet për ta bërë më shpejt.'] },
          'Kërkesat për heqje ose korrigjim shqyrtohen individualisht sipas Rregullave të publikimit, për të gjithë njësoj.'] },
        { h: 'Si bëheni anëtarë', p: [{ steps: [
          ['Na shkruani', 'Dërgoni emrin e kompanisë dhe një kontakt në WhatsApp.'],
          ['Verifikojmë kompaninë', 'Kontrollojmë që jeni përfaqësues i kompanisë, p.sh. me email zyrtar ose numër regjistrimi.'],
          ['Aktivizojmë llogarinë', 'Merrni qasje në panel dhe filloni të përgjigjeni.'],
        ] }] },
        { h: 'Çmimi', p: ['Çmimin dhe kushtet ua dërgojmë me ofertë, pasi të na shkruani. Nuk ka detyrim para se të vendosni.'] },
        { h: 'Pyetje të shpeshta', p: [{ faq: [
          ['A është anëtarësimi i detyrueshëm për t’u përgjigjur?', 'Jo. Çdo kompani mund t’u përgjigjet publikisht ankesave pa pagesë. Anëtarësimi shton mjete dhe statistika.'],
          ['A mund të hiqni një ankesë nëse jam anëtar?', 'Jo. Ankesat hiqen ose korrigjohen vetëm kur shkelin rregullat, njësoj për të gjithë.'],
          ['Sa kohë duhet për aktivizim?', 'Pasi të verifikojmë kompaninë, llogaria aktivizohet zakonisht brenda disa ditëve pune.'],
        ] }] },
      ],
    },
    awards: {
      title: 'Çmimet vjetore',
      intro: 'Çdo vit shpërblejmë kompanitë që u përgjigjen dhe i zgjidhin ankesat më mirë, në çdo kategori.',
      cta: { h: 'Shiko renditjen aktuale', p: 'Top 20 tregon kompanitë që po drejtojnë këtë javë.', btn: 'Shiko Top 20' },
      sections: [
        { h: 'Çfarë shpërblejmë', p: ['Në çdo kategori, kompania që zë vendin e parë sipas mënyrës si u përgjigjet dhe i zgjidh ankesat fiton çmimin vjetor të Ankese.com. Çmimi u jepet kompanive, jo pagesave.'] },
        { h: 'Si zgjidhen fituesit', p: ['Fituesit përcaktohen vetëm nga të dhënat e platformës gjatë një viti kalendarik, në çdo kategori veçmas.',
          { ul: ['Përqindja e ankesave të publikuara që janë shënuar si të zgjidhura.', 'Shpejtësia e përgjigjes: sa shpejt kompania ka dhënë përgjigjen e parë publike.'] },
          'Të dyja masat numërohen së bashku. Numërohen vetëm ankesat e publikuara; ato që hiqen për shkelje të rregullave nuk hyjnë në llogari.'] },
        { h: 'Çdo kompani mund të garojë', p: ['Anëtarësimi nuk është kusht dhe nuk jep avantazh. Kompanitë anëtare dhe jo-anëtare vlerësohen njësoj, sipas të njëjtave të dhëna.'] },
        { h: 'Çfarë fitojnë fituesit', p: [{ ul: ['Anëtarësim Pro falas për një vit të plotë, me të gjitha veçoritë.', 'Promovim nga Ankese.com para vizitorëve tanë.', 'Shenja “Fitues i vitit” te faqja e kompanisë.'] }] },
        { h: 'Kur shpallen çmimet', p: ['Rezultatet e vitit paraprak shpallen çdo vit në janar. Çmimet e para do të ndahen pasi platforma të plotësojë vitin e parë të plotë.'] },
      ],
    },
  },
  en: {
    business: {
      title: 'Business membership',
      intro: 'Reply to complaints faster, show customers you care, and track how you are doing, all from one place.',
      cta: { h: 'Message us on WhatsApp', p: 'Tell us your company name and we will send you an offer and the steps to activate.', btn: 'Message on WhatsApp' },
      sections: [
        { h: 'What membership includes', p: ['Pro membership gives companies tools to manage complaints and reply quickly and accurately.',
          { cards: [
            ['Fast reply tools', 'A notification for every new complaint and public replies straight from your company dashboard.'],
            ['Company profile', 'Logo, website, contact details and a “Verified company” badge on your page.'],
            ['Reply and resolution statistics', 'Share of complaints resolved, average reply time, plus a chart of visits and complaints.'],
            ['Weekly email digest', 'One email a week with new complaints and what is still unresolved.'],
            ['Several team accounts', 'Your customer service staff can reply from separate accounts.'],
            ['Monthly report', 'A monthly summary you can download and share with management.'],
            ['Direct support', 'Our team helps you with setup and questions about the platform.'],
          ] }] },
        { h: 'What membership does not buy', p: ['Membership helps you reply, not influence content. The rules are the same for every company, member or not.',
          { ul: ['A complaint cannot be removed or changed for payment.', 'It does not change a rating or improve your place in the Top 20.', 'The public right of reply is free for every company; membership only adds tools to do it faster.'] },
          'Removal or correction requests are reviewed one by one under the Publishing rules, the same for everyone.'] },
        { h: 'How to become a member', p: [{ steps: [
          ['Message us', 'Send your company name and a contact on WhatsApp.'],
          ['We verify the company', 'We check that you represent the company, for example through an official email or registration number.'],
          ['We activate your account', 'You get access to the dashboard and can start replying.'],
        ] }] },
        { h: 'Pricing', p: ['We send the price and terms in an offer once you write to us. There is no obligation before you decide.'] },
        { h: 'Frequently asked questions', p: [{ faq: [
          ['Do I need membership to reply?', 'No. Every company can reply publicly to complaints for free. Membership adds tools and statistics.'],
          ['Can you remove a complaint if I am a member?', 'No. Complaints are only removed or corrected when they break the rules, the same for everyone.'],
          ['How long does activation take?', 'Once we verify the company, the account is usually activated within a few business days.'],
        ] }] },
      ],
    },
    awards: {
      title: 'Annual awards',
      intro: 'Every year we reward the companies that reply to and resolve complaints best, in every category.',
      cta: { h: 'See the current ranking', p: 'The Top 20 shows the companies leading this week.', btn: 'See the Top 20' },
      sections: [
        { h: 'What we reward', p: ['In every category, the company that ranks first for how it replies to and resolves complaints wins the Ankese.com annual award. The award goes to performance, not to payment.'] },
        { h: 'How winners are chosen', p: ['Winners are decided only from platform data over one calendar year, in each category separately.',
          { ul: ['The share of published complaints marked as resolved.', 'Reply speed: how quickly the company gave its first public reply.'] },
          'Both measures count together. Only published complaints are counted; those removed for breaking the rules are left out.'] },
        { h: 'Every company can compete', p: ['Membership is not required and gives no advantage. Member and non-member companies are scored the same way, from the same data.'] },
        { h: 'What winners get', p: [{ ul: ['A free Pro membership for a full year, with every feature.', 'Promotion by Ankese.com to our visitors.', 'A “Winner of the year” badge on the company page.'] }] },
        { h: 'When awards are announced', p: ['The results for the previous year are announced every January. The first awards will be given once the platform has completed its first full year.'] },
      ],
    },
  },
};
