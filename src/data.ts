/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Product, SolarProduct, Deal } from './types';

export const WA_SALES = '2348065210611';
export const WA_INVENTORY = '2348034832773';
export const WA_GM = '2348032175552';
export const WA_GEN = '2347032724432';
export const DEF_PIN = '12345';
export const MGR_KEY = 'qw123#@';

export const STORE = {
  name: 'HiTech Emporium',
  legalName: 'HiTech Distributors',
  addr: '6 Airport Road, Warri, Delta State, Nigeria',
  phone: '08032175552',
  hours: 'Mon–Sat 8am–6pm',
  site: 'hitechd.com'
};

export const CATS: Category[] = [
  {
    id: 'laptops',
    name: 'Laptops',
    icon: 'Laptop',
    description: 'HP laptop series — Omnibook, Pavilion, Envy, ProBook, Foldable, 250, 240, 15'
  },
  {
    id: 'printers',
    name: 'Printers',
    icon: 'Printer',
    description: 'HP Neverstop, DeskJet, Smart Tank, LaserJet, Color LaserJet, Sharp Copier'
  },
  {
    id: 'desktops',
    name: 'Desktops',
    icon: 'Monitor',
    description: 'HP ProOne, EliteDesk, Dell, Lenovo All-in-Ones and workstations'
  },
  {
    id: 'cameras',
    name: 'Cameras',
    icon: 'Camera',
    description: 'Canon DSLR, mirrorless, webcams and security cameras'
  },
  {
    id: 'cctv',
    name: 'CCTV & Security',
    icon: 'Shield',
    description: 'CCTV packages, DVR/NVR systems, Kaspersky security software'
  },
  {
    id: 'networking',
    name: 'Networking',
    icon: 'Wifi',
    description: 'Routers, switches, access points and network equipment'
  },
  {
    id: 'monitors',
    name: 'Monitors',
    icon: 'Tv',
    description: 'LG, Dell, ASUS monitors in various sizes and resolutions'
  },
  {
    id: 'software',
    name: 'Software',
    icon: 'Cpu',
    description: 'Microsoft Office, Windows licences, Kaspersky antivirus'
  },
  {
    id: 'accessories',
    name: 'Accessories',
    icon: 'ShoppingBag',
    description: 'Bags, mice, keyboards, cables, Bluegate UPS and stabilizers'
  }
];

