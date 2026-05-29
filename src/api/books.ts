import type { Book } from '../types';

const KAKAO_API_KEY = process.env.EXPO_PUBLIC_KAKAO_API_KEY ?? '';
const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '';
const NAVER_CLIENT_SECRET = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET ?? '';

export interface SearchResult {
  books: Book[];
  isEnd: boolean;
  total: number;
}

// ── Mock 데이터 ───────────────────────────────────────────────────────────────

const MOCK_BOOKS: Book[] = [
  {
    id: '9788936434120', isbn: '9788936434120', title: '채식주의자', author: '한강',
    publisher: '창비', coverUrl: 'https://image.yes24.com/goods/7543147/XL',
    publishedAt: '2007-10-30', totalPages: 247,
    description: '2016년 맨부커상 수상작. 채식을 선언한 한 여성을 둘러싼 세 편의 연작소설.',
  },
  {
    id: '9788954651135', isbn: '9788954651135', title: '82년생 김지영', author: '조남주',
    publisher: '민음사', coverUrl: 'https://image.yes24.com/goods/42234212/XL',
    publishedAt: '2016-10-14', totalPages: 190,
    description: '1982년에 태어난 평범한 한국 여성의 이야기를 통해 한국 사회의 성차별을 고발한 소설.',
  },
  {
    id: '9788936432850', isbn: '9788936432850', title: '아몬드', author: '손원평',
    publisher: '창비', coverUrl: 'https://image.yes24.com/goods/70362482/XL',
    publishedAt: '2017-03-31', totalPages: 264,
    description: '감정을 느끼지 못하는 소년 윤재의 성장 이야기.',
  },
  {
    id: '9788954644419', isbn: '9788954644419', title: '소년이 온다', author: '한강',
    publisher: '창비', coverUrl: 'https://image.yes24.com/goods/14244722/XL',
    publishedAt: '2014-05-19', totalPages: 216,
    description: '1980년 5월 광주를 배경으로 한 장편소설.',
  },
  {
    id: '9788936462017', isbn: '9788936462017', title: '흰', author: '한강',
    publisher: '창비', coverUrl: 'https://image.yes24.com/goods/38855162/XL',
    publishedAt: '2018-04-10', totalPages: 160,
    description: '흰 것들에 관한 65개의 이야기. 한강 작가의 산문시 소설.',
  },
  {
    id: '9788937473135', isbn: '9788937473135', title: '데미안', author: '헤르만 헤세',
    publisher: '민음사', coverUrl: 'https://image.yes24.com/goods/7542239/XL',
    publishedAt: '2000-03-05', totalPages: 208,
    description: '자아를 찾아가는 청년의 성장 이야기. 헤르만 헤세 대표작.',
  },
  {
    id: '9788932919126', isbn: '9788932919126', title: '어린 왕자', author: '생텍쥐페리',
    publisher: '열린책들', coverUrl: 'https://image.yes24.com/goods/3516649/XL',
    publishedAt: '2015-05-20', totalPages: 160,
    description: '전 세계 수억 명이 읽은 불멸의 고전. 어린 왕자가 여러 별을 여행하며 깨달음을 얻는 이야기.',
  },
  {
    id: '9788954631266', isbn: '9788954631266', title: '죽고 싶지만 떡볶이는 먹고 싶어', author: '백세희',
    publisher: '흔', coverUrl: 'https://image.yes24.com/goods/61150942/XL',
    publishedAt: '2018-06-01', totalPages: 248,
    description: '기분부전장애 진단을 받은 저자가 정신건강의학과 상담 내용을 솔직하게 담은 에세이.',
  },
  {
    id: '9788937460449', isbn: '9788937460449', title: '1984', author: '조지 오웰',
    publisher: '민음사', coverUrl: 'https://image.yes24.com/goods/17249302/XL',
    publishedAt: '2003-07-25', totalPages: 440,
    description: '전체주의 사회의 공포를 그린 조지 오웰의 디스토피아 소설.',
  },
  {
    id: '9791162540480', isbn: '9791162540480', title: '불편한 편의점', author: '김호연',
    publisher: '나무옆의자', coverUrl: 'https://image.yes24.com/goods/105422512/XL',
    publishedAt: '2021-04-20', totalPages: 284,
    description: '서울역 노숙인 독고 씨와 편의점 사람들의 따뜻한 이야기.',
  },
  {
    id: '9788936473747', isbn: '9788936473747', title: '코스모스', author: '칼 세이건',
    publisher: '사이언스북스', coverUrl: 'https://image.yes24.com/goods/2597308/XL',
    publishedAt: '2006-12-20', totalPages: 608,
    description: '우주와 인류의 역사를 장대하게 펼쳐낸 칼 세이건의 과학 고전.',
  },
  {
    id: '9788965702290', isbn: '9788965702290', title: '미움받을 용기', author: '기시미 이치로',
    publisher: '인플루엔셜', coverUrl: 'https://image.yes24.com/goods/17119412/XL',
    publishedAt: '2014-11-17', totalPages: 334,
    description: '아들러 심리학을 대화 형식으로 쉽게 풀어낸 자기계발서.',
  },
  {
    id: '9788901217833', isbn: '9788901217833', title: '총균쇠', author: '재레드 다이아몬드',
    publisher: '문학사상', coverUrl: 'https://image.yes24.com/goods/70498163/XL',
    publishedAt: '2005-12-19', totalPages: 700,
    description: '왜 어떤 민족은 다른 민족을 지배하게 됐는가에 대한 방대한 탐구.',
  },
  {
    id: '9788901276588', isbn: '9788901276588', title: '사피엔스', author: '유발 하라리',
    publisher: '김영사', coverUrl: 'https://image.yes24.com/goods/17650923/XL',
    publishedAt: '2015-11-24', totalPages: 672,
    description: '인류의 역사를 진화·농업·과학·자본주의로 분석한 유발 하라리의 대표작.',
  },
  {
    id: '9788972756040', isbn: '9788972756040', title: '해리 포터와 마법사의 돌', author: 'J.K. 롤링',
    publisher: '문학수첩', coverUrl: 'https://image.yes24.com/goods/1366131/XL',
    publishedAt: '2014-04-10', totalPages: 424,
    description: '마법사 해리 포터의 첫 번째 호그와트 이야기. 전 세계 5억 부 이상 판매된 판타지 소설.',
  },
];

