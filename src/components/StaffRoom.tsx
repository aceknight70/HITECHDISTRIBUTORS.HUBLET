/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, Settings, ShoppingBag, Edit, ShieldAlert, Cpu, HeartHandshake, 
  Eye, Plus, Check, FileSpreadsheet, RefreshCw, Trash2, Search, Upload, 
  MessageSquare, ExternalLink, Wifi, WifiOff, Clock, LogOut, CheckCircle2, UserCheck
} from 'lucide-react';
import { Product, SolarProduct, RepairRecord, GMRequest, Deal } from '../types';
import { PRODS, SOLAR, CATS } from '../data';
import { 
  initAuth, 
  googleSignIn, 
  logoutSheets, 
  getAccessToken, 
  createAppSpreadsheet, 
  exportInventoryToSheet, 
  importInventoryFromSheet 
} from '../lib/sheetsService';
import { User } from 'firebase/auth';

// WhatsApp Utility with special formatting for Nigerian phone numbers (+234)
const getWhatsAppUrl = (phone: string, text: string) => {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.substring(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (!cleaned.startsWith('234') && cleaned.length === 10) {
    cleaned = '234' + cleaned;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
};

interface StaffRoomProps {
  products: Product[];
  solarProducts: SolarProduct[];
  repairs: RepairRecord[];
  gmq: GMRequest[];
  mgrStatus: 'available' | 'busy';
  bankAccount: { bank: string; accountNumber: string; accountName: string };
  spreadsheetId: string;
  onUpdateProducts: (updated: Product[]) => void;
  onUpdateSolarProducts: (updated: SolarProduct[]) => void;
  onUpdateRepairs: (updated: RepairRecord[]) => void;
  onUpdateGmq: (updated: GMRequest[]) => void;
  onToggleMgrStatus: () => void;
  onUpdateBankAccount: (account: { bank: string; accountNumber: string; accountName: string }) => void;
  onAddCustomDeal: (deal: Deal) => void;
  onUpdateSpreadsheetId: (id: string) => void;
}

export default function StaffRoom({
  products,
  solarProducts,
  repairs,
  gmq,
  mgrStatus,
  bankAccount,
  spreadsheetId,
  onUpdateProducts,
  onUpdateSolarProducts,
  onUpdateRepairs,
  onUpdateGmq,
  onToggleMgrStatus,
  onUpdateBankAccount,
  onAddCustomDeal,
  onUpdateSpreadsheetId
}: StaffRoomProps) {
  const [pin, setPin] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'repairs' | 'gmq' | 'deals' | 'bank' | 'sheets'>('inventory');

  // Google Sheets local state
  const [sheetsUser, setSheetsUser] = useState<User | null>(null);
  const [sheetsToken, setSheetsToken] = useState<string | null>(null);
  const [sheetsLoading, setSheetsLoading] = useState(true);
  const [sheetActionLoading, setSheetActionLoading] = useState<'export' | 'import' | 'create' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [typedSpreadsheetId, setTypedSpreadsheetId] = useState(spreadsheetId);

  useEffect(() => {
    setTypedSpreadsheetId(spreadsheetId);
  }, [spreadsheetId]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setSheetsUser(user);
        setSheetsToken(token);
        setSheetsLoading(false);
        setLoggedIn(true); // Automatically authorize panel entrance if already signed in with Google
      },
      () => {
        setSheetsUser(null);
        setSheetsToken(null);
        setSheetsLoading(false);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleSheetsSignIn = async () => {
    setSheetsLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setSheetsUser(res.user);
        setSheetsToken(res.accessToken);
        setStatusMessage('Connected to Google Account successfully!');
        setStatusError(null);
      }
    } catch (err: any) {
      console.error(err);
      setStatusError(err.message || 'Verification / Login failed');
    } finally {
      setSheetsLoading(false);
    }
  };

  const handleSheetsSignOut = async () => {
    try {
      await logoutSheets();
      setSheetsUser(null);
      setSheetsToken(null);
      setStatusMessage('Signed out of Google Account.');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateNewSheet = async () => {
    const token = sheetsToken || getAccessToken();
    if (!token) {
      setStatusError('Please sign in first');
      return;
    }
    setSheetActionLoading('create');
    setStatusMessage(null);
    setStatusError(null);
    try {
      const id = await createAppSpreadsheet(token);
      onUpdateSpreadsheetId(id);
      setStatusMessage('New Google Sheet created and linked successfully!');
    } catch (err: any) {
      setStatusError(err.message || 'Failed to create spreadsheet');
    } finally {
      setSheetActionLoading(null);
    }
  };

  const handleLinkExistingSheet = () => {
    if (!typedSpreadsheetId.trim()) {
      setStatusError('Spreadsheet ID cannot be empty');
      return;
    }
    onUpdateSpreadsheetId(typedSpreadsheetId.trim());
    setStatusMessage('Spreadsheet linked successfully!');
    setStatusError(null);
  };

  const handleExportData = async () => {
    const token = sheetsToken || getAccessToken();
    if (!token || !spreadsheetId) {
      setStatusError('Sign in and select/create a spreadsheet first');
      return;
    }
    setSheetActionLoading('export');
    setStatusMessage(null);
    setStatusError(null);
    try {
      await exportInventoryToSheet(token, spreadsheetId, products, solarProducts);
      setStatusMessage(`Successfully exported ${products.length} Products and ${solarProducts.length} Solar Products to Google Sheets!`);
    } catch (err: any) {
      setStatusError(err.message || 'Export error');
    } finally {
      setSheetActionLoading(null);
    }
  };

  const handleImportData = async () => {
    const token = sheetsToken || getAccessToken();
    if (!token || !spreadsheetId) {
      setStatusError('Sign in and select/create a spreadsheet first');
      return;
    }
    const confirmed = window.confirm(
      'Are you sure you want to pull data from Google Sheets? This will overwrite your current live Showroom and Solar inventory lists with the values in the spreadsheet.'
    );
    if (!confirmed) return;

    setSheetActionLoading('import');
    setStatusMessage(null);
    setStatusError(null);
    try {
      const resultObj = await importInventoryFromSheet(token, spreadsheetId);
      if (resultObj.products.length || resultObj.solarProducts.length) {
        onUpdateProducts(resultObj.products);
        onUpdateSolarProducts(resultObj.solarProducts);
        setStatusMessage(`Successfully imported ${resultObj.products.length} Products and ${resultObj.solarProducts.length} Solar Products from Google Sheets!`);
      } else {
        setStatusError('Import returned 0 products. Please verify the spreadsheet structure and sheets name are correct.');
      }
    } catch (err: any) {
      setStatusError(err.message || 'Import error');
    } finally {
      setSheetActionLoading(null);
    }
  };

  // Input bindings
  const [editingProdId, setEditingProdId] = useState<number | null>(null);
  const [editingProdPrice, setEditingProdPrice] = useState('');

  const [editingSolarId, setEditingSolarId] = useState<string | null>(null);
  const [editingSolarPrice, setEditingSolarPrice] = useState('');

  // Local state for full inventory editor & creator
  const [invMode, setInvMode] = useState<'standard' | 'solar'>('standard');
  const [invSearch, setInvSearch] = useState('');
  const [invCatFilter, setInvCatFilter] = useState('all');

  // Creation State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newIsSolar, setNewIsSolar] = useState(false);
  const [newPn, setNewPn] = useState('');
  const [newN, setNewN] = useState('');
  const [newCat, setNewCat] = useState('laptops');
  const [newSolarCat, setNewSolarCat] = useState('Inverters');
  const [newBrand, setNewBrand] = useState('');
  const [newSp, setNewSp] = useState('');
  const [newPrice, setNewPrice] = useState('₦');
  const [newDesc, setNewDesc] = useState('');
  const [newPromo, setNewPromo] = useState(false);
  const [newNewp, setNewNewp] = useState(false);

  // Edit State (Object-based for standard and solar)
  const [editingFullProdId, setEditingFullProdId] = useState<number | null>(null);
  const [editingProdForm, setEditingProdForm] = useState<Partial<Product>>({});

  const [editingFullSolarId, setEditingFullSolarId] = useState<string | null>(null);
  const [editingSolarForm, setEditingSolarForm] = useState<Partial<SolarProduct>>({});

  // Direct Bulk Upload State
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [bulkUploadType, setBulkUploadType] = useState<'standard' | 'solar'>('standard');
  const [pasteText, setPasteText] = useState('');
  const [uploadMergeMode, setUploadMergeMode] = useState<'merge' | 'overwrite'>('merge');

  // Bank Form State
  const [bankInput, setBankInput] = useState(bankAccount.bank);
  const [numInput, setNumInput] = useState(bankAccount.accountNumber);
  const [nameInput, setNameInput] = useState(bankAccount.accountName);

  // New Deal Form State
  const [dealTitle, setDealTitle] = useState('');
  const [dealDesc, setDealDesc] = useState('');
  const [dealOrigPrice, setDealOrigPrice] = useState('');
  const [dealSalePrice, setDealSalePrice] = useState('');
  const [dealBadge, setDealBadge] = useState('PROMO LAPTOP');

  // Repair status management
  const [selectedRepair, setSelectedRepair] = useState<RepairRecord | null>(null);
  const [tempRef, setTempRef] = useState('');

  const handleLogin = () => {
    if (pin === '12345') {
      setLoggedIn(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Invalid Staff Security PIN. Please try again.');
    }
  };

  const saveProductPrice = (id: number) => {
    const updated = products.map(p => p.id === id ? { ...p, price: editingProdPrice } : p);
    onUpdateProducts(updated);
    setEditingProdId(null);
  };

  const saveSolarPrice = (id: string) => {
    const updated = solarProducts.map(s => s.id === id ? { ...s, price: editingSolarPrice } : s);
    onUpdateSolarProducts(updated);
    setEditingSolarId(null);
  };

  // Handler to Delete Product
  const handleDeleteProduct = (id: number) => {
    if (window.confirm('Are you sure you want to delete this standard product?')) {
      const updated = products.filter(p => p.id !== id);
      onUpdateProducts(updated);
    }
  };

  // Handler to Delete Solar Product
  const handleDeleteSolarProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this solar product?')) {
      const updated = solarProducts.filter(s => s.id !== id);
      onUpdateSolarProducts(updated);
    }
  };

  // Handler to Create Product
  const handleCreateProduct = () => {
    if (!newN.trim()) {
      alert('Product Name is required.');
      return;
    }

    if (newIsSolar) {
      const freshSolar: SolarProduct = {
        id: 'SOLAR_' + Date.now(),
        cat: newSolarCat as any,
        n: newN.trim(),
        brand: newBrand.trim() || 'Generic',
        sp: newSp.trim(),
        price: newPrice.trim(),
        desc: newDesc.trim()
      };
      
      onUpdateSolarProducts([...solarProducts, freshSolar]);
      alert('Solar product created successfully!');
    } else {
      const nextId = Math.max(...products.map(p => p.id), 0) + 1;
      const freshProd: Product = {
        id: nextId,
        pn: newPn.trim() || '—',
        cat: newCat,
        n: newN.trim(),
        sp: newSp.trim(),
        price: newPrice.trim(),
        desc: newDesc.trim(),
        promo: newPromo,
        newp: newNewp
      };

      onUpdateProducts([...products, freshProd]);
      alert('Standard product created successfully!');
    }

    // Reset Form
    setNewPn('');
    setNewN('');
    setNewSp('');
    setNewPrice('₦');
    setNewDesc('');
    setNewBrand('');
    setNewPromo(false);
    setNewNewp(false);
    setShowCreateForm(false);
  };

  // Handler to Save full standard product edits
  const handleSaveFullProduct = (id: number) => {
    const updated = products.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...editingProdForm
        } as Product;
      }
      return p;
    });
    onUpdateProducts(updated);
    setEditingFullProdId(null);
    setEditingProdForm({});
  };

  // Handler to Save full solar product edits
  const handleSaveFullSolar = (id: string) => {
    const updated = solarProducts.map(s => {
      if (s.id === id) {
        return {
          ...s,
          ...editingSolarForm
        } as SolarProduct;
      }
      return s;
    });
    onUpdateSolarProducts(updated);
    setEditingFullSolarId(null);
    setEditingSolarForm({});
  };

  // Bulk Raw Text Parser
  const handleBulkUpload = () => {
    if (!pasteText.trim()) {
      alert('Please paste some CSV or JSON data first.');
      return;
    }

    try {
      let parsedList: any[] = [];
      const trimmed = pasteText.trim();

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        parsedList = JSON.parse(trimmed);
      } else {
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          let headers: string[] = [];
          const hasHeaders = lines[0].toLowerCase().includes('name') || 
                             lines[0].toLowerCase().includes('pn') || 
                             lines[0].toLowerCase().includes('price') ||
                             lines[0].toLowerCase().includes('code');

          let startIndex = 0;
          if (hasHeaders) {
            headers = lines[0].split(/[,\t]/).map(h => h.trim().toLowerCase().replace(/["']/g, ''));
            startIndex = 1;
          }

          for (let i = startIndex; i < lines.length; i++) {
            const cells = lines[i].split(/[,\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
            
            if (bulkUploadType === 'standard') {
              if (hasHeaders) {
                const rowObj: any = { id: Math.floor(Math.random() * 1000000) };
                headers.forEach((h, idx) => {
                  const val = cells[idx] || '';
                  if (h.includes('name') || h === 'n') rowObj.n = val;
                  else if (h.includes('code') || h === 'pn' || h === 'part') rowObj.pn = val;
                  else if (h.includes('price')) rowObj.price = val;
                  else if (h.includes('spec') || h === 'sp') rowObj.sp = val;
                  else if (h.includes('desc')) rowObj.desc = val;
                  else if (h.includes('cat')) rowObj.cat = val;
                  else if (h === 'promo') rowObj.promo = val === 'true';
                  else if (h === 'new') rowObj.newp = val === 'true';
                });
                parsedList.push(rowObj);
              } else {
                parsedList.push({
                  id: Math.floor(Math.random() * 1000000),
                  pn: cells[0] || '',
                  n: cells[1] || 'New Product',
                  cat: cells[2] || 'laptops',
                  sp: cells[3] || '',
                  price: cells[4] || '₦0',
                  desc: cells[5] || ''
                });
              }
            } else {
              if (hasHeaders) {
                const rowObj: any = { id: 'SOLAR_' + Math.floor(Math.random() * 1000000) };
                headers.forEach((h, idx) => {
                  const val = cells[idx] || '';
                  if (h.includes('name') || h === 'n') rowObj.n = val;
                  else if (h === 'id' || h === 'code') rowObj.id = val;
                  else if (h.includes('brand')) rowObj.brand = val;
                  else if (h.includes('price')) rowObj.price = val;
                  else if (h.includes('spec') || h === 'sp') rowObj.sp = val;
                  else if (h.includes('desc')) rowObj.desc = val;
                  else if (h.includes('cat')) rowObj.cat = val as any;
                });
                parsedList.push(rowObj);
              } else {
                parsedList.push({
                  id: cells[0] || 'SOLAR_' + Math.floor(Math.random() * 1000000),
                  n: cells[1] || 'New Solar Product',
                  brand: cells[2] || 'Generic',
                  cat: (cells[3] || 'Inverters') as any,
                  sp: cells[4] || '',
                  price: cells[5] || '₦0',
                  desc: cells[6] || ''
                });
              }
            }
          }
        }
      }

      if (parsedList.length === 0) {
        alert('Could not parse any rows. Please check format.');
        return;
      }

      if (bulkUploadType === 'standard') {
        const cleanedList: Product[] = parsedList.map((item, idx) => {
          return {
            id: Number(item.id) || (Math.max(...products.map(p => p.id), 0) + idx + 1),
            pn: String(item.pn || item.product_code || '—'),
            cat: String(item.cat || item.category || 'laptops'),
            n: String(item.n || item.name || 'Unnamed Product'),
            sp: String(item.sp || item.specs || item.specifications || ''),
            price: String(item.price || '₦0'),
            promo: !!item.promo,
            newp: !!item.newp,
            desc: String(item.desc || item.description || '')
          };
        });

        if (uploadMergeMode === 'overwrite') {
          onUpdateProducts(cleanedList);
        } else {
          onUpdateProducts([...products, ...cleanedList]);
        }
        alert(`Successfully imported ${cleanedList.length} standard products!`);
      } else {
        const cleanedSolarList: SolarProduct[] = parsedList.map((item, idx) => {
          return {
            id: String(item.id || 'SOLAR_' + (Date.now() + idx)),
            cat: String(item.cat || 'Inverters') as any,
            n: String(item.n || item.name || 'Unnamed Solar Item'),
            brand: String(item.brand || 'Generic'),
            sp: String(item.sp || item.specs || ''),
            price: String(item.price || '₦0'),
            desc: String(item.desc || item.description || '')
          };
        });

        if (uploadMergeMode === 'overwrite') {
          onUpdateSolarProducts(cleanedSolarList);
        } else {
          onUpdateSolarProducts([...solarProducts, ...cleanedSolarList]);
        }
        alert(`Successfully imported ${cleanedSolarList.length} solar products!`);
      }

      setPasteText('');
      setShowUploadPanel(false);
    } catch (err: any) {
      alert('Error parsing upload: ' + err.message);
    }
  };

  const handleSaveBank = () => {
    onUpdateBankAccount({
      bank: bankInput,
      accountNumber: numInput,
      accountName: nameInput
    });
    alert('Bank account settings updated successfully!');
  };

  const handlePublishDeal = () => {
    if (!dealTitle || !dealSalePrice) return;
    const nDeal: Deal = {
      id: 'custom_' + Date.now(),
      title: dealTitle,
      desc: dealDesc,
      origPrice: dealOrigPrice,
      salePrice: dealSalePrice,
      badge: dealBadge,
      isCustom: true
    };
    onAddCustomDeal(nDeal);
    setDealTitle('');
    setDealDesc('');
    setDealOrigPrice('');
    setDealSalePrice('');
    alert('Custom high-density deal displayed in Deals lounge!');
  };

  const handleUpdateRepairStage = (id: string, newStatus: RepairRecord['status']) => {
    const updated = repairs.map(r => {
      if (r.id === id || r.ref === id) {
        const nextStages = r.stages.includes(newStatus) ? r.stages : [...r.stages, newStatus];
        return {
          ...r,
          status: newStatus,
          stages: nextStages
        };
      }
      return r;
    });
    onUpdateRepairs(updated);
    if (selectedRepair && (selectedRepair.id === id || selectedRepair.ref === id)) {
      setSelectedRepair({ ...selectedRepair, status: newStatus, stages: selectedRepair.stages.includes(newStatus) ? selectedRepair.stages : [...selectedRepair.stages, newStatus] });
    }
  };

  const handleAssignRef = (id: string) => {
    if (!tempRef) return;
    const updated = repairs.map(r => r.id === id ? { ...r, ref: tempRef } : r);
    onUpdateRepairs(updated);
    if (selectedRepair && selectedRepair.id === id) {
      setSelectedRepair({ ...selectedRepair, ref: tempRef });
    }
    setTempRef('');
    alert(`Assigned tracking tag ${tempRef}`);
  };

  const handleMarkGmqAddressed = (id: string) => {
    const updated = gmq.map(q => q.id === id ? { ...q, status: 'addressed' as const } : q);
    onUpdateGmq(updated);
  };

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-[460px] text-zinc-200">
        <div className="w-14 h-14 rounded-full bg-zinc-950 border border-[#F5C518]/30 flex items-center justify-center mb-5 animate-pulse">
          <ShieldAlert className="text-[#F5C518] w-6 h-6" />
        </div>
        <h2 className="text-md font-bold uppercase tracking-widest text-[#f5f5f5] mb-2 font-mono">HiTech Staff Gateway</h2>
        <p className="text-xs text-zinc-400 max-w-sm mb-6 text-center leading-relaxed">
          Authorized operational gateway. Logging in unlocks cloud Firestore databases, Google Sheets syncing, live inventory editing, and service queue tracking.
        </p>

        <div className="w-full max-w-md bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-5">
          {/* Option A: Google Staff Authentication */}
          <div className="space-y-2 text-center pb-4 border-b border-zinc-800">
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 font-bold block mb-1">Recommended Entrance</span>
            {sheetsLoading ? (
              <div className="flex items-center justify-center py-2 space-x-2 text-zinc-400">
                <RefreshCw className="animate-spin w-4 h-4 text-[#F5C518]" />
                <span className="text-xs font-mono">Verifying OAuth Client...</span>
              </div>
            ) : (
              <button
                onClick={handleSheetsSignIn}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[#f5f5f5] text-xs font-bold uppercase transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Sign in with Google Account
              </button>
            )}
            <p className="text-[10px] text-zinc-500">Signs you in safely to sync the Firestore cloud directly.</p>
          </div>

          {/* Separator block */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-3 text-[9px] text-zinc-650 font-mono font-bold uppercase">OR USE PINPASS</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          {/* Option B: Security PIN */}
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Enter Security PIN (e.g. 12345)"
              className="w-full text-center bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#F5C518] placeholder-zinc-700 font-mono tracking-widest"
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <button
              onClick={handleLogin}
              className="w-full py-2 bg-[#F5C518] hover:bg-amber-500 text-[#0a0a0a] text-xs font-bold uppercase rounded-lg transition-colors"
            >
              Unlock Lounge with PIN
            </button>
            {errorMsg && <p className="text-[10px] text-red-400 text-center font-semibold font-mono">{errorMsg}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Top Controls bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#141414] p-3 border border-[#262626] rounded-xl text-xs gap-3">
        <div className="flex items-center gap-2.5 text-left">
          <div className="w-8 h-8 rounded-full bg-zinc-950 border border-[#F5C518]/20 flex items-center justify-center font-mono font-black text-[#F5C518]">
            HT
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider leading-none mb-1">Authorized Operations</span>
            <span className="text-zinc-200 font-bold block">{sheetsUser?.displayName || 'HiTech Staff Admin'}</span>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400">GM:</span>
            <button
              onClick={onToggleMgrStatus}
              className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-colors shrink-0 ${
                mgrStatus === 'available' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}
            >
              {mgrStatus === 'available' ? '● AVAILABLE' : '● BUSY'}
            </button>
          </div>

          <div className="flex gap-1.5 text-xs">
            <button
              title="Lock Panel"
              onClick={() => {
                setLoggedIn(false);
                setPin('');
              }}
              className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded hover:bg-zinc-850 text-[10px] items-center gap-1 inline-flex font-bold uppercase transition"
            >
              <Lock className="w-3 h-3 text-[#F5C518]" />
              <span>Lock</span>
            </button>

            {sheetsUser && (
              <button
                title="Disconnect Google Auth"
                onClick={handleSheetsSignOut}
                className="px-2.5 py-1 bg-red-950/30 hover:bg-red-950/50 border border-red-900/30 text-red-400 rounded text-[10px] items-center gap-1 inline-flex font-bold uppercase transition"
              >
                <LogOut className="w-3 h-3" />
                <span>Exit Auth</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DASHBOARD INTEGRITY KPI METRICS (BENTO GRAPH) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div 
          onClick={() => setActiveTab('inventory')}
          className="bg-[#141414] hover:bg-[#181818] border border-[#262626] hover:border-[#F5C518]/30 p-3 rounded-xl text-left cursor-pointer transition space-y-1"
        >
          <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mb-1">Showroom Stock</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-zinc-100 font-mono tracking-tight">{products.length + solarProducts.length}</span>
            <span className="text-[10px] text-zinc-505 font-medium">items</span>
          </div>
          <span className="text-[8.5px] text-[#F5C518] font-bold uppercase block">{products.length} catalog / {solarProducts.length} solar</span>
        </div>

        <div 
          onClick={() => setActiveTab('repairs')}
          className="bg-[#141414] hover:bg-[#181818] border border-[#262626] hover:border-[#F5C518]/30 p-3 rounded-xl text-left cursor-pointer transition space-y-1"
        >
          <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mb-1">Active Repairs</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-zinc-100 font-mono tracking-tight">{repairs.length}</span>
            <span className="text-[10px] text-zinc-505 font-medium">tickets</span>
          </div>
          <span className="text-[8.5px] text-amber-500 font-bold uppercase block">
            {repairs.filter(r => r.status === 'Ready for Pickup').length} Ready / {repairs.filter(r => r.status === 'In Repair' || r.status === 'Diagnosed').length} In Progress
          </span>
        </div>

        <div 
          onClick={() => setActiveTab('gmq')}
          className="bg-[#141414] hover:bg-[#181818] border border-[#262626] hover:border-[#F5C518]/30 p-3 rounded-xl text-left cursor-pointer transition space-y-1"
        >
          <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mb-1">GM Escalation</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-zinc-100 font-mono tracking-tight">
              {gmq.filter(q => q.status === 'pending').length}
            </span>
            <span className="text-[10px] text-zinc-505 font-medium">pending</span>
          </div>
          <span className="text-[8.5px] text-emerald-400 font-bold uppercase block">{gmq.length} total submits</span>
        </div>

        <div 
          className="bg-[#141414] border border-[#262626] p-3 rounded-xl text-left space-y-1 flex flex-col justify-between"
        >
          <div>
            <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mb-0.5">Database Sync</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse shrink-0 ${sheetsUser ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[10.5px] font-bold text-zinc-200 uppercase leading-none font-sans">
                {sheetsUser ? 'Live Cloud' : 'Local Offline'}
              </span>
            </div>
          </div>
          {!sheetsUser ? (
            <button 
              onClick={handleSheetsSignIn}
              className="text-[8px] bg-[#F5C518]/10 hover:bg-[#F5C518]/20 border border-[#F5C518]/30 text-[#F5C518] px-1.5 py-0.5 rounded font-extrabold uppercase block text-center"
            >
              Sign-In (Gmail)
            </button>
          ) : (
            <span className="text-[8px] text-zinc-500 font-mono font-bold uppercase">Google Connected</span>
          )}
        </div>
      </div>

      {/* SYNC NOTIFICATION BANNER */}
      {!sheetsUser && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs flex items-center justify-between gap-3 text-left">
          <div className="space-y-0.5 leading-normal">
            <p className="font-bold uppercase tracking-wider text-[9.5px]">⚠️ Offline Emulation Fallback Active</p>
            <p className="text-[11px] text-zinc-400">
              You are currently viewing local local-storage mockups for the GM Queue and repairs queue. Auth with Google to synchronize live with Firestore and Spreadsheet logs.
            </p>
          </div>
          <button 
            onClick={handleSheetsSignIn}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-[#0a0a0a] text-[10px] font-extrabold uppercase rounded shrink-0 transition"
          >
            Authenticate Live
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#262626] text-xs uppercase overflow-x-auto gap-2">
        {(['inventory', 'repairs', 'gmq', 'deals', 'bank', 'sheets'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 font-bold tracking-wider relative whitespace-nowrap ${
              activeTab === tab ? 'text-[#F5C518]' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
            {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#F5C518]" />}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: INVENTORY & PRICES */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 bg-[#141414] p-3 border border-[#262626] rounded-xl text-left">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Back-Office Product Hub</h3>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">
                Directly modify catalog inventory, upload new items list, or edit prices.
              </p>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto self-end md:self-center">
              <button
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  setShowUploadPanel(false);
                }}
                className={`flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition ${
                  showCreateForm ? 'bg-[#F5C518] text-black font-extrabold' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Single</span>
              </button>

              <button
                onClick={() => {
                  setShowUploadPanel(!showUploadPanel);
                  setShowCreateForm(false);
                }}
                className={`flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition ${
                  showUploadPanel ? 'bg-emerald-600 text-white font-extrabold' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Bulk Upload</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC FORM: CREATE PRODUCT */}
          {showCreateForm && (
            <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3 text-left">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-zinc-200 uppercase">Create New Product</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase font-mono">Solar Product?</span>
                  <input
                    type="checkbox"
                    className="accent-[#F5C518]"
                    checked={newIsSolar}
                    onChange={e => setNewIsSolar(e.target.checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HP Pavilion Laptop 15-dw"
                    className="w-full bg-black border border-[#262626] rounded px-3 py-1.5 text-white focus:outline-none"
                    value={newN}
                    onChange={e => setNewN(e.target.value)}
                  />
                </div>

                {!newIsSolar ? (
                  <>
                    <div>
                      <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Product Code / Part Number (PN)</label>
                      <input
                        type="text"
                        placeholder="e.g. HP-49L31EA"
                        className="w-full bg-black border border-[#262626] rounded px-3 py-1.5 text-white focus:outline-none"
                        value={newPn}
                        onChange={e => setNewPn(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Catalogue Category</label>
                      <select
                        className="w-full bg-black border border-[#262626] rounded px-3 py-1.5 text-white focus:outline-none"
                        value={newCat}
                        onChange={e => setNewCat(e.target.value)}
                      >
                        {CATS.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Brand Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Felicity, Growatt, Jinko"
                        className="w-full bg-black border border-[#262626] rounded px-3 py-1.5 text-white focus:outline-none"
                        value={newBrand}
                        onChange={e => setNewBrand(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Solar Category</label>
                      <select
                        className="w-full bg-black border border-[#262626] rounded px-3 py-1.5 text-white focus:outline-none"
                        value={newSolarCat}
                        onChange={e => setNewSolarCat(e.target.value)}
                      >
                        <option value="Inverters">Inverters</option>
                        <option value="Lithium Batteries">Lithium Batteries</option>
                        <option value="Tubular Battery">Tubular Battery</option>
                        <option value="Solar Panels">Solar Panels</option>
                        <option value="Controllers">Controllers</option>
                        <option value="Cables">Cables</option>
                        <option value="All-in-One">All-in-One</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Price Unit</label>
                  <input
                    type="text"
                    placeholder="₦400,000 or CALL"
                    className="w-full bg-black border border-[#262626] rounded px-3 py-1.5 text-[#F5C518] font-mono focus:outline-none"
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Specifications (Subtitle specs)</label>
                  <input
                    type="text"
                    placeholder="Intel Celeron N4500 · 4GB RAM · 256GB SSD · 15.6” FHD"
                    className="w-full bg-black border border-[#262626] rounded px-3 py-1.5 text-zinc-300 focus:outline-none"
                    value={newSp}
                    onChange={e => setNewSp(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">User-Facing Buyer Guide Description</label>
                  <textarea
                    placeholder="Provide friendly, simple instructions on who this product is best suited for..."
                    className="w-full h-16 bg-black border border-[#262626] rounded p-2 text-white text-xs focus:outline-none"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                  />
                </div>

                {!newIsSolar && (
                  <div className="flex gap-4 md:col-span-2 py-1">
                    <label className="flex items-center gap-2 text-[10px] text-zinc-300 font-bold uppercase cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPromo}
                        className="accent-[#F5C518]"
                        onChange={e => setNewPromo(e.target.checked)}
                      />
                      <span>Apply SPECIAL PROMO tag</span>
                    </label>
                    <label className="flex items-center gap-2 text-[10px] text-zinc-300 font-bold uppercase cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newNewp}
                        className="accent-[#F5C518]"
                        onChange={e => setNewNewp(e.target.checked)}
                      />
                      <span>Apply NEW ARRIVAL badge</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded text-[10px] font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateProduct}
                  className="px-4 py-1.5 bg-[#F5C518] hover:bg-amber-500 text-black rounded text-[10px] font-extrabold uppercase"
                >
                  Save to Inventory
                </button>
              </div>
            </div>
          )}

          {/* DYNAMIC FORM: DIRECT BULK UPLOAD PANEL */}
          {showUploadPanel && (
            <div className="bg-[#141414] border border-emerald-500/20 p-4 rounded-xl space-y-3 text-left">
              <div className="border-b border-zinc-805 pb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Raw Direct Data Sync</span>
                <p className="text-[9px] text-zinc-500 leading-normal uppercase font-bold mt-0.5">
                  Paste catalogue outputs in JSON format or copy tables standard separated by tabs / commas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">Target Database</label>
                  <select
                    className="w-full bg-black border border-[#262626] rounded px-3 py-1.5 text-white text-xs"
                    value={bulkUploadType}
                    onChange={e => setBulkUploadType(e.target.value as any)}
                  >
                    <option value="standard">Standard Products (Showrooms)</option>
                    <option value="solar">Solar Systems</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">Import Action</label>
                  <select
                    className="w-full bg-black border border-[#262626] rounded px-3 py-1.5 text-white text-xs"
                    value={uploadMergeMode}
                    onChange={e => setUploadMergeMode(e.target.value as any)}
                  >
                    <option value="merge">Merge & Append (Keep existing)</option>
                    <option value="overwrite">Overwrite Database completely</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <span className="text-[8.5px] text-zinc-500 leading-normal font-mono">
                    JSON template: <code className="text-zinc-400">[{"{ \"n\": \"HP Laptop\", \"price\": \"₦400,000\" }"}]</code>
                  </span>
                  <span className="text-[8.5px] text-zinc-500 leading-normal font-mono block">
                    CSV defaults: <code className="text-zinc-400">PN, Name, Category, Specs, Price, Desc</code>
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1 font-bold">Paste Raw text array</label>
                <textarea
                  className="w-full h-24 bg-black border border-zinc-800 rounded p-2 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                  placeholder='[{"pn": "HP-300", "n": "HP EliteBook 300", "price": "₦650,000", "cat": "laptops", "sp": "8GB RAM · 256GB SSD"}]'
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadPanel(false)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded text-[10px] font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkUpload}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase"
                >
                  Parse & Synchronize
                </button>
              </div>
            </div>
          )}

          {/* DYNAMIC CATALOGUE LIST AND SEARCH FILTER TOOLS */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Type Switcher */}
              <div className="bg-[#141414] border border-[#262626] p-0.5 rounded-lg flex text-[10px] font-bold uppercase overflow-hidden shrink-0">
                <button
                  onClick={() => { setInvMode('standard'); setInvCatFilter('all'); }}
                  className={`px-3 py-1.5 rounded-md transition ${invMode === 'standard' ? 'bg-[#F5C518] text-black font-extrabold' : 'text-zinc-400 hover:text-white'}`}
                >
                  Standard Products
                </button>
                <button
                  onClick={() => { setInvMode('solar'); setInvCatFilter('all'); }}
                  className={`px-3 py-1.5 rounded-md transition ${invMode === 'solar' ? 'bg-[#F5C518] text-black font-extrabold' : 'text-zinc-400 hover:text-white'}`}
                >
                  Solar Systems
                </button>
              </div>

              {/* Multi search input */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder={`Search active inventory catalog...`}
                  className="w-full pl-8 pr-3 py-2 bg-[#141414] border border-[#262626] text-xs text-white rounded-lg focus:outline-none focus:border-[#F5C518]"
                  value={invSearch}
                  onChange={e => setInvSearch(e.target.value)}
                />
              </div>

              {/* Category Filter dropdown */}
              <select
                className="bg-[#141414] border border-[#262626] text-xs text-zinc-350 p-2 rounded-lg focus:outline-none cursor-pointer"
                value={invCatFilter}
                onChange={e => setInvCatFilter(e.target.value)}
              >
                <option value="all">Categories: Show All</option>
                {invMode === 'standard' ? (
                  CATS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                ) : (
                  <>
                    <option value="Inverters">Inverters</option>
                    <option value="Lithium Batteries">Lithium Batteries</option>
                    <option value="Tubular Battery">Tubular Battery</option>
                    <option value="Solar Panels">Solar Panels</option>
                    <option value="Controllers">Controllers</option>
                    <option value="Cables">Cables</option>
                    <option value="All-in-One">All-in-One</option>
                  </>
                )}
              </select>
            </div>

            {/* CATALOG LIST ENGINE */}
            <div className="max-h-[380px] overflow-y-auto space-y-2 border border-[#262626] p-2 rounded-xl bg-[#0a0a0a]">
              {invMode === 'standard' ? (
                (() => {
                  const filtered = products.filter(p => {
                    const matchText = (p.n + ' ' + p.pn + ' ' + p.sp + ' ' + (p.desc || '')).toLowerCase();
                    const words = invSearch.toLowerCase().split(/\s+/).filter(Boolean);
                    const matchSearch = words.every(word => matchText.includes(word));
                    const matchCat = invCatFilter === 'all' || p.cat === invCatFilter;
                    return matchSearch && matchCat;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-8 text-center text-xs text-zinc-500">
                        No standard products found matching criteria.
                      </div>
                    );
                  }

                  return filtered.map(prod => {
                    const isEditingThis = editingFullProdId === prod.id;
                    return (
                      <div
                        key={prod.id}
                        className={`p-3 bg-[#141414] border ${isEditingThis ? 'border-[#F5C518]/50 ring-1 ring-[#F5C518]/20' : 'border-[#262626]'} rounded-xl text-xs space-y-2.5 transition`}
                      >
                        {isEditingThis ? (
                          // Full product edit form inline
                          <div className="space-y-2.5 text-left">
                            <span className="text-[9px] text-[#F5C518] font-bold uppercase font-mono block">Editing: ID {prod.id}</span>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="text-[8.5px] text-zinc-400 uppercase font-bold block mb-0.5">Product Title</label>
                                <input
                                  type="text"
                                  className="w-full bg-black border border-zinc-700 text-white p-1.5 rounded text-[11px] focus:outline-none focus:border-[#F5C518]"
                                  value={editingProdForm.n || ''}
                                  onChange={e => setEditingProdForm({ ...editingProdForm, n: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="text-[8.5px] text-zinc-400 uppercase font-bold block mb-0.5">Product Code (PN)</label>
                                <input
                                  type="text"
                                  className="w-full bg-black border border-zinc-700 text-white p-1.5 rounded text-[11px] focus:outline-none focus:border-[#F5C518]"
                                  value={editingProdForm.pn || ''}
                                  onChange={e => setEditingProdForm({ ...editingProdForm, pn: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="text-[8.5px] text-zinc-400 uppercase font-bold block mb-0.5">Price</label>
                                <input
                                  type="text"
                                  className="w-full bg-black border border-zinc-700 text-[#F5C518] font-mono p-1.5 rounded text-[11px] focus:outline-none focus:border-[#F5C518]"
                                  value={editingProdForm.price || ''}
                                  onChange={e => setEditingProdForm({ ...editingProdForm, price: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="text-[8.5px] text-zinc-400 uppercase font-bold block mb-0.5">Category</label>
                                <select
                                  className="w-full bg-black border border-zinc-700 text-white p-1.5 rounded text-[11px] focus:outline-none"
                                  value={editingProdForm.cat || ''}
                                  onChange={e => setEditingProdForm({ ...editingProdForm, cat: e.target.value })}
                                >
                                  {CATS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-[8.5px] text-zinc-400 uppercase font-bold block mb-0.5">Specifications</label>
                                <input
                                  type="text"
                                  className="w-full bg-black border border-zinc-700 text-zinc-100 p-1.5 rounded text-[11px] focus:outline-none focus:border-[#F5C518]"
                                  value={editingProdForm.sp || ''}
                                  onChange={e => setEditingProdForm({ ...editingProdForm, sp: e.target.value })}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-[8.5px] text-zinc-400 uppercase font-bold block mb-0.5">Suitability buyer description guidance</label>
                                <textarea
                                  className="w-full h-12 bg-black border border-zinc-700 text-white p-1.5 rounded text-[11px] focus:outline-none focus:border-[#F5C518]"
                                  value={editingProdForm.desc || ''}
                                  onChange={e => setEditingProdForm({ ...editingProdForm, desc: e.target.value })}
                                />
                              </div>
                              
                              <div className="flex gap-4 md:col-span-2 items-center py-1">
                                <label className="flex items-center gap-1.5 text-[9.5px] font-bold text-zinc-300 uppercase cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="accent-[#F5C518]"
                                    checked={!!editingProdForm.promo}
                                    onChange={e => setEditingProdForm({ ...editingProdForm, promo: e.target.checked })}
                                  />
                                  <span>SPECIAL PROMO Tag</span>
                                </label>
                                <label className="flex items-center gap-1.5 text-[9.5px] font-bold text-zinc-300 uppercase cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="accent-[#F5C518]"
                                    checked={!!editingProdForm.newp}
                                    onChange={e => setEditingProdForm({ ...editingProdForm, newp: e.target.checked })}
                                  />
                                  <span>NEW DEALS Tag</span>
                                </label>
                              </div>
                            </div>

                            <div className="flex justify-end gap-1.5 pt-1.5 border-t border-zinc-800">
                              <button
                                onClick={() => setEditingFullProdId(null)}
                                className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-305 rounded text-[10px] font-bold uppercase hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveFullProduct(prod.id)}
                                className="px-3 py-1 bg-[#F5C518] hover:bg-amber-500 text-black rounded text-[10px] font-extrabold uppercase"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Normal listing view
                          <div className="flex flex-col gap-1 text-left">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-zinc-100 text-[12px] leading-snug">{prod.n}</span>
                                  {prod.pn && prod.pn !== '—' && (
                                    <span className="text-[8px] bg-zinc-800 text-zinc-450 px-1 py-0.5 rounded font-mono font-bold uppercase">{prod.pn}</span>
                                  )}
                                  {prod.promo && (
                                    <span className="text-[7.5px] bg-red-950/40 text-red-400 border border-red-900/40 px-1 py-0.5 rounded font-bold uppercase text-center shrink-0">PROMO</span>
                                  )}
                                  {prod.newp && (
                                    <span className="text-[7.5px] bg-[#F5C518]/10 text-[#F5C518] border border-[#F5C518]/25 px-1 py-0.5 rounded font-bold uppercase text-center shrink-0">NEW!</span>
                                  )}
                                </div>
                                <span className="text-[9px] text-zinc-500 font-mono uppercase font-bold block mt-0.5 select-none">Category: {prod.cat}</span>
                                <p className="text-[10px] text-zinc-350 leading-relaxed mt-1 font-sans">{prod.sp}</p>
                                {prod.desc && (
                                  <p className="text-[9.5px] text-zinc-505 leading-normal mt-1 italic">"{prod.desc}"</p>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0 align-top">
                                <span className="font-mono text-[#F5C518] text-xs font-bold leading-none">{prod.price}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingFullProdId(prod.id);
                                      setEditingProdForm(prod);
                                    }}
                                    title="Edit Product"
                                    className="p-1 text-zinc-400 hover:text-[#F5C518] bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded transition"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    title="Delete Product"
                                    className="p-1 text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              ) : (
                // Solar Systems inventory
                (() => {
                  const filtered = solarProducts.filter(s => {
                    const matchText = (s.n + ' ' + (s.brand || '') + ' ' + s.sp + ' ' + (s.desc || '')).toLowerCase();
                    const words = invSearch.toLowerCase().split(/\s+/).filter(Boolean);
                    const matchSearch = words.every(word => matchText.includes(word));
                    const matchCat = invCatFilter === 'all' || s.cat === invCatFilter;
                    return matchSearch && matchCat;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-8 text-center text-xs text-zinc-500">
                        No solar products found matching criteria.
                      </div>
                    );
                  }

                  return filtered.map(solar => {
                    const isEditingThis = editingFullSolarId === solar.id;
                    return (
                      <div
                        key={solar.id}
                        className={`p-3 bg-[#141414] border ${isEditingThis ? 'border-[#F5C518]/50 ring-1 ring-[#F5C518]/20' : 'border-[#262626]'} rounded-xl text-xs space-y-2.5 transition`}
                      >
                        {isEditingThis ? (
                          // Full Solar edit form inline
                          <div className="space-y-2.5 text-left">
                            <span className="text-[9px] text-[#F5C518] font-bold uppercase font-mono block">Editing: ID {solar.id}</span>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="text-[8.5px] text-zinc-400 uppercase font-bold block mb-0.5">Product Title</label>
                                <input
                                  type="text"
                                  className="w-full bg-black border border-zinc-700 text-white p-1.5 rounded text-[11px] focus:outline-none focus:border-[#F5C518]"
                                  value={editingSolarForm.n || ''}
                                  onChange={e => setEditingSolarForm({ ...editingSolarForm, n: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="text-[8.5px] text-zinc-400 uppercase font-bold block mb-0.5">Brand Name</label>
                                <input
                                  type="text"
                                  className="w-full bg-black border border-zinc-700 text-white p-1.5 rounded text-[11px] focus:outline-none focus:border-[#F5C518]"
                                  value={editingSolarForm.brand || ''}
                                  onChange={e => setEditingSolarForm({ ...editingSolarForm, brand: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="text-[8.5px] text-zinc-400 uppercase font-bold block mb-0.5">Price</label>
                                <input
                                  type="text"
                                  className="w-full bg-black border border-zinc-700 text-[#F5C518] font-mono p-1.5 rounded text-[11px] focus:outline-none focus:border-[#F5C518]"
                                  value={editingSolarForm.price || ''}
                                  onChange={e => setEditingSolarForm({ ...editingSolarForm, price: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="text-[8.5px] text-zinc-400 uppercase font-bold block mb-0.5">Solar Category</label>
                                <select
                                  className="w-full bg-black border border-zinc-700 text-white p-1.5 rounded text-[11px] focus:outline-none"
                                  value={editingSolarForm.cat || ''}
                                  onChange={e => setEditingSolarForm({ ...editingSolarForm, cat: e.target.value as any })}
                                >
                                  <option value="Inverters">Inverters</option>
                                  <option value="Lithium Batteries">Lithium Batteries</option>
                                  <option value="Tubular Battery">Tubular Battery</option>
                                  <option value="Solar Panels">Solar Panels</option>
                                  <option value="Controllers">Controllers</option>
                                  <option value="Cables">Cables</option>
                                  <option value="All-in-One">All-in-One</option>
                                </select>
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-[8.5px] text-zinc-400 uppercase font-bold block mb-0.5">Specifications</label>
                                <input
                                  type="text"
                                  className="w-full bg-black border border-zinc-700 text-zinc-300 p-1.5 rounded text-[11px] focus:outline-none focus:border-[#F5C518]"
                                  value={editingSolarForm.sp || ''}
                                  onChange={e => setEditingSolarForm({ ...editingSolarForm, sp: e.target.value })}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-[8.5px] text-zinc-400 uppercase font-bold block mb-0.5">Suitability Buyer Guidance Description</label>
                                <textarea
                                  className="w-full h-12 bg-black border border-zinc-700 text-white p-1.5 rounded text-[11px] focus:outline-none focus:border-[#F5C518]"
                                  value={editingSolarForm.desc || ''}
                                  onChange={e => setEditingSolarForm({ ...editingSolarForm, desc: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-1.5 pt-1.5 border-t border-zinc-800">
                              <button
                                onClick={() => setEditingFullSolarId(null)}
                                className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-305 rounded text-[10px] font-bold uppercase hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveFullSolar(solar.id)}
                                className="px-3 py-1 bg-[#F5C518] hover:bg-amber-500 text-black rounded text-[10px] font-extrabold uppercase"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Normal Solar listing
                          <div className="flex flex-col gap-1 text-left">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-zinc-100 text-[12px] leading-snug">{solar.n}</span>
                                  {solar.brand && (
                                    <span className="text-[8px] bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded font-bold uppercase tracking-wider text-center shrink-0">{solar.brand}</span>
                                  )}
                                </div>
                                <span className="text-[9px] text-zinc-500 font-mono uppercase font-bold block mt-0.5 select-none">Solar Category: {solar.cat}</span>
                                <p className="text-[10px] text-zinc-350 leading-relaxed mt-1 font-sans">{solar.sp}</p>
                                {solar.desc && (
                                  <p className="text-[9.5px] text-zinc-505 leading-normal mt-1 italic">"{solar.desc}"</p>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0 align-top">
                                <span className="font-mono text-[#F5C518] text-xs font-bold leading-none">{solar.price}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingFullSolarId(solar.id);
                                      setEditingSolarForm(solar);
                                    }}
                                    title="Edit Product"
                                    className="p-1 text-zinc-400 hover:text-[#F5C518] bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded transition"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSolarProduct(solar.id)}
                                    title="Delete Product"
                                    className="p-1 text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: REPAIRS ASSISTANT & PROGRESS */}
      {activeTab === 'repairs' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-200 uppercase">Repair Desk Queue</h3>
          <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto">
            {repairs.length === 0 ? (
              <div className="p-4 bg-[#141414] border border-zinc-800 rounded text-center text-xs text-zinc-500">
                No active repair submissions in queue
              </div>
            ) : (
              repairs.map(rep => (
                <div key={rep.id} className="p-3 bg-[#141414] border border-[#262626] rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                        {rep.ref || "Awaiting Ref"}
                      </span>
                      <h4 className="text-xs font-bold text-zinc-200 mt-1">{rep.brand} ({rep.type})</h4>
                      <p className="text-[10px] text-zinc-500">Owner: {rep.name} · {rep.phone}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#F5C518] uppercase bg-[#F5C518]/10 px-1.5 py-0.5 rounded">
                      {rep.status}
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-400 italic">"Problem: {rep.problem}"</p>

                  {/* Gemini AI triage suggestion if any */}
                  {rep.aiTriage && (
                    <div className="p-2 bg-zinc-950 border border-zinc-800/80 rounded mt-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Cpu className="w-3 h-3 text-[#F5C518]" />
                        <span className="text-[9px] uppercase tracking-wider text-[#F5C518] font-bold">Gemini AI Triage Report</span>
                        <span className={`text-[8px] px-1 rounded font-bold uppercase ${
                          rep.aiTriage.complexity === 'High' ? 'bg-red-500/10 text-red-500' : rep.aiTriage.complexity === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {rep.aiTriage.complexity} Complexity
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-300 font-bold block">Fault: {rep.aiTriage.category}</p>
                      <p className="text-[9px] text-zinc-400 leading-normal">{rep.aiTriage.explanation}</p>
                    </div>
                  )}

                  {/* Action row */}
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-850">
                    {!rep.ref && (
                      <div className="flex gap-1 items-center w-full mb-1">
                        <input
                          type="text"
                          placeholder="e.g. HT-2026-004"
                          className="bg-[#0a0a0a] border border-zinc-700 text-[10px] p-1 rounded flex-1 text-white"
                          value={tempRef}
                          onChange={e => setTempRef(e.target.value)}
                        />
                        <button
                          onClick={() => handleAssignRef(rep.id)}
                          className="px-2 py-1 bg-zinc-800 text-[9px] rounded text-[#F5C518] border border-zinc-750"
                        >
                          Assign Ref
                        </button>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleUpdateRepairStage(rep.id, 'Diagnosed')}
                      className={`text-[9px] py-0.5 px-1.5 rounded border border-zinc-800 ${rep.status === 'Diagnosed' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
                    >
                      Diagnosed
                    </button>
                    <button
                      onClick={() => handleUpdateRepairStage(rep.id, 'In Repair')}
                      className={`text-[9px] py-0.5 px-1.5 rounded border border-zinc-800 ${rep.status === 'In Repair' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
                    >
                      In Repair
                    </button>
                    <button
                      onClick={() => handleUpdateRepairStage(rep.id, 'Ready for Pickup')}
                      className={`text-[9px] py-0.5 px-1.5 rounded border border-zinc-800 bg-[#F5C518]/20 ${rep.status === 'Ready for Pickup' ? 'border-[#F5C518]/50 text-white font-bold' : 'text-zinc-400'}`}
                    >
                      Ready for PickUp
                    </button>

                    {/* WhatsApp Notifier Link */}
                    <a
                      href={getWhatsAppUrl(
                        rep.phone, 
                        `Hello ${rep.name}, this is HiTech Distributors regarding your repair request (${rep.brand} ${rep.type}).\n\n` +
                        `Status update: *${rep.status.toUpperCase()}*\n` +
                        `Tracking Ref: *${rep.ref || 'Awaiting reference assignment'}*\n\n` +
                        `You can track live details on our portal here: ${window.location.origin}?track=${rep.ref || rep.id}\n\n` +
                        `Please let us know if you have any questions!`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[9px] bg-emerald-600/10 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/25 py-0.5 px-2 rounded font-bold uppercase transition"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-500" />
                      <span>Ping Client</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: GM GENERAL MANAGER MATTERS */}
      {activeTab === 'gmq' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-200 uppercase">GM Major Matters Queue</h3>
          <p className="text-[9px] text-zinc-500 leading-normal uppercase">
            Queues for General Manager overview. Does not link immediately to WhatsApp - staff action required.
          </p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {gmq.length === 0 ? (
              <div className="p-4 bg-[#141414] border border-zinc-800 rounded text-center text-xs text-zinc-500">
                General Manager Request Queue empty
              </div>
            ) : (
              gmq.map(req => (
                <div key={req.id} className="p-3 bg-[#141414] border border-[#262626] rounded-xl flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                      {req.type}
                    </span>
                    <p className="text-xs text-zinc-200 font-bold mt-2 font-serif">"{req.msg}"</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Sender: {req.name} · {req.phone} · Preferred contact: {req.preferredTime}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end gap-1.5 shrink-0">
                    {req.status === 'pending' ? (
                      <>
                        <a
                          href={getWhatsAppUrl(
                            req.phone,
                            `Hello ${req.name}, this is HiTech Distributors following up on your General Manager request concerning "${req.type}".\n\n` +
                            `Regarding your message:\n"${req.msg}"\n\n` +
                            `We would like to coordinate and resolve your query immediately. Please let us know if now is a good time to chat.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[9.5px] bg-emerald-600/10 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/25 py-1 px-2 rounded font-bold uppercase transition"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-500" />
                          <span>WhatsApp</span>
                        </a>
                        <button
                          onClick={() => handleMarkGmqAddressed(req.id)}
                          className="p-1 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded text-[10px] uppercase font-extrabold transition"
                        >
                          Address
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-zinc-500 line-through bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded font-bold uppercase">Addressed</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: PUBLISH DEALS */}
      {activeTab === 'deals' && (
        <div className="space-y-3 bg-[#141414] border border-[#262626] p-4 rounded-xl">
          <h3 className="text-xs font-bold text-zinc-200 uppercase">Publish Custom Deal</h3>
          
          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1 uppercase font-bold">Deal Title</label>
              <input
                type="text"
                placeholder="e.g. HP EliteBook Corporate Pack"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                value={dealTitle}
                onChange={e => setDealTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 block mb-1 uppercase font-bold">Badge Pill</label>
              <select
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                value={dealBadge}
                onChange={e => setDealBadge(e.target.value)}
              >
                <option value="SPECIAL PROMO">SPECIAL PROMO</option>
                <option value="PROMO LAPTOP">PROMO LAPTOP</option>
                <option value="BUDGET SOLAR">BUDGET SOLAR</option>
                <option value="HOT OFFER">HOT OFFER</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 block mb-1 uppercase font-bold">Deal Brief description</label>
              <textarea
                placeholder="Details of the promotion..."
                className="w-full h-16 bg-[#0a0a0a] border border-[#262626] rounded p-3 text-xs text-white focus:outline-none"
                value={dealDesc}
                onChange={e => setDealDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1 uppercase font-bold">Original Price</label>
                <input
                  type="text"
                  placeholder="e.g. ₦890,000"
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                  value={dealOrigPrice}
                  onChange={e => setDealOrigPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1 uppercase font-bold">Sale Promo Price</label>
                <input
                  type="text"
                  placeholder="e.g. ₦690,000"
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                  value={dealSalePrice}
                  onChange={e => setDealSalePrice(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handlePublishDeal}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded transition-colors"
            >
              Publish Deal Live
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: EDIT PORTAL BANK ACCOUNT */}
      {activeTab === 'bank' && (
        <div className="space-y-3 bg-[#141414] border border-[#262626] p-4 rounded-xl">
          <h3 className="text-xs font-bold text-zinc-200 uppercase">Edit Portal Bank Account</h3>
          <p className="text-[9px] text-zinc-500 uppercase font-bold block leading-relaxed mb-3">
            Changes are immediately reflected in printable invoice payment vouchers for customers.
          </p>

          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] text-zinc-400 block uppercase font-bold">Bank Name</label>
              <input
                type="text"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-xs text-white"
                value={bankInput}
                onChange={e => setBankInput(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 block uppercase font-bold">Account Number</label>
              <input
                type="text"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-xs text-white"
                value={numInput}
                onChange={e => setNumInput(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 block uppercase font-bold">Account Name</label>
              <input
                type="text"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-xs text-white"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
              />
            </div>
            <button
              onClick={handleSaveBank}
              className="w-full py-2 bg-[#F5C518] hover:bg-amber-500 text-[#0a0a0a] text-xs font-bold uppercase rounded-lg transition-colors"
            >
              Update Bank Account Settings
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: GOOGLE SHEETS LIVE SYNC ENGINE */}
      {activeTab === 'sheets' && (
        <div className="space-y-4 font-sans">
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-[#262626] pb-3 justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500 animate-pulse" />
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Google Sheets Integration</h3>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold text-left">Live back-office ERP & sales syncing</p>
                </div>
              </div>
              
              {/* Connection Status Icon */}
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sheetsUser ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${sheetsUser ? 'bg-emerald-550' : 'bg-red-500'}`}></span>
                </span>
                <span className="text-[9px] font-mono font-bold uppercase text-zinc-400">
                  {sheetsUser ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* ERROR AND SUCCESS NOTIFICATIONS */}
            {statusMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
                <span className="shrink-0">✓</span>
                <p className="text-left leading-normal">{statusMessage}</p>
              </div>
            )}
            {statusError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs flex items-center gap-2">
                <span className="shrink-0">⚠</span>
                <p className="text-left leading-normal">{statusError}</p>
              </div>
            )}

            {/* SECTION 1: GOOGLE AUTHENTICATION STATE */}
            {sheetsLoading ? (
              <div className="flex items-center justify-center p-6 space-x-2 text-zinc-400">
                <RefreshCw className="animate-spin w-4 h-4 text-[#F5C518]" />
                <span className="text-xs font-mono">Verifying OAuth Core Client...</span>
              </div>
            ) : !sheetsUser ? (
              <div className="space-y-2 p-1.5">
                <p className="text-xs text-zinc-400 leading-relaxed text-left">
                  Authorize your Google Account to automatically sync invoice logs, active repair status queues, and showroom lists directly on Google Sheets.
                </p>
                <button
                  onClick={handleSheetsSignIn}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[#f5f5f5] text-xs font-bold uppercase transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  Connect Google Account
                </button>
              </div>
            ) : (
              <div className="bg-[#0a0a0a] border border-[#262626] p-3 rounded-lg flex items-center justify-between text-xs gap-3">
                <div className="text-left truncate">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider leading-none mb-1">Authenticated Account</p>
                  <p className="font-bold text-zinc-200 truncate">{sheetsUser.displayName || 'Google Operator'}</p>
                  <p className="text-[10px] text-zinc-400 font-mono truncate">{sheetsUser.email}</p>
                </div>
                <button
                  onClick={handleSheetsSignOut}
                  className="px-2.5 py-1.5 bg-red-950/45 text-red-400 border border-red-900/35 hover:bg-red-900/30 rounded text-[10px] font-bold uppercase shrink-0 transition"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: SPREADSHEET SETUP */}
          {sheetsUser && (
            <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3 text-left">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Active Workspace Link</h4>
              
              {spreadsheetId ? (
                <div className="space-y-3">
                  <div className="bg-[#0a0a0a] border border-[#262626] p-3 rounded-lg space-y-1">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Connected Sheet ID</p>
                    <p className="font-mono text-[10px] text-zinc-300 select-all break-all leading-normal">{spreadsheetId}</p>
                    
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10.5px] text-[#F5C518] font-bold uppercase pt-2 hover:underline tracking-wider"
                    >
                      <span>Open Workspace Sheet ↗</span>
                    </a>
                  </div>

                  <div className="pt-2 border-t border-zinc-850 flex flex-col gap-2">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Unlink / Switch Spreadsheet ID:</p>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Paste Spreadsheet ID"
                        className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                        value={typedSpreadsheetId}
                        onChange={e => setTypedSpreadsheetId(e.target.value)}
                      />
                      <button
                        onClick={handleLinkExistingSheet}
                        className="px-3 bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold uppercase rounded transition"
                      >
                        Link
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <p className="text-xs text-zinc-400 leading-normal">
                    Create a brand new dedicated master spreadsheet configured with auto-initialized worksheets for Stock Inventory, Invoices Log, and Repairs Desk.
                  </p>

                  <button
                    onClick={handleCreateNewSheet}
                    disabled={sheetActionLoading !== null}
                    className="w-full py-2.5 bg-[#F5C518] hover:bg-amber-500 text-[#0a0a0a] text-xs font-bold uppercase rounded-lg transition duration-255 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {sheetActionLoading === 'create' ? (
                      <>
                        <RefreshCw className="animate-spin w-4 h-4 shrink-0" />
                        Provisioning Workspace Sheet...
                      </>
                    ) : (
                      'Create New Hublet Spreadsheet'
                    )}
                  </button>

                  <div className="relative flex py-1.5 items-center">
                    <div className="flex-grow border-t border-[#262626]"></div>
                    <span className="flex-shrink mx-3 text-[10px] text-zinc-600 font-bold uppercase font-mono">OR</span>
                    <div className="flex-grow border-t border-[#262626]"></div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block">Link Existing Spreadsheet ID</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. 1uK7X_z2R..."
                        className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        value={typedSpreadsheetId}
                        onChange={e => setTypedSpreadsheetId(e.target.value)}
                      />
                      <button
                        onClick={handleLinkExistingSheet}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase rounded-lg text-zinc-300 transition"
                      >
                        Link
                      </button>
                    </div>
                    <span className="text-[8.5px] text-zinc-650 block">Ensure your logged in account has sharing permission/editor access to this ID.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: SYNC RUNTIME ACTIONS */}
          {sheetsUser && spreadsheetId && (
            <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-4 text-left">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Live Sync Operations</h4>
              
              <div className="grid grid-cols-1 gap-3.5">
                {/* Export Card */}
                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <h5 className="text-xs font-bold text-zinc-300 uppercase">Export stock to spreadsheet</h5>
                    <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 py-0.5 px-2 rounded font-mono font-bold uppercase">OUT</span>
                  </div>
                  <p className="text-[10px] text-zinc-550 leading-relaxed">
                    Uploads current active website catalog list ({products.length} Products, {solarProducts.length} Solar items) to the Google Drive sheet. Overwrites existing cell rows.
                  </p>
                  <button
                    onClick={handleExportData}
                    disabled={sheetActionLoading !== null}
                    className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded text-zinc-250 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {sheetActionLoading === 'export' ? (
                      <>
                        <RefreshCw className="animate-spin w-3.5 h-3.5 shrink-0" />
                        Exporting catalogue...
                      </>
                    ) : (
                      'Export inventory to Sheets'
                    )}
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <h5 className="text-xs font-bold text-[#F5C518] uppercase">Import stock from spreadsheet</h5>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 py-0.5 px-2 rounded font-mono font-bold uppercase">IN</span>
                  </div>
                  <p className="text-[10px] text-zinc-550 leading-relaxed">
                    Pulls edited stock details, specs, and price-sheet numbers directly from your Google Sheet. It overrides current items immediately across the entire live webpage!
                  </p>
                  <button
                    onClick={handleImportData}
                    disabled={sheetActionLoading !== null}
                    className="w-full py-1.5 bg-emerald-900/25 hover:bg-emerald-900/35 border border-emerald-800/25 rounded text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {sheetActionLoading === 'import' ? (
                      <>
                        <RefreshCw className="animate-spin w-3.5 h-3.5 shrink-0" />
                        Pulling values from Sheets...
                      </>
                    ) : (
                      'Pull Prices & Items list'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
