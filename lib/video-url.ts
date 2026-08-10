/**
 * Normalisasi URL video ke bentuk yang bisa langsung diputar tag <video>.
 *
 * Dipakai saat render (bukan saat simpan) supaya baris lama di database ikut
 * ternormalisasi tanpa migrasi.
 */

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * youtubeVideoId mengambil id video dari bentuk tautan YouTube apa pun
 * (youtu.be/ID, watch?v=ID, /embed/ID, /shorts/ID, /live/ID) atau dari id
 * mentah. Mengembalikan null untuk URL non-YouTube.
 *
 * YouTube dipakai sebagai host video karena penyedia berkas biasa (Google
 * Drive) mengirim header `Cross-Origin-Resource-Policy: same-site` yang membuat
 * browser menolak memakainya sebagai sumber tag <video> dari domain lain.
 */
export function youtubeVideoId(url: string): string | null {
  const raw = url.trim();
  if (YOUTUBE_ID.test(raw)) return raw;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0] ?? '';
    return YOUTUBE_ID.test(id) ? id : null;
  }
  if (host !== 'youtube.com' && host !== 'm.youtube.com' && host !== 'youtube-nocookie.com') {
    return null;
  }
  const v = parsed.searchParams.get('v');
  if (v && YOUTUBE_ID.test(v)) return v;
  const m = /^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/.exec(parsed.pathname);
  return m ? m[1] : null;
}

const DRIVE_HOSTS = /^https?:\/\/(?:drive|docs|drive\.usercontent)\.google\.com\//i;
// Menangkap id dari /file/d/<id>/view, /open?id=<id>, /uc?id=<id>, /d/<id>.
const DRIVE_ID = /(?:\/file\/d\/|\/d\/|[?&]id=)([A-Za-z0-9_-]{10,})/;

/**
 * driveFileId mengambil file id dari berbagai bentuk tautan Google Drive.
 * Mengembalikan null untuk URL non-Drive.
 */
export function driveFileId(url: string): string | null {
  if (!DRIVE_HOSTS.test(url)) return null;
  return DRIVE_ID.exec(url)?.[1] ?? null;
}

/**
 * driveStreamUrl membentuk tautan unduh langsung dari sebuah file id.
 *
 * `confirm=t` melewati halaman peringatan pemindaian virus yang muncul untuk
 * berkas besar — tanpa itu Drive mengirim HTML, bukan video, dan <video> gagal
 * memuat. File tetap harus dibagikan sebagai "Anyone with the link".
 */
export function driveStreamUrl(fileId: string): string {
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
}

/**
 * deliveryVideoUrl menyiapkan URL sumber untuk tag <video>.
 *
 * - Tautan Google Drive (bentuk apa pun) diubah jadi tautan unduh langsung.
 * - URL Cloudinary disisipi transformasi `q_auto`; tanpa itu Cloudinary
 *   mengirim berkas sumber apa adanya dan layar yang memutar 24/7 menghabiskan
 *   kuota bandwidth bulanan dengan cepat.
 * - URL lain dibiarkan apa adanya.
 */
export function deliveryVideoUrl(url: string): string {
  const fileId = driveFileId(url);
  if (fileId) return driveStreamUrl(fileId);

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
