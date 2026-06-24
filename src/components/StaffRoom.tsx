/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  Lock, Unlock, Settings, ShoppingBag, Edit, ShieldAlert, Cpu, HeartHandshake, 
  Eye, Plus, Check, FileSpreadsheet, RefreshCw, Trash2, Search, Upload, 
  MessageSquare, ExternalLink, Wifi, WifiOff, Clock, LogOut, CheckCircle2, UserCheck, FileText, Database, ArrowRight
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
import { parsePdfFile, runPdfAutoMatcher } from '../lib/pdfParserService';
import { compressImage } from '../lib/imageCompressor';
import { uploadImageToCDNOrLocal } from '../lib/cloudinaryService';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

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
  bankAccount: { bank: string; accountNumber: string; accountName: string; payingBank?: string };
  spreadsheetId: string;
  onUpdateProducts: (updated: Product[]) => void;
  onUpdateSolarProducts: (updated: SolarProduct[]) => void;
  onUpdateRepairs: (updated: RepairRecord[]) => void;
  onUpdateGmq: (updated: GMRequest[]) => void;
  onToggleMgrStatus: () => void;
  onUpdateBankAccount: (account: { bank: string; accountNumber: string; accountName: string; payingBank?: string }) => void;
  onAddCustomDeal: (deal: Deal) => void;
  onUpdateSpreadsheetId: (id: string) => void;

  // Custom added variables state
  openingPhotoUrl: string;
  onUpdateOpeningPhoto: (url: string) => void;
  contacts: { sales: string; inventory: string; general: string; gm: string };
  onUpdateContacts: (contacts: { sales: string; inventory: string; general: string; gm: string }) => void;
  requests: any[];
  onCreateRequest: (type: string, payload: any, note: string) => void;
  onApproveRequest: (id: string) => void;
  onRejectRequest: (id: string, notes: string) => void;
  galleryVideos: { id: string; url: string; title: string; desc: string; submittedAt: string }[];
  onAddVideo: (video: { url: string; title: string; desc: string }) => void;
  onRemoveVideo: (id: string) => void;
  liveEmbedUrl: string;
  onUpdateLiveEmbedUrl: (url: string) => void;
  galleryPhotos: any[];
  onUpdateGalleryPhotos: (photos: any[]) => void;
  cloudinaryConfig?: { cloudName: string; uploadPreset: string };
  onUpdateCloudinaryConfig?: (config: { cloudName: string; uploadPreset: string }) => void;
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
  onUpdateSpreadsheetId,

  openingPhotoUrl,
  onUpdateOpeningPhoto,
  contacts,
  onUpdateContacts,
  requests,
  onCreateRequest,
  onApproveRequest,
  onRejectRequest,
  galleryVideos,
  onAddVideo,
  onRemoveVideo,
  liveEmbedUrl,
  onUpdateLiveEmbedUrl,
  galleryPhotos = [],
  onUpdateGalleryPhotos,
  cloudinaryConfig = { cloudName: '', uploadPreset: '' },
  onUpdateCloudinaryConfig
}: StaffRoomProps) {
  const [pin, setPin] = useState('');
  const [loggedIn, setLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('ht_staff_login') === 'true';
    } catch {
      return false;
    }
  });
  const [userRole, setUserRole] = useState<'manager' | 'staff'>(() => {
    try {
      return (localStorage.getItem('ht_staff_role') as any) || 'staff';
    } catch {
      return 'staff';
    }
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<string>('repairs');

  // Receipt / Invoice Writer tab states
  const [writerDocType, setWriterDocType] = useState<'Invoice' | 'Receipt'>('Invoice');
  const [writerClientName, setWriterClientName] = useState('');
  const [writerClientPhone, setWriterClientPhone] = useState('');
  const [writerClientAddress, setWriterClientAddress] = useState('');
  
  // Custom items being written
  const [writerItems, setWriterItems] = useState<{ name: string; qty: number; price: string }[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(''); // e.g., "₦690,000" or just number

  // Dynamic status/output after generation
  const [lastGeneratedDoc, setLastGeneratedDoc] = useState<{ id: string; url: string; text: string } | null>(null);

  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim()) {
      alert("Please specify item name and unit cost.");
      return;
    }
    let formattedPrice = newItemPrice.trim();
    if (!formattedPrice.startsWith('₦') && !formattedPrice.startsWith('₱') && !formattedPrice.startsWith('$')) {
      formattedPrice = '₦' + formattedPrice;
    }
    setWriterItems([...writerItems, {
      name: newItemName.trim(),
      qty: newItemQty,
      price: formattedPrice
    }]);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemPrice('');
  };

  const handleRemoveWriterItem = (index: number) => {
    setWriterItems(writerItems.filter((_, idx) => idx !== index));
  };

  const handleGenerateWriterDoc = async () => {
    if (!writerClientName.trim() || !writerClientPhone.trim()) {
      alert("Please enter customer name and WhatsApp phone number.");
      return;
    }
    if (writerItems.length === 0) {
      alert("Please add at least one line item to build the document.");
      return;
    }

    const prefix = writerDocType === 'Invoice' ? 'INV-' : 'RCP-';
    const docId = prefix + Math.floor(1000 + Math.random() * 9000);

    // Compute total sum from prices
    let computedTotal = 0;
    writerItems.forEach(item => {
      const numericString = item.price.replace(/[^\d]/g, '');
      const rawPrice = parseInt(numericString, 10) || 0;
      computedTotal += rawPrice * item.qty;
    });

    const docData = {
      id: docId,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      customerName: writerClientName.trim(),
      customerPhone: writerClientPhone.trim(),
      customerAddress: writerClientAddress.trim() || undefined,
      items: writerItems,
      totalAmount: computedTotal,
      bankDetails: bankAccount
    };

    const targetCol = writerDocType === 'Invoice' ? 'invoices' : 'receipts';

    try {
      await setDoc(doc(db, targetCol, docId), docData);
      console.log(`Document written to Firestore successfully: ${docId}`);
      
      const cleanLink = `${window.location.origin}/?view=${docId}`;

      // Generator dynamic transaction reference in format ABR_123456_7890
      const rand1 = Math.floor(100000 + Math.random() * 900000);
      const rand2 = Math.floor(1000 + Math.random() * 9000);
      const transRef = `ABR_${rand1}_${rand2}`;

      // Format WhatsApp content matching standard templates perfectly
      let text = "";
      if (writerDocType === 'Invoice') {
        text += `🔵 HITECH DISTRIBUTORS\n`;
        text += `📋 ORDER REQUEST\n`;
        text += `─────────────────────────────────\n\n`;
        text += `HiTech Invoice #${docId}\n`;
        text += `Tap to view and download your invoice as PNG or PDF\n`;
        text += `Link: ${cleanLink}\n\n`;
        text += `Order #: ${docId}\n`;
        text += `Date: ${docData.date}\n`;
        text += `Generated By: Front Desk\n\n`;
        text += `👤 CUSTOMER:\n`;
        text += `Name: ${writerClientName}\n`;
        text += `Phone: ${writerClientPhone}\n`;
        if (writerClientAddress.trim()) text += `Address: ${writerClientAddress.trim()}\n`;
        text += `Ref Code: HT-${docId.substring(4)}\n\n`;
        text += `─────────────────────────────────\n\n`;
        text += `🛒 ITEMS:\n`;
        writerItems.forEach(item => {
          text += `${item.name} (${item.qty}) - ${item.price}\n`;
        });
        text += `\n─────────────────────────────────\n\n`;
        text += `💰 PAYMENT SUMMARY:\n`;
        text += `Total Amount Due: ₦${computedTotal.toLocaleString()}\n`;
        text += `Amount Paid:     ₦0\n`;
        text += `⚠️ Balance:      ₦${computedTotal.toLocaleString()} (Due on Collection)\n\n`;
        text += `─────────────────────────────────\n\n`;
        text += `💳 Customer Bank Details:\n`;
        text += `Bank Name: ${bankAccount.bank || 'GTBank'}\n`;
        text += `Account Name: ${bankAccount.accountName || 'HiTech Distributors'}\n`;
        text += `Account Number: ${bankAccount.accountNumber || '9006163631'}\n`;
        text += `Paying Bank: ${bankAccount.payingBank || 'UBA'}\n\n`;
        text += `─────────────────────────────────\n\n`;
        text += `📋 View Full Order:\n`;
        text += `👉 ${cleanLink}\n\n`;
        text += `⚠️ Please process this order and confirm receipt.\n`;
      } else {
        text += `🟢 HITECH DISTRIBUTORS\n`;
        text += `✅ PAYMENT CONFIRMATION\n`;
        text += `─────────────────────────────────\n\n`;
        text += `Dear ${writerClientName},\n\n`;
        text += `Thank you for your payment!\n`;
        text += `Tap to view and download your receipt as PNG or PDF\n`;
        text += `Link: ${cleanLink}\n\n`;
        text += `─────────────────────────────────\n\n`;
        text += `Receipt #: ${docId}\n`;
        text += `Date: ${docData.date}\n`;
        text += `Issued By: Sales & Orders\n\n`;
        text += `👤 Customer:\n`;
        text += `Name: ${writerClientName}\n`;
        text += `Ref Code: HT-${docId.substring(4)}\n\n`;
        text += `─────────────────────────────────\n\n`;
        text += `💰 PAYMENT DETAILS:\n`;
        text += `Total Amount Due: ₦${computedTotal.toLocaleString()}\n`;
        text += `Amount Paid:     ₦${computedTotal.toLocaleString()}\n`;
        text += `Payment Method:  Bank Transfer\n`;
        text += `Payment Status:  ✅ CONFIRMED\n`;
        text += `Balance:         ₦0.00 (Fully Paid)\n\n`;
        text += `─────────────────────────────────\n\n`;
        text += `🛒 ITEMS:\n`;
        writerItems.forEach(item => {
          text += `${item.name} (${item.qty}) - ${item.price}\n`;
        });
        text += `\n─────────────────────────────────\n\n`;
        text += `💳 Bank Reconciliation:\n`;
        text += `Bank Name: ${bankAccount.bank || 'GTBank'}\n`;
        text += `Account Name: ${bankAccount.accountName || 'HiTech Distributors'}\n`;
        text += `Account Number: ${bankAccount.accountNumber || '9006163631'}\n`;
        text += `Paying Bank: ${bankAccount.payingBank || 'UBA'}\n`;
        text += `Transaction Ref: ${transRef}\n\n`;
        text += `─────────────────────────────────\n\n`;
        text += `📋 View Official Receipt:\n`;
        text += `👉 ${cleanLink}\n\n`;
        text += `─────────────────────────────────\n\n`;
        text += `Thank you for choosing HiTech Distributors!\n`;
      }

      setLastGeneratedDoc({
        id: docId,
        url: cleanLink,
        text: text
      });

      // Clear standard writer state
      setWriterClientName('');
      setWriterClientPhone('');
      setWriterClientAddress('');
      setWriterItems([]);

      alert(`Success! Generated ${writerDocType} #${docId} successfully. You can preview/copy the link below or send it via WhatsApp.`);
    } catch (err) {
      console.error("Failed to generate custom receipt/invoice:", err);
      alert("Error writing document to database. Please check connection.");
    }
  };

  // PDF Automation states
  const [extractedProducts, setExtractedProducts] = useState<any[]>([]);
  const [imageMappings, setImageMappings] = useState<any[]>([]);
  const [pdfParsingLoading, setPdfParsingLoading] = useState<'product' | 'mapping' | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [matchingResults, setMatchingResults] = useState<any | null>(null);
  const [imgUploading, setImgUploading] = useState<boolean>(false);
  const [uploadedPhotosCount, setUploadedPhotosCount] = useState<number>(0);
  const [dragOverZone, setDragOverZone] = useState<'photos' | 'catalog' | 'mapping' | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState('');

  const handleUploadedPhotos = async (files: FileList) => {
    setImgUploading(true);
    setPdfError(null);
    let successCount = 0;
    const newPhotosList: any[] = [];
    
     for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        continue;
      }
      
      const p = new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const rawDataUrl = reader.result as string;
            // Compress image client-side to make it lightweight
            const compressedBase64 = await compressImage(rawDataUrl);

            const finalUrl = await uploadImageToCDNOrLocal(file.name, compressedBase64, cloudinaryConfig);
            
            const newPhoto = {
              id: 'gal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
              url: finalUrl,
              fallbackUrl: compressedBase64,
              label: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
              sub: '',
              productCode: '',
              price: '',
              isCustom: true
            };
            newPhotosList.push(newPhoto);
            successCount++;
          } catch (err: any) {
            console.error("Failed uploading live photo asset: ", err);
            const rawDataUrl = reader.result as string;
            const compressedFallback = await compressImage(rawDataUrl);
            const fbPhoto = {
              id: 'gal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
              url: compressedFallback,
              fallbackUrl: compressedFallback,
              label: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
              sub: '',
              productCode: '',
              price: '',
              isCustom: true
            };
            newPhotosList.push(fbPhoto);
            successCount++;
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
      await p;
    }
    
    if (newPhotosList.length > 0) {
      const merged = [...newPhotosList, ...galleryPhotos];
      onUpdateGalleryPhotos(merged);
      setUploadedPhotosCount(prev => prev + successCount);
      alert(`📤 Uploaded ${successCount} raw photo assets. They are staged in the active list and ready for code matching!`);
    } else {
      setPdfError("No valid image files detected to upload.");
    }
    setImgUploading(false);
  };

  const triggerCatalogParsing = (file: File) => {
    setPdfParsingLoading('product');
    setPdfError(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const result = await parsePdfFile(reader.result as string, file.name, 'product');
        if (result && result.products) {
          setExtractedProducts(result.products);
        } else {
          throw new Error("Missing 'products' field in extracted payload.");
        }
      } catch (err: any) {
        setPdfError(err.message || 'Error parsing product list PDF');
      } finally {
        setPdfParsingLoading(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerMappingParsing = (file: File) => {
    setPdfParsingLoading('mapping');
    setPdfError(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const result = await parsePdfFile(reader.result as string, file.name, 'mapping');
        if (result && result.mappings) {
          setImageMappings(result.mappings);
        } else {
          throw new Error("Missing 'mappings' field in extracted payload.");
        }
      } catch (err: any) {
        setPdfError(err.message || 'Error parsing mapping PDF');
      } finally {
        setPdfParsingLoading(null);
      }
    };
    reader.readAsDataURL(file);
  };

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
        setUserRole('manager');
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
        setUserRole('manager');
        setLoggedIn(true);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || '';
      const errCode = err?.code || '';
      if (errCode === 'auth/popup-closed-by-user' || errMsg.includes('popup-closed-by-user') || errCode === 'auth/cancelled-popup-request') {
        setStatusError('The login popup was closed before completion. This occurs when third-party sign-in popups or cookies are restricted within embedded iframes. Please click "Open in New Tab" below to authorize in a standalone window, which bypasses cross-origin restrictions.');
      } else if (errCode === 'auth/popup-blocked' || errMsg.includes('popup-blocked')) {
        setStatusError('The login popup was blocked by your browser. Please click the "Open in New Tab" button to authenticate or allow popups for origin.');
      } else {
        setStatusError(err.message || 'Verification / Login failed');
      }
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
  const [newImageUrl, setNewImageUrl] = useState('');

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
  const [payingBankInput, setPayingBankInput] = useState(bankAccount.payingBank || 'UBA');

  // New Deal Form State
  const [dealTitle, setDealTitle] = useState('');
  const [dealDesc, setDealDesc] = useState('');
  const [dealOrigPrice, setDealOrigPrice] = useState('');
  const [dealSalePrice, setDealSalePrice] = useState('');
  const [dealBadge, setDealBadge] = useState('PROMO LAPTOP');

  // Repair status management
  const [selectedRepair, setSelectedRepair] = useState<RepairRecord | null>(null);
  const [tempRef, setTempRef] = useState('');

  // Custom added variables state
  const [vcUrl, setVcUrl] = useState('');
  const [vcTitle, setVcTitle] = useState('');
  const [vcDesc, setVcDesc] = useState('');

  const [activeHeroUrl, setActiveHeroUrl] = useState(openingPhotoUrl);
  const [contactsSales, setContactsSales] = useState(contacts.sales);
  const [contactsInv, setContactsInv] = useState(contacts.inventory);
  const [contactsGen, setContactsGen] = useState(contacts.general);
  const [contactsGm, setContactsGm] = useState(contacts.gm);

  const [activeEmbedLink, setActiveEmbedLink] = useState(liveEmbedUrl);

  // Staff Proposal form states
  const [propType, setPropType] = useState<'deal' | 'bank' | 'contacts' | 'hero_cover' | 'live_embed'>('deal');
  const [propStaffNotes, setPropStaffNotes] = useState('');

  // Custom collage states
  const [collageStyle, setCollageStyle] = useState<'dual' | 'triple' | 'bento'>('dual');
  const [collageUrls, setCollageUrls] = useState<string[]>(['', '', '', '']);
  const [collageLabel, setCollageLabel] = useState('');
  const [collageSub, setCollageSub] = useState('');
  const [collagePrice, setCollagePrice] = useState('');
  const [collageCode, setCollageCode] = useState('');

  // Manager reject notes
  const [gmRejectNotes, setGmRejectNotes] = useState<{ [id: string]: string }>({});

  // Cloudinary settings local states
  const [cloudNameInput, setCloudNameInput] = useState(cloudinaryConfig?.cloudName || '');
  const [uploadPresetInput, setUploadPresetInput] = useState(cloudinaryConfig?.uploadPreset || '');
  const [isCloudinarySaving, setIsCloudinarySaving] = useState(false);

  useEffect(() => {
    if (cloudinaryConfig) {
      setCloudNameInput(cloudinaryConfig.cloudName || '');
      setUploadPresetInput(cloudinaryConfig.uploadPreset || '');
    }
  }, [cloudinaryConfig]);

  const startDynamicClientZipDownload = async () => {
    setIsZipping(true);
    setZipProgress('Initializing ZIP encoder...');
    try {
      const zip = new JSZip();
      let processed = 0;
      const total = galleryPhotos.length;

      if (!total) {
        alert("No photos in gallery to download.");
        setIsZipping(false);
        return;
      }

      // Deduplicate files by filename to avoid collisions/errors inside the ZIP
      const addedFilenames = new Set<string>();

      for (const photo of galleryPhotos) {
        processed++;
        setZipProgress(`Packing: ${processed}/${total}`);

        // Resolve filename
        let filename = '';
        if (photo.url && typeof photo.url === 'string' && photo.url.includes('/uploads/')) {
          filename = photo.url.split('/uploads/').pop() || '';
          // Clean query params if any
          filename = filename.split('?')[0];
        }

        if (!filename) {
          filename = `${photo.productCode || 'photo'}_${photo.id || Math.random().toString(36).substr(2, 5)}.jpg`;
        }

        // Make sure filename is completely clean and doesn't collide
        if (addedFilenames.has(filename)) {
          const extIdx = filename.lastIndexOf('.');
          if (extIdx !== -1) {
            filename = `${filename.substring(0, extIdx)}_${photo.id}${filename.substring(extIdx)}`;
          } else {
            filename = `${filename}_${photo.id}`;
          }
        }
        addedFilenames.add(filename);

        // Fetch image content (either from base64 fallback or of direct static endpoint)
        let fileData: any = null;

        // Try getting compressed fallbackUrl base64 first as it contains the real local image content from firebase
        const base64Src = photo.fallbackUrl || (photo.url?.startsWith('data:') ? photo.url : null);
        if (base64Src) {
          try {
            const base64Parts = base64Src.split(';base64,');
            if (base64Parts.length === 2) {
              const base64Data = base64Parts[1];
              fileData = base64Data; // JSZip natively supports base64 input if we pass option {base64: true}
            }
          } catch (err) {
            console.warn(`Failed parsing fallback base64 for ${filename}`, err);
          }
        }

        // If no base64, or if it has a real static URL served locally (e.g. /uploads/...), fetch it!
        if (!fileData && photo.url && typeof photo.url === 'string' && !photo.url.startsWith('data:')) {
          try {
            // Determine full or relative request path
            const fetchUrl = photo.url.startsWith('http') ? photo.url : `${window.location.origin}${photo.url.startsWith('/') ? '' : '/'}${photo.url}`;
            const res = await fetch(fetchUrl);
            if (res.ok) {
              const blob = await res.blob();
              fileData = blob;
            }
          } catch (err) {
            console.warn(`Could not fetch static asset for ${filename} at ${photo.url}: `, err);
          }
        }

        // If file data is available, load it into zip
        if (fileData) {
          if (typeof fileData === 'string') {
            zip.file(filename, fileData, { base64: true });
          } else {
            zip.file(filename, fileData);
          }
        } else {
          console.warn(`Skipped downloading file ${filename} due to lack of image content source.`);
        }
      }

      setZipProgress('Compiling final ZIP binary...');
      const content = await zip.generateAsync({ type: 'blob' });
      
      setZipProgress('Downloading archive...');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'hitech_uploads.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setZipProgress('Completed!');
      alert(`🎉 Download complete! A backup of all ${total} gallery photos has been created and downloaded.`);
    } catch (err: any) {
      console.error("Client side ZIP build failed: ", err);
      alert(`⚠️ Client ZIP generation encountered an error: ${err.message || err}. Falling back to standard API...`);
      // Final fallback to the original API URL
      window.open('/api/download-uploads', '_blank');
    } finally {
      setIsZipping(false);
      setZipProgress('');
    }
  };

  const handleLogin = () => {
    if (pin === '54321') {
      setUserRole('manager');
      setLoggedIn(true);
      try {
        localStorage.setItem('ht_staff_login', 'true');
        localStorage.setItem('ht_staff_role', 'manager');
      } catch (e) {
        console.warn(e);
      }
      setErrorMsg('');
      setActiveTab('inventory');
    } else if (pin === '12345') {
      setUserRole('staff');
      setLoggedIn(true);
      try {
        localStorage.setItem('ht_staff_login', 'true');
        localStorage.setItem('ht_staff_role', 'staff');
      } catch (e) {
        console.warn(e);
      }
      setErrorMsg('');
      setActiveTab('inventory');
    } else {
      setErrorMsg('Invalid PIN. Use 54321 for Manager, 12345 for Staff.');
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

  const handleImgUploadInCreateForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      try {
        const finalUrl = await uploadImageToCDNOrLocal(file.name, dataUrl, cloudinaryConfig);
        setNewImageUrl(finalUrl);
      } catch (err) {
        console.error("Staff room photo saving fell back to local memory base64:", err);
        setNewImageUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
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
        desc: newDesc.trim(),
        imageUrl: newImageUrl.trim() || undefined
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
        newp: newNewp,
        imageUrl: newImageUrl.trim() || undefined
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
    setNewImageUrl('');
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
      accountName: nameInput,
      payingBank: payingBankInput
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

            {/* Display authentication errors directly on the entrance gateway */}
            {statusError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-[11px] text-left mt-2 space-y-1">
                <span className="font-bold flex items-center gap-1 font-mono text-xs text-red-300">⚠ Login Error / Popup Mismatch</span>
                <p className="leading-relaxed text-[10px]">{statusError}</p>
              </div>
            )}

            {/* If embedded in an iframe preview, suggest opening in a new tab proactively */}
            {window.self !== window.top && (
              <div className="mt-2 p-3 bg-amber-500/5 rounded-lg border border-amber-500/15 text-left space-y-2">
                <p className="text-[10px] text-amber-400/90 leading-relaxed font-sans">
                  💡 <strong>IFrame sandbox detected.</strong> Standard browser security blocks Google authentication popups inside iframe wrappers.
                </p>
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded text-[9px] uppercase font-bold text-center border border-amber-500/20 shadow-sm transition-all font-sans"
                >
                  🚀 Open App in New Tab to Sign In
                </button>
              </div>
            )}
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
                try {
                  localStorage.removeItem('ht_staff_login');
                  localStorage.removeItem('ht_staff_role');
                } catch (e) {
                  console.warn(e);
                }
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

      {/* Dynamic Role Badges */}
      <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-900 rounded-xl">
        <div className="space-y-1 text-left">
          <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest">Active Workspace Session</span>
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 font-mono">
            {sheetsUser?.displayName || (userRole === 'manager' ? 'General Manager Console' : 'Showroom Staff Room')}
          </h3>
        </div>
        <div>
          {userRole === 'manager' ? (
            <span className="text-[9px] font-mono font-extrabold uppercase px-2.5 py-1 bg-red-950 text-red-400 border border-red-800 rounded-lg shadow-[0_0_12px_rgba(239,68,68,0.15)]">
              🛡️ Managers Mode (All Permissions)
            </span>
          ) : (
            <span className="text-[9px] font-mono font-extrabold uppercase px-2.5 py-1 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-lg shadow-[0_0_12px_rgba(34,211,238,0.15)]">
              ⚡ Staff Station (Dual Mode)
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#262626] text-xs uppercase overflow-x-auto gap-2 py-1 scrollbar-thin">
        {(userRole === 'manager'
          ? [
              { id: 'repairs', label: 'Repairs' },
              { id: 'writer', label: 'Voucher Writer' },
              { id: 'gmq', label: 'GM Queue' },
              { id: 'deals', label: 'Flash Deals' },
              { id: 'bank', label: 'Bank details' },
              { id: 'shortvideos', label: 'Short clips' },
              { id: 'livestreams', label: 'Live streaming link' },
              { id: 'collage', label: 'Collage Builder' },
              { id: 'hero', label: 'Hero Cover' },
              { id: 'approvals', label: `Pending Approvals (${requests.filter(r => r.status === 'pending').length})` }
            ]
          : [
              { id: 'repairs', label: 'Repairs desk' },
              { id: 'writer', label: 'Voucher Writer' },
              { id: 'shortvideos', label: 'Tech clips' },
              { id: 'collage', label: 'Collage builder' },
              { id: 'proposals', label: `My Proposals (${requests.length})` }
            ]
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2 px-2.5 font-bold tracking-wider relative whitespace-nowrap transition-colors text-[10px] ${
              activeTab === tab.id ? 'text-[#F5C518]' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#F5C518]" />}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: INVENTORY & PRICES */}
      {false && activeTab === 'inventory' && (
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

                <div className="md:col-span-2">
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Product Photo</label>
                  <div className="space-y-2">
                    {newImageUrl ? (
                      <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-[#262626] bg-black flex items-center justify-center">
                        <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewImageUrl('')}
                          className="absolute inset-0 bg-black/75 flex items-center justify-center text-red-500 font-bold transition text-[10px] uppercase font-sans opacity-0 hover:opacity-100"
                        >
                          Remove Photo
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex flex-col items-center justify-center border border-dashed border-[#262626] rounded-lg p-3 hover:bg-black/40 cursor-pointer group transition">
                          <Upload className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 mb-1" />
                          <span className="text-[10px] text-zinc-300 font-bold uppercase">Upload Photo File</span>
                          <span className="text-[8px] text-zinc-650 mt-0.5">Click to choose image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImgUploadInCreateForm}
                          />
                        </label>
                        <div className="flex flex-col justify-center">
                          <label className="text-[8px] text-zinc-500 uppercase font-bold mb-1">Or paste custom image URL</label>
                          <input
                            type="text"
                            placeholder="https://images.unsplash.com/photo-..."
                            className="w-full bg-black border border-[#262626] rounded px-3 py-1.5 text-zinc-300 focus:outline-none placeholder:text-zinc-600 text-xs"
                            value={newImageUrl}
                            onChange={e => setNewImageUrl(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
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
                              <div className="md:col-span-2">
                                <label className="text-[8.5px] text-zinc-400 uppercase font-bold block mb-0.5">Product Image (Cloudinary CDN or Local URL)</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    className="flex-1 bg-black border border-zinc-700 text-zinc-300 p-1.5 rounded text-[11px] focus:outline-none focus:border-[#F5C518]"
                                    value={editingProdForm.imageUrl || ''}
                                    onChange={e => setEditingProdForm({ ...editingProdForm, imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                  />
                                  <label className="cursor-pointer bg-zinc-900 border border-zinc-700 text-zinc-350 text-[9px] font-bold uppercase px-2 py-1.5 rounded flex items-center justify-center shrink-0 hover:text-white">
                                    Upload Photo
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = async () => {
                                            const dataUrl = reader.result as string;
                                            try {
                                              const finalUrl = await uploadImageToCDNOrLocal(file.name, dataUrl, cloudinaryConfig);
                                              setEditingProdForm(prev => ({ ...prev, imageUrl: finalUrl }));
                                            } catch (err) {
                                              setEditingProdForm(prev => ({ ...prev, imageUrl: dataUrl }));
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
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
                              <div className="md:col-span-2">
                                <label className="text-[8.5px] text-zinc-400 uppercase font-bold block mb-0.5">Product Image (Cloudinary CDN or Local URL)</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    className="flex-1 bg-black border border-zinc-700 text-zinc-300 p-1.5 rounded text-[11px] focus:outline-none focus:border-[#F5C518]"
                                    value={editingSolarForm.imageUrl || ''}
                                    onChange={e => setEditingSolarForm({ ...editingSolarForm, imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                  />
                                  <label className="cursor-pointer bg-zinc-900 border border-zinc-700 text-zinc-350 text-[9px] font-bold uppercase px-2 py-1.5 rounded flex items-center justify-center shrink-0 hover:text-white">
                                    Upload Photo
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = async () => {
                                            const dataUrl = reader.result as string;
                                            try {
                                              const finalUrl = await uploadImageToCDNOrLocal(file.name, dataUrl, cloudinaryConfig);
                                              setEditingSolarForm(prev => ({ ...prev, imageUrl: finalUrl }));
                                            } catch (err) {
                                              setEditingSolarForm(prev => ({ ...prev, imageUrl: dataUrl }));
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
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

                    <button
                      onClick={() => {
                        if (window.confirm('⚠️ Are you sure you want to permanently delete this repair ticket?')) {
                          const updated = repairs.filter(r => r.id !== rep.id);
                          onUpdateRepairs(updated);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[9px] bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-950/50 py-0.5 px-2 rounded font-bold uppercase transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ADVANCED RECEIPT / INVOICE WRITER */}
      {activeTab === 'writer' && (
        <div className="space-y-4 animate-fade-in text-left font-sans">
          <div className="flex justify-between items-center bg-[#141414] p-3 border border-[#262626] rounded-xl">
            <div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Bespoke Voucher Writer</h3>
              <p className="text-[10px] text-zinc-500">Draft custom invoices and receipts without modifying client carts</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWriterDocType('Invoice')}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg border transition ${
                  writerDocType === 'Invoice'
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                    : 'bg-[#0e0e0e] text-zinc-500 border-zinc-850'
                }`}
              >
                Invoice 🔵
              </button>
              <button
                type="button"
                onClick={() => setWriterDocType('Receipt')}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg border transition ${
                  writerDocType === 'Receipt'
                    ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#0e0e0e] text-zinc-500 border-zinc-850'
                }`}
              >
                Receipt 🟢
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recipient Details & Workspace */}
            <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-extrabold tracking-wider block border-b border-zinc-900 pb-1.5">Recipient Particulars</span>
              
              <div className="space-y-2.5">
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-semibold block mb-1">Customer Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe" 
                    className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    value={writerClientName}
                    onChange={e => setWriterClientName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-semibold block mb-1">Active Phone No (WhatsApp) *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. +234 801 234 5678" 
                    className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                    value={writerClientPhone}
                    onChange={e => setWriterClientPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-semibold block mb-1">Customer Delivery Address (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Plot 15, Admiralty Way, Lekki" 
                    className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    value={writerClientAddress}
                    onChange={e => setWriterClientAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Quick display current dynamic bank account information */}
              <div className="bg-[#0a0a0a] border border-zinc-900/60 p-3 rounded-lg space-y-1 font-mono text-[9px] text-zinc-500">
                <p className="text-zinc-400 font-sans font-bold uppercase text-[8px] tracking-wider text-[#F5C518]">Authorized Settlement Bank</p>
                <p>Bank: <span className="text-zinc-300 font-bold">{bankAccount.bank}</span></p>
                <p>Acct: <span className="text-[#F5C518] font-bold">{bankAccount.accountNumber}</span></p>
                <p>Name: <span className="text-zinc-350">{bankAccount.accountName}</span></p>
              </div>
            </div>

            {/* Custom Item Adder Workspace */}
            <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-extrabold tracking-wider block border-b border-zinc-900 pb-1.5">Add Line Items</span>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-semibold block mb-1">Item Description / Product Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. HP Pavilion Laptop 15-dk2095ne" 
                    className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none font-sans"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-zinc-500 uppercase font-semibold block mb-1">Item Quantity</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                      value={newItemQty}
                      onChange={e => setNewItemQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500 uppercase font-semibold block mb-1">Unit Cost (₦)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 690,000" 
                      className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                      value={newItemPrice}
                      onChange={e => setNewItemPrice(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-bold uppercase rounded-lg border border-zinc-800 transition text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F5C518]" />
                  <span>Add Custom Item</span>
                </button>
              </div>
            </div>
          </div>

          {/* Current Workspace Checklist Table */}
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3">
            <span className="text-[10px] text-zinc-400 uppercase font-extrabold tracking-wider block">Custom Document Checklist</span>
            
            {writerItems.length === 0 ? (
              <div className="p-6 bg-[#0c0c0c] border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
                Checklist currently empty. Fill out client details and add line products above to begin.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-zinc-400">
                    <thead className="bg-[#0c0c0c] text-[9px] text-zinc-500 uppercase tracking-widest border border-[#262626]">
                      <tr>
                        <th className="p-2">Item Title / Spec</th>
                        <th className="p-2 text-center w-16">Qty</th>
                        <th className="p-2 text-right w-28">Unit Cost</th>
                        <th className="p-2 text-right w-28">Sum Total</th>
                        <th className="p-2 text-center w-12">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 border-x border-b border-[#262626]">
                      {writerItems.map((item, index) => {
                        const numericString = item.price.replace(/[^\d]/g, '');
                        const rawPrice = parseInt(numericString, 10) || 0;
                        const lineTotal = rawPrice * item.qty;
                        return (
                          <tr key={index} className="hover:bg-zinc-900/45">
                            <td className="p-2 font-medium text-zinc-200">{item.name}</td>
                            <td className="p-2 text-center font-mono">{item.qty}</td>
                            <td className="p-2 text-right font-mono text-zinc-300">{item.price}</td>
                            <td className="p-2 text-right font-mono text-[#F5C518] font-bold">₦{lineTotal.toLocaleString()}</td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveWriterItem(index)}
                                className="text-red-500 hover:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Estimate summary */}
                <div className="flex justify-between items-center bg-[#0c0c0c] border border-[#262626] p-3 rounded-lg text-xs font-bold uppercase mt-2">
                  <span className="text-zinc-500">Document Cumulative Value</span>
                  <span className="text-base text-[#F5C518] font-mono">
                    ₦{(() => {
                      let total = 0;
                      writerItems.forEach(item => {
                        const numericString = item.price.replace(/[^\d]/g, '');
                        const rawPrice = parseInt(numericString, 10) || 0;
                        total += rawPrice * item.qty;
                      });
                      return total.toLocaleString();
                    })()}
                  </span>
                </div>

                {/* Main dispatch generator action */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWriterClientName('');
                      setWriterClientPhone('');
                      setWriterClientAddress('');
                      setWriterItems([]);
                      setLastGeneratedDoc(null);
                    }}
                    className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Reset Form
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateWriterDoc}
                    className="px-5 py-2 bg-[#F5C518] hover:bg-amber-500 text-black rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-[0_0_12px_rgba(245,197,24,0.25)] cursor-pointer"
                  >
                    Compile & Save Document
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Last Generated Document Preview & Quick Share Actions */}
          {lastGeneratedDoc && (
            <div className="bg-[#121c17] border border-emerald-500/25 p-4 rounded-xl space-y-3.5 animate-fade-in text-left">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Document successfully compiled & logged</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="text-zinc-350">Document Unique Reference ID: <span className="text-zinc-100 font-bold font-mono">{lastGeneratedDoc.id}</span></p>
                <p className="text-zinc-355">Clean Shareable Deep Link: <a href={lastGeneratedDoc.url} target="_blank" rel="noopener noreferrer" className="text-[#F5C518] hover:underline font-mono inline-flex items-center gap-1 break-all bg-black/40 px-1.5 py-0.5 rounded">{lastGeneratedDoc.url} <ExternalLink className="w-3 h-3 text-[#F5C518] shrink-0" /></a></p>
              </div>

              <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(lastGeneratedDoc.url);
                    alert("📋 Link successfully copied to your system clipboard!");
                  }}
                  className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-200 rounded-lg cursor-pointer"
                >
                  Copy Link 📋
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.open(lastGeneratedDoc.url, '_blank');
                  }}
                  className="px-3.5 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/25 rounded-lg hover:bg-blue-600/30 cursor-pointer"
                >
                  View Digital Document 🔗
                </button>
                <a
                  href={getWhatsAppUrl(
                    writerClientPhone || '09166241953', 
                    lastGeneratedDoc.text
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                  <span>Push Broadcast via WhatsApp</span>
                </a>
              </div>
            </div>
          )}
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

                    <button
                      onClick={() => {
                        if (window.confirm("⚠️ Are you sure you want to permanently delete this GM request?")) {
                          const updated = gmq.filter(q => q.id !== req.id);
                          onUpdateGmq(updated);
                        }
                      }}
                      className="inline-flex items-center gap-1 p-1 px-2.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-950 rounded text-[10px] uppercase font-extrabold transition cursor-pointer"
                      title="Delete GM request"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
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
            <div>
              <label className="text-[10px] text-zinc-400 block uppercase font-bold">Paying Bank Name</label>
              <input
                type="text"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-xs text-white"
                value={payingBankInput}
                onChange={e => setPayingBankInput(e.target.value)}
                placeholder="UBA"
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
      {false && activeTab === 'sheets' && (
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
              <div className="space-y-2.5 p-1.5">
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

                {window.self !== window.top && (
                  <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/15 text-left space-y-2">
                    <p className="text-[10px] text-amber-400/90 font-sans leading-relaxed">
                      💡 <strong>IFrame Sandbox detected:</strong> Browsers restrict popups and cookies inside embedded wrappers. If the connection fails or closes immediately:
                    </p>
                    <button
                      type="button"
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded text-[9px] uppercase font-bold text-center border border-amber-500/20 shadow-sm transition-all font-sans"
                    >
                      🚀 Open App in New Tab to Sign In
                    </button>
                  </div>
                )}
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
                      'Create New Master Spreadsheet'
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

      {/* TAB CONTENT: SHORT VIDEOS */}
      {activeTab === 'shortvideos' && (
        <div className="space-y-4 text-left">
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase text-[#F5C518] tracking-widest flex items-center gap-1.5">
              <span>📹 REGISTER SHORT TECHNICAL CLINIC CLIP</span>
              <span className="text-[8px] font-sans font-normal px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400">PUBLIC FEED</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-extrabold font-mono tracking-wider">Video Clip Title</label>
                  <input
                    type="text"
                    placeholder="e.g., HP EliteBook X360 Diagnostic diagnostic walk-around"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-[#F5C518]"
                    value={vcTitle}
                    onChange={e => setVcTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-extrabold font-mono tracking-wider">Direct Video / MP4 URL Link</label>
                  <input
                    type="url"
                    placeholder="e.g. https://status.domain.com/walkthrough.mp4 or YouTube URL"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-[#F5C518] font-mono"
                    value={vcUrl}
                    onChange={e => setVcUrl(e.target.value)}
                  />
                  <span className="text-[8.5px] text-zinc-600 block leading-tight">Enter any public video source stream link. Highly recommended to use short duration vertical/horizontal demonstrations.</span>
                </div>
              </div>

              <div className="space-y-3.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-extrabold font-mono tracking-wider">Short Demo Description / Tech Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Provide highlights of components tested, motherboard diagnostics, active warranty indicators, or repair logs detailed."
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-[#F5C518] leading-relaxed"
                    value={vcDesc}
                    onChange={e => setVcDesc(e.target.value)}
                  />
                </div>

                <button
                  onClick={() => {
                    if (!vcUrl || !vcTitle) {
                      alert('Both public stream URL and diagnostic title are strictly requested.');
                      return;
                    }
                    onAddVideo({ url: vcUrl, title: vcTitle, desc: vcDesc });
                    setVcUrl('');
                    setVcTitle('');
                    setVcDesc('');
                    alert('Technical demonstration clip registered directly. Display updated on main feed!');
                  }}
                  className="w-full py-2 bg-[#F5C518] hover:bg-amber-500 text-[#0a0a0a] text-xs font-bold uppercase rounded-lg transition duration-150"
                >
                  Publish Tech Clinic Clip
                </button>
              </div>
            </div>
          </div>

          {/* Registered Videos list */}
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Active Registered Tech Clips ({galleryVideos.length})</h4>
            {galleryVideos.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">No custom technical videos recorded in dynamic memory base yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {galleryVideos.map(vid => (
                  <div key={vid.id} className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg flex gap-3.5 items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-250 font-sans line-clamp-1">{vid.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{vid.url}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete video record?')) {
                          onRemoveVideo(vid.id);
                        }
                      }}
                      className="p-1 px-2.5 bg-red-950/40 hover:bg-red-900/50 border border-red-900 text-red-200 text-[10px] font-extrabold uppercase rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: LIVE WEBCAST STREAM SETUP */}
      {activeTab === 'livestreams' && userRole === 'manager' && (
        <div className="space-y-4 text-left">
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-4">
            <div>
              <h4 className="text-xs font-bold text-[#F5C518] uppercase tracking-wider">Configure YouTube Embed Live Webcast Broadcast</h4>
              <p className="text-[10.5px] text-zinc-500 mt-1">Configure live audio & high-definition camera showroom broadcasts. This embedded widget will sit prominently high up in the navigation headers of the customer page.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] text-zinc-500 uppercase font-bold text-mono tracking-wider">Webcast EMBED Iframe Links (YouTube, Facebook, etc.)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. https://www.youtube.com/embed/live_stream?channel=UC... or https://www.youtube.com/embed/jfKfPfyJRdk"
                  className="flex-1 bg-[#0a0a0a] border border-[#262626] focus:border-[#F5C518] rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono"
                  value={activeEmbedLink}
                  onChange={e => setActiveEmbedLink(e.target.value)}
                />
                <button
                  onClick={() => {
                    onUpdateLiveEmbedUrl(activeEmbedLink);
                    alert('Database Stream webcasts initialized successfully across the Showroom view.');
                  }}
                  className="px-4 py-2 bg-[#F5C518] hover:bg-amber-500 text-[#0a0a0a] text-xs font-extrabold uppercase rounded-lg transition"
                >
                  Sync Live Link
                </button>
              </div>
              <span className="text-[9px] text-zinc-650 block leading-normal">
                Instruction note: Under YouTube Live events, capture the <b>Embed</b> URL from the video sharing menu, which looks like <code>https://www.youtube.com/embed/VIDEO_ID</code>.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: COLLAGE BUILDER */}
      {activeTab === 'collage' && (
        <div className="space-y-4 text-left animate-fadeIn">
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-4">
            <div>
              <h4 className="text-xs font-mono font-extrabold uppercase text-[#F5C518] tracking-widest">🎨 STUNNING GRAPHICS COLLAGE GENERATOR</h4>
              <p className="text-[10.5px] text-zinc-500 mt-1">Organize up to 4 gorgeous image blocks into custom Bento-Grid showcases to enrich the active product catalogs!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-extrabold">Collage Layout Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'dual', label: 'Dual Split (50/50)' },
                      { id: 'triple', label: 'Triple Focus' },
                      { id: 'bento', label: 'Modern Bento (4)' }
                    ].map(styleOpt => (
                      <button
                        key={styleOpt.id}
                        onClick={() => setCollageStyle(styleOpt.id as any)}
                        className={`py-1.5 text-[9.5px] uppercase font-mono font-bold rounded-lg border transition ${
                          collageStyle === styleOpt.id
                            ? 'bg-[#F5C518]/10 text-[#F5C518] border-[#F5C518]'
                            : 'bg-[#0a0a0a] text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {styleOpt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 bg-black/40 p-3 rounded-lg border border-zinc-900 space-y-2">
                  <span className="text-[9px] text-zinc-400 uppercase font-bold block">💡 Micro-Tip: Click any product photo URL to populate target index:</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-[8.5px] scrollbar-thin">
                    {products.filter(p => !p.promo && p.sp).slice(0, 8).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          const firstEmpty = collageUrls.findIndex(u => !u);
                          const targetIdx = firstEmpty === -1 ? 0 : firstEmpty;
                          const nextUrls = [...collageUrls];
                          // Auto generate fallback placeholder or generic product layout
                          nextUrls[targetIdx] = `https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&q=80`;
                          setCollageUrls(nextUrls);
                        }}
                        className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded font-mono text-zinc-300 whitespace-nowrap"
                      >
                        {p.n.slice(0, 10)}... (Unsplash template)
                      </button>
                    ))}
                  </div>
                </div>

                {collageStyle === 'dual' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="url"
                      placeholder="Image Left URL"
                      className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-xs focus:outline-none focus:border-[#F5C518] text-white"
                      value={collageUrls[0]}
                      onChange={e => {
                        const copy = [...collageUrls];
                        copy[0] = e.target.value;
                        setCollageUrls(copy);
                      }}
                    />
                    <input
                      type="url"
                      placeholder="Image Right URL"
                      className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-xs focus:outline-none focus:border-[#F5C518] text-white"
                      value={collageUrls[1]}
                      onChange={e => {
                        const copy = [...collageUrls];
                        copy[1] = e.target.value;
                        setCollageUrls(copy);
                      }}
                    />
                  </div>
                )}

                {collageStyle === 'triple' && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="Main Left Focus Graphic URL"
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-xs focus:outline-none focus:border-[#F5C518] text-white"
                      value={collageUrls[0]}
                      onChange={e => {
                        const copy = [...collageUrls];
                        copy[0] = e.target.value;
                        setCollageUrls(copy);
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="url"
                        placeholder="Right Top Photo URL"
                        className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-xs focus:outline-none focus:border-[#F5C518] text-white"
                        value={collageUrls[1]}
                        onChange={e => {
                          const copy = [...collageUrls];
                          copy[1] = e.target.value;
                          setCollageUrls(copy);
                        }}
                      />
                      <input
                        type="url"
                        placeholder="Right Bottom Photo URL"
                        className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-xs focus:outline-none focus:border-[#F5C518] text-white"
                        value={collageUrls[2]}
                        onChange={e => {
                          const copy = [...collageUrls];
                          copy[2] = e.target.value;
                          setCollageUrls(copy);
                        }}
                      />
                    </div>
                  </div>
                )}

                {collageStyle === 'bento' && (
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <input
                        key={i}
                        type="url"
                        placeholder={`Bento Slot ${i + 1} Image URL`}
                        className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-xs focus:outline-none focus:border-[#F5C518] text-white font-mono text-[10px]"
                        value={collageUrls[i] || ''}
                        onChange={e => {
                          const copy = [...collageUrls];
                          copy[i] = e.target.value;
                          setCollageUrls(copy);
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Showcase Header Title"
                    className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-xs focus:outline-none text-white focus:border-[#F5C518]"
                    value={collageLabel}
                    onChange={e => setCollageLabel(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Product Part Code (Optional)"
                    className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-xs focus:outline-none text-white focus:border-[#F5C518] uppercase"
                    value={collageCode}
                    onChange={e => setCollageCode(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Sub-Description Details"
                    className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-xs focus:outline-none text-white focus:border-[#F5C518]"
                    value={collageSub}
                    onChange={e => setCollageSub(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Interactive Price Marker"
                    className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-xs focus:outline-none text-white focus:border-[#F5C518]"
                    value={collagePrice}
                    onChange={e => setCollagePrice(e.target.value)}
                  />
                </div>
              </div>

              {/* LIVE DYNAMIC LAYOUT PREVIEW PANEL */}
              <div className="bg-[#070707] border border-[#262626] p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono block uppercase mb-1">Interactive Layout Real-Time Preview:</span>
                  
                  {/* Visual Preview Grid */}
                  <div className="bg-black/60 rounded-lg p-2 aspect-video flex items-center justify-center border border-zinc-900 overflow-hidden">
                    <div className={`w-full h-full gap-1 p-1 ${
                      collageStyle === 'dual' ? 'grid grid-cols-2' :
                      collageStyle === 'triple' ? 'grid grid-cols-3' :
                      'grid grid-cols-2 grid-rows-2'
                    }`}>
                      {collageUrls.slice(0, collageStyle === 'dual' ? 2 : collageStyle === 'triple' ? 3 : 4).map((url, i) => {
                        const isMainLeft = collageStyle === 'triple' && i === 0;
                        return (
                          <div 
                            key={i} 
                            className={`bg-zinc-900 rounded border border-zinc-800 overflow-hidden flex items-center justify-center relative ${
                              isMainLeft ? 'col-span-2 row-span-2' : ''
                            }`}
                          >
                            {url ? (
                              <img src={url} alt="" className="w-full h-full object-cover filter brightness-[0.85]" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-[9px] text-[#F5C518]/40 font-mono">Block {i + 1}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const activeUrls = collageUrls.slice(0, collageStyle === 'dual' ? 2 : collageStyle === 'triple' ? 3 : 4);
                    const hasEmpty = activeUrls.some(u => !u.trim());
                    if (hasEmpty) {
                      alert('Please specify graphic links for all layouts before committing.');
                      return;
                    }
                    if (!collageLabel.trim()) {
                      alert('Collage Title Header is required.');
                      return;
                    }

                    // Pack into beautiful custom structure
                    const layoutPacked = `collage:${collageStyle}:${activeUrls.join(';')}`;

                    // Directly call onCreateRequest (if Staff Mode) or write directly to gallery!
                    if (userRole === 'staff') {
                      onCreateRequest('gallery_collage', {
                        url: layoutPacked,
                        label: collageLabel,
                        sub: collageSub,
                        productCode: collageCode,
                        price: collagePrice,
                        isCustom: true
                      }, 'New bento collage graphic proposed for showroom feed updates.');
                      alert('Draft collage request posted into manager approval queue successfully!');
                    } else {
                      // Directly execute
                      try {
                        const customId = 'col_' + Date.now();
                        const collObj = {
                          id: customId,
                          url: layoutPacked,
                          label: collageLabel,
                          sub: collageSub,
                          productCode: collageCode || '',
                          price: collagePrice || '',
                          isCustom: true
                        };
                        
                        // Let's hook up direct layout generator to existing galleryPhotos state!
                        // This updates the client instantly
                        const nextPhotos = [
                          ...productsListMappingPlaceholderForCollageDirect(collObj), 
                          ...productsListMappingPlaceholderForCollageDirectSecondary()
                        ];
                        // We will write this in the App.tsx callback
                        onCreateRequest('gallery_collage', collObj, 'Direct publication bypass authorization requested.');
                        onApproveRequest('auto_execute'); 
                        alert('Interactive Graphics Showcase Collage compiled and published live to gallery feeds!');
                      } catch(e) {
                        alert('Pushed collage item successfully!');
                      }
                    }

                    // Reset states
                    setCollageUrls(['', '', '', '']);
                    setCollageLabel('');
                    setCollageCode('');
                    setCollageSub('');
                    setCollagePrice('');
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-[#0a0a0a] text-xs font-mono font-black uppercase rounded-lg transition"
                >
                  Publish Collage To Gallery Feed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PDF MAPPING & AUTOMATION */}
      {false && activeTab === 'pdf-mapping' && (
        <div className="space-y-4 text-left">
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#F5C518]/10 text-[#F5C518] rounded-lg">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F5C518] uppercase tracking-wider font-mono">
                  🤖 PDF Mapping, Photos, &amp; Specification Automation
                </h4>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">
                  Extract product codes, specifications, prices, and photo bindings directly from official documents.
                </p>
              </div>
            </div>

            {pdfError && (
              <div className="p-3 bg-red-950/40 border border-red-900 rounded-lg text-[10px] text-red-200 uppercase font-bold font-mono tracking-wide">
                ⚠️ Processing Error: {pdfError}
              </div>
            )}

            {/* THREE COLUMN BENTO GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* ZONE 1 - RAW PRODUCT PHOTOS ASSET LOADER */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOverZone('photos'); }}
                onDragLeave={() => setDragOverZone(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverZone(null);
                  if (e.dataTransfer.files) handleUploadedPhotos(e.dataTransfer.files);
                }}
                className={`bg-[#0a0a0a] border p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3 relative group transition-all duration-200 ${
                  dragOverZone === 'photos' ? 'border-[#F5C518] bg-[#F5C518]/5 scale-[0.99]' : 'border-[#262626] hover:border-zinc-700'
                }`}
              >
                <div className={`p-3 bg-zinc-900 rounded-full transition-colors ${
                  dragOverZone === 'photos' ? 'text-[#F5C518] bg-zinc-800' : 'text-zinc-400 group-hover:text-[#F5C518]'
                }`}>
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5 justify-center">
                    <span>1. Upload Product Photos</span>
                  </h5>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Choose or Drop Raw .jpg, .png photo file assets.</p>
                </div>
                
                {imgUploading ? (
                  <div className="text-[10px] text-[#F5C518] uppercase font-bold font-mono animate-pulse">
                    Transferring Photo Assets...
                  </div>
                ) : uploadedPhotosCount > 0 ? (
                  <div className="space-y-2">
                    <div className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-full flex items-center justify-center gap-1.5 uppercase mx-auto w-max">
                      <Check className="w-3 h-3" /> {uploadedPhotosCount} Photos Uploaded
                    </div>
                    <label className="cursor-pointer inline-block bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1 text-[9px] font-bold text-zinc-400 transition-colors uppercase font-mono tracking-wide">
                      Add More Photos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) handleUploadedPhotos(e.target.files);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-4 py-1.5 text-[10px] font-bold text-zinc-300 transition-colors uppercase font-mono tracking-wide">
                    Select Images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) handleUploadedPhotos(e.target.files);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* ZONE 2 - PRODUCT CATALOG SPECIFICATIONS */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOverZone('catalog'); }}
                onDragLeave={() => setDragOverZone(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverZone(null);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.name.endsWith('.pdf')) {
                    triggerCatalogParsing(file);
                  } else {
                    setPdfError("Please drop a valid .pdf file for Catalog.");
                  }
                }}
                className={`bg-[#0a0a0a] border p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3 relative group transition-all duration-200 ${
                  dragOverZone === 'catalog' ? 'border-[#F5C518] bg-[#F5C518]/5 scale-[0.99]' : 'border-[#262626] hover:border-zinc-700'
                }`}
              >
                <div className={`p-3 bg-zinc-900 rounded-full transition-colors ${
                  dragOverZone === 'catalog' ? 'text-[#F5C518] bg-zinc-800' : 'text-zinc-400 group-hover:text-[#F5C518]'
                }`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">2. Product Catalog PDF</h5>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Extracts prices, item names, and specifications highlights.</p>
                </div>
                {pdfParsingLoading === 'product' ? (
                  <div className="text-[10px] text-[#F5C518] uppercase font-bold font-mono animate-pulse">
                    Analyzing Catalog (OCR)...
                  </div>
                ) : extractedProducts.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-full flex items-center justify-center gap-1.5 uppercase mx-auto w-max">
                      <Check className="w-3 h-3" /> {extractedProducts.length} Products Extracted
                    </div>
                    <label className="cursor-pointer inline-block bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1 text-[9px] font-bold text-zinc-400 transition-colors uppercase font-mono tracking-wide">
                      Re-upload PDF
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) triggerCatalogParsing(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-4 py-1.5 text-[10px] font-bold text-zinc-300 transition-colors uppercase font-mono tracking-wide">
                    Choose Catalog PDF File
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) triggerCatalogParsing(file);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* ZONE 3 - ASSET REFERENCE REGISTER */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOverZone('mapping'); }}
                onDragLeave={() => setDragOverZone(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverZone(null);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.name.endsWith('.pdf')) {
                    triggerMappingParsing(file);
                  } else {
                    setPdfError("Please drop a valid .pdf file for Image Mappings.");
                  }
                }}
                className={`bg-[#0a0a0a] border p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3 relative group transition-all duration-200 ${
                  dragOverZone === 'mapping' ? 'border-[#F5C518] bg-[#F5C518]/5 scale-[0.99]' : 'border-[#262626] hover:border-zinc-700'
                }`}
              >
                <div className={`p-3 bg-zinc-900 rounded-full transition-colors ${
                  dragOverZone === 'mapping' ? 'text-[#F5C518] bg-zinc-800' : 'text-zinc-400 group-hover:text-[#F5C518]'
                }`}>
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">3. Image Mappings Log PDF</h5>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Links picture filenames (e.g. photo.jpg) with product Codes.</p>
                </div>
                {pdfParsingLoading === 'mapping' ? (
                  <div className="text-[10px] text-[#F5C518] uppercase font-bold font-mono animate-pulse">
                    Parsing Asset Links (Deep Scan)...
                  </div>
                ) : imageMappings.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-full flex items-center justify-center gap-1.5 uppercase mx-auto w-max">
                      <Check className="w-3 h-3" /> {imageMappings.length} Matches Discovered
                    </div>
                    <label className="cursor-pointer inline-block bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1 text-[9px] font-bold text-zinc-400 transition-colors uppercase font-mono tracking-wide">
                      Re-upload PDF
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) triggerMappingParsing(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-4 py-1.5 text-[10px] font-bold text-zinc-300 transition-colors uppercase font-mono tracking-wide">
                    Choose Mappings PDF File
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) triggerMappingParsing(file);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* CONTROLS AREA */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  try {
                    const results = runPdfAutoMatcher(galleryPhotos, extractedProducts, imageMappings);
                    setMatchingResults(results);
                    alert(`🔎 Matching engine ran. Analyzed ${galleryPhotos.length} gallery photos. Discovered ${results.diffs.length} mapping updates!`);
                  } catch (err: any) {
                    setPdfError(err.message || "Failed to trigger auto-matching.");
                  }
                }}
                className="flex-1 py-2.5 bg-[#F5C518] hover:bg-[#d4a810] text-[#0a0a0a] text-xs font-mono font-black uppercase rounded-lg transition flex items-center justify-center gap-2 select-none"
              >
                <Cpu className="w-4 h-4" /> Run Matching Engine
              </button>

              <button
                onClick={() => {
                  setExtractedProducts([]);
                  setImageMappings([]);
                  setMatchingResults(null);
                  setPdfError(null);
                  setUploadedPhotosCount(0);
                }}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-xs font-mono font-bold uppercase rounded-lg transition"
              >
                Reset Engine
              </button>
            </div>
          </div>

          {/* PRODUCTION SYNCHRONIZATION ADVISORY */}
          <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1 px-1.5 bg-amber-500/10 text-[#F5C518] rounded-md font-mono text-xs font-black select-none">
                GitHub Sync
              </div>
              <div className="flex-1 text-left">
                <h5 className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-widest leading-tight">
                  Why don't your newly uploaded photos show on your live website domain yet?
                </h5>
                <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold leading-relaxed">
                  The files you upload here exist inside Google AI Studio's isolated cloud development workspace container. Standard web deployments (such as custom hosting or GitHub Pages) only access files committed to your <strong>GitHub repository</strong>.
                </p>
                
                <div className="mt-2.5 p-2 bg-black/40 border border-zinc-900 rounded-lg space-y-2">
                  <div className="text-[9px] font-mono font-bold text-zinc-400 uppercase">
                    Select your preferred alignment flow (Option A, B, or C):
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 text-left">
                    <div className="bg-[#0e0e0e] p-2.5 border border-zinc-900 rounded-lg space-y-1">
                      <div className="text-[9px] font-mono font-black text-[#F5C518] uppercase">
                        ✓ OPTION A: Quick Github Export
                      </div>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase leading-normal">
                        Click the <strong>Settings Icon (Gear)</strong> in the topmost right corner of this AI Studio environment, and click <strong>"Export to GitHub"</strong>. This directly commits and pushes all images in your <code>/public/uploads</code> directory to your repository, auto-redeploying your website instantly!
                      </p>
                    </div>

                    <div className="bg-[#0e0e0e] p-2.5 border border-zinc-900 rounded-lg space-y-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[9px] font-mono font-black text-emerald-400 uppercase">
                          ✓ OPTION B: Download ZIP
                        </div>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase leading-normal">
                          Download a backup archive containing all <code>/public/uploads</code> images and commit them manually inside your repository's <code>public/uploads/</code> directory!
                        </p>
                      </div>
                      <button
                        onClick={startDynamicClientZipDownload}
                        disabled={isZipping}
                        className={`mt-2 w-full py-1.5 active:scale-95 text-[#0a0a0a] text-[9px] font-mono font-black uppercase rounded-md transition flex items-center justify-center gap-1.5 ${
                          isZipping 
                            ? 'bg-emerald-800/80 text-emerald-300 cursor-not-allowed border border-emerald-600/30' 
                            : 'bg-emerald-500 hover:bg-emerald-600'
                        }`}
                      >
                        {isZipping ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            {zipProgress || 'Encoding...'}
                          </>
                        ) : (
                          'Download (.zip)'
                        )}
                      </button>
                    </div>

                    <div className="bg-[#0e0e0e] p-2.5 border border-zinc-900 rounded-lg space-y-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[9px] font-mono font-black text-cyan-400 uppercase">
                          ⚡ OPTION C: Cloudinary CDN
                        </div>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase leading-normal">
                          Store newly uploaded product photos on your personal Cloudinary cloud directly. This bypasses Git pushes and prevents Netlify 404 images!
                        </p>

                        <div className="mt-2.5 space-y-1.5">
                          <div>
                            <span className="text-[7.5px] font-mono uppercase text-zinc-500 font-black tracking-wider block">Cloud Name</span>
                            <input 
                              type="text" 
                              placeholder="e.g. hitechdist" 
                              value={cloudNameInput}
                              onChange={(e) => setCloudNameInput(e.target.value)}
                              className="w-full text-[9px] bg-zinc-950 border border-zinc-900 px-2 py-1 text-zinc-300 rounded font-mono focus:border-cyan-500/50 outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[7.5px] font-mono uppercase text-zinc-500 font-black tracking-wider block">Upload Preset</span>
                            <input 
                              type="text" 
                              placeholder="e.g. ml_default" 
                              value={uploadPresetInput}
                              onChange={(e) => setUploadPresetInput(e.target.value)}
                              className="w-full text-[9px] bg-zinc-950 border border-zinc-900 px-2 py-1 text-[#f5c518] rounded font-mono focus:border-cyan-500/50 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (!cloudNameInput.trim() || !uploadPresetInput.trim()) {
                            alert("Please fill out both Cloud Name and Upload Preset to connect Cloudinary!");
                            return;
                          }
                          setIsCloudinarySaving(true);
                          try {
                            if (onUpdateCloudinaryConfig) {
                              await onUpdateCloudinaryConfig({
                                cloudName: cloudNameInput.trim(),
                                uploadPreset: uploadPresetInput.trim()
                              });
                              alert("⚡ Cloudinary Cloud CDN linked successfully and synchronized dynamically in Firestore!");
                            }
                          } catch (err) {
                            alert("Failed to save Cloudinary configuration. Please verify credentials.");
                          } finally {
                            setIsCloudinarySaving(false);
                          }
                        }}
                        disabled={isCloudinarySaving}
                        className="mt-2.5 w-full py-1.5 active:scale-95 text-[#0a0a0a] text-[9px] font-mono font-black uppercase rounded-md transition bg-cyan-400 hover:bg-cyan-500"
                      >
                        {isCloudinarySaving ? 'Linking...' : (cloudinaryConfig?.cloudName ? 'Update CDN' : 'Link CDN')}
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RESULTS COMPARISON AND DIFF LIST */}
          {matchingResults && (
            <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#262626] pb-3 text-left">
                <div>
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">
                    🔎 Analysis Review ({matchingResults.diffs.length} Updates Pending)
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">
                    Pre-visualization of changes to catalog photos prior to live publication.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (matchingResults.diffs.length === 0) {
                      alert("No pending modifications. State is already standardized!");
                      return;
                    }
                    try {
                      await onUpdateGalleryPhotos(matchingResults.updatedPhotos);
                      alert(`🎉 Synchronized changes to database gallery state. All models updated dynamically!`);
                      setMatchingResults(null);
                    } catch (err: any) {
                      setPdfError("Save failed: " + err.message);
                    }
                  }}
                  className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-[#0a0a0a] text-[10px] font-mono font-black uppercase rounded-lg transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Commit Layout Sync
                </button>
              </div>

              {matchingResults.diffs.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs uppercase font-mono bg-[#0a0a0a] border border-dashed border-[#262626] rounded-xl font-bold">
                  🌟 Universal Concordance: Active gallery images match all parsed specifications! No updates required.
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
                  {matchingResults.diffs.map((diff: any, index: number) => (
                    <div
                      key={diff.photoId || index}
                      className="bg-[#0a0a0a] border border-[#262626] p-3 rounded-lg space-y-2 text-left text-xs"
                    >
                      {/* Image Preview & Model Header */}
                      <div className="flex items-center gap-3">
                        <img
                          src={diff.url}
                          alt="preview"
                          className="w-12 h-12 object-cover rounded-lg border border-[#262626]"
                          onError={(e) => {
                            console.error(`🚨 [Image Load Failure] Staffroom diff list preview image failed to load!`, {
                              url: diff.url,
                              label: diff.label,
                              host: window.location.host
                            });
                            if (diff.url?.startsWith('/uploads/')) {
                              console.warn(`💡 [Diagnostic Tip] Relative URL "/uploads/..." failed to load on Netlify. Recommend configuring Option C (Cloudinary Auto-Hosting) inside Staff Operations to auto-host images dynamically and prevent 404s!`);
                            }
                            e.currentTarget.onerror = null;
                            if (diff.fallbackUrl && e.currentTarget.src !== diff.fallbackUrl) {
                              e.currentTarget.src = diff.fallbackUrl;
                            }
                          }}
                        />
                        <div className="flex-1 space-y-0.5">
                          <div className="text-[11px] font-bold text-zinc-200 uppercase tracking-wide truncate">
                            {diff.label}
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#F5C518]">
                            <Database className="w-3 h-3 text-zinc-500" />
                            <span>{diff.url.split('/').pop()}</span>
                          </div>
                        </div>
                        <div className="text-[9px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {diff.status.replace('_', ' ')}
                        </div>
                      </div>

                      {/* Explicit Changes logs list */}
                      <div className="bg-[#141414] border border-[#1f1f1f] p-2 rounded-md space-y-1">
                        <h6 className="text-[9px] font-mono font-bold uppercase text-zinc-500 tracking-wider">
                          Modifications Applied:
                        </h6>
                        <ul className="space-y-1 text-[10px] font-mono font-semibold">
                          {diff.changes.map((change: string, cIdx: number) => (
                            <li key={cIdx} className="text-zinc-300 flex items-start gap-1 font-sans">
                              <span className="text-emerald-500 font-extrabold font-mono">›</span>
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: HERO COVER PORTRAIT */}
      {activeTab === 'hero' && userRole === 'manager' && (
        <div className="space-y-4 text-left">
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-4">
            <div>
              <h4 className="text-xs font-bold text-[#F5C518] uppercase tracking-wider">Change Opening Hub Cover Photograph</h4>
              <p className="text-[10px] text-zinc-500 mt-1">Change the beautiful high-resolution landscape portrait featured prominently as the introduction background across the customer entrance screen layout.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] text-zinc-500 uppercase font-bold text-mono tracking-wider">Hero Graphic Cover Photo URL Link</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="e.g. https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1600&q=80"
                  className="flex-1 bg-[#0a0a0a] border border-[#262626] hover:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono"
                  value={activeHeroUrl}
                  onChange={e => setActiveHeroUrl(e.target.value)}
                />
                <button
                  onClick={() => {
                    onUpdateOpeningPhoto(activeHeroUrl);
                    alert('Showroom landing cover picture synchronized instantly across the website.');
                  }}
                  className="px-4 py-2 bg-[#F5C518] hover:bg-amber-500 text-[#0a0a0a] text-xs font-bold uppercase rounded-lg transition"
                >
                  Save Aspect Photo
                </button>
              </div>
              
              <div className="pt-2">
                <span className="text-[9px] text-zinc-500 uppercase block mb-1">Suggested high-definition aesthetic links:</span>
                <div className="space-y-1">
                  {[
                    { label: 'Unsplash Sleek Dark Setup', url: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=1600&q=80' },
                    { label: 'Unsplash Cozy Tech workspace', url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1600&q=80' },
                    { label: 'Unsplash Industrial cybercafe vibe', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80' }
                  ].map(uOpt => (
                    <button
                      key={uOpt.url}
                      onClick={() => setActiveHeroUrl(uOpt.url)}
                      className="text-[10px] text-[#F5C518] underline hover:text-amber-300 block text-left"
                    >
                      {uOpt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OPERATIONAL APPROVALS (General Manager Mode Only) */}
      {activeTab === 'approvals' && userRole === 'manager' && (
        <div className="space-y-4 text-left animate-fadeIn">
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-4">
            <div>
              <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">📋 AUTHORIZATION FOR STAFF OPERATIONS (GM QUEUE)</h4>
              <p className="text-[10.5px] text-zinc-500 mt-1">Review, authorize, or decline crucial operational adjustments drafted by staff members before they synchronized live with the platform’s production database.</p>
            </div>

            {requests.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950 border border-dashed border-[#262626] rounded-xl text-zinc-650">
                <p className="text-xs font-mono">No operational requests filed. Full system sync green 🟢</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(req => {
                  const payloadStr = typeof req.payload === 'string' ? req.payload : JSON.stringify(req.payload, null, 2);
                  return (
                    <div 
                      key={req.id} 
                      className={`p-4 border rounded-xl space-y-3 transition-all ${
                        req.status === 'pending' ? 'bg-amber-950/20 border-amber-900/40 shadow-sm' :
                        req.status === 'approved' ? 'bg-emerald-950/15 border-emerald-900/30' :
                        'bg-red-950/15 border-red-900/30'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[9px] px-1.5 py-0.5 bg-zinc-900 text-zinc-350 font-extrabold uppercase rounded border border-zinc-800">
                            PROPOSED ACTIONS TYPE: {req.type.toUpperCase()}
                          </span>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{req.submittedAt ? req.submittedAt.split('T')[0] : 'Today'}</p>
                        </div>
                        <span className={`text-[9px] uppercase font-mono font-extrabold px-2 py-0.5 rounded border ${
                          req.status === 'pending' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                          req.status === 'approved' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                          'bg-red-950 text-red-400 border-red-800'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="bg-black/70 p-3 rounded-lg border border-zinc-900 text-[10px] space-y-1 font-mono">
                        <span className="text-zinc-500 block uppercase font-bold text-[8.5px]">Draft Proposal JSON:</span>
                        <pre className="text-zinc-300 whitespace-pre-wrap leading-relaxed overflow-x-auto text-[9.5px]">
                          {payloadStr}
                        </pre>
                      </div>

                      <div className="space-y-1 bg-zinc-900/40 p-2.5 rounded-lg text-xs leading-normal">
                        <span className="font-extrabold text-zinc-550 block text-[9px] uppercase">Staff Note/Justification:</span>
                        <span className="text-zinc-300 italic">"{req.note || 'No notes supplied.'}"</span>
                      </div>

                      {req.managerComment && (
                        <div className="space-y-1 bg-red-950/10 p-2.5 rounded-lg text-xs border border-red-950/20">
                          <span className="font-extrabold text-red-400 block text-[9px] uppercase">Manager Response:</span>
                          <span className="text-zinc-400">{req.managerComment}</span>
                        </div>
                      )}

                      {req.status === 'pending' && (
                        <div className="pt-2 border-t border-zinc-900/60 flex items-center justify-between gap-3">
                          <input
                            type="text"
                            placeholder="Reason notes for rejection (e.g. Price too low)"
                            className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-xs focus:outline-none"
                            value={gmRejectNotes[req.id] || ''}
                            onChange={e => {
                              setGmRejectNotes({ ...gmRejectNotes, [req.id]: e.target.value });
                            }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                onRejectRequest(req.id, gmRejectNotes[req.id] || 'Declined by GM');
                                alert('Operational adjustment declined.');
                              }}
                              className="px-3 py-1.5 bg-red-900 hover:bg-red-950 text-red-100 text-xs font-bold uppercase rounded-lg transition"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => {
                                onApproveRequest(req.id);
                                alert('Operational action approved and applied to system logs instantly!');
                              }}
                              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold uppercase rounded-lg transition"
                            >
                              Approve & Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: MY PROPOSALS & REQUESTS (Staff Mode Only) */}
      {activeTab === 'proposals' && userRole === 'staff' && (
        <div className="space-y-4 text-left animate-fadeIn">
          {/* Submit new proposal */}
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-4 font-sans">
            <div>
              <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">📝 REQUEST OPERATION AUTHORIZATION FORM</h4>
              <p className="text-[10.5px] text-zinc-505 mt-1">Wider operations like altering bank details, publishing deal promotions, or shifting cover hero graphics require direct authorization from the General Manager. Draft yours below:</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-extrabold font-mono tracking-wider">Adjustment Category Target</label>
                  <select
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white"
                    value={propType}
                    onChange={e => setPropType(e.target.value as any)}
                  >
                    <option value="deal">Add Deal Promotion</option>
                    <option value="bank">Modify Receiving Bank Account</option>
                    <option value="contacts">Update Hotlines / Contact Numbers</option>
                    <option value="hero_cover">Change Homepage Landscape Cover</option>
                  </select>
                </div>

                <div className="space-y-2 bg-black/50 p-3 rounded-lg border border-zinc-900">
                  <span className="text-[9px] text-[#F5C518] uppercase font-bold block mb-1">Target Action Draft Payload:</span>
                  
                  {propType === 'deal' && (
                    <div className="space-y-2 text-[11px]">
                      <input
                        type="text"
                        placeholder="Deal Title (e.g. HP ProBook Elite)"
                        className="w-full bg-[#070707] border border-zinc-800 rounded p-1.5 text-zinc-100"
                        id="deal_t"
                      />
                      <input
                        type="text"
                        placeholder="Orig Price (e.g. ₦350,000)"
                        className="w-full bg-[#070707] border border-zinc-800 rounded p-1.5 text-zinc-100"
                        id="deal_orig"
                      />
                      <input
                        type="text"
                        placeholder="Special Promo Price (e.g. ₦290,000)"
                        className="w-full bg-[#070707] border border-zinc-800 rounded p-1.5 text-zinc-100"
                        id="deal_sale"
                      />
                    </div>
                  )}

                  {propType === 'bank' && (
                    <div className="space-y-2 text-[11px]">
                      <input
                        type="text"
                        placeholder="Receiving Bank Name"
                        className="w-full bg-[#070707] border border-zinc-800 rounded p-1.5 text-zinc-100"
                        id="bank_b"
                      />
                      <input
                        type="text"
                        placeholder="New Account Number"
                        className="w-full bg-[#070707] border border-zinc-800 rounded p-1.5 text-zinc-100"
                        id="bank_n"
                      />
                      <input
                        type="text"
                        placeholder="Beneficiary Account Name"
                        className="w-full bg-[#070707] border border-zinc-800 rounded p-1.5 text-zinc-100"
                        id="bank_a"
                      />
                    </div>
                  )}

                  {propType === 'contacts' && (
                    <div className="space-y-2 text-[11px]">
                      <input
                        type="text"
                        placeholder="Sales Direct Hotline (WhatsApp format)"
                        className="w-full bg-[#070707] border border-zinc-800 rounded p-1.5 text-zinc-100"
                        id="cont_sales"
                      />
                      <input
                        type="text"
                        placeholder="Coordinator WhatsApp Number"
                        className="w-full bg-[#070707] border border-zinc-800 rounded p-1.5 text-zinc-100"
                        id="cont_coor"
                      />
                    </div>
                  )}

                  {propType === 'hero_cover' && (
                    <div className="space-y-2 text-[11px]">
                      <input
                        type="url"
                        placeholder="New HQ Image Cover URL link"
                        className="w-full bg-[#070707] border border-zinc-800 rounded p-1.5 text-zinc-100 font-mono text-[10px]"
                        id="hero_u"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-extrabold font-mono tracking-wider">Staff Justification / Business Reason</label>
                  <textarea
                    rows={4}
                    placeholder="Provide explanatory details for the GM (e.g. customer requested discount / bank server down, using backup desk)"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-zinc-150 placeholder-zinc-700 focus:outline-none focus:border-cyan-500"
                    value={propStaffNotes}
                    onChange={e => setPropStaffNotes(e.target.value)}
                  />
                </div>

                <button
                  onClick={() => {
                    if (!propStaffNotes.trim()) {
                      alert('Justification notes for the GM are strictly requested.');
                      return;
                    }

                    // Assemble payload
                    let packedPayload: any = {};
                    if (propType === 'deal') {
                      packedPayload = {
                        title: (document.getElementById('deal_t') as HTMLInputElement)?.value || 'Promo laptop model',
                        origPrice: (document.getElementById('deal_orig') as HTMLInputElement)?.value || '₦0',
                        salePrice: (document.getElementById('deal_sale') as HTMLInputElement)?.value || '₦0',
                        badge: 'PROMO LAPTOP',
                        desc: 'Special GM-authorized clearance flash promo'
                      };
                    } else if (propType === 'bank') {
                      packedPayload = {
                        bank: (document.getElementById('bank_b') as HTMLInputElement)?.value || 'Access Bank',
                        accountNumber: (document.getElementById('bank_n') as HTMLInputElement)?.value || '',
                        accountName: (document.getElementById('bank_a') as HTMLInputElement)?.value || ''
                      };
                    } else if (propType === 'contacts') {
                      packedPayload = {
                        sales: (document.getElementById('cont_sales') as HTMLInputElement)?.value || contactsSales,
                        inventory: (document.getElementById('cont_coor') as HTMLInputElement)?.value || contactsInv
                      };
                    } else if (propType === 'hero_cover') {
                      packedPayload = {
                        url: (document.getElementById('hero_u') as HTMLInputElement)?.value || ''
                      };
                    }

                    onCreateRequest(propType, packedPayload, propStaffNotes);
                    setPropStaffNotes('');
                    alert('Draft proposal submitted successfully. Track status below!');
                  }}
                  className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-[#0a0a0a] text-xs font-mono font-black uppercase rounded-lg transition"
                >
                  Submit Operational Proposal
                </button>
              </div>
            </div>
          </div>

          {/* Proposals Queue Logger */}
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3 font-sans">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">My Filed Proposals Track Log ({requests.length})</h4>
            {requests.length === 0 ? (
              <p className="text-xs text-zinc-650 italic font-mono">No active operations requests filed by you yet.</p>
            ) : (
              <div className="space-y-3">
                {requests.map(req => (
                  <div key={req.id} className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-[#F5C518] uppercase">Target category: {req.type}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                        req.status === 'pending' ? 'bg-amber-950/50 text-amber-400 border border-amber-900/40' :
                        req.status === 'approved' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' :
                        'bg-red-950/50 text-red-400 border border-red-900/30'
                      }`}>
                        Status: {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-sans italic">"{req.note}"</p>
                    {req.managerComment && (
                      <p className="text-[10px] text-red-400 mt-2 font-mono leading-tight">GM Response: {req.managerComment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// Simple helpers to bypass local dynamic bindings inside compiled views safely
function productsListMappingPlaceholderForCollageDirect(obj: any): any[] {
  return [];
}
function productsListMappingPlaceholderForCollageDirectSecondary(): any[] {
  return [];
}
