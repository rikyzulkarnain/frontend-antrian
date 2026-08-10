'use client';
import { useEffect, useState } from 'react';
import { queueApi } from '@/lib/api/queue';
import { useQueueEvents } from './useQueueEvents';
import type { QueueItem } from '@/types/queue';

/**
 * Antrian terakhir yang selesai dilayani. Dipakai layar Display sebagai isi
 * kartu utama saat tidak ada antrian aktif, supaya papan tidak kosong dan
 * pengunjung tahu nomor sebelumnya sudah sampai mana.
 *
 * Diambil ulang setiap ada tiket yang selesai/dilewati; tidak ada polling
 * berkala karena nilainya hanya berubah pada peristiwa itu.
 */
export function useLastQueue(): QueueItem | null {
  const [last, setLast] = useState<QueueItem | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      queueApi
        .last()
        .then((q) => {
          if (alive) setLast(q);
        })
        .catch(() => undefined);
    load();
    return () => {
      alive = false;
    };
  }, []);

  useQueueEvents({
    onCompleted: setLast,
    onSkipped: setLast,
  });

  return last;
}
