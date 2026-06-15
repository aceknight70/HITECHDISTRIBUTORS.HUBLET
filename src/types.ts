/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description: string;
}

export interface Product {
  id: number;
  pn: string;
  cat: string;
  n: string;
  sp: string;
  price: string; // "₦X,XXX,XXX" or "CALL"
  promo?: boolean;
  newp?: boolean;
  desc: string;
  imageUrl?: string; // Cache for AI generated photo
}

export type SolarCat = 'Inverters' | 'Lithium Batteries' | 'Tubular Battery' | 'Solar Panels' | 'Controllers' | 'Cables' | 'All-in-One';

export interface SolarProduct {
  id: string;
  cat: SolarCat;
  n: string;
  brand: string;
  sp: string;
  price: string; // "₦X,XXX,XXX"
  desc?: string;
  imageUrl?: string; // AI generated
}

export interface RepairRecord {
  id: string; // format: 'HT-YYYY-XXX' assigned by staff or auto generated for tracking
  type: 'Laptop' | 'Desktop' | 'Printer' | 'Monitor' | 'Other';
  brand: string;
  problem: string;
  name: string;
  phone: string;
  ref: string; // Reference tag (e.g. HT-2026-001)
  status: 'Received' | 'Diagnosed' | 'Sent Away' | 'In Repair' | 'Returned' | 'Ready for Pickup';
  submitted: string; // date string
  stages: string[]; // history of stages
  aiTriage?: {
    category: string;
    complexity: 'Low' | 'Medium' | 'High';
    explanation: string;
  };
}

export interface GMRequest {
  id: string;
  type: 'Business Partnership/Distributorship' | 'Large Corporate Order' | 'Escalated Complaint' | 'VIP Customer Enquiry' | 'Other Major Matter';
  msg: string;
  name: string;
  phone: string;
  preferredTime: string;
  ts: string; // Timestamp
  status: 'pending' | 'addressed';
}

export interface Deal {
  id: string;
  title: string;
  desc: string;
  origPrice: string;
  salePrice: string;
  badge: string;
  icon?: string;
  isCustom?: boolean;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  timestamp: string;
}

export interface AppState {
  cart: { [productId: number]: number }; // id to quantity
  solarCart: { [solarId: string]: number }; // solarId to quantity
  mgrStatus: 'available' | 'busy';
  bankAccount: {
    bank: string;
    accountNumber: string;
    accountName: string;
  };
}
