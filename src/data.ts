import { Category, Product, SolarProduct, Deal } from './types';

export const WA_SALES = '2348065210611';
export const WA_INVENTORY = '2348034832773';
export const WA_GM = '2348032175552';
export const WA_GEN = '2347032724432';
export const DEF_PIN = '12345';
export const MGR_KEY = 'qw123#@';

export const STORE = {
  name: 'HITECH DISTRIBUTORS',
  address: '6 Airport Road, Warri, Delta State',
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
  // Laptops (Photos 30, 42, 44, 45, 46, 47, 48, 49, 55, 56, 58, and missing/Unmade laptop slots)
  {
    id: 1,
    pn: 'HP-9YG09A',
    cat: 'laptops',
    n: 'HP Laptop 9YG09A',
    sp: 'High-performance professional workstation laptop series',
    price: '₦850,000',
    desc: 'HP professional grade laptop with excellent processing power. Standard corporate configuration.'
  },
  {
    id: 2,
    pn: 'HP-14Z79EA',
    cat: 'laptops',
    n: 'HP 250 G7 Laptop',
    sp: 'Intel Core i5-1035G1 · 8GB RAM · 1TB HDD · 15.6” HD · DVD-RW · DOS',
    price: '₦690,000',
    desc: 'Fast, reliable laptop suitable for executive tasks, spreadsheets and deep database logging workflows.'
  },
  {
    id: 3,
    pn: 'HP-2R9H6EA',
    cat: 'laptops',
    n: 'HP 250 G8 Laptop',
    sp: 'Intel Core i7 · 8GB RAM · 1TB HDD · 15.6” · FreeDOS',
    price: '₦750,000',
    desc: 'Powerhouse machine delivering intensive computing, generous storage, and streamlined industrial performance.'
  },
  {
    id: 4,
    pn: 'HP-32M66EA',
    cat: 'laptops',
    n: 'HP 240 G8 Pentium',
    sp: 'Intel Pentium Silver N5030 · 4GB DDR4 · 1TB HDD · DOS',
    price: '₦490,000',
    desc: 'Reliable Pentium laptop designed with generous capacity for small businesses and school research.'
  },
  {
    id: 5,
    pn: 'HP-7N0F3ES',
    cat: 'laptops',
    n: 'HP Laptop 7N0F3ES',
    sp: 'Modern Core-Series Laptop',
    price: '₦890,000',
    desc: 'Efficient productivity laptop with premium multi-tasking architecture and high contrast screen.'
  },
  {
    id: 6,
    pn: 'HP-1L3W7EA',
    cat: 'laptops',
    n: 'HP Laptop 1L3W7EA',
    sp: 'Sleek professional laptop, Core i5 · 8GB RAM · 512GB SSD',
    price: '₦910,000',
    desc: 'Modern thin-and-light laptop featuring powerful processing capability and exceptionally fast SSD storage.'
  },
  {
    id: 7,
    pn: 'HP-2R411EA',
    cat: 'laptops',
    n: 'HP Laptop 2R411EA',
    sp: 'High productivity computing setup',
    price: '₦820,000',
    desc: 'Streamlined laptop engineered for versatile administrative computing and commercial software suites.'
  },
  {
    id: 8,
    pn: 'HP-9B4P0EA',
    cat: 'laptops',
    n: 'HP Laptop 9B4P0EA',
    sp: 'Professional Series Productivity Laptop',
    price: '₦840,000',
    desc: 'Secure enterprise-focused laptop optimized for modern business portals and active task management.'
  },
  {
    id: 9,
    pn: 'HP-B13YBEA',
    cat: 'laptops',
    n: 'HP Laptop B13YBEA',
    sp: 'Core i5 series business notebook',
    price: '₦880,000',
    desc: 'Premium professional grade workstation notebook built for durability and continuous corporate operations.'
  },
  {
    id: 10,
    pn: 'HP-350Q2EA',
    cat: 'laptops',
    n: 'HP Laptop 350Q2EA',
    sp: 'Dual Core productivity laptop',
    price: '₦510,000',
    desc: 'Agile computing device featuring durable build, high ergonomics, and excellent power efficiency.'
  },
  {
    id: 11,
    pn: 'HP-9M9M9AT',
    cat: 'laptops',
    n: 'HP Laptop 9M9M9AT',
    sp: 'Ultra-thin elite performance notebook',
    price: '₦950,000',
    desc: 'Top-tier executive portable computer with high-speed memory and multi-threaded processing power.'
  },
  // Missing / Unmade Laptops (Photo IDs 43, 50, 51, 52, 53, 54, 57)
  {
    id: 12,
    pn: 'UNMADE_43',
    cat: 'laptops',
    n: 'Unmade',
    sp: 'HP laptop - specification details pending customer confirmation',
    price: 'CALL',
    desc: 'Awaiting hardware specification sticker validation to populate model datasheet.'
  },
  {
    id: 13,
    pn: 'UNMADE_50',
    cat: 'laptops',
    n: 'Unmade',
    sp: 'HP laptop - specification details pending customer confirmation',
    price: 'CALL',
    desc: 'Awaiting hardware specification sticker validation to populate model datasheet.'
  },
  {
    id: 14,
    pn: 'UNMADE_51',
    cat: 'laptops',
    n: 'Unmade',
    sp: 'HP laptop - specification details pending customer confirmation',
    price: 'CALL',
    desc: 'Awaiting hardware specification sticker validation to populate model datasheet.'
  },
  {
    id: 15,
    pn: 'UNMADE_52',
    cat: 'laptops',
    n: 'Unmade',
    sp: 'HP laptop - specification details pending customer confirmation',
    price: 'CALL',
    desc: 'Awaiting hardware specification sticker validation to populate model datasheet.'
  },
  {
    id: 16,
    pn: 'UNMADE_53',
    cat: 'laptops',
    n: 'Unmade',
    sp: 'HP laptop - specification details pending customer confirmation',
    price: 'CALL',
    desc: 'Awaiting hardware specification sticker validation to populate model datasheet.'
  },
  {
    id: 17,
    pn: 'UNMADE_54',
    cat: 'laptops',
    n: 'Unmade',
    sp: 'HP laptop - specification details pending customer confirmation',
    price: 'CALL',
    desc: 'Awaiting hardware specification sticker validation to populate model datasheet.'
  },
  {
    id: 18,
    pn: 'UNMADE_57',
    cat: 'laptops',
    n: 'Unmade',
    sp: 'HP laptop - specification details pending customer confirmation',
    price: 'CALL',
    desc: 'Awaiting hardware specification sticker validation to populate model datasheet.'
  },

  // Printers (Photos 11, 12, 14, 16, 17, 19, 20, 21, 23, 26, 35, 36, 37, and unmade printers 24, 38, 39)
  {
    id: 19,
    pn: 'HP-4ZB97A',
    cat: 'printers',
    n: 'HP Laser 135a AIO Printer',
    sp: 'All-in-One print, copy, scan · Up to 20 ppm · Crisp black text',
    price: '₦220,500',
    desc: 'Affordable, compact monochrome laser printer with high output capacity and sharp print quality.'
  },
  {
    id: 20,
    pn: 'HP-7WN42B2',
    cat: 'printers',
    n: 'HP DeskJet 2720 AIO Printer',
    sp: 'Wireless printing · Color inkjet · Flatbed scan sensor',
    price: '₦85,000',
    desc: 'Ideal home and small office color printer supporting smartphone connection options and fast setup.'
  },
  {
    id: 21,
    pn: 'HP-2Z610AB19',
    cat: 'printers',
    n: 'HP DeskJet Plus 4120',
    sp: 'All-in-One color printer w/ automatic document feeder',
    price: '₦110,000',
    desc: 'Efficient color printer with hands-free copying options, mobile printing, and dynamic security.'
  },
  {
    id: 22,
    pn: 'HP-Y0S18AA80',
    cat: 'printers',
    n: 'HP OfficeJet Wide Format 7740',
    sp: 'Wide-format A3 copying & scanning · Auto duplex print · Color touchscreen',
    price: '₦430,000',
    desc: 'High-speed professional wide format inkjet printer providing high impact marketing brochures.'
  },
  {
    id: 23,
    pn: 'HP-G5J38A',
    cat: 'printers',
    n: 'HP OfficeJet Pro 8710',
    sp: 'Color touchscreen and full duplex scanning options',
    price: '₦320,000',
    desc: 'Heavy duty office print solution featuring rapid print turnarounds and robust network security protocols.'
  },
  {
    id: 24,
    pn: 'HP-1TJ09A',
    cat: 'printers',
    n: 'HP Neverstop Laser 1000a',
    sp: 'Monochrome high capacity reloadable laser tank',
    price: '₦195,000',
    desc: 'Innovative cartridge-free laser printer allowing extremely low-cost prints and easy developer toner loads.'
  },
  {
    id: 25,
    pn: 'HP-3YW70A',
    cat: 'printers',
    n: 'HP Smart Tank 516 AIO Printer',
    sp: 'Thermal ink tank color printing · Mobile controls · Extremely low-cost',
    price: '₦185,000',
    desc: 'High capacity ink tank printer delivering magnificent colors, long ink spans, and direct network integration.'
  },
  {
    id: 26,
    pn: 'HP-3YW73A',
    cat: 'printers',
    n: 'HP Smart Tank 515 Wireless',
    sp: 'Wireless cartridge-free high capacity ink tank printer',
    price: '₦180,000',
    desc: 'Premium bottle-refill Smart Tank printer providing supreme print speed and gorgeous photograph prints.'
  },
  {
    id: 27,
    pn: 'HP-6UU47A',
    cat: 'printers',
    n: 'HP DeskJet Plus 4110 Wireless',
    sp: 'Color multi-function home inkjet printer',
    price: '₦105,005',
    desc: 'Reliable wireless duplex printer ideal for everyday learning, scanning reports and quick copy prints.'
  },
  {
    id: 28,
    pn: 'HP-Y0F71A',
    cat: 'printers',
    n: 'HP LaserJet Pro M404dn',
    sp: 'Duplex monochrome printing · Fast auto-start · 40 ppm speed',
    price: '₦340,000',
    desc: 'Compact desktop business laser engineered to handle massive workloads and complex office networking.'
  },
  {
    id: 29,
    pn: 'HP-4ZB84A',
    cat: 'printers',
    n: 'HP Color Laser 150a',
    sp: 'Compact color prints · Up to 18 ppm mono / 4 ppm color',
    price: '₦260,000',
    desc: 'Dynamic color desktop laser printer optimized for crisp logos, solid text blocks, and modern offices.'
  },
  {
    id: 30,
    pn: 'HP-84V4EA',
    cat: 'printers',
    n: 'HP Color LaserJet Pro M254dw',
    sp: 'High speed color workgroup printer, double sided',
    price: '₦380,000',
    desc: 'High density dynamic printer for active office crews requiring vibrant color graphics and fast output.'
  },
  {
    id: 31,
    pn: 'HP-9G1W6ET',
    cat: 'printers',
    n: 'HP OfficeJet Pro 9010 AIO',
    sp: 'Inkjet multi-function workflow system',
    price: '₦290,000',
    desc: 'Slick voice-enabled printer designed to optimize document processes and support automated double sided copies.'
  },
  // Unmade Printers (Photos 24, 38, 39)
  {
    id: 32,
    pn: 'UNMADE_24',
    cat: 'printers',
    n: 'Unmade',
    sp: 'Smart Tank AIO printer - awaiting specification confirmation',
    price: 'CALL',
    desc: 'Dark Smart Tank All-in-One printer mockup. Technical details pending physical barcode check.'
  },
  {
    id: 33,
    pn: 'UNMADE_38',
    cat: 'printers',
    n: 'Unmade',
    sp: 'HP Laser class workgroup printer with dual expansion trays - details pending',
    price: 'CALL',
    desc: 'Awaiting model confirmation (possible candidates: HP-W1A80A, HP-7KW56A/72A).'
  },
  {
    id: 34,
    pn: 'UNMADE_39',
    cat: 'printers',
    n: 'Unmade',
    sp: 'HP laser office printer unit - details pending',
    price: 'CALL',
    desc: 'Photo missing/incomplete in PDF. Standard specifications are uncommitted.'
  },

  // Desktops (Photos 59, 60 - All-in-One "Unmade")
  {
    id: 35,
    pn: 'UNMADE_59',
    cat: 'desktops',
    n: 'Unmade',
    sp: 'HP All-in-One desktop computer system - awaiting specifications',
    price: 'CALL',
    desc: 'Awaiting spec sticker lookup (possible candidate: HP-9M9H5AT).'
  },
  {
    id: 36,
    pn: 'UNMADE_60',
    cat: 'desktops',
    n: 'Unmade',
    sp: 'HP All-in-One desktop system - details pending',
    price: 'CALL',
    desc: 'Technical specs unverified by physical audits. Awaiting inventory log clearance.'
  },

  // Accessories / Power (Photos 27, 28, 29, 32, 33, and unmade 41)
  {
    id: 37,
    pn: 'EG-650VA',
    cat: 'accessories',
    n: 'Engenius 650VA UPS',
    sp: '650VA / 390W offline battery backup protection',
    price: '₦45,000',
    desc: 'Surge protector and voltage regulator ensuring clean backup shutdown spans for offices.'
  },
  {
    id: 38,
    pn: 'BG-10KVAONLINE',
    cat: 'accessories',
    n: 'Bluegate 10KVA Online UPS',
    sp: '10KVA double-conversion online setup · Zero delay switch time',
    price: '₦1,850,000',
    desc: 'Superior power backup server protecting data grids, heavy telecom nodes, and highly delicate office machinery.'
  },
  {
    id: 40,
    pn: 'BG-2KVASTAB',
    cat: 'accessories',
    n: 'Bluegate 2KVA Stabilizer',
    sp: '2000VA voltage regulator with automatic output delay protection',
    price: '₦68,000',
    desc: 'Premium voltage correction system safeguarding laptops, televisions, inverters, and office networks.'
  },
  {
    id: 41,
    pn: 'BG-2.0KVAIRON',
    cat: 'accessories',
    n: 'Bluegate 2.0KVA Iron-Core Stabilizer',
    sp: 'Heavy-duty 2000VA stabilizer w/ analog dial indicators',
    price: '₦80,000',
    desc: 'Robust copper winding iron core stabilizer designed to sustain massive continuous voltage surges.'
  },
  {
    id: 42,
    pn: 'BG-1.2KVAIRON',
    cat: 'accessories',
    n: 'Bluegate 1.2KVA Iron-Core Stabilizer',
    sp: '1200VA high accuracy volt-correction unit',
    price: '₦55,000',
    desc: 'Precision voltage management system designed for delicate computerized hardware and office networks.'
  },
  {
    id: 43,
    pn: 'UNMADE_41',
    cat: 'accessories',
    n: 'Unmade',
    sp: 'Power regulator / hardware accessory - details pending',
    price: 'CALL',
    desc: 'Awaiting tech spec datasheet assignment for this slot.'
  }
];

