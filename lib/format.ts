// Indonesian date/time formatters — port of design_frontend/store.jsx helpers.
const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function fmtTime(d: Date | number): string {
  const x = new Date(d);
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
}

export function fmtTimeSec(d: Date | number): string {
  const x = new Date(d);
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}:${String(x.getSeconds()).padStart(2, '0')}`;
}

export function fmtDate(d: Date | number): string {
  const x = new Date(d);
  return `${dayNames[x.getDay()]}, ${x.getDate()} ${monthNames[x.getMonth()]} ${x.getFullYear()}`;
}
