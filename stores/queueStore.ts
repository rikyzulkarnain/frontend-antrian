import { create } from 'zustand';
import type { QueueItem } from '@/types/queue';

interface QueueState {
  queues: QueueItem[];
  currentByCounter: Record<number, QueueItem | null>;

  setQueues: (queues: QueueItem[]) => void;
  upsertQueue: (item: QueueItem) => void;
  removeQueue: (id: string) => void;
  setCurrent: (counterId: number, item: QueueItem | null) => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  queues: [],
  currentByCounter: {},

  setQueues: (queues) => set({ queues }),

  upsertQueue: (item) =>
    set((state) => ({
      queues: state.queues.some((q) => q.id === item.id)
        ? state.queues.map((q) => (q.id === item.id ? item : q))
        : [...state.queues, item],
    })),

  removeQueue: (id) =>
    set((state) => ({
      queues: state.queues.filter((q) => q.id !== id),
    })),

  setCurrent: (counterId, item) =>
    set((state) => ({
      currentByCounter: { ...state.currentByCounter, [counterId]: item },
    })),
}));