export const PRODS: Product[] = [
  // Laptops
  {
    id: 1,
    pn: 'HP-853K2ES',
    cat: 'laptops',
    n: 'HP 250 G9 Laptop',
    sp: 'Intel Celeron N4500 · 4GB RAM · 256GB SSD · 15.6” FHD · FreeDos',
    price: '₦400,000',
    desc: 'If you\'re looking for an affordable laptop for everyday browsing, documents and office work, this HP 250 G9 gives you a big 15.6" screen, 4GB RAM and 256GB SSD storage.'
  },
  {
    id: 2,
    pn: 'HP-2R9H6EA',
    imageUrl: '/uploads/HP-2R9H6EA_front.jpg',
    cat: 'laptops',
    n: 'HP 250 G8 Laptop',
    sp: 'Intel Core i7 · 8GB RAM · 1TB HDD · 15.6” · FreeDOS',
    price: '₦750,000',
    newp: true,
    desc: 'If you\'re looking for a powerful laptop with serious storage, this HP 250 G8 gives you a Core i7 processor, 8GB RAM and a massive 1TB hard drive.'
  },
  {
    id: 3,
    pn: 'HP-14Z79EA',
    imageUrl: '/uploads/HP-14Z79EA_front.jpg',
    cat: 'laptops',
    n: 'HP 250 G7 Laptop',
    sp: 'Intel Core i5-1035G1 · 8GB RAM · 1TB HDD · 15.6” HD · DVD-RW · DOS',
    price: '₦690,000',
    desc: 'If you\'re looking for a reliable all-rounder with a DVD drive, this HP 250 G7 gives you Core i5, 8GB RAM and 1TB storage.'
  },
  {
    id: 4,
    pn: 'HP-C78E9AT',
    cat: 'laptops',
    n: 'HP 250R G10 Laptop (HP-C78E9AT)',
    sp: '13th Gen Intel Core i5-1334U · 8GB DDR4 · 512GB SSD · 15.6” · FreeDOS · Turbo Silver',
    price: '₦940,000',
    promo: true,
    desc: 'If you\'re looking for a fast, modern laptop with the latest processor, this HP 250R G10 gives you 13th Gen Core i5, 8GB RAM and 512GB SSD in a sleek turbo silver finish.'
  },
  {
    id: 5,
    pn: 'HP-B39TQA',
    cat: 'laptops',
    n: 'HP 250 G10 Laptop',
    sp: '13th Gen Intel Core i5-1334U · 8GB DDR4 · 512GB SSD · 15.6” · FreeDOS · Turbo Silver',
    price: '₦940,000',
    desc: 'If you\'re looking for a fast, modern laptop with the latest processor, this HP 250 G10 gives you 13th Gen Core i5, 8GB RAM and 512GB SSD in a sleek turbo silver finish.'
  },
  {
    id: 6,
    pn: 'HP-2R9H9EA',
    cat: 'laptops',
    n: 'HP 240 G8 Laptop',
    sp: 'Intel Celeron N4020 (up to 2.8 GHz) · 4GB DDR4 · 500GB HDD · FreeDOS',
    price: '₦390,000',
    desc: 'If you\'re looking for a budget laptop for simple tasks, this HP 240 G8 gives you reliable everyday performance with 4GB RAM and 500GB storage.'
  },
  {
    id: 7,
    pn: 'HP-32M66EA',
    imageUrl: '/uploads/HP-32M66EA_front.jpg',
    cat: 'laptops',
    n: 'HP 240 G8 Pentium',
    sp: 'Intel Pentium Silver N5030 (up to 3.1 GHz burst) · 4GB DDR4 · 1TB HDD · DOS',
    price: '₦490,000',
    desc: 'If you\'re looking for an affordable laptop with lots of storage space, this HP 240 G8 gives you 1TB hard drive for all your files and photos.'
  },
  {
    id: 8,
    pn: 'HP-7N0F3ES',
    imageUrl: '/uploads/HP-7N0F3ES_front.jpg',
    cat: 'laptops',
    n: 'HP 240 G9 Laptop',
    sp: 'Intel Core i3-1215U · 8GB DDR4 · 256GB SSD · 14” HD · DOS · Dark Ash Silver',
    price: '₦560,000',
    desc: 'If you\'re looking for a compact 14-inch laptop that starts up fast, this HP 240 G9 gives you Core i3 and fast SSD storage.'
  },
  {
    id: 9,
    pn: 'HP-1L3W7EA',
    imageUrl: '/uploads/HP-1L3W7EA_front.jpg',
    cat: 'laptops',
    n: 'HP 240 G7 Laptop',
    sp: 'Intel Core i5-1035G1 · 8GB DDR4 · 1TB HDD · 14” HD · Windows 10 Home · Dark Ash Silver',
    price: '₦690,000',
    desc: 'If you\'re looking for dependable performance for work and study, this HP 240 G7 gives you Core i5, 8GB RAM and 1TB storage.'
  },
  {
    id: 10,
    pn: 'HP-C40ZKEA',
    cat: 'laptops',
    n: 'HP Laptop 14-ep0179nia',
    sp: 'Intel Core i3-N305 · 8GB DDR4 · 512GB PCIe SSD · 14.0” FHD · DOS 3.0 · Natural Silver',
    price: '₦720,000',
    desc: 'If you\'re looking for a lightweight laptop for students or everyday productivity, this HP 14-inch gives you Core i3, fast SSD storage and a crisp FHD screen.'
  },
  {
    id: 11,
    pn: 'HP-2R411EA',
    imageUrl: '/uploads/HP-2R411EA_front.jpg',
    cat: 'laptops',
    n: 'HP Laptop 14-cf3016nia',
    sp: 'Intel Core i5-1035G1 · 8GB DDR4 · 1TB HDD · 14” HD SVA · Wi-Fi 6 · Bluetooth 5 · Win 10',
    price: '₦650,000',
    desc: 'If you\'re looking for a well-equipped 14-inch laptop with fast Wi-Fi, this HP gives you Core i5, 1TB storage and Wi-Fi 6 with a 1-year warranty.'
  },
  {
    id: 12,
    pn: 'HP-9B4P0EA',
    imageUrl: '/uploads/HP-9B4P0EA_front.jpg',
    cat: 'laptops',
    n: 'HP Laptop 14-ep0055nia',
    sp: 'Intel Core i5-1335U · 8GB DDR4 · 512GB SSD · 14”',
    price: '₦880,000',
    desc: 'If you\'re looking for a smooth, modern 14-inch laptop, this HP gives you Core i5 and 512GB SSD for fast performance.'
  },
  {
    id: 13,
    pn: 'HP-7L0S0EA',
    cat: 'laptops',
    n: 'HP Laptop 14s-dq5161nia',
    sp: 'Intel Core i5-1235U · 8GB DDR4 · 512GB SSD · 14.0” · Backlit · DOS · Natural Silver',
    price: '₦790,000',
    desc: 'If you\'re looking for a comfortable laptop to type on day or night, this HP 14s gives you Core i5, 512GB SSD and a backlit keyboard.'
  },
  {
    id: 14,
    pn: 'HP-C40ZGEA',
    cat: 'laptops',
    n: 'HP Laptop 14-ep0176nia',
    sp: 'Intel Core i5-1334U · 8GB DDR4 · 512GB SSD · 8.5h Battery · Backlit Keyboard · DOS · Natural Silver',
    price: '₦880,000',
    desc: 'If you\'re looking for a laptop that lasts all day, this HP 14-inch gives you Core i5, 512GB SSD and up to 8.5 hours battery life with a backlit keyboard.'
  },
  {
    id: 15,
    pn: 'HP-2E7G1EA',
    cat: 'laptops',
    n: 'HP 15 Laptop',
    sp: 'Intel Pentium Silver · 4GB DDR4 · 500GB HDD · 15.6” HD · FreeDOS · Jet Black',
    price: '₦400,000',
    desc: 'If you\'re looking for an affordable 15-inch laptop for everyday computing, this HP gives you Pentium Silver, 4GB RAM and 500GB storage in jet black.'
  },
  {
    id: 16,
    pn: 'HP-49L31EA',
    cat: 'laptops',
    n: 'HP Laptop 15-dw1078nia',
    sp: 'Intel Core i5-10210U · 12GB · 1TB HDD · 15.6” HD Touch · Windows 10 Home · Natural Silver',
    price: '₦685,000',
    desc: 'If you\'re looking for a 15.6-inch touchscreen laptop with plenty of storage, this HP gives you Core i5, 12GB RAM and 1TB storage.'
  },
  {
    id: 17,
    pn: 'HP-4A3D3EA',
    cat: 'laptops',
    n: 'HP Laptop 15-dw1258nia',
    sp: 'Intel Core i5-10210U · 12GB · 512GB SSD · 15.6” HD Touch · Windows 10 Home · Pale Gold',
    price: '₦860,000',
    desc: 'If you\'re looking for a stylish touchscreen laptop in pale gold, this HP gives you Core i5, 12GB RAM and fast SSD storage.'
  },
  {
    id: 18,
    pn: 'HP-A38JPET',
    cat: 'laptops',
    n: 'HP ProBook 440 G11',
    sp: 'Intel Core Ultra 5 125U · 16GB DDR5 · 512GB SSD · Fingerprint Reader · Windows 11 · 14”',
    price: '₦1,150,000',
    desc: 'If you\'re looking for a premium professional laptop with the latest processor and security features, this HP ProBook gives you Intel Core Ultra 5, 16GB RAM, 512GB SSD and a fingerprint reader.'
  },
  {
    id: 19,
    pn: 'HP-9G1W6ET',
    imageUrl: '/uploads/HP-9G1W6ET_front.jpg',
    cat: 'laptops',
    n: 'HP ProBook 440 G11 (Core 7)',
    sp: 'Intel Core 7 155U · 16GB DDR5 · 512GB SSD · Fingerprint Reader · Windows 11 · 14”',
    price: '₦1,340,000',
    newp: true,
    desc: 'If you\'re looking for top-tier performance for demanding professional work, this HP ProBook gives you Intel Core 7, 16GB RAM, 512GB SSD and a fingerprint reader.'
  },
  {
    id: 20,
    pn: 'HP-84V4EA',
    imageUrl: '/uploads/HP-84V4EA_front.jpg',
    cat: 'laptops',
    n: 'HP Pavilion Laptop 13-bb0029nia',
    sp: 'Intel Core i3-1115G4 · 8GB DDR4 · 256GB SSD · 13.3” · Backlit · Windows 10 · Natural Silver',
    price: '₦650,000',
    desc: 'If you\'re looking for a light, portable laptop for work on the move, this HP Pavilion gives you Core i3, 8GB RAM and a backlit keyboard in natural silver.'
  },
  {
    id: 21,
    pn: 'HP-33J73EA',
    cat: 'laptops',
    n: 'HP Pavilion Laptop 13',
    sp: 'Intel Core i5 · 8GB RAM · 256GB SSD · 13.3” · Backlit · Windows 10 · Natural Silver',
    price: '₦850,000',
    desc: 'If you\'re looking for a compact 13.3-inch laptop for professionals, this HP Pavilion gives you Core i5, 8GB RAM and 256GB SSD with a backlit keyboard.'
  },
  {
    id: 22,
    pn: 'HP-4F0U8EA',
    cat: 'laptops',
    n: 'HP Pavilion Laptop 14',
    sp: 'Intel Core i5-1135G7 · 8GB DDR4 · 512GB SSD · up to 8h 15m battery life',
    price: '₦1,100,000',
    desc: 'If you\'re looking for a reliable laptop with all-day battery life, this HP Pavilion gives you Core i5, 8GB RAM, 512GB SSD and up to 8 hours 15 minutes of battery.'
  },
  {
    id: 23,
    pn: 'HP-7Z6T2EA',
    cat: 'laptops',
    n: 'HP Pavilion x360 Touch',
    sp: 'Intel Core i5 · 8GB RAM · 512GB SSD · 14” FHD Touchscreen · Windows 11 · Natural Silver',
    price: '₦1,150,000',
    desc: 'If you\'re looking for a flexible 2-in-1 touchscreen laptop that folds into a tablet, this HP Pavilion x360 gives you Core i5, 8GB RAM and 512GB SSD in natural silver.'
  },
  {
    id: 24,
    pn: 'HP-B6QN1EA',
    cat: 'laptops',
    n: 'HP Pavilion x360 14-ek2000nia',
    sp: '14th Gen Intel Core i7-150U · 16GB DDR4 · 1TB SSD · 14” Touchscreen · Windows 11',
    price: '₦1,390,000',
    desc: 'If you\'re looking for a premium 2-in-1 with serious power and storage, this HP Pavilion x360 gives you 14th Gen Core i7, 16GB RAM and 1TB SSD with up to 9.5 hours battery.'
  },
  {
    id: 25,
    pn: 'HP-A0GE0EA',
    cat: 'laptops',
    n: 'HP Pavilion x360 14-ek1059nia',
    sp: '13th Gen Intel Core i7-1355U · 16GB DDR4 · 1TB SSD · 14” Touchscreen · Windows 11',
    price: '₦1,420,000',
    desc: 'If you\'re looking for a premium 2-in-1 touchscreen laptop, this HP Pavilion x360 gives you Core i7, 16GB RAM and 1TB SSD with up to 9.5 hours battery.'
  },
  {
    id: 26,
    pn: 'HP-C1RD3EA',
    cat: 'laptops',
    n: 'HP OmniBook 5 Flip',
    sp: 'Intel Core 7 150U · 16GB DDR5 5200 · 512GB SSD · 14” Touchscreen · 15h Battery · Powder Pink · Windows 11',
    price: '₦1,350,000',
    desc: 'If you\'re looking for a stylish flip 2-in-1 laptop with all-day battery, this HP OmniBook gives you Core 7, 16GB RAM, 512GB SSD and a 15-hour battery in powder pink.'
  },
  {
    id: 27,
    pn: 'HP-CC9W9EA',
    cat: 'laptops',
    n: 'HP OmniBook 5 Flip 1TB',
    sp: 'Intel Core 7 150U · 16GB DDR5 5200 · 1TB SSD · 14” Touchscreen · 15h Battery · Glacier Silver · Windows 11',
    price: '₦1,610,000',
    desc: 'If you\'re looking for a premium flip 2-in-1 with massive storage, this HP OmniBook gives you Core 7, 16GB RAM and 1TB SSD with a 15-hour battery in glacier silver.'
  },
  {
    id: 28,
    pn: 'HP-7N3S2UA',
    cat: 'laptops',
    n: 'HP Victus 15-FA1093DX',
    sp: 'Intel Core i5-13420H · 8GB RAM · 512GB SSD · NVIDIA RTX 3050 6GB · 15.6” FHD 144Hz · Performance Blue · Windows 11',
    price: '₦1,200,000',
    desc: 'If you\'re looking for a gaming laptop with smooth, fast visuals, this HP Victus gives you a 144Hz display, Core i5, 8GB RAM and NVIDIA RTX 3050 graphics.'
  },
  {
    id: 29,
    pn: 'HP-6X1C0EA',
    cat: 'laptops',
    n: 'HP Victus 16-D1035NIA',
    sp: 'Intel Core i7-12700H · 32GB RAM · 512GB SSD · NVIDIA Graphics · 16.1” FHD · Windows 11 Home · Silver',
    price: '₦1,700,000',
    desc: 'If you\'re looking for a high-end gaming laptop that handles the latest games, this HP Victus 16 gives you Core i7, 32GB RAM, 512GB SSD and NVIDIA graphics.'
  },
  {
    id: 30,
    pn: 'HP-350Q2EA',
    imageUrl: '/uploads/HP-350Q2EA_front.jpg',
    cat: 'laptops',
    n: 'HP Envy 13-bd0007na x360',
    sp: 'Intel Core i5-1135G7 · 8GB DDR4 · 512GB PCIe · Intel Iris Xe · 13.3” FHD Touch · Bang & Olufsen · Pale Gold · Windows 10',
    price: '₦1,100,000',
    desc: 'If you\'re looking for an elegant 2-in-1 with premium sound, this HP Envy x360 gives you Core i5, 8GB RAM, 512GB SSD, touchscreen and Bang & Olufsen audio.'
  },
  {
    id: 31,
    pn: 'HP-4Q853EA',
    cat: 'laptops',
    n: 'HP Envy Laptop 13',
    sp: 'Intel Core i5-1135G7 · 8GB DDR4 · 512GB SSD · Backlit · Pale Gold · Bang & Olufsen · Win 10',
    price: '₦850,000',
    desc: 'If you\'re looking for a premium laptop with all-day battery and rich audio, this HP Envy gives you Core i5, 8GB RAM, 512GB SSD and up to 13 hours battery with Bang & Olufsen sound.'
  },
  {
    id: 32,
    pn: 'HP-4M9M3EA',
    cat: 'laptops',
    n: 'HP Envy Tiberius 21C1',
    sp: 'Intel Core i5-1135G7 Quad · 16GB DDR4 · 512GB PCIe · NVIDIA · Backlit · Pale Gold',
    price: '₦1,090,000',
    desc: 'If you\'re looking for a powerful machine for demanding tasks, this HP Envy Tiberius gives you Core i5, 16GB RAM, 512GB SSD and NVIDIA graphics.'
  },
  {
    id: 33,
    pn: 'HP-513B9EA',
    cat: 'laptops',
    n: 'HP Envy Laptop 14',
    sp: 'Intel Core i7-1137H · 16GB RAM · 512GB SSD · Touch Screen · Fingerprint Reader · Windows 11',
    price: '₦1,150,000',
    desc: 'If you\'re looking for a premium laptop with security and touchscreen, this HP Envy gives you Core i7, 16GB RAM, 512GB SSD, touchscreen and a fingerprint reader.'
  },

  // Desktops / All-in-Ones (HP All-in-One category)
  {
    id: 34,
    pn: 'HP-B13YBEA',
    imageUrl: '/uploads/HP-B13YBEA_front.jpg',
    cat: 'desktops',
    n: 'HP All-in-One Desktop 22-dg0007nh',
    sp: 'Intel Processor N100 · 8GB DDR5 · 256GB SSD · 22” Display · DOS',
    price: '₦620,000',
    desc: 'If you\'re looking for a space-saving desktop, this HP All-in-One gives you a 22-inch screen, 8GB RAM and 256GB storage in one compact unit.'
  },
  {
    id: 35,
    pn: 'HP-9M9M9AT',
    imageUrl: '/uploads/HP-9M9M9AT_front.jpg',
    cat: 'desktops',
    n: 'HP Pro One 240 G10 All-in-One',
    sp: 'Intel Core i3-N300 · 4GB RAM · 512GB SSD · 23.8” Display · Wi-Fi · Bluetooth · DOS',
    price: '₦1,080,000',
    desc: 'If you\'re looking for a modern all-in-one for home or office, this HP gives you a 23.8-inch screen, Core i3, 4GB RAM, 512GB SSD, Wi-Fi and Bluetooth.'
  },
  {
    id: 36,
    pn: 'HP-A54WFET',
    cat: 'desktops',
    n: 'HP ProOne 440 G9 All-in-One PC',
    sp: 'Intel Core i5-14500 · 8GB DDR5 · 512GB SSD · 23.8” diagonal · DOS',
    price: '₦1,200,000',
    desc: 'If you\'re looking for a powerful all-in-one for office work, this HP ProOne 440 G9 gives you Core i5, 8GB RAM, 512GB SSD and a 23.8-inch screen.'
  },
  {
    id: 37,
    pn: 'HP-B6YRJET',
    cat: 'desktops',
    n: 'HP ProOne 440 G9 All-in-One Dual-Ram',
    sp: 'Intel Core i5-14500 · 8GB DDR5 · 512GB SSD · 23.8” diagonal · DOS',
    price: '₦1,200,000',
    desc: 'If you\'re looking for a powerful all-in-one for office work, this HP ProOne 440 G9 gives you Core i5, 8GB RAM, 512GB SSD and a 23.8-inch screen.'
  },
  {
    id: 38,
    pn: 'HP-9M9H5AT',
    cat: 'desktops',
    n: 'HP ProOne 240 G10 Desktop PC',
    sp: 'Intel Core i7-1355U · 16GB DDR4 · 512GB SSD · 23.8” diagonal FHD · DOS',
    price: '₦1,380,000',
    desc: 'If you\'re looking for a high-performance all-in-one for demanding tasks, this HP ProOne 240 G10 gives you Core i7, 16GB RAM, 512GB SSD and Full HD 23.8-inch screen.'
  },

  // Printers
  {
    id: 39,
    pn: 'HP-4QD21A',
    cat: 'printers',
    n: 'HP Neverstop 1200A HP Laser Printer',
    sp: 'Toner Tank Technology · Print, Copy, Scan · 5,000-page toner included',
    price: '₦280,000',
    desc: 'If you\'re looking for a printer that almost never runs out of ink, this HP Neverstop 1200A gives you tank-based printing with very low running costs.'
  },
  {
    id: 40,
    pn: 'HP-4RY23A',
    cat: 'printers',
    n: 'HP Neverstop 1000W Ink-Tank',
    sp: 'Toner Tank Refill · Wireless Printing · Easy 15s toner reload',
    price: '₦200,000',
    desc: 'If you\'re looking for low-cost, high-volume printing, this HP Neverstop 1000W gives you tank-based ink with wireless connectivity.'
  },
  {
    id: 41,
    pn: 'HP-LJ111A',
    cat: 'printers',
    n: 'HP LaserJet 111a Printer',
    sp: 'Compact Laser · Fast Black & White · Space Saving design',
    price: '₦198,000',
    desc: 'If you\'re looking for fast, affordable black-and-white printing, this HP LaserJet 111a gives you crisp text printing for everyday office use.'
  },
  {
    id: 42,
    pn: 'HP-4ZB78A',
    cat: 'printers',
    n: 'HP Laser MFP 107w Wireless',
    sp: 'Print, Copy, Scan · Ultra-Compact · Mobile Print Enabled',
    price: '₦250,000',
    desc: 'If you\'re looking for an all-in-one printer with low running costs, this HP Laser MFP 107w gives you print, copy and scan with wireless connectivity.'
  },
  {
    id: 43,
    pn: 'HP-4ZB83A',
    cat: 'printers',
    n: 'HP Laser MFP 135w Office Workhorse',
    sp: 'Monochrome Laser MFP · High Resolution · 20 ppm printing',
    price: '₦330,000',
    desc: 'If you\'re looking for a versatile office printer, this HP Laser MFP 135w gives you print, copy and scan in one compact wireless unit.'
  },
  {
    id: 44,
    pn: 'HP-4ZB84A',
    imageUrl: '/uploads/HP-4ZB84A_front.jpg',
    cat: 'printers',
    n: 'HP Laser MFP 137fnw Duplex',
    sp: 'Print, Copy, Scan, Fax · Auto Document Feeder (ADF) · Ethernet & Wi-Fi',
    price: '₦390,000',
    desc: 'If you\'re looking for a feature-rich office printer, this HP Laser MFP 137fnw gives you print, copy, scan and fax with wireless connectivity.'
  },
  {
    id: 45,
    pn: 'HP-7MD73A',
    cat: 'printers',
    n: 'HP LaserJet M141a Compact',
    sp: 'Fast B/W Print & Copy · Simple Setup · Low Energy design',
    price: '₦240,000',
    desc: 'If you\'re looking for a simple, reliable laser printer, this HP LaserJet M141a gives you fast black-and-white printing for everyday documents.'
  },
  {
    id: 46,
    pn: 'HP-7MD74A',
    cat: 'printers',
    n: 'HP LaserJet M141w Active-Wireless',
    sp: 'Wireless Print & Copy · High-speed monochrome · HP Smart App',
    price: '₦270,000',
    desc: 'If you\'re looking for a wireless laser printer, this HP LaserJet M141w gives you fast, reliable printing you can send to from your phone.'
  },
  {
    id: 47,
    pn: 'HP-9YG09A',
    imageUrl: '/uploads/HP-9YG09A_front.jpg',
    cat: 'printers',
    n: 'HP LaserJet MFP M236sdw Dual-Sided',
    sp: 'Print, Copy, Scan · Auto Two-Sided printing · Dual-Band Wi-Fi',
    price: '₦380,000',
    desc: 'If you\'re looking for an all-in-one office printer, this HP LaserJet MFP M236sdw gives you print, copy, scan and duplex printing with wireless.'
  },
  {
    id: 48,
    pn: 'HP-7WN42B',
    cat: 'printers',
    n: 'HP DeskJet IA 2320 AiO Printer',
    sp: 'Inkjet All-in-One · Print, Copy, Scan · Compact home design',
    price: '₦80,000',
    desc: 'If you\'re looking for an affordable home printer, this HP DeskJet 2320 AiO gives you print, copy and scan for everyday family use.'
  },
  {
    id: 49,
    pn: 'HP-A24J2C',
    cat: 'printers',
    n: 'HP DeskJet IA 2975 AiO Printer',
    sp: 'Wireless Color Printing · Home & Small Office · Low Carbon design',
    price: '₦110,000',
    desc: 'If you\'re looking for an affordable all-in-one printer with extra features, this HP DeskJet 2975 AiO gives you print, copy and scan for home and small office.'
  },
  {
    id: 50,
    pn: 'HP-4ABD4ABEW',
    cat: 'printers',
    n: 'HP Smart Tank 581 AiO Wireless',
    sp: 'Refillable Ink Tank · Color Printing · Ultra-low cost per page',
    price: '₦260,000',
    desc: 'If you\'re looking for a printer with ink tanks instead of cartridges, this HP Smart Tank 581 AiO gives you wireless print, copy and scan with very low cost per page.'
  },
  {
    id: 51,
    pn: 'HP-1TJ09A',
    imageUrl: '/uploads/HP-1TJ09A_front.jpg',
    cat: 'printers',
    n: 'HP Smart Tank 515 Wireless',
    sp: 'High Volume Ink Tank · Long lasting supply · Beautiful color output',
    price: '₦295,000',
    desc: 'If you\'re looking for low-cost printing with a refillable ink tank, this HP Smart Tank 515 gives you wireless printing that saves money over time.'
  },
  {
    id: 52,
    pn: 'HP-3YW70A',
    imageUrl: '/uploads/HP-3YW70A_front.jpg',
    cat: 'printers',
    n: 'HP Smart Tank 516 Color Printer',
    sp: 'Ink Tank tech · Multi-device wireless connectivity · Direct-feed system',
    price: '₦295,000',
    desc: 'If you\'re looking for low-cost printing with a refillable ink tank, this HP Smart Tank 516 gives you wireless printing that saves money over time.'
  },
  {
    id: 53,
    pn: 'HP-3YW73A',
    imageUrl: '/uploads/HP-3YW73A_front.jpg',
    cat: 'printers',
    n: 'HP Smart Tank 519 AiO Wireless',
    sp: 'Print, Copy, Scan, Mobile · Giant Ink Reservoir · Clean reload bottle design',
    price: '₦320,000',
    desc: 'If you\'re looking for an all-in-one tank printer, this HP Smart Tank 519 AiO gives you wireless print, copy and scan with low running costs.'
  },
  {
    id: 54,
    pn: 'HP-Y0F71A',
    imageUrl: '/uploads/HP-Y0F71A_front.jpg',
    cat: 'printers',
    n: 'HP Smart Tank 615 Wireless Pro',
    sp: 'Auto Document Feeder · Smart Guided Fax · Dynamic color touch panel',
    price: '₦398,000',
    desc: 'If you\'re looking for high-capacity, low-cost printing, this HP Smart Tank 615 gives you wireless connectivity and big ink tanks for heavy use.'
  },
  {
    id: 55,
    pn: 'HP-6UU47A',
    imageUrl: '/uploads/HP-6UU47A_front.jpg',
    cat: 'printers',
    n: 'HP Smart Tank 750 AiO',
    sp: 'Auto-Duplex Color Printing · Large Ink Reservoir · Smart buttons security',
    price: '₦498,000',
    desc: 'If you\'re looking for a heavy-duty all-in-one tank printer, this HP Smart Tank 750 AiO gives you wireless print, copy and scan for high-volume printing.'
  },
  {
    id: 56,
    pn: 'HP-Y0S18AA80',
    imageUrl: '/uploads/HP-Y0S18AA80_front.jpg',
    cat: 'printers',
    n: 'HP OfficeJet Pro 7720 Wide Format',
    sp: 'A3 Printing · Document Scan/Copy/Fax · Premium heavy workload design',
    price: '₦360,000',
    desc: 'If you\'re looking to print large documents and posters, this HP OfficeJet Pro 7720 Wide Format AiO gives you wireless print, copy, scan and fax in wide format.'
  },
  {
    id: 57,
    pn: 'HP-G5J38A',
    imageUrl: '/uploads/HP-G5J38A_front.jpg',
    cat: 'printers',
    n: 'HP OfficeJet Pro 7740 Wide Format',
    sp: 'Double Paper Tray · Auto wide format Duplex · High capacity inks',
    price: '₦475,000',
    desc: 'If you\'re looking to print large documents and posters, this HP OfficeJet Pro 7740 Wide Format AiO gives you wireless print, copy, scan and fax in wide format.'
  },
  {
    id: 58,
    pn: 'HP-2Z610AB19',
    imageUrl: '/uploads/HP-2Z610AB19_front.jpg',
    cat: 'printers',
    n: 'HP LaserJet Pro 4003dw',
    sp: 'Enterprise monochrome laser · 40 ppm speed · Dual automatic duplexing',
    price: '₦520,000',
    desc: 'If you\'re looking for a fast, professional laser printer, this HP LaserJet Pro 4003dw gives you wireless duplex printing for busy offices.'
  },
  {
    id: 59,
    pn: 'HP-7WN42B2',
    imageUrl: '/uploads/HP-7WN42B2_front.jpg',
    cat: 'printers',
    n: 'HP Color LaserJet 178nw Wireless',
    sp: 'High resolution color output · Compact footprint · Wired or wireless networks',
    price: '₦525,000',
    desc: 'If you\'re looking for vibrant color printing for your office, this HP Color LaserJet 178nw gives you wireless connectivity and crisp color output.'
  },
  {
    id: 60,
    pn: 'HP-4ZB97A',
    imageUrl: '/uploads/HP-4ZB97A_front.jpg',
    cat: 'printers',
    n: 'HP Color LaserJet MFP 179fnw',
    sp: 'True high fidelity color · Print, Copy, Scan & Fax with cloud integrations',
    price: '₦495,000',
    desc: 'If you\'re looking for an all-in-one color printer, this HP Color LaserJet MFP 179fnw gives you print, copy, scan and fax in full color with wireless.'
  },
  {
    id: 61,
    pn: 'HP-7KW56A',
    cat: 'printers',
    n: 'HP Color LaserJet Pro MFP M183fw',
    sp: 'Vibrant color lasers · 16 ppm print rate · Built-in security relays',
    price: '₦630,000',
    desc: 'If you\'re looking for a reliable color all-in-one for the office, this HP Color LaserJet Pro MFP M183fw gives you print, copy, scan and fax in color.'
  },
  {
    id: 62,
    pn: 'HP-7KW72A',
    cat: 'printers',
    n: 'HP Color LaserJet Pro MFP M282nw',
    sp: 'Dynamic monochrome & color outputs · 22 ppm print rate · Smart LCD system',
    price: '₦640,000',
    desc: 'If you\'re looking for fast color printing with wireless connectivity, this HP Color LaserJet Pro MFP M282nw gives you print, copy and scan in vivid color.'
  },
  {
    id: 63,
    pn: 'HP-W1A80A',
    cat: 'printers',
    n: 'HP Color LaserJet Pro MFP M479fdw',
    sp: 'Flagship enterprise color print station · Single pass dual scan · Secure system',
    price: '₦950,000',
    desc: 'If you\'re looking for a premium color all-in-one for a busy office, this HP Color LaserJet Pro MFP M479fdw gives you print, copy, scan, fax and duplex printing.'
  },
  {
    id: 64,
    pn: 'HP-W1A77A',
    cat: 'printers',
    n: 'HP Color LaserJet Pro MFP M479dw',
    sp: 'Duplex printing · Corporate network ready · Active firewall protection',
    price: '₦800,000',
    desc: 'If you\'re looking for fast, professional color printing, this HP Color LaserJet Pro MFP M479dw gives you wireless duplex color printing for the office.'
  },
  {
    id: 65,
    pn: 'SHARP-AR7024',
    cat: 'printers',
    n: 'Sharp AR-7024 (A3 Copier)',
    sp: 'Heavy-duty digital duplication · Ledger A3 size · Multi tray feed',
    price: '₦1,150,000',
    desc: 'If you\'re looking for a heavy-duty office copier, this Sharp AR-7024 A3 Copier gives you large-format copying built for high-volume office use.'
  },

  // Standard Accessories & UPS power devices
  {
    id: 66,
    pn: 'BG-650VA',
    cat: 'accessories',
    n: 'Bluegate 650VA UPS stand-by',
    sp: '650VA · Automatic Voltage Regulation (AVR) · Home standby',
    price: '₦55,000',
    desc: 'If you\'re looking for basic backup power for small electronics, this Bluegate 650VA UPS keeps your essential devices running during short outages.'
  },
  {
    id: 67,
    pn: 'BG-1.2KVAIRON',
    imageUrl: '/uploads/BG-1.2KVAIRON_front.jpg',
    cat: 'accessories',
    n: 'Bluegate 1.2 KVA UPS (Iron casing)',
    sp: '1.2KVA capacity · Rugged heavy-duty casing · Automatic frequency sensing',
    price: '₦108,000',
    desc: 'If you\'re looking for sturdy backup power with a tough build, this Bluegate 1.2KVA UPS (iron casing) keeps your home or office equipment running.'
  },
  {
    id: 68,
    pn: 'BG-1.53KVA',
    cat: 'accessories',
    n: 'Bluegate 1.53 KVA UPS Deluxe',
    sp: '1.53KVA · Intelligent battery management · Solid state surge control',
    price: '₦105,000',
    desc: 'If you\'re looking for reliable backup power for computers and routers, this Bluegate 1.53KVA UPS gives you solid protection during outages.'
  },
  {
    id: 69,
    pn: 'BG-1.57KVAIRON',
    cat: 'accessories',
    n: 'Bluegate 1.57 KVA UPS (Iron casing)',
    sp: '1.57KVA power load · Thermal shutdown system · Deep cycle standby',
    price: '₦115,000',
    desc: 'If you\'re looking for durable backup power, this Bluegate 1.57KVA UPS (iron casing) gives you dependable protection with a tough build.'
  },
  {
    id: 70,
    pn: 'BG-2.0KVAIRON',
    imageUrl: '/uploads/BG-2.0KVAIRON_front.jpg',
    cat: 'accessories',
    n: 'Bluegate 2.0 KVA UPS (Iron casing)',
    sp: '2KVA heavy workstation protection · Dual battery bank config · Smart cooling',
    price: '₦148,000',
    desc: 'If you\'re looking for backup power for more devices or longer outages, this Bluegate 2.0KVA UPS (iron casing) gives you a robust, durable solution.'
  },
  {
    id: 71,
    pn: 'BG-2.5KVA',
    cat: 'accessories',
    n: 'Bluegate 2.5 KVA UPS Office Rack',
    sp: '2.5KVA corporate standby · Extreme run cycle · Wide AVR range input',
    price: '₦160,000',
    desc: 'If you\'re looking for backup power for a small office, this Bluegate 2.5KVA UPS handles more appliances during outages.'
  },
  {
    id: 72,
    pn: 'BG-4KVA',
    cat: 'accessories',
    n: 'Bluegate 4 KVA UPS Server-grade',
    sp: '4KVA capacity · Premium power flow line · Professional active shielding',
    price: '₦460,000',
    desc: 'If you\'re looking for serious backup power for multiple devices, this Bluegate 4KVA UPS keeps everything running through extended outages.'
  },
  {
    id: 73,
    pn: 'BG-3KVAONLINE',
    cat: 'accessories',
    n: 'Bluegate 3KVA Online UPS Premium',
    sp: '3KVA double-conversion online setup · Clean sine waves · Zero delay sync',
    price: '₦560,000',
    desc: 'If you\'re looking for continuous, clean power for sensitive equipment, this Bluegate 3KVA Online UPS gives you instant switchover with no power dip.'
  },
  {
    id: 74,
    pn: 'BG-6KVAONLINE',
    cat: 'accessories',
    n: 'Bluegate 6KVA Online UPS',
    sp: '6KVA continuous protection · LCD administrative metrics · Network expansion boards',
    price: '₦1,450,000',
    desc: 'If you\'re looking for heavy-duty continuous power protection, this Bluegate 6KVA Online UPS is built for offices and businesses.'
  },
  {
    id: 75,
    pn: 'BG-10KVAONLINE',
    imageUrl: '/uploads/BG-10KVAONLINE_front.jpg',
    cat: 'accessories',
    n: 'Bluegate 10KVA Online UPS Hub',
    sp: '10KVA max capacity tower · Hot swappable batteries · Extreme workspace guard',
    price: '₦1,650,000',
    desc: 'If you\'re looking for industrial-grade continuous power backup, this Bluegate 10KVA Online UPS is built for large offices or commercial use.'
  },
  {
    id: 76,
    pn: 'BG-7AHBATT',
    cat: 'accessories',
    n: 'Bluegate 7Ah Battery cell',
    sp: '7Ah stand-by cell · Sealed lead-acid · Premium terminal connector pads',
    price: '₦19,000',
    desc: 'If you\'re looking for a replacement or extra battery for your UPS, this Bluegate 7Ah Battery gives you reliable backup capacity.'
  },
  {
    id: 77,
    pn: 'BG-9AHBATT',
    cat: 'accessories',
    n: 'Bluegate 9Ah Battery cell',
    sp: '9Ah capacity · Valve regulated spill-free configuration · High run-duration',
    price: '₦23,000',
    desc: 'If you\'re looking for more battery capacity for your UPS, this Bluegate 9Ah Battery gives you longer backup time.'
  },
  {
    id: 78,
    pn: 'BG-2KVASTAB',
    imageUrl: '/uploads/BG-2KVASTAB_front.jpg',
    cat: 'accessories',
    n: 'Bluegate 2KVA Stabilizer',
    sp: '2KVA voltage regulator · Dual display indicators · Rapid circuit correction',
    price: '₦55,000',
    desc: 'If you\'re looking to protect your appliances from voltage fluctuations, this Bluegate 2KVA Stabilizer keeps your devices safe.'
  },
  {
    id: 79,
    pn: 'BG-5KVASTAB',
    cat: 'accessories',
    n: 'Bluegate 5KVA Stabilizer central',
    sp: '5KVA capacity · Overload & thermal protection relays · Low-noise running',
    price: '₦115,000',
    desc: 'If you\'re looking to protect larger appliances from power surges and dips, this Bluegate 5KVA Stabilizer gives you reliable voltage protection.'
  },
  {
    id: 80,
    pn: 'EG-650VA',
    imageUrl: '/uploads/EG-650VA_front.jpg',
    cat: 'accessories',
    n: 'Evergood 650VA UPS stand-by',
    sp: '650VA · Auto frequency correction · High thermal polymer housing',
    price: '₦48,000',
    desc: 'If you\'re looking for basic backup power for small electronics, this Evergood 650VA UPS keeps your essential devices running during short outages.'
  },
  {
    id: 81,
    pn: 'EG-1.2KVAIRON',
    cat: 'accessories',
    n: 'Evergood 1.2KVA UPS (Iron casing)',
    sp: '1.2KVA · Shielded iron shell · Intelligent charger control block',
    price: '₦110,000',
    desc: 'If you\'re looking for sturdy backup power with a tough build, this Evergood 1.2KVA UPS (iron casing) keeps your home or office equipment running.'
  },

  // Legacy Cameras, Security packages & Networks kept intact for compatibility
  {
    id: 82,
    pn: '—',
    cat: 'cameras',
    n: 'Canon EOS M50 Mark II',
    sp: 'Mirrorless · 24.1MP · 4K Video · Wi-Fi · APS-C',
    price: '₦420,000',
    desc: 'Versatile and lightweight mirrorless vlog-style camera. Capture high-contrast 24.1 Megapixel photos and crisp 4K cinematic videos with Canon’s legendary color science.'
  },
  {
    id: 83,
    pn: '—',
    cat: 'cameras',
    n: 'Canon EOS 250D DSLR',
    sp: 'DSLR · 24.1MP · Full HD · Lightweight · APS-C',
    price: '₦580,000',
    desc: 'The world’s lightest digital single-lens reflex (DSLR) camera with movable screen. Excellent optical viewfinder and amazing battery life for weddings and portraits.'
  },
  {
    id: 84,
    pn: '—',
    cat: 'cameras',
    n: 'HP Webcam HD Pro 1080p',
    sp: '1080p · Built-in mic · USB plug-and-play',
    price: '₦22,000',
    desc: 'High-clarity widescreen 1080p camera with integrated noise-reduction microphone. Ensures clean presentation and beautiful contrast during Slack or Zoom business calls.'
  },
  {
    id: 85,
    pn: '—',
    cat: 'cctv',
    n: '4-Channel CCTV Package',
    sp: '4 cameras · DVR · Full HD · Night vision · Complete set',
    price: '₦85,000',
    desc: 'Complete high-definition surveillance kit. Contains 4 high-durability weatherproof infrared outdoor cameras, a central DVR with internet viewing facility, and wiring kit.'
  },
  {
    id: 86,
    pn: '—',
    cat: 'cctv',
    n: '8-Channel CCTV Package',
    sp: '8 cameras · DVR · Full HD · Night vision · Complete set',
    price: '₦145,000',
    desc: 'Extensive property safety system. Packs 8 high-performance weather-safe dome/bullet cameras, and dual-output digital video recorder with mobile app notifications.'
  },
  {
    id: 87,
    pn: '—',
    cat: 'networking',
    n: 'ASUS RT-AX55 Wi-Fi 6 Router',
    sp: 'Wi-Fi 6 · AX1800 · Dual band · AiMesh',
    price: '₦45,000',
    desc: 'Next-generation hyper-fast Wi-Fi 6 router. Boosts speeds to AX1800 with ultra-low latency, and integrates ASUS AiMesh tech for continuous whole-office coverage.'
  },
  {
    id: 88,
    pn: '—',
    cat: 'monitors',
    n: 'LG 24” IPS FHD Monitor',
    sp: '24” IPS · 1920x1080 · HDMI/VGA · Anti-glare',
    price: '₦88,000',
    desc: 'Stunning color-vivid IPS desktop display. 178-degree wide viewing angles with reader mode to prevent eye strain during long hours of data analysis.'
  },
  {
    id: 89,
    pn: '—',
    cat: 'software',
    n: 'Microsoft Office 2021 Professional',
    sp: 'Word · Excel · PowerPoint · Outlook · Lifetime licence',
    price: '₦28,000',
    desc: 'Genuine perpetual lifetime licence of Microsoft’s core business suite including Word, high-power Excel, PowerPoint, publisher tools, and Outlook.'
  }
];

