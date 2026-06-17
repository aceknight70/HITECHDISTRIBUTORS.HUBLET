/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Image, Sun, Radio, Wrench, Tag, ListCollapse, FileText, Bot, 
  Contact as ContactIcon, ShieldCheck, MapPin, Star, ShieldAlert, Cpu, Landmark,
  Send, Plus, Minus, Trash2, Home, MessageSquare, Laptop, Printer, Monitor,
  Camera, Shield, Wifi, Tv, ShoppingBag, Sparkles, Upload, Search,
  Edit, Pencil, Lock, Unlock, Check, X
} from 'lucide-react';

import { Product, SolarProduct, RepairRecord, GMRequest, Deal, Review, AppState } from './types';
import { 
  CATS, PRODS, SOLAR, DEFAULT_DEALS, GALLERY_PHOTOS, WA_SALES, WA_INVENTORY, WA_GM, WA_GEN, DEF_PIN, MGR_KEY, STORE 
} from './data';

import SolarSizingTool from './components/SolarSizingTool';
import InfoBoothRoom from './components/InfoBoothRoom';
import StaffRoom from './components/StaffRoom';
import ProductDetailOverlay, { getDefaultProductImage } from './components/ProductDetailOverlay';
import { getAccessToken, appendSaleLog, appendRepairRecord } from './lib/sheetsService';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { compressImage } from './lib/imageCompressor';
import { uploadImageToCDNOrLocal } from './lib/cloudinaryService';

