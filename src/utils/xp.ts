export interface LevelDef {
  level: number;
  name: string;
  minXp: number;
}

export const LEVELS: LevelDef[] = [
  { level: 1, name: '새싹 독자',  minXp: 0 },
  { level: 2, name: '책 애호가', minXp: 300 },
  { level: 3, name: '독서가',    minXp: 800 },
  { level: 4, name: '책벌레',    minXp: 1800 },
  { level: 5, name: '독서광',    minXp: 4000 },
  { level: 6, name: '북 마스터', minXp: 8000 },
  { level: 7, name: '석학',      minXp: 15000 },
];

export interface LevelInfo {
  level: number;
  name: string;
  currentXp: number;
  levelMinXp: number;
  nextLevelXp: number | null;
  progressPercent: number;
}

export function getLevelInfo(totalXp: number): LevelInfo {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (totalXp >= l.minXp) current = l;
    else break;
  }
  const nextIndex = LEVELS.findIndex((l) => l.level === current.level) + 1;
  const next = nextIndex < LEVELS.length ? LEVELS[nextIndex] : null;

  const levelMinXp = current.minXp;
  const nextLevelXp = next ? next.minXp : null;
  const span = nextLevelXp ? nextLevelXp - levelMinXp : 1;
  const progressPercent = nextLevelXp
    ? Math.min((totalXp - levelMinXp) / span, 1)
    : 1;

  return { level: current.level, name: current.name, currentXp: totalXp, levelMinXp, nextLevelXp, progressPercent };
}

export const XP_RULES = {
  SESSION_COMPLETE: 20,   // 15분 이상 세션
  DAILY_GOAL: 50,         // 시간+페이지 둘 다 달성
  SENTENCE_COLLECT: 5,
  BOOK_FINISH: 200,
  STREAK_7: 100,          // 7일 배수마다
} as const;