export const SOLAR: SolarProduct[] = [
  // Solar Inverters
  {
    id: 'CHO-5KVA48V',
    imageUrl: '/uploads/CHO-5KVA48V_front.jpg',
    cat: 'Inverters',
    n: 'Choice/Foresolar 5KVA 48V Inverter',
    brand: 'Choice/Foresolar',
    sp: '5KVA · 48V · Home & light commercial backup',
    price: '₦520,000',
    desc: 'If you\'re looking for a powerful solar inverter for your home, this Choice/Foresolar 5KVA 48V Inverter gives you reliable, efficient power conversion.'
  },
  {
    id: 'CHO-5KVA24V',
    imageUrl: '/uploads/CHO-5KVA24V_front.jpg',
    cat: 'Inverters',
    n: 'Choice/Foresolar 5KVA 24V Inverter',
    brand: 'Choice/Foresolar',
    sp: '5KVA · 24V · Low voltage high output',
    price: '₦520,000',
    desc: 'If you\'re looking for a powerful solar inverter for your home, this Choice/Foresolar 5KVA 24V Inverter gives you reliable, efficient power conversion.'
  },
  {
    id: 'CHO-3.5KVA24V',
    cat: 'Inverters',
    n: 'Choice/Siwina 3.5KVA 24V Inverter',
    brand: 'Choice/Siwina',
    sp: '3.5KVA · 24V · Medium load system',
    price: '₦440,000',
    desc: 'If you\'re looking for a mid-size solar inverter, this Choice/Siwina 3.5KVA 24V Inverter gives you solid power for home or small office use.'
  },
  {
    id: 'DEKA-3.5KVA24V',
    imageUrl: '/uploads/DEKA-3.5KVA24V_front.jpg',
    cat: 'Inverters',
    n: 'Deka 3.5KVA 24V Standing Inverter',
    brand: 'Deka',
    sp: '3.5KVA · 24V · Heavy duty pure sine standing',
    price: '₦360,000',
    desc: 'If you\'re looking for a sturdy standing solar inverter, this Deka 3.5KVA 24V Inverter gives you dependable power conversion.'
  },
  {
    id: 'CHO-2.5KVA24V',
    imageUrl: '/uploads/CHO-2.5KVA24V_front.jpg',
    cat: 'Inverters',
    n: 'Choice 2.5KVA 24V Inverter',
    brand: 'Choice',
    sp: '2.5KVA · 24V · Household pure sine',
    price: '₦360,000',
    desc: 'If you\'re looking for an affordable solar inverter for a smaller setup, this Choice 2.5KVA 24V Inverter gives you efficient power conversion.'
  },
  {
    id: 'CHO-1.5KVA12V',
    imageUrl: '/uploads/CHO-1.5KVA12V_front.jpg',
    cat: 'Inverters',
    n: 'Choice 1.5KVA 12V Inverter',
    brand: 'Choice',
    sp: '1.5KVA · 12V · Compact single-battery setup',
    price: '₦220,000',
    desc: 'If you\'re looking for a compact solar inverter for small systems, this Choice 1.5KVA 12V Inverter gives you reliable basic power conversion.'
  },
  {
    id: 'GRO-6KWHYBRID',
    imageUrl: '/uploads/GRO-6KWHYBRID_front.jpg',
    cat: 'Inverters',
    n: 'Growatt 6KW Hybrid Inverter',
    brand: 'Growatt',
    sp: '6KW · 48V · Dual MPPT tracking · Multi grid blending',
    price: '₦680,000',
    desc: 'If you\'re looking for a powerful hybrid solar inverter, this Growatt 6KW Hybrid Inverter gives you flexible power management for solar and grid.'
  },
  {
    id: 'GRO-6KW48V2MPPT',
    imageUrl: '/uploads/GRO-6KW48V2MPPT_front.jpg',
    cat: 'Inverters',
    n: 'Growatt 6KW 48V 2 MPPT Hybrid',
    brand: 'Growatt',
    sp: '6KW · 48V · Advanced 2-MPPT harvesting controller',
    price: '₦650,000',
    desc: 'If you\'re looking for an advanced hybrid solar inverter with dual solar inputs, this Growatt 6KW 48V 2 MPPT Hybrid Inverter gives you maximum solar harvesting efficiency.'
  },
  {
    id: 'CWO-1.8KVA24VHYBRID',
    cat: 'Inverters',
    n: 'Cworth 1.8KVA 24V Hybrid Inverter',
    brand: 'Cworth',
    sp: '1.8KVA · 24V · Low voltage smart hybrid',
    price: '₦300,000',
    desc: 'If you\'re looking for an entry-level hybrid solar inverter, this Cworth 1.8KVA 24V Hybrid Inverter gives you flexible solar and grid power management.'
  },
  {
    id: 'CWO-3.6KVA24VHYBRID',
    imageUrl: '/uploads/CWO-3.6KVA24VHYBRID_front.jpg',
    cat: 'Inverters',
    n: 'Cworth 3.6KVA 24V Hybrid Inverter',
    brand: 'Cworth',
    sp: '3.6KVA · 24V · High output hybrid pure sine',
    price: '₦430,000',
    desc: 'If you\'re looking for a mid-size hybrid solar inverter, this Cworth 3.6KVA 24V Hybrid Inverter gives you more power for home or office.'
  },
  {
    id: 'CWO-4KVA24VHYBRID',
    cat: 'Inverters',
    n: 'Cworth 4KVA 24V Hybrid Inverter',
    brand: 'Cworth',
    sp: '4KVA · 24V · Smart grid solar manager',
    price: '₦520,000',
    desc: 'If you\'re looking for a powerful hybrid solar inverter, this Cworth 4KVA 24V Hybrid Inverter gives you robust solar and grid power management.'
  },
  {
    id: 'FEL-10KVA48V',
    cat: 'Inverters',
    n: 'Felicity 10KVA 48V Inverter',
    brand: 'Felicity',
    sp: '10KVA · 48V · Industrial standard dual mains',
    price: '₦1,250,000',
    desc: 'If you\'re looking for a high-capacity solar inverter for a large home or business, this Felicity 10KVA 48V Inverter gives you serious power output.'
  },
  {
    id: 'FEL-IVPS5048',
    imageUrl: '/uploads/FEL-IVPS5048_front.jpg',
    cat: 'Inverters',
    n: 'Felicity IVPS 5048 5KVA Inverter',
    brand: 'Felicity',
    sp: '5KVA · 48V · Non-hybrid pure converter',
    price: '₦650,000',
    desc: 'If you\'re looking for a dependable non-hybrid solar inverter, this Felicity IVPS 5048 5KVA/48V gives you solid, no-frills power conversion.'
  },
  {
    id: 'FEL-IVPM5048',
    cat: 'Inverters',
    n: 'Felicity IVPM 5048 5KVA Hybrid',
    brand: 'Felicity',
    sp: '5KVA · 48V · Smart solar prioritize controller',
    price: '₦850,000',
    desc: 'If you\'re looking for a hybrid solar inverter with flexibility, this Felicity IVPM 5048 5KVA Hybrid Inverter gives you smart power management.'
  },
  {
    id: 'FEL-IVPM10048',
    cat: 'Inverters',
    n: 'Felicity IVPM 10048 10KVA Hybrid',
    brand: 'Felicity',
    sp: '10KVA · 48V · Core corporate hybrid substation',
    price: '₦1,400,000',
    desc: 'If you\'re looking for a high-capacity hybrid solar inverter, this Felicity IVPM 10048 10KVA Hybrid Inverter gives you serious power for large homes or businesses.'
  },
  {
    id: 'FEL-IVEM5048',
    cat: 'Inverters',
    n: 'Felicity IVEM 5048 5KVA Transformerless',
    brand: 'Felicity',
    sp: '5KVA · 48V · Compact transformerless hybrid system',
    price: '₦650,000',
    desc: 'If you\'re looking for a hybrid solar inverter without a bulky transformer, this Felicity IVEM 5048 5KVA Hybrid Inverter gives you compact, efficient power management.'
  },

  // Solar Controllers
  {
    id: 'FEL-SCCM4524',
    imageUrl: '/uploads/FEL-SCCM4524_front.jpg',
    cat: 'Controllers',
    n: 'Felicity SCCM4524 Solar Controller',
    brand: 'Felicity',
    sp: '45A · 12/24V · MPPT solar charger manager',
    price: '₦100,000',
    desc: 'If you\'re looking for a solar charge controller for a small system, this Felicity SCCM4524 45A 12/24V Controller gives you reliable battery charging.'
  },
  {
    id: 'FEL-SCCM6048',
    imageUrl: '/uploads/FEL-SCCM6048_front.jpg',
    cat: 'Controllers',
    n: 'Felicity SCCM6048 Solar Controller',
    brand: 'Felicity',
    sp: '60A · 48V · Micro-processor MPPT stabilization',
    price: '₦190,000',
    desc: 'If you\'re looking for a solar charge controller for a mid-size system, this Felicity SCCM6048 60A Controller gives you efficient battery charging.'
  },
  {
    id: 'EOX-60A',
    cat: 'Controllers',
    n: 'Eoexby/Powl 60A Solar Controller',
    brand: 'Eoexby/Powl',
    sp: '60A capacity · High yield thermal cooling rails',
    price: '₦100,000',
    desc: 'If you\'re looking for an affordable solar charge controller, this Eoexby/Powl 60A Controller gives you reliable battery charging at a lower cost.'
  },
  {
    id: 'FEL-SCCM8048',
    cat: 'Controllers',
    n: 'Felicity SCCM8048 Solar Controller',
    brand: 'Felicity',
    sp: '80A · 48V · Heavy energy harvesting system',
    price: '₦260,000',
    desc: 'If you\'re looking for a solar charge controller for a larger system, this Felicity SCCM8048 80A Controller gives you robust battery charging.'
  },
  {
    id: 'FEL-SCCM10048',
    cat: 'Controllers',
    n: 'Felicity SCCM10048 Solar Controller',
    brand: 'Felicity',
    sp: '100A · 48V · Smart cooling LCD administrative hub',
    price: '₦300,000',
    desc: 'If you\'re looking for a solar charge controller for a big setup, this Felicity SCCM10048 100A Controller gives you high-capacity battery charging.'
  },
  {
    id: 'EOX-100A',
    cat: 'Controllers',
    n: 'Eoexby 100A Solar Controller',
    brand: 'Eoexby',
    sp: '100A · Heavy workload smart cooling block',
    price: '₦120,000',
    desc: 'If you\'re looking for an affordable high-capacity solar charge controller, this Eoexby 100A Controller gives you reliable charging at a lower cost.'
  },
  {
    id: 'FEL-SCCM12048',
    cat: 'Controllers',
    n: 'Felicity SCCM12048 Solar Controller',
    brand: 'Felicity',
    sp: '120A · 48V · Dual cooling fans extreme MPPT',
    price: '₦320,000',
    desc: 'If you\'re looking for a solar charge controller for a large system, this Felicity SCCM12048 120A Controller gives you serious battery charging capacity.'
  },
  {
    id: 'EOX-120A',
    cat: 'Controllers',
    n: 'Eoexby 120A Solar Controller',
    brand: 'Eoexby',
    sp: '120A · Ultra capacity heavy structural charger',
    price: '₦120,000',
    desc: 'If you\'re looking for an affordable high-capacity solar charge controller, this Eoexby 120A Controller gives you reliable charging at a lower cost.'
  },

  // Solar Accessories
  {
    id: 'PV-SOLARFAN',
    cat: 'Controllers', // wait, listed as Solar Accessory in PDF, let's set specs or category representation nicely
    n: 'Polystar Solar Standing Fan',
    brand: 'Polystar',
    sp: 'Solar Standing Fan · Low voltage utility fan',
    price: '₦65,000',
    desc: 'If you\'re looking for a fan that runs on solar power, this Polystar Solar Standing Fan keeps you cool even during power outages.'
  },
  {
    id: 'GEN-100ADCBREAKER',
    cat: 'Controllers',
    n: 'Generic 100A DC Breaker',
    brand: 'Generic',
    sp: '100A DC safety switch breaker shield',
    price: '₦12,000',
    desc: 'If you\'re looking for protection for your solar DC circuits, this 100A DC Breaker safely disconnects your system when needed.'
  },
  {
    id: 'GEN-63ADCBREAKER',
    cat: 'Controllers',
    n: 'Generic 63A DC Breaker',
    brand: 'Generic',
    sp: '63A DC quick overload cut-off relay',
    price: '₦8,000',
    desc: 'If you\'re looking for protection for smaller solar DC circuits, this 63A DC Breaker safely disconnects your system when needed.'
  },
  {
    id: 'GEN-250A1000VBREAKER',
    cat: 'Controllers',
    n: 'Generic 250A 1000V Industrial Breaker',
    brand: 'Generic',
    sp: '250A · 1000V DC heavy substation breaker',
    price: '₦30,000',
    desc: 'If you\'re looking for heavy-duty circuit protection, this 250A 1000V Industrial Breaker protects large solar or power installations.'
  },
  {
    id: 'GEN-ACSURGE',
    cat: 'Controllers',
    n: 'Generic AC Surge Arrestor',
    brand: 'Generic',
    sp: 'AC lightning & rapid voltage surge lightning arrestor',
    price: '₦18,000',
    desc: 'If you\'re looking to protect your equipment from power surges, this AC Surge Arrestor shields your system from sudden voltage spikes.'
  },
  {
    id: 'GEN-DCSURGE',
    cat: 'Controllers',
    n: 'Generic DC Surge Arrestor',
    brand: 'Generic',
    sp: 'DC lightning rapid bypass surge protect',
    price: '₦22,000',
    desc: 'If you\'re looking to protect your solar system from lightning and surges, this DC Surge Arrestor shields your DC circuits from voltage spikes.'
  },

  // Solar Batteries
  {
    id: 'GEN-12V220AHTUBULAR',
    imageUrl: '/uploads/GEN-12V220AHTUBULAR_front.jpg',
    cat: 'Tubular Battery',
    n: 'Generic 12V 220Ah Tubular Battery',
    brand: 'Generic',
    sp: '12V · 220Ah tall tubular backup block',
    price: '₦260,000',
    desc: 'If you\'re looking for a durable battery for your inverter, this 12V 220Ah Tubular Battery gives you long-lasting backup power storage.'
  },
  {
    id: 'GEN-12.4V2400WLITHIUM',
    imageUrl: '/uploads/GEN-12.4V2400WLITHIUM_front.jpg',
    cat: 'Lithium Batteries',
    n: 'Generic 12.4V 2400W Lithium Battery',
    brand: 'Generic',
    sp: '12.4V · 2400W deep-cycle modular cell',
    price: '₦250,000',
    desc: 'If you\'re looking for a compact, powerful lithium battery, this 12.4V 2400W Lithium Battery gives you efficient, long-lasting energy storage.'
  },
  {
    id: 'DEYE-5KWH48VLITHIUM',
    imageUrl: '/uploads/DEYE-5KWH48VLITHIUM_front.jpg',
    cat: 'Lithium Batteries',
    n: 'Deye 5KWH 48V Lithium Battery',
    brand: 'Deye',
    sp: '5KWH · 48V premium wall mount pack',
    price: '₦1,050,000',
    desc: 'If you\'re looking for reliable lithium battery storage for solar, this Deye 5KWH 48V Lithium Battery gives you efficient, long-lasting power storage.'
  },
  {
    id: 'CWO-5KWH48V',
    cat: 'Lithium Batteries',
    n: 'Cworth 5KWH 48V Lithium Battery',
    brand: 'Cworth',
    sp: '5KWH · 48V wall energy battery storage',
    price: '₦1,150,000',
    desc: 'If you\'re looking for lithium battery storage for your solar system, this Cworth 5KWH 48V Battery gives you reliable, efficient energy storage.'
  },
  {
    id: 'FEL-5KWH48V',
    cat: 'Lithium Batteries',
    n: 'Felicity 5KWH 48V Lithium Battery',
    brand: 'Felicity',
    sp: '5KWH · 48V stacking cabinet module',
    price: '₦1,150,000',
    desc: 'If you\'re looking for lithium battery storage for your solar system, this Felicity 5KWH 48V Battery gives you reliable, efficient energy storage.'
  },
  {
    id: 'FEL-10KWH48V',
    cat: 'Lithium Batteries',
    n: 'Felicity 10KWH 48V Lithium Battery',
    brand: 'Felicity',
    sp: '10KWH · 48V heavy stacking cabinet block',
    price: '₦1,800,000',
    desc: 'If you\'re looking for high-capacity lithium battery storage, this Felicity 10KWH 48V Battery gives you serious energy storage for larger homes or businesses.'
  },
  {
    id: 'BLC-15KWH',
    cat: 'Lithium Batteries',
    n: 'Blue Carbon 15KWH Lithium Battery',
    brand: 'Blue Carbon',
    sp: '15KWH modular deep-discharge power bank',
    price: '₦2,200,000',
    desc: 'If you\'re looking for very high-capacity lithium storage, this Blue Carbon 15KWH Battery gives you substantial energy reserves for big solar systems.'
  },
  {
    id: 'CWL-15KWH',
    cat: 'Lithium Batteries',
    n: 'Cworld 15KWH Lithium Battery',
    brand: 'Cworld',
    sp: '15KWH massive corporate modular backup',
    price: '₦2,200,000',
    desc: 'If you\'re looking for very high-capacity lithium storage, this Cworld 15KWH Battery gives you substantial energy reserves for big solar systems.'
  },
  {
    id: 'CWL-20KWH',
    cat: 'Lithium Batteries',
    n: 'Cworld 20KWH Lithium Battery',
    brand: 'Cworld',
    sp: '20KWH cabinet with integrated high output BMS',
    price: '₦3,200,000',
    desc: 'If you\'re looking for maximum lithium storage capacity, this Cworld 20KWH Battery gives you serious energy reserves for large commercial solar systems.'
  },

  // Solar Cables
  {
    id: 'GEN-6MMSOLARCABLE',
    cat: 'Cables',
    n: 'Generic 6mm Solar Cable (per metre)',
    brand: 'Generic',
    sp: '6mm copper solar transmission core wire',
    price: '₦5,000',
    desc: 'If you\'re looking for cable to wire your solar panels, this 6mm Solar Cable gives you safe, efficient connections.'
  },
  {
    id: 'GEN-10MMSOLARCABLE',
    cat: 'Cables',
    n: 'Generic 10mm Solar Cable (per metre)',
    brand: 'Generic',
    sp: '10mm heavy commercial DC cable wire',
    price: '₦6,800',
    desc: 'If you\'re looking for heavier-duty cable for larger solar systems, this 10mm Solar Cable gives you safe, efficient connections.'
  },

  // Solar Panels
  {
    id: 'GEN-460WUSED',
    cat: 'Solar Panels',
    n: 'Generic 460W Used Solar Panel',
    brand: 'Generic',
    sp: '460W monocrystalline tested used panel',
    price: '₦50,000',
    desc: 'If you\'re looking for an affordable entry into solar power, this 460W Fairly Used Solar Panel gives you working solar generation at a lower cost.'
  },
  {
    id: 'GEN-460WMONO',
    cat: 'Solar Panels',
    n: 'Generic 460W Crystalline Panel',
    brand: 'Generic',
    sp: '460W high performance monocrystalline module',
    price: '₦95,000',
    desc: 'If you\'re looking for a quality new solar panel, this 460W Exulted Mono Crystalline Panel gives you efficient solar power generation.'
  },
  {
    id: 'JKO-450WMONO',
    cat: 'Solar Panels',
    n: 'Jinko 450W Mono Crystalline Panel',
    brand: 'Jinko',
    sp: '450W Tier-1 bifacial high absorption structure',
    price: '₦140,000',
    desc: 'If you\'re looking for a trusted-brand solar panel, this Jinko 450W Mono Crystalline Panel gives you efficient, reliable power generation.'
  },
  {
    id: 'JKO-590WMONO',
    cat: 'Solar Panels',
    n: 'Jinko 590W Mono Crystalline Panel',
    brand: 'Jinko',
    sp: '590W monocrystalline high efficacy panel',
    price: '₦155,000',
    desc: 'If you\'re looking for a higher-output solar panel, this Jinko 590W Mono Crystalline Panel gives you more power generation per panel.'
  },
  {
    id: 'JKO-620WMONO',
    cat: 'Solar Panels',
    n: 'Jinko 620W Mono Crystalline Panel',
    brand: 'Jinko',
    sp: '620W heavy-duty monocrystalline solar layout',
    price: '₦160,000',
    desc: 'If you\'re looking for a high-output solar panel, this Jinko 620W Mono Crystalline Panel gives you strong power generation for your system.'
  },
  {
    id: 'JKO-715W',
    cat: 'Solar Panels',
    n: 'Jinko 715W Mono Solar Panel',
    brand: 'Jinko',
    sp: '715W ultra high wattage solar module',
    price: '₦170,000',
    desc: 'If you\'re looking for the highest-output solar panel, this Jinko 715W Solar Panel gives you maximum power generation per panel.'
  },

  // Solar All-in-One
  {
    id: 'CWO-1200W2500WHGEN',
    cat: 'All-in-One',
    n: 'Cworth 1200W/2500WH Solar Generator',
    brand: 'Cworth',
    sp: '1200W pure sine inverter with integrated 2.5KWH battery',
    price: '₦750,000',
    desc: 'If you\'re looking for an all-in-one portable power solution, this Cworth 1200W/2500WH Solar Generator gives you power storage and output in one unit.'
  },
  {
    id: 'ITEL-500W1000WH',
    cat: 'All-in-One',
    n: 'Itel 500W Solar Generator',
    brand: 'Itel',
    sp: '500W output power box with built-in 1000Wh Lithium battery',
    price: '₦380,000',
    desc: 'If you\'re looking for a compact portable power solution, this Itel 500W Solar Generator with 1000Wh Lithium battery gives you power on the go.'
  }
];

