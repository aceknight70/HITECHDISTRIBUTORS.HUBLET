/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, SolarProduct, RepairRecord } from '../types';

// Initialize Firebase App gracefully
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add Google Sheets full spreadsheets access scope
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize Google OAuth state tracking
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Load cached token from session memory if we're active
  const storedToken = sessionStorage.getItem('ht_sheets_access_token');
  if (storedToken) {
    cachedAccessToken = storedToken;
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        sessionStorage.removeItem('ht_sheets_access_token');
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

// Sign in with Google using popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get Google Sheets access token from authentication.');
    }
    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem('ht_sheets_access_token', cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sheets Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Log out
export const logoutSheets = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  sessionStorage.removeItem('ht_sheets_access_token');
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken || sessionStorage.getItem('ht_sheets_access_token');
};

/**
 * Creates a brand new fully formatted spreadsheet named "HiTech Distributors Live Sync"
 */
export async function createAppSpreadsheet(token: string): Promise<string> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: 'HiTech Distributors Live Sync'
      },
      sheets: [
        { properties: { title: 'Showroom Inventory' } },
        { properties: { title: 'Solar Inventory' } },
        { properties: { title: 'Sales Log' } },
        { properties: { title: 'Repairs Queue' } }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create spreadsheet: ${errText}`);
  }

  const result = await response.json();
  const spreadsheetId = result.spreadsheetId;

  // Now, initialize headers for each sheet
  await initializeHeaders(token, spreadsheetId);

  return spreadsheetId;
}

/**
 * Push headers into newly created sheet tabs
 */
async function initializeHeaders(token: string, spreadsheetId: string) {
  const showroomHeaders = ['ID', 'Part Number', 'Category', 'Name', 'Specs', 'Price', 'Description', 'Is New (True/False)', 'Is Promo (True/False)'];
  const solarHeaders = ['ID', 'Category', 'Name', 'Brand', 'Specs', 'Price', 'Description'];
  const salesHeaders = ['Timestamp', 'Invoice Code', 'Client Name', 'Phone', 'Address', 'Summary of Items', 'Total Price', 'Payment Account'];
  const repairsHeaders = ['Record ID', 'Reference Tag', 'Device Type', 'Brand', 'Fault Problem', 'Owner Name', 'Contact Phone', 'Current Status', 'Date Submitted'];

  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  
  await fetch(batchUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: 'Showroom Inventory!A1:I1', values: [showroomHeaders] },
        { range: 'Solar Inventory!A1:G1', values: [solarHeaders] },
        { range: 'Sales Log!A1:H1', values: [salesHeaders] },
        { range: 'Repairs Queue!A1:I1', values: [repairsHeaders] }
      ]
    })
  });
}

/**
 * Export active Products and Solar Products into connected Spreadsheet
 */
export async function exportInventoryToSheet(
  token: string,
  spreadsheetId: string,
  products: Product[],
  solarProducts: SolarProduct[]
) {
  // Prep standard products
  const productRows = products.map(p => [
    p.id,
    p.pn || '—',
    p.cat,
    p.n,
    p.sp,
    p.price,
    p.desc || '',
    p.newp ? 'True' : 'False',
    p.promo ? 'True' : 'False'
  ]);

  // Prep solar products
  const solarRows = solarProducts.map(s => [
    s.id,
    s.cat,
    s.n,
    s.brand,
    s.sp,
    s.price,
    s.desc || ''
  ]);

  // We want to clear trailing rows first, or overwrite full grid. Let's do batch update first.
  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;

  // Standard Clear first by replacing sheet values
  // We can write starting on cell A2 to preserve headers
  const response = await fetch(batchUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        // Showroom sheet (clear and populate)
        { range: 'Showroom Inventory!A2:I1000', values: productRows.length ? productRows : [['', '', '', '', '', '', '', '', '']] },
        // Solar sheet (clear and populate)
        { range: 'Solar Inventory!A2:G1000', values: solarRows.length ? solarRows : [['', '', '', '', '', '', '']] }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to export data: ${errText}`);
  }

  return true;
}

/**
 * Pull and parse inventory list directly from Google Sheets
 */
export async function importInventoryFromSheet(
  token: string,
  spreadsheetId: string
): Promise<{ products: Product[]; solarProducts: SolarProduct[] }> {
  const showroomUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Showroom Inventory!A2:I1000`;
  const solarUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Solar Inventory!A2:G1000`;

  const getValues = async (url: string) => {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.values || [];
  };

  const showroomRows = await getValues(showroomUrl);
  const solarRows = await getValues(solarUrl);

  const parsedProducts: Product[] = showroomRows
    .filter((row: any[]) => row && row[3]) // Name column must exist
    .map((row: any[], index: number) => {
      const id = parseInt(row[0]) || (index + 200);
      return {
        id,
        pn: row[1] || '—',
        cat: row[2] || 'laptops',
        n: row[3],
        sp: row[4] || '',
        price: row[5] || 'CALL',
        desc: row[6] || '',
        newp: String(row[7]).toLowerCase() === 'true',
        promo: String(row[8]).toLowerCase() === 'true'
      };
    });

  const parsedSolarProducts: SolarProduct[] = solarRows
    .filter((row: any[]) => row && row[2]) // Name column must exist
    .map((row: any[]) => {
      return {
        id: row[0] || ('s_' + Math.random().toString(36).substr(2, 5)),
        cat: (row[1] || 'Inverters') as any,
        n: row[2],
        brand: row[3] || 'Generic',
        sp: row[4] || '',
        price: row[5] || '₦0',
        desc: row[6] || ''
      };
    });

  return {
    products: parsedProducts,
    solarProducts: parsedSolarProducts
  };
}

/**
 * Log customer purchase invoice directly to spreadsheet
 */
export async function appendSaleLog(
  token: string,
  spreadsheetId: string,
  sale: {
    invoiceCode: string;
    clientName: string;
    phone: string;
    address: string;
    itemsSummary: string;
    totalPrice: number;
    paymentAcc: string;
  }
) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sales Log!A2:append?valueInputOption=USER_ENTERED`;
  const timestamp = new Date().toISOString();
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: 'Sales Log!A2',
      majorDimension: 'ROWS',
      values: [[
        timestamp,
        sale.invoiceCode,
        sale.clientName,
        sale.phone,
        sale.address || '—',
        sale.itemsSummary,
        `₦${sale.totalPrice.toLocaleString()}`,
        sale.paymentAcc
      ]]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Failed to log checkout row to Google Sheets:', errText);
  }
}

/**
 * Log or update repair status to Google Sheets
 */
export async function appendRepairRecord(
  token: string,
  spreadsheetId: string,
  repair: RepairRecord
) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Repairs Queue!A2:append?valueInputOption=USER_ENTERED`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: 'Repairs Queue!A2',
      majorDimension: 'ROWS',
      values: [[
        repair.id,
        repair.ref || '—',
        repair.type,
        repair.brand,
        repair.problem,
        repair.name,
        repair.phone,
        repair.status,
        repair.submitted
      ]]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Failed to log repair item to Google Sheets:', errText);
  }
}
