import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../src/constants/tokens';
import { useShelfStore } from '../../src/store/shelfStore';
import type { Book } from '../../src/types';

const API_BASE = process.env.EXPO_PUBLIC_LIBRARIAN_URL ?? 'http://localhost:8000';
const HIST_KEY = 'ai_librarian_history';
const HIST_MAX = 20;

interface ExtractedBook {
  title: string;
  author: string;
}

/** 제목+저자로 고유 ISBN 생성 (서재 중복 방지용) */
function makeLibIsbn(title: string, author: string): string {
  const str = (title + '|' + (author ?? '')).toLowerCase();
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0; // unsigned 32-bit
  }
  return `lib_${h.toString(16).padStart(8, '0')}`;
}

const EXAMPLES = [
  '루이스 캐롤 관련 자료',
  '중학생을 위한 과학책 추천',
  '저작권법 관련 논문 목록',
  '도서관 관련 단행본 추천',
];

export default function LibrarianScreen() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [hitCount, setHitCount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [extractedBooks, setExtractedBooks] = useState<ExtractedBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const addBook = useShelfStore((s) => s.addBook);
  const shelfItems = useShelfStore((s) => s.items);
  const readingBooks = shelfItems.filter((i) => i.status === 'READING');
  const currentBook = readingBooks[0] ?? null;

  useEffect(() => {
    AsyncStorage.getItem(HIST_KEY).then((v) => {
      if (v) setHistory(JSON.parse(v));
    });
  }, []);

  async function saveHistory(q: string) {
    const next = [q, ...history.filter((x) => x !== q)].slice(0, HIST_MAX);
    setHistory(next);
    await AsyncStorage.setItem(HIST_KEY, JSON.stringify(next));
  }

  async function clearHistory() {
    setHistory([]);
    await AsyncStorage.removeItem(HIST_KEY);
  }

  function ask(q?: string) {
    const question = (q ?? query).trim();
    if (!question || loading) return;

    saveHistory(question);
    xhrRef.current?.abort();
    setLoading(true);
    setAnswer('');
    setHitCount(0);
    setExtractedBooks([]);
    setBooksLoading(false);

    // 검색 건수 먼저 조회
    fetch(`${API_BASE}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question, top_k: 5 }),
    })
      .then((r) => r.json())
      .then((d) => setHitCount(d.results?.length ?? 0))
      .catch(() => {});

    // AI 답변 스트리밍 (XMLHttpRequest onprogress)
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('POST', `${API_BASE}/api/ask`);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onprogress = () => {
      setAnswer(xhr.responseText);
      scrollRef.current?.scrollToEnd({ animated: false });
    };

    xhr.onload = () => {
      const finalAnswer = xhr.responseText;
      setAnswer(finalAnswer);
      setLoading(false);

      // 스트리밍 완료 후 언급 도서 추출
      if (finalAnswer.trim() && finalAnswer.length > 30) {
        setBooksLoading(true);
        fetch(`${API_BASE}/api/books-from-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer: finalAnswer, query: question }),
        })
          .then((r) => r.json())
          .then((d) => setExtractedBooks(d.books ?? []))
          .catch(() => {})
          .finally(() => setBooksLoading(false));
      }
    };

    xhr.onerror = () => {
      setAnswer('서버 연결 오류가 발생했습니다.\nAI 사서 서버(포트 8000)가 실행 중인지 확인해 주세요.');
      setLoading(false);
    };

    xhr.send(JSON.stringify({ query: question, top_k: 5 }));
  }

  function selectExample(ex: string) {
    setQuery(ex);
    ask(ex);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerBadge}>국립중앙도서관 Q&A 데이터 기반 RAG</Text>
        <Text style={styles.headerTitle}>AI 사서에게 물어보세요</Text>
        <Text style={styles.headerSub}>실제 사서 답변 5,907건을 근거로 응답합니다</Text>
      </View>

      {/* 검색창 */}
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="도서관 관련 질문을 입력하세요..."
            placeholderTextColor={Colors.textMuted}
            onSubmitEditing={() => ask()}
            returnKeyType="search"
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.askBtn, loading && styles.askBtnDisabled]}
            onPress={() => ask()}
            disabled={loading}
          >
            <Text style={styles.askBtnText}>{loading ? '...' : '검색'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {EXAMPLES.map((ex) => (
            <TouchableOpacity
              key={ex}
              style={styles.exBtn}
              onPress={() => selectExample(ex)}
              disabled={loading}
            >
              <Text style={styles.exBtnText}>{ex}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 검색 기록 */}
      {history.length > 0 && !answer && !loading && (
        <View style={styles.histWrap}>
          <View style={styles.histHead}>
            <Text style={styles.histTitle}>검색 기록</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.histClear}>전체 삭제</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {history.map((h) => (
              <TouchableOpacity
                key={h}
                style={styles.histItem}
                onPress={() => { setQuery(h); ask(h); }}
              >
                <Text style={styles.histItemText} numberOfLines={1}>{h}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 현재 읽는 책 맥락 바 */}
      {currentBook && (
        <CurrentBookBar
          title={currentBook.book.title}
          author={currentBook.book.author}
          extraCount={readingBooks.length - 1}
          onSuggest={(q) => { setQuery(q); ask(q); }}
          disabled={loading}
        />
      )}

      {/* 결과 */}
      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        keyboardShouldPersistTaps="handled"
      >
        {loading && !answer && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingText}>AI 사서가 자료를 찾고 있습니다...</Text>
          </View>
        )}

        {answer ? (
          <>
            {/* AI 답변 카드 */}
            <View style={styles.answerCard}>
              <View style={styles.cardHead}>
                <View style={styles.bar} />
                <Text style={styles.cardTitle}>AI 사서 답변</Text>
                {hitCount > 0 && (
                  <Text style={styles.cardSub}>참고 자료 {hitCount}건</Text>
                )}
                {loading && <ActivityIndicator size="small" color={Colors.primary} />}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.answerText} selectable>{answer}</Text>
              </View>
            </View>

            {/* 언급 도서 → 서재 담기 */}
            {(booksLoading || extractedBooks.length > 0) && (
              <BookSection
                books={extractedBooks}
                loading={booksLoading}
                shelfItems={shelfItems}
                onAddBook={(book) => addBook(book, 'WANT')}
              />
            )}
          </>
        ) : !loading ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyText}>
              도서관 이용 방법, 자료 추천, 저작권 등{'\n'}궁금한 것을 질문해 보세요
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── 현재 읽는 책 맥락 바 ─────────────────────────────────────────────────────

/** 책 제목·저자 기반 자동 제안 쿼리 4개 생성 */
function makeBookSuggestions(title: string, author: string): string[] {
  const short = title.length > 12 ? title.slice(0, 12) + '…' : title;
  return [
    `${author} 저자의 다른 작품 추천`,
    `${short} 관련 자료 찾기`,
    `${short}와 비슷한 책 추천`,
    `${short} 독서 토론 자료`,
  ];
}

function CurrentBookBar({
  title, author, extraCount, onSuggest, disabled,
}: {
  title: string;
  author: string;
  extraCount: number;
  onSuggest: (q: string) => void;
  disabled: boolean;
}) {
  const suggestions = makeBookSuggestions(title, author);

  return (
    <View style={styles.ctxBar}>
      {/* 책 정보 한 줄 */}
      <View style={styles.ctxTop}>
        <View style={styles.ctxBookIcon}>
          <Text style={styles.ctxBookEmoji}>📖</Text>
        </View>
        <View style={styles.ctxBookInfo}>
          <Text style={styles.ctxLabel}>지금 읽는 책</Text>
          <Text style={styles.ctxTitle} numberOfLines={1}>{title}</Text>
        </View>
        {extraCount > 0 && (
          <View style={styles.ctxExtraBadge}>
            <Text style={styles.ctxExtraText}>+{extraCount}</Text>
          </View>
        )}
      </View>

      {/* 제안 칩 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ctxChips}
      >
        {suggestions.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.ctxChip, disabled && styles.ctxChipDisabled]}
            onPress={() => onSuggest(s)}
            disabled={disabled}
            activeOpacity={0.75}
          >
            <Text style={styles.ctxChipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ── 언급 도서 서재 담기 섹션 ─────────────────────────────────────────────────

function BookSection({
  books, loading, shelfItems, onAddBook,
}: {
  books: ExtractedBook[];
  loading: boolean;
  shelfItems: ReturnType<typeof useShelfStore.getState>['items'];
  onAddBook: (book: Book) => void;
}) {
  if (!loading && books.length === 0) return null;

  return (
    <View style={styles.bookSection}>
      {/* 섹션 헤더 */}
      <View style={styles.bookSectionHeader}>
        <Text style={styles.bookSectionTitle}>📚 언급된 도서</Text>
        {loading && (
          <ActivityIndicator size="small" color={Colors.primary} style={styles.bookSpinner} />
        )}
        {!loading && books.length > 0 && (
          <Text style={styles.bookCount}>{books.length}권 · 서재에 담아보세요</Text>
        )}
      </View>

      {/* 추출 중 플레이스홀더 */}
      {loading && books.length === 0 && (
        <Text style={styles.bookExtractingText}>도서 정보를 분석하고 있습니다...</Text>
      )}

      {/* 도서 목록 */}
      {books.map((book, i) => {
        const isbn = makeLibIsbn(book.title, book.author);
        const alreadyIn = shelfItems.some((item) => item.book.isbn === isbn);

        function handleAdd() {
          if (alreadyIn) return;
          onAddBook({
            id: isbn,
            isbn,
            title: book.title,
            author: book.author || '저자 미상',
          });
        }

        return (
          <View key={isbn + i} style={[styles.bookRow, i < books.length - 1 && styles.bookRowBorder]}>
            <View style={styles.bookIconWrap}>
              <Text style={styles.bookEmoji}>📖</Text>
            </View>
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
              {!!book.author && (
                <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.addBtn, alreadyIn && styles.addBtnDone]}
              onPress={handleAdd}
              disabled={alreadyIn}
              activeOpacity={0.75}
            >
              <Text style={[styles.addBtnText, alreadyIn && styles.addBtnTextDone]}>
                {alreadyIn ? '✓ 서재' : '+ 담기'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    backgroundColor: Colors.darkMid,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  headerBadge: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: FontSize.sm,
  },

  searchWrap: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  searchRow: { flexDirection: 'row', gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  askBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    minWidth: 60,
    alignItems: 'center',
  },
  askBtnDisabled: { backgroundColor: Colors.primaryMid },
  askBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

  exBtn: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 6,
  },
  exBtnText: { color: Colors.primary, fontSize: FontSize.xs },

  content: { flex: 1 },
  contentInner: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },

  loadingBox: { alignItems: 'center', paddingTop: 60, gap: Spacing.lg },
  loadingText: { color: Colors.textSub, fontSize: FontSize.sm },

  answerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bar: { width: 3, height: 16, backgroundColor: Colors.primary, borderRadius: 2 },
  cardTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary, flex: 1 },
  cardSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  cardBody: { padding: Spacing.md },
  answerText: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 24,
  },

  // ── 언급 도서 섹션 ──
  bookSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
    overflow: 'hidden',
    ...Shadow.card,
  },
  bookSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.primaryLight,
  },
  bookSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    flex: 1,
  },
  bookSpinner: { marginLeft: 6 },
  bookCount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  bookExtractingText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    padding: Spacing.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: Spacing.sm,
  },
  bookRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bookIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookEmoji: { fontSize: 18 },
  bookInfo: { flex: 1, gap: 2 },
  bookTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 58,
    alignItems: 'center',
  },
  addBtnDone: {
    backgroundColor: Colors.greenLight,
    borderWidth: 1,
    borderColor: Colors.green,
  },
  addBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#fff',
  },
  addBtnTextDone: {
    color: Colors.green,
  },

  // ── 현재 읽는 책 맥락 바 ──
  ctxBar: {
    backgroundColor: Colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryMid,
    paddingTop: Spacing.sm,
    paddingBottom: 10,
    gap: 8,
  },
  ctxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  ctxBookIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctxBookEmoji: { fontSize: 15 },
  ctxBookInfo: { flex: 1 },
  ctxLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  ctxTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 1,
  },
  ctxExtraBadge: {
    backgroundColor: Colors.primaryMid,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ctxExtraText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  ctxChips: {
    paddingHorizontal: Spacing.md,
    gap: 6,
  },
  ctxChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
    borderRadius: Radius.full,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  ctxChipDisabled: { opacity: 0.45 },
  ctxChipText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },

  histWrap: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  histHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  histTitle: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted },
  histClear: { fontSize: FontSize.xs, color: Colors.textMuted },
  histItem: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    maxWidth: 160,
  },
  histItemText: { fontSize: FontSize.xs, color: Colors.textSub },

  emptyBox: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
});
