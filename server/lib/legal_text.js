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
    title: 'Rregullat e publikimit',
    intro: 'Që ankesat të mbeten të dobishme dhe të ndershme, çdo ankesë shqyrtohet para publikimit.',
    sections: [
      { h: 'Çfarë duhet të përmbajë një ankesë', p: [{ ul: ['Çfarë ndodhi, kur ndodhi dhe me cilën kompani.', 'Faktet: çfarë u premtua, çfarë ndodhi, çfarë kërkon.', 'Të vërteta dhe nga përvoja jote e drejtpërdrejtë.'] }] },
      { h: 'Çfarë nuk publikohet', p: [{ ul: ['Fyerje, kërcënime, gjuhë e urrejtjes.', 'Të dhëna personale: numra telefoni, adresa, email-e, IBAN, numra identiteti, targa.', 'Akuza penale ndaj personave të emëruar (p.sh. punonjës) pa bazë. Shkruaj për sjelljen e kompanisë, jo për njerëz të caktuar.', 'Spam, reklama, lidhje të panevojshme.', 'Ankesa të përsëritura, të kopjuara ose të rreme.'] }] },
      { h: 'Si e shqyrtojmë', p: ['Çdo ankesë kalon një kontroll automatik (gjuhë, të dhëna personale, spam) dhe pastaj shqyrtohet nga një moderator. Mund ta publikojmë, ta maskojmë pjesërisht, ose ta refuzojmë me arsye. Njoftohesh me email.'] },
      { h: 'E drejta e përgjigjes', p: ['Kompania mund t\'i përgjigjet ankesës publikisht. Përgjigjja shfaqet pranë saj.'] },
      { h: 'Gabime ose kërkesa për heqje', p: ['Nëse ankesa është e pasaktë ose shkel të drejtat e tua, na shkruaj përmes faqes Kontakt.'] },
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
  transparency: {
    title: 'Shënime transparence',
    intro: 'Këtu shpjegojmë qartë si funksionon Ankese.com: kush e operon, si moderohen ankesat, çfarë hiqet dhe si mund të na kërkosh korrigjim. Nuk botojmë shifra që nuk i kemi matur.',
    sections: [
      { h: 'Kush e operon platformën', p: ['Ankese.com operohet nga One Community. Mund të na shkruash te info@ankese.com ose përmes faqes Kontakt.'] },
      { h: 'Si shqyrtohen ankesat', p: ['Çdo ankesë kalon një kontroll automatik (gjuhë, të dhëna personale, spam) dhe pastaj shqyrtohet nga një moderator para publikimit. Rregullat janë të njëjta për të gjitha kompanitë dhe nuk varen nga fakti nëse një kompani është anëtare apo jo.', 'Ankesat nuk verifikohen fakt pas fakti. Ato shprehin përvojën e autorit; ne kontrollojmë që të respektojnë Rregullat e publikimit.'] },
      { h: 'Çfarë maskojmë ose heqim', p: [{ ul: ['të dhëna personale (telefon, adresë, email, IBAN, numra identiteti, targa);', 'fyerje, kërcënime dhe gjuhë urrejtjeje;', 'akuza penale pa bazë ndaj personave të emëruar;', 'spam, reklama, ankesa të kopjuara ose të rreme.'] }, 'Nëse një ankesë maskohet ose refuzohet, autori njoftohet me email dhe me arsyen.'] },
      { h: 'Kompanitë nuk mund të blejnë heqje ose renditje', p: ['Asnjë kompani nuk mund të paguajë për të hequr një ankesë, për të ndryshuar vlerësimin ose për të përmirësuar renditjen. Anëtarësimi për biznese ofron mjete për t\'iu përgjigjur ankesave më shpejt, jo ndikim mbi përmbajtjen.', 'Renditjet e kompanive bazohen vetëm në të dhëna nga platforma, si përqindja e ankesave të zgjidhura.'] },
      { h: 'Si përgjigjen kompanitë', p: ['Çdo kompani ka të drejtën e përgjigjes publike. Përgjigjja shfaqet pranë ankesës dhe i nënshtrohet të njëjtave rregulla.'] },
      { h: 'Kërkesa për heqje ose korrigjim', p: ['Çdo person ose kompani mund të kërkojë heqjen ose korrigjimin e një ankese përmes faqes Kontakt, duke dërguar lidhjen dhe arsyen. Kërkesat shqyrtohen individualisht; kur ankesa shkel rregullat ose të drejtat e dikujt, ajo korrigjohet ose hiqet. Kur nuk ka shkelje, ankesa mbetet dhe kërkuesi merr arsyen.'] },
      { h: 'Kompanitë dhe logot', p: ['Emrat dhe logot e kompanive shfaqen vetëm për t\'i identifikuar ato; nuk nënkuptojnë lidhje, miratim ose bashkëpunim me Ankese.com. Nëse je pronar i një marke dhe dëshiron korrigjimin ose heqjen e logos, na shkruaj përmes faqes Kontakt.'] },
      { h: 'Kërkesat nga autoritetet', p: ['Të dhënat ndahen me autoritete vetëm kur kërkohet me ligj. Kur shifrat e kërkesave të tilla do të jenë të matura, do t\'i publikojmë këtu.'] },
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
    title: 'Publishing rules',
    intro: 'To keep complaints useful and fair, every complaint is reviewed before publication.',
    sections: [
      { h: 'What a complaint should include', p: [{ ul: ['What happened, when, and with which company.', 'Facts: what was promised, what happened, what you want.', 'True and based on your own direct experience.'] }] },
      { h: 'What is not published', p: [{ ul: ['Insults, threats, hate speech.', 'Personal data: phone numbers, addresses, emails, IBANs, ID numbers, license plates.', 'Unfounded criminal accusations against named people (for example employees). Write about the company\'s conduct, not about specific people.', 'Spam, advertising, unnecessary links.', 'Repeated, copied or fake complaints.'] }] },
      { h: 'How we review', p: ['Every complaint goes through an automatic check (language, personal data, spam) and is then reviewed by a moderator. We may publish it, partially mask it, or reject it with a reason. You are notified by email.'] },
      { h: 'Right of reply', p: ['The company may reply publicly. The reply appears next to the complaint.'] },
      { h: 'Errors or takedown requests', p: ['If a complaint is inaccurate or infringes your rights, write to us through the Contact page.'] },
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
  transparency: {
    title: 'Transparency notes',
    intro: 'Here we explain plainly how Ankese.com works: who runs it, how complaints are moderated, what gets removed, and how you can ask for a correction. We do not publish numbers we have not measured.',
    sections: [
      { h: 'Who runs the platform', p: ['Ankese.com is operated by One Community. You can write to info@ankese.com or use the Contact page.'] },
      { h: 'How complaints are reviewed', p: ['Every complaint goes through an automatic check (language, personal data, spam) and is then reviewed by a moderator before publication. The rules are the same for every company and do not depend on whether a company is a member.', 'Complaints are not fact-checked line by line. They express the author\'s experience; we check that they follow the Publishing rules.'] },
      { h: 'What we mask or remove', p: [{ ul: ['personal data (phone, address, email, IBAN, ID numbers, license plates);', 'insults, threats and hate speech;', 'unfounded criminal accusations against named individuals;', 'spam, advertising, copied or fake complaints.'] }, 'If a complaint is masked or rejected, the author is told by email, with the reason.'] },
      { h: 'Companies cannot buy removal or ranking', p: ['No company can pay to remove a complaint, change a rating or improve its ranking. Business membership gives tools to reply to complaints faster, not influence over content.', 'Company rankings are based only on data from the platform, such as the share of complaints resolved.'] },
      { h: 'How companies reply', p: ['Every company has a public right of reply. The reply appears next to the complaint and is subject to the same rules.'] },
      { h: 'Takedown and correction requests', p: ['Any person or company can ask for a complaint to be removed or corrected through the Contact page, sending the link and the reason. Requests are reviewed one by one; where a complaint breaks the rules or someone\'s rights it is corrected or removed. Where there is no violation it stays up and the requester is given the reason.'] },
      { h: 'Companies and logos', p: ['Company names and logos are shown only to identify them; they do not imply any affiliation, endorsement or partnership with Ankese.com. If you own a brand and want a logo corrected or removed, write to us through the Contact page.'] },
      { h: 'Requests from authorities', p: ['Data is shared with authorities only when required by law. Once such requests are measured, we will publish the figures here.'] },
    ],
  },
};

module.exports = { sq, en, UPDATED };
