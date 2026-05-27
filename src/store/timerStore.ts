import { create } from 'zustand';
import type { TimerMode } from './sessionStore';

export const POMODORO_SEC = 25 * 60;

interface TimerState {
  isRunning: boolean;
  elapsedSeconds: number;
  mode: TimerMode;
  sessionStartedAt: string | null;
  activeShelfItemId: string | null;
  pageStart: number;
  start: (shelfItemId: string | null, mode: TimerMode, pageStart?: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  elapsedSeconds: 0,
  mode: 'free',
  sessionStartedAt: null,
  activeShelfItemId: null,
  pageStart: 0,

  start: (shelfItemId, mode, pageStart = 0) =>
    set({
      isRunning: true,
      elapsedSeconds: 0,
      mode,
      sessionStartedAt: new Date().toISOString(),
      activeShelfItemId: shelfItemId,
      pageStart,
    }),

  pause: () => set({ isRunning: false }),
  resume: () => set({ isRunning: true }),

  reset: () =>
    set({
      isRunning: false,
      elapsedSeconds: 0,
      sessionStartedAt: null,
      activeShelfItemId: null,
      pageStart: 0,
    }),

  tick: () => {
    if (!get().isRunning) return;
    const next = get().elapsedSeconds + 1;
    // 뽀모도로: 25분 도달 시 자동 정지
    if (get().mode === 'pomodoro' && next >= POMODORO_SEC) {
      set({ elapsedSeconds: POMODORO_SEC, isRunning: false });
    } else {
      set({ elapsedSeconds: next });
    }
  },
}));
