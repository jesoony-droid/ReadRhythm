import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TimerMode = 'free' | 'pomodoro';

export interface Session {
  id: string;
  shelfItemId: string | null;
  mode: TimerMode;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  pageStart: number;
  pageEnd: number;
  isCompleted: boolean;
}

export interface DayStats {
  dateStr: string;        // 'YYYY-MM-DD'
  minutes: number;
  pages: number;
  goalAchieved: boolean;  // 시간 + 페이지 둘 다 달성
  hasSession: boolean;
}

// 기본값 상수 (goalStore가 없는 환경의 초기값으로만 사용)
const DEFAULT_GOAL_MIN   = 30;
const DEFAULT_GOAL_PAGES = 20;

function toDateStr(iso: string): string {
  return iso.slice(0, 10); // 'YYYY-MM-DD'
}

function isSameDateStr(iso: string, dateStr: string): boolean {
  return toDateStr(iso) === dateStr;
}

interface SessionState {
  sessions: Session[];
  // ── 사용자 목표 (하드코딩 제거) ──────────────────────────
  dailyGoalMinutes: number;
  dailyGoalPages: number;
  setDailyGoal: (minutes: number, pages: number) => void;
  // ── 계산 함수 ─────────────────────────────────────────────
  addSession: (s: Omit<Session, 'id'>) => void;
  todayMinutes: () => number;
  todayPages: () => number;
  getDayStats: (dateStr: string) => DayStats;
  getMonthStats: (year: number, month: number) => Map<string, DayStats>;
  getStreak: () => number;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      dailyGoalMinutes: DEFAULT_GOAL_MIN,
      dailyGoalPages: DEFAULT_GOAL_PAGES,

      setDailyGoal: (minutes, pages) =>
        set({ dailyGoalMinutes: minutes, dailyGoalPages: pages }),

      addSession: (s) =>
        set((state) => ({
          sessions: [...state.sessions, { ...s, id: `s_${Date.now()}` }],
        })),

      todayMinutes: () => {
        const today = toDateStr(new Date().toISOString());
        return Math.floor(
          get().sessions
            .filter((s) => isSameDateStr(s.startedAt, today))
            .reduce((sum, s) => sum + s.durationSec, 0) / 60
        );
      },

      todayPages: () => {
        const today = toDateStr(new Date().toISOString());
        return get().sessions
          .filter((s) => isSameDateStr(s.startedAt, today))
          .reduce((sum, s) => sum + Math.max(s.pageEnd - s.pageStart, 0), 0);
      },

      getDayStats: (dateStr) => {
        const { sessions, dailyGoalMinutes, dailyGoalPages } = get();
        const daySessions = sessions.filter((s) => isSameDateStr(s.startedAt, dateStr));
        const minutes = Math.floor(daySessions.reduce((sum, s) => sum + s.durationSec, 0) / 60);
        const pages = daySessions.reduce((sum, s) => sum + Math.max(s.pageEnd - s.pageStart, 0), 0);
        return {
          dateStr,
          minutes,
          pages,
          goalAchieved: minutes >= dailyGoalMinutes && pages >= dailyGoalPages,
          hasSession: daySessions.length > 0,
        };
      },

      getMonthStats: (year, month) => {
        const map = new Map<string, DayStats>();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          map.set(dateStr, get().getDayStats(dateStr));
        }
        return map;
      },

      getStreak: () => {
        const { sessions } = get();
        if (sessions.length === 0) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let streak = 0;
        let cursor = new Date(today);

        while (true) {
          const dateStr = toDateStr(cursor.toISOString());
          const hasSessions = sessions.some((s) => isSameDateStr(s.startedAt, dateStr));
          if (!hasSessions) break;
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        }
        return streak;
      },
    }),
    {
      name: 'readrhythm-sessions',
      storage: createJSONStorage(() => AsyncStorage),
      // 함수는 JSON 직렬화 불가 → 데이터만 저장
      partialize: (state) => ({
        sessions: state.sessions,
        dailyGoalMinutes: state.dailyGoalMinutes,
        dailyGoalPages: state.dailyGoalPages,
      }),
    }
  )
);
