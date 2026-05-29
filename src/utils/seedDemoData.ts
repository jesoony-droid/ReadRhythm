import { useShelfStore } from '../store/shelfStore';
import { useSessionStore } from '../store/sessionStore';
import { useQuotesStore } from '../store/quotesStore';
import { useXpStore } from '../store/xpStore';
import { useBadgeStore } from '../store/badgeStore';
import { getBookByIsbn } from '../api/books';
import type { Book } from '../types';

const DEMO_ISBNS = new Set(['demo1', 'demo2', 'demo3', '9788936432850', '9788936434120', '9788954651135']);

// 카카오 API 없을 때 폴백용 기본 정보
const FALLBACK_BOOKS: Book[] = [
  { id: '9788936432850', isbn: '9788936432850', title: '아몬드',       author: '손원평', publisher: '창비',   totalPages: 264 },
  { id: '9788936434120', isbn: '9788936434120', title: '채식주의자',   author: '한강',   publisher: '창비',   totalPages: 247 },
  { id: '9788954651135', isbn: '9788954651135', title: '82년생 김지영', author: '조남주', publisher: '민음사', totalPages: 190 },
];

export async function seedDemoData(): Promise<void> {
  const { addBook, items, removeItem } = useShelfStore.getState();
  const { addSession } = useSessionStore.getState();
  const { addQuote } = useQuotesStore.getState();
  const { addXp } = useXpStore.getState();
  const { unlock } = useBadgeStore.getState();

  // 기존 데모 책 제거
  items
    .filter((i) => DEMO_ISBNS.has(i.book.isbn))
    .forEach((i) => removeItem(i.id));

  // 카카오 API로 실제 커버 URL 포함 도서 정보 가져오기
  const [almond, vegetarian, kim] = await Promise.all(
    FALLBACK_BOOKS.map((fb) =>
      getBookByIsbn(fb.isbn).then((b) => b ?? fb).catch(() => fb)
    )
  );

  // 책 3권 추가 (totalPages는 API에 없으면 폴백값 유지)
  addBook({ ...almond,     totalPages: almond.totalPages     ?? 264 }, 'DONE');
  addBook({ ...vegetarian, totalPages: vegetarian.totalPages ?? 247 }, 'READING');
  addBook({ ...kim,        totalPages: kim.totalPages        ?? 190 }, 'WANT');

  // 세션 ID는 채식주의자 ISBN 기반으로 생성된 shelf item을 찾아서 연결
  const readingItem = useShelfStore.getState().items.find((i) => i.book.isbn === '9788936434120');
  const shelfItemId = readingItem?.id ?? 'demo2';

  // 최근 7일 세션
  for (let d = 6; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const iso = date.toISOString().slice(0, 10);
    addSession({
      shelfItemId,
      mode: 'free',
      startedAt: `${iso}T09:00:00.000Z`,
      endedAt:   `${iso}T09:35:00.000Z`,
      durationSec: 35 * 60,
      pageStart: d * 8,
      pageEnd:   d * 8 + 8,
      isCompleted: true,
    });
  }

  // 나만의 한줄 3개
  addQuote({ text: '우리가 사랑하는 것들은 우리를 만든다.',              bookTitle: '아몬드',        bookAuthor: '손원평', emotion: 'touching'  });
  addQuote({ text: '고통은 우리를 깎아내지 않는다. 오히려 우리를 빚어낸다.', bookTitle: '채식주의자',    bookAuthor: '한강',   emotion: 'wise'      });
  addQuote({ text: '모든 시작은 두려움과 함께 온다.',                    bookTitle: '82년생 김지영', bookAuthor: '조남주', emotion: 'inspiring' });

  // XP & 배지
  addXp(320, '데모 데이터');
  unlock('first_session');
  unlock('streak_7');
  unlock('first_done');
  unlock('quote_10');
}
