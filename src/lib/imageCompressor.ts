/**
 * Client-side image compression tool.
 * Reduces the width/height of uploaded images (to a maximum dimension like 800px)
 * and outputs a lightweight JPEG base64 Data URL (typically 50-150KB) that is
 * small enough to be persistently stored directly in Firestore (1MB max document limit).
 */
export async function compressImage(dataUrl: string, maxDimension = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    // If not in browser or invalid dataUrl, resolve immediately
    if (typeof window === 'undefined' || !dataUrl || !dataUrl.startsWith('data:')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Only resize if image exceeds max dimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw white background (especially helpful for transparent PNGs)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        try {
          // Output compressed JPEG
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (err) {
          console.error('Error extracting compressed canvas data: ', err);
          resolve(dataUrl); // Fallback to original
        }
      } else {
        resolve(dataUrl); // Fallback if 2d context is unavailable
      }
    };

    img.onerror = () => {
      console.warn('Failed to load image for canvas compression, returning original payload.');
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}
