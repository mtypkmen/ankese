'use strict';
const config = require('../config');

// MAIL_MODE=log: e-posta gonderilmez, journal'a yazilir (yalnizca Resend dogrulamasi bitene kadar gecici)
async function send({ to, subject, text }) {
  if (process.env.MAIL_MODE === 'log') {
    console.log(`[mail-log] to=${to} subject=${subject}\n${text}`);
    return true;
  }
  if (!config.resendKey) { console.error('mail: RESEND_API_KEY yok'); return false; }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Ankese <noreply@ankese.com>', to: [to], subject, text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      console.error('mail gonderilemedi:', r.status, j.name || '');
      return false;
    }
    return true;
  } catch (e) {
    console.error('mail hatasi:', e.name);
    return false;
  }
}
module.exports = { send };
