const fs = require('fs');

let code = fs.readFileSync('src/App.tsx.3', 'utf-8');

code = code.replace(/const stored = localStorage\.getItem\('ht_contacts'\);/g, "const stored = null;");
code = code.replace(/const stored = localStorage\.getItem\('ht_display_floor_saved'\);/g, "const stored = null;");
code = code.replace(/const saved = localStorage\.getItem\('ht_spreadsheet_headers'\);/g, "const saved = null;");
code = code.replace(/const saved = localStorage\.getItem\('ht_spreadsheet_rows'\);/g, "const saved = null;");

code = code.replace(/return localStorage\.getItem\('ht_staff_login'\) === 'true';/g, "return false;");
code = code.replace(/return localStorage\.getItem\('ht_staff_role'\) \|\| 'staff';/g, "return 'staff';");

code = code.replace(/const persistedC = localStorage\.getItem\('ht_cart'\);/g, "const persistedC = null;");
code = code.replace(/const persistedS = localStorage\.getItem\('ht_solar_cart'\);/g, "const persistedS = null;");
code = code.replace(/const persistedP = localStorage\.getItem\('ht_prods'\);/g, "const persistedP = null;");
code = code.replace(/const persistedSolar = localStorage\.getItem\('ht_solar'\);/g, "const persistedSolar = null;");
code = code.replace(/const persistedD = localStorage\.getItem\('ht_deals'\);/g, "const persistedD = null;");
code = code.replace(/const persistedBank = localStorage\.getItem\('ht_bank_acc'\);/g, "const persistedBank = null;");
code = code.replace(/const persistedStatus = localStorage\.getItem\('ht_mgrstatus'\);/g, "const persistedStatus = null;");

code = code.replace(/const lastRowsStr = localStorage\.getItem\('ht_last_imported_rows'\);/g, "const lastRowsStr = null;");
code = code.replace(/const lastHeadersStr = localStorage\.getItem\('ht_last_imported_headers'\);/g, "const lastHeadersStr = null;");

// Replace the string "// App Dynamic State (persisted inside client localStorage)"
code = code.replace(/\/\/ App Dynamic State \(persisted inside client localStorage\)/g, "// App Dynamic State (synced to Firestore)");
// Replace "// Unauthenticated guests read and write to their own local GMQueue list in localStorage"
code = code.replace(/\/\/ Unauthenticated guests read and write to their own local GMQueue list in localStorage/g, "// Unauthenticated guests read and write to their own local GMQueue list in Firestore");

// Also replace the comments /* removed localStorage sync */ and /* removed localStorage rm */
code = code.replace(/\/\* removed localStorage sync \*\//g, "");
code = code.replace(/\/\* removed localStorage rm \*\//g, "");

fs.writeFileSync('src/App.tsx.4', code);
