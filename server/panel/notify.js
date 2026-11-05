'use strict';
const config = require('../config');
const mailer = require('../lib/mailer');
const PATHS = require('../lib/paths');

const REASONS = [
  { k: 'abuse', sq: 'Ankesa përmban fyerje ose gjuhë të papërshtatshme.', en: 'The complaint contains insults or inappropriate language.', tr: 'Hakaret/uygunsuz dil' },
  { k: 'pii', sq: 'Ankesa përmban të dhëna personale (numra telefoni, adresa, dokumente).', en: 'The complaint contains personal data (phone numbers, addresses, documents).', tr: 'Kişisel veri içeriyor' },
  { k: 'defamation', sq: 'Ankesa përmban akuza të pabazuara ndaj personave.', en: 'The complaint contains unfounded accusations against individuals.', tr: 'Kişilere dayanaksız suçlama' },
  { k: 'spam', sq: 'Ankesa duket si spam ose reklamë.', en: 'The complaint looks like spam or advertising.', tr: 'Spam/reklam' },
  { k: 'vague', sq: 'Ankesa nuk ka detaje të mjaftueshme ose nuk ka lidhje me një kompani konkrete.', en: 'The complaint lacks enough detail or does not concern a specific company.', tr: 'Yetersiz detay / belirsiz şirket' },
  { k: 'company', sq: 'Kompania e propozuar nuk u pranua.', en: 'The suggested company was not accepted.', tr: 'Önerilen şirket kabul edilmedi' },
  { k: 'other', sq: 'Arsye të tjera (shih shënimin).', en: 'Other reasons (see note).', tr: 'Diğer' },
];
const reasonOf = (k) => REASONS.find((r) => r.k === k) || REASONS[REASONS.length - 1];

const T = {
  sq: {
    pubS: 'Ankesa jote u publikua në Ankese.com',
    pubB: (title, url) => `Përshëndetje,\n\nAnkesa jote "${title}" u shqyrtua dhe u publikua:\n\n${url}\n\nKur problemi të zgjidhet, mund ta shënosh si të zgjidhur.\n\nAnkese.com`,
    rejS: 'Ankesa jote nuk u publikua',
    rejB: (title, reason, note) => `Përshëndetje,\n\nAnkesa jote "${title}" nuk u publikua.\n\nArsyeja: ${reason}${note ? `\nShënim: ${note}` : ''}\n\nMund të dërgosh një ankesë të re që respekton rregullat e publikimit.\n\nAnkese.com`,
  },
  en: {
    pubS: 'Your complaint was published on Ankese.com',
    pubB: (title, url) => `Hello,\n\nYour complaint "${title}" was reviewed and published:\n\n${url}\n\nWhen the problem is solved you can mark it as resolved.\n\nAnkese.com`,
    rejS: 'Your complaint was not published',
    rejB: (title, reason, note) => `Hello,\n\nYour complaint "${title}" was not published.\n\nReason: ${reason}${note ? `\nNote: ${note}` : ''}\n\nYou can submit a new complaint that follows the publishing rules.\n\nAnkese.com`,
  },
};

async function published({ email, locale, title, slug, id }) {
  const loc = locale === 'en' ? 'en' : 'sq';
  const url = `${config.siteOrigin}${PATHS[loc].company}/${slug}/${id}`;
  return mailer.send({ to: email, subject: T[loc].pubS, text: T[loc].pubB(title, url) });
}
async function rejected({ email, locale, title, reasonKey, note }) {
  const loc = locale === 'en' ? 'en' : 'sq';
  return mailer.send({ to: email, subject: T[loc].rejS, text: T[loc].rejB(title, reasonOf(reasonKey)[loc], note) });
}

module.exports = { REASONS, reasonOf, published, rejected };
