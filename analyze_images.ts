import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

const uploadsDir = 'uploads';
const resultsFile = 'image_analysis_results.json';

interface ImageAnalysis {
  file: string;
  brand: string;
  category: 'laptop' | 'printer' | 'desktop' | 'inverter' | 'battery' | 'controller' | 'stabilizer' | 'ups' | 'unknown';
  visibleModel: string;
  visualFeatures: string;
  view: 'front' | 'side' | 'unknown';
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function analyzeFile(file: string): Promise<ImageAnalysis> {
  const imgPath = path.join(uploadsDir, file);

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const data = fs.readFileSync(imgPath).toString('base64');
      const prompt = `
      You are an expert physical warehouse asset auditor. Your job is to classify this image of hardware inventory.
      Analyze the hardware shown in the image and extract the following details. Be extremely accurate with category matching.
      
      Inventory Guide:
      1. Laptops ("laptop"): Look for a flip notebook body (screen, keyboard, trackpad, metallic lid with a central HP logo).
      2. Printers ("printer"): Boxy plastic printing machines. Look for paper drawers, front output trays, flatbed scanner glass, text like "Smart Tank 515", "LaserJet M111a", "OfficeJet", etc.
      3. All-in-One Computer ("desktop"): Thin bezel display screen standing on a pedestal stand, often shown with a separate keyboard and mouse.
      4. Inverters ("inverter"): Look for power boxes. Growatt (often white rounded panel with sleek screen), Felicity (white/blue box mounted on a wall), Choice or Foresolar models (rugged power inverter design).
      5. Solar Charge Controllers ("controller"): Small wall mounts with LCD panel, buttons, and multiple wire inputs.
      6. Heavy Batteries ("battery"): Standard large batteries with terminal caps (Tubular battery) or sleek wall mount white panels with status lights (Deye lithium battery).
      7. UPS/Stabilizers ("ups" / "stabilizer"): Heavy black casings with 'Blue Gate' stabilizer logos or Evergood / Eco Gate compact models.
      
      Provide a strict JSON output matching this schema:
      {
        "brand": "The visible brand name, e.g. HP, Growatt, Felicity, Choice, Blue Gate, Evergood, Deka, Deye, or Generic",
        "category": "laptop" | "printer" | "desktop" | "inverter" | "battery" | "controller" | "stabilizer" | "ups" | "unknown",
        "visibleModel": "Any specific model text visible on labels, stickers, screens, or casing",
        "visualFeatures": "1-sentence physical description of the hardware style seen in the image",
        "view": "front" | "side" | "unknown"
      }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          { inlineData: { data, mimeType: 'image/jpeg' } },
          { text: prompt }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      let parsed = JSON.parse(response.text.trim());
      if (Array.isArray(parsed)) {
        parsed = parsed[0] || {};
      }

      return {
        file,
        brand: parsed.brand || 'unknown',
        category: parsed.category || 'unknown',
        visibleModel: parsed.visibleModel || '',
        visualFeatures: parsed.visualFeatures || '',
        view: parsed.view || 'unknown'
      };
    } catch (err: any) {
      const errMsg = err.message || JSON.stringify(err);
      console.warn(`[File ${file}] Attempt ${attempt} failed: ${errMsg.slice(0, 180)}...`);
      if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        console.log('RESOURCE OUT OF QUOTA. Sleeping 32s before retry...');
        await sleep(32000);
      } else {
        await sleep(5000);
      }
    }
  }

  throw new Error(`Failed to analyze file ${file} after 5 attempts`);
}

async function run() {
  const files = fs.readdirSync(uploadsDir).filter(f => f.startsWith('178') && f.endsWith('.jpg'));
  
  let results: { [key: string]: ImageAnalysis } = {};
  if (fs.existsSync(resultsFile)) {
    results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  }

  // Remove any entries that got parsed as unknown/empty
  for (const [key, val] of Object.entries(results)) {
    if (val.brand === 'unknown' || val.category === 'unknown' || val.visibleModel === 'failed') {
      delete results[key];
    }
  }

  const remainingFiles = files.filter(f => !results[f]);
  console.log(`=== BACKGROUND ANALYZER STARTING (MIGRATED TO GEMINI-3.1-FLASH-LITE) ===`);
  console.log(`Total source files: ${files.length}`);
  console.log(`Already analyzed successfully: ${Object.keys(results).length}`);
  console.log(`Remaining to process: ${remainingFiles.length}`);

  if (remainingFiles.length === 0) {
    console.log('All files are already successfully analyzed!');
    process.exit(0);
  }

  for (let idx = 0; idx < remainingFiles.length; idx++) {
    const file = remainingFiles[idx];
    console.log(`[File ${idx + 1}/${remainingFiles.length}] Processing ${file}...`);
    try {
      const result = await analyzeFile(file);
      results[file] = result;
      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
      console.log(`  => SUCCESS: File=${file} Brand=${result.brand}, Cat=${result.category}, Model="${result.visibleModel}", View=${result.view}`);
      
      // Strict 5s delay to stay below 15 RPM
      await sleep(5000);
    } catch (err: any) {
      console.error(`  => FAILED permanently for ${file}:`, err.message || err);
    }
  }

  const doneCount = Object.keys(results).length;
  console.log(`Background run finished. Total successfully analyzed: ${doneCount}/${files.length}`);
}

run();
