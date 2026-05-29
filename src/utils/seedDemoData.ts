import { useShelfStore } from '../store/shelfStore';
import { useSessionStore } from '../store/sessionStore';
import { useQuotesStore } from '../store/quotesStore';
import { useXpStore } from '../store/xpStore';
import { useBadgeStore } from '../store/badgeStore';

const DEMO_ISBNS = new Set(['demo1', 'demo2', 'demo3', '9788936432850', '9788936434120', '9788954651135']);

export function seedDemoData() {
  const { addBook, items, removeItem } = useShelfStore.getState();
  const { addSession } = useSessionStore.getState();
  const { addQuote } = useQuotesStore.getState();
  const { addXp } = useXpStore.getState();
  const { unlock } = useBadgeStore.getState();

  // 기존 데모 책 제거 (이전 버전 포함)
  items
    .filter((i) => DEMO_ISBNS.has(i.book.isbn))
    .forEach((i) => removeItem(i.id));

  // 책 3권 추가
  addBook({
    id: 'demo1', isbn: '9788936432850',
    title: '아몬드', author: '손원평',
    coverUrl: 'https://image.yes24.com/goods/70362482/XL',
    publisher: '창비', totalPages: 264,
  }, 'DONE');
  addBook({
    id: 'demo2', isbn: '9788936434120',
    title: '채식주의자', author: '한강',
    coverUrl: 'https://image.yes24.com/goods/7543147/XL',
    publisher: '창비', totalPages: 247,
  }, 'READING');
  addBook({
    id: 'demo3', isbn: '9788954651135',
    title: '82년생 김지영', author: '조남주',
    coverUrl: 'https://image.yes24.com/goods/42234212/XL',
    publisher: '민음사', totalPages: 190,
  }, 'WANT');

  // 최근 7일 세션 추가
  for (let d = 6; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const iso = date.toISOString().slice(0, 10);
    addSession({
      shelfItemId: 'demo2',
      mode: 'free',
      startedAt: `${iso}T09:00:00.000Z`,
      endedAt: `${iso}T09:35:00.000Z`,
      durationSec: 35 * 60,
      pageStart: d * 8,
      pageEnd: d * 8 + 8,
      isCompleted: true,
    });
  }

  // 문장 수집 3개
  addQuote({ text: '우리가 사랑하는 것들은 우리를 만든다.', bookTitle: '아몬드', bookAuthor: '손원평', emotion: 'touching' });
  addQuote({ text: '고통은 우리를 깎아내지 않는다. 오히려 우리를 빚어낸다.', bookTitle: '채식주의자', bookAuthor: '한강', emotion: 'wise' });
  addQuote({ text: '모든 시작은 두려움과 함께 온다.', bookTitle: '82년생 김지영', bookAuthor: '조남주', emotion: 'inspiring' });

  // XP & 배지
  addXp(320, '데모 데이터');
  unlock('first_session');
  unlock('streak_7');
  unlock('first_done');
  unlock('quote_10');
}
