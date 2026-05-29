export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  dailyGoalMinutes: number;
  dailyGoalPages: number;
  level: number;
  xp: number;
  streak: number;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  coverUrl?: string;
  publisher?: string;
  publishedAt?: string;
  totalPages?: number;
  description?: string;
}

export type ReadingStatus = 'WANT' | 'READING' | 'DONE' | 'PAUSED';

export interface ShelfItem {
  id: string;
  book: Book;
  status: ReadingStatus;
  currentPage: number;
  rating?: number;
  memo?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface ReadingSession {
  id: string;
  shelfItemId: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  pagesRead: number;
}

export interface DailyStat {
  date: string;
  totalMinutes: number;
  totalPages: number;
  goalAchieved: boolean;
}
