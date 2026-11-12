'use strict';
// Hukuki sayfa metinleri. Yapi: { title, updated, intro?, sections: [{ h, p: [paragraf | { ul: [...] }] }] }
// NOT: Taslaktir; yayina almadan once avukat incelemesi gerekir.
const UPDATED = { sq: 'Përditësuar më 5 nëntor 2026', en: 'Last updated: 5 November 2026' };

const sq = {
  terms: {
    title: 'Kushtet e përdorimit',
    sections: [
      { h: '1. Kush jemi', p: ['Ankese.com ("Platforma") operohet nga One Community ("ne"). Kontakt: info@ankese.com.', 'Platforma lejon përdoruesit të publikojnë ankesa për kompani në Shqipëri dhe Kosovë dhe i lejon kompanive të përgjigjen publikisht.'] },
      { h: '2. Llogaria', p: ['Për të shkruar një ankesë duhet të krijosh llogari me një email të vlefshëm dhe ta konfirmosh atë. Ti je përgjegjës për fjalëkalimin dhe për gjithçka që ndodh nga llogaria jote. Duhet të jesh të paktën 16 vjeç.', 'Mund të kemi vetëm një llogari për person. Llogaritë e krijuara për abuzim ose për ankesa të rreme mund të mbyllen.'] },
      { h: '3. Ankesa që publikon', p: ['Ti garanton që ankesa përshkruan një përvojë reale që ke pasur ti vetë, që faktet janë të vërteta sipas njohurive të tua dhe që je i/e autorizuar ta shkruash.', 'Ankesat duhet të respektojnë Rregullat e publikimit. Ne i shqyrtojmë ankesat para publikimit. Nuk garantojmë që çdo ankesë do të publikohet. Mund ta pranojmë, ta maskojmë pjesërisht (p.sh. të dhëna personale), ta kthejmë për korrigjim, ta refuzojmë ose ta heqim më vonë.', 'Me dërgimin e ankesës na jep të drejtën jo-ekskluzive, pa pagesë, të ta publikojmë, ta shfaqim dhe ta ruajmë në Platformë dhe ta arkivojmë për aq kohë sa ankesa mbetet e publikuar. Të drejtat e tua mbi tekstin mbeten tëndet.'] },
      { h: '4. Ndalohet', p: [{ ul: ['fyerjet, kërcënimet, gjuha e urrejtjes;', 'të dhënat personale të të tjerëve (numra telefoni, adresa, dokumente identiteti, llogari bankare);', 'akuza penale pa bazë ndaj personave të emëruar;', 'spam, reklama, ankesa të përsëritura ose të kopjuara;', 'ankesa të rreme ose të shkruara për të dëmtuar një konkurrent;', 'përpjekje për të penguar ose kaluar sistemet e sigurisë së Platformës.'] }] },
      { h: '5. Kompanitë dhe e drejta e përgjigjes', p: ['Çdo kompani mund t\'i përgjigjet një ankese. Përgjigjja shfaqet pranë ankesës. Kompanitë që mendojnë se një ankesë është e pasaktë ose e paligjshme mund të dërgojnë një kërkesë përmes faqes Kontakt.'] },
      { h: '6. Kërkesa për heqje', p: ['Nëse mendon se një përmbajtje shkel të drejtat e tua, na shkruaj përmes faqes Kontakt me lidhjen e ankesës dhe arsyen. Do ta shqyrtojmë dhe, kur është e arsyeshme, do ta heqim ose ta korrigjojmë përmbajtjen.'] },
      { h: '7. Mohim përgjegjësie', p: ['Ankesat shprehin përvojën dhe mendimin e autorëve të tyre. Ne nuk i verifikojmë çdo fakt dhe nuk jemi palë në mosmarrëveshjen mes përdoruesit dhe kompanisë. Platforma nuk ofron këshillë juridike.', 'Platforma ofrohet "siç është". Për aq sa e lejon ligji në fuqi, nuk mbajmë përgjegjësi për dëme indirekte që rrjedhin nga përdorimi i Platformës. Asgjë këtu nuk kufizon të drejta që ligji nuk lejon t\'i kufizojmë.'] },
      { h: '8. Pezullimi dhe mbyllja', p: ['Mund të pezullojmë ose mbyllim një llogari që shkel këto kushte. Mund ta mbyllësh llogarinë kur të duash duke na shkruar në info@ankese.com.'] },
      { h: '9. Ndryshime', p: ['Mund t\'i përditësojmë këto kushte. Data e fundit është në krye të faqes. Vazhdimi i përdorimit pas ndryshimit do të thotë se i pranon ato.'] },
    ],
  },
  privacy: {
    title: 'Politika e privatësisë',
    sections: [
      { h: '1. Kontrolluesi i të dhënave', p: ['Kontrolluesi i të dhënave tuaja personale është One Community, i kontaktueshëm në info@ankese.com. Ky dokument vlen për përdoruesit në Shqipëri dhe Kosovë.'] },
      { h: '2. Çfarë të dhënash mbledhim', p: [{ ul: ['Llogaria: emri, email-i, fjalëkalimi (ruhet vetëm i koduar me hash, kurrë në tekst të hapur), gjuha, data e regjistrimit.', 'Ankesat: titulli, teksti, data e ngjarjes, shuma (opsionale), kompania.', 'Teknike: adresa IP nuk ruhet në tekst të hapur; ruajmë vetëm një vlerë të koduar (HMAC) për parandalimin e abuzimit. Cookie-t e nevojshme për hyrje dhe siguri (shih faqen Cookies).', 'Mesazhet që na dërgon përmes faqes Kontakt ose me email.'] }] },
      { h: '3. Çfarë shfaqet publikisht', p: ['Teksti i ankesës, titulli, data dhe emri yt i shkurtuar (emri dhe shkronja e parë e mbiemrit, p.sh. "Ardit H.") shfaqen publikisht. Email-i yt nuk shfaqet kurrë publikisht.'] },
      { h: '4. Pse i përdorim dhe mbi cilin themel', p: [{ ul: ['Për të ofruar shërbimin (krijimi i llogarisë, publikimi i ankesave, njoftimet me email) — nevojë për ekzekutimin e shërbimit;', 'Për siguri, moderim dhe parandalimin e abuzimit — interes i ligjshëm;', 'Për të përmbushur detyrime ligjore dhe për t\'iu përgjigjur kërkesave të autoriteteve të kompetente;', 'Me pëlqimin tënd, aty ku ligji e kërkon.'] }] },
      { h: '5. Me kë i ndajmë', p: ['Përdorim ofrues shërbimesh që përpunojnë të dhëna në emrin tonë: ofruesin e dërgimit të email-eve (Resend), ofruesin e mbrojtjes dhe shpërndarjes së faqes (Cloudflare) dhe ofruesin e hostimit. Disa prej tyre mund t\'i përpunojnë të dhënat jashtë vendit tënd (p.sh. SHBA). Të dhënat nuk shiten dhe nuk përdoren për reklamim.', 'Mund t\'i ndajmë të dhënat me autoritete kur kërkohet me ligj.'] },
      { h: '6. Sa kohë i ruajmë', p: ['Të dhënat e llogarisë i ruajmë për aq kohë sa llogaria është aktive. Ankesat e publikuara mbeten në Platformë për interes publik; nëse kërkon fshirjen e llogarisë, ankesat anonimizohen (emri hiqet). Regjistrat e sigurisë i ruajmë për një periudhë të kufizuar dhe aq sa është e nevojshme.'] },
      { h: '7. Të drejtat e tua', p: ['Mund të kërkosh qasje, korrigjim, fshirje, kufizim ose kundërshtim të përpunimit të të dhënave të tua, si dhe bartshmëri kur zbatohet. Na shkruaj te info@ankese.com ose përmes faqes Kontakt; synojmë të përgjigjemi brenda 30 ditëve.', 'Ke të drejtë të ankohesh te autoriteti mbikëqyrës: në Shqipëri, Komisioneri për të Drejtën e Informimit dhe Mbrojtjen e të Dhënave Personale; në Kosovë, Agjencia për Informim dhe Privatësi.'] },
      { h: '8. Siguria', p: ['Përdorim HTTPS, fjalëkalime të koduara me hash, kontroll të qasjes dhe verifikim me dy hapa për moderatorët. Asnjë sistem nuk është 100% i sigurt, por punojmë për të mbrojtur të dhënat tuaja.'] },
      { h: '9. Fëmijët', p: ['Platforma nuk është e destinuar për persona nën 16 vjeç.'] },
      { h: '10. Ndryshime', p: ['Mund ta përditësojmë këtë politikë. Data e fundit është në krye të faqes.'] },
    ],
  },
  rules: {
    title: 'Rregullat e komunitetit',
    intro: 'Ankese.com ekziston që konsumatorët të mund të flasin hapur dhe kompanitë të mund të përgjigjen drejtë. Këto rregulla mbrojnë të dyja palët dhe vlejnë për çdo ankesë dhe çdo përgjigje. Çdo ankesë shqyrtohet para publikimit.',
    sections: [
      { h: '1. Parimet tona', p: [{ ul: ['Të vërtetën: shkruaj vetëm atë që ke jetuar ti vetë.', 'Faktet para emocioneve: ankesa e qartë dhe e qetë ndihmon më shumë se ajo e zemëruar.', 'Respektin: kritiko sjelljen e kompanisë, jo personat.', 'Drejtësinë: edhe kompania ka të drejtë të përgjigjet.'] }] },
      { h: '2. Çfarë duhet të përmbajë një ankesë e shkruar mirë', p: [{ ul: ['Me cilën kompani ke pasur punë dhe kur ndodhi.', 'Çfarë u premtua, çfarë ndodhi në fakt dhe çfarë zgjidhje kërkon.', 'Çfarë ke bërë deri tani (p.sh. ke kontaktuar kompaninë) dhe çfarë përgjigje more.', 'Shuma ose dëmi, nëse ka, dhe prova që ke vetë (fatura, mesazhe), pa publikuar të dhëna personale.'] }] },
      { h: '3. Çfarë nuk publikohet', p: [{ ul: ['Fyerje, kërcënime, gjuhë urrejtjeje ose diskriminuese.', 'Të dhëna personale të të tjerëve ose të tuat të panevojshme: numra telefoni, adresa, email-e, IBAN, numra identiteti, targa.', 'Akuza penale pa bazë ndaj personave të emëruar, p.sh. punonjës. Shkruaj për sjelljen e kompanisë, jo për njerëz të caktuar.', 'Ankesa të rreme, të sajuara ose të shkruara për të dëmtuar një konkurrent.', 'Ankesa për një kompani ku nuk ke qenë klient ose nuk ke pasur përvojë të drejtpërdrejtë.', 'Spam, reklama, lidhje të panevojshme, kërkesa për para ose promovim të një shërbimi tjetër.', 'Ankesa të përsëritura ose të kopjuara, dhe llogari të shumëfishta nga i njëjti person.', 'Përmbajtje që shkel të drejta të të tjerëve ose ligjin në fuqi.'] }] },
      { h: '4. Si e shqyrtojmë', p: ['Çdo ankesë kalon një kontroll automatik (gjuhë, të dhëna personale, spam) dhe pastaj shqyrtohet nga një moderator. Mund ta publikojmë siç është, ta maskojmë pjesërisht (p.sh. të dhëna personale), ta kthejmë për korrigjim ose ta refuzojmë me arsye. Njoftohesh me email për vendimin.', 'Moderimi kontrollon respektimin e këtyre rregullave, jo kush ka të drejtë në mosmarrëveshje. Publikimi nuk do të thotë se e kemi verifikuar çdo fakt.'] },
      { h: '5. Rregullat për kompanitë', p: [{ ul: ['Kompania mund t\'i përgjigjet çdo ankese publikisht; përgjigjja shfaqet pranë ankesës.', 'Përgjigjja duhet të jetë e sinqertë dhe e respektueshme: pa fyerje, pa të dhëna personale të klientit, pa reklamë.', 'Kompanitë nuk mund të paguajnë ose të kërkojnë heqjen apo ndryshimin e një ankese që respekton rregullat. Renditjet dhe vlerësimet nuk blihen.', 'Kompanitë nuk duhet të postojnë ankesa të rreme për veten ose për konkurrentët, as të bëjnë presion mbi klientët që ta heqin ankesën.'] }] },
      { h: '6. Çfarë ndodh kur shkelen rregullat', p: ['Përmbajtja që shkel rregullat mund të maskohet, të refuzohet ose të hiqet edhe pas publikimit. Për shkelje të përsëritura ose të rënda mund të pezullojmë ose mbyllim llogarinë, sipas Kushteve të përdorimit.'] },
      { h: '7. Gabime, korrigjime dhe kërkesa për heqje', p: ['Nëse një ankesë është e pasaktë, e vjetruar (p.sh. problemi u zgjidh) ose shkel të drejtat e tua, na shkruaj përmes faqes Kontakt me lidhjen e ankesës dhe arsyen. Do ta shqyrtojmë dhe, kur është e arsyeshme, do ta korrigjojmë ose ta heqim.', 'Nëse mendon se vendimi ynë për një ankesë ka qenë i gabuar, mund të kërkosh rishqyrtim në të njëjtën mënyrë.'] },
    ],
  },
  cookies: {
    title: 'Cookies',
    intro: 'Ankese.com përdor vetëm cookie të nevojshme. Nuk përdorim cookie reklamimi dhe nuk përdorim analitikë të palëve të treta.',
    sections: [
      { h: 'Cookie që vendosim', p: [{ ul: ['__Host-ank — seanca e hyrjes (vetëm nëse hyn në llogari).', '__Host-ank-c — mbrojtje kundër falsifikimit të formularëve (CSRF).'] }, 'Këto janë të domosdoshme për funksionimin dhe sigurinë dhe nuk kërkojnë pëlqim.'] },
      { h: 'Cookie nga shërbime të tjera', p: ['Cloudflare, që mbron dhe shpërndan faqen, mund të vendosë cookie teknike sigurie (p.sh. kundër robotëve). Këto përdoren vetëm për siguri.'] },
      { h: 'Si t\'i menaxhosh', p: ['Mund t\'i fshish ose t\'i bllokosh cookie nga cilësimet e shfletuesit; pa to hyrja në llogari nuk do të funksionojë.'] },
    ],
  },
};

