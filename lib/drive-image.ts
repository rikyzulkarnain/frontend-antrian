/**
 * driveImageUrl membuat URL gambar Google Drive yang boleh dipakai tag <img>
 * dari domain lain.
 *
 * `drive.google.com` sendiri tidak bisa dipakai: berkasnya dikirim dengan
 * `Cross-Origin-Resource-Policy: same-site`, jadi browser menolaknya begitu
 * dimuat dari domain aplikasi. Host `lh3.googleusercontent.com` menyajikan
 * berkas yang sama tanpa header itu, sekaligus bisa memberi versi yang sudah
 * diperkecil lewat penanda `=w<lebar>`.
 */
export function driveImageUrl(fileId: string, width = 1600): string {
  return `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w${width}`;
}
