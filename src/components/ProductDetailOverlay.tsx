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

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm flex justify-center items-end z-50">
      {/* Container max-width 430px match mobile feel */}
      <div className="bg-[#141414] border-t border-[#262626] rounded-t-2xl w-full max-w-[430px] overflow-y-auto max-h-[85vh] p-5 shadow-2xl relative scrollbar-none animate-slide-up">
        {/* Close Button top-right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 p-1 bg-zinc-950 border border-[#262626] rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Brand Header / Tags */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between items-center pr-8">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">
              {isSolar ? 'Solar Setup Portfolio' : (product as Product).cat}
            </span>
            {isStaffLoggedIn && (
              <div className="flex gap-1.5 shrink-0">
                {onEdit && (
                  <button
                    onClick={() => onEdit(product)}
                    className="text-[9px] font-sans font-extrabold uppercase bg-amber-500/10 text-amber-400 hover:bg-amber-500/25 px-2 py-1 rounded-md border border-amber-500/30 flex items-center gap-1 transition-all"
                  >
                    ✏️ Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${product.n}" from database permanently?`)) {
                        onDelete(product);
                      }
                    }}
                    className="text-[9px] font-sans font-extrabold uppercase bg-red-955/10 text-red-400 hover:bg-red-500/25 px-1.5 py-1 rounded-md border border-red-500/30 flex items-center gap-1 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <h2 className="text-lg font-bold text-[#f5f5f5] leading-tight pr-8">{product.n}</h2>
          {(!isSolar && (product as Product).pn && (product as Product).pn !== '—') && (
            <p className="text-[10px] text-zinc-400 font-mono">P/N: {(product as Product).pn}</p>
          )}
        </div>

        {/* Product Image Section */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-[#0a0a0a] border border-[#262626] flex items-center justify-center mb-4 text-xs text-zinc-500 group">
          {localImageUrl ? (
            <img 
              src={localImageUrl} 
              alt={product.n} 
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error(`🚨 [Image Load Failure] Product detail overlay image failed to load!`, {
                  url: localImageUrl,
                  id: product.id,
                  name: product.n,
                  host: window.location.host
                });
                if (localImageUrl.startsWith('/uploads/')) {
                  console.warn(`💡 [Diagnostic Tip] Relative URL "/uploads/..." failed to load on Netlify. Dynamically uploaded photos are server-side and don't exist on Netlify (static deployment) without Option C (Cloudinary Auto-Hosting) configured.`);
                }
                e.currentTarget.onerror = null;
                e.currentTarget.src = getDefaultProductImage(product);
              }}
            />
          ) : (
            <div className="p-4 text-center space-y-2">
              <Image className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-zinc-500 text-[11px]">No product photo cached</p>
            </div>
          )}

          {/* Upload spinner layer */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase tracking-widest animate-pulse">Uploading...</span>
            </div>
          )}

          {/* Direct photo upload trigger for logged-in staff */}
          {isStaffLoggedIn && !isUploading && (
            <label className="absolute bottom-2 right-2 bg-black/75 hover:bg-black text-[10px] text-amber-400 font-bold py-1.5 px-3 rounded-lg border border-zinc-800 cursor-pointer flex items-center gap-1.5 transition-all z-10 hover:border-amber-500/50 shadow-lg">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
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
                        // Compress photo
                        const compressed = await compressImage(dataUrl);
                        // Save to server/CDN
                        const finalUrl = await uploadImageToCDNOrLocal(file.name, compressed, cloudinaryConfig);
                        
                        // Fire callback to save matching doc to Firestore/Local list
                        if (onChangePhoto) {
                          await onChangePhoto(product, finalUrl);
                        }
                        
                        // Update cache in-applet
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

        {/* Specifications List */}
        <div className="space-y-4">
          <div>
            <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Specifications</h4>
            <p className="text-xs text-zinc-200 mt-1 font-mono leading-relaxed bg-[#0a0a0a] border border-[#262626] p-2.5 rounded-lg">
              {product.sp}
            </p>
          </div>

          <div>
            <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">About Product</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {product.desc || "A top-tier commercial unit imported and certified by HiTech Distributors, providing incredible build lifespan metrics and high electrical insulation ratings."}
            </p>
          </div>

          {/* Pricing & Checkout Block */}
          <div className="pt-3 border-t border-[#262626] flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">Unit Price</span>
              <span className="text-xl font-bold font-mono text-[#F5C518]">{displayPrice}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleWhatsAppEnquiry}
                className="p-2.5 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-600/20 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold uppercase"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </button>

              {displayPrice !== 'CALL' && (
                <button
                  onClick={() => {
                    if (isSolar) {
                      onAddSolarToCart(product.id as string);
                    } else {
                      onAddToCart(product.id as number);
                    }
                    onClose();
                  }}
                  className="px-4 py-2.5 bg-[#F5C518] hover:bg-amber-500 text-[#0a0a0a] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold uppercase shadow-lg"
                >
                  <ShoppingCart className="w-4 h-4" />
                  + Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
