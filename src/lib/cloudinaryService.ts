/**
 * Helper to upload image either to Cloudinary (if configured) or fall back to the local Express server.
 * Both base64 data URLs and binary blobs are supported.
 */
export async function uploadImageToCDNOrLocal(
  filename: string,
  base64Data: string,
  cloudinaryConfig?: { cloudName: string; uploadPreset: string }
): Promise<string> {
  const isCloudinaryActive = !!(cloudinaryConfig?.cloudName && cloudinaryConfig?.uploadPreset);

  if (isCloudinaryActive) {
    try {
      console.log(`[Cloudinary] Starting CDN upload to cloud "${cloudinaryConfig.cloudName}" for ${filename}...`);
      
      // Ensure the payload is a valid full data URL as Cloudinary accepts it directly
      let filePayload = base64Data;
      if (!filePayload.startsWith('data:')) {
        filePayload = `data:image/jpeg;base64,${filePayload}`;
      }

      const formData = new FormData();
      formData.append('file', filePayload);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);
      
      // Generate a clean safe public ID
      const safeBase = filename.split('.')[0] || 'photo';
      const cleanSafeBase = safeBase.replace(/[^a-zA-Z0-9_\-]/g, '_');
      formData.append('public_id', `hitech_${Date.now()}_${cleanSafeBase}`);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
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
      console.error("[Cloudinary] Upload failed. Falling back to local Express upload. Error details: ", error);
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
