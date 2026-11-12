'use strict';
// Pyetje te shpeshta / FAQ. Pergjigjet mbeshteten ne kushtet, privatesine dhe rregullat; mbaji njesoj kur ndryshojne.
const sq = {
  title: 'Pyetje të shpeshta',
  intro: 'Përgjigje të shkurtra për mënyrën si funksionon Ankese.com. Nuk e gjen çfarë kërkon? Na shkruaj te faqja Kontakt.',
  groups: [
    { h: 'Rreth platformës', q: [
      ['Çfarë është Ankese.com?', 'Është faqja ku konsumatorët në Shqipëri dhe Kosovë publikojnë ankesat ndaj kompanive dhe kompanitë përgjigjen publikisht. Çdo ankesë ka një adresë të qartë dhe mund të marrë një përgjigje.'],
      ['A kushton diçka?', 'Jo. Shkrimi i një ankese dhe leximi i ankesave është falas.'],
      ['A është Ankese.com e lidhur me kompanitë që shfaqen këtu?', 'Jo. Emrat dhe logot u përkasin pronarëve të tyre dhe shfaqen vetëm për identifikim. Ankese.com nuk është e lidhur me këto kompani dhe nuk është e miratuar prej tyre.'],
    ] },
    { h: 'Shkrimi i një ankese', q: [
      ['Si publikoj një ankesë?', 'Krijo një llogari, verifiko email-in, zgjidh kompaninë dhe shkruaj ankesën. Përshkruaj çfarë ndodhi, kur dhe çfarë kërkon nga kompania.'],
      ['Pse duhet të regjistrohem?', 'Llogaria na ndihmon të mbajmë larg ankesat false dhe spamin, dhe të mund të kontaktojmë autorin nëse ka nevojë.'],
      ['Çfarë nuk publikohet?', 'Fyerjet, kërcënimet, gjuha e urrejtjes, të dhënat personale (numra telefoni, adresa, email-e, IBAN, numra identiteti, targa), akuzat penale pa bazë ndaj personave të emërtuar, spami dhe ankesat e përsëritura ose të rreme. Shkruaj për sjelljen e kompanisë, jo për persona të veçantë. Detajet i gjen te Rregullat.'],
      ['Mund të kem më shumë se një ankesë aktive për të njëjtën kompani?', 'Jo. Nëse ke tashmë një ankesë aktive për një kompani, nuk mund të hapësh një tjetër për të njëjtën kompani.'],
      ['A shfaqet emri im?', 'Shfaqet vetëm emri dhe shkronja e parë e mbiemrit (p.sh. "Ardit H."). Email-i yt nuk shfaqet kurrë publikisht.'],
      ['Nuk e gjej kompaninë në listë. Çfarë bëj?', 'Mund ta propozosh kur shkruan ankesën, duke dhënë emrin, qytetin dhe sektorin. Ekipi ynë e shqyrton para se të shfaqet.'],
    ] },
    { h: 'Për kompanitë', q: [
      ['Si mund t\'i përgjigjet një kompani një ankese?', 'Çdo kompani ka të drejtë t\'i përgjigjet publikisht një ankese. Përgjigjja shfaqet pranë ankesës. Për të marrë qasje si përfaqësues, na shkruaj te faqja Kontakt dhe zgjidh "Jam përfaqësues i një kompanie".'],
      ['Mendoj se një ankesë është e pasaktë ose e paligjshme. Çfarë bëj?', 'Dërgo një kërkesë te faqja Kontakt me lidhjen e ankesës dhe arsyen. E shqyrtojmë dhe, kur është e arsyeshme, e heqim ose e korrigjojmë përmbajtjen.'],
    ] },
    { h: 'Të dhënat dhe privatësia', q: [
      ['Si i përdorni të dhënat e mia?', 'Të dhënat përdoren për të ofruar shërbimin dhe për sigurinë e tij. Nuk shiten dhe nuk përdoren për reklamim. Detajet i gjen te Politika e privatësisë.'],
      ['Si i kërkoj heqjen ose fshirjen e të dhënave të mia?', 'Na shkruaj te faqja Kontakt (lloji "Kërkesë për të dhënat e mia personale") ose te info@ankese.com. Synojmë të përgjigjemi brenda 30 ditëve.'],
    ] },
    { h: 'Kontakt', q: [
      ['Sa shpejt do të më përgjigjeni?', 'Zakonisht brenda 5 ditëve pune.'],
    ] },
  ],
};

const en = {
  title: 'Frequently asked questions',
  intro: 'Short answers about how Ankese.com works. Can\'t find what you need? Write to us on the Contact page.',
  groups: [
    { h: 'About the platform', q: [
      ['What is Ankese.com?', 'It is where consumers in Albania and Kosovo publish complaints about companies and companies reply in public. Every complaint gets a clear address and can receive a reply.'],
      ['Does it cost anything?', 'No. Writing a complaint and reading complaints is free.'],
      ['Is Ankese.com affiliated with the companies shown here?', 'No. Names and logos belong to their owners and are shown for identification only. Ankese.com is not affiliated with or endorsed by these companies.'],
    ] },
    { h: 'Writing a complaint', q: [
      ['How do I publish a complaint?', 'Create an account, verify your email, choose the company and write your complaint. Describe what happened, when, and what you want the company to do.'],
      ['Why do I need to register?', 'An account helps us keep fake complaints and spam out, and lets us reach the author if needed.'],
      ['What is not published?', 'Insults, threats, hate speech, personal data (phone numbers, addresses, emails, IBANs, ID numbers, license plates), unfounded criminal accusations against named people, spam, and repeated or fake complaints. Write about the company\'s conduct, not about specific people. See the Rules for details.'],
      ['Can I have more than one active complaint about the same company?', 'No. If you already have an active complaint about a company, you cannot open another one about it.'],
      ['Is my name shown?', 'Only your first name and the first letter of your surname are shown (for example "Ardit H."). Your email is never shown publicly.'],
      ['I can\'t find the company in the list. What do I do?', 'You can suggest it while writing your complaint by giving its name, city and sector. Our team reviews it before it appears.'],
    ] },
    { h: 'For companies', q: [
      ['How can a company reply to a complaint?', 'Every company may reply to a complaint publicly. The reply appears next to the complaint. To get access as a representative, write to us on the Contact page and choose "I represent a company".'],
      ['I think a complaint is inaccurate or unlawful. What do I do?', 'Send a request on the Contact page with the complaint link and the reason. We review it and, where reasonable, remove or correct the content.'],
    ] },
    { h: 'Data and privacy', q: [
      ['How do you use my data?', 'Data is used to provide the service and keep it secure. It is not sold and not used for advertising. See the Privacy policy for details.'],
      ['How do I ask for my data to be removed or deleted?', 'Write to us on the Contact page (type "Request about my personal data") or at info@ankese.com. We aim to reply within 30 days.'],
    ] },
    { h: 'Contact', q: [
      ['How fast will you reply?', 'Usually within 5 business days.'],
    ] },
  ],
};

module.exports = { sq, en };
