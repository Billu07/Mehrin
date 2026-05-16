const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export const isCloudinaryUploadEnabled = Boolean(cloudName && uploadPreset);

export async function uploadToCloudinary(file: File): Promise<string> {
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary is not configured.");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  form.append("resource_type", "auto");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error("Cloudinary upload failed.");
  }

  const payload = (await response.json()) as { secure_url?: string };
  if (!payload.secure_url) {
    throw new Error("Uploaded asset URL is missing.");
  }

  return payload.secure_url;
}