export const DEFAULT_DEALS: Deal[] = [
  {
    id: 'd1',
    title: 'HP Neverstop 1000W',
    desc: 'SPECIAL PROMO — Wireless laser tank printer for extremely high outputs.',
    origPrice: '₦280,000',
    salePrice: '₦200,000',
    badge: 'SPECIAL PROMO',
    icon: 'Printer'
  },
  {
    id: 'd2',
    title: 'HP Pavilion Laptop 13',
    desc: 'PROMO LAPTOP — Slick 13-inch Portable Core i3, beautiful Natural Silver.',
    origPrice: '₦780,000',
    salePrice: '₦650,000',
    badge: 'PROMO LAPTOP',
    icon: 'Laptop'
  },
  {
    id: 'd3',
    title: 'HP 250 G8 Laptop',
    desc: 'PROMO LAPTOP — Serious processing performance with 1TB deep space drive.',
    origPrice: '₦950,000',
    salePrice: '₦750,000',
    badge: 'PROMO LAPTOP',
    icon: 'Laptop'
  },
  {
    id: 'd4',
    title: 'HP Laptop 15 Touch',
    desc: 'PROMO LAPTOP — 12GB multi-tasking RAM, fast setup, Win 10 preinstalled.',
    origPrice: '₦820,000',
    salePrice: '₦685,000',
    badge: 'PROMO LAPTOP',
    icon: 'Laptop'
  },
  {
    id: 'd5',
    title: '460W Used Solar Panel',
    desc: 'BUDGET SOLAR — Quality tested monocrystalline, maximum power output.',
    origPrice: '₦95,000',
    salePrice: '₦50,000',
    badge: 'BUDGET SOLAR',
    icon: 'Sun'
  }
];

