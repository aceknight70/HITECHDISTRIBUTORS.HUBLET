import { upload } from '@vercel/blob/client';

export async function uploadFile(filename: string, base64Data: string): Promise<string> {
  try {
    console.log(`[Upload] Starting upload for ${filename}...`);

    let cleanBase64 = base64Data;
    if (base64Data.includes('base64,')) {
      cleanBase64 = base64Data.split('base64,')[1];
    }
    
    // Extract mime type if available
    let mimeType = 'image/jpeg';
    const mimeMatch = base64Data.match(/data:(.*?);base64,/);
    if (mimeMatch && mimeMatch[1]) {
      mimeType = mimeMatch[1];
    }

    // Convert base64 to File object
    const raw = window.atob(cleanBase64);
    const rawLength = raw.length;
    const array = new Uint8Array(new ArrayBuffer(rawLength));
    for (let i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    const blob = new Blob([array], { type: mimeType });
    const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const finalFilename = `${Date.now()}_${safeFilename}`;
    const file = new File([blob], finalFilename, { type: mimeType });

    const newBlob = await upload(finalFilename, file, {
      access: 'public',
      handleUploadUrl: '/api/upload/vercel-blob',
    });

    console.log(`[Upload] Success! URL: ${newBlob.url}`);
    return newBlob.url;
  } catch (error: any) {
    console.error("[Upload] Error uploading file:", error?.message || error);
    
    let diagnosticMsg = error?.message || String(error);
    try {
      // Query the token endpoint with a dummy token generation request to extract precise backend setup diagnostic messages
      const dryRunRes = await fetch('/api/upload/vercel-blob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'blob.generate-token', 
          payload: { pathname: 'test.jpg', callbackUrl: 'test' } 
        })
      });
      if (!dryRunRes.ok) {
        const dryRunData = await dryRunRes.json();
        if (dryRunData && dryRunData.error) {
          diagnosticMsg = dryRunData.error;
        }
      }
    } catch (e) {
      console.warn("Could not retrieve precise server-side diagnostic:", e);
    }

    alert(`⚠️ Upload Alert:\n\nFailed to upload file.\n\nTechnical details: ${diagnosticMsg}`);
    throw error;
  }
}
