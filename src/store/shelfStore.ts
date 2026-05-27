import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ShelfItem, Book, ReadingStatus } from '../types';

const SPINE_COLORS = [
  '#3B5BDB', '#7048E8', '#2F9E44', '#F76707',
  '#E03131', '#F59F00', '#0C8599', '#862E9C',
];

function pickSpineColor(isbn: string): string {
  let hash = 0;
  for (const c of isbn) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return SPINE_COLORS[Math.abs(hash) % SPINE_COLORS.length];
}

interface ShelfState {
  items: (ShelfItem & { spineColor: string })[];
  addBook: (book: Book, status: ReadingStatus) => void;
  updateStatus: (id: string, status: ReadingStatus) => void;
  updatePage: (id: string, page: number) => void;
  updateRating: (id: string, rating: number) => void;
  updateMemo: (id: string, memo: string) => void;
  removeItem: (id: string) => void;
}

export const useShelfStore = create<ShelfState>()(
  persist(
    (set) => ({
      items: [],

      addBook: (book, status) =>
        set((s) => {
          if (s.items.find((i) => i.book.isbn === book.isbn)) return s;
          const item: ShelfItem & { spineColor: string } = {
            id: `${book.isbn}_${Date.now()}`,
            book,
            status,
            currentPage: 0,
            startedAt: status === 'READING' ? new Date().toISOString() : undefined,
            spineColor: pickSpineColor(book.isbn),
          };
          return { items: [...s.items, item] };
        }),

      updateStatus: (id, status) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status,
                  startedAt: status === 'READING' && !i.startedAt ? new Date().toISOString() : i.startedAt,
                  finishedAt: status === 'DONE' ? new Date().toISOString() : i.finishedAt,
                }
              : i
          ),
        })),

      updatePage: (id, page) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, currentPage: page } : i)) })),

      updateRating: (id, rating) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, rating } : i)) })),

      updateMemo: (id, memo) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, memo } : i)) })),

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
    }),
    {
      name: 'readrhythm-shelf',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
