const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace localStorage fallbacks with empty/no-op
// We will replace localStorage.setItem('...', ...) with void 0;
code = code.replace(/localStorage\.setItem\('ht_(products|solar_products|repairs|escalations|manager_requests|gmq|requests|videos|gallery_photos|rev)',\s*[^)]+\);?/g, '/* removed localStorage sync */');

code = code.replace(/localStorage\.removeItem\('ht_[^']+'\);?/g, '/* removed localStorage rm */');

// For getItem fallbacks of synced collections:
// e.g. const persistedR = localStorage.getItem('ht_repairs');
// We just let it be, but replace the call with null
code = code.replace(/localStorage\.getItem\('ht_(products|solar_products|repairs|escalations|manager_requests|gmq|requests|videos|gallery_photos|rev)'\)/g, 'null');

fs.writeFileSync('src/App.tsx.1', code);
console.log('Done 1');