export const GALLERY_PHOTOS = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
    label: 'HiTech Emporium Storefront',
    sub: '6 Airport Road, Warri · Authorised Distributors',
    productCode: '',
    price: '',
    isCustom: false
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80',
    label: 'Computers & Office Equipment Showroom',
    sub: 'Warri · Premium setup and professional consultation',
    productCode: '',
    price: '',
    isCustom: false
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?auto=format&fit=crop&w=600&q=80',
    label: 'HP Printers & Ink Supply',
    sub: 'LaserJet · Color Laser · Smart Tank · MFP range',
    productCode: '',
    price: '',
    isCustom: false
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=600&q=80',
    label: 'Professional Monitor & CCTV Section',
    sub: 'Display monitors · HD CCTV packages · DVR systems',
    productCode: '',
    price: '',
    isCustom: false
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=600&q=80',
    label: 'Solar Panel Stocks',
    sub: 'Jinko Mono Bifacial highly efficient tier-1 panels',
    productCode: '',
    price: '',
    isCustom: false
  },
  {
    id: '6',
    url: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=600&q=80',
    label: 'HP Toner & Storage Supplies',
    sub: 'HP toner · Ink cartridges · Dahua security units',
    productCode: '',
    price: '',
    isCustom: false
  },
  {
    id: '7',
    url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80',
    label: 'Accessories & Laptop Essentials',
    sub: 'CCTV accessories · Ink, keyboards, mice · Store counter',
    productCode: '',
    price: '',
    isCustom: false
  },
  {
    id: '8',
    url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80',
    label: 'Premium Bluetooth Speakers',
    sub: 'Zealot high-volume wireless sound speaker systems',
    productCode: '',
    price: '',
    isCustom: false
  },
  {
    id: '9',
    url: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80',
    label: 'Smart LED TVs & Business Electronics',
    sub: 'LG LED TVs · Home theater systems · Full showroom',
    productCode: '',
    price: '',
    isCustom: false
  },
  {
    id: '10',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    label: 'Compact Sliders & Digital Cameras',
    sub: 'Canon DSLRs · High-precision cameras and webcams',
    productCode: '',
    price: '',
    isCustom: false
  },
  {
    id: '11',
    url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
    label: 'Workstation Laptops on Stand',
    sub: 'HP · Dell · Lenovo laptops on display with diagnostics',
    productCode: '',
    price: '',
    isCustom: false
  },
  {
    id: '12',
    url: 'https://images.unsplash.com/photo-1620038650424-85e6ebd9592f?auto=format&fit=crop&w=600&q=80',
    label: 'Hybrid Inverters & Lithium Cells',
    sub: 'Hisense/Cworth inverters · Stacking batteries · Solar panels',
    productCode: '',
    price: '',
    isCustom: false
  },
  {
    id: '13',
    url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
    label: 'HP Pavilion x360 convertible display',
    sub: 'Touchscreen · 360° flip · Laptop · Tent · Tablet · Stand modes',
    productCode: '',
    price: '',
    isCustom: false
  },
  {
    id: '14',
    url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80',
    label: 'HP Elite laptop exhibition',
    sub: 'Converts to 4 modes · Core i5/i7 · 14” FHD Touch screen',
    productCode: '',
    price: '',
    isCustom: false
  },
  {
    id: '15',
    url: 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80',
    label: 'HP Spectre Premium display card',
    sub: 'Ultra-slim · Active stylus pen included · Soft touch screen',
    productCode: '',
    price: '',
    isCustom: false
  },
  // MAPPED PRODUCT PHOTOS FROM PDF FILE 1 & 2
  {
    id: 'gal_pdf_1',
    url: '/uploads/GEN-12V220AHTUBULAR_front.jpg',
    label: 'Generic 12V 220Ah Tubular Battery',
    sub: '12V · 220Ah tall tubular backup block',
    productCode: 'GEN-12V220AHTUBULAR',
    price: '₦260,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_2',
    url: '/uploads/GEN-12.4V2400WLITHIUM_front.jpg',
    label: 'Generic 12.4V 2400W Lithium Battery',
    sub: '12.4V · 2400W deep-cycle modular cell',
    productCode: 'GEN-12.4V2400WLITHIUM',
    price: '₦250,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_3',
    url: '/uploads/FEL-SCCM6048_front.jpg',
    label: 'Felicity SCCM6048 Solar Controller',
    sub: '60A · 48V · Micro-processor MPPT stabilization',
    productCode: 'FEL-SCCM6048',
    price: '₦190,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_4',
    url: '/uploads/FEL-SCCM4524_front.jpg',
    label: 'Felicity SCCM4524 Solar Controller',
    sub: '45A · 12/24V · MPPT solar charger manager',
    productCode: 'FEL-SCCM4524',
    price: '₦100,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_5',
    url: '/uploads/GRO-6KW48V2MPPT_front.jpg',
    label: 'Growatt 6KW 48V 2 MPPT Hybrid',
    sub: '6KW · 48V · Advanced 2-MPPT harvesting controller',
    productCode: 'GRO-6KW48V2MPPT',
    price: '₦650,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_6',
    url: '/uploads/FEL-IVPS5048_front.jpg',
    label: 'Felicity IVPS 5048 5KVA Inverter',
    sub: '5KVA · 48V · Non-hybrid pure converter',
    productCode: 'FEL-IVPS5048',
    price: '₦650,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_8',
    url: '/uploads/CWO-3.6KVA24VHYBRID_front.jpg',
    label: 'Cworth 3.6KVA 24V Hybrid Inverter',
    sub: '3.6KVA · 24V · High output hybrid pure sine',
    productCode: 'CWO-3.6KVA24VHYBRID',
    price: '₦430,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_10',
    url: '/uploads/GRO-6KWHYBRID_front.jpg',
    label: 'Growatt 6KW Hybrid Inverter',
    sub: '6KW · 48V · Dual MPPT tracking · Multi grid blending',
    productCode: 'GRO-6KWHYBRID',
    price: '₦680,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_11',
    url: '/uploads/HP-4ZB97A_front.jpg',
    label: 'HP Color LaserJet MFP 179fnw',
    sub: 'True high fidelity color · Print, Copy, Scan & Fax with cloud integrations',
    productCode: 'HP-4ZB97A',
    price: '₦495,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_12',
    url: '/uploads/HP-7WN42B2_front.jpg',
    label: 'HP Color LaserJet 178nw Wireless',
    sub: 'High resolution color output · Compact footprint · Wired or wireless networks',
    productCode: 'HP-7WN42B2',
    price: '₦525,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_13',
    url: '/uploads/CHO-1.5KVA12V_front.jpg',
    label: 'Choice 1.5KVA 12V Inverter',
    sub: '1.5KVA · 12V · Compact single-battery setup',
    productCode: 'CHO-1.5KVA12V',
    price: '₦220,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_14',
    url: '/uploads/HP-2Z610AB19_front.jpg',
    label: 'HP LaserJet Pro 4003dw',
    sub: 'Enterprise monochrome laser · 40 ppm speed · Dual automatic duplexing',
    productCode: 'HP-2Z610AB19',
    price: '₦520,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_15',
    url: '/uploads/CHO-2.5KVA24V_front.jpg',
    label: 'Choice 2.5KVA 24V Inverter',
    sub: '2.5KVA · 24V · Household pure sine',
    productCode: 'CHO-2.5KVA24V',
    price: '₦360,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_16',
    url: '/uploads/HP-Y0S18AA80_front.jpg',
    label: 'HP OfficeJet Pro 7720 Wide Format',
    sub: 'A3 Printing · Document Scan/Copy/Fax · Premium heavy workload design',
    productCode: 'HP-Y0S18AA80',
    price: '₦360,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_17',
    url: '/uploads/HP-G5J38A_front.jpg',
    label: 'HP OfficeJet Pro 7740 Wide Format',
    sub: 'Double Paper Tray · Auto wide format Duplex · High capacity inks',
    productCode: 'HP-G5J38A',
    price: '₦475,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_18',
    url: '/uploads/DEKA-3.5KVA24V_front.jpg',
    label: 'Deka 3.5KVA 24V Standing Inverter',
    sub: '3.5KVA · 24V · Heavy duty pure sine standing',
    productCode: 'DEKA-3.5KVA24V',
    price: '₦360,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_19',
    url: '/uploads/HP-1TJ09A_front.jpg',
    label: 'HP Smart Tank 515 Wireless',
    sub: 'High Volume Ink Tank · Long lasting supply · Beautiful color output',
    productCode: 'HP-1TJ09A',
    price: '₦295,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_20',
    url: '/uploads/HP-3YW70A_front.jpg',
    label: 'HP Smart Tank 516 Color Printer',
    sub: 'Ink Tank tech · Multi-device wireless connectivity · Direct-feed system',
    productCode: 'HP-3YW70A',
    price: '₦295,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_21',
    url: '/uploads/HP-3YW73A_front.jpg',
    label: 'HP Smart Tank 519 AiO Wireless',
    sub: 'Print, Copy, Scan, Mobile · Giant Ink Reservoir · Clean reload bottle design',
    productCode: 'HP-3YW73A',
    price: '₦320,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_22',
    url: '/uploads/CHO-5KVA24V_front.jpg',
    label: 'Choice/Foresolar 5KVA 24V Inverter',
    sub: '5KVA · 24V · Low voltage high output',
    productCode: 'CHO-5KVA24V',
    price: '₦520,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_23',
    url: '/uploads/HP-6UU47A_front.jpg',
    label: 'HP Smart Tank 750 AiO',
    sub: 'Auto-Duplex Color Printing · Large Ink Reservoir · Smart buttons security',
    productCode: 'HP-6UU47A',
    price: '₦498,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_25',
    url: '/uploads/CHO-5KVA48V_front.jpg',
    label: 'Choice/Foresolar 5KVA 48V Inverter',
    sub: '5KVA · 48V · Home & light commercial backup',
    productCode: 'CHO-5KVA48V',
    price: '₦520,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_26',
    url: '/uploads/HP-Y0F71A_front.jpg',
    label: 'HP Smart Tank 615 Wireless Pro',
    sub: 'Auto Document Feeder · Smart Guided Fax · Dynamic color touch panel',
    productCode: 'HP-Y0F71A',
    price: '₦398,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_27',
    url: '/uploads/EG-650VA_front.jpg',
    label: 'Evergood 650VA UPS stand-by',
    sub: '650VA · Auto frequency correction · High thermal polymer housing',
    productCode: 'EG-650VA',
    price: '₦48,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_28',
    url: '/uploads/BG-10KVAONLINE_front.jpg',
    label: 'Bluegate 10KVA Online UPS Hub',
    sub: '10KVA max capacity tower · Hot swappable batteries · Extreme workspace guard',
    productCode: 'BG-10KVAONLINE',
    price: '₦1,650,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_29',
    url: '/uploads/BG-2KVASTAB_front.jpg',
    label: 'Bluegate 2KVA Stabilizer',
    sub: '2KVA voltage regulator · Dual display indicators · Rapid circuit correction',
    productCode: 'BG-2KVASTAB',
    price: '₦55,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_30',
    url: '/uploads/HP-9YG09A_front.jpg',
    label: 'HP LaserJet MFP M236sdw Dual-Sided',
    sub: 'Print, Copy, Scan · Auto Two-Sided printing · Dual-Band Wi-Fi',
    productCode: 'HP-9YG09A',
    price: '₦380,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_31',
    url: '/uploads/HP-9YG09A_side.jpg',
    label: 'HP LaserJet MFP M236sdw Dual-Sided (Side)',
    sub: 'Alternative view · Auto Two-Sided printing · Dual-Band Wi-Fi',
    productCode: 'HP-9YG09A',
    price: '₦380,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_32',
    url: '/uploads/BG-2.0KVAIRON_front.jpg',
    label: 'Bluegate 2.0 KVA UPS (Iron casing)',
    sub: '2KVA heavy workstation protection · Dual battery bank config · Smart cooling',
    productCode: 'BG-2.0KVAIRON',
    price: '₦148,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_33',
    url: '/uploads/BG-1.2KVAIRON_front.jpg',
    label: 'Bluegate 1.2 KVA UPS (Iron casing)',
    sub: '1.2KVA capacity · Rugged heavy-duty casing · Automatic frequency sensing',
    productCode: 'BG-1.2KVAIRON',
    price: '₦108,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_34',
    url: '/uploads/BG-1.2KVAIRON_side.jpg',
    label: 'Bluegate 1.2 KVA UPS (Iron casing) (Side)',
    sub: 'Alternative view · Rugged heavy-duty casing · Automatic frequency sensing',
    productCode: 'BG-1.2KVAIRON',
    price: '₦108,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_35',
    url: '/uploads/HP-4ZB84A_front.jpg',
    label: 'HP Laser MFP 137fnw Duplex',
    sub: 'Print, Copy, Scan, Fax · Auto Document Feeder (ADF) · Ethernet & Wi-Fi',
    productCode: 'HP-4ZB84A',
    price: '₦390,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_36',
    url: '/uploads/HP-84V4EA_front.jpg',
    label: 'HP Pavilion Laptop 13-bb0029nia',
    sub: 'Intel Core i3-1115G4 · 8GB DDR4 · 256GB SSD · 13.3” · Backlit · Windows 10',
    productCode: 'HP-84V4EA',
    price: '₦650,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_37',
    url: '/uploads/HP-9G1W6ET_front.jpg',
    label: 'HP ProBook 440 G11 (Core 7)',
    sub: 'Intel Core 7 155U · 16GB DDR5 · 512GB SSD · Fingerprint Reader · Windows 11 · 14”',
    productCode: 'HP-9G1W6ET',
    price: '₦1,340,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_40',
    url: '/uploads/DEYE-5KWH48VLITHIUM_front.jpg',
    label: 'Deye 5KWH 48V Lithium Battery',
    sub: '5KWH · 48V premium wall mount pack',
    productCode: 'DEYE-5KWH48VLITHIUM',
    price: '₦1,050,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_42',
    url: '/uploads/HP-14Z79EA_front.jpg',
    label: 'HP 250 G7 Laptop',
    sub: 'Intel Core i5-1035G1 · 8GB RAM · 1TB HDD · 15.6” HD · DVD-RW · DOS',
    productCode: 'HP-14Z79EA',
    price: '₦690,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_44',
    url: '/uploads/HP-2R9H6EA_front.jpg',
    label: 'HP 250 G8 Laptop',
    sub: 'Intel Core i7 · 8GB RAM · 1TB HDD · 15.6” · FreeDOS',
    productCode: 'HP-2R9H6EA',
    price: '₦750,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_45',
    url: '/uploads/HP-32M66EA_front.jpg',
    label: 'HP 240 G8 Pentium',
    sub: 'Intel Pentium Silver N5030 · 4GB DDR4 · 1TB HDD · DOS',
    productCode: 'HP-32M66EA',
    price: '₦490,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_46',
    url: '/uploads/HP-7N0F3ES_front.jpg',
    label: 'HP 240 G9 Laptop',
    sub: 'Intel Core i3-1215U · 8GB DDR4 · 256GB SSD · 14” HD · DOS',
    productCode: 'HP-7N0F3ES',
    price: '₦560,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_47',
    url: '/uploads/HP-1L3W7EA_front.jpg',
    label: 'HP 240 G7 Laptop',
    sub: 'Intel Core i5-1035G1 · 8GB DDR4 · 1TB HDD · 14” HD · Windows 10',
    productCode: 'HP-1L3W7EA',
    price: '₦690,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_48',
    url: '/uploads/HP-2R411EA_front.jpg',
    label: 'HP Laptop 14-cf3016nia',
    sub: 'Intel Core i5-1035G1 · 8GB DDR4 · 1TB HDD · 14” HD SVA · Wi-Fi 6 · Bluetooth 5',
    productCode: 'HP-2R411EA',
    price: '₦650,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_49',
    url: '/uploads/HP-9B4P0EA_front.jpg',
    label: 'HP Laptop 14-ep0055nia',
    sub: 'Intel Core i5-1335U · 8GB DDR4 · 512GB SSD · 14”',
    productCode: 'HP-9B4P0EA',
    price: '₦880,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_55',
    url: '/uploads/HP-B13YBEA_front.jpg',
    label: 'HP All-in-One Desktop 22-dg0007nh',
    sub: 'Intel Processor N100 · 8GB DDR5 · 256GB SSD · 22” Display · DOS',
    productCode: 'HP-B13YBEA',
    price: '₦620,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_56',
    url: '/uploads/HP-350Q2EA_front.jpg',
    label: 'HP Envy 13-bd0007na x360',
    sub: 'Intel Core i5-1135G7 · 8GB DDR4 · 512GB PCIe · 13.3” FHD Touch · Bang & Olufsen',
    productCode: 'HP-350Q2EA',
    price: '₦1,100,000',
    isCustom: false
  },
  {
    id: 'gal_pdf_58',
    url: '/uploads/HP-9M9M9AT_front.jpg',
    label: 'HP Pro One 240 G10 All-in-One',
    sub: 'Intel Core i3-N300 · 4GB RAM · 512GB SSD · 23.8” Display · Wi-Fi',
    productCode: 'HP-9M9M9AT',
    price: '₦1,080,000',
    isCustom: false
  }
];

