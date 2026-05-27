import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Badge {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  xp: number;
  unlockedAt: string | null;
}

export const ALL_BADGES: Badge[] = [
  // 첫 걸음
  { id: 'first_session',    title: '첫 독서',        emoji: '📖', desc: '첫 타이머 세션 완료',             xp: 30,  unlockedAt: null },
  { id: 'first_done',       title: '첫 완독',        emoji: '🎉', desc: '첫 번째 책 완독',                 xp: 200, unlockedAt: null },
  { id: 'first_quote',      title: '첫 문장',        emoji: '💬', desc: '첫 번째 문장 수집',               xp: 30,  unlockedAt: null },
  { id: 'first_ai',         title: 'AI 친구',        emoji: '🤖', desc: 'AI 추천 첫 사용',                 xp: 30,  unlockedAt: null },

  // 스트릭
  { id: 'streak_3',         title: '3일 스트릭',     emoji: '🔥', desc: '3일 연속 독서',                   xp: 30,  unlockedAt: null },
  { id: 'streak_7',         title: '7일 스트릭',     emoji: '🔥', desc: '7일 연속 독서',                   xp: 100, unlockedAt: null },
  { id: 'streak_14',        title: '2주 스트릭',     emoji: '🌟', desc: '14일 연속 독서',                  xp: 150, unlockedAt: null },
  { id: 'streak_30',        title: '한 달 스트릭',   emoji: '🏆', desc: '30일 연속 독서',                  xp: 300, unlockedAt: null },
  { id: 'streak_100',       title: '백일 독서',      emoji: '💎', desc: '100일 연속 독서',                 xp: 500, unlockedAt: null },

  // 완독 마일스톤
  { id: 'done_5',           title: '5권 완독',       emoji: '📚', desc: '5권 완독 달성',                   xp: 200, unlockedAt: null },
  { id: 'done_10',          title: '10권 완독',      emoji: '🦉', desc: '10권 완독 달성',                  xp: 300, unlockedAt: null },
  { id: 'done_25',          title: '25권 완독',      emoji: '🎓', desc: '25권 완독 달성',                  xp: 400, unlockedAt: null },
  { id: 'done_50',          title: '50권 완독',      emoji: '🏛️',  desc: '50권 완독 달성',                  xp: 500, unlockedAt: null },

  // 문장 수집
  { id: 'quote_10',         title: '문장 수집가',    emoji: '📝', desc: '문장 10개 수집',                  xp: 30,  unlockedAt: null },
  { id: 'quote_50',         title: '문장 애호가',    emoji: '✍️',  desc: '문장 50개 수집',                  xp: 50,  unlockedAt: null },
  { id: 'quote_100',        title: '문장 장인',      emoji: '🖋️',  desc: '문장 100개 수집',                 xp: 100, unlockedAt: null },

  // 독서 시간
  { id: 'hour_10',          title: '10시간 독서',    emoji: '⏱',  desc: '누적 10시간 독서',                xp: 50,  unlockedAt: null },
  { id: 'hour_50',          title: '50시간 독서',    emoji: '⌛',  desc: '누적 50시간 독서',                xp: 100, unlockedAt: null },
  { id: 'hour_100',         title: '100시간 독서',   emoji: '🕰️',  desc: '누적 100시간 독서',               xp: 200, unlockedAt: null },
  { id: 'marathon',         title: '하루 마라톤',    emoji: '🏃',  desc: '하루 2시간 이상 독서',             xp: 50,  unlockedAt: null },

  // 타이머 & 뽀모도로
  { id: 'pomodoro_5',       title: '뽀모도로 5회',   emoji: '🍅', desc: '뽀모도로 세션 5회 완료',           xp: 30,  unlockedAt: null },
  { id: 'pomodoro_25',      title: '뽀모도로 25회',  emoji: '🍅', desc: '뽀모도로 세션 25회 완료',          xp: 100, unlockedAt: null },
  { id: 'early_bird',       title: '새벽 독서가',    emoji: '🌅', desc: '오전 6시 이전 독서 세션',          xp: 30,  unlockedAt: null },
  { id: 'night_owl',        title: '올빼미 독서가',  emoji: '🦉', desc: '자정 이후 독서 세션',              xp: 30,  unlockedAt: null },

  // 레벨 & XP
  { id: 'level_3',          title: '독서가',         emoji: '⭐', desc: '레벨 3 달성',                     xp: 30,  unlockedAt: null },
  { id: 'level_5',          title: '독서광',         emoji: '🌟', desc: '레벨 5 달성',                     xp: 100, unlockedAt: null },
  { id: 'level_7',          title: '석학',           emoji: '🎓', desc: '레벨 7 (최고 레벨) 달성',         xp: 300, unlockedAt: null },

  // 특별
  { id: 'genre_5',          title: '다독가',         emoji: '🗂️',  desc: '5가지 장르 도전',                 xp: 50,  unlockedAt: null },
  { id: 'weekend_warrior',  title: '주말 독서왕',    emoji: '🌈', desc: '주말 연속 2일 목표 달성',          xp: 30,  unlockedAt: null },
  { id: 'bgm_user',         title: 'BGM 애청자',     emoji: '🎵', desc: 'BGM과 함께 독서 세션 완료',        xp: 30,  unlockedAt: null },
  { id: 'annual_report',    title: '연간 결산',      emoji: '📊', desc: '연간 리포트 첫 확인',              xp: 30,  unlockedAt: null },
];

interface BadgeState {
  badges: Badge[];
  unlock: (id: string) => void;
  isUnlocked: (id: string) => boolean;
}

export const useBadgeStore = create<BadgeState>()(
  persist(
    (set, get) => ({
      badges: ALL_BADGES.map((b) => ({ ...b })),

      unlock: (id) =>
        set((s) => ({
          badges: s.badges.map((b) =>
            b.id === id && !b.unlockedAt
              ? { ...b, unlockedAt: new Date().toISOString() }
              : b
          ),
        })),

      isUnlocked: (id) => !!get().badges.find((b) => b.id === id)?.unlockedAt,
    }),
    {
      name: 'readrhythm-badges',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ badges: state.badges }),
      // 앱 업데이트로 ALL_BADGES에 새 배지가 추가돼도 기존 잠금해제 기록 보존
      merge: (persisted, current) => {
        const saved = (persisted as Partial<BadgeState>).badges ?? [];
        const unlockedMap = new Map(saved.map((b) => [b.id, b.unlockedAt]));
        return {
          ...current,
          badges: ALL_BADGES.map((b) => ({
            ...b,
            unlockedAt: unlockedMap.get(b.id) ?? null,
          })),
        };
      },
    }
  )
);
