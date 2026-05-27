import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Quote {
  id: string;
  text: string;
  bookTitle: string;
  bookAuthor: string;
  page?: number;
  savedAt: string;
  emotion?: 'inspiring' | 'touching' | 'funny' | 'wise';
}

interface QuotesState {
  quotes: Quote[];
  addQuote: (q: Omit<Quote, 'id' | 'savedAt'>) => void;
  removeQuote: (id: string) => void;
}

export const useQuotesStore = create<QuotesState>()(
  persist(
    (set) => ({
      quotes: [],

      addQuote: (q) =>
        set((s) => ({
          quotes: [
            { ...q, id: `q_${Date.now()}`, savedAt: new Date().toISOString() },
            ...s.quotes,
          ],
        })),

      removeQuote: (id) =>
        set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) })),
    }),
    {
      name: 'readrhythm-quotes',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
