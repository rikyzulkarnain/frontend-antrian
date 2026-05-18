import { toast } from '@heroui/react';
import { ApiError } from './api';

const ERROR_MESSAGES: Record<string, string> = {
  QUEUE_EMPTY: 'Antrian kosong untuk loket ini.',
  QUEUE_NOT_FOUND: 'Antrian tidak ditemukan.',
  QUEUE_ALREADY_CALLED: 'Antrian sudah dipanggil.',
  INVALID_STATUS: 'Status antrian tidak sesuai.',
  UNAUTHORIZED: 'Sesi berakhir. Silakan masuk kembali.',
  FORBIDDEN: 'Anda tidak memiliki akses untuk aksi ini.',
  VALIDATION_ERROR: 'Data yang dikirim tidak valid.',
  CONFLICT: 'Aksi tidak dapat dilakukan saat ini.',
};

export function toastError(err: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): void {
  if (err instanceof ApiError) {
    const msg = ERROR_MESSAGES[err.code] ?? err.message ?? fallback;
    toast.danger(msg);
    return;
  }
  if (err instanceof Error) {
    toast.danger(err.message || fallback);
    return;
  }
  toast.danger(fallback);
}

export function toastSuccess(message: string): void {
  toast.success(message);
}

export function toastInfo(message: string): void {
  toast.info(message);
}

export { toast };
