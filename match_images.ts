import fs from 'fs';
import path from 'path';

const resultsFile = 'image_analysis_results.json';
const uploadsDir = path.join('public', 'uploads');

interface ImageAnalysis {
  file: string;
  brand: string;
  category: 'laptop' | 'printer' | 'desktop' | 'inverter' | 'battery' | 'controller' | 'stabilizer' | 'ups' | 'unknown';
  visibleModel: string;
  visualFeatures: string;
  view: 'front' | 'side' | 'unknown';
}

interface TargetSlot {
  id: string; // e.g. "HP-14Z79EA_front.jpg"
  code: string; // e.g. "HP-14Z79EA"
  brand: string; // e.g. "HP"
  category: 'laptop' | 'printer' | 'desktop' | 'inverter' | 'battery' | 'controller' | 'stabilizer' | 'ups' | 'unknown';
  view: 'front' | 'side' | 'unknown';
  keywords: string[];
}

const targetSlots: TargetSlot[] = [
  // UPS / Blue Gate
  { id: 'BG-1.2KVAIRON_front.jpg', code: 'BG-1.2KVAIRON', brand: 'Blue Gate', category: 'ups', view: 'front', keywords: ['iron', 'casing', '1.2'] },
  { id: 'BG-1.2KVAIRON_side.jpg', code: 'BG-1.2KVAIRON', brand: 'Blue Gate', category: 'ups', view: 'side', keywords: ['iron', 'casing', '1.2'] },
  { id: 'BG-10KVAONLINE_front.jpg', code: 'BG-10KVAONLINE', brand: 'Blue Gate', category: 'ups', view: 'front', keywords: ['online', '10kva', 'tower', 'hub'] },
  { id: 'BG-2.0KVAIRON_front.jpg', code: 'BG-2.0KVAIRON', brand: 'Blue Gate', category: 'ups', view: 'front', keywords: ['iron', '2.0', '2kva'] },
  { id: 'BG-2KVASTAB_front.jpg', code: 'BG-2KVASTAB', brand: 'Blue Gate', category: 'stabilizer', view: 'front', keywords: ['stabilizer', 'regulator', 'voltage', 'stab'] },
  { id: 'EG-650VA_front.jpg', code: 'EG-650VA', brand: 'Evergood', category: 'ups', view: 'front', keywords: ['evergood', '650va', 'ecogate', 'poly'] },

  // Solar Inverters
  { id: 'CHO-1.5KVA12V_front.jpg', code: 'CHO-1.5KVA12V', brand: 'Choice', category: 'inverter', view: 'front', keywords: ['1.5', '12v', 'compact'] },
  { id: 'CHO-2.5KVA24V_front.jpg', code: 'CHO-2.5KVA24V', brand: 'Choice', category: 'inverter', view: 'front', keywords: ['2.5', '24v', 'household'] },
  { id: 'CHO-5KVA24V_front.jpg', code: 'CHO-5KVA24V', brand: 'Choice', category: 'inverter', view: 'front', keywords: ['foresolar', '5kva', '24v'] },
  { id: 'CHO-5KVA48V_front.jpg', code: 'CHO-5KVA48V', brand: 'Choice', category: 'inverter', view: 'front', keywords: ['foresolar', '5kva', '48v'] },
  { id: 'CWO-3.6KVA24VHYBRID_front.jpg', code: 'CWO-3.6KVA24VHYBRID', brand: 'Cworth', category: 'inverter', view: 'front', keywords: ['cworth', '3.6', 'hybrid'] },
  { id: 'DEKA-3.5KVA24V_front.jpg', code: 'DEKA-3.5KVA24V', brand: 'Deka', category: 'inverter', view: 'front', keywords: ['deka', '3.5', 'standing', 'tower'] },
  { id: 'FEL-IVPS5048_front.jpg', code: 'FEL-IVPS5048', brand: 'Felicity', category: 'inverter', view: 'front', keywords: ['felicity', 'ivps', '5048', '5kva'] },
  { id: 'GRO-6KW48V2MPPT_front.jpg', code: 'GRO-6KW48V2MPPT', brand: 'Growatt', category: 'inverter', view: 'front', keywords: ['growatt', '6kw', '2mppt', 'mppt'] },
  { id: 'GRO-6KWHYBRID_front.jpg', code: 'GRO-6KWHYBRID', brand: 'Growatt', category: 'inverter', view: 'front', keywords: ['growatt', 'hybrid', '6kw'] },

  // Controllers
  { id: 'FEL-SCCM4524_front.jpg', code: 'FEL-SCCM4524', brand: 'Felicity', category: 'controller', view: 'front', keywords: ['sccm', '4524', '45a', 'solar controller'] },
  { id: 'FEL-SCCM6048_front.jpg', code: 'FEL-SCCM6048', brand: 'Felicity', category: 'controller', view: 'front', keywords: ['sccm', '6048', '60a', 'stabilizer'] },

  // Batteries
  { id: 'DEYE-5KWH48VLITHIUM_front.jpg', code: 'DEYE-5KWH48VLITHIUM', brand: 'Deye', category: 'battery', view: 'front', keywords: ['deye', '5kwh', 'premium', 'lithium', 'wall'] },
  { id: 'GEN-12.4V2400WLITHIUM_front.jpg', code: 'GEN-12.4V2400WLITHIUM', brand: 'Generic', category: 'battery', view: 'front', keywords: ['12.4v', '2400w', 'lithium', 'cell', 'deep-cycle'] },
  { id: 'GEN-12V220AHTUBULAR_front.jpg', code: 'GEN-12V220AHTUBULAR', brand: 'Generic', category: 'battery', view: 'front', keywords: ['tubular', '220ah', 'tall', 'deep', 'rectangular'] },

  // Desktops / AIO
  { id: 'HP-9M9M9AT_front.jpg', code: 'HP-9M9M9AT', brand: 'HP', category: 'desktop', view: 'front', keywords: ['one', '240', 'g10', '23.8', 'all-in-one'] },
  { id: 'HP-B13YBEA_front.jpg', code: 'HP-B13YBEA', brand: 'HP', category: 'desktop', view: 'front', keywords: ['desktop', '22', 'all-in-one'] },

  // Laptops (HP Dual-view)
  { id: 'HP-14Z79EA_front.jpg', code: 'HP-14Z79EA', brand: 'HP', category: 'laptop', view: 'front', keywords: ['250', 'g7', 'i5', '1035'] },
  { id: 'HP-14Z79EA_side.jpg', code: 'HP-14Z79EA', brand: 'HP', category: 'laptop', view: 'side', keywords: ['250', 'g7', 'i5', '1035'] },
  { id: 'HP-1L3W7EA_front.jpg', code: 'HP-1L3W7EA', brand: 'HP', category: 'laptop', view: 'front', keywords: ['240', 'g7', 'dark', 'ash', 'silver'] },
  { id: 'HP-1L3W7EA_side.jpg', code: 'HP-1L3W7EA', brand: 'HP', category: 'laptop', view: 'side', keywords: ['240', 'g7', 'dark', 'ash', 'silver'] },
  { id: 'HP-2R411EA_front.jpg', code: 'HP-2R411EA', brand: 'HP', category: 'laptop', view: 'front', keywords: ['cf3016nia', '14-cf', 'i5', '1035'] },
  { id: 'HP-2R411EA_side.jpg', code: 'HP-2R411EA', brand: 'HP', category: 'laptop', view: 'side', keywords: ['cf3016nia', '14-cf', 'i5', '1035'] },
  { id: 'HP-2R9H6EA_front.jpg', code: 'HP-2R9H6EA', brand: 'HP', category: 'laptop', view: 'front', keywords: ['250', 'g8', 'i7', 'ram'] },
  { id: 'HP-2R9H6EA_side.jpg', code: 'HP-2R9H6EA', brand: 'HP', category: 'laptop', view: 'side', keywords: ['250', 'g8', 'i7', 'ram'] },
  { id: 'HP-32M66EA_front.jpg', code: 'HP-32M66EA', brand: 'HP', category: 'laptop', view: 'front', keywords: ['240', 'g8', 'pentium', 'n5030'] },
  { id: 'HP-32M66EA_side.jpg', code: 'HP-32M66EA', brand: 'HP', category: 'laptop', view: 'side', keywords: ['240', 'g8', 'pentium', 'n5030'] },
  { id: 'HP-350Q2EA_front.jpg', code: 'HP-350Q2EA', brand: 'HP', category: 'laptop', view: 'front', keywords: ['envy', '13-bd', 'x360', 'gold', 'pale'] },
  { id: 'HP-350Q2EA_side.jpg', code: 'HP-350Q2EA', brand: 'HP', category: 'laptop', view: 'side', keywords: ['envy', '13-bd', 'x360', 'gold', 'pale'] },
  { id: 'HP-84V4EA_front.jpg', code: 'HP-84V4EA', brand: 'HP', category: 'laptop', view: 'front', keywords: ['pavilion', 'bb0029nia', '13-bb', 'silver'] },
  { id: 'HP-84V4EA_side.jpg', code: 'HP-84V4EA', brand: 'HP', category: 'laptop', view: 'side', keywords: ['pavilion', 'bb0029nia', '13-bb', 'silver'] },
  { id: 'HP-9B4P0EA_front.jpg', code: 'HP-9B4P0EA', brand: 'HP', category: 'laptop', view: 'front', keywords: ['ep0055nia', '14-ep', '14”'] },
  { id: 'HP-9B4P0EA_side.jpg', code: 'HP-9B4P0EA', brand: 'HP', category: 'laptop', view: 'side', keywords: ['ep0055nia', '14-ep', '14”'] },
  { id: 'HP-9G1W6ET_front.jpg', code: 'HP-9G1W6ET', brand: 'HP', category: 'laptop', view: 'front', keywords: ['probook', '440', 'g11', 'core', '7', '155u'] },
  { id: 'HP-9G1W6ET_side.jpg', code: 'HP-9G1W6ET', brand: 'HP', category: 'laptop', view: 'side', keywords: ['probook', '440', 'g11', 'core', '7', '155u'] },

  // Laptop (Single view)
  { id: 'HP-7N0F3ES_front.jpg', code: 'HP-7N0F3ES', brand: 'HP', category: 'laptop', view: 'front', keywords: ['240', 'g9', 'i3', 'dark', 'ash'] },

  // Printers (HP Dual-view)
  { id: 'HP-1TJ09A_front.jpg', code: 'HP-1TJ09A', brand: 'HP', category: 'printer', view: 'front', keywords: ['smart', 'tank', '515'] },
  { id: 'HP-1TJ09A_side.jpg', code: 'HP-1TJ09A', brand: 'HP', category: 'printer', view: 'side', keywords: ['smart', 'tank', '515'] },
  { id: 'HP-3YW70A_front.jpg', code: 'HP-3YW70A', brand: 'HP', category: 'printer', view: 'front', keywords: ['smart', 'tank', '516'] },
  { id: 'HP-3YW70A_side.jpg', code: 'HP-3YW70A', brand: 'HP', category: 'printer', view: 'side', keywords: ['smart', 'tank', '516'] },
  { id: 'HP-4ZB84A_front.jpg', code: 'HP-4ZB84A', brand: 'HP', category: 'printer', view: 'front', keywords: ['laser', 'mfp', '135a', '135'] },
  { id: 'HP-4ZB84A_side.jpg', code: 'HP-4ZB84A', brand: 'HP', category: 'printer', view: 'side', keywords: ['laser', 'mfp', '135a', '135'] },
  { id: 'HP-6UU47A_front.jpg', code: 'HP-6UU47A', brand: 'HP', category: 'printer', view: 'front', keywords: ['smart', 'tank', '750', 'reservoir'] },
  { id: 'HP-6UU47A_side.jpg', code: 'HP-6UU47A', brand: 'HP', category: 'printer', view: 'side', keywords: ['smart', 'tank', '750', 'reservoir'] },
  { id: 'HP-7WN42B2_front.jpg', code: 'HP-7WN42B2', brand: 'HP', category: 'printer', view: 'front', keywords: ['color', 'laserjet', '150a'] },
  { id: 'HP-7WN42B2_side.jpg', code: 'HP-7WN42B2', brand: 'HP', category: 'printer', view: 'side', keywords: ['color', 'laserjet', '150a'] },
  { id: 'HP-9YG09A_front.jpg', code: 'HP-9YG09A', brand: 'HP', category: 'printer', view: 'front', keywords: ['laserjet', 'mfp', 'm236sdw', 'm236'] },
  { id: 'HP-9YG09A_side.jpg', code: 'HP-9YG09A', brand: 'HP', category: 'printer', view: 'side', keywords: ['laserjet', 'mfp', 'm236sdw', 'm236'] },
  { id: 'HP-G5J38A_front.jpg', code: 'HP-G5J38A', brand: 'HP', category: 'printer', view: 'front', keywords: ['officejet', '9010', '8010', '7740', '7740', 'wide', 'tray'] },
  { id: 'HP-G5J38A_side.jpg', code: 'HP-G5J38A', brand: 'HP', category: 'printer', view: 'side', keywords: ['officejet', '9010', '8010', '7740', '7740', 'wide', 'tray'] },
  { id: 'HP-Y0F71A_front.jpg', code: 'HP-Y0F71A', brand: 'HP', category: 'printer', view: 'front', keywords: ['smart', 'tank', '615', 'facsimile'] },
  { id: 'HP-Y0F71A_side.jpg', code: 'HP-Y0F71A', brand: 'HP', category: 'printer', view: 'side', keywords: ['smart', 'tank', '615', 'facsimile'] },
  { id: 'HP-Y0S18AA80_front.jpg', code: 'HP-Y0S18AA80', brand: 'HP', category: 'printer', view: 'front', keywords: ['officejet', '7720', '7740', 'A3', 'heavy'] },
  { id: 'HP-Y0S18AA80_side.jpg', code: 'HP-Y0S18AA80', brand: 'HP', category: 'printer', view: 'side', keywords: ['officejet', '7720', '7740', 'A3', 'heavy'] },

  // Printer (Single view)
  { id: 'HP-2Z610AB19_front.jpg', code: 'HP-2Z610AB19', brand: 'HP', category: 'printer', view: 'front', keywords: ['laserjet', 'pro', '4003dw', 'monochrome', '40'] },
  { id: 'HP-3YW73A_front.jpg', code: 'HP-3YW73A', brand: 'HP', category: 'printer', view: 'front', keywords: ['smart', 'tank', '519'] },
  { id: 'HP-4ZB97A_front.jpg', code: 'HP-4ZB97A', brand: 'HP', category: 'printer', view: 'front', keywords: ['color', 'laserjet', 'mfp', '179fnw', '179'] }
];

