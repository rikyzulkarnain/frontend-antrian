import type { UploadSignature } from './api/video';

/**
 * deliveryVideoUrl menyisipkan transformasi `q_auto` ke URL delivery
 * Cloudinary. Tanpa itu Cloudinary mengirim berkas sumber apa adanya — layar
 * Display yang memutar 24/7 menghabiskan kuota bandwidth bulanan dengan cepat,
 * dan kuota yang jebol membuat seluruh cloud dinonaktifkan (semua aset balas
 * HTTP 401 "cloud_name ... is disabled").
 *
 * No-op untuk URL non-Cloudinary atau URL yang sudah membawa transformasi.
 */
export function deliveryVideoUrl(url: string): string {
  const marker = '/video/upload/';
  const at = url.indexOf(marker);
  if (!url.includes('res.cloudinary.com') || at === -1) return url;
  const head = url.slice(0, at + marker.length);
  const rest = url.slice(at + marker.length);
  // Segmen transformasi selalu berbentuk `<kode>_<nilai>` (q_auto, f_auto,
  // w_1280); segmen versi berbentuk `v1234...` tanpa underscore.
  const firstSegment = rest.split('/')[0] ?? '';
  if (/^[a-z]{1,3}_/.test(firstSegment)) return url;
  return `${head}q_auto/${rest}`;
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  duration?: number;
  bytes?: number;
  format?: string;
  width?: number;
  height?: number;
}

export async function uploadToCloudinary(
  file: File,
  signature: UploadSignature,
  onProgress?: (pct: number) => void,
): Promise<CloudinaryUploadResult> {
  const url = `https://api.cloudinary.com/v1_1/${signature.cloud_name}/video/upload`;
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signature.api_key);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  if (signature.folder) form.append('folder', signature.folder);
  if (signature.upload_preset) form.append('upload_preset', signature.upload_preset);

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) onProgress((e.loaded / e.total) * 100);
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResult);
        } catch (err) {
          reject(new Error(`Cloudinary: invalid JSON response (${(err as Error).message})`));
        }
      } else {
        reject(new Error(`Cloudinary upload gagal (HTTP ${xhr.status})`));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Cloudinary upload error')));
    xhr.addEventListener('abort', () => reject(new Error('Cloudinary upload dibatalkan')));
    xhr.send(form);
  });
}
