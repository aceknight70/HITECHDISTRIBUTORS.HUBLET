export async function uploadFile(filename: string, base64Data: string): Promise<string> {
  try {
    console.log(`[Upload] Starting upload for ${filename} via unified backend...`);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename, base64Data }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Server returned status ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) errorMessage = errorData.error;
      } catch (e) {
        errorMessage = `Status ${response.status} - ${errorText.substring(0, 100)}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.url) {
      throw new Error("No URL returned from server upload endpoint");
    }

    console.log(`[Upload] Success! URL: ${data.url.substring(0, 60)}...`);
    return data.url;
  } catch (error: any) {
    console.error("[Upload] Error uploading file:", error?.message || error);
    alert(`⚠️ Upload Alert:\n\nFailed to upload file.\n\nTechnical details: ${error?.message || error}`);
    throw error;
  }
}