export default function App() {
  // Navigation: "landing" | "main-app"
  const [view, setView] = useState<'landing' | 'main-app'>('landing');
  const [currentRoom, setCurrentRoom] = useState<string>('showroom');
  const [activeCategory, setActiveCategory] = useState<string | null>(null); // for Showroom item collection
  const [solarFilter, setSolarFilter] = useState<string>('All');

  // Typewriter HITECH landing letters
  const [typewriterLetters, setTypewriterLetters] = useState<string[]>([]);
  
  // App Dynamic State (persisted inside client localStorage)
  const [cart, setCart] = useState<{ [productId: number]: number }>({});
  const [solarCart, setSolarCart] = useState<{ [solarId: string]: number }>({});
  
  const [productsList, setProductsList] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem('ht_products');
      return stored ? JSON.parse(stored) : PRODS;
    } catch {
      return PRODS;
    }
  });
  const [solarProductsList, setSolarProductsList] = useState<SolarProduct[]>(() => {
    try {
      const stored = localStorage.getItem('ht_solar_products');
      return stored ? JSON.parse(stored) : SOLAR;
    } catch {
      return SOLAR;
    }
  });
  const [dealsList, setDealsList] = useState<Deal[]>(DEFAULT_DEALS);

  // Database handlers for product management
  const handleSaveProduct = async (prod: Product) => {
    let nextList;
    if (productsList.some(p => p.id === prod.id)) {
      nextList = productsList.map(p => p.id === prod.id ? prod : p);
    } else {
      nextList = [...productsList, prod];
    }
    setProductsList(nextList);

    // Sync updates to corresponding gallery photos
    const nextPhotos = galleryPhotos.map(photo => {
      if (photo.productCode === prod.pn) {
        return {
          ...photo,
          label: prod.n,
          sub: prod.sp,
          price: prod.price
        };
      }
      return photo;
    });
    if (JSON.stringify(nextPhotos) !== JSON.stringify(galleryPhotos)) {
      saveGalleryPhotosToStorage(nextPhotos);
    }

    try {
      localStorage.setItem('ht_products', JSON.stringify(nextList));
      await setDoc(doc(db, 'products', String(prod.id)), prod);
    } catch (e) {
      console.warn("Error saving product to Cloud Firestore: ", e);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const nextList = productsList.filter(p => p.id !== id);
    setProductsList(nextList);
    try {
      localStorage.setItem('ht_products', JSON.stringify(nextList));
      await deleteDoc(doc(db, 'products', String(id)));
    } catch (e) {
      console.warn("Error deleting product from Cloud Firestore: ", e);
    }
  };

  const handleSaveSolarProduct = async (solar: SolarProduct) => {
    let nextList;
    if (solarProductsList.some(s => s.id === solar.id)) {
      nextList = solarProductsList.map(s => s.id === solar.id ? solar : s);
    } else {
      nextList = [...solarProductsList, solar];
    }
    setSolarProductsList(nextList);

    // Sync updates to corresponding gallery photos
    const nextPhotos = galleryPhotos.map(photo => {
      if (photo.productCode === solar.id) {
        return {
          ...photo,
          label: solar.n,
          sub: solar.sp,
          price: solar.price
        };
      }
      return photo;
    });
    if (JSON.stringify(nextPhotos) !== JSON.stringify(galleryPhotos)) {
      saveGalleryPhotosToStorage(nextPhotos);
    }

    try {
      localStorage.setItem('ht_solar_products', JSON.stringify(nextList));
      await setDoc(doc(db, 'solar_products', solar.id), solar);
    } catch (e) {
      console.warn("Error saving solar product to Cloud Firestore: ", e);
    }
  };

  const handleDeleteSolarProduct = async (id: string) => {
    const nextList = solarProductsList.filter(s => s.id !== id);
    setSolarProductsList(nextList);
    try {
      localStorage.setItem('ht_solar_products', JSON.stringify(nextList));
      await deleteDoc(doc(db, 'solar_products', id));
    } catch (e) {
      console.warn("Error deleting solar product from Cloud Firestore: ", e);
    }
  };

  const handleSaveGalleryPhoto = async (updatedPhoto: any) => {
    if (updatedPhoto.isVirtual) {
      // It's a virtual photo generated from product specifications, so update the source product!
      const codeVal = updatedPhoto.productCode;
      const matchedItem = [
        ...productsList
          .filter(p => p.pn && p.pn !== '—')
          .map(p => ({
            code: p.pn,
            name: p.n,
            spec: p.sp,
            price: p.price,
            desc: p.desc || '',
            idVal: p.id,
            type: 'standard' as const,
            origin: p
          })),
        ...solarProductsList
          .map(s => ({
            code: s.id,
            name: s.n,
            spec: s.sp,
            price: s.price,
            desc: s.desc || '',
            idVal: s.id,
            type: 'solar' as const,
            origin: s
          }))
      ].find(item => item.code === codeVal);

      if (matchedItem) {
        if (matchedItem.type === 'solar') {
          const updatedProduct = {
            ...matchedItem.origin,
            n: updatedPhoto.label,
            sp: updatedPhoto.sub,
            price: updatedPhoto.price,
            imageUrl: updatedPhoto.url
          } as SolarProduct;
          await handleSaveSolarProduct(updatedProduct);
        } else {
          const updatedProduct = {
            ...matchedItem.origin,
            n: updatedPhoto.label,
            sp: updatedPhoto.sub,
            price: updatedPhoto.price,
            imageUrl: updatedPhoto.url
          } as Product;
          await handleSaveProduct(updatedProduct);
        }
        alert("✅ Source product specifications and showcase image updated successfully!");
      } else {
        alert("Could not find matching product code to bind specs to.");
      }
      return;
    }

    // Otherwise, update the dedicated gallery item
    const nextPhotos = galleryPhotos.map(p => {
      if (String(p.id) === String(updatedPhoto.id)) {
        return {
          id: String(updatedPhoto.id),
          url: updatedPhoto.url,
          fallbackUrl: updatedPhoto.fallbackUrl || updatedPhoto.url,
          label: updatedPhoto.label,
          sub: updatedPhoto.sub || '',
          productCode: updatedPhoto.productCode || '',
          price: updatedPhoto.price || '',
          isCustom: !!updatedPhoto.isCustom
        };
      }
      return p;
    });
    setGalleryPhotos(nextPhotos);
    localStorage.setItem('ht_gallery_photos', JSON.stringify(nextPhotos));

    try {
      const docToSend = {
        id: String(updatedPhoto.id),
        url: updatedPhoto.url,
        fallbackUrl: updatedPhoto.fallbackUrl || updatedPhoto.url,
        label: updatedPhoto.label,
        sub: updatedPhoto.sub || '',
        productCode: updatedPhoto.productCode || '',
        price: updatedPhoto.price || '',
        isCustom: !!updatedPhoto.isCustom
      };
      await setDoc(doc(db, 'gallery', String(updatedPhoto.id)), docToSend);
      alert("✅ Showcase gallery card updated successfully!");
    } catch (err) {
      console.warn("Failed to write edited gallery image:", err);
      alert("⚠️ Offline: Saved changes locally.");
    }
  };

  // Staff Direct Mode states
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('ht_staff_login') === 'true';
    } catch {
      return false;
    }
  });
  const [staffRole, setStaffRole] = useState(() => {
    try {
      return localStorage.getItem('ht_staff_role') || 'staff';
    } catch {
      return 'staff';
    }
  });

  // Direct modal/forms for inline action pipeline
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingSolar, setEditingSolar] = useState<SolarProduct | null>(null);
  const [editingGallery, setEditingGallery] = useState<any | null>(null);
  const [showCreateProductModal, setShowCreateProductModal] = useState<boolean>(false);
  const [createProductCat, setCreateProductCat] = useState<string>('laptops');
  const [showCreateGalleryModal, setShowCreateGalleryModal] = useState<boolean>(false);
  const [showDirectLoginModal, setShowDirectLoginModal] = useState<boolean>(false);
  const [directPinInput, setDirectPinInput] = useState<string>('');
  const [directLoginError, setDirectLoginError] = useState<string>('');
  const [directUploading, setDirectUploading] = useState<boolean>(false);

  useEffect(() => {
    const handleSync = () => {
      try {
        const logged = localStorage.getItem('ht_staff_login') === 'true';
        const r = localStorage.getItem('ht_staff_role') || 'staff';
        if (logged !== isStaffLoggedIn) setIsStaffLoggedIn(logged);
        if (r !== staffRole) setStaffRole(r);
      } catch (e) {
        // Safe fallback
      }
    };
    const timer = setInterval(handleSync, 500);

    // Sync products and solar products from Firestore realtime
    let unsubP = () => {};
    let unsubS = () => {};
    try {
      unsubP = onSnapshot(collection(db, 'products'), (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Product);
        });
        if (list.length > 0) {
          list.sort((a, b) => a.id - b.id);
          setProductsList(list);
          localStorage.setItem('ht_products', JSON.stringify(list));
        } else {
          // Empty on Firestore – seed initial PRODS
          PRODS.forEach((p) => {
            setDoc(doc(db, 'products', String(p.id)), p).catch((e) => {
              console.warn("Seeding product failed: ", e);
            });
          });
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'products');
      });

      unsubS = onSnapshot(collection(db, 'solar_products'), (snapshot) => {
        const list: SolarProduct[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as SolarProduct);
        });
        if (list.length > 0) {
          setSolarProductsList(list);
          localStorage.setItem('ht_solar_products', JSON.stringify(list));
        } else {
          // Empty on Firestore – seed initial SOLAR
          SOLAR.forEach((s) => {
            setDoc(doc(db, 'solar_products', s.id), s).catch((e) => {
              console.warn("Seeding solar product failed: ", e);
            });
          });
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'solar_products');
      });
    } catch (e) {
      console.warn("Snapshots setup failed: ", e);
    }

    return () => {
      clearInterval(timer);
      unsubP();
      unsubS();
    };
  }, [isStaffLoggedIn, staffRole]);

  const [repairsList, setRepairsList] = useState<RepairRecord[]>([]);
  const [gmqList, setGmqList] = useState<GMRequest[]>([]);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [mgrStatus, setMgrStatus] = useState<'available' | 'busy'>('available');
  
  const [bankAccount, setBankAccount] = useState({
    bank: 'Access Bank PLC',
    accountNumber: '1482993021',
    accountName: 'HiTech Distributors Nigeria'
  });

  const [openingPhotoUrl, setOpeningPhotoUrl] = useState(() => {
    return localStorage.getItem('ht_opening_photo') || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80';
  });
  
  const [liveEmbedUrl, setLiveEmbedUrl] = useState(() => {
    return localStorage.getItem('ht_live_embed') || 'https://www.youtube.com/embed/live_stream?channel=UC...';
  });

  const [contacts, setContacts] = useState(() => {
    try {
      const stored = localStorage.getItem('ht_contacts');
      if (stored) {
        const parsed = JSON.parse(stored);
        // If the parsed state contains old dummy default placeholder values, migrate them immediately!
        if (
          parsed.sales === '2348030000000' || 
          parsed.inventory === '2348030000001' ||
          parsed.general === '2348030000002' ||
          parsed.gm === '2348030000003'
        ) {
          return {
            sales: WA_SALES,
            inventory: WA_INVENTORY,
            general: WA_GEN,
            gm: WA_GM
          };
        }
        return parsed;
      }
      return {
        sales: WA_SALES,
        inventory: WA_INVENTORY,
        general: WA_GEN,
        gm: WA_GM
      };
    } catch {
      return {
        sales: WA_SALES,
        inventory: WA_INVENTORY,
        general: WA_GEN,
        gm: WA_GM
      };
    }
  });

  const [requestsList, setRequestsList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('ht_requests');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [cloudinaryConfig, setCloudinaryConfig] = useState<{ cloudName: string; uploadPreset: string }>(() => {
    try {
      const saved = localStorage.getItem('ht_cloudinary_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      cloudName: (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || '',
      uploadPreset: (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || ''
    };
  });

  const [galleryVideos, setGalleryVideos] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('ht_videos');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('ht_spreadsheet_id') || '';
  });

  const handleUpdateSpreadsheetId = (id: string) => {
    setSpreadsheetId(id);
    localStorage.setItem('ht_spreadsheet_id', id);
  };

  const [activeManagerTab, setActiveManagerTab] = useState<'sales' | 'inventory' | 'gm'>('sales');

  // Client info for Invoice checkout
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // Contact / Message input boxes
  const [quickMessageText, setQuickMessageText] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');

  // GM Connect form
  const [gmRequestType, setGmRequestType] = useState<GMRequest['type']>('Business Partnership/Distributorship');
  const [gmMessage, setGmMessage] = useState('');
  const [gmContactTime, setGmContactTime] = useState('Morning (8am-12pm)');

  // Repair Submission Form
  const [repType, setRepType] = useState<RepairRecord['type']>('Laptop');
  const [repBrand, setRepBrand] = useState('');
  const [repDesc, setRepDesc] = useState('');
  const [repCustName, setRepCustName] = useState('');
  const [repCustPhone, setRepCustPhone] = useState('');
  const [triageLoading, setTriageLoading] = useState(false);

  // Repair tracking search
  const [searchRef, setSearchRef] = useState('');
  const [trackedRepair, setTrackedRepair] = useState<RepairRecord | null>(null);
  const [trackError, setTrackError] = useState('');

  // Custom feedback inputs
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // Selected item detail modal
  const [selectedProduct, setSelectedProduct] = useState<Product | SolarProduct | null>(null);
  const [imageCache, setImageCache] = useState<{ [key: string]: string }>(() => {
    try {
      const persistedI = localStorage.getItem('ht_img_cache');
      return persistedI ? JSON.parse(persistedI) : {};
    } catch {
      return {};
    }
  });

  const [galleryPhotos, setGalleryPhotos] = useState<any[]>(() => {
    try {
      const persistedG = localStorage.getItem('ht_gallery_photos');
      const parsed = persistedG ? JSON.parse(persistedG) : GALLERY_PHOTOS;
      return parsed.map((photo: any) => ({
        id: String(photo.id),
        url: photo.url,
        label: photo.label,
        sub: photo.sub || '',
        productCode: photo.productCode || '',
        price: photo.price || '',
        isCustom: !!photo.isCustom
      }));
    } catch {
      return GALLERY_PHOTOS.map((photo: any) => ({
        id: String(photo.id),
        url: photo.url,
        label: photo.label,
        sub: photo.sub || '',
        productCode: photo.productCode || '',
        price: photo.price || '',
        isCustom: !!photo.isCustom
      }));
    }
  });

  const handleUpdateImageCache = (key: string, val: string) => {
    setImageCache(prev => {
      const next = { ...prev, [key]: val };
      localStorage.setItem('ht_img_cache', JSON.stringify(next));
      return next;
    });
  };

  const saveGalleryPhotosToStorage = async (updatedPhotos: any[]) => {
    const formatted = updatedPhotos.map((photo: any) => {
      const item: any = {
        id: String(photo.id),
        url: photo.url,
        label: photo.label,
        sub: photo.sub || '',
        productCode: photo.productCode || '',
        price: photo.price || '',
        isCustom: !!photo.isCustom
      };
      if (photo.fallbackUrl) {
        item.fallbackUrl = photo.fallbackUrl;
      }
      return item;
    });

    setGalleryPhotos(formatted);
    localStorage.setItem('ht_gallery_photos', JSON.stringify(formatted));
    
    // Save each photo to Firestore
    for (const photo of formatted) {
      try {
        await setDoc(doc(db, 'gallery', String(photo.id)), photo);
      } catch (err) {
        console.warn("Gallery cloud sync notice (operating in local fallback): ", err);
      }
    }
  };

  // Gallery view dedicated state controls
  const [gallerySelectedCode, setGallerySelectedCode] = useState<string>('');
  const [gallerySearchQuery, setGallerySearchQuery] = useState<string>('');
  const [galleryTab, setGalleryTab] = useState<'all' | 'showcase' | 'custom' | 'manage_products'>('all');

  // Staff direct product index managers
  const [manageInventoryType, setManageInventoryType] = useState<'standard' | 'solar'>('standard');
  const [productSearchTerm, setProductSearchTerm] = useState<string>('');
  const [productCatFilter, setProductCatFilter] = useState<string>('All');
  const [createProductType, setCreateProductType] = useState<'standard' | 'solar'>('standard');
  const [newProductForm, setNewProductForm] = useState<Partial<Product>>({ pn: '', n: 'Unmade', cat: 'laptops', sp: '', price: 'CALL', desc: '' });
  const [newSolarForm, setNewSolarForm] = useState<Partial<SolarProduct>>({ id: '', cat: 'Inverters', n: '', brand: '', sp: '', price: '₦', desc: '' });

  // Typewriter sequence
  useEffect(() => {
    if (view === 'landing') {
      setTypewriterLetters([]);
      const nameStr = "HITECH";
      let i = 0;
      const timer = setInterval(() => {
        if (i < nameStr.length) {
          const charToAppend = nameStr[i];
          setTypewriterLetters(prev => [...prev, charToAppend]);
          i++;
        } else {
          clearInterval(timer);
        }
      }, 250);
      return () => clearInterval(timer);
    }
  }, [view]);

  // Load non-Firestore state from local storage
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
      console.error("Storage loading error:", e);
    }
  }, []);

  // 1. Synchronize Reviews Collection from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      if (snapshot.empty) {
        // Seed default reviews to Firestore
        const defaultReviews: Review[] = [
          { id: '1', name: 'Engr. Emeka Warri', rating: 5, text: 'The hybrid inverter systems here are highly reliable. Great services from the solar technicians!', timestamp: '2026-06-10' },
          { id: '2', name: 'Sarah O.', rating: 5, text: 'Got my HP ProBook. Excellent commercial standard, original with full local warranty.', timestamp: '2026-06-12' }
        ];
        defaultReviews.forEach(async (rev) => {
          try {
            await setDoc(doc(db, 'reviews', rev.id), rev);
          } catch (err) {
            console.warn("Reviews seeding notice (operating in local fallback): ", err);
          }
        });
        setReviewsList(defaultReviews);
      } else {
        const items: Review[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as Review);
        });
        items.sort((a, b) => b.id.localeCompare(a.id));
        setReviewsList(items);
        localStorage.setItem('ht_rev', JSON.stringify(items));
      }
    }, (error) => {
      // Graceful local offline fallback
      try {
        const persistedRev = localStorage.getItem('ht_rev');
        if (persistedRev) {
          setReviewsList(JSON.parse(persistedRev));
        } else {
          const defaultReviews: Review[] = [
            { id: '1', name: 'Engr. Emeka Warri', rating: 5, text: 'The hybrid inverter systems here are highly reliable. Great services from the solar technicians!', timestamp: '2026-06-10' },
            { id: '2', name: 'Sarah O.', rating: 5, text: 'Got my HP ProBook. Excellent commercial standard, original with full local warranty.', timestamp: '2026-06-12' }
          ];
          setReviewsList(defaultReviews);
        }
      } catch (err) {
        console.warn("Reviews offline fallback notice: ", err);
      }
      handleFirestoreError(error, OperationType.LIST, 'reviews');
    });
    return () => unsub();
  }, []);

  // 2. Synchronize Repairs Collection from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'repairs'), (snapshot) => {
      const items: RepairRecord[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as RepairRecord);
      });
      items.sort((a, b) => b.id.localeCompare(a.id));
      setRepairsList(items);
      localStorage.setItem('ht_repairs', JSON.stringify(items));
    }, (error) => {
      // Graceful local offline fallback
      try {
        const persistedR = localStorage.getItem('ht_repairs');
        if (persistedR) {
          setRepairsList(JSON.parse(persistedR));
        } else {
          setRepairsList([]);
        }
      } catch (err) {
        console.warn("Repairs offline fallback notice: ", err);
      }
      handleFirestoreError(error, OperationType.LIST, 'repairs');
    });
    return () => unsub();
  }, []);

  // 3. Synchronize GM Queue (gmq) Collection from Firestore
  useEffect(() => {
    let unsub: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (unsub) {
        unsub();
        unsub = undefined;
      }

      if (user) {
        // Authenticated users (staff members) subscribe to the gmq Firestore collection
        unsub = onSnapshot(collection(db, 'gmq'), (snapshot) => {
          const items: GMRequest[] = [];
          snapshot.forEach((doc) => {
            items.push(doc.data() as GMRequest);
          });
          items.sort((a, b) => b.id.localeCompare(a.id));
          setGmqList(items);
          localStorage.setItem('ht_gmq', JSON.stringify(items));
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'gmq');
        });
      } else {
        // Unauthenticated guests read and write to their own local GMQueue list in localStorage
        try {
          const persistedG = localStorage.getItem('ht_gmq');
          if (persistedG) {
            setGmqList(JSON.parse(persistedG));
          } else {
            setGmqList([]);
          }
        } catch (err) {
          console.warn("GM Queue offline fallback notice: ", err);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsub) unsub();
    };
  }, []);

  // 4. Synchronize Gallery Collection from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      if (snapshot.empty) {
        // Seed default GALLERY_PHOTOS with formatted properties matching security rules
        const formattedList = GALLERY_PHOTOS.map((photo) => ({
          id: String(photo.id),
          url: photo.url,
          label: photo.label,
          sub: photo.sub || '',
          productCode: photo.productCode || '',
          price: photo.price || '',
          isCustom: !!photo.isCustom
        }));

        formattedList.forEach(async (photo) => {
          try {
            await setDoc(doc(db, 'gallery', photo.id), photo);
          } catch (err) {
            console.warn("Gallery seeding notice (operating in local fallback): ", err);
          }
        });
        setGalleryPhotos(formattedList);
      } else {
        const items: any[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: String(data.id || doc.id),
            url: data.url || '',
            fallbackUrl: data.fallbackUrl || '',
            label: data.label || '',
            sub: data.sub || '',
            productCode: data.productCode || '',
            price: data.price || '',
            isCustom: !!data.isCustom
          });
        });

        // Dynamic self-healing seed synchronisation for new product catalog images
        const outOfSyncDefaults = GALLERY_PHOTOS.filter(defP => {
          const fetched = items.find(item => String(item.id) === String(defP.id));
          return !fetched; // ONLY seed if missing entirely from database to prevent overwriting edits
        }).map(p => ({
          id: String(p.id),
          url: p.url,
          label: p.label,
          sub: p.sub || '',
          productCode: p.productCode || '',
          price: p.price || '',
          isCustom: !!p.isCustom
        }));

        if (outOfSyncDefaults.length > 0) {
          outOfSyncDefaults.forEach(async (photo) => {
            try {
              await setDoc(doc(db, 'gallery', photo.id), photo);
            } catch (err) {
              console.warn("Seeding or updating default gallery item: ", err);
            }
          });
          // Update the local list with correct items
          outOfSyncDefaults.forEach(photo => {
            const idx = items.findIndex(item => String(item.id) === String(photo.id));
            if (idx > -1) {
              items[idx] = photo;
            } else {
              items.push(photo);
            }
          });
        }

        items.sort((a, b) => {
          const aCustom = !!a.isCustom;
          const bCustom = !!b.isCustom;
          if (aCustom && !bCustom) return -1;
          if (!aCustom && bCustom) return 1;
          if (aCustom && bCustom) {
            return b.id.localeCompare(a.id);
          }
          const aIdx = GALLERY_PHOTOS.findIndex(p => String(p.id) === String(a.id));
          const bIdx = GALLERY_PHOTOS.findIndex(p => String(p.id) === String(b.id));
          if (aIdx > -1 && bIdx > -1) {
            return aIdx - bIdx;
          }
          if (aIdx > -1) return -1;
          if (bIdx > -1) return 1;
          return b.id.localeCompare(a.id);
        });
        setGalleryPhotos(items);
        localStorage.setItem('ht_gallery_photos', JSON.stringify(items));
      }
    }, (error) => {
      // Graceful local offline fallback
      try {
        const persistedG = localStorage.getItem('ht_gallery_photos');
        if (persistedG) {
          setGalleryPhotos(JSON.parse(persistedG));
        } else {
          const formattedList = GALLERY_PHOTOS.map((photo) => ({
            id: String(photo.id),
            url: photo.url,
            label: photo.label,
            sub: photo.sub || '',
            productCode: photo.productCode || '',
            price: photo.price || '',
            isCustom: !!photo.isCustom
          }));
          setGalleryPhotos(formattedList);
        }
      } catch (err) {
        console.warn("Gallery offline fallback notice: ", err);
      }
      handleFirestoreError(error, OperationType.LIST, 'gallery');
    });
    return () => unsub();
  }, []);

  // 5. Synchronize Custom Operational Collections from Firestore
  useEffect(() => {
    // A. Requests Proposal Queue
    const unsubReq = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      items.sort((a, b) => b.id.localeCompare(a.id));
      setRequestsList(items);
      localStorage.setItem('ht_requests', JSON.stringify(items));
    }, (error) => {
      console.warn("Requests live sync fallback: ", error);
    });

    // B. Short Video Catalog
    const unsubVid = onSnapshot(collection(db, 'videos'), (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      items.sort((a, b) => b.id.localeCompare(a.id));
      setGalleryVideos(items);
      localStorage.setItem('ht_videos', JSON.stringify(items));
    }, (error) => {
      console.warn("Videos live sync fallback: ", error);
    });

    // C. Live Settings Control Panel
    const unsubConf = onSnapshot(collection(db, 'app_config'), (snapshot) => {
      snapshot.forEach((docSnap) => {
        const id = docSnap.id;
        const data = docSnap.data();
        if (id === 'hero_photo') {
          if (data.url) {
            setOpeningPhotoUrl(data.url);
            localStorage.setItem('ht_opening_photo', data.url);
          }
        } else if (id === 'live_embed') {
          if (data.url) {
            setLiveEmbedUrl(data.url);
            localStorage.setItem('ht_live_embed', data.url);
          }
        } else if (id === 'contacts') {
          setContacts(data);
          localStorage.setItem('ht_contacts', JSON.stringify(data));
        } else if (id === 'cloudinary') {
          const configVal = {
            cloudName: data.cloudName || '',
            uploadPreset: data.uploadPreset || ''
          };
          setCloudinaryConfig(configVal);
          localStorage.setItem('ht_cloudinary_config', JSON.stringify(configVal));
        }
      });
    }, (error) => {
      console.warn("App config live sync fallback: ", error);
    });

    return () => {
      unsubReq();
      unsubVid();
      unsubConf();
    };
  }, []);

  // Save to local storage triggers
  const saveCartToStorage = (updatedCart: any) => {
    setCart(updatedCart);
    localStorage.setItem('ht_cart', JSON.stringify(updatedCart));
  };

  const saveSolarCartToStorage = (updatedSolarCart: any) => {
    setSolarCart(updatedSolarCart);
    localStorage.setItem('ht_solar_cart', JSON.stringify(updatedSolarCart));
  };

  const handleUpdateProducts = async (updatedProds: Product[]) => {
    setProductsList(updatedProds);
    localStorage.setItem('ht_products', JSON.stringify(updatedProds));

    const currentIds = productsList.map(p => String(p.id));
    const nextIds = updatedProds.map(p => String(p.id));
    const toDelete = currentIds.filter(id => !nextIds.includes(id));

    for (const deleteId of toDelete) {
      try {
        await deleteDoc(doc(db, 'products', deleteId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `products/${deleteId}`);
      }
    }

    for (const prod of updatedProds) {
      try {
        await setDoc(doc(db, 'products', String(prod.id)), prod);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `products/${prod.id}`);
      }
    }
  };

  const handleUpdateSolarProducts = async (updatedSolars: SolarProduct[]) => {
    setSolarProductsList(updatedSolars);
    localStorage.setItem('ht_solar_products', JSON.stringify(updatedSolars));

    const currentIds = solarProductsList.map(s => s.id);
    const nextIds = updatedSolars.map(s => s.id);
    const toDelete = currentIds.filter(id => !nextIds.includes(id));

    for (const deleteId of toDelete) {
      try {
        await deleteDoc(doc(db, 'solar_products', deleteId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `solar_products/${deleteId}`);
      }
    }

    for (const solar of updatedSolars) {
      try {
        await setDoc(doc(db, 'solar_products', solar.id), solar);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `solar_products/${solar.id}`);
      }
    }
  };

  const handleUpdateRepairs = async (updatedRepairs: RepairRecord[]) => {
    setRepairsList(updatedRepairs);
    localStorage.setItem('ht_repairs', JSON.stringify(updatedRepairs));
    
    // Sync each record individually
    for (const record of updatedRepairs) {
      try {
        await setDoc(doc(db, 'repairs', record.id), record);
      } catch (err) {
        console.warn("Failed to sync repair ticket (operating in local fallback): ", err);
      }
    }
  };

  const handleUpdateGmq = async (updatedGmq: GMRequest[]) => {
    setGmqList(updatedGmq);
    localStorage.setItem('ht_gmq', JSON.stringify(updatedGmq));

    // Sync each record individually
    for (const record of updatedGmq) {
      try {
        await setDoc(doc(db, 'gmq', record.id), record);
      } catch (err) {
        console.warn("Failed to sync GM request (operating in local fallback): ", err);
      }
    }
  };

  const handleUpdateBankAccount = (account: typeof bankAccount) => {
    setBankAccount(account);
    localStorage.setItem('ht_bank_acc', JSON.stringify(account));
  };

  const handleAddCustomDeal = (deal: Deal) => {
    const updated = [deal, ...dealsList];
    setDealsList(updated);
    localStorage.setItem('ht_deals', JSON.stringify(updated));
  };

  // Operational Request handlers (Manager authorization pipeline)
  const handleCreateRequest = async (type: string, payload: any, note: string) => {
    const id = 'req_' + Date.now();
    const newRequest = {
      id,
      type,
      payload: typeof payload === 'object' ? JSON.stringify(payload) : payload,
      note,
      status: 'pending' as const,
      submittedAt: new Date().toISOString(),
      managerComment: ''
    };

    // Update locally
    const updated = [newRequest, ...requestsList];
    setRequestsList(updated);
    localStorage.setItem('ht_requests', JSON.stringify(updated));

    // Save to Firestore
    try {
      await setDoc(doc(db, 'requests', id), newRequest);
    } catch (err) {
      console.warn("Requests cloud write notice (offline sync): ", err);
    }
  };

  const handleApproveRequest = async (id: string) => {
    if (id === 'auto_execute') return; // bypassing for instantaneous manager direct changes

    const reqToApprove = requestsList.find(r => r.id === id);
    if (!reqToApprove) return;

    let parsedPayload = reqToApprove.payload;
    try {
      if (typeof parsedPayload === 'string') {
        parsedPayload = JSON.parse(parsedPayload);
      }
    } catch (e) {
      console.warn("Could not parse payload as JSON, applying raw string.", e);
    }

    // Apply the operational data parameters live based on category target
    if (reqToApprove.type === 'deal') {
      const dealObj = {
        id: 'deal_' + Date.now(),
        title: parsedPayload.title || 'Special authorized promo',
        origPrice: parsedPayload.origPrice || '₦0',
        salePrice: parsedPayload.salePrice || '₦0',
        badge: parsedPayload.badge || 'FLASH DEAL',
        desc: parsedPayload.desc || 'Manager permitted showroom special clearance slot'
      };
      handleAddCustomDeal(dealObj);
    } else if (reqToApprove.type === 'bank') {
      const bankObj = {
        bank: parsedPayload.bank || 'Access Bank PLC',
        accountNumber: parsedPayload.accountNumber || '',
        accountName: parsedPayload.accountName || ''
      };
      handleUpdateBankAccount(bankObj);
    } else if (reqToApprove.type === 'contacts') {
      const updatedContacts = {
        sales: parsedPayload.sales || contacts.sales,
        inventory: parsedPayload.inventory || contacts.inventory,
        general: contacts.general,
        gm: contacts.gm
      };
      handleUpdateContacts(updatedContacts);
    } else if (reqToApprove.type === 'hero_cover') {
      handleUpdateOpeningPhoto(parsedPayload.url || '');
    } else if (reqToApprove.type === 'gallery_collage') {
      // Build a gallery item from collage metadata
      const newCollagePhoto = {
        id: parsedPayload.id || 'col_' + Date.now(),
        url: parsedPayload.url || '',
        label: parsedPayload.label || 'Interactive Collage',
        sub: parsedPayload.sub || '',
        productCode: parsedPayload.productCode || '',
        price: parsedPayload.price || '',
        isCustom: true
      };
      saveGalleryPhotosToStorage([newCollagePhoto, ...galleryPhotos]);
    }

    // Mark status as 'approved'
    const updatedRequests = requestsList.map(r => r.id === id ? { ...r, status: 'approved' as const } : r);
    setRequestsList(updatedRequests);
    localStorage.setItem('ht_requests', JSON.stringify(updatedRequests));

    try {
      await setDoc(doc(db, 'requests', id), { ...reqToApprove, status: 'approved' as const });
    } catch (err) {
      console.warn("Requests cloud updates failed (offline mode):", err);
    }
  };

  const handleRejectRequest = async (id: string, notes: string) => {
    const updatedRequests = requestsList.map(r => r.id === id ? { ...r, status: 'rejected' as const, managerComment: notes } : r);
    setRequestsList(updatedRequests);
    localStorage.setItem('ht_requests', JSON.stringify(updatedRequests));

    const reqToReject = requestsList.find(r => r.id === id);
    if (reqToReject) {
      try {
        await setDoc(doc(db, 'requests', id), { ...reqToReject, status: 'rejected' as const, managerComment: notes });
      } catch (err) {
        console.warn("Requests cloud reject notice:", err);
      }
    }
  };

  const handleUpdateOpeningPhoto = async (url: string) => {
    setOpeningPhotoUrl(url);
    localStorage.setItem('ht_opening_photo', url);
    try {
      await setDoc(doc(db, 'app_config', 'hero_photo'), { url });
    } catch (err) {
      console.warn("Hero cover cloud update offline fallback: ", err);
    }
  };

  const handleUpdateLiveEmbedUrl = async (url: string) => {
    setLiveEmbedUrl(url);
    localStorage.setItem('ht_live_embed', url);
    try {
      await setDoc(doc(db, 'app_config', 'live_embed'), { url });
    } catch (err) {
      console.warn("Live stream embed url cloud update offline fallback: ", err);
    }
  };

  const handleUpdateContacts = async (newContacts: typeof contacts) => {
    setContacts(newContacts);
    localStorage.setItem('ht_contacts', JSON.stringify(newContacts));
    try {
      await setDoc(doc(db, 'app_config', 'contacts'), newContacts);
    } catch (err) {
      console.warn("Contacts configurations cloud update offline fallback: ", err);
    }
  };

  const handleUpdateCloudinaryConfig = async (config: { cloudName: string; uploadPreset: string }) => {
    setCloudinaryConfig(config);
    localStorage.setItem('ht_cloudinary_config', JSON.stringify(config));
    try {
      await setDoc(doc(db, 'app_config', 'cloudinary'), config);
    } catch (err) {
      console.warn("Cloudinary configuration cloud update offline fallback: ", err);
    }
  };

  const handleAddVideo = async (vid: { url: string; title: string; desc?: string }) => {
    const id = 'vid_' + Date.now();
    const newVideo = { id, ...vid };
    const updated = [newVideo, ...galleryVideos];
    setGalleryVideos(updated);
    localStorage.setItem('ht_videos', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'videos', id), newVideo);
    } catch (err) {
      console.warn("Videos cloud write fallback: ", err);
    }
  };

  const handleRemoveVideo = async (id: string) => {
    const updated = galleryVideos.filter(v => v.id !== id);
    setGalleryVideos(updated);
    localStorage.setItem('ht_videos', JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, 'videos', id));
    } catch (err) {
      console.warn("Videos cloud delete fallback: ", err);
    }
  };

  // Add to standard cart
  const addToCart = (productId: number, qty = 1) => {
    const nextCart = { ...cart, [productId]: (cart[productId] || 0) + qty };
    saveCartToStorage(nextCart);
  };

  // Add to solar cart
  const addToSolarCart = (solarId: string, qty = 1) => {
    const nextSolarCart = { ...solarCart, [solarId]: (solarCart[solarId] || 0) + qty };
    saveSolarCartToStorage(nextSolarCart);
  };

  const removeFromCart = (id: number) => {
    const nextCart = { ...cart };
    delete nextCart[id];
    saveCartToStorage(nextCart);
  };

  const removeSolarFromCart = (id: string) => {
    const nextSolarCart = { ...solarCart };
    delete nextSolarCart[id];
    saveSolarCartToStorage(nextSolarCart);
  };

  const adjustQty = (id: number, offset: number) => {
    const val = (cart[id] || 0) + offset;
    if (val <= 0) {
      removeFromCart(id);
    } else {
      saveCartToStorage({ ...cart, [id]: val });
    }
  };

  const adjustSolarQty = (id: string, offset: number) => {
    const val = (solarCart[id] || 0) + offset;
    if (val <= 0) {
      removeSolarFromCart(id);
    } else {
      saveSolarCartToStorage({ ...solarCart, [id]: val });
    }
  };

  const clearAllCarts = () => {
    saveCartToStorage({});
    saveSolarCartToStorage({});
  };

  // Compute standard totals
  const standardCartItems = Object.entries(cart).map(([pId, qty]) => {
    const product = productsList.find(p => p.id === parseInt(pId));
    return { product, qty: qty as number };
  }).filter(item => item.product);

  const solarCartItems = Object.entries(solarCart).map(([sId, qty]) => {
    const sol = solarProductsList.find(s => s.id === sId);
    return { product: sol, qty: qty as number };
  }).filter(item => item.product);

  const totalItemsCount = (standardCartItems.reduce((acc, cr) => acc + cr.qty, 0) as number) + 
                          (solarCartItems.reduce((acc, cr) => acc + cr.qty, 0) as number);

  const calculateTotalPrice = () => {
    let total = 0;
    standardCartItems.forEach(item => {
      if (item.product && item.product.price !== 'CALL') {
        const val = parseInt(item.product.price.replace(/[^\d]/g, '')) || 0;
        total += val * (item.qty as number);
      }
    });
    solarCartItems.forEach(item => {
      if (item.product) {
        const val = parseInt(item.product.price.replace(/[^\d]/g, '')) || 0;
        total += val * (item.qty as number);
      }
    });
    return total;
  };

  // WhatsApp helper
  const openWhatsAppLink = (number: string, text: string) => {
    const cleanNum = number.replace(/[^\d]/g, '');
    const url = `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Submit standard message forms
  const handleSendMessage = (targetRole: 'sales' | 'inventory') => {
    if (!quickName || !quickPhone || !quickMessageText) {
      alert("Please enter Name, Phone, and your Message details to proceed.");
      return;
    }
    const formatted = `HiTech Emporium Inquiry:
Name: ${quickName}
Phone: ${quickPhone}
Message: ${quickMessageText}`;

    const num = targetRole === 'sales' ? contacts.sales : contacts.inventory;
    openWhatsAppLink(num, formatted);
    setQuickMessageText('');
  };

  // Submit GM proposal
  const handleSubmitGMRequest = async () => {
    if (!gmMessage || !quickName || !quickPhone) {
      alert("Message, Name, and Phone contact information are absolute requirements.");
      return;
    }
    const record: GMRequest = {
      id: 'gmq_' + Date.now(),
      type: gmRequestType,
      msg: gmMessage,
      name: quickName,
      phone: quickPhone,
      preferredTime: gmContactTime,
      ts: new Date().toLocaleTimeString(),
      status: 'pending'
    };
    const nextQ = [record, ...gmqList];
    setGmqList(nextQ);
    localStorage.setItem('ht_gmq', JSON.stringify(nextQ));
    
    // Save to Firestore
    try {
      await setDoc(doc(db, 'gmq', record.id), record);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'gmq/' + record.id);
    }

    // Clear
    setGmMessage('');
    alert(`General Manager proposal filed! Your request reference is queued. Our GM division will review during: ${gmContactTime}.`);
  };

  // Enter Showroom CTA
  const enterStore = () => {
    setView('main-app');
    setCurrentRoom('showroom');
    setActiveCategory(null);
  };

  // Submit Repair Triage Form
  const handleRepairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repBrand || !repCustPhone || !repCustName) {
      alert("Device Brand, Owner Name, and Owner Phone are required.");
      return;
    }

    setTriageLoading(true);

    let triageReportObj = null;

    try {
      // Call Gemini Triage endpoint
      const res = await fetch('/api/gemini/repair-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemDescription: repDesc, deviceType: repType })
      });
      triageReportObj = await res.json();
    } catch (err) {
      console.error(err);
    }

    const nRepair: RepairRecord = {
      id: 'REP-' + Date.now().toString().slice(-4),
      type: repType,
      brand: repBrand,
      problem: repDesc,
      name: repCustName,
      phone: repCustPhone,
      ref: '', // Wait for staff assignment
      status: 'Received',
      submitted: new Date().toLocaleDateString(),
      stages: ['Received'],
      aiTriage: triageReportObj ? {
        category: triageReportObj.faultCategory,
        complexity: triageReportObj.estimatedComplexity,
        explanation: triageReportObj.explanation
      } : undefined
    };

    const nextRepairs = [nRepair, ...repairsList];
    handleUpdateRepairs(nextRepairs);

    // Sync to Google Sheets if connected and authorized
    const tsToken = getAccessToken();
    if (spreadsheetId && tsToken) {
      appendRepairRecord(tsToken, spreadsheetId, nRepair).catch(err => console.error("Sheets repair logging error:", err));
    }

    // Clear
    setRepBrand('');
    setRepDesc('');
    
    alert(`Repair requested! Customer Name: ${repCustName}. Please backup your unit prior to dropoff at 6 Airport Road.`);
    setTriageLoading(false);
  };

  // Track ticket
  const handleTrackRepairItem = () => {
    setTrackError('');
    setTrackedRepair(null);

    if (!searchRef.trim()) return;

    const matched = repairsList.find(r => r.ref.toLowerCase() === searchRef.trim().toLowerCase());
    if (matched) {
      setTrackedRepair(matched);
    } else {
      setTrackError('No registered ticket matches this reference block. (e.g. Try to register one in staff tab with a ref tag)');
    }
  };

  // Write new feedback review
  const handlePostReview = async () => {
    if (!reviewName || !reviewText) return;
    const nReview: Review = {
      id: 'rev_' + Date.now(),
      name: reviewName,
      rating: reviewRating,
      text: reviewText,
      timestamp: new Date().toISOString().split('T')[0]
    };
    const nextReviews = [nReview, ...reviewsList];
    setReviewsList(nextReviews);
    localStorage.setItem('ht_rev', JSON.stringify(nextReviews));

    // Save to Firestore
    try {
      await setDoc(doc(db, 'reviews', nReview.id), nReview);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'reviews/' + nReview.id);
    }

    setReviewName('');
    setReviewText('');
    alert('Thank you! Your feedback star rating helps us improve services.');
  };

  // Category view triggers
  const getCatIcon = (iconName: string) => {
    switch (iconName) {
      case 'Laptop': return <Laptop className="w-4 h-4 text-zinc-400" />;
      case 'Printer': return <Printer className="w-4 h-4 text-zinc-400" />;
      case 'Monitor': return <Monitor className="w-4 h-4 text-zinc-400" />;
      case 'Camera': return <Camera className="w-4 h-4 text-zinc-400" />;
      case 'Shield': return <Shield className="w-4 h-4 text-zinc-400" />;
      case 'Wifi': return <Wifi className="w-4 h-4 text-zinc-400" />;
      case 'Tv': return <Tv className="w-4 h-4 text-zinc-400" />;
      default: return <ShoppingBag className="w-4 h-4 text-zinc-400" />;
    }
  };

  // Build Invoice WhatsApp details
  const triggerInvoiceOrder = () => {
    if (!clientName || !clientPhone) {
      alert("Recipient Name and Phone are absolute necessities for invoice generation!");
      return;
    }
    const totalPrice = calculateTotalPrice();
    const invCode = 'INV-' + Math.floor(1000 + Math.random() * 9000);
    
    let text = `HiTech Distributors - Invoice Statement ${invCode}\n`;
    text += `Client: ${clientName} (${clientPhone})\n`;
    if (clientAddress) text += `Address: ${clientAddress}\n`;
    text += `--------------------------------\n`;

    standardCartItems.forEach(item => {
      text += `· ${item.product?.n} x${item.qty} - ${item.product?.price}\n`;
    });
    solarCartItems.forEach(item => {
      text += `· ${item.product?.n} x${item.qty} - ${item.product?.price}\n`;
    });

    text += `--------------------------------\n`;
    text += `Grand Total: ₦${totalPrice.toLocaleString()}\n`;
    text += `Bank Account details:\nBank: ${bankAccount.bank}\nNo: ${bankAccount.accountNumber}\nName: ${bankAccount.accountName}\n`;
    text += `Please send payment confirmation screenshot to retrieve items.`;

    // Automatically append sale log to linked Google Sheet (if authorized)
    const tsToken = getAccessToken();
    if (spreadsheetId && tsToken) {
      const itemsSummary = [
        ...standardCartItems.map(item => `${item.product?.n} (x${item.qty})`),
        ...solarCartItems.map(item => `${item.product?.n} (x${item.qty})`)
      ].join(', ');
      
      appendSaleLog(tsToken, spreadsheetId, {
        invoiceCode: invCode,
        clientName,
        phone: clientPhone,
        address: clientAddress,
        itemsSummary,
        totalPrice,
        paymentAcc: `${bankAccount.bank} - ${bankAccount.accountNumber}`
      }).catch(err => console.error("Sheets sales syncing error:", err));
    }

    openWhatsAppLink(contacts.sales, text);
  };

  return (
    <div id="app" className="w-full min-h-screen bg-[#0d0d0d] relative flex flex-col overflow-x-hidden font-sans">
      
      {/* ----------------- LANDING PAGE ----------------- */}
      {view === 'landing' && (
        <div id="landing" className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-br from-[#0a0a0a] via-[#0D1B2A] to-[#040D1A] min-h-screen text-[#f5f5f5] select-none text-center relative overflow-hidden">
          {/* Subtle Decorative Ambient Radial glows */}
          <div className="absolute top-[-50px] left-[-50px] w-48 h-48 rounded-full bg-red-600/10 blur-[80px]" />
          <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 rounded-full bg-blue-600/10 blur-[80px]" />

          {/* Header branding */}
          <div className="pt-10 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse"></span>
              <span className="text-[10px] uppercase text-zinc-400 tracking-[0.2em] font-mono">HiTech Distributors</span>
            </div>
            
            {/* HITECH Spell out glowing */}
            <div className="h-20 flex items-center justify-center font-bold tracking-tight text-6xl select-none mt-2">
              {typewriterLetters.map((char, index) => {
                const isHi = index < 2; // H, I in red
                return (
                  <span 
                    key={index}
                    className={`transition-all duration-300 font-extrabold ${isHi ? 'text-[#CC0000] drop-shadow-[0_0_10px_rgba(204,0,0,0.5)]' : 'text-[#1C3FA8] drop-shadow-[0_0_10px_rgba(28,63,168,0.5)]'}`}
                  >
                    {char}
                  </span>
                );
              })}
            </div>
            <p className="text-xs uppercase text-zinc-300 tracking-[0.3em] font-light mt-1">EMPORIUM</p>
            <p className="text-[10px] text-zinc-500 tracking-[0.1em] mt-3 bg-zinc-900/50 px-3 py-1 rounded border border-zinc-800">
              Computers · Office Equipment · Solar Sizing Hub
            </p>
          </div>

          <div className="my-6">
            <img 
              src={openingPhotoUrl} 
              alt="Showroom" 
              className="w-full max-h-[160px] object-cover rounded-xl filter border border-zinc-800 shadow-md brightness-75 scale-95 hover:scale-100 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Quick Category tags */}
          <div className="flex flex-wrap justify-center gap-1.5 px-2">
            {['Laptops', 'Printers', 'Solar', 'Desktops', 'Cameras', 'CCTV', 'Networking'].map(t => (
              <span key={t} className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded cursor-default uppercase font-bold tracking-wide">
                {t}
              </span>
            ))}
          </div>

          {/* CTA & Footer */}
          <div className="pb-10 space-y-4">
            <button 
              onClick={enterStore}
              className="w-full py-3.5 bg-gradient-to-r from-[#CC0000] via-[#990000] to-[#CC0000] hover:scale-[1.02] transform transition-all shadow-xl font-bold uppercase text-xs tracking-wider border border-red-700/30 text-white rounded-lg flex items-center justify-center gap-1.5"
            >
              Enter Showroom →
            </button>
            <p className="text-[9px] text-zinc-500">
              6 Airport Road, Warri · Delta State, Nigeria · 08032175552
            </p>
          </div>
        </div>
      )}

      {/* ----------------- CORE APP VIEW ----------------- */}
      {view === 'main-app' && (
        <div id="main-app" className="flex-1 flex flex-col justify-between pb-16">
          
          {/* FIXED TOPBAR */}
          <header id="topboard" className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#262626] z-40 p-3 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setView('landing')}
                className="p-1 hover:text-[#F5C518] transition-colors"
                title="Go Home"
              >
                <Home className="w-4 h-4 text-zinc-400 hover:text-white" />
              </button>
              <div className="h-4 w-[1px] bg-zinc-800"></div>
              <div className="flex items-center gap-1 font-bold">
                <span className="text-[#CC0000]">HI</span>
                <span className="text-[#1C3FA8] font-mono">TECH</span>
              </div>
            </div>

            {/* Room Indicator Pill */}
            <div className="bg-[#CC0000]/10 border border-red-500/20 text-[#CC0000] px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
              {currentRoom}
            </div>
          </header>

          {/* ----------------- ROOMS PORTAL ----------------- */}
          <div className="flex-1 min-h-[calc(100vh-120px)]">

            {/* ROOM 1: SHOWROOM CATEGORIES */}
            {currentRoom === 'showroom' && (
              <div className="p-4 space-y-4">
                {activeCategory ? (
                  /* Expanded category products list */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                      <button 
                        onClick={() => setActiveCategory(null)}
                        className="text-xs text-[#F5C518] hover:underline flex items-center gap-1 font-semibold"
                      >
                        ← Showroom Categories
                      </button>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold">
                        {activeCategory} ({productsList.filter(p => p.cat === activeCategory).length} items)
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {productsList.filter(p => p.cat === activeCategory).map(prod => (
                        <div 
                          key={prod.id} 
                          className="bg-[#141414] border border-[#262626] p-3 rounded-xl flex items-center gap-3 hover:border-zinc-700 transition"
                        >
                          <div
                            onClick={() => setSelectedProduct(prod)}
                            className="flex-1 cursor-pointer min-w-0"
                          >
                            <h4 className="text-xs font-bold text-zinc-200 truncate">{prod.n}</h4>
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{prod.sp}</p>
                            <span className="text-xs text-[#F5C518] font-mono font-bold mt-1 inline-block">{prod.price}</span>
                          </div>
                          
                          <div className="shrink-0 flex items-center gap-1.5">
                            {prod.price !== 'CALL' && (
                              <button 
                                onClick={() => {
                                  addToCart(prod.id);
                                  alert(`Added ${prod.n} to cart`);
                                }}
                                className="px-2 py-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded text-[11px] font-bold transition-all"
                              >
                                + Cart
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedProduct(prod)}
                              className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
                              title="Details"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Standard 9 Categories List grid */
                  <div className="space-y-4">
                    <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl text-center">
                      <h2 className="text-xs font-mono font-bold uppercase tracking-[0.15em] text-zinc-400">HiTech Emporium</h2>
                      <p className="text-xl font-bold text-[#f5f5f5] mt-1 pr-1 font-serif">Original Quality Computers</p>
                      <p className="text-[10px] text-zinc-500 mt-1">6 Airport Road, Warri · Delta State, Nigeria</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {CATS.map(cat => {
                        const count = productsList.filter(p => p.cat === cat.id).length;
                        return (
                          <div 
                            key={cat.id} 
                            onClick={() => setActiveCategory(cat.id)}
                            className="bg-[#141414] border border-[#262626] p-3 rounded-xl cursor-pointer hover:border-zinc-700 transition flex flex-col justify-between aspect-[1.1]"
                          >
                            <div className="flex justify-between items-start">
                              <div className="p-1.5 bg-black/40 rounded-lg">
                                {getCatIcon(cat.icon || 'ShoppingBag')}
                              </div>
                              <span className="text-[9px] text-[#F5C518] uppercase bg-amber-500/10 px-1 py-0.2 rounded font-bold font-mono">
                                {count} Items
                              </span>
                            </div>
                            <div className="mt-2 text-left">
                              <h3 className="text-xs font-bold text-zinc-200">{cat.name}</h3>
                              <p className="text-[9px] text-zinc-500 truncate mt-0.5">{cat.description}</p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Explicit clean 10th Solar Hub tile links */}
                      <div 
                        onClick={() => setCurrentRoom('solar')}
                        className="col-span-2 bg-[#141414] border-t-2 border-[#F5C518]/60 border border-[#262626] p-3 rounded-xl cursor-pointer hover:border-[#F5C518]/70 transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Sun className="text-[#F5C518] w-5 h-5 flex-shrink-0" />
                          <div className="text-left">
                            <h3 className="text-xs font-bold text-zinc-100 uppercase">☀ Solar Equipment Sizing Hub</h3>
                            <p className="text-[10px] text-zinc-400">Inverters, Lithium batteries, Panels matching tools</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-[#F5C518]">{solarProductsList.length} products</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ROOM 2: GALLERY STOCK FEED */}
            {currentRoom === 'gallery' && (() => {
              // Retrieve all authentic product-codes available from databases
              const allProductCodes = [
                ...productsList
                  .filter(p => p.pn && p.pn !== '—')
                  .map(p => ({
                    code: p.pn,
                    name: p.n,
                    spec: p.sp,
                    price: p.price,
                    desc: p.desc,
                    idVal: p.id,
                    type: 'standard' as const,
                    origin: p
                  })),
                ...solarProductsList
                  .map(s => ({
                    code: s.id,
                    name: s.n,
                    spec: s.sp,
                    price: s.price,
                    desc: s.desc || '',
                    idVal: s.id,
                    type: 'solar' as const,
                    origin: s
                  }))
              ];

              // Build dynamic virtual gallery items from active products with custom images to attach catalog to showcase
              const productGalleryItems = allProductCodes
                .filter(p => p.origin.imageUrl && !galleryPhotos.some(g => g.productCode === p.code))
                .map(p => ({
                  id: `prod_gal_${p.idVal}`,
                  url: p.origin.imageUrl || '',
                  fallbackUrl: p.origin.imageUrl || '',
                  label: p.name,
                  sub: p.spec,
                  productCode: p.code,
                  price: p.price,
                  isCustom: true,
                  isVirtual: true
                }));

              const combinedPhotos = [...galleryPhotos, ...productGalleryItems];

              const filteredPhotos = combinedPhotos.filter(photo => {
                if (galleryTab === 'showcase') return !photo.isCustom;
                if (galleryTab === 'custom') return photo.isCustom;
                return true; // 'all'
              }).filter(photo => {
                if (!gallerySearchQuery.trim()) return true;
                const query = gallerySearchQuery.toLowerCase();
                return (
                  photo.label.toLowerCase().includes(query) ||
                  photo.sub.toLowerCase().includes(query) ||
                  photo.productCode.toLowerCase().includes(query)
                );
              });

              const selectedItem = allProductCodes.find(item => item.code === gallerySelectedCode);



              const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (!file || !selectedItem) return;

                const reader = new FileReader();
                reader.onloadend = async () => {
                  const dataUrl = reader.result as string;
                  try {
                    // Compress image client-side to make it lightweight
                    const compressedBase64 = await compressImage(dataUrl);

                    const finalUrl = await uploadImageToCDNOrLocal(file.name, compressedBase64, cloudinaryConfig);

                    const newPhoto = {
                      id: 'gal_' + Date.now(),
                      url: finalUrl,
                      fallbackUrl: compressedBase64,
                      label: selectedItem.name,
                      sub: selectedItem.spec,
                      productCode: selectedItem.code,
                      price: selectedItem.price,
                      isCustom: true
                    };
                    const nextPhotos = [newPhoto, ...galleryPhotos];
                    saveGalleryPhotosToStorage(nextPhotos);

                    // Update product imageCache
                    handleUpdateImageCache(selectedItem.idVal.toString(), finalUrl);
                    alert(`📤 Photo successfully uploaded & bound to Product Code [${selectedItem.code}]!`);
                  } catch (err) {
                    console.error("Gallery cloud-free photo file saving fell back to local base64 storage:", err);
                    const compressedFallback = await compressImage(dataUrl);
                    const newPhoto = {
                      id: 'gal_' + Date.now(),
                      url: compressedFallback,
                      fallbackUrl: compressedFallback,
                      label: selectedItem.name,
                      sub: selectedItem.spec,
                      productCode: selectedItem.code,
                      price: selectedItem.price,
                      isCustom: true
                    };
                    const nextPhotos = [newPhoto, ...galleryPhotos];
                    saveGalleryPhotosToStorage(nextPhotos);

                    // Update product imageCache
                    handleUpdateImageCache(selectedItem.idVal.toString(), compressedFallback);
                    alert(`📥 Photo saved (cloud database fallback) & bound to Product Code [${selectedItem.code}]!`);
                  }
                };
                reader.readAsDataURL(file);
              };

              const deleteCustomPhoto = async (id: string | number, code?: string) => {
                const isVirtual = String(id).startsWith('prod_gal_');
                if (isVirtual) {
                  if (window.confirm("Are you sure you want to remove this photo from the product's specifications sheet?")) {
                    const matchedItem = allProductCodes.find(item => item.code === code);
                    if (matchedItem) {
                      if (matchedItem.type === 'solar') {
                        const updated = { ...matchedItem.origin, imageUrl: '' } as SolarProduct;
                        await handleSaveSolarProduct(updated);
                      } else {
                        const updated = { ...matchedItem.origin, imageUrl: '' } as Product;
                        await handleSaveProduct(updated);
                      }
                      alert("📷 Product image removed successfully!");
                    }
                  }
                  return;
                }

                if (window.confirm("Are you sure you want to remove this product image from the showcase?")) {
                  const filtered = galleryPhotos.filter(p => p.id !== id);
                  saveGalleryPhotosToStorage(filtered);
                  
                  // Delete from Firestore
                  try {
                    await deleteDoc(doc(db, 'gallery', String(id)));
                  } catch (err) {
                    console.warn("Failed to delete gallery item from Firestore (operating fallback state):", err);
                  }
                  
                  // Optionally remove from image cache
                  if (code) {
                    const matchedItem = allProductCodes.find(item => item.code === code);
                    if (matchedItem) {
                      const nextCache = { ...imageCache };
                      delete nextCache[matchedItem.idVal.toString()];
                      localStorage.setItem('ht_img_cache', JSON.stringify(nextCache));
                      setImageCache(nextCache);
                    }
                  }
                }
              };

              return (
                <div className="p-4 space-y-4">
                  <div className="text-center relative">
                    <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Workspace Portfolios</h2>
                    <p className="text-md font-serif font-bold text-zinc-300">Authorized Distribution Exhibition</p>
                    {isStaffLoggedIn && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3 text-amber-500 animate-pulse" />
                        Direct Control Active ({staffRole})
                      </div>
                    )}
                  </div>

                  {/* SEARCH AND QUICK-BIND ACCESSORY BAR */}
                  {galleryTab !== 'manage_products' && (
                    <div className="bg-[#121212] border border-[#212121] rounded-xl p-3 space-y-2.5 text-left animate-fade-in shadow-md">
                      <div className="flex flex-col sm:flex-row gap-2">
                        {/* Interactive Grid Search Bar */}
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                          <input
                            type="text"
                            placeholder="Search showcase photos, specs or codes..."
                            value={gallerySearchQuery}
                            onChange={e => setGallerySearchQuery(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 focus:border-zinc-700 py-1.5 pl-8 pr-3 rounded-lg text-[10px] text-zinc-100 placeholder-zinc-500 outline-none font-sans"
                            id="gallery-search-input"
                          />
                          {gallerySearchQuery && (
                            <button
                              onClick={() => setGallerySearchQuery('')}
                              className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-350 text-[10px] font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Direct Control Bind Area for Admins / Staff */}
                        {isStaffLoggedIn && (
                          <div className="flex gap-1.5 shrink-0">
                            <select
                              value={gallerySelectedCode}
                              onChange={e => setGallerySelectedCode(e.target.value)}
                              className="bg-zinc-950 border border-zinc-900 rounded-lg py-1 px-2.5 text-[10px] text-[#F5C518] outline-none font-mono"
                            >
                              <option value="">-- Code to Bind --</option>
                              {allProductCodes.map(item => (
                                <option key={item.code} value={item.code}>
                                  {item.code} - {item.name.slice(0, 15)}...
                                </option>
                              ))}
                            </select>

                            <label className={`py-1 px-2.5 rounded-lg text-[10px] font-extrabold uppercase flex items-center gap-1 cursor-pointer transition-all ${
                              gallerySelectedCode 
                                ? 'bg-[#F5C518] text-black hover:bg-amber-400' 
                                : 'bg-zinc-900 text-zinc-600 border border-zinc-850 cursor-not-allowed'
                            }`}>
                              <Upload className="w-3 h-3" />
                              <span>Link Upload</span>
                              {gallerySelectedCode && (
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleFileUpload}
                                />
                              )}
                            </label>
                          </div>
                        )}
                      </div>
                      {isStaffLoggedIn && !gallerySelectedCode && (
                        <p className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider">
                          💡 SELECT A PRODUCT CODE ABOVE TO QUICK-UPLOAD PHOTO INSTANTLY BONDED TO SPEC SHEET
                        </p>
                      )}
                    </div>
                  )}

                  {/* GALLERY GALLERY FEED SUB-TABS */}
                  <div className="flex gap-1.5 text-[9px] uppercase font-bold border-b border-[#262626] pb-2 pt-2 overflow-x-auto scrollbar-none">
                    {[
                      { id: 'all', label: 'All Photos' },
                      { id: 'showcase', label: 'Store Showcase' },
                      { id: 'custom', label: 'Product Code Photos' },
                      ...(isStaffLoggedIn ? [{ id: 'manage_products', label: 'Manage Inventory' }] : [])
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setGalleryTab(tab.id as any)}
                        className={`pb-1 px-1 transition shrink-0 relative ${
                          galleryTab === tab.id 
                            ? 'text-[#F5C518] font-extrabold border-b-2 border-[#F5C518]' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {tab.label} ({
                          tab.id === 'showcase' 
                            ? combinedPhotos.filter(p => !p.isCustom).length 
                            : tab.id === 'custom' 
                              ? combinedPhotos.filter(p => p.isCustom).length 
                              : tab.id === 'manage_products'
                                ? (productsList.length + solarProductsList.length)
                                : combinedPhotos.length
                        })
                      </button>
                    ))}
                  </div>

                  {galleryTab === 'manage_products' && isStaffLoggedIn ? (
                    /* DIRECT INVENTORY MANAGEMENT TAB */
                    <div className="space-y-4 text-left animate-fade-in">
                      {/* TYPE SELECTOR TOGGLE */}
                      <div className="flex bg-zinc-950 border border-zinc-900 rounded-lg p-1.5 gap-1 shadow-inner">
                        <button
                          type="button"
                          onClick={() => {
                            setManageInventoryType('standard');
                            setProductCatFilter('All');
                          }}
                          className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-md transition-colors ${
                            manageInventoryType === 'standard'
                              ? 'bg-[#F5C518] text-[#0a0a0a] font-extrabold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                          }`}
                        >
                          📦 Standard Systems
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setManageInventoryType('solar');
                            setProductCatFilter('All');
                          }}
                          className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-md transition-colors ${
                            manageInventoryType === 'solar'
                              ? 'bg-[#F5C518] text-[#0a0a0a] font-extrabold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                          }`}
                        >
                          ⚡ Solar Packages
                        </button>
                      </div>

                      {/* QUICK CREATE BUTTON & FILTERS */}
                      <div className="bg-[#141414] border border-[#212121] rounded-xl p-3 space-y-3">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
                            {manageInventoryType === 'standard' ? 'Standard Catalog' : 'Solar Catalog'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (manageInventoryType === 'standard') {
                                setNewProductForm({
                                  id: Date.now(),
                                  pn: 'HT-' + String(Date.now()).slice(-4),
                                  cat: 'laptops',
                                  n: 'Unmade',
                                  sp: 'System specification details pending customer confirmation',
                                  price: 'CALL',
                                  desc: 'Awaiting hardware specification sticker validation to populate model datasheet.'
                                });
                              } else {
                                setNewSolarForm({
                                  id: 'SOLAR-' + String(Date.now()).slice(-4),
                                  cat: 'Inverters',
                                  n: 'Unmade',
                                  brand: 'Generic',
                                  sp: 'Pure sine wave - specifications pending customer confirmation',
                                  price: '₦',
                                  desc: 'Awaiting model and capacity sticker details.'
                                });
                              }
                              setCreateProductType(manageInventoryType);
                              setShowCreateProductModal(true);
                            }}
                            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-[#F5C518] text-[9px] font-mono font-bold px-2.5 py-1 rounded flex items-center gap-1 uppercase transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Create Product Slot
                          </button>
                        </div>

                        {/* SEARCH & FILTER GROUP */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-zinc-500" />
                            <input
                              type="text"
                              placeholder="Search list..."
                              value={productSearchTerm}
                              onChange={e => setProductSearchTerm(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-900 p-1.5 pl-7 rounded text-[10px] text-zinc-200 outline-none focus:border-zinc-700 font-mono"
                            />
                          </div>

                          <select
                            value={productCatFilter}
                            onChange={e => setProductCatFilter(e.target.value)}
                            className="bg-zinc-950 border border-zinc-900 p-1.5 rounded text-[10px] text-zinc-200 outline-none focus:border-zinc-700 font-mono"
                          >
                            <option value="All">All Categories</option>
                            {manageInventoryType === 'standard' ? (
                              CATS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                            ) : (
                              ['Inverters', 'Lithium Batteries', 'Tubular Battery', 'Solar Panels', 'Controllers', 'Cables', 'All-in-One'].map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>

                      {/* INVENTORY LISTS */}
                      <div className="space-y-3">
                        {manageInventoryType === 'standard' ? (
                          (() => {
                            const filteredList = productsList.filter(p => {
                              const matchesSearch = p.n.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
                                p.pn.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                                p.sp.toLowerCase().includes(productSearchTerm.toLowerCase());
                              const matchesCat = productCatFilter === 'All' || p.cat === productCatFilter;
                              return matchesSearch && matchesCat;
                            });

                            if (filteredList.length === 0) {
                              return (
                                <div className="text-center py-8 text-zinc-600 font-mono text-[10px]">
                                  No products matched the active filters.
                                </div>
                              );
                            }

                            return filteredList.map(item => {
                              const boundPhoto = galleryPhotos.find(p => p.productCode === item.pn);
                              const isUnmade = item.n.toLowerCase() === 'unmade';

                              return (
                                <div key={item.id} className={`bg-[#121212] border border-[#212121] rounded-xl p-3 space-y-2 relative hover:border-zinc-700 transition-colors ${isUnmade ? 'shadow-lg border-amber-900/30' : ''}`}>
                                  {isUnmade && (
                                    <span className="absolute top-2 right-2 flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                  )}

                                  <div className="flex gap-2.5 items-start">
                                    {/* PHOTO STATE / Direct Image Drag/Select Upload box */}
                                    <div className="relative w-14 h-14 bg-zinc-950 border border-zinc-850 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer shrink-0">
                                      {boundPhoto ? (
                                        <>
                                          <img src={boundPhoto.url} alt="" className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <input 
                                              type="file" 
                                              accept="image/*"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onloadend = async () => {
                                                  const dataUrl = reader.result as string;
                                                  try {
                                                    const compressedBase64 = await compressImage(dataUrl);
                                                    const finalUrl = await uploadImageToCDNOrLocal(file.name, compressedBase64, cloudinaryConfig);
                                                    const nextPhotos = galleryPhotos.map(p => {
                                                      if (p.productCode === item.pn) {
                                                        return { ...p, url: finalUrl, fallbackUrl: compressedBase64 };
                                                      }
                                                      return p;
                                                    });
                                                    saveGalleryPhotosToStorage(nextPhotos);
                                                    handleUpdateImageCache(item.id.toString(), finalUrl);
                                                    alert("📷 Image changed & successfully synced!");
                                                  } catch {
                                                    const compressedFallback = await compressImage(dataUrl);
                                                    const nextPhotos = galleryPhotos.map(p => {
                                                      if (p.productCode === item.pn) {
                                                        return { ...p, url: compressedFallback, fallbackUrl: compressedFallback };
                                                      }
                                                      return p;
                                                    });
                                                    saveGalleryPhotosToStorage(nextPhotos);
                                                    handleUpdateImageCache(item.id.toString(), compressedFallback);
                                                    alert("📷 Image saved (local cache fallback)!");
                                                  }
                                                };
                                                reader.readAsDataURL(file);
                                              }}
                                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <Camera className="w-4 h-4 text-white" />
                                          </div>
                                        </>
                                      ) : (
                                        <div className="text-center group p-0 relative w-full h-full flex flex-col items-center justify-center">
                                          <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              const reader = new FileReader();
                                              reader.onloadend = async () => {
                                                const dataUrl = reader.result as string;
                                                try {
                                                  const compressedBase64 = await compressImage(dataUrl);
                                                  const finalUrl = await uploadImageToCDNOrLocal(file.name, compressedBase64, cloudinaryConfig);
                                                  const newPhoto = {
                                                    id: 'gal_' + Date.now(),
                                                    url: finalUrl,
                                                    fallbackUrl: compressedBase64,
                                                    label: item.n,
                                                    sub: item.sp,
                                                    productCode: item.pn,
                                                    price: item.price,
                                                    isCustom: true
                                                  };
                                                  saveGalleryPhotosToStorage([newPhoto, ...galleryPhotos]);
                                                  handleUpdateImageCache(item.id.toString(), finalUrl);
                                                  alert("📷 Image uploaded & bound successfully!");
                                                } catch {
                                                  const compressedFallback = await compressImage(dataUrl);
                                                  const newPhoto = {
                                                    id: 'gal_' + Date.now(),
                                                    url: compressedFallback,
                                                    fallbackUrl: compressedFallback,
                                                    label: item.n,
                                                    sub: item.sp,
                                                    productCode: item.pn,
                                                    price: item.price,
                                                    isCustom: true
                                                  };
                                                  saveGalleryPhotosToStorage([newPhoto, ...galleryPhotos]);
                                                  handleUpdateImageCache(item.id.toString(), compressedFallback);
                                                  alert("📷 Image uploaded (local fallback db synched)!");
                                                }
                                              };
                                              reader.readAsDataURL(file);
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                          />
                                          <Plus className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
                                          <span className="text-[6px] uppercase font-mono text-zinc-500 block mt-0.5">No Cover</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* INFO BLOCK */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-center gap-1.5">
                                        <h4 className={`text-xs font-bold leading-tight truncate ${isUnmade ? 'text-amber-500 font-extrabold' : 'text-zinc-100'}`}>
                                          {item.n}
                                        </h4>
                                        <span className="text-[8px] tracking-[0.05em] px-1.5 py-0.5 bg-zinc-950 text-[#F5C518] border border-zinc-900 font-mono font-bold rounded shrink-0">
                                          {item.pn}
                                        </span>
                                      </div>
                                      
                                      <p className="text-[9px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wide">
                                        Category: {item.cat}
                                      </p>
                                      
                                      <p className="text-[10px] text-zinc-400 font-mono leading-tight mt-1 line-clamp-1">
                                        Specs: {item.sp}
                                      </p>

                                      {isUnmade && (
                                        <div className="mt-1.5 flex items-center gap-1">
                                          <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wide">
                                            ⚠️ Unmade Specification Slot
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* FOOTER ACTIONS GROUP */}
                                  <div className="pt-2 border-t border-zinc-900 flex justify-between items-center">
                                    <span className="text-[10px] text-[#F5C518] font-bold font-mono">
                                      Price Tag: {item.price}
                                    </span>
                                    
                                    <div className="flex gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingProduct(item);
                                        }}
                                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold px-2 py-1 rounded text-[9px] flex items-center gap-1 transition uppercase"
                                      >
                                        <Pencil className="w-3 h-3 text-zinc-400" />
                                        Modify Setup
                                      </button>
                                      
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to delete product "${item.n}" matching code ${item.pn}?`)) {
                                            handleDeleteProduct(item.id);
                                          }
                                        }}
                                        className="bg-red-950/40 hover:bg-red-950/80 border border-red-900/40 text-red-300 font-bold px-2 py-1 rounded text-[9px] flex items-center gap-1 transition uppercase"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-400" />
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()
                        ) : (
                          (() => {
                            const filteredList = solarProductsList.filter(s => {
                              const matchesSearch = s.n.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
                                s.brand.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                                s.id.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                                s.sp.toLowerCase().includes(productSearchTerm.toLowerCase());
                              const matchesCat = productCatFilter === 'All' || s.cat === productCatFilter;
                              return matchesSearch && matchesCat;
                            });

                            if (filteredList.length === 0) {
                              return (
                                <div className="text-center py-8 text-zinc-600 font-mono text-[10px]">
                                  No solar packages matched the active filters.
                                </div>
                              );
                            }

                            return filteredList.map(item => {
                              const boundPhoto = galleryPhotos.find(p => p.productCode === item.id);
                              const isUnmade = item.n.toLowerCase() === 'unmade';

                              return (
                                <div key={item.id} className="bg-[#121212] border border-[#212121] rounded-xl p-3 space-y-2 relative hover:border-zinc-700 transition" id={`solar-${item.id}`}>
                                  <div className="flex gap-2.5 items-start">
                                    {/* PHOTO STATE / Direct Image Drag/Select Upload box */}
                                    <div className="relative w-14 h-14 bg-zinc-950 border border-zinc-850 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer shrink-0">
                                      {boundPhoto ? (
                                        <>
                                          <img src={boundPhoto.url} alt="" className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <input 
                                              type="file" 
                                              accept="image/*"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onloadend = async () => {
                                                  const dataUrl = reader.result as string;
                                                  try {
                                                    const compressedBase64 = await compressImage(dataUrl);
                                                    const finalUrl = await uploadImageToCDNOrLocal(file.name, compressedBase64, cloudinaryConfig);
                                                    const nextPhotos = galleryPhotos.map(p => {
                                                      if (p.productCode === item.id) {
                                                        return { ...p, url: finalUrl, fallbackUrl: compressedBase64 };
                                                      }
                                                      return p;
                                                    });
                                                    saveGalleryPhotosToStorage(nextPhotos);
                                                    handleUpdateImageCache(item.id, finalUrl);
                                                    alert("📷 Image changed & successfully synced!");
                                                  } catch {
                                                    const compressedFallback = await compressImage(dataUrl);
                                                    const nextPhotos = galleryPhotos.map(p => {
                                                      if (p.productCode === item.id) {
                                                        return { ...p, url: compressedFallback, fallbackUrl: compressedFallback };
                                                      }
                                                      return p;
                                                    });
                                                    saveGalleryPhotosToStorage(nextPhotos);
                                                    handleUpdateImageCache(item.id, compressedFallback);
                                                    alert("📷 Image saved (local cache fallback)!");
                                                  }
                                                };
                                                reader.readAsDataURL(file);
                                              }}
                                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <Camera className="w-4 h-4 text-white" />
                                          </div>
                                        </>
                                      ) : (
                                        <div className="text-center group p-0 relative w-full h-full flex flex-col items-center justify-center">
                                          <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              const reader = new FileReader();
                                              reader.onloadend = async () => {
                                                const dataUrl = reader.result as string;
                                                try {
                                                  const compressedBase64 = await compressImage(dataUrl);
                                                  const finalUrl = await uploadImageToCDNOrLocal(file.name, compressedBase64, cloudinaryConfig);
                                                  const newPhoto = {
                                                    id: 'gal_' + Date.now(),
                                                    url: finalUrl,
                                                    fallbackUrl: compressedBase64,
                                                    label: item.n,
                                                    sub: item.sp,
                                                    productCode: item.id,
                                                    price: item.price,
                                                    isCustom: true
                                                  };
                                                  saveGalleryPhotosToStorage([newPhoto, ...galleryPhotos]);
                                                  handleUpdateImageCache(item.id, finalUrl);
                                                  alert("📷 Image uploaded & bound successfully!");
                                                } catch {
                                                  const compressedFallback = await compressImage(dataUrl);
                                                  const newPhoto = {
                                                    id: 'gal_' + Date.now(),
                                                    url: compressedFallback,
                                                    fallbackUrl: compressedFallback,
                                                    label: item.n,
                                                    sub: item.sp,
                                                    productCode: item.id,
                                                    price: item.price,
                                                    isCustom: true
                                                  };
                                                  saveGalleryPhotosToStorage([newPhoto, ...galleryPhotos]);
                                                  handleUpdateImageCache(item.id, compressedFallback);
                                                  alert("📷 Image uploaded (local fallback db synched)!");
                                                }
                                              };
                                              reader.readAsDataURL(file);
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                          />
                                          <Plus className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200" />
                                          <span className="text-[6px] uppercase font-mono text-zinc-500 block mt-0.5">No Cover</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* INFO BLOCK */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-center gap-1.5">
                                        <h4 className="text-xs font-bold text-zinc-100 leading-tight truncate">
                                          {item.n}
                                        </h4>
                                        <span className="text-[8px] tracking-[0.05em] px-1.5 py-0.5 bg-zinc-950 text-[#F5C518] border border-zinc-900 font-mono font-bold rounded shrink-0 uppercase">
                                          {item.brand} ({item.id})
                                        </span>
                                      </div>
                                      <p className="text-[9px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wide">
                                        Category: {item.cat}
                                      </p>
                                      
                                      <p className="text-[10px] text-zinc-400 font-mono leading-tight mt-1 line-clamp-1">
                                        Specs: {item.sp}
                                      </p>
                                    </div>
                                  </div>

                                  {/* FOOTER ACTIONS GROUP */}
                                  <div className="pt-2 border-t border-zinc-900 flex justify-between items-center">
                                    <span className="text-[10px] text-[#F5C518] font-bold font-mono">
                                      Price Tag: {item.price}
                                    </span>
                                    
                                    <div className="flex gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingSolar(item);
                                        }}
                                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold px-2 py-1 rounded text-[9px] flex items-center gap-1 transition uppercase"
                                      >
                                        <Pencil className="w-3 h-3 text-zinc-400" />
                                        Modify Setup
                                      </button>
                                      
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to delete solar product "${item.n}"?`)) {
                                            handleDeleteSolarProduct(item.id);
                                          }
                                        }}
                                        className="bg-red-950/40 hover:bg-red-950/80 border border-red-900/40 text-red-300 font-bold px-2 py-1 rounded text-[9px] flex items-center gap-1 transition uppercase"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-400" />
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()
                        )}
                      </div>
                    </div>
                  ) : (
                    /* REGULAR PHOTOS COLLAGE GRID VIEW */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        {filteredPhotos.length === 0 ? (
                          <div className="text-center py-8 text-zinc-600 bg-[#141414] rounded-xl border border-dashed border-[#262626]">
                            <p className="text-xs p-4">No product code photos mapped in this list yet. Select a product code above to register dynamic media showcases!</p>
                          </div>
                        ) : (
                          filteredPhotos.map(img => {
                            const isCustom = img.isCustom;
                            const matchedProduct = allProductCodes.find(p => p.code === img.productCode)?.origin;

                            const isCollageLayout = img.url?.startsWith('collage:');
                            let collageLayoutType = 'dual';
                            let collageLayoutImages: string[] = [];
                            if (isCollageLayout) {
                              const parts = img.url.split(':');
                              collageLayoutType = parts[1] || 'dual';
                              collageLayoutImages = (parts[2] || '').split(';');
                            }

                            return (
                              <div 
                                key={img.id} 
                                onClick={() => {
                                  if (matchedProduct) {
                                    setSelectedProduct(matchedProduct);
                                  }
                                }}
                                className={`bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-md relative group hover:border-zinc-700 transition ${
                                  matchedProduct ? 'cursor-pointer' : ''
                                }`}
                              >
                                {isCollageLayout ? (
                                  <div className={`w-full aspect-video p-1.5 gap-1 bg-black/40 ${
                                    collageLayoutType === 'dual' ? 'grid grid-cols-2' :
                                    collageLayoutType === 'triple' ? 'grid grid-cols-3' :
                                    'grid grid-cols-2 grid-rows-2'
                                  }`}>
                                    {collageLayoutImages.map((collageUrl, indexU) => {
                                      const isMainLeftFocus = collageLayoutType === 'triple' && indexU === 0;
                                      return (
                                        <div 
                                          key={indexU} 
                                          className={`rounded overflow-hidden border border-zinc-900/40 bg-zinc-950 flex relative ${
                                            isMainLeftFocus ? 'col-span-2 row-span-2' : ''
                                          }`}
                                        >
                                          <img 
                                            src={collageUrl} 
                                            alt="" 
                                            className="w-full h-full object-cover filter brightness-[0.85]" 
                                            loading="lazy" 
                                            referrerPolicy="no-referrer" 
                                            onError={(e) => {
                                              console.error(`🚨 [Image Load Failure] Collage grid image failed to load!`, {
                                                url: collageUrl,
                                                containerOwnerId: img.id,
                                                containerOwnerLabel: img.label,
                                                host: window.location.host
                                              });
                                              e.currentTarget.onerror = null;
                                              e.currentTarget.src = "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80";
                                            }}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <img 
                                    src={img.url} 
                                    alt={img.label} 
                                    className="w-full aspect-video object-cover filter brightness-[0.82]"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      console.error(`🚨 [Image Load Failure] Portfolio gallery image failed to load!`, {
                                        url: img.url,
                                        photoId: img.id,
                                        photoLabel: img.label,
                                        productCode: img.productCode,
                                        host: window.location.host
                                      });
                                      e.currentTarget.onerror = null;
                                      if (img.fallbackUrl && e.currentTarget.src !== img.fallbackUrl) {
                                        e.currentTarget.src = img.fallbackUrl;
                                      } else if (matchedProduct) {
                                        e.currentTarget.src = getDefaultProductImage(matchedProduct);
                                      } else {
                                        e.currentTarget.src = "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80";
                                      }
                                    }}
                                  />
                                )}

                                {/* Delete Custom Photos directly. If staff, can modify or delete! */}
                                {isStaffLoggedIn && (
                                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10 transition scale-95 group-hover:scale-100">
                                    {/* Edit Showcase Photo fields */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingGallery(img);
                                      }}
                                      className="p-1.5 bg-zinc-900/90 border border-zinc-700 hover:bg-[#F5C518] hover:text-black font-bold text-zinc-100 rounded-lg transition-colors flex items-center shadow-lg"
                                      title="Edit Showcase Card Details"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>

                                    {matchedProduct && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (typeof matchedProduct.id === 'number') {
                                            setEditingProduct(matchedProduct as Product);
                                          } else {
                                            setEditingSolar(matchedProduct as SolarProduct);
                                          }
                                        }}
                                        className="p-1.5 bg-zinc-900/90 border border-zinc-700 hover:bg-[#F5C518] hover:text-black font-bold text-zinc-100 rounded-lg transition-colors flex items-center shadow-lg"
                                        title="Quick Edit specs"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteCustomPhoto(img.id, img.productCode);
                                      }}
                                      className="p-1.5 bg-red-950/85 hover:bg-red-900 border border-red-800 text-red-200 rounded-lg transition flex items-center shadow-lg animate-fade-in"
                                      title="Delete illustration"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-100" />
                                    </button>
                                  </div>
                                )}

                                {/* Info Section */}
                                <div className="p-3 text-left space-y-1">
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className="text-xs font-bold text-zinc-100 line-clamp-1">{img.label}</h4>
                                    <div className="flex gap-1 items-center shrink-0">
                                      {img.isVirtual && (
                                        <span className="text-[7.5px] tracking-[0.05em] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 font-mono font-bold rounded border border-blue-500/10 uppercase">
                                          Catalog
                                        </span>
                                      )}
                                      {!img.isVirtual && img.isCustom && (
                                        <span className="text-[7.5px] tracking-[0.05em] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 font-mono font-bold rounded border border-indigo-500/10 uppercase">
                                          Exhibit
                                        </span>
                                      )}
                                      {img.productCode && (
                                        <span className="text-[8px] tracking-[0.05em] px-1.5 py-0.5 bg-zinc-950 text-[#F5C518] font-mono font-bold rounded border border-zinc-800 uppercase">
                                          {img.productCode}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal line-clamp-2">{img.sub}</p>
                                  
                                  {matchedProduct && (
                                    <div className="pt-2 border-t border-zinc-900 flex justify-between items-center">
                                      <span className="text-[10px] text-[#F5C518] font-bold font-mono">
                                        {img.price || matchedProduct.price}
                                      </span>
                                      
                                      <div className="flex gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedProduct(matchedProduct)}
                                          className="text-[9px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-805 text-zinc-300 font-bold px-2 py-0.5 rounded transition uppercase"
                                        >
                                          View Info →
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <p className="text-[9px] text-zinc-500 text-center italic py-2">
                        "Authorized operators can generate stunning product photography matching store inventories."
                      </p>
                    </div>
                  )}

                  {/* EDIT STANDARD PRODUCT MODAL */}
                  {editingProduct && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex justify-center items-center z-50 p-4">
                      <div className="bg-[#121212] border border-[#262626] rounded-2xl w-full max-w-[390px] p-4 shadow-2xl relative animate-slide-up text-left space-y-4">
                        <div className="flex justify-between items-center border-b border-[#212121] pb-2">
                          <h3 className="text-xs font-mono font-bold text-[#F5C518] uppercase">✏️ Modify Product Specs</h3>
                          <button type="button" onClick={() => setEditingProduct(null)} className="text-zinc-500 hover:text-zinc-350 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3 text-[11px] max-h-[60vh] overflow-y-auto pr-1 scrollbar-none">
                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Part Number / Unique Code</label>
                            <input 
                              type="text" 
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 font-mono outline-none focus:border-zinc-700"
                              value={editingProduct.pn}
                              onChange={e => setEditingProduct({ ...editingProduct, pn: e.target.value })}
                            />
                          </div>
                          
                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Product Name</label>
                            <input 
                              type="text" 
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 outline-none focus:border-zinc-700"
                              value={editingProduct.n}
                              onChange={e => setEditingProduct({ ...editingProduct, n: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Category Code</label>
                            <select 
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 font-mono outline-none"
                              value={editingProduct.cat}
                              onChange={e => setEditingProduct({ ...editingProduct, cat: e.target.value })}
                            >
                              {CATS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Price Marker</label>
                            <input 
                              type="text" 
                              placeholder="e.g. ₦1,250,000 or CALL"
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-[#F5C518] font-bold font-mono outline-none focus:border-zinc-700"
                              value={editingProduct.price}
                              onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Technical Specifications</label>
                            <textarea 
                              rows={2}
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 font-mono outline-none focus:border-zinc-700"
                              value={editingProduct.sp}
                              onChange={e => setEditingProduct({ ...editingProduct, sp: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Description / Footnotes</label>
                            <textarea 
                              rows={2}
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 outline-none focus:border-zinc-700"
                              value={editingProduct.desc || ''}
                              onChange={e => setEditingProduct({ ...editingProduct, desc: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Product Photo</label>
                            <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-900 p-2 rounded">
                              {editingProduct.imageUrl ? (
                                <img src={editingProduct.imageUrl} className="w-12 h-12 object-cover rounded border border-zinc-800" />
                              ) : (
                                <div className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-zinc-850 rounded text-zinc-500">
                                  <Image className="w-5 h-5" />
                                </div>
                              )}
                              <label className="flex-1 py-1.5 px-3 bg-zinc-900 border border-zinc-855 hover:bg-zinc-800 text-[#F5C518] hover:text-amber-400 text-[10px] font-extrabold uppercase text-center rounded cursor-pointer transition flex items-center justify-center gap-1.5 font-sans">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Modify / Upload Photo</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      const reader = new FileReader();
                                      reader.onload = async () => {
                                        try {
                                          const dataUrl = reader.result as string;
                                          const compressed = await compressImage(dataUrl);
                                          const finalUrl = await uploadImageToCDNOrLocal(file.name, compressed, cloudinaryConfig);
                                          setEditingProduct({ ...editingProduct, imageUrl: finalUrl });
                                          alert("📷 Photo uploaded!");
                                        } catch (innerErr: any) {
                                          alert("Upload error: " + innerErr.message);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    } catch (err: any) {
                                      alert("Upload failed: " + err.message);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (!editingProduct.pn.trim()) return alert("Part number/code is required!");
                            await handleSaveProduct(editingProduct);
                            setEditingProduct(null);
                            alert("✅ Specifications successfully saved!");
                          }}
                          className="w-full py-2 bg-[#F5C518] text-black hover:bg-amber-500 font-extrabold text-xs uppercase rounded-lg transition-colors"
                        >
                          Apply System Specs
                        </button>
                      </div>
                    </div>
                  )}

                  {/* EDIT SOLAR PRODUCT MODAL */}
                  {editingSolar && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex justify-center items-center z-50 p-4">
                      <div className="bg-[#121212] border border-[#262626] rounded-2xl w-full max-w-[390px] p-4 shadow-2xl relative animate-slide-up text-left space-y-4">
                        <div className="flex justify-between items-center border-b border-[#212121] pb-2">
                          <h3 className="text-xs font-mono font-bold text-[#F5C518] uppercase">✏️ Modify Solar Packaging</h3>
                          <button type="button" onClick={() => setEditingSolar(null)} className="text-zinc-500 hover:text-zinc-350 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3 text-[11px] max-h-[60vh] overflow-y-auto pr-1 scrollbar-none">
                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Configuration Code/ID</label>
                            <input 
                              type="text" 
                              readOnly
                              className="w-full bg-zinc-900 border border-zinc-900 p-2 rounded text-zinc-400 font-mono outline-none cursor-not-allowed"
                              value={editingSolar.id}
                            />
                          </div>
                          
                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Equipment brand</label>
                            <input 
                              type="text" 
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 outline-none focus:border-zinc-700 font-mono"
                              value={editingSolar.brand}
                              onChange={e => setEditingSolar({ ...editingSolar, brand: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Model Name / Capacity</label>
                            <input 
                              type="text" 
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 outline-none focus:border-zinc-700"
                              value={editingSolar.n}
                              onChange={e => setEditingSolar({ ...editingSolar, n: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Category</label>
                            <select 
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 font-mono outline-none"
                              value={editingSolar.cat}
                              onChange={e => setEditingSolar({ ...editingSolar, cat: e.target.value as any })}
                            >
                              {['Inverters', 'Lithium Batteries', 'Tubular Battery', 'Solar Panels', 'Controllers', 'Cables', 'All-in-One'].map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Price Tag</label>
                            <input 
                              type="text" 
                              placeholder="e.g. ₦1,250,000"
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-[#F5C518] font-bold font-mono outline-none focus:border-zinc-700"
                              value={editingSolar.price}
                              onChange={e => setEditingSolar({ ...editingSolar, price: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Technical specification block</label>
                            <textarea 
                              rows={2}
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 font-mono outline-none focus:border-zinc-700 cursor-text"
                              value={editingSolar.sp}
                              onChange={e => setEditingSolar({ ...editingSolar, sp: e.target.value })}
                            />
                          </div>

                           <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Description / Package lists</label>
                            <textarea 
                              rows={2}
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 outline-none focus:border-zinc-700"
                              value={editingSolar.desc || ''}
                              onChange={e => setEditingSolar({ ...editingSolar, desc: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Product Photo</label>
                            <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-900 p-2 rounded">
                              {editingSolar.imageUrl ? (
                                <img src={editingSolar.imageUrl} className="w-12 h-12 object-cover rounded border border-zinc-800" />
                              ) : (
                                <div className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-zinc-850 rounded text-zinc-500">
                                  <Image className="w-5 h-5" />
                                </div>
                              )}
                              <label className="flex-1 py-1.5 px-3 bg-zinc-900 border border-zinc-855 hover:bg-zinc-800 text-[#F5C518] hover:text-amber-400 text-[10px] font-extrabold uppercase text-center rounded cursor-pointer transition flex items-center justify-center gap-1.5 font-sans">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Modify / Upload Photo</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      const reader = new FileReader();
                                      reader.onload = async () => {
                                        try {
                                          const dataUrl = reader.result as string;
                                          const compressed = await compressImage(dataUrl);
                                          const finalUrl = await uploadImageToCDNOrLocal(file.name, compressed, cloudinaryConfig);
                                          setEditingSolar({ ...editingSolar, imageUrl: finalUrl });
                                          alert("📷 Photo uploaded!");
                                        } catch (innerErr: any) {
                                          alert("Upload error: " + innerErr.message);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    } catch (err: any) {
                                      alert("Upload failed: " + err.message);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (!editingSolar.id.trim()) return alert("Code/ID is required!");
                            await handleSaveSolarProduct(editingSolar);
                            setEditingSolar(null);
                            alert("✅ Solar packaging updated successfully!");
                          }}
                          className="w-full py-2 bg-[#F5C518] text-black hover:bg-amber-500 font-extrabold text-xs uppercase rounded-lg transition-colors"
                        >
                          Save Solar Configurations
                        </button>
                      </div>
                    </div>
                  )}

                  {/* EDIT GALLERY PHOTO CARD MODAL */}
                  {editingGallery && (
                    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex justify-center items-center z-50 p-4">
                      <div className="bg-[#121212] border border-[#262626] rounded-2xl w-full max-w-[390px] p-4 shadow-2xl relative animate-slide-up text-left space-y-4">
                        <div className="flex justify-between items-center border-b border-[#212121] pb-2">
                          <h3 className="text-xs font-mono font-bold text-[#F5C518] uppercase">✏️ Edit showcase photo card</h3>
                          <button type="button" onClick={() => setEditingGallery(null)} className="text-zinc-500 hover:text-zinc-350 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3 text-[11px] max-h-[60vh] overflow-y-auto pr-1 scrollbar-none">
                          {editingGallery.isVirtual && (
                            <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[9px] font-mono leading-normal">
                              ℹ️ This photo is auto-generated from a product's main showcase photo. Editing will save back to its original product specifications page.
                            </div>
                          )}

                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Photo Card Title</label>
                            <input 
                              type="text" 
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 outline-none focus:border-zinc-700"
                              value={editingGallery.label || ''}
                              onChange={e => setEditingGallery({ ...editingGallery, label: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Description / Subtitle Specs</label>
                            <textarea 
                              rows={3}
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 outline-none focus:border-zinc-700 cursor-text"
                              value={editingGallery.sub || ''}
                              onChange={e => setEditingGallery({ ...editingGallery, sub: e.target.value })}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Price / Overlay</label>
                              <input 
                                type="text" 
                                placeholder="e.g. ₦1,250,000"
                                className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-[#F5C518] font-bold font-mono outline-none focus:border-zinc-700"
                                value={editingGallery.price || ''}
                                onChange={e => setEditingGallery({ ...editingGallery, price: e.target.value })}
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Linked Product Code</label>
                              <select 
                                className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 font-mono outline-none"
                                value={editingGallery.productCode || ''}
                                onChange={e => setEditingGallery({ ...editingGallery, productCode: e.target.value })}
                              >
                                <option value="">-- Unlinked --</option>
                                {allProductCodes.map(item => (
                                  <option key={item.code} value={item.code}>
                                    {item.code} ({item.name.slice(0, 15)}...)
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {!editingGallery.isVirtual && (
                            <div>
                              <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Exhibition Feed Category</label>
                              <select 
                                className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 outline-none"
                                value={editingGallery.isCustom ? "custom" : "showcase"}
                                onChange={e => setEditingGallery({ ...editingGallery, isCustom: e.target.value === "custom" })}
                              >
                                <option value="showcase">Store Showcase (Official)</option>
                                <option value="custom">Product Code Photo (Custom Exhibit)</option>
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Image URL / Sourcing</label>
                            <input 
                              type="text" 
                              placeholder="Paste custom secure URL link..."
                              className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-300 font-mono text-[10px] outline-none focus:border-zinc-700 mb-2"
                              value={editingGallery.url || ''}
                              onChange={e => setEditingGallery({ ...editingGallery, url: e.target.value })}
                            />

                            <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-900 p-2 rounded">
                              {editingGallery.url ? (
                                <img src={editingGallery.url} className="w-12 h-12 object-cover rounded border border-zinc-800" />
                              ) : (
                                <div className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-zinc-850 rounded text-zinc-500">
                                  <Image className="w-5 h-5" />
                                </div>
                              )}
                              <label className="flex-1 py-1.5 px-3 bg-zinc-900 border border-zinc-855 hover:bg-zinc-800 text-[#F5C518] hover:text-amber-400 text-[10px] font-extrabold uppercase text-center rounded cursor-pointer transition flex items-center justify-center gap-1.5 font-sans">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload New File</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      const reader = new FileReader();
                                      reader.onload = async () => {
                                        try {
                                          const dataUrl = reader.result as string;
                                          const compressed = await compressImage(dataUrl);
                                          const finalUrl = await uploadImageToCDNOrLocal(file.name, compressed, cloudinaryConfig);
                                          setEditingGallery({ ...editingGallery, url: finalUrl, fallbackUrl: compressed });
                                          alert("📷 Photo uploaded!");
                                        } catch (innerErr: any) {
                                          alert("Upload error: " + innerErr.message);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    } catch (err: any) {
                                      alert("Upload failed: " + err.message);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (!editingGallery.label || !editingGallery.label.trim()) {
                              return alert("Title is required!");
                            }
                            if (!editingGallery.url || !editingGallery.url.trim()) {
                              return alert("Image URL is required!");
                            }
                            await handleSaveGalleryPhoto(editingGallery);
                            setEditingGallery(null);
                          }}
                          className="w-full py-2 bg-[#F5C518] text-black hover:bg-amber-500 font-extrabold text-xs uppercase rounded-lg transition-colors"
                        >
                          Apply Showcase Changes
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CREATE PRODUCT MODAL */}
                  {showCreateProductModal && (
                    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex justify-center items-center z-50 p-4">
                      <div className="bg-[#121212] border border-[#262626] rounded-2xl w-full max-w-[390px] p-4 shadow-2xl relative animate-slide-up text-left space-y-4">
                        <div className="flex justify-between items-center border-b border-[#212121] pb-2">
                          <h3 className="text-xs font-mono font-bold text-[#F5C518] uppercase">➕ Create New Product Card</h3>
                          <button type="button" onClick={() => setShowCreateProductModal(false)} className="text-zinc-500 hover:text-zinc-350 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* SELECT TYPE TO CREATE */}
                        <div className="flex bg-zinc-950 border border-zinc-900 rounded p-1 gap-1">
                          <button
                            type="button"
                            onClick={() => setCreateProductType('standard')}
                            className={`flex-1 py-1 text-center text-[9px] font-bold rounded transition ${
                              createProductType === 'standard' ? 'bg-[#F5C518] text-black font-extrabold' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Standard Product
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreateProductType('solar')}
                            className={`flex-1 py-1 text-center text-[9px] font-bold rounded transition ${
                              createProductType === 'solar' ? 'bg-[#F5C518] text-black font-extrabold' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Solar Package
                          </button>
                        </div>

                        <div className="space-y-3 text-[11px] max-h-[55vh] overflow-y-auto pr-1 scrollbar-none">
                          {createProductType === 'standard' ? (
                            <>
                              <div>
                                <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Part Number (Product Code)</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. PN-HP430"
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 font-mono outline-none focus:border-zinc-700"
                                  value={newProductForm.pn || ''}
                                  onChange={e => setNewProductForm({ ...newProductForm, pn: e.target.value })}
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Product Name</label>
                                <input 
                                  type="text" 
                                  placeholder="or leave as 'Unmade'"
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 outline-none focus:border-zinc-700"
                                  value={newProductForm.n || ''}
                                  onChange={e => setNewProductForm({ ...newProductForm, n: e.target.value })}
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Category</label>
                                <select 
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 outline-none"
                                  value={newProductForm.cat || 'laptops'}
                                  onChange={e => setNewProductForm({ ...newProductForm, cat: e.target.value })}
                                >
                                  {CATS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </div>

                              <div>
                                <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Price Marker</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. ₦1,250,000 or CALL"
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-[#F5C518] font-bold font-mono outline-none focus:border-zinc-700"
                                  value={newProductForm.price || 'CALL'}
                                  onChange={e => setNewProductForm({ ...newProductForm, price: e.target.value })}
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Specification Specs</label>
                                <textarea 
                                  rows={2}
                                  placeholder="Enter hardware particulars..."
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 font-mono outline-none focus:border-zinc-700"
                                  value={newProductForm.sp || ''}
                                  onChange={e => setNewProductForm({ ...newProductForm, sp: e.target.value })}
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Detailed Description</label>
                                <textarea 
                                  rows={2}
                                  placeholder="Enter overview notes"
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 outline-none focus:border-zinc-700"
                                  value={newProductForm.desc || ''}
                                  onChange={e => setNewProductForm({ ...newProductForm, desc: e.target.value })}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Configuration unique ID</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. SOLAR-LITHIUM-G1"
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 font-mono outline-none focus:border-zinc-700 uppercase"
                                  value={newSolarForm.id || ''}
                                  onChange={e => setNewSolarForm({ ...newSolarForm, id: e.target.value })}
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Equipment Brand</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. Felicity, Huawei"
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 outline-none focus:border-zinc-700 font-mono"
                                  value={newSolarForm.brand || ''}
                                  onChange={e => setNewSolarForm({ ...newSolarForm, brand: e.target.value })}
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Model Name / Capacity</label>
                                <input 
                                  type="text" 
                                  placeholder="or leave as 'Unmade'"
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 outline-none focus:border-zinc-700"
                                  value={newSolarForm.n || ''}
                                  onChange={e => setNewSolarForm({ ...newSolarForm, n: e.target.value })}
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Category Selection</label>
                                <select 
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 font-mono outline-none animate-fade-in"
                                  value={newSolarForm.cat || 'Inverters'}
                                  onChange={e => setNewSolarForm({ ...newSolarForm, cat: e.target.value as any })}
                                >
                                  {['Inverters', 'Lithium Batteries', 'Tubular Battery', 'Solar Panels', 'Controllers', 'Cables', 'All-in-One'].map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Pricing Detail</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. ₦1,250,000"
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-[#F5C518] font-bold font-mono outline-none focus:border-zinc-700"
                                  value={newSolarForm.price || '₦'}
                                  onChange={e => setNewSolarForm({ ...newSolarForm, price: e.target.value })}
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Technical specification block</label>
                                <textarea 
                                  rows={2}
                                  placeholder="Describe capacities, voltages, sizes..."
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 font-mono outline-none focus:border-zinc-700"
                                  value={newSolarForm.sp || ''}
                                  onChange={e => setNewSolarForm({ ...newSolarForm, sp: e.target.value })}
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase block mb-1">Package listings / Description</label>
                                <textarea 
                                  rows={2}
                                  placeholder="Enter list of items included..."
                                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-zinc-100 outline-none focus:border-zinc-700"
                                  value={newSolarForm.desc || ''}
                                  onChange={e => setNewSolarForm({ ...newSolarForm, desc: e.target.value })}
                                />
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (createProductType === 'standard') {
                              if (!newProductForm.pn || !newProductForm.pn.trim()) return alert("Part Number (code) is required!");
                              const payload: Product = {
                                id: Number(newProductForm.id || Date.now()),
                                pn: newProductForm.pn.trim(),
                                cat: newProductForm.cat || 'laptops',
                                n: (newProductForm.n || 'Unmade').trim(),
                                sp: newProductForm.sp || 'System specifications pending customer verification',
                                price: newProductForm.price || 'CALL',
                                desc: newProductForm.desc || 'Awaiting complete technical specification details.'
                              };
                              await handleSaveProduct(payload);
                            } else {
                              if (!newSolarForm.id || !newSolarForm.id.trim()) return alert("Solar configuration ID is required!");
                              const payload: SolarProduct = {
                                id: newSolarForm.id.trim().toUpperCase(),
                                cat: newSolarForm.cat as any || 'Inverters',
                                n: (newSolarForm.n || 'Unmade').trim(),
                                brand: (newSolarForm.brand || 'Generic').trim(),
                                sp: newSolarForm.sp || 'System specifications pending customer verification',
                                price: newSolarForm.price || '₦',
                                desc: newSolarForm.desc || 'Awaiting complete technical specification details.'
                              };
                              await handleSaveSolarProduct(payload);
                            }
                            setShowCreateProductModal(false);
                            alert("🎉 System product registered inside database!");
                          }}
                          className="w-full py-2 bg-[#F5C518] text-black hover:bg-amber-500 font-extrabold text-[#0a0a0a] text-xs uppercase rounded-lg transition-colors"
                        >
                          Create System Product Spec
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}

            {/* ROOM 3: SOLAR HUB & SMART CALCULATOR */}
            {currentRoom === 'solar' && (
              <div className="p-4 space-y-4">
                <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl text-center">
                  <h2 className="text-xs font-mono uppercase text-zinc-400 font-bold tracking-[0.2em]">HiTech Solar</h2>
                  <p className="text-md font-serif font-bold text-[#f5f5f5] mt-1 pr-1">Pure Sine Wave Solar Sizing Systems</p>
                </div>

                {/* AI Calculator Integration */}
                <SolarSizingTool 
                  onAddSolarProduct={addToSolarCart} 
                  onNavigate={setCurrentRoom}
                />

                {/* Filter list */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px] uppercase font-bold scrollbar-none">
                  {['All', 'Inverters', 'Lithium Batteries', 'Tubular Battery', 'Solar Panels', 'Controllers'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setSolarFilter(filter)}
                      className={`px-3 py-1.5 rounded-full border transition whitespace-nowrap ${
                        solarFilter === filter 
                          ? 'bg-[#F5C518] text-[#0a0a0a] border-[#F5C518]' 
                          : 'bg-[#141414] text-zinc-400 border-[#262626] hover:text-zinc-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Solar Products Feed */}
                <div className="space-y-2.5">
                  {solarProductsList.filter(s => solarFilter === 'All' || s.cat === solarFilter).map(item => (
                    <div 
                      key={item.id} 
                      className="bg-[#141414] border border-[#262626] p-3 rounded-xl flex items-center justify-between gap-3 text-left hover:border-zinc-700 transition"
                    >
                      <div 
                        onClick={() => setSelectedProduct(item)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <h4 className="text-xs font-bold text-zinc-100 truncate">{item.n}</h4>
                        <p className="text-[9px] text-[#F5C518] bg-amber-500/10 inline-block px-1.5 rounded font-bold font-mono mt-0.5">{item.brand}</p>
                        <p className="text-[10px] text-zinc-500 truncate mt-1">{item.sp}</p>
                        <span className="text-xs font-mono text-[#F5C518] font-bold block mt-1">{item.price}</span>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        <button 
                          onClick={() => {
                            addToSolarCart(item.id);
                            alert(`Added ${item.n} to solar invoice list`);
                          }}
                          className="px-2 py-1 bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300 rounded font-bold"
                        >
                          + Solar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ROOM 4: CHANNELS & DEEP LINKS */}
            {currentRoom === 'channels' && (
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Office Hotlines & Live Stream</h2>
                  <p className="text-md font-serif text-zinc-300 font-bold">Authorized Connect Channels</p>
                </div>

                {/* LIVE WEBCAST STREAMING WIDGET */}
                {liveEmbedUrl && !liveEmbedUrl.includes('UC...') && (
                  <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3 font-sans text-left">
                    <h3 className="text-xs text-[#F5C518] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 bg-[#CC0000] rounded-full"></span>
                      <span>Showroom Live Stream Broadcast</span>
                    </h3>
                    <div className="aspect-video w-full rounded-lg overflow-hidden border border-zinc-805 bg-black">
                      <iframe
                        src={liveEmbedUrl}
                        title="Live Video Stream"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <span className="text-[10px] text-zinc-500 leading-normal block">
                      Connect live directly with Warri, Delta State Hub to watch diagnostic walkarounds.
                    </span>
                  </div>
                )}

                <div className="space-y-3 font-serif">
                  <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3">
                    <h3 className="text-xs text-zinc-300 font-bold font-sans uppercase tracking-wider">Operational Contacts</h3>
                    <div className="space-y-2.5 font-sans">
                      <div className="flex justify-between items-center bg-[#0a0a0a] border border-[#262626] p-3 rounded-lg text-xs">
                        <div>
                          <p className="font-bold text-zinc-200">Standard Sales division</p>
                          <p className="text-[10px] text-zinc-500">Prices inquiries & orders</p>
                        </div>
                        <button 
                          onClick={() => openWhatsAppLink(contacts.sales, "Hello Sales Team! I would like to inquire about current laptops prices.")}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] uppercase transition-colors"
                        >
                          Connect
                        </button>
                      </div>

                      <div className="flex justify-between items-center bg-[#0a0a0a] border border-[#262626] p-3 rounded-lg text-xs">
                        <div>
                          <p className="font-bold text-zinc-200">Inventory Division Coordinator</p>
                          <p className="text-[10px] text-zinc-500">Stock availability lists & logistics</p>
                        </div>
                        <button 
                          onClick={() => openWhatsAppLink(contacts.inventory, "Hello Stock Coordinator, I would like to check available stock in your showroom.")}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] uppercase transition-colors"
                        >
                          Check
                        </button>
                      </div>

                      <div className="flex justify-between items-center bg-[#0a0a0a] border border-[#262626] p-3 rounded-lg text-xs">
                        <div>
                          <p className="font-bold text-zinc-200">General Coordinator Desk</p>
                          <p className="text-[10px] text-zinc-500">Warranty, repairs, and support</p>
                        </div>
                        <button 
                          onClick={() => openWhatsAppLink(contacts.general, "Hello Support Desk, I have a repair or warranty service inquiry.")}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] uppercase transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ROOM 5: REPAIR DESK & ASSISTED TRIAGE */}
            {currentRoom === 'repair' && (
              <div className="p-4 space-y-4 text-left">
                <div className="text-center mb-1">
                  <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Maintainance Centre</h2>
                  <p className="text-md font-serif font-bold text-zinc-300">Authorized Diagnostics Desk</p>
                </div>

                {/* Repair Submit / Tracker tabs */}
                <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-4">
                  <div className="border-b border-[#262626] pb-3 mb-2">
                    <span className="text-xs uppercase font-bold text-zinc-300 tracking-wider">Book repair diagnosis</span>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase">A complimentary Gemini triaged estimate suggestion will be proposed instantly.</p>
                  </div>

                  <form onSubmit={handleRepairSubmit} className="space-y-3 font-sans">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Device Category</label>
                      <select 
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white"
                        value={repType}
                        onChange={e => setRepType(e.target.value as any)}
                      >
                        <option value="Laptop">Laptop / Ultra Notebook</option>
                        <option value="Desktop">Desktop PC / AIO</option>
                        <option value="Printer">Office Laser Printer</option>
                        <option value="Monitor">LCD Monitor Display</option>
                        <option value="Other">Other Office Electronic</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Brand & Model</label>
                        <input 
                          type="text" 
                          placeholder="HP ProBook G11, LaserJet etc" 
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                          value={repBrand}
                          onChange={e => setRepBrand(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Owner Full Name</label>
                        <input 
                          type="text" 
                          placeholder="Name" 
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                          value={repCustName}
                          onChange={e => setRepCustName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Owner Active Phone No (WhatsApp)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 080XXXXXXXX" 
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        value={repCustPhone}
                        onChange={e => setRepCustPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Detailed Fault Description</label>
                      <textarea 
                        placeholder="Please detail behavior (e.g. Laptop charger plugged in but light won't turn on, fan is making grinding noises...)" 
                        className="w-full h-20 bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-xs text-white focus:outline-none"
                        value={repDesc}
                        onChange={e => setRepDesc(e.target.value)}
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={triageLoading}
                      className="w-full py-2.5 bg-[#F5C518] hover:bg-amber-500 text-[#0a0a0a] text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {triageLoading ? "AI analyzing fault estimate..." : "Log Ticket & Analyze with AI →"}
                    </button>
                  </form>
                </div>

                {/* TRACKER SUBSECTION */}
                <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-4 mt-4">
                  <div className="border-b border-[#262626] pb-2">
                    <span className="text-xs uppercase font-bold text-zinc-300 tracking-wider">Track my active repair ticket</span>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter Ticket Reference (e.g. HT-2026-001)"
                      className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                      value={searchRef}
                      onChange={e => setSearchRef(e.target.value)}
                    />
                    <button 
                      onClick={handleTrackRepairItem}
                      className="px-4 py-1.5 bg-zinc-805 hover:bg-zinc-700 text-[#F5C518] border border-zinc-700 text-xs font-bold rounded-lg transition-colorsU"
                    >
                      Track
                    </button>
                  </div>

                  {trackError && <p className="text-[10px] text-red-500 font-mono text-center">{trackError}</p>}

                  {trackedRepair && (
                    <div className="p-3 bg-[#0a0a0a] border border-[#262626] rounded-lg space-y-2.5 text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                        <span className="font-mono text-zinc-400 uppercase text-[9px]">Receipt: {trackedRepair.ref}</span>
                        <span className="text-[#F5C518] font-bold text-[10px] uppercase tracking-wider">{trackedRepair.status}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[9px] text-zinc-500 block">Unit Type:</span>
                          <span className="text-zinc-300 font-bold">{trackedRepair.brand} ({trackedRepair.type})</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 block">Logged:</span>
                          <span className="text-zinc-300">{trackedRepair.submitted}</span>
                        </div>
                      </div>

                      {/* Staged vertical bullet tracker progress stepper */}
                      <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                        {['Received', 'Diagnosed', 'In Repair', 'Ready for Pickup'].map((stage, sIdx) => {
                          const isDone = trackedRepair.stages.includes(stage) || trackedRepair.status === stage;
                          return (
                            <div key={sIdx} className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isDone ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`} />
                              <span className={`text-[10px] font-mono ${isDone ? 'text-zinc-200' : 'text-zinc-600'}`}>{stage}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ROOM 6: DEALS & PROMOTIONS */}
            {currentRoom === 'deals' && (
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Seasonal Discounts</h2>
                  <p className="text-md font-serif font-bold text-zinc-300">Emporium Clearance Corner</p>
                </div>

                <div className="space-y-3.5">
                  {dealsList.map(item => (
                    <div key={item.id} className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-sm relative text-left">
                      {/* Badge Banner top-right */}
                      <span className="absolute top-3 right-3 text-[9px] font-bold font-mono tracking-wider bg-red-600/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded uppercase">
                        {item.badge}
                      </span>

                      <div className="p-4 space-y-2">
                        <h4 className="text-xs font-bold text-zinc-200 pr-24 leading-snug">{item.title}</h4>
                        <p className="text-[10px] text-zinc-400 font-sans leading-normal">{item.desc}</p>
                        
                        <div className="flex items-baseline gap-2 pt-2 border-t border-[#262626] mt-2">
                          <span className="text-[10px] text-zinc-500 line-through font-mono">{item.origPrice}</span>
                          <span className="text-sm font-bold text-[#F5C518] font-mono">{item.salePrice}</span>
                        </div>

                        <button 
                          onClick={() => {
                            const linkText = `Hello Sales! I am interested in claiming the posted promo deal: "${item.title}" on sale for ${item.salePrice}.`;
                            openWhatsAppLink(contacts.sales, linkText);
                          }}
                          className="w-full mt-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded text-[10px] font-bold uppercase transition"
                        >
                          Claim Live Promo via WhatsApp →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ROOM 7: LIVE PRICE SHEET (HIGH DENSITY TABLE) */}
            {currentRoom === 'livesheet' && (
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Live Master Index</h2>
                  <p className="text-md font-serif font-bold text-zinc-300">Complete Showroom Pricesheet</p>
                </div>

                <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
                  <div className="p-3 border-b border-[#262626] bg-[#1a1a1a] flex justify-between items-center text-xs text-zinc-400 uppercase font-mono font-bold tracking-widest">
                    <span>Item & Specs</span>
                    <span>Action List</span>
                  </div>

                  <div className="divide-y divide-[#262626] max-h-[480px] overflow-y-auto font-sans">
                    {productsList.map(p => (
                      <div key={p.id} className="p-2.5 flex justify-between items-center bg-[#0a0a0a] hover:bg-zinc-900 transition gap-2">
                        <div 
                          className="flex-1 min-w-0 text-left cursor-pointer"
                          onClick={() => setSelectedProduct(p)}
                        >
                          <h4 className="text-[11px] font-bold text-zinc-300 truncate leading-snug">{p.n}</h4>
                          <span className="text-[9px] text-[#F5C518] bg-amber-500/15 py-0.2 px-1 rounded font-mono uppercase font-bold mt-0.5 inline-block">
                            {p.price}
                          </span>
                          <p className="text-[9px] text-zinc-600 truncate mt-0.5">{p.sp}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          {p.price !== 'CALL' ? (
                            <button 
                              onClick={() => {
                                addToCart(p.id);
                                alert(`Added ${p.n} to cart`);
                              }}
                              className="px-2 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 hover:text-[#F5C518] rounded text-[9px] font-bold"
                            >
                              + Cart
                            </button>
                          ) : (
                            <span className="text-[9px] text-zinc-500 p-1 uppercase">Call Spec</span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Add solar items list below */}
                    {solarProductsList.map(s => (
                      <div key={s.id} className="p-2.5 flex justify-between items-center bg-[#0d0d0d] hover:bg-zinc-950 transition gap-2">
                        <div 
                          className="flex-1 min-w-0 text-left cursor-pointer"
                          onClick={() => setSelectedProduct(s)}
                        >
                          <h4 className="text-[11px] font-bold text-zinc-300 truncate leading-snug">{s.n}</h4>
                          <span className="text-[9px] text-[#F5C518] bg-[#F5C518]/15 py-0.2 px-1 rounded font-mono uppercase font-bold mt-0.5 inline-block">
                            {s.price}
                          </span>
                          <span className="text-[8px] bg-zinc-800 text-zinc-500 py-0.2 px-1 rounded font-mono uppercase font-bold ml-1">SOLAR</span>
                          <p className="text-[9px] text-zinc-600 truncate mt-0.5">{s.sp}</p>
                        </div>
                        <div className="shrink-0">
                          <button 
                            onClick={() => {
                              addToSolarCart(s.id);
                              alert(`Added ${s.n} to solar invoice list`);
                            }}
                            className="px-2 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 hover:text-white rounded text-[9px] font-bold"
                          >
                            + Solar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ROOM 8: QUANTITY STEPPERS & INVOICE GENERATOR */}
            {currentRoom === 'invoice' && (
              <div className="p-4 space-y-4 font-sans text-left">
                <div className="text-center mb-1">
                  <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Voucher generator</h2>
                  <p className="text-md font-serif font-bold text-zinc-300">Standard Orders & Banking</p>
                </div>

                {standardCartItems.length === 0 && solarCartItems.length === 0 ? (
                  <div className="bg-[#141414] border border-[#262626] p-6 text-center rounded-xl text-xs text-zinc-500">
                    Your invoice checklist is empty. Visit Categories or Solar Hub to compile systems.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Item lines with quantity steppers */}
                    <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Cart items checklist</span>
                      
                      <div className="divide-y divide-[#262626] space-y-2">
                        {standardCartItems.map(item => (
                          <div key={item.product?.id} className="pt-2 flex justify-between items-center text-xs gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-zinc-300 truncate">{item.product?.n}</p>
                              <span className="font-mono text-[#F5C518] text-[10px]">{item.product?.price}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => adjustQty(item.product!.id, -1)} className="p-1 bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white rounded">-</button>
                              <span className="font-mono w-4 text-center text-zinc-300">{item.qty}</span>
                              <button onClick={() => adjustQty(item.product!.id, 1)} className="p-1 bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white rounded">+</button>
                              <button onClick={() => removeFromCart(item.product!.id)} className="text-red-500 hover:text-red-400 text-[10px] ml-1 font-bold">×</button>
                            </div>
                          </div>
                        ))}

                        {solarCartItems.map(item => (
                          <div key={item.product?.id} className="pt-2 flex justify-between items-center text-xs gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-zinc-300 truncate">{item.product?.n}</p>
                              <span className="font-mono text-[#F5C518] text-[10px]">{item.product?.price}</span>
                              <span className="text-[8px] bg-zinc-800 text-zinc-500 py-0.2 px-1 rounded ml-1 font-mono font-bold uppercase">Solar</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => adjustSolarQty(item.product!.id, -1)} className="p-1 bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white rounded">-</button>
                              <span className="font-mono w-4 text-center text-zinc-300">{item.qty}</span>
                              <button onClick={() => adjustSolarQty(item.product!.id, 1)} className="p-1 bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white rounded">+</button>
                              <button onClick={() => removeSolarFromCart(item.product!.id)} className="text-red-500 hover:text-red-400 text-[10px] ml-1 font-bold">×</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-[#262626] flex justify-between items-center text-xs mt-3">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider">Estimated Total Cost</span>
                        <span className="font-bold font-mono text-lg text-[#F5C518] pb-0.5">₦{calculateTotalPrice().toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Recipient info & Bank Account */}
                    <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Bespoke voucher details</span>
                      
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          placeholder="Client Full Name Name" 
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          value={clientName}
                          onChange={e => setClientName(e.target.value)}
                        />
                        <input 
                          type="text" 
                          placeholder="Client Active Phone No (WhatsApp)" 
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          value={clientPhone}
                          onChange={e => setClientPhone(e.target.value)}
                        />
                        <input 
                          type="text" 
                          placeholder="Client Delivery Address (Optional)" 
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          value={clientAddress}
                          onChange={e => setClientAddress(e.target.value)}
                        />
                      </div>

                      {/* Display bank details */}
                      <div className="bg-[#0a0a0a] border border-[#262626] p-3 rounded-lg space-y-1.5 text-xs">
                        <div className="flex items-center gap-1 text-[#F5C518] font-bold">
                          <Landmark className="w-3.5 h-3.5" />
                          <span className="text-[9px] uppercase tracking-wider">Bank Transfer Deposit Voucher</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">Account Bank: <span className="text-zinc-200 font-bold font-mono">{bankAccount.bank}</span></p>
                        <p className="text-[11px] text-zinc-400">Acc No: <span className="text-[#F5C518] font-bold font-mono select-all">{bankAccount.accountNumber}</span></p>
                        <p className="text-[11px] text-zinc-400">Name: <span className="text-zinc-200">{bankAccount.accountName}</span></p>
                        <span className="text-[8px] text-zinc-500 italic uppercase block pt-1 border-t border-zinc-900">Configurable dynamically by our authorized staff only.</span>
                      </div>

                      <div className="flex gap-2 text-xs font-bold pt-1 uppercase">
                        <button 
                          onClick={clearAllCarts}
                          className="px-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-lg hover:text-white"
                        >
                          Clear
                        </button>
                        <button 
                          onClick={triggerInvoiceOrder}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-center transition"
                        >
                          Generate Invoice on WhatsApp →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ROOM 9: REAL GEMINI CHAT INFO BOOTH */}
            {currentRoom === 'info' && (
              <InfoBoothRoom 
                onAddToCart={(pId) => addToCart(pId, 1)}
                onAddSolarProduct={(sId) => addToSolarCart(sId, 1)}
                onNavigateToRoom={(room) => setCurrentRoom(room)}
              />
            )}

            {/* ROOM 10: MANAGER CONNECT OVERVIEW */}
            {currentRoom === 'manager' && (
              <div className="p-4 space-y-4 text-left">
                <div className="text-center mb-1">
                  <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Lounge connection</h2>
                  <p className="text-md font-serif font-bold text-zinc-300">General Manager Contact Desk</p>
                </div>

                {/* Info Card explaining the layout */}
                <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-[#262626] pb-2">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Select Director Desk</span>
                    <span className={`text-[9px] font-bold uppercase py-0.5 px-2 rounded ${
                      mgrStatus === 'available' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      GM Status: {mgrStatus}
                    </span>
                  </div>

                  {/* Operational tab buttons */}
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] uppercase font-bold tracking-wider text-center">
                    {(['sales', 'inventory', 'gm'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveManagerTab(tab)}
                        className={`py-1.5 rounded transition ${
                          activeManagerTab === tab 
                            ? 'bg-[#F5C518] text-[#0a0a0a]' 
                            : 'bg-[#0a0a0a] border border-[#262626] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {tab} Desk
                      </button>
                    ))}
                  </div>

                  {/* Sales & Inventory form flow */}
                  {(activeManagerTab === 'sales' || activeManagerTab === 'inventory') && (
                    <div className="space-y-3 pt-2 font-sans">
                      <p className="text-[10px] text-zinc-500 uppercase leading-relaxed font-bold">
                        {activeManagerTab === 'sales' 
                          ? 'Send inquiry to standard Sales Division regarding current desktop/laptop models.'
                          : 'Inquire to Showroom Stock coordinator relative to current retail logistics.'
                        }
                      </p>
                      
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Your Full Name"
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                          value={quickName}
                          onChange={e => setQuickName(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Your Active Phone No (WhatsApp)"
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                          value={quickPhone}
                          onChange={e => setQuickPhone(e.target.value)}
                        />
                        <textarea
                          placeholder="Describe your corporate/retail inquiry in detail..."
                          className="w-full h-20 bg-[#0a0a0a] border border-[#262626] rounded p-3 text-xs text-white focus:outline-none"
                          value={quickMessageText}
                          onChange={e => setQuickMessageText(e.target.value)}
                        />
                      </div>

                      <button
                        onClick={() => handleSendMessage(activeManagerTab)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-lg transition"
                      >
                        Submit Message via WhatsApp →
                      </button>
                    </div>
                  )}

                  {/* GM Form Flow: Queued (Does NOT open WhatsApp immediately) */}
                  {activeManagerTab === 'gm' && (
                    <div className="space-y-3 pt-2 border-t border-[#262626]/40 mt-1 font-sans">
                      <div className="p-3 bg-[#e5e5e5] text-black border border-[# gb] rounded-lg text-xs leading-normal font-bold">
                        ⚠️ General Manager Request Protocol:
                        <p className="font-normal text-[11px] mt-1 text-zinc-800">
                          Matters submitted here will NOT trigger standard immediate WhatsApp messages. Instead, they are queued directly for staff evaluation and coordinator follow-up.
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Matter Category</label>
                          <select
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-white"
                            value={gmRequestType}
                            onChange={e => setGmRequestType(e.target.value as any)}
                          >
                            <option value="Business Partnership/Distributorship">Business Partnership / Distributorship</option>
                            <option value="Large Corporate Order">Large Corporate Bulk Order</option>
                            <option value="Escalated Complaint">Escalated Customer Complaint</option>
                            <option value="VIP Customer Enquiry">VIP Customer Enquiry</option>
                            <option value="Other Major Matter">Other Important Major Matter</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Your Name"
                            className="bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                            value={quickName}
                            onChange={e => setQuickName(e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Your WhatsApp Phone"
                            className="bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                            value={quickPhone}
                            onChange={e => setQuickPhone(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Preferred Coordinator Call Time</label>
                          <select
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-white"
                            value={gmContactTime}
                            onChange={e => setGmContactTime(e.target.value)}
                          >
                            <option value="Morning (8am-12pm)">Morning (8:00 AM – 12:00 PM)</option>
                            <option value="Afternoon (1pm-4pm)">Afternoon (1:00 PM – 4:00 PM)</option>
                            <option value="Evening (5pm-7pm)">Evening (5:00 PM – 7:00 PM)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Detailed Description of Request</label>
                          <textarea
                            placeholder="Detail your request..."
                            className="w-full h-16 bg-[#0a0a0a] border border-[#262626] rounded p-3 text-xs text-white focus:outline-none"
                            value={gmMessage}
                            onChange={e => setGmMessage(e.target.value)}
                          />
                        </div>

                        <button
                          onClick={handleSubmitGMRequest}
                          className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-[#F5C518] text-xs font-bold uppercase rounded-lg border border-zinc-700 transition"
                        >
                          Queue GM Request →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ROOM 11: SHADOW MANAGEMENT ACTIVITY LOG */}
            {currentRoom === 'shadow' && (
              <div className="p-4 space-y-4 text-left font-serif">
                <div className="text-center mb-1 font-sans">
                  <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Shadow Analysis</h2>
                  <p className="text-md font-bold text-zinc-300">Live Workspace Diagnostics Log</p>
                </div>

                <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3 font-mono text-[10px] text-zinc-400">
                  <div className="flex justify-between pb-2 border-b border-[#262626]">
                    <span>Diagnosed Modules</span>
                    <span className="text-emerald-500">Online</span>
                  </div>
                  <p>· UTC Sync Reference: {new Date().toLocaleTimeString()} UTC</p>
                  <p>· Active cart tokens: {totalItemsCount} units locked</p>
                  <p>· Workspace Host: Warri, Delta State Hub</p>
                  <p>· Active price points monitoring: True</p>
                  <p>· Current General Manager availability status: {mgrStatus.toUpperCase()}</p>
                  
                  <div className="pt-2 border-t border-[#262626] text-[9px] text-zinc-500 italic font-serif leading-relaxed">
                    "This system traces offline diagnostics and keeps secure database backups. Only authorized administrators possess physical decryption tokens."
                  </div>
                </div>
              </div>
            )}

            {/* ROOM 12: CONTACT & PHYSICAL LOCATION MAP */}
            {currentRoom === 'contact' && (
              <div className="p-4 space-y-4 text-left">
                <div className="text-center mb-1">
                  <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Corporate Headquarters</h2>
                  <p className="text-md font-serif font-bold text-zinc-300">HiTech Office Location Details</p>
                </div>

                <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3">
                  <div className="flex gap-2 items-start text-xs font-sans">
                    <MapPin className="text-[#CC0000] w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-zinc-200">HiTech Emporium Warehouse</h4>
                      <p className="text-zinc-400 mt-1">{STORE.address}</p>
                      <p className="text-[#F5C518] mt-1 font-semibold">{STORE.hours}</p>
                      <p className="text-zinc-500 mt-0.5">Phone: +{WA_SALES}</p>
                    </div>
                  </div>

                  {/* Directions helper */}
                  <div className="pt-2 border-t border-[#262626]">
                    <button 
                      onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(STORE.address)}`, '_blank')}
                      className="w-full py-1.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-[#F5C518] font-sans font-bold uppercase rounded text-xs text-center"
                    >
                      Get Directions via Google Maps →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ROOM 13: REVIEWS & FEEDBACK */}
            {currentRoom === 'feedback' && (
              <div className="p-4 space-y-4 text-left font-sans">
                <div className="text-center mb-1">
                  <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Public Testimonials</h2>
                  <p className="text-md font-serif font-bold text-zinc-300">Client Feedback Logistics</p>
                </div>

                {/* Submissions form card */}
                <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl space-y-3 text-xs">
                  <span className="text-[10px] uppercase font-bold text-zinc-300 block tracking-wider">Leave a Star Review</span>
                  
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          onClick={() => setReviewRating(star)}
                          className="hover:scale-105 transition"
                        >
                          <Star className={`w-5 h-5 ${reviewRating >= star ? 'text-[#F5C518] fill-[#F5C518]' : 'text-zinc-600'}`} />
                        </button>
                      ))}
                    </div>

                    <input 
                      type="text" 
                      placeholder="Your Full Name Name" 
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-white uppercase focus:outline-none"
                      value={reviewName}
                      onChange={e => setReviewName(e.target.value)}
                    />
                    <textarea 
                      placeholder="Share your experience dealing with standard logistics or retail models..." 
                      className="w-full h-16 bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-xs text-white focus:outline-none"
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                    />

                    <button 
                      onClick={handlePostReview}
                      className="w-full py-1.5 bg-[#F5C518] hover:bg-amber-500 text-[#0a0a0a] uppercase font-bold text-xs rounded transition"
                    >
                      Post Review Live
                    </button>
                  </div>
                </div>

                {/* Reviews feed */}
                <div className="space-y-2.5 mt-4">
                  {reviewsList.map(item => (
                    <div key={item.id} className="bg-[#141414] border border-[#262626] p-3 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-zinc-300 font-sans uppercase">{item.name}</span>
                        <span className="text-zinc-500">{item.timestamp}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, starIdx) => (
                          <Star key={starIdx} className={`w-3 h-3 ${item.rating > starIdx ? 'text-[#F5C518] fill-[#F5C518]' : 'text-zinc-700'}`} />
                        ))}
                      </div>
                      <p className="text-[11px] text-zinc-400 italic">"{item.text}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ROOM 14: STAFF OPERATIONS PORTAL */}
            {currentRoom === 'staff' && (
              <StaffRoom 
                products={productsList}
                solarProducts={solarProductsList}
                repairs={repairsList}
                gmq={gmqList}
                mgrStatus={mgrStatus}
                bankAccount={bankAccount}
                spreadsheetId={spreadsheetId}
                openingPhotoUrl={openingPhotoUrl}
                liveEmbedUrl={liveEmbedUrl}
                contacts={contacts}
                requests={requestsList}
                galleryVideos={galleryVideos}
                onUpdateProducts={handleUpdateProducts}
                onUpdateSolarProducts={handleUpdateSolarProducts}
                onUpdateRepairs={handleUpdateRepairs}
                onUpdateGmq={handleUpdateGmq}
                onToggleMgrStatus={() => {
                  const val = mgrStatus === 'available' ? 'busy' as const : 'available' as const;
                  setMgrStatus(val);
                  localStorage.setItem('ht_mgrstatus', val);
                }}
                onUpdateBankAccount={handleUpdateBankAccount}
                onAddCustomDeal={handleAddCustomDeal}
                onUpdateSpreadsheetId={handleUpdateSpreadsheetId}
                onUpdateOpeningPhoto={handleUpdateOpeningPhoto}
                onUpdateLiveEmbedUrl={handleUpdateLiveEmbedUrl}
                onUpdateContacts={handleUpdateContacts}
                onCreateRequest={handleCreateRequest}
                onApproveRequest={handleApproveRequest}
                onRejectRequest={handleRejectRequest}
                onAddVideo={handleAddVideo}
                onRemoveVideo={handleRemoveVideo}
                galleryPhotos={galleryPhotos}
                onUpdateGalleryPhotos={saveGalleryPhotosToStorage}
                cloudinaryConfig={cloudinaryConfig}
                onUpdateCloudinaryConfig={handleUpdateCloudinaryConfig}
              />
            )}

          </div>

          {/* FIXED BOTTOM NAVIGATION BAR BAR */}
          <nav id="nav" className="fixed bottom-0 left-0 bg-[#0a0a0a] border-t border-[#262626] w-full flex overflow-x-auto select-none h-14 z-45 items-center scrollbar-none px-2 shrink-0">
            {[
              { id: 'showroom', label: 'Showroom', icon: <ShoppingBag className="w-4 h-4 text-[#F5C518]" /> },
              { id: 'gallery', label: 'Gallery', icon: <Image className="w-4 h-4" /> },
              { id: 'solar', label: 'Solar', icon: <Sun className="w-4 h-4 text-[#F5C518]" /> },
              { id: 'channels', label: 'Channels', icon: <Radio className="w-4 h-4" /> },
              { id: 'repair', label: 'Repair', icon: <Wrench className="w-4 h-4" /> },
              { id: 'deals', label: 'Deals', icon: <Tag className="w-4 h-4" /> },
              { id: 'livesheet', label: 'Live', icon: <ListCollapse className="w-4 h-4" /> },
              { id: 'invoice', label: 'Invoice', icon: <FileText className="w-4 h-4" />, countBadge: totalItemsCount },
              { id: 'info', label: 'AI', icon: <Bot className="w-4 h-4 text-[#F5C518]" /> },
              { id: 'manager', label: 'Manager', icon: <ContactIcon className="w-4 h-4" /> },
              { id: 'shadow', label: 'Shadow', icon: <ShieldCheck className="w-4 h-4" /> },
              { id: 'contact', label: 'Contact', icon: <MapPin className="w-4 h-4 text-red-500" /> },
              { id: 'feedback', label: 'Review', icon: <Star className="w-4 h-4 text-amber-500" /> },
              { id: 'staff', label: 'Staff', icon: <ShieldAlert className="w-4 h-4" /> }
            ].map(tab => {
              const isActive = currentRoom === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentRoom(tab.id);
                    // Standard persistence quirk: maintain category state only, reset when required
                  }}
                  className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-full px-1.5 transition-all text-[8px] relative ${
                    isActive 
                      ? 'text-[#F5C518] font-bold border-t-2 border-[#F5C518]' 
                      : 'text-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  <div className="mb-0.5 relative">
                    {tab.icon}
                    {tab.countBadge ? (
                      <span className="absolute -top-1.5 -right-2 bg-red-600 text-white rounded-full font-sans font-extrabold text-[7px] w-3.5 h-3.5 flex items-center justify-center shadow-lg animate-pulse">
                        {tab.countBadge}
                      </span>
                    ) : null}
                  </div>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

        </div>
      )}

      {/* DETAIL MODAL OVERLAY */}
      <ProductDetailOverlay
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(pId) => {
          addToCart(pId, 1);
          alert(`Added item to cart list successfully!`);
        }}
        onAddSolarToCart={(sId) => {
          addToSolarCart(sId, 1);
          alert(`Added solar component to checklist successfully!`);
        }}
        imageCache={imageCache}
        onUpdateImageCache={handleUpdateImageCache}
        onTriggerEnquiry={(msg) => openWhatsAppLink(contacts.sales, msg)}
        isStaffLoggedIn={isStaffLoggedIn}
        onEdit={(p) => {
          setSelectedProduct(null);
          if (typeof p.id === 'string') {
            setEditingSolar(p as SolarProduct);
          } else {
            setEditingProduct(p as Product);
          }
        }}
        onDelete={async (p) => {
          setSelectedProduct(null);
          if (typeof p.id === 'string') {
            await handleDeleteSolarProduct(p.id);
            alert("🗑️ Solar configuration deleted from system!");
          } else {
            await handleDeleteProduct(p.id);
            alert("🗑️ Product deleted from system!");
          }
        }}
        onChangePhoto={async (p, finalUrl) => {
          if (typeof p.id === 'string') {
            const updated = { ...p, imageUrl: finalUrl } as SolarProduct;
            await handleSaveSolarProduct(updated);
          } else {
            const updated = { ...p, imageUrl: finalUrl } as Product;
            await handleSaveProduct(updated);
          }
        }}
        cloudinaryConfig={cloudinaryConfig}
      />

    </div>
  );
}
