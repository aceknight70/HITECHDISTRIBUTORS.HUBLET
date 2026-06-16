/**
 * Helper to upload image either to Cloudinary (if configured) or fall back to the local Express server.
 * Both base64 data URLs and binary blobs are supported.
 */
export async function uploadImageToCDNOrLocal(
  filename: string,
  base64Data: string,
  cloudinaryConfig?: { cloudName: string; uploadPreset: string }
): Promise<string> {
  const cloudName = cloudinaryConfig?.cloudName?.trim() || '';
  const uploadPreset = cloudinaryConfig?.uploadPreset?.trim() || '';

  const isPlaceholder = (val: string) => {
    if (!val) return true;
    const lower = val.toLowerCase();
    return (
      lower.includes('placeholder') ||
      lower.includes('your-') ||
      lower.includes('your_') ||
      lower.includes('<') ||
      lower.includes('>') ||
      lower === 'test' ||
      lower === 'null' ||
      lower === 'undefined'
    );
  };

  const isCloudinaryActive = !!(
    cloudName &&
    uploadPreset &&
    !isPlaceholder(cloudName) &&
    !isPlaceholder(uploadPreset)
  );

  if (isCloudinaryActive) {
    try {
      console.log(`[Cloudinary] Starting CDN upload to cloud "${cloudName}" for ${filename}...`);
      
      // Ensure the payload is a valid full data URL as Cloudinary accepts it directly
      let filePayload = base64Data;
      if (!filePayload.startsWith('data:')) {
        filePayload = `data:image/jpeg;base64,${filePayload}`;
      }

      const formData = new FormData();
      formData.append('file', filePayload);
      formData.append('upload_preset', uploadPreset);
      
      // Generate a clean safe public ID
      const safeBase = filename.split('.')[0] || 'photo';
      const cleanSafeBase = safeBase.replace(/[^a-zA-Z0-9_\-]/g, '_');
      formData.append('public_id', `hitech_${Date.now()}_${cleanSafeBase}`);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudinary server returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (data.secure_url) {
        console.log(`[Cloudinary] Upload successful! URL: ${data.secure_url}`);
        return data.secure_url;
      }
      throw new Error("Cloudinary response did not contain a 'secure_url'.");
    } catch (error: any) {
      console.warn("[Cloudinary] Upload fallback to local storage initiated. Details: ", error?.message || error);
    }
  }

  // Local static server /api/upload fallback
  console.log(`[Upload Fallback] Uploading ${filename} to local container server...`);
  const uploadRes = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, base64Data })
  });

  if (!uploadRes.ok) {
    throw new Error(`Local Express upload failed with status ${uploadRes.status}`);
  }

  const uploadData = await uploadRes.json();
  return uploadData.url;
}
