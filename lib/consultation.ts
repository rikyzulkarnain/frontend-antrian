// Layanan Konsultasi: pengunjung memindai QR di kiosk, mengisi formulir di HP,
// lalu diteruskan ke WhatsApp call center dengan pesan yang sudah terformat.
// Alur ini sengaja tidak menerbitkan nomor antrian — konsultasi ditangani call
// center, bukan loket, jadi tidak ada panggilan ke backend queue di sini.
import { CALL_CENTER_WA } from './constants';

export interface ConsultationPayload {
  refId: string;
  name: string;
  phone: string;
  org: string;
  topic: string;
  purpose: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * ID Permohonan pendek yang dipakai pengunjung dan call center sebagai acuan,
 * mis. KSL-20260928-4F2A. Dibuat di kiosk supaya ID yang sama tampil di layar
 * kiosk dan di HP pengunjung (ikut dibawa lewat query string pada QR).
 */
export function makeConsultationId(now: Date = new Date()): string {
  const day = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const buf = new Uint8Array(2);
  crypto.getRandomValues(buf);
  const rand = Array.from(buf, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `KSL-${day}-${rand}`;
}

/** Teks WhatsApp yang dikirim pengunjung ke call center. */
export function buildConsultationMessage(p: ConsultationPayload): string {
  const topic = (p.topic.trim() || 'konsultasi').toLowerCase();
  return [
    `Halo Call Center BBPJN Sumsel, saya ingin menanyakan informasi terkait layanan ${topic}.`,
    '',
    `ID Permohonan : ${p.refId}`,
    `Nama : ${p.name.trim()}`,
    `Instansi/Asal : ${p.org.trim() || '-'}`,
    `No. HP : ${p.phone.trim()}`,
    `Keperluan : ${p.purpose.trim()}`,
    '',
    'Mohon informasinya. Terima kasih.',
  ].join('\n');
}

export function buildConsultationWaUrl(p: ConsultationPayload): string {
  const text = encodeURIComponent(buildConsultationMessage(p));
  return `https://wa.me/${CALL_CENTER_WA.phone}?text=${text}`;
}
