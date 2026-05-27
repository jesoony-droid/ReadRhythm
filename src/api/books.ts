import type { Book } from '../types';

const KAKAO_API_KEY = process.env.EXPO_PUBLIC_KAKAO_API_KEY ?? '';
const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '';
const NAVER_CLIENT_SECRET = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET ?? '';

export interface SearchResult {
  books: Book[];
  isEnd: boolean;
  total: number;
}

const MOCK_BOOKS: Book[] = [
  { id: '9788936434120', isbn: '9788936434120', title: '채식주의자', author: '한강', publisher: '창비', coverUrl: 'https://image.yes24.com/goods/7543147/XL', publishedAt: '2007-10-30', totalPages: 247 },
  { id: '9788954651135', isbn: '9788954651135', title: '82년생 김지영', author: '조남주', publisher: '민음사', coverUrl: 'https://image.yes24.com/goods/42234212/XL', publishedAt: '2016-10-14', totalPages: 190 },
  { id: '9788936432850', isbn: '9788936432850', title: '아몬드', author: '손원평', publisher: '창비', coverUrl: 'https://image.yes24.com/goods/70362482/XL', publishedAt: '2017-03-31', totalPages: 264 },
  { id: '9788954644419', isbn: '9788954644419', title: '소년이 온다', author: '한강', publisher: '창비', coverUrl: 'https://image.yes24.com/goods/14244722/XL', publishedAt: '2014-05-19', totalPages: 216 },
  { id: '9788936462017', isbn: '9788936462017', title: '흰', author: '한강', publisher: '창비', coverUrl: 'https://image.yes24.com/goods/38855162/XL', publishedAt: '2018-04-10', totalPages: 160 },
  { id: '9788937473135', isbn: '9788937473135', title: '데미안', author: '헤르만 헤세', publisher: '민음사', coverUrl: 'https://image.yes24.com/goods/7542239/XL', publishedAt: '2000-03-05', totalPages: 208 },
  { id: '9788932919126', isbn: '9788932919126', title: '어린 왕자', author: '생텍쥐페리', publisher: '열린책들', coverUrl: 'https://image.yes24.com/goods/3516649/XL', publishedAt: '2015-05-20', totalPages: 160 },
  { id: '9788954631266', isbn: '9788954631266', title: '죽고 싶지만 떡볶이는 먹고 싶어', author: '백세희', publisher: '흔', coverUrl: 'https://image.yes24.com/goods/61150942/XL', publishedAt: '2018-06-01', totalPages: 248 },
  { id: '9788937460449', isbn: '9788937460449', title: '1984', author: '조지 오웰', publisher: '민음사', coverUrl: 'https://image.yes24.com/goods/17249302/XL', publishedAt: '2003-07-25', totalPages: 440 },
  { id: '9791162540480', isbn: '9791162540480', title: '불편한 편의점', author: '김호연', publisher: '나무옆의자', coverUrl: 'https://image.yes24.com/goods/105422512/XL', publishedAt: '2021-04-20', totalPages: 284 },
  { id: '9788936473747', isbn: '9788936473747', title: '코스모스', author: '칼 세이건', publisher: '사이언스북스', coverUrl: 'https://image.yes24.com/goods/2597308/XL', publishedAt: '2006-12-20', totalPages: 608 },
  { id: '9788965702290', isbn: '9788965702290', title: '미움받을 용기', author: '기시미 이치로', publisher: '인플루엔셜', coverUrl: 'https://image.yes24.com/goods/17119412/XL', publishedAt: '2014-11-17', totalPages: 334 },
  { id: '9788901217833', isbn: '9788901217833', title: '총균쇠', author: '재레드 다이아몬드', publisher: '문학사상', coverUrl: 'https://image.yes24.com/goods/70498163/XL', publishedAt: '2005-12-19', totalPages: 700 },
  { id: '9788901276588', isbn: '9788901276588', title: '사피엔스', author: '유발 하라리', publisher: '김영사', coverUrl: 'https://image.yes24.com/goods/17650923/XL', publishedAt: '2015-11-24', totalPages: 672 },
  { id: '9788972756040', isbn: '9788972756040', title: '해리 포터와 마법사의 돌', author: 'J.K. 롤링', publisher: '문학수첩', coverUrl: 'https://image.yes24.com/goods/1366131/XL', publishedAt: '2014-04-10', totalPages: 424 },
];

function searchMock(query: string): SearchResult {
  const q = query.toLowerCase();
  const filtered = MOCK_BOOKS.filter(
    (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.publisher?.toLowerCase().includes(q)
  );
  const results = filtered.length > 0 ? filtered : MOCK_BOOKS.slice(0, 8);
  return { books: results, isEnd: true, total: results.length };
}

export async function searchBooks(query: string, page = 1): Promise<SearchResult> {
  try {
    if (!KAKAO_API_KEY) throw new Error('no key');
    return await searchKakao(query, page);
  } catch {
    try {
      if (!NAVER_CLIENT_ID) throw new Error('no key');
      return await searchNaver(query, page);
    } catch {
      return searchMock(query);
    }
  }
}

async function searchKakao(query: string, page: number): Promise<SearchResult> {
  const params = new URLSearchParams({ query, page: String(page), size: '20' });
  const res = await fetch(`https://dapi.kakao.com/v3/search/book?${params}`, {
    headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
  });
  if (!res.ok) throw new Error('Kakao API error');
  const data = await res.json();

  return {
    books: data.documents.map((d: any): Book => ({
      id: d.isbn,
      isbn: d.isbn,
      title: d.title,
      author: d.authors?.join(', ') ?? '',
      coverUrl: d.thumbnail,
      publisher: d.publisher,
      publishedAt: d.datetime?.slice(0, 10),
      totalPages: undefined,
    })),
    isEnd: data.meta.is_end,
    total: data.meta.pageable_count,
  };
}

async function searchNaver(query: string, page: number): Promise<SearchResult> {
  const start = (page - 1) * 20 + 1;
  const params = new URLSearchParams({ query, display: '20', start: String(start) });
  const res = await fetch(`https://openapi.naver.com/v1/search/book.json?${params}`, {
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
  });
  if (!res.ok) throw new Error('Naver API error');
  const data = await res.json();

  return {
    books: data.items.map((d: any): Book => ({
      id: d.isbn,
      isbn: d.isbn,
      title: d.title.replace(/<[^>]+>/g, ''),
      author: d.author,
      coverUrl: d.image,
      publisher: d.publisher,
      publishedAt: d.pubdate,
      totalPages: undefined,
    })),
    isEnd: data.start + data.display >= data.total,
    total: data.total,
  };
}
