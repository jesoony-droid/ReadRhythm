import type { ShelfItem } from '../types';
import type { Session } from '../store/sessionStore';

// ── 타입 정의 ────────────────────────────────────────────────────────────────

export interface BookRecommendation {
  title: string;
  author: string;
  genre: string;
  compatibilityPercent: number;
  reasons: string[];
  estimatedReadingDays: number;
}

export interface RecommendationsResponse {
  recommendations: BookRecommendation[];
  coachMessage: string;
  patternSummary: string;
}

export interface CoachReport {
  weeklyMinutes: number;
  weeklyPages: number;
  growthPercent: number;
  strengths: string[];
  tips: string[];
  motivationMessage: string;
  weeklyData: Array<{ week: string; minutes: number }>;
}

// ── 환경변수 ─────────────────────────────────────────────────────────────────
// 통합 백엔드: FastAPI (포트 8000) — NestJS(3001) 기능 흡수 완료
// .env: EXPO_PUBLIC_LIBRARIAN_URL=http://localhost:8000

const BACKEND_URL = process.env.EXPO_PUBLIC_LIBRARIAN_URL ?? 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 15_000;
const CLAUDE_TIMEOUT_MS  = 90_000;  // extended thinking 최대 90초

// ── 백엔드 요청 헬퍼 ─────────────────────────────────────────────────────────

async function postWithTimeout<T>(
  url: string,
  body: unknown,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ── UserReadingContext 빌더 ───────────────────────────────────────────────────
// NestJS 백엔드가 기대하는 요청 형식으로 프론트 데이터를 변환합니다.

function buildReadingContext(
  shelfItems: ShelfItem[],
  sessions: Session[],
  streak: number,
  level: number,
) {
  const totalReadMinutes = Math.floor(
    sessions.reduce((sum, s) => sum + s.durationSec, 0) / 60,
  );

  return {
    shelf: shelfItems.map((item) => ({
      title: item.book.title,
      author: item.book.author,
      // Book 타입에 genre 없음 — 추후 타입 확장 시 추가
      rating: item.rating,
      status: item.status,
    })),
    totalReadMinutes,
    streak,
    level,
    dailyGoalMinutes: 30,
  };
}

function buildCoachContext(
  shelfItems: ShelfItem[],
  sessions: Session[],
  streak: number,
  level: number,
) {
  const now = Date.now();
  // 최근 84일(12주) 세션을 일별로 집계
  const recentSessions = sessions
    .filter((s) => now - new Date(s.startedAt).getTime() < 84 * 86_400_000)
    .map((s) => ({
      date: s.startedAt.slice(0, 10),
      minutes: Math.floor(s.durationSec / 60),
      pages: Math.max(s.pageEnd - s.pageStart, 0),
    }));

  return {
    ...buildReadingContext(shelfItems, sessions, streak, level),
    recentSessions,
  };
}

// ── 목업 데이터 (백엔드 미가동 시 폴백) ─────────────────────────────────────

const MOCK_RECOMMENDATIONS: RecommendationsResponse = {
  patternSummary: '한국 문학과 인문학을 즐기며, 하루 평균 35분 꾸준히 독서하는 패턴을 보여요.',
  coachMessage: '7일 연속 독서 중이에요! 이 페이스라면 이번 달 목표 달성은 문제없어요. 오늘도 화이팅! 🔥',
  recommendations: [
    {
      title: '작별하지 않는다',
      author: '한강',
      genre: '한국소설',
      compatibilityPercent: 97,
      reasons: [
        '이미 읽은 한강 작가의 작품과 스타일이 유사해요',
        '섬세한 감정 묘사가 독자님 취향에 잘 맞아요',
        '노벨문학상 수상 이후 가장 주목받는 작품이에요',
      ],
      estimatedReadingDays: 6,
    },
    {
      title: '파친코',
      author: '이민진',
      genre: '역사소설',
      compatibilityPercent: 92,
      reasons: [
        '깊은 인물 묘사가 채식주의자 독자에게 잘 맞아요',
        '한국 근현대사를 배경으로 한 서사 대작이에요',
        '독서 지속력이 높은 독자님께 추천해요',
      ],
      estimatedReadingDays: 14,
    },
    {
      title: '트렌드 코리아 2025',
      author: '김난도',
      genre: '사회·트렌드',
      compatibilityPercent: 85,
      reasons: [
        '현재 독서 습관에 비문학 장르를 추가하면 좋아요',
        '짧은 챕터 구성으로 독서 리듬 유지에 적합해요',
        '실용적 인사이트를 얻고 싶은 독자님께 추천해요',
      ],
      estimatedReadingDays: 8,
    },
    {
      title: '아가미',
      author: '구병모',
      genre: '한국소설',
      compatibilityPercent: 88,
      reasons: [
        '독특한 세계관과 섬세한 문체가 매력적이에요',
        '한강 작가 팬이라면 반드시 읽어야 할 작품이에요',
        '적당한 분량으로 독서 목표 달성하기 좋아요',
      ],
      estimatedReadingDays: 5,
    },
    {
      title: '도둑맞은 집중력',
      author: '요한 하리',
      genre: '자기계발',
      compatibilityPercent: 80,
      reasons: [
        '독서 습관 개선에 직접적으로 도움이 되는 책이에요',
        '과학적 근거를 바탕으로 한 실용적 내용이에요',
        '꾸준히 독서하는 독자님께 동기부여가 될 거예요',
      ],
      estimatedReadingDays: 9,
    },
  ],
};

function buildMockCoachReport(sessions: Session[]): CoachReport {
  const now = new Date();
  const weeklyData = Array.from({ length: 12 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (11 - i) * 7);
    const month = weekStart.getMonth() + 1;
    const day = weekStart.getDate();
    const base = 120 + i * 15 + Math.floor(Math.random() * 40);
    return { week: `${month}/${day}`, minutes: i < 11 ? base : 245 };
  });

  const recentMin =
    sessions
      .filter((s) => Date.now() - new Date(s.startedAt).getTime() < 7 * 86_400_000)
      .reduce((sum, s) => sum + s.durationSec, 0) / 60;

  return {
    weeklyMinutes: Math.round(recentMin) || 245,
    weeklyPages: Math.round((recentMin || 245) * 0.8),
    growthPercent: 23,
    strengths: [
      '매일 꾸준히 독서하는 습관이 완벽하게 자리잡혔어요',
      '세션당 평균 35분으로 집중도가 매우 높아요',
      '7일 연속 독서 달성! 연속 기록이 계속 늘고 있어요',
    ],
    tips: [
      '주말에 조금 더 긴 세션(50분)을 시도해 보세요. 몰입감이 달라져요',
      '읽은 책에 별점을 남기면 AI 추천 정확도가 더 높아져요',
      '문장 수집을 꾸준히 하면 나만의 독서 아카이브가 완성돼요',
    ],
    motivationMessage:
      '이번 주 독서량이 지난주보다 23% 늘었어요. 이 추세라면 이번 달 목표를 일찍 달성할 것 같아요. 오늘도 책 한 페이지, 작은 발걸음이 큰 변화를 만들어요! 📚',
    weeklyData,
  };
}