const en = {
  terms: {
    title: 'Terms of use',
    sections: [
      { h: '1. Who we are', p: ['Ankese.com (the "Platform") is operated by One Community ("we"). Contact: info@ankese.com.', 'The Platform lets users publish complaints about companies in Albania and Kosovo and lets companies reply publicly.'] },
      { h: '2. Your account', p: ['To write a complaint you must create an account with a valid email address and confirm it. You are responsible for your password and for everything done from your account. You must be at least 16 years old.', 'One account per person. Accounts created for abuse or fake complaints may be closed.'] },
      { h: '3. Complaints you publish', p: ['You confirm that your complaint describes a real experience you had yourself, that the facts are true to the best of your knowledge, and that you are entitled to write it.', 'Complaints must follow the Publishing rules. We review complaints before publication. We do not guarantee that every complaint will be published. We may accept it, partially mask it (for example personal data), return it for correction, reject it, or remove it later.', 'By submitting a complaint you give us a non-exclusive, royalty-free right to publish, display and store it on the Platform and to archive it for as long as it stays published. You keep your rights in the text.'] },
      { h: '4. Prohibited', p: [{ ul: ['insults, threats, hate speech;', 'personal data of others (phone numbers, addresses, ID documents, bank accounts);', 'unfounded criminal accusations against named individuals;', 'spam, advertising, repeated or copied complaints;', 'fake complaints or complaints written to harm a competitor;', 'attempts to disrupt or bypass the Platform\'s security.'] }] },
      { h: '5. Companies and the right of reply', p: ['Every company may reply to a complaint. The reply appears next to the complaint. Companies that believe a complaint is inaccurate or unlawful can send a request through the Contact page.'] },
      { h: '6. Takedown requests', p: ['If you believe content infringes your rights, write to us through the Contact page with the complaint link and your reasons. We will review it and, where appropriate, remove or correct the content.'] },
      { h: '7. Disclaimer', p: ['Complaints express the experience and opinion of their authors. We do not verify every fact and we are not a party to the dispute between a user and a company. The Platform does not provide legal advice.', 'The Platform is provided "as is". To the extent permitted by applicable law, we are not liable for indirect damages arising from use of the Platform. Nothing here limits rights that cannot be limited by law.'] },
      { h: '8. Suspension and closing', p: ['We may suspend or close an account that breaks these terms. You can close your account at any time by writing to info@ankese.com.'] },
      { h: '9. Changes', p: ['We may update these terms. The latest date is at the top of the page. Continuing to use the Platform after a change means you accept it.'] },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    sections: [
      { h: '1. Data controller', p: ['The controller of your personal data is One Community, reachable at info@ankese.com. This policy applies to users in Albania and Kosovo.'] },
      { h: '2. What data we collect', p: [{ ul: ['Account: name, email, password (stored only as a hash, never in plain text), language, registration date.', 'Complaints: title, text, incident date, amount (optional), company.', 'Technical: your IP address is not stored in plain text; we keep only an encoded value (HMAC) for abuse prevention. Cookies needed for login and security (see the Cookies page).', 'Messages you send through the Contact page or by email.'] }] },
      { h: '3. What is shown publicly', p: ['The complaint text, title, date and your shortened name (first name and the first letter of your surname, e.g. "Ardit H.") are public. Your email is never shown publicly.'] },
      { h: '4. Why we use it and on what basis', p: [{ ul: ['To provide the service (account, publishing complaints, email notifications) — needed to perform the service;', 'For security, moderation and abuse prevention — legitimate interest;', 'To meet legal obligations and answer requests from competent authorities;', 'With your consent, where the law requires it.'] }] },
      { h: '5. Who we share it with', p: ['We use service providers that process data on our behalf: the email delivery provider (Resend), the site protection and delivery provider (Cloudflare) and the hosting provider. Some of them may process data outside your country (for example in the USA). We do not sell data and do not use it for advertising.', 'We may share data with authorities when required by law.'] },
      { h: '6. How long we keep it', p: ['We keep account data while the account is active. Published complaints stay on the Platform in the public interest; if you ask us to delete your account, your complaints are anonymised (your name is removed). Security logs are kept for a limited period and only as long as necessary.'] },
      { h: '7. Your rights', p: ['You may request access, correction, deletion, restriction or objection to the processing of your data, and portability where applicable. Write to info@ankese.com or use the Contact page; we aim to reply within 30 days.', 'You have the right to complain to the supervisory authority: in Albania, the Information and Data Protection Commissioner; in Kosovo, the Information and Privacy Agency.'] },
      { h: '8. Security', p: ['We use HTTPS, hashed passwords, access control and two-step verification for moderators. No system is 100% secure, but we work to protect your data.'] },
      { h: '9. Children', p: ['The Platform is not intended for people under 16.'] },
      { h: '10. Changes', p: ['We may update this policy. The latest date is at the top of the page.'] },
    ],
  },
  rules: {
    title: 'Community rules',
    intro: 'Ankese.com exists so consumers can speak openly and companies can reply fairly. These rules protect both sides and apply to every complaint and every reply. Every complaint is reviewed before publication.',
    sections: [
      { h: '1. Our principles', p: [{ ul: ['Truth: write only what you experienced yourself.', 'Facts before emotion: a clear, calm complaint helps more than an angry one.', 'Respect: criticise the company\'s conduct, not individuals.', 'Fairness: the company has the right to reply too.'] }] },
      { h: '2. What a good complaint includes', p: [{ ul: ['Which company you dealt with and when it happened.', 'What was promised, what actually happened, and what resolution you want.', 'What you have done so far (for example contacted the company) and the response you got.', 'The amount or damage, if any, and evidence you hold (invoices, messages), without publishing personal data.'] }] },
      { h: '3. What is not published', p: [{ ul: ['Insults, threats, hate speech or discriminatory language.', 'Personal data of others, or unnecessary data of your own: phone numbers, addresses, emails, IBANs, ID numbers, license plates.', 'Unfounded criminal accusations against named people, for example employees. Write about the company\'s conduct, not about specific people.', 'Fake or invented complaints, or complaints written to harm a competitor.', 'Complaints about a company you were not a customer of or have no direct experience with.', 'Spam, advertising, unnecessary links, requests for money, or promotion of another service.', 'Repeated or copied complaints, and multiple accounts by the same person.', 'Content that infringes the rights of others or applicable law.'] }] },
      { h: '4. How we review', p: ['Every complaint goes through an automatic check (language, personal data, spam) and is then reviewed by a moderator. We may publish it as is, partially mask it (for example personal data), return it for correction, or reject it with a reason. You are notified of the decision by email.', 'Moderation checks that these rules are followed, not who is right in the dispute. Publication does not mean we have verified every fact.'] },
      { h: '5. Rules for companies', p: [{ ul: ['A company may reply publicly to any complaint; the reply appears next to the complaint.', 'Replies must be honest and respectful: no insults, no personal data of the customer, no advertising.', 'Companies cannot pay for, or demand the removal or alteration of, a complaint that follows the rules. Rankings and ratings are not for sale.', 'Companies must not post fake complaints about themselves or competitors, or pressure customers to withdraw a complaint.'] }] },
      { h: '6. What happens when rules are broken', p: ['Content that breaks the rules may be masked, rejected or removed, even after publication. For repeated or serious violations we may suspend or close the account, as described in the Terms of use.'] },
      { h: '7. Errors, corrections and takedown requests', p: ['If a complaint is inaccurate, out of date (for example the problem was resolved) or infringes your rights, write to us through the Contact page with the complaint link and your reasons. We will review it and, where appropriate, correct or remove it.', 'If you think our decision on a complaint was wrong, you can ask for a second look the same way.'] },
    ],
  },
  cookies: {
    title: 'Cookies',
    intro: 'Ankese.com uses only necessary cookies. We do not use advertising cookies and we do not use third-party analytics.',
    sections: [
      { h: 'Cookies we set', p: [{ ul: ['__Host-ank — the login session (only if you log in).', '__Host-ank-c — protection against form forgery (CSRF).'] }, 'These are strictly necessary for operation and security and do not require consent.'] },
      { h: 'Cookies from other services', p: ['Cloudflare, which protects and delivers the site, may set technical security cookies (for example against bots). They are used for security only.'] },
      { h: 'Managing them', p: ['You can delete or block cookies in your browser settings; without them login will not work.'] },
    ],
  },
};

module.exports = { sq, en, UPDATED };