export const SOLAR: SolarProduct[] = [
  // Solar tubular battery (Photo #1)
  {
    id: 'GEN-12V220AHTUBULAR',
    cat: 'Tubular Battery',
    n: 'Genus 12V 220AH Tubular Battery',
    brand: 'Genus',
    sp: '12V · 220AH deep physical tube plates · Ideal for deep cycling',
    price: '₦280,000',
    desc: 'Genus premium deep cycle tubular battery delivering superb continuous power outputs even during severe blackouts.'
  },
  // Solar lithium battery (Photo #2)
  {
    id: 'GEN-12.4V2400WLITHIUM',
    cat: 'Lithium Batteries',
    n: 'Genus 12.4V 2400Wh Lithium Battery',
    brand: 'Genus',
    sp: '12.4V · 2400Wh capacity · Long life span LiFePO4 cells',
    price: '₦720,000',
    desc: 'Ultra durable lightweight lithium power pack enabling advanced cycling and extreme temperature stability.'
  },
  // Solar controllers (Photos 3, 4)
  {
    id: 'FEL-SCCM6048',
    cat: 'Controllers',
    n: 'Felicity MPPT 60A 48V Controller',
    brand: 'Felicity',
    sp: '60A · 48V auto-select · Maximum power point tracking',
    price: '₦180,000',
    desc: 'High performance charge optimizer converting maximum solar collector power directly into safe battery state.'
  },
  {
    id: 'FEL-SCCM4524',
    cat: 'Controllers',
    n: 'Felicity MPPT 45A 24V Controller',
    brand: 'Felicity',
    sp: '45A · 24V auto tracking controller',
    price: '₦140,000',
    desc: 'Dependable solar charge management module featuring intelligent multi-stage battery preservation loops.'
  },
  // Solar Inverters (Photos 5, 6, 7-unmade, 8, 9-unmade, 10, 13, 15, 18, 22, 25)
  {
    id: 'GRO-6KW48V2MPPT',
    cat: 'Inverters',
    n: 'Growatt 6KW 48V Dual MPPT Inverter',
    brand: 'Growatt',
    sp: '6KW · 48V · High efficiency dual solar tracker outputs',
    price: '₦1,150,000',
    desc: 'Industry standard advanced hybrid solar inverter. Ideal for smart remote setup management.'
  },
  {
    id: 'FEL-IVPS5048',
    cat: 'Inverters',
    n: 'Felicity IVPS 5KVA 48V Inverter',
    brand: 'Felicity',
    sp: '5KVA / 5000W · 48V auto charging power inverter',
    price: '₦590,000',
    desc: 'Heavy duty modular power plant inverter providing high overload capacity and instant backup switching.'
  },
  {
    id: 'UNMADE_7',
    cat: 'Inverters',
    n: 'Unmade',
    brand: 'Cworth',
    sp: 'Cworth hybrid inverter slot - awaiting code details',
    price: 'CALL',
    desc: 'Candidates config: CWO-1.8KVA24VHYBRID and CWO-4KVA24VHYBRID. Spec uncommitted.'
  },
  {
    id: 'CWO-3.6KVA24VHYBRID',
    cat: 'Inverters',
    n: 'Cworth 3.6KVA 24V Hybrid Inverter',
    brand: 'Cworth',
    sp: '3.6KVA · 24V high accuracy pure sine inverter',
    price: '₦390,000',
    desc: 'Compact hybrid inverter with intuitive LCD display configuration and direct generator charging support.'
  },
  {
    id: 'UNMADE_9',
    cat: 'Inverters',
    n: 'Unmade',
    brand: 'Cworth',
    sp: 'Cworth hybrid inverter slot - awaiting specifications',
    price: 'CALL',
    desc: 'Candidates config: CWO-1.8KVA24VHYBRID and CWO-4KVA24VHYBRID. Spec uncommitted.'
  },
  {
    id: 'GRO-6KWHYBRID',
    cat: 'Inverters',
    n: 'Growatt 6KW Hybrid Inverter',
    brand: 'Growatt',
    sp: '6KW · Full home automation backup power plant',
    price: '₦1,250,000',
    desc: 'State of the art grid-tied hybrid inverter supporting complex smart energy schedules.'
  },
  {
    id: 'CHO-1.5KVA12V',
    cat: 'Inverters',
    n: 'Choice 1.5KVA 12V Inverter',
    brand: 'Choice',
    sp: '1.5KVA · 12V compact office/home inverter',
    price: '₦210,000',
    desc: 'Energy-dense single battery inverter ideal for powering lamps, laptops, and basic equipment.'
  },
  {
    id: 'CHO-2.5KVA24V',
    cat: 'Inverters',
    n: 'Choice 2.5KVA 24V Inverter',
    brand: 'Choice',
    sp: '2.5KVA · 24V robust medium energy backup system',
    price: '₦290,000',
    desc: 'Affordable, efficient low-maintenance inverter serving household electronics and office networks.'
  },
  {
    id: 'DEKA-3.5KVA24V',
    cat: 'Inverters',
    n: 'Deka 3.5KVA 24V Standing Inverter',
    brand: 'Deka',
    sp: '3.5KVA · 24V floor standing pure sine setup',
    price: '₦360,000',
    desc: 'Highly reliable standing inverter with robust passive cooling structures.'
  },
  {
    id: 'CHO-5KVA24V',
    cat: 'Inverters',
    n: 'Choice 5KVA 24V Inverter',
    brand: 'Choice',
    sp: '5KVA / 5000W · 24V standard home backup inverter',
    price: '₦510,000',
    desc: 'High output low maintenance model suitable for large air conditioners and smart kitchen networks.'
  },
  {
    id: 'CHO-5KVA48V',
    cat: 'Inverters',
    n: 'Choice 5KVA 48V Inverter',
    brand: 'Choice',
    sp: '5KVA · 48V high voltage efficiency grid inverter',
    price: '₦540,000',
    desc: 'Premium high capacity inverter perfect for commercial energy nodes and multiple solar arrays.'
  },
  // Solar Lithium Battery (Photo #40)
  {
    id: 'DEYE-5KWH48VLITHIUM',
    cat: 'Lithium Batteries',
    n: 'Deye 5KWh 48V Lithium Battery',
    brand: 'Deye',
    sp: '5KWh · 48V premium LiFePO4 wall mount unit',
    price: '₦1,450,000',
    desc: 'Exceptional solar lithium storage pack featuring high discharge depth, smart BMS controls, and 6000 cycles life.'
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

// Single default storefront photo for the showroom storefront fallback
export const GALLERY_PHOTOS = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
    label: 'HiTech Emporium Storefront',
    sub: '6 Airport Road, Warri · Authorised Distributors',
    productCode: '',
    price: '',
    isCustom: false
  }
];

export const SOLAR_SIZING_EQUIPMENT_RULES = {
  inverterRecommendation: [
    { maxLoadWatts: 1000, modelId: 'CHO-1.5KVA12V', spec: '1.5KVA 12V Inverter' },
    { maxLoadWatts: 3000, modelId: 'CWO-3.6KVA24VHYBRID', spec: '3.6KVA Hybrid Inverter' },
    { maxLoadWatts: 4500, modelId: 'FEL-IVPS5048', spec: '5KVA Hybrid 48V Inverter' }
  ],
  batteryRecommendation: [
    { volts: 12, sizeAh: 220, type: 'Tubular', modelId: 'GEN-12V220AHTUBULAR' },
    { volts: 12, sizeAh: 200, type: 'Lithium', modelId: 'GEN-12.4V2400WLITHIUM' },
    { volts: 48, sizeAh: 100, type: 'Lithium', modelId: 'DEYE-5KWH48VLITHIUM' }
  ],
  panelRecommendation: [
    { watts: 460, brand: 'Foresolar', modelId: 'Foresolar-460W' }
  ]
};
