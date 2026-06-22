/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, MessageSquare, Image, Cpu, Check, Upload, Trash2 } from 'lucide-react';
import { Product, SolarProduct } from '../types';
import { compressImage } from '../lib/imageCompressor';
import { uploadImageToCDNOrLocal } from '../lib/cloudinaryService';

interface ProductDetailOverlayProps {
  product: Product | SolarProduct | null;
  onClose: () => void;
  onAddToCart: (productId: number) => void;
  onAddSolarToCart: (solarId: string) => void;
  imageCache: { [key: string]: string };
  onUpdateImageCache: (key: string, url: string) => void;
  onTriggerEnquiry: (msg: string) => void;
  isStaffLoggedIn?: boolean;
  onEdit?: (product: Product | SolarProduct) => void;
  onDelete?: (product: Product | SolarProduct) => void;
  onChangePhoto?: (product: Product | SolarProduct, imageUrl: string) => void;
  cloudinaryConfig?: { cloudName: string; uploadPreset: string };
}

export function getDefaultProductImage(product: Product | SolarProduct): string {
  const isSolar = typeof product.id === 'string';
  const name = product.n.toLowerCase();
  
  if (isSolar) {
    const cat = (product as SolarProduct).cat;
    if (cat === 'Inverters' || name.includes('inverter')) {
      if (name.includes('hybrid')) {
        return 'https://images.unsplash.com/photo-1620038650424-85e6ebd9592f?auto=format&fit=crop&w=600&q=80';
      }
      return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
    }
    if (cat === 'Lithium Batteries' || name.includes('lithium')) {
      return 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=600&q=80';
    }
    if (cat === 'Tubular Battery' || name.includes('tubular') || name.includes('battery')) {
      return 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=600&q=80';
    }
    if (cat === 'Solar Panels' || name.includes('panel')) {
      return 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=600&q=80';
    }
    if (cat === 'Controllers' || name.includes('controller') || name.includes('sccm')) {
      return 'https://images.unsplash.com/photo-1601524909162-be47142be8be?auto=format&fit=crop&w=600&q=80';
    }
    return 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80';
  } else {
    const cat = (product as Product).cat.toLowerCase();
    if (cat.includes('laptop')) {
      if (name.includes('probook') || name.includes('elitebook')) {
        return 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80';
      }
      return 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80';
    }
    if (cat.includes('printer')) {
      if (name.includes('tank') || name.includes('smart')) {
        return 'https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?auto=format&fit=crop&w=600&q=80';
      }
      return 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=600&q=80';
    }
    if (cat.includes('desktop') || cat.includes('all-in-one') || name.includes('all-in-one')) {
      return 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=80';
    }
    if (cat.includes('camera') || name.includes('cctv')) {
      return 'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=600&q=80';
    }
    if (cat.includes('networking')) {
      return 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80';
    }
    return 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80';
  }
}

