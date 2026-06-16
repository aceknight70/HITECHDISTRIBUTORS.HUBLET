/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExtractedProduct {
  productCode: string;
  name: string;
  price: string;
  specs?: string;
  description?: string;
}

export interface ImageMapping {
  imageFilename: string;
  productCode: string;
}

export interface MatchDiff {
  photoId: string;
  url: string;
  label: string;
  originalCode: string;
  matchedCode: string;
  originalPrice: string;
  matchedPrice: string;
  status: 'new_match' | 'price_updated' | 'metadata_synchronized' | 'no_change' | 'not_found';
  changes: string[];
}

/**
 * Sends a base64 encoded PDF file to the backend to extract structured JSON data via Gemini 3.5 Flash.
 */
export async function parsePdfFile(
  base64Data: string,
  filename: string,
  type: 'product' | 'mapping'
): Promise<any> {
  const res = await fetch('/api/pdf/parse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ base64Data, filename, type })
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    let parsedErr = 'Failed to process PDF';
    try {
      const json = JSON.parse(errorText);
      parsedErr = json.error || parsedErr;
    } catch {
      parsedErr = errorText || parsedErr;
    }
    throw new Error(parsedErr);
  }

  return res.json();
}

/**
 * Perform intelligence-driven matching on the frontend.
 * Evaluates the existing gallery photos against extracted products and mapping files.
 * Returns the final mapped gallery objects, together with a detailed diff log for transparency.
 */
export function runPdfAutoMatcher(
  galleryPhotos: any[],
  extractedProducts: ExtractedProduct[],
  imageMappings: ImageMapping[]
): {
  updatedPhotos: any[];
  diffs: MatchDiff[];
} {
  const diffs: MatchDiff[] = [];
  
  // Clean product lists and mappings for easy lookup (case-insensitive)
  const productMap = new Map<string, ExtractedProduct>();
  extractedProducts.forEach(p => {
    if (p.productCode) {
      productMap.set(p.productCode.trim().toLowerCase(), p);
    }
  });

  const fileMappingMap = new Map<string, string>();
  imageMappings.forEach(m => {
    if (m.imageFilename && m.productCode) {
      // Key can be base filename, e.g. "HP-4ZB97A_front.jpg" or lowercase version
      fileMappingMap.set(m.imageFilename.trim().toLowerCase(), m.productCode.trim());
    }
  });

  const updatedPhotos = galleryPhotos.map((photo) => {
    const photoId = String(photo.id);
    const photoUrl = photo.url || '';
    const originalCode = photo.productCode || '';
    const originalPrice = photo.price || '';
    const originalLabel = photo.label || '';
    const originalSub = photo.sub || '';

    // Get filename from url
    const urlParts = photoUrl.split('/');
    const urlFilename = urlParts[urlParts.length - 1].toLowerCase();

    // 1. Try to fetch product code from mapping PDF using direct match or partial string matching
    let matchedCode = '';
    
    // Exact file name lookup (e.g., "hp-4zb97a_front.jpg")
    if (fileMappingMap.has(urlFilename)) {
      matchedCode = fileMappingMap.get(urlFilename) || '';
    } else {
      // Partial sub-string lookup in the mapping keys
      for (const [keyFilename, code] of fileMappingMap.entries()) {
        if (urlFilename.includes(keyFilename) || keyFilename.includes(urlFilename)) {
          matchedCode = code;
          break;
        }
      }
    }

    // 2. Fallback heuristic: Extract product code from the filename of photo directly!
    // E.g. "/uploads/GEN-12V220AHTUBULAR_front.jpg" matches code "GEN-12V220AHTUBULAR"
    if (!matchedCode) {
      const codeMatches = photoUrl.match(/\/uploads\/([A-Za-z0-9.\-_]+?)(?:_front|_side|_back)?\.(?:jpg|jpeg|png|gif|webp)/i);
      if (codeMatches && codeMatches[1]) {
        const potentialCleanCode = codeMatches[1].trim();
        // Check if this extracted code exists in either our database or extracted catalog products
        const normalized = potentialCleanCode.toLowerCase();
        if (productMap.has(normalized)) {
          matchedCode = potentialCleanCode;
        }
      }
    }

    // Fall back to original code if nothing better found
    const targetCode = matchedCode || originalCode;
    const finalCode = targetCode.trim();

    // 3. Find descriptive details for this code from extracted products PDF catalog
    const matchingProduct = finalCode ? productMap.get(finalCode.toLowerCase()) : null;

    let finalLabel = originalLabel;
    let finalSub = originalSub;
    let finalPrice = originalPrice;
    const changes: string[] = [];
    let status: MatchDiff['status'] = 'no_change';

    if (finalCode && originalCode !== finalCode) {
      changes.push(`Assigned Product Code: [${finalCode}] (original: "${originalCode || 'None'}")`);
      status = 'new_match';
    }

    if (matchingProduct) {
      if (matchingProduct.name && originalLabel !== matchingProduct.name) {
        finalLabel = matchingProduct.name;
        changes.push(`Synchronized name/label to match catalog: "${matchingProduct.name}"`);
        if (status === 'no_change') status = 'metadata_synchronized';
      }
      if (matchingProduct.specs && originalSub !== matchingProduct.specs) {
        finalSub = matchingProduct.specs;
        changes.push(`Updated specs/details: "${matchingProduct.specs}"`);
        if (status === 'no_change') status = 'metadata_synchronized';
      }
      if (matchingProduct.price && originalPrice !== matchingProduct.price) {
        finalPrice = matchingProduct.price;
        changes.push(`Price auto-aligned: ${matchingProduct.price} (previous: "${originalPrice || 'None'}")`);
        status = 'price_updated';
      }
    } else if (finalCode) {
      // Mapped a code but product specs not found in the parsed product catalog PDF yet
      if (originalCode !== finalCode) {
        changes.push(`Matched code [${finalCode}] but specs not available in catalog PDF`);
      }
    } else {
      status = 'not_found';
    }

    if (changes.length > 0) {
      diffs.push({
        photoId,
        url: photoUrl,
        label: finalLabel,
        originalCode,
        matchedCode: finalCode,
        originalPrice,
        matchedPrice: finalPrice,
        status,
        changes
      });
    }

    return {
      ...photo,
      productCode: finalCode,
      price: finalPrice,
      label: finalLabel,
      sub: finalSub,
      isCustom: true // Bind customized images correctly
    };
  });

  return { updatedPhotos, diffs };
}