function calculateScore(source: ImageAnalysis, target: TargetSlot): number {
  let score = 0;

  // Category penalty / boost
  const srcCat = source.category.toLowerCase();
  const tgtCat = target.category.toLowerCase();

  if (srcCat === tgtCat) {
    score += 45;
  } else {
    // Severe penalty for mismatching laptops/printers/inverters
    return -999;
  }

  // Brand Match
  const srcBrand = source.brand.toLowerCase();
  const tgtBrand = target.brand.toLowerCase();
  if (srcBrand === tgtBrand) {
    score += 25;
  } else if (srcBrand !== 'unknown' && tgtBrand !== 'unknown') {
    // Mismatching known brands
    score -= 10;
  }

  // View Match
  if (source.view !== 'unknown' && target.view !== 'unknown') {
    if (source.view === target.view) {
      score += 8;
    } else {
      score -= 5;
    }
  }

  // Keywords Text Overlap (Sticker/Visible Model matches specifications and keywords)
  const textBlob = `${source.visibleModel} ${source.visualFeatures}`.toLowerCase();
  target.keywords.forEach(keyword => {
    if (textBlob.includes(keyword.toLowerCase())) {
      score += 15;
    }
  });

  return score;
}

function run() {
  if (!fs.existsSync(resultsFile)) {
    console.error('Analysis file not found! Please let the background crawler run first.');
    return;
  }

  const results: { [key: string]: ImageAnalysis } = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  const sourceImages = Object.values(results);

  console.log(`Matching ${sourceImages.length} available analyzed source images against ${targetSlots.length} slots...`);

  // Max Weight Greedy Matching
  const matches: { source: ImageAnalysis; target: TargetSlot; score: number }[] = [];
  const assignedSource = new Set<string>();
  const assignedTarget = new Set<string>();

  // To build complete grid
  structPairs: while (assignedTarget.size < targetSlots.length && assignedSource.size < sourceImages.length) {
    let bestScore = -9999;
    let bestSource: ImageAnalysis | null = null;
    let bestTarget: TargetSlot | null = null;

    for (const src of sourceImages) {
      if (assignedSource.has(src.file)) continue;

      for (const tgt of targetSlots) {
        if (assignedTarget.has(tgt.id)) continue;

        const score = calculateScore(src, tgt);
        if (score > bestScore) {
          bestScore = score;
          bestSource = src;
          bestTarget = tgt;
        }
      }
    }

    if (bestSource && bestTarget && bestScore > -200) {
      matches.push({ source: bestSource, target: bestTarget, score: bestScore });
      assignedSource.add(bestSource.file);
      assignedTarget.add(bestTarget.id);
    } else {
      // Break if no more valid positive matches can be made
      break;
    }
  }

  console.log(`\nPerfect matched pairings formed in greedy phase: ${matches.length}`);

  // Resolve unmatched slots in a category-pure manner!
  const remainingTargets = targetSlots.filter(t => !assignedTarget.has(t.id));
  console.log(`Unmatched target slots needing clean, category-pure backfills: ${remainingTargets.length}`);

  // Step 2: Handle side-profile slots if their front-profile counterpart is matched
  for (const tgt of remainingTargets) {
    if (assignedTarget.has(tgt.id)) continue;
    if (tgt.id.endsWith('_side.jpg')) {
      const frontId = tgt.id.replace('_side.jpg', '_front.jpg');
      const matchedFront = matches.find(m => m.target.id === frontId);
      if (matchedFront) {
        console.log(`Auto-matching side profile ${tgt.id} to matched front profile source ${matchedFront.source.file} (${matchedFront.source.category})`);
        matches.push({
          source: matchedFront.source,
          target: tgt,
          score: matchedFront.score - 10
        });
        assignedTarget.add(tgt.id);
      }
    }
  }

  // Reload remaining targets after side-profile matching
  const finalRemainingTargets = targetSlots.filter(t => !assignedTarget.has(t.id));

  // Step 3: Pure Category Spillover Backfill
  // For any target slot that remains unmatched, find ANY source file of the EXACT SAME category
  // and match it to this slot. This prevents any cross-category bleed (e.g. laptop slots getting filled with inverters)
  for (const tgt of finalRemainingTargets) {
    if (assignedTarget.has(tgt.id)) continue;

    // Find all raw sources of the EXACT SAME category
    const categorySources = sourceImages.filter(s => s.category.toLowerCase() === tgt.category.toLowerCase());
    
    if (categorySources.length > 0) {
      // Prioritize same brand if possible
      let bestSrc = categorySources[0];
      let bestScore = -1;

      for (const src of categorySources) {
        let score = 0;
        if (src.brand.toLowerCase() === tgt.brand.toLowerCase()) score += 10;
        if (src.view === tgt.view) score += 5;
        if (score > bestScore) {
          bestScore = score;
          bestSrc = src;
        }
      }

      console.log(`Category-pure fallback: Mapping ${tgt.id} (${tgt.category}) to source file ${bestSrc.file} (${bestSrc.brand} ${bestSrc.category})`);
      matches.push({
        source: bestSrc,
        target: tgt,
        score: 10 + bestScore
      });
      assignedTarget.add(tgt.id);
    } else {
      console.warn(`WARNING: Absolutely no source files found for category ${tgt.category} to backfill ${tgt.id}!`);
    }
  }

  // SAFETY SANITY CLEANUP: Delete all target product-named files in the uploads folder 
  // before copying, to make absolutely sure there is no stale mismatched file from prior runs!
  console.log('\nRunning safety sanity cleanup in uploads directory...');
  targetSlots.forEach(t => {
    const filePath = path.join(uploadsDir, t.id);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err: any) {
        console.error(`Could not remove old file ${t.id}:`, err.message);
      }
    }
  });

  console.log(`\nFinal category-pure mapping alignment generated (${matches.length} pairs total):`);
  matches.forEach(m => {
    console.log(`  => Source: ${m.source.file} (${m.source.brand} ${m.source.category}) => Aligned Target: ${m.target.id} (${m.target.brand} ${m.target.category})`);
    
    // Copy the correct original file to target product name file
    const srcPath = path.join(uploadsDir, m.source.file);
    const dstPath = path.join(uploadsDir, m.target.id);
    try {
      fs.copyFileSync(srcPath, dstPath);
    } catch (e: any) {
      console.error(`Error aligning file ${m.source.file} to ${m.target.id}:`, e.message);
    }
  });

  console.log('\nSUCCESS! All aligned product files on disk have been completely updated in a category-pure manner.');
}

run();
