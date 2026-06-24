const fs = require('fs');

let code = fs.readFileSync('src/App.tsx.backup', 'utf-8');

// 1. We replace ALL `localStorage.` with `customStorage.`
code = code.replace(/localStorage\./g, 'customStorage.');

// 2. We inject customStorage at the top of the file, right after imports
const customStorageCode = `
const customStorage = {
  setItem: (key: string, value: string) => {
    // We only care about syncing the items that aren't already syncing via collection snapshots.
    // The collections (products, repairs, requests, etc.) already have Firestore setDoc/deleteDoc logic.
    // So for them, customStorage.setItem is a no-op fallback.
    const settingsKeys = ['ht_cart', 'ht_solar_cart', 'ht_bank_acc', 'ht_deals', 'ht_contacts', 'ht_opening_photo', 'ht_live_embed', 'ht_display_floor_active', 'ht_display_floor_saved', 'ht_spreadsheet_id', 'ht_csv_upload_status', 'ht_img_cache', 'ht_mgrstatus', 'ht_staff_login', 'ht_staff_role'];
    if (settingsKeys.includes(key)) {
       const shortKey = key.replace('ht_', '');
       let parsed = value;
       try { parsed = JSON.parse(value); } catch(e) {}
       setDoc(doc(db, 'app_settings', 'global'), { [shortKey]: { data: parsed } }, { merge: true }).catch(console.warn);
    }
    const spreadsheetKeys = ['ht_spreadsheet_headers', 'ht_spreadsheet_rows', 'ht_last_imported_headers', 'ht_last_imported_rows'];
    if (spreadsheetKeys.includes(key)) {
       const shortKey = key.replace('ht_', '');
       let parsed = value;
       try { parsed = JSON.parse(value); } catch(e) {}
       setDoc(doc(db, 'app_settings', 'spreadsheet'), { [shortKey]: { data: parsed } }, { merge: true }).catch(console.warn);
    }
  },
  getItem: (key: string) => null,
  removeItem: (key: string) => {}
};
`;

code = code.replace("import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';", "import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';\n" + customStorageCode);

// 3. We inject the global sync effect inside the App component
const firestoreSyncCode = `  // Sync App Settings from Firestore
  useEffect(() => {
    let unsubGlobal = () => {};
    let unsubSpreadsheet = () => {};

    try {
      unsubGlobal = onSnapshot(doc(db, 'app_settings', 'global'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.cart !== undefined) setCart(data.cart.data || {});
          if (data.solar_cart !== undefined) setSolarCart(data.solar_cart.data || {});
          if (data.bank_acc !== undefined) setBankAccount(data.bank_acc.data);
          if (data.contacts !== undefined) setContacts(data.contacts.data);
          if (data.opening_photo !== undefined) setOpeningPhotoUrl(data.opening_photo.data);
          if (data.live_embed !== undefined) setLiveEmbedUrl(data.live_embed.data);
          if (data.display_floor_active !== undefined) setDisplayFloorActiveLayout(data.display_floor_active.data);
          if (data.display_floor_saved !== undefined) setDisplayFloorSavedConfigs(data.display_floor_saved.data);
          if (data.spreadsheet_id !== undefined) setSpreadsheetId(data.spreadsheet_id.data);
          if (data.csv_upload_status !== undefined) setCsvUploadStatus(data.csv_upload_status.data);
          if (data.mgrstatus !== undefined) setMgrStatus(data.mgrstatus.data);
          if (data.img_cache !== undefined) setImageCache(data.img_cache.data || {});
          if (data.deals !== undefined) setDealsList(data.deals.data || []);
          
          if (data.staff_login !== undefined) setIsStaffLoggedIn(data.staff_login.data);
          if (data.staff_role !== undefined) setStaffRole(data.staff_role.data);
        }
      });

      unsubSpreadsheet = onSnapshot(doc(db, 'app_settings', 'spreadsheet'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.spreadsheet_headers !== undefined) setSpreadsheetHeaders(data.spreadsheet_headers.data || []);
          if (data.spreadsheet_rows !== undefined) setSpreadsheetRows(data.spreadsheet_rows.data || []);
          // if (data.last_imported_headers !== undefined) ... handled lazily maybe
        }
      });
    } catch (err) {
      console.warn("Global config live sync error:", err);
    }
    return () => {
      unsubGlobal();
      unsubSpreadsheet();
    };
  }, []);
`;

// Find where to inject
code = code.replace("  // Synchronize Escalations Collection from Firestore", firestoreSyncCode + "\n  // Synchronize Escalations Collection from Firestore");


// 4. We remove the old `useEffect` that hydrated from localStorage
const loadNonFirestoreBlock = `  // Load non-Firestore state from local storage
  useEffect(() => {
    try {
      const persistedC = customStorage.getItem('ht_cart');
      const persistedS = customStorage.getItem('ht_solar_cart');
      const persistedP = customStorage.getItem('ht_prods');
      const persistedSolar = customStorage.getItem('ht_solar');
      const persistedD = customStorage.getItem('ht_deals');
      const persistedBank = customStorage.getItem('ht_bank_acc');
      const persistedStatus = customStorage.getItem('ht_mgrstatus');

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

// Write it out
fs.writeFileSync('src/App.tsx.new', code);