export const SOLAR_SIZING_EQUIPMENT_RULES = {
  inverterRecommendation: [
    { maxLoadWatts: 1000, modelId: 'CHO-1.5KVA12V', spec: '1.5KVA 12V Inverter' },
    { maxLoadWatts: 2000, modelId: 'CWO-1.8KVA24VHYBRID', spec: '1.8KVA Hybrid Inverter' },
    { maxLoadWatts: 3000, modelId: 'CWO-3.6KVA24VHYBRID', spec: '3.6KVA Hybrid Inverter' },
    { maxLoadWatts: 4500, modelId: 'FEL-IVPM5048', spec: '5KVA Hybrid 48V Inverter' },
    { maxLoadWatts: 9000, modelId: 'FEL-IVPM10048', spec: '10KVA Hybrid 48V Inverter' }
  ],
  batteryRecommendation: [
    { volts: 12, sizeAh: 220, type: 'Tubular', modelId: 'GEN-12V220AHTUBULAR' },
    { volts: 12, sizeAh: 200, type: 'Lithium', modelId: 'GEN-12.4V2400WLITHIUM' },
    { volts: 48, sizeAh: 100, type: 'Lithium', modelId: 'DEYE-5KWH48VLITHIUM' },
    { volts: 48, sizeAh: 200, type: 'Lithium', modelId: 'FEL-10KWH48V' }
  ],
  panelRecommendation: [
    { watts: 450, brand: 'Jinko', modelId: 'JKO-450WMONO' },
    { watts: 590, brand: 'Jinko', modelId: 'JKO-590WMONO' }
  ]
};