// ── 공개 API ─────────────────────────────────────────────────────────────────

/**
 * AI 도서 추천 요청
 * 1순위: FastAPI 통합 백엔드 (EXPO_PUBLIC_LIBRARIAN_URL/api/ai/recommendations)
 * 폴백:  목업 데이터 (백엔드 미가동 / 타임아웃 / API 키 미설정)
 */
export async function fetchRecommendations(
  shelfItems: ShelfItem[],
  sessions: Session[],
  streak: number,
  level: number,
): Promise<RecommendationsResponse> {
  try {
    const ctx = buildReadingContext(shelfItems, sessions, streak, level);
    return await postWithTimeout<RecommendationsResponse>(
      `${BACKEND_URL}/api/ai/recommendations`,
      ctx,
      CLAUDE_TIMEOUT_MS,
    );
  } catch {
    // 백엔드 미실행 / API 키 미설정 시 목업으로 자동 폴백
    await new Promise((r) => setTimeout(r, 1_800));
    return MOCK_RECOMMENDATIONS;
  }
}

/**
 * AI 코치 리포트 요청
 * 1순위: FastAPI 통합 백엔드 (EXPO_PUBLIC_LIBRARIAN_URL/api/ai/coach-report)
 * 폴백:  목업 데이터
 */
export async function fetchCoachReport(
  shelfItems: ShelfItem[],
  sessions: Session[],
  streak: number,
  level: number,
): Promise<CoachReport> {
  try {
    const ctx = buildCoachContext(shelfItems, sessions, streak, level);
    return await postWithTimeout<CoachReport>(
      `${BACKEND_URL}/api/ai/coach-report`,
      ctx,
      CLAUDE_TIMEOUT_MS,
    );
  } catch {
    await new Promise((r) => setTimeout(r, 1_500));
    return buildMockCoachReport(sessions);
  }
}
