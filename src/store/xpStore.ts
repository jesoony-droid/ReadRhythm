import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLevelInfo, type LevelInfo } from '../utils/xp';

interface XpEvent {
  id: string;
  reason: string;
  amount: number;
  at: string;
}

interface XpState {
  totalXp: number;
  events: XpEvent[];
  addXp: (amount: number, reason: string) => void;
  levelInfo: () => LevelInfo;
}

export const useXpStore = create<XpState>()(
  persist(
    (set, get) => ({
      totalXp: 0,
      events: [],

      addXp: (amount, reason) =>
        set((s) => ({
          totalXp: s.totalXp + amount,
          events: [
            ...s.events,
            { id: `xp_${Date.now()}`, reason, amount, at: new Date().toISOString() },
          ],
        })),

      levelInfo: () => getLevelInfo(get().totalXp),
    }),
    {
      name: 'readrhythm-xp',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ totalXp: state.totalXp, events: state.events }),
    }
  )
);