function searchMock(query: string): SearchResult {
  const q = query.toLowerCase();
  const filtered = MOCK_BOOKS.filter(
    (b) => b.title.toLowerCase().includes(q)
      || b.author.toLowerCase().includes(q)
      || (b.publisher?.toLowerCase().includes(q) ?? false)
  );
  const results = filtered.length > 0 ? filtered : MOCK_BOOKS.slice(0, 8);
  return { books: results, isEnd: true, total: results.length };
}

function getMockByIsbn(isbn: string): Book | null {
  return MOCK_BOOKS.find((b) => b.isbn === isbn) ?? null;
}

// ── Kakao API ─────────────────────────────────────────────────────────────────

async function searchKakao(query: string, page: number): Promise<SearchResult> {
  const params = new URLSearchParams({ query, page: String(page), size: '20' });
  const res = await fetch(`https://dapi.kakao.com/v3/search/book?${params}`, {
    headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Kakao ${res.status}`);
  const data = await res.json();
  return {
    books: data.documents.map((d: any): Book => ({
      id: d.isbn,
      isbn: d.isbn,
      title: d.title,
      author: d.authors?.join(', ') ?? '',
      coverUrl: d.thumbnail || undefined,
      publisher: d.publisher || undefined,
      publishedAt: d.datetime?.slice(0, 10),
      description: d.contents || undefined,
      totalPages: undefined,
    })),
    isEnd: data.meta.is_end,
    total: data.meta.pageable_count,
  };
}

async function getBookByIsbnKakao(isbn: string): Promise<Book | null> {
  const params = new URLSearchParams({ target: 'isbn', query: isbn });
  const res = await fetch(`https://dapi.kakao.com/v3/search/book?${params}`, {
    headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const d = data.documents?.[0];
  if (!d) return null;
  return {
    id: d.isbn, isbn: d.isbn, title: d.title,
    author: d.authors?.join(', ') ?? '',
    coverUrl: d.thumbnail || undefined,
    publisher: d.publisher || undefined,
    publishedAt: d.datetime?.slice(0, 10),
    description: d.contents || undefined,
    totalPages: undefined,
  };
}

// ── Naver API ─────────────────────────────────────────────────────────────────

const NAVER_HEADERS = {
  'X-Naver-Client-Id': NAVER_CLIENT_ID,
  'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
};

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, '');
}

async function searchNaver(query: string, page: number): Promise<SearchResult> {
  const start = (page - 1) * 20 + 1;
  const params = new URLSearchParams({ query, display: '20', start: String(start) });
  const res = await fetch(`https://openapi.naver.com/v1/search/book.json?${params}`, {
    headers: NAVER_HEADERS,
  });
  if (!res.ok) throw new Error(`Naver ${res.status}`);
  const data = await res.json();
  return {
    books: data.items.map((d: any): Book => ({
      id: d.isbn, isbn: d.isbn,
      title: stripHtml(d.title),
      author: stripHtml(d.author),
      coverUrl: d.image || undefined,
      publisher: d.publisher || undefined,
      publishedAt: d.pubdate,
      description: stripHtml(d.description) || undefined,
      totalPages: undefined,
    })),
    isEnd: data.start + data.display >= data.total,
    total: data.total,
  };
}

async function getBookByIsbnNaver(isbn: string): Promise<Book | null> {
  const params = new URLSearchParams({ d_isbn: isbn });
  const res = await fetch(`https://openapi.naver.com/v1/search/book_adv.json?${params}`, {
    headers: NAVER_HEADERS,
  });
  if (!res.ok) return null;
  const data = await res.json();
  const d = data.items?.[0];
  if (!d) return null;
  return {
    id: d.isbn, isbn: d.isbn,
    title: stripHtml(d.title),
    author: stripHtml(d.author),
    coverUrl: d.image || undefined,
    publisher: d.publisher || undefined,
    publishedAt: d.pubdate,
    description: stripHtml(d.description) || undefined,
    totalPages: undefined,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function searchBooks(query: string, page = 1): Promise<SearchResult> {
  if (KAKAO_API_KEY) {
    try { return await searchKakao(query, page); } catch {}
  }
  if (NAVER_CLIENT_ID) {
    try { return await searchNaver(query, page); } catch {}
  }
  return searchMock(query);
}

export async function getBookByIsbn(isbn: string): Promise<Book | null> {
  if (KAKAO_API_KEY) {
    try {
      const book = await getBookByIsbnKakao(isbn);
      if (book) return book;
    } catch {}
  }
  if (NAVER_CLIENT_ID) {
    try {
      const book = await getBookByIsbnNaver(isbn);
      if (book) return book;
    } catch {}
  }
  return getMockByIsbn(isbn);
}