export default function ProductDetailOverlay({
  product,
  onClose,
  onAddToCart,
  onAddSolarToCart,
  imageCache,
  onUpdateImageCache,
  onTriggerEnquiry,
  isStaffLoggedIn = false,
  onEdit,
  onDelete,
  onChangePhoto,
  cloudinaryConfig
}: ProductDetailOverlayProps) {
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeView, setActiveView] = useState<'Front' | 'Side' | 'Back' | 'Top'>('Front');

  useEffect(() => {
    if (!product) {
      setLocalImageUrl(null);
      return;
    }
    const cacheKey = product.id.toString();
    if (product.imageUrl) {
      setLocalImageUrl(product.imageUrl);
    } else if (imageCache[cacheKey]) {
      setLocalImageUrl(imageCache[cacheKey]);
    } else {
      setLocalImageUrl(getDefaultProductImage(product));
    }
  }, [product, imageCache]);

  if (!product) return null;

  const isSolar = typeof product.id === 'string';
  const displayPrice = product.price;

  const handleWhatsAppEnquiry = () => {
    const text = `Hello HiTech Sales Team, I am interested in ${product.n} with specifications: "${product.sp}". Price: ${displayPrice}. Is this in-stock?`;
    onTriggerEnquiry(text);
  };

  const brand = isSolar ? (product as SolarProduct).brand : (product.n.split(' ')[0] || 'HITECH');
  const category = isSolar ? (product as SolarProduct).cat : (product as Product).cat;
  const code = isSolar ? product.id : (product as Product).pn;
  const shortDesc = product.desc || `Looking for an affordable & highly robust option certified by HiTech Distributors...`;

  const specsList = product.sp
    ? product.sp.split('\n').map(s => s.trim().replace(/^[•\-\*\s]+/, '')).filter(Boolean)
    : ["No additional technical specifications provided."];

  const getPromoLabel = () => {
    const nameLower = product.n.toLowerCase();
    if (!isSolar) {
      const catLower = (product as Product).cat.toLowerCase();
      if (catLower.includes('laptop') || nameLower.includes('laptop')) {
        return '🔥 BUY 18 GET 2 FREE';
      }
      if (catLower.includes('printer') || nameLower.includes('printer')) {
        return '🔥 GET COMPLIMENTARY TONER CART PACK';
      }
    } else {
      const catVal = (product as SolarProduct).cat;
      if (catVal === 'Lithium Batteries' || nameLower.includes('lithium')) {
        return '🔥 SECURE 5-YEAR FULL DIRECT WARRANTY';
      }
      if (catVal === 'Solar Panels' || nameLower.includes('panel')) {
        return '🔥 FREE STRUCTURAL MOUNT INSTALLATION';
      }
    }
    return '🔥 BUY WHOLESALE VALUE PACK TO SAVE 10%';
  };
  const promoLabel = getPromoLabel();

  // Dynamic 3D transform style based on perspective view
  const getTransformStyle = (): React.CSSProperties => {
    switch (activeView) {
      case 'Side':
        return { transform: 'perspective(600px) rotateY(38deg) skewY(-2deg) scale(0.95)' };
      case 'Back':
        return { transform: 'scaleX(-1) rotate(2deg)' };
      case 'Top':
        return { transform: 'perspective(600px) rotateX(42deg) rotateZ(8deg) scale(0.9)' };
      case 'Front':
      default:
        return { transform: 'none' };
    }
  };

  // Spacer component to separate rows
  const PipelineSpacer = () => (
    <div className="flex justify-center py-2 select-none no-print">
      <span className="text-[#F5C518] text-[9px] font-mono tracking-widest animate-pulse">▼</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/95 backdrop-blur-sm flex justify-center items-center z-50 p-4 md:p-6 overflow-y-auto">
      {/* Target card container with beautiful high contrast border */}
      <div className="bg-[#0c0c0c] border border-zinc-800 rounded-2xl w-full max-w-[460px] p-5 md:p-6 shadow-2xl relative scrollbar-none animate-slide-up flex flex-col my-auto border-double border-4">
        
        {/* Close Button top-right */}
        <button 
          onClick={onClose}
          className="absolute -top-3.5 -right-3.5 text-zinc-400 hover:text-zinc-100 p-2 bg-[#121212] border border-zinc-800 rounded-full transition-all hover:scale-105 shadow-xl z-20 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Staff Administration bar (only if staff is authenticated) */}
        {isStaffLoggedIn && (
          <div className="mb-4 p-2 bg-zinc-950/80 border border-zinc-900 rounded-lg flex justify-between items-center no-print">
            <span className="text-[9px] uppercase font-mono font-bold text-amber-500 tracking-wider">🔒 Staff Controls</span>
            <div className="flex gap-1.5">
              {onEdit && (
                <button
                  onClick={() => onEdit(product)}
                  className="text-[9px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 hover:bg-amber-500/25 px-2 py-1 rounded border border-amber-500/20 transition-all cursor-pointer"
                >
                  ✏️ Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${product.n}" permanently?`)) {
                      onDelete(product);
                    }
                  }}
                  className="text-[9px] font-mono font-bold uppercase bg-red-950/20 text-red-400 hover:bg-red-500/20 px-2 py-1 rounded border border-red-500/25 transition-all cursor-pointer"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>
        )}

        {/* Interactive Double-Bordered Image Box */}
        <div className="border-4 border-double border-zinc-700 rounded-xl bg-black px-4 pt-4 pb-3.5 relative flex flex-col justify-between min-h-[240px] overflow-hidden select-none">
          
          {/* Top-Right Multi-View Selector labels & dots */}
          <div className="absolute top-3.5 right-3.5 text-right z-10">
            <div className="flex gap-2 justify-end font-mono text-[8px] font-extrabold uppercase tracking-widest text-zinc-500">
              {(['Front', 'Side', 'Back', 'Top'] as const).map(view => (
                <span 
                  key={view} 
                  onClick={() => setActiveView(view)}
                  className={`cursor-pointer transition-colors ${activeView === view ? 'text-[#F5C518]' : 'hover:text-zinc-300'}`}
                >
                  {view}
                </span>
              ))}
            </div>
            
            <div className="flex gap-2.5 justify-end font-mono text-[9px] items-center mt-1 pr-0.5 leading-none">
              {(['Front', 'Side', 'Back', 'Top'] as const).map(view => (
                <span 
                  key={view}
                  onClick={() => setActiveView(view)} 
                  className={`cursor-pointer transition-colors leading-none ${activeView === view ? 'text-[#F5C518]' : 'text-zinc-700 hover:text-zinc-400'}`}
                >
                  {activeView === view ? '●' : '○'}
                </span>
              ))}
            </div>
          </div>

          {/* Central Image rendering with active View perspective */}
          <div className="flex-1 flex items-center justify-center min-h-[140px] pt-4">
            {localImageUrl ? (
              <img 
                src={localImageUrl} 
                alt={product.n} 
                style={getTransformStyle()}
                className="max-w-full max-h-[140px] object-contain rounded-lg select-none transition-all duration-500 ease-in-out drop-shadow-2xl"
                onError={(e) => {
                  console.error(`🚨 Image Load Failure inside Card`, { url: localImageUrl });
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getDefaultProductImage(product);
                }}
              />
            ) : (
              <div className="p-4 text-center space-y-1">
                <Image className="w-7 h-7 text-zinc-700 mx-auto" />
                <p className="text-zinc-600 text-[10px] uppercase font-mono">Photo not buffered</p>
              </div>
            )}

            {/* Upload spinner layer */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[9px] font-mono text-amber-400 font-extrabold uppercase tracking-widest animate-pulse">Synchronizing...</span>
              </div>
            )}

            {/* Direct photo upload trigger for logged-in staff */}
            {isStaffLoggedIn && !isUploading && (
              <label className="absolute bottom-2 left-2 bg-black/80 hover:bg-black text-[9px] text-amber-400 font-mono font-bold py-1 px-2 rounded border border-zinc-800 cursor-pointer flex items-center gap-1 transition-all z-10 hover:border-amber-500/50 shadow-md">
                <Upload className="w-3 h-3" />
                <span>Upload</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setIsUploading(true);
                      const reader = new FileReader();
                      reader.onload = async () => {
                        try {
                          const dataUrl = reader.result as string;
                          const compressed = await compressImage(dataUrl);
                          const finalUrl = await uploadImageToCDNOrLocal(file.name, compressed, cloudinaryConfig);
                          if (onChangePhoto) {
                            await onChangePhoto(product, finalUrl);
                          }
                          onUpdateImageCache(product.id.toString(), finalUrl);
                          setLocalImageUrl(finalUrl);
                          alert("📷 Product showroom photo synced successfully!");
                        } catch (innerErr: any) {
                          alert("Upload failed: " + innerErr.message);
                        } finally {
                          setIsUploading(false);
                        }
                      };
                      reader.readAsDataURL(file);
                    } catch (err: any) {
                      alert("Failure initiating uploader: " + err.message);
                      setIsUploading(false);
                    }
                  }}
                />
              </label>
            )}
          </div>

          {/* Center aligned View name under picture */}
          <div className="text-center mt-2">
            <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
              ({activeView} View)
            </span>
          </div>
        </div>

        {/* Separator */}
        <PipelineSpacer />

        {/* [BRAND BADGE] & [CATEGORY BADGE] */}
        <div className="border border-[#262626] bg-[#070707] rounded-xl p-3 flex justify-center items-center gap-2">
          <span className="bg-[#F5C518]/10 text-[#F5C518] border border-[#F5C518]/25 px-2.5 py-1 rounded text-[10px] uppercase font-mono font-extrabold tracking-wider">
            {brand}
          </span>
          <span className="bg-zinc-800/50 text-zinc-300 border border-zinc-700/50 px-2.5 py-1 rounded text-[10px] uppercase font-mono font-extrabold tracking-wider">
            {category}
          </span>
        </div>

        {/* Separator */}
        <PipelineSpacer />

        {/* Code representation Row */}
        <div className="border border-[#262626] bg-[#070707] rounded-xl p-3 text-center">
          <span className="text-zinc-650 font-mono text-[9px] uppercase font-bold tracking-wider mr-2">CODE:</span>
          <span className="text-zinc-300 font-mono font-black text-[10px] tracking-widest uppercase select-all">
            {code || 'HT-PROD'}
          </span>
        </div>

        {/* Separator */}
        <PipelineSpacer />

        {/* Short description italic line */}
        <div className="text-center text-[10.5px] italic text-zinc-400 font-serif leading-normal px-2">
          ── {shortDesc} ──
        </div>

        {/* Separator */}
        <PipelineSpacer />

        {/* Specs bullet representation card */}
        <div className="space-y-1 border border-zinc-900 bg-zinc-950 p-2.5 rounded-xl text-left select-text">
          {specsList.map((spec, index) => (
            <div key={index} className="flex items-start gap-1.5 text-[10.5px] text-zinc-350 font-mono leading-relaxed">
              <span className="text-[#F5C518] shrink-0">•</span>
              <span className="uppercase">{spec}</span>
            </div>
          ))}
        </div>

        {/* Separator */}
        <PipelineSpacer />

        {/* Name representation */}
        <div className="border border-[#262626] bg-[#070707] rounded-xl p-3 text-center flex items-center justify-center gap-1.5">
          <span className="text-[#F5C518] text-xs">⚙️</span>
          <span className="text-[10px] font-black uppercase text-[#f3f3f3] tracking-widest font-sans leading-tight">
            {product.n}
          </span>
        </div>

        {/* Separator */}
        <PipelineSpacer />

        {/* Price & In stock representation */}
        <div className="border border-[#262626] bg-[#070707] rounded-xl p-3 flex justify-between items-center text-[11px] font-mono font-extrabold tracking-wide uppercase select-text">
          <span className="text-[#F5C518] text-xs font-black">{displayPrice}</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse block"></span>
            <span className="text-emerald-400 uppercase font-bold text-[9px] tracking-widest">● In Stock</span>
          </div>
        </div>

        {/* Separator */}
        <PipelineSpacer />

        {/* Promotion representation */}
        <div className="border border-dashed border-amber-600/30 bg-amber-500/5 rounded-xl p-3 text-center">
          <span className="text-amber-400 font-mono text-[9px] font-black uppercase tracking-widest block animate-pulse">
            {promoLabel}
          </span>
        </div>

        {/* Separator */}
        <PipelineSpacer />

        {/* Interactive customer reviews redirect */}
        <button
          type="button"
          onClick={() => {
            // Trigger custom event to setParent to feedback/review room
            window.dispatchEvent(new CustomEvent('switch-room', { detail: 'feedback' }));
            onClose();
            // Scroll to testimonials layout
            setTimeout(() => {
              const el = document.getElementById('reviews-section') || document.getElementById('testimonials-section') || document.body;
              el.scrollIntoView({ behavior: 'smooth' });
            }, 180);
          }}
          className="w-full border border-dashed border-zinc-800 bg-[#0b0b0b] hover:bg-zinc-900 rounded-xl p-3 text-center text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:text-white hover:border-zinc-500 active:scale-98"
        >
          <span>👥 See what others think → Visit Website</span>
        </button>

        {/* Sleek checkout / action buttons outside the card structure */}
        <div className="flex gap-2 mt-5 no-print border-t border-zinc-900 pt-4">
          <button
            type="button"
            onClick={handleWhatsAppEnquiry}
            className="flex-1 py-2.5 px-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Spec</span>
          </button>

          {displayPrice !== 'CALL' && (
            <button
              type="button"
              onClick={() => {
                if (isSolar) {
                  onAddSolarToCart(product.id as string);
                } else {
                  onAddToCart(product.id as number);
                }
                onClose();
              }}
              className="flex-1 py-2.5 px-3 bg-[#F5C518] hover:bg-amber-500 text-[#0a0a0a] rounded-xl transition-all flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer active:scale-95 shadow-md"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>+ Cart List</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

