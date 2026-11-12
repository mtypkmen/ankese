'use strict';
const PATHS = {
  sq: { home: '/', register: '/regjistrohu', login: '/hyr', logout: '/dil', verify: '/verifiko',
        resend: '/ridergo', forgot: '/harrova', reset: '/rivendos', profile: '/profili', terms: '/kushtet', privacy: '/privatesia' },
  en: { home: '/en/', register: '/en/register', login: '/en/login', logout: '/en/logout', verify: '/en/verify',
        resend: '/en/resend', forgot: '/en/forgot', reset: '/en/reset', profile: '/en/profile', terms: '/en/terms', privacy: '/en/privacy' },
};
module.exports = PATHS;
Object.assign(PATHS.sq, { write: '/shkruaj', company: '/kompani', category: '/sektori', city: '/qyteti', search: '/kerko' });
Object.assign(PATHS.en, { write: '/en/write', company: '/en/company', category: '/en/category', city: '/en/city', search: '/en/search' });
Object.assign(PATHS.sq, { rules: '/rregullat', cookies: '/cookies', contact: '/kontakt' });
Object.assign(PATHS.en, { rules: '/en/rules', cookies: '/en/cookies', contact: '/en/contact' });
Object.assign(PATHS.sq, { complaints: '/ankesat', top: '/top-20', best: '/me-te-mirat-e-muajit', brands: '/markat', newBrands: '/markat-e-reja' });
Object.assign(PATHS.en, { complaints: '/en/complaints', top: '/en/top-20', best: '/en/best-of-month', brands: '/en/brands', newBrands: '/en/new-brands' });
