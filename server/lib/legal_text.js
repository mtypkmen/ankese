'use strict';
// Hukuki sayfa metinleri. Yapi: { title, updated, intro?, sections: [{ h, p: [paragraf | { ul: [...] }] }] }
// NOT: Taslaktir; yayina almadan once avukat incelemesi gerekir.
const UPDATED = { sq: 'Përditësuar më 5 nëntor 2026', en: 'Last updated: 5 November 2026' };

const sq = {
  terms: {
    title: 'Kushtet e përdorimit',
    intro: 'Lexoji këto kushte para se të përdorësh Ankese.com. Duke krijuar llogari, duke dërguar një ankesë ose duke përdorur Platformën në çfarëdo mënyre, i pranon ato.',
    sections: [
      { h: '1. Kush jemi', p: ['Ankese.com ("Platforma") operohet nga One Community ("ne"). Kontakt: info@ankese.com ose faqja Kontakt.', 'Platforma i lejon përdoruesit të publikojnë ankesa për kompani në Shqipëri dhe Kosovë dhe i lejon kompanive të përgjigjen publikisht. Është një hapësirë për përvojat e konsumatorëve, jo gjykatë, arbitër apo këshilltar juridik.'] },
      { h: '2. Përdorimi i Platformës', p: ['Kushdo mund ta lexojë Platformën pa llogari. Për të shkruar një ankesë duhet të krijosh llogari me një email të vlefshëm dhe ta konfirmosh atë.', 'Duhet të jesh të paktën 16 vjeç dhe në gjendje t\'i pranosh këto kushte. Nëse e përdor Platformën në emër të një kompanie, konfirmon se je i/e autorizuar për ta bërë këtë.'] },
      { h: '3. Llogaria jote', p: ['Ti je përgjegjës për fjalëkalimin dhe për gjithçka që ndodh nga llogaria jote. Na njofto menjëherë nëse mendon se dikush tjetër ka hyrë në të.', 'Një llogari për person. Llogaritë e krijuara për abuzim, për ankesa të rreme ose për të anashkaluar një pezullim të mëparshëm mund të mbyllen.'] },
      { h: '4. Ankesat që publikon', p: ['Ti je i/e vetmi/vetmja përgjegjës/e për atë që shkruan. Duke dërguar një ankesë konfirmon që:', { ul: ['ajo përshkruan një përvojë reale që ke pasur ti vetë;', 'faktet janë të vërteta sipas njohurive të tua, dhe opinionet paraqiten si opinione;', 'nuk cenon të drejtat e askujt tjetër (privatësia, reputacioni, e drejta e autorit, marka);', 'nuk të është paguar dhe nuk të është premtuar asgjë në këmbim të saj.'] }, 'Ankesat duhet të respektojnë Rregullat e publikimit. Ne i shqyrtojmë ankesat para publikimit, por nuk garantojmë që çdo ankesë do të publikohet, dhe publikimi nuk do të thotë se përmbajtja është e vërtetë.', 'Mund ta pranojmë një ankesë, ta maskojmë pjesërisht (p.sh. të dhëna personale), ta kthejmë për korrigjim, ta refuzojmë ose ta heqim më vonë nëse shkel këto kushte ose ligjin.', 'Me dërgimin e ankesës na jep të drejtën jo-ekskluzive, pa pagesë, në mbarë botën, ta publikojmë, ta shfaqim, ta ruajmë, ta përkthejmë për shfaqje dhe ta arkivojmë në Platformë për aq kohë sa ankesa mbetet e publikuar. Të drejtat e tua mbi tekstin mbeten tëndet.'] },
      { h: '5. Ndalohet', p: ['Nuk lejohet përdorimi i Platformës për:', { ul: ['fyerje, kërcënime, ngacmim ose gjuhë urrejtjeje;', 'të dhëna personale të të tjerëve (numra telefoni, adresa, dokumente identiteti, llogari bankare, targa);', 'akuza penale pa bazë ndaj personave të emëruar;', 'spam, reklama, ankesa të përsëritura ose të kopjuara;', 'ankesa të rreme, përgjigje të rreme në emër të kompanive, ose ankesa të shkruara për të dëmtuar një konkurrent ose kundrejt pagese;', 'imitimin e një personi ose kompanie;', 'mbledhje automatike (scraping) të Platformës përtej asaj që lejon robots.txt, ose çdo përpjekje për ta penguar, mbingarkuar ose për të kaluar sigurinë e saj.'] }] },
      { h: '6. Kompanitë, markat dhe logot', p: ['Emrat e kompanive, markat dhe logot që shfaqen në Platformë u përkasin pronarëve të tyre. Ne i shfaqim vetëm për të identifikuar kompaninë për të cilën është ankesa. Prania e tyre nuk do të thotë se kompania është e lidhur me ne, e ka mbështetur Platformën ose ka rënë dakord të marrë pjesë.', 'Faqet dhe listat e kompanive mund t\'i krijojmë ne nga informacione publike. Një kompani mund të kërkojë korrigjimin e të dhënave ose të logos së saj përmes faqes Kontakt.', 'Renditjet dhe listat "më të suksesshmet" llogariten automatikisht nga të dhënat në Platformë (p.sh. ankesat e zgjidhura). Ato janë vetëm informative, varen nga të dhënat në dispozicion dhe nuk përbëjnë vlerësim, certifikim ose rekomandim për asnjë kompani.'] },
      { h: '7. E drejta e përgjigjes', p: ['Çdo kompani mund t\'i përgjigjet një ankese. Përgjigjja shfaqet pranë ankesës dhe i nënshtrohet të njëjtave rregulla si ankesat. Kompania që dëshiron të përgjigjet duhet të provojë se e përfaqëson kompaninë; mund të kërkojmë dëshmi.', 'Kompanitë që mendojnë se një ankesë është e pasaktë ose e paligjshme mund të dërgojnë një kërkesë përmes faqes Kontakt.'] },
      { h: '8. Moderimi', p: ['Moderojmë përmbajtjen me kontrolle automatike dhe shqyrtim nga njerëz. Mund të veprojmë në çdo kohë, përfshirë maskimin, redaktimin vetëm për të dhëna personale, refuzimin, fshehjen ose heqjen e përmbajtjes, ose kufizimin e një llogarie, për të zbatuar këto kushte, për të mbrojtur njerëzit ose për të respektuar ligjin. Nuk e ndryshojmë kuptimin e një ankese.'] },
      { h: '9. Kërkesa për heqje', p: ['Nëse mendon se një përmbajtje shkel të drejtat e tua ose është e paligjshme, na shkruaj përmes faqes Kontakt me lidhjen e përmbajtjes dhe arsyet. Do ta shqyrtojmë dhe, kur është e arsyeshme, do ta heqim ose ta korrigjojmë përmbajtjen. Kërkesat e bëra me të keqe mund të refuzohen.'] },
      { h: '10. Përmbajtja dhe të drejtat tona', p: ['Platforma, dizajni, kodi dhe tekstet tona janë të mbrojtura. Nuk lejohet kopjimi ose ripërdorimi i tyre, përveç asaj që e lejon ligji ose me lejen tonë me shkrim. Përmbajtja e publikuar nga përdoruesit mbetet përgjegjësi dhe pronë e autorëve të saj.'] },
      { h: '11. Mohim përgjegjësie dhe përgjegjësia', p: ['Ankesat shprehin përvojën dhe mendimin e autorëve të tyre. Ne nuk i verifikojmë çdo fakt dhe nuk jemi palë në asnjë mosmarrëveshje mes përdoruesit dhe kompanisë. Platforma nuk ofron këshillë juridike dhe nuk garanton asnjë rezultat.', 'Platforma ofrohet "siç është" dhe "siç disponohet", dhe mund të ndërpritet ose të ndryshohet. Për aq sa e lejon ligji në fuqi, nuk mbajmë përgjegjësi për dëme indirekte ose pasuese, as për përmbajtjen e postuar nga përdoruesit ose kompanitë. Asgjë këtu nuk kufizon të drejta që ligji nuk lejon t\'i kufizojmë, përfshirë të drejtat e detyrueshme të konsumatorit.'] },
      { h: '12. Pezullimi dhe mbyllja', p: ['Mund të pezullojmë ose mbyllim një llogari që shkel këto kushte, me ose pa njoftim kur shkelja është e rëndë. Mund ta mbyllësh llogarinë kur të duash duke na shkruar në info@ankese.com. Çfarë ndodh me ankesat pas mbylljes përshkruhet te Politika e privatësisë.'] },
      { h: '13. Ndryshime', p: ['Mund t\'i përditësojmë këto kushte. Data në krye të faqes tregon versionin e fundit. Nëse ndryshimi është i rëndësishëm do të përpiqemi të të njoftojmë, p.sh. me email ose në Platformë. Vazhdimi i përdorimit pas ndryshimit do të thotë se i pranon ato.'] },
      { h: '14. Ligji i zbatueshëm', p: ['Këto kushte rregullohen nga ligji në fuqi në vendin ku është themeluar One Community, pa cenuar të drejtat e detyrueshme të konsumatorit që ke sipas ligjit të vendit tënd të banimit në Shqipëri ose Kosovë. Nëse një pjesë e kushteve rezulton e pavlefshme, pjesa tjetër mbetet në fuqi.'] },
      { h: '15. Kontakt', p: ['Pyetje për këto kushte: info@ankese.com ose faqja Kontakt.'] },
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
};

const en = {
  terms: {
    title: 'Terms of use',
    intro: 'Please read these terms before using Ankese.com. By creating an account, submitting a complaint or otherwise using the Platform you agree to them.',
    sections: [
      { h: '1. Who we are', p: ['Ankese.com (the "Platform") is operated by One Community ("we", "us"). Contact: info@ankese.com or the Contact page.', 'The Platform lets users publish complaints about companies in Albania and Kosovo and lets companies reply publicly. It is a space for consumer experiences, not a court, an arbitrator or a legal adviser.'] },
      { h: '2. Using the Platform', p: ['Anyone can read the Platform without an account. To write a complaint you must create an account with a valid email address and confirm it.', 'You must be at least 16 years old and able to enter into these terms. If you use the Platform on behalf of a company, you confirm that you are authorised to do so.'] },
      { h: '3. Your account', p: ['You are responsible for your password and for everything done from your account. Tell us immediately if you think someone else has access to it.', 'One account per person. Accounts created for abuse, fake complaints or to avoid a previous suspension may be closed.'] },
      { h: '4. Complaints you publish', p: ['You are solely responsible for what you write. By submitting a complaint you confirm that:', { ul: ['it describes a real experience you had yourself;', 'the facts are true to the best of your knowledge, and opinions are presented as opinions;', 'it does not infringe the rights of anyone else (privacy, reputation, copyright, trademark);', 'you have not been paid or promised anything in exchange for it.'] }, 'Complaints must follow the Publishing rules. We review complaints before publication, but we do not guarantee that every complaint will be published, and publication is not a confirmation that its content is true.', 'We may accept a complaint, partially mask it (for example personal data), return it for correction, reject it, or remove it later if it breaks these terms or the law.', 'By submitting a complaint you give us a non-exclusive, royalty-free, worldwide right to publish, display, store, translate for display, and archive it on the Platform for as long as it stays published. You keep your rights in the text.'] },
      { h: '5. Prohibited', p: ['You may not use the Platform for:', { ul: ['insults, threats, harassment or hate speech;', 'personal data of others (phone numbers, addresses, ID documents, bank accounts, licence plates);', 'unfounded criminal accusations against named individuals;', 'spam, advertising, repeated or copied complaints;', 'fake complaints, fake company replies, or complaints written to harm a competitor or in exchange for payment;', 'impersonating a person or company;', 'automated collection (scraping) of the Platform beyond what is allowed by robots.txt, or any attempt to disrupt, overload or bypass its security.'] }] },
      { h: '6. Companies, brands and logos', p: ['Company names, brands and logos shown on the Platform belong to their respective owners. We show them only to identify the company a complaint is about. Their presence does not mean that the company is affiliated with us, has endorsed the Platform, or has agreed to take part.', 'Company pages and lists may be created by us from public information. A company may ask us to correct its details or logo through the Contact page.', 'Rankings and "most successful" lists are calculated automatically from data on the Platform (for example complaints resolved). They are informational, depend on the data available, and are not an assessment, certification or recommendation of any company.'] },
      { h: '7. Right of reply', p: ['Every company may reply to a complaint. The reply appears next to the complaint and is subject to the same rules as complaints. A company that wants to reply must show that it represents the company; we may ask for proof.', 'Companies that believe a complaint is inaccurate or unlawful can send a request through the Contact page.'] },
      { h: '8. Moderation', p: ['We moderate content using automatic checks and human review. We may take action at any time, including masking, editing for personal data only, rejecting, hiding or removing content, or limiting an account, to enforce these terms, protect people, or comply with the law. We do not change the meaning of a complaint.'] },
      { h: '9. Takedown requests', p: ['If you believe content infringes your rights or is unlawful, write to us through the Contact page with the link to the content and your reasons. We will review it and, where appropriate, remove or correct the content. Requests made in bad faith may be refused.'] },
      { h: '10. Our content and rights', p: ['The Platform, its design, code and our own texts are protected. You may not copy or reuse them except as the law allows or with our written permission. Content published by users remains the responsibility and property of its authors.'] },
      { h: '11. Disclaimer and liability', p: ['Complaints express the experience and opinion of their authors. We do not verify every fact and we are not a party to any dispute between a user and a company. The Platform does not provide legal advice and does not guarantee any outcome.', 'The Platform is provided "as is" and "as available", and may be interrupted or changed. To the extent permitted by applicable law, we are not liable for indirect or consequential damages, or for content posted by users or companies. Nothing in these terms limits rights that cannot be limited by law, including mandatory consumer rights.'] },
      { h: '12. Suspension and closing', p: ['We may suspend or close an account that breaks these terms, with or without notice where the breach is serious. You can close your account at any time by writing to info@ankese.com. What happens to your complaints after closing is described in the Privacy policy.'] },
      { h: '13. Changes', p: ['We may update these terms. The date at the top of the page shows the latest version. If a change is important we will try to tell you, for example by email or on the Platform. Continuing to use the Platform after a change means you accept it.'] },
      { h: '14. Governing law', p: ['These terms are governed by the law applicable in the country where One Community is established, without affecting any mandatory consumer rights you have under the law of your country of residence in Albania or Kosovo. If part of these terms is found invalid, the rest stays in force.'] },
      { h: '15. Contact', p: ['Questions about these terms: info@ankese.com or the Contact page.'] },
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
};

module.exports = { sq, en, UPDATED };
