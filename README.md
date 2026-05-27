# 📚 ReadRhythm

> **AI 기반 독서 습관 트래커** — 매일 읽고, 기록하고, 성장한다

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)

---

## ✨ 주요 기능

| 기능 | 설명 |
|---|---|
| 📖 **독서 타이머** | 3중 링 SVG 애니메이션 · 자유/뽀모도로 모드 |
| 📚 **스마트 서재** | 책 상태 관리(읽는 중/완독/읽고 싶어요) · 장르 도넛 차트 |
| 🤖 **AI 사서** | 국립중앙도서관 Q&A 5,910건 기반 RAG · 현재 책 맥락 자동 인식 |
| ✨ **AI 도서 추천** | Claude Opus 4.7 · 독서 패턴 분석 · 궁합 점수 |
| 📊 **코치 리포트** | 주간 성장 그래프 · 강점 분석 · 동기부여 메시지 |
| 🏆 **배지 시스템** | 30종 배지 · XP/레벨 7단계 |
| 💬 **문장 수집** | 읽으면서 인상적인 문장 저장 |
| 🎵 **독서 BGM** | 분위기별 4가지 음악 채널 |

---

## 🖼️ 화면 구성

```
홈           서재          타이머        AI사서        내정보
─────────    ─────────    ─────────    ─────────    ─────────
오늘의 목표   도넛 차트     3중링 타이머  RAG 검색     레벨·XP
읽는 책 카드  책 목록       BGM 버튼     컨텍스트 바   주간 통계
AI 코치      상태 필터     뽀모도로     + 담기 버튼   메뉴 그리드
주간 캘린더                자유 모드    제안 칩 3개   배지·목표
```

---

## 🛠️ 기술 스택

### 프론트엔드 (`7-1. ReadRhythm`)
- **React Native** Expo SDK 54 + TypeScript
- **Expo Router** v6 (파일 기반 라우팅)
- **Zustand** v5 (전역 상태 + AsyncStorage persist)
- **React Native SVG** + **Reanimated** (타이머 애니메이션)
- **TanStack React Query** (서버 상태 캐싱)

### 백엔드 (`AI-librarian`)
- **FastAPI** (Python, 포트 8000)
- **Gemini 2.5 Flash** — RAG 답변 생성 · 도서 정보 추출
- **pgvector** + **sentence-transformers** — 로컬 벡터 임베딩
- **Claude Opus 4.7** — AI 추천 · 코치 리포트 (extended thinking)
- **PostgreSQL 17** — Q&A 5,910건 + 벡터 인덱스

---

## 🚀 시작하기

### 1. 백엔드 실행

```bash
cd "9. AI사서응답시스템"

# 환경변수 설정
cp .env.example .env
# .env 에 GEMINI_API_KEY, ANTHROPIC_API_KEY 입력

# 가상환경 활성화 후 실행
.venv\Scripts\activate          # Windows
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

### 2. 앱 실행

```bash
cd "7-1. ReadRhythm"

# 환경변수 설정
# .env 파일이 이미 포함되어 있습니다

# 의존성 설치
npm install

# 웹 미리보기 (빠른 확인)
npx expo start --web

# iOS / Android (Expo Go 앱 필요)
npx expo start
```

### 3. 환경변수

`.env` (프론트엔드):
```env
EXPO_PUBLIC_LIBRARIAN_URL=http://localhost:8000
EXPO_PUBLIC_KAKAO_API_KEY=   # 도서 검색 (선택)
EXPO_PUBLIC_NAVER_CLIENT_ID= # 도서 검색 폴백 (선택)
```

`.env` (백엔드):
```env
GEMINI_API_KEY=       # 필수 — RAG 답변 생성
ANTHROPIC_API_KEY=    # 선택 — AI 추천·코치 리포트
DATABASE_URL=postgresql://postgres:postgres@localhost/ai_librarian
```

---

## 📂 프로젝트 구조

```
7-1. ReadRhythm/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # 홈
│   │   ├── library.tsx        # 서재
│   │   ├── timer.tsx          # 타이머
│   │   ├── librarian.tsx      # AI사서 (RAG + 담기)
│   │   ├── profile.tsx        # 내정보
│   │   ├── bgm.tsx            # BGM (숨김 탭)
│   │   └── quotes.tsx         # 문장보관함 (숨김 탭)
│   ├── book/[id].tsx          # 책 상세
│   ├── search.tsx             # 도서 검색
│   ├── coach-report.tsx       # 코치 리포트
│   └── annual-report.tsx      # 연간 리포트
├── src/
│   ├── store/                 # Zustand 스토어
│   │   ├── shelfStore.ts      # 서재 상태
│   │   ├── timerStore.ts      # 타이머 상태
│   │   ├── sessionStore.ts    # 독서 세션
│   │   ├── badgeStore.ts      # 배지 30종
│   │   └── bgmStore.ts        # BGM 상태
│   ├── api/
│   │   ├── books.ts           # 카카오/네이버 도서 검색
│   │   └── ai.ts              # AI 추천·코치 API
│   └── constants/tokens.ts    # 디자인 토큰
└── 9. AI사서응답시스템/        # FastAPI 백엔드
    ├── api/main.py
    ├── crawler/               # Q&A 크롤러
    ├── db/                    # 임베딩·스키마
    └── search/                # 하이브리드 검색
```

---

## 🔗 관련 레포지토리

| 레포 | 설명 |
|---|---|
| [ReadRhythm](https://github.com/jesoony-droid/ReadRhythm) | 이 레포 — Expo 프론트엔드 |
| [AI-librarian](https://github.com/jesoony-droid/AI-librarian) | FastAPI 통합 백엔드 |
| [ReadRhythm-backend](https://github.com/jesoony-droid/ReadRhythm-backend) | NestJS 구 백엔드 (deprecated) |

---

## 📄 라이선스

MIT License
