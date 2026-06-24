const fs = require('fs');

let code = fs.readFileSync('src/App.tsx.2', 'utf-8');

// Replace getItem lazy initializers
code = code.replace(/const \[openingPhotoUrl, setOpeningPhotoUrl\] = useState\(\(\) => \{\n\s*return localStorage\.getItem\('ht_opening_photo'\) \|\| ('[^']+');\n\s*\}\);/g, "const [openingPhotoUrl, setOpeningPhotoUrl] = useState($1);");
code = code.replace(/const \[liveEmbedUrl, setLiveEmbedUrl\] = useState\(\(\) => \{\n\s*return localStorage\.getItem\('ht_live_embed'\) \|\| ('[^']+');\n\s*\}\);/g, "const [liveEmbedUrl, setLiveEmbedUrl] = useState($1);");
code = code.replace(/const \[displayFloorActiveLayout, setDisplayFloorActiveLayout\] = useState<string>\(\(\) => \{\n\s*return localStorage\.getItem\('ht_display_floor_active'\) \|\| ('[^']+');\n\s*\}\);/g, "const [displayFloorActiveLayout, setDisplayFloorActiveLayout] = useState<string>($1);");
code = code.replace(/const \[spreadsheetId, setSpreadsheetId\] = useState<string>\(\(\) => \{\n\s*return localStorage\.getItem\('ht_spreadsheet_id'\) \|\| ('');\n\s*\}\);/g, "const [spreadsheetId, setSpreadsheetId] = useState<string>($1);");
code = code.replace(/const \[csvUploadStatus, setCsvUploadStatus\] = useState<string>\(\(\) => \{\n\s*return localStorage\.getItem\('ht_csv_upload_status'\) \|\| ('[^']+');\n\s*\}\);/g, "const [csvUploadStatus, setCsvUploadStatus] = useState<string>($1);");

code = code.replace(/const \[contacts, setContacts\] = useState\(\(\) => \{\n\s*try \{\n\s*const stored = localStorage\.getItem\('ht_contacts'\);\n\s*return stored \? JSON\.parse\(stored\) : ([\s\S]*?);\n\s*\} catch \{\n\s*return [\s\S]*?;\n\s*\}\n\s*\}\);/g, "const [contacts, setContacts] = useState($1);");

code = code.replace(/const \[displayFloorSavedConfigs, setDisplayFloorSavedConfigs\] = useState<any>\(\(\) => \{\n\s*try \{\n\s*const stored = localStorage\.getItem\('ht_display_floor_saved'\);\n\s*return stored \? JSON\.parse\(stored\) : ([\s\S]*?);\n\s*\} catch \{\n\s*return [\s\S]*?;\n\s*\}\n\s*\}\);/g, "const [displayFloorSavedConfigs, setDisplayFloorSavedConfigs] = useState<any>($1);");

code = code.replace(/const \[spreadsheetHeaders, setSpreadsheetHeaders\] = useState<any\[\]>\(\(\) => \{\n\s*try \{\n\s*const saved = localStorage\.getItem\('ht_spreadsheet_headers'\);\n\s*return saved \? JSON\.parse\(saved\) : ([\s\S]*?);\n\s*\} catch \{\n\s*return [\s\S]*?;\n\s*\}\n\s*\}\);/g, "const [spreadsheetHeaders, setSpreadsheetHeaders] = useState<any[]>($1);");

code = code.replace(/const \[spreadsheetRows, setSpreadsheetRows\] = useState<any\[\]>\(\(\) => \{\n\s*try \{\n\s*const saved = localStorage\.getItem\('ht_spreadsheet_rows'\);\n\s*return saved \? JSON\.parse\(saved\) : ([\s\S]*?);\n\s*\} catch \{\n\s*return [\s\S]*?;\n\s*\}\n\s*\}\);/g, "const [spreadsheetRows, setSpreadsheetRows] = useState<any[]>($1);");

code = code.replace(/const \[imageCache, setImageCache\] = useState<\{ \[key: string\]: string \}>\(\(\) => \{\n\s*try \{\n\s*const persistedI = localStorage\.getItem\('ht_img_cache'\);\n\s*return persistedI \? JSON\.parse\(persistedI\) : \{\};\n\s*\} catch \{\n\s*return \{\};\n\s*\}\n\s*\}\);/g, "const [imageCache, setImageCache] = useState<{ [key: string]: string }>({});");

// For dealsList, we already have it.

code = code.replace(/const \[isStaffLoggedIn, setIsStaffLoggedIn\] = useState<boolean>\(\(\) => \{\n\s*try \{\n\s*return localStorage\.getItem\('ht_staff_login'\) === 'true';\n\s*\} catch \{\n\s*return false;\n\s*\}\n\s*\}\);/g, "const [isStaffLoggedIn, setIsStaffLoggedIn] = useState<boolean>(false);");

code = code.replace(/const \[staffRole, setStaffRole\] = useState<string>\(\(\) => \{\n\s*try \{\n\s*return localStorage\.getItem\('ht_staff_role'\) \|\| 'staff';\n\s*\} catch \{\n\s*return 'staff';\n\s*\}\n\s*\}\);/g, "const [staffRole, setStaffRole] = useState<string>('staff');");

// Strip out the handleSync that uses localStorage
code = code.replace(/const handleSync = \(\) => \{\n\s*try \{\n\s*const logged = localStorage\.getItem\('ht_staff_login'\) === 'true';\n\s*const r = localStorage\.getItem\('ht_staff_role'\) \|\| 'staff';\n\s*if \(logged !== isStaffLoggedIn\) setIsStaffLoggedIn\(logged\);\n\s*if \(r !== staffRole\) setStaffRole\(r\);\n\s*\} catch \(e\) \{\n\s*\/\/ Safe fallback\n\s*\}\n\s*\};\n\s*const timer = setInterval\(handleSync, 500\);/g, "");

code = code.replace(/clearInterval\(timer\);/g, "");

// Strip out the initial loading from local storage block:
const loadNonFirestoreBlock = `  // Load non-Firestore state from local storage
  useEffect(() => {
    try {
      const persistedC = localStorage.getItem('ht_cart');
      const persistedS = localStorage.getItem('ht_solar_cart');
      const persistedP = localStorage.getItem('ht_prods');
      const persistedSolar = localStorage.getItem('ht_solar');
      const persistedD = localStorage.getItem('ht_deals');
      const persistedBank = localStorage.getItem('ht_bank_acc');
      const persistedStatus = localStorage.getItem('ht_mgrstatus');

      if (persistedC) setCart(JSON.parse(persistedC));
      if (persistedS) setSolarCart(JSON.parse(persistedS));
      if (persistedP) {
        const parsedP: Product[] = JSON.parse(persistedP);
        const updatedP = parsedP.map(p => {
          const latest = PRODS.find(item => item.id === p.id || (p.pn && item.pn === p.pn));
          if (latest) {
            return {
              ...p,
              pn: latest.pn,
              cat: latest.cat,
              n: latest.n,
              sp: latest.sp,
              price: p.price === 'CALL' ? latest.price : p.price,
              desc: latest.desc,
              imageUrl: latest.imageUrl || p.imageUrl
            };
          }
          return p;
        });
        setProductsList(updatedP);
      } else {
        setProductsList(PRODS);
      }

      if (persistedSolar) {
        const parsedSolar: SolarProduct[] = JSON.parse(persistedSolar);
        const updatedSolar = parsedSolar.map(s => {
          const latest = SOLAR.find(item => item.id === s.id);
          if (latest) {
            return {
              ...s,
              cat: latest.cat,
              n: latest.n,
              brand: latest.brand,
              sp: latest.sp,
              price: s.price || latest.price,
              desc: latest.desc || s.desc,
              imageUrl: latest.imageUrl || s.imageUrl
            };
          }
          return s;
        });
        setSolarProductsList(updatedSolar);
      } else {
        setSolarProductsList(SOLAR);
      }
      if (persistedD) setDealsList(JSON.parse(persistedD));
      if (persistedBank) setBankAccount(JSON.parse(persistedBank));
      if (persistedStatus) setMgrStatus(persistedStatus as 'available' | 'busy');
    } catch (e) {
      console.warn("Error hydrating from local storage", e);
    }
  }, []);`;

code = code.replace(loadNonFirestoreBlock, "");

// Now add the new Firestore sync for all those settings.
// We will inject it right after `useEffect(() => { ... deep link checking ... }, [db]);`

const firestoreSyncCode = `  // Sync App Settings from Firestore
  useEffect(() => {
    let unsubGlobal = () => {};
    let unsubSpreadsheet = () => {};
    let unsubDeals = () => {};

    try {
      unsubGlobal = onSnapshot(doc(db, 'app_settings', 'global'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.cart) setCart(data.cart.data || {});
          if (data.solar_cart) setSolarCart(data.solar_cart.data || {});
          if (data.bank_acc) setBankAccount(data.bank_acc.data);
          if (data.contacts) setContacts(data.contacts.data);
          if (data.opening_photo) setOpeningPhotoUrl(data.opening_photo.data);
          if (data.live_embed) setLiveEmbedUrl(data.live_embed.data);
          if (data.display_floor_active) setDisplayFloorActiveLayout(data.display_floor_active.data);
          if (data.display_floor_saved) setDisplayFloorSavedConfigs(data.display_floor_saved.data);
          if (data.spreadsheet_id) setSpreadsheetId(data.spreadsheet_id.data);
          if (data.csv_upload_status) setCsvUploadStatus(data.csv_upload_status.data);
          if (data.mgrstatus) setMgrStatus(data.mgrstatus.data);
          if (data.img_cache) setImageCache(data.img_cache.data || {});
          
          if (data.staff_login !== undefined) setIsStaffLoggedIn(data.staff_login.data);
          if (data.staff_role !== undefined) setStaffRole(data.staff_role.data);
        }
      });

      unsubSpreadsheet = onSnapshot(doc(db, 'app_settings', 'spreadsheet'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.headers) setSpreadsheetHeaders(data.headers.data || []);
          if (data.rows) setSpreadsheetRows(data.rows.data || []);
        }
      });
      
      unsubDeals = onSnapshot(collection(db, 'deals'), (snapshot) => {
        const list: Deal[] = [];
        snapshot.forEach((d) => list.push(d.data() as Deal));
        if (list.length > 0) setDealsList(list);
      });
    } catch (err) {
      console.warn("Global config live sync error:", err);
    }
    return () => {
      unsubGlobal();
      unsubSpreadsheet();
      unsubDeals();
    };
  }, []);
`;

// Find where to inject
code = code.replace("  // Synchronize Escalations Collection from Firestore", firestoreSyncCode + "\n  // Synchronize Escalations Collection from Firestore");

// Now fix the Deals logic
code = code.replace(/setDoc\(doc\(db, 'app_settings', 'deals'\), \{ data: JSON.stringify\(([^)]+)\) \}, \{ merge: true \}\);?/g, "");

// We need to rewrite handleAddCustomDeal and handleDeleteDeal
const newAddDeal = `  const handleAddCustomDeal = (deal: Deal) => {
    setDoc(doc(db, 'deals', String(deal.id)), deal);
  };`;
code = code.replace(/const handleAddCustomDeal = \(deal: Deal\) => \{\n\s*const updated = \[deal, \.\.\.dealsList\];\n\s*setDealsList\(updated\);\n\s*\}\;/g, newAddDeal); // Wait, this regex may fail if my earlier migrate.cjs changed it to remove localStorage.

// Let's replace the whole handleAddCustomDeal manually.
// First remove it if it exists.
code = code.replace(/const handleAddCustomDeal = \(deal: Deal\) => \{[\s\S]*?\};/g, newAddDeal);

const newDeleteDeal = `  const handleDeleteDeal = (id: string) => {
    if (window.confirm('⚠️ Are you sure you want to delete this promotional deal?')) {
      deleteDoc(doc(db, 'deals', String(id)));
    }
  };`;
code = code.replace(/const handleDeleteDeal = \(id: string\) => \{[\s\S]*?\};\n\s*\}\;/g, newDeleteDeal);


// Fix login saving:
code = code.replace(/localStorage\.setItem\('ht_staff_login', 'true'\);/g, "setDoc(doc(db, 'app_settings', 'global'), { staff_login: { data: true } }, { merge: true });");
code = code.replace(/localStorage\.setItem\('ht_staff_login', 'false'\);/g, "setDoc(doc(db, 'app_settings', 'global'), { staff_login: { data: false } }, { merge: true });");
code = code.replace(/localStorage\.setItem\('ht_staff_role',([^)]+)\);/g, "setDoc(doc(db, 'app_settings', 'global'), { staff_role: { data: $1 } }, { merge: true });");

// Replace spreadsheet saves:
// The migrate2.cjs replaced it with:
// setDoc(doc(db, 'app_settings', 'spreadsheet_rows'), { data: JSON.stringify(updated) }, { merge: true });
// We want them all grouped in 'spreadsheet' doc.
code = code.replace(/setDoc\(doc\(db, 'app_settings', 'spreadsheet_rows'\), \{ data: ([^}]+) \}, \{ merge: true \}\);/g, "setDoc(doc(db, 'app_settings', 'spreadsheet'), { rows: { data: $1 } }, { merge: true });");
code = code.replace(/setDoc\(doc\(db, 'app_settings', 'spreadsheet_headers'\), \{ data: ([^}]+) \}, \{ merge: true \}\);/g, "setDoc(doc(db, 'app_settings', 'spreadsheet'), { headers: { data: $1 } }, { merge: true });");
code = code.replace(/setDoc\(doc\(db, 'app_settings', 'last_imported_rows'\), \{ data: ([^}]+) \}, \{ merge: true \}\);/g, "setDoc(doc(db, 'app_settings', 'spreadsheet'), { last_imported_rows: { data: $1 } }, { merge: true });");
code = code.replace(/setDoc\(doc\(db, 'app_settings', 'last_imported_headers'\), \{ data: ([^}]+) \}, \{ merge: true \}\);/g, "setDoc(doc(db, 'app_settings', 'spreadsheet'), { last_imported_headers: { data: $1 } }, { merge: true });");


// Fix the lastRowsStr and lastHeadersStr logic that reads from local storage:
//        const lastRowsStr = localStorage.getItem('ht_last_imported_rows');
//        const lastHeadersStr = localStorage.getItem('ht_last_imported_headers');
// Since it was replaced with null:
// Let's just remove that reset handler or rewrite it to use Firestore, but wait, those were local vars.
// Better yet, I can just use a sed string replace to strip out the comment blocks.

fs.writeFileSync('src/App.tsx.3', code);
