import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/tokens';
import { useShelfStore } from '../../src/store/shelfStore';
import { getBookByIsbn } from '../../src/api/books';
import type { Book, ReadingStatus } from '../../src/types';

const STATUS_OPTIONS: { key: ReadingStatus; label: string; desc: string }[] = [
  { key: 'READING', label: '읽는 중',   desc: '지금 바로 시작해요' },
  { key: 'WANT',    label: '읽고 싶어요', desc: '위시리스트에 담아요' },
  { key: 'DONE',    label: '완독했어요', desc: '이미 읽은 책이에요' },
];

const STATUS_LABEL: Record<ReadingStatus, string> = {
  READING: '읽는 중', WANT: '읽고 싶어요', DONE: '완독', PAUSED: '잠시 멈춤',
};

export default function BookPreviewScreen() {
  const params = useLocalSearchParams<{
    isbn: string; title: string; author: string;
    cover?: string; publisher?: string; publishedAt?: string;
  }>();
  const router = useRouter();
  const { items, addBook } = useShelfStore();
  const [picked, setPicked] = useState<ReadingStatus | null>(null);
  const [added, setAdded] = useState(false);

  // query params 로 넘어온 기본 데이터 (즉시 표시용)
  const fallback: Book = {
    id: params.isbn,
    isbn: params.isbn,
    title: params.title ?? '',
    author: params.author ?? '',
    coverUrl: params.cover || undefined,
    publisher: params.publisher || undefined,
    publishedAt: params.publishedAt || undefined,
  };

  // API로 상세 데이터 보강 (description 등)
  const { data: apiBook, isFetching } = useQuery({
    queryKey: ['bookDetail', params.isbn],
    queryFn: () => getBookByIsbn(params.isbn),
    staleTime: 1000 * 60 * 60, // 1시간 캐시
    enabled: !!params.isbn,
  });

  const book: Book = apiBook ?? fallback;

  const existing = items.find((i) => i.book.isbn === params.isbn);
  const isInShelf = !!existing || added;

  function handleAdd() {
    if (!picked) return;
    addBook(book, picked);
    setAdded(true);
  }

  function goToShelfItem() {
    const item = items.find((i) => i.book.isbn === params.isbn);
    if (item) router.replace(`/book/${item.id}`);
  }

  const displayCover = book.coverUrl || params.cover;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← 검색</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>도서 정보</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* 커버 + 기본 정보 */}
        <View style={styles.hero}>
          {displayCover ? (
            <Image source={{ uri: displayCover }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Text style={styles.coverPlaceholderText}>{book.title?.slice(0, 2)}</Text>
            </View>
          )}
          <Text style={styles.titleText}>{book.title}</Text>
          <Text style={styles.authorText}>{book.author}</Text>
          <View style={styles.metaRow}>
            {book.publisher ? <Text style={styles.metaText}>{book.publisher}</Text> : null}
            {book.publisher && book.publishedAt ? <Text style={styles.metaDot}>·</Text> : null}
            {book.publishedAt ? (
              <Text style={styles.metaText}>{book.publishedAt.slice(0, 4)}년</Text>
            ) : null}
          </View>
        </View>

        {/* 책 소개 */}
        {isFetching ? (
          <View style={styles.descLoading}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.descLoadingText}>책 정보 불러오는 중...</Text>
          </View>
        ) : book.description ? (
          <View style={styles.descCard}>
            <Text style={styles.descTitle}>책 소개</Text>
            <Text style={styles.descText}>{book.description}</Text>
          </View>
        ) : null}

        {/* 서재 상태 */}
        {isInShelf ? (
          <View style={styles.inShelfCard}>
            <Text style={styles.inShelfEmoji}>📚</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.inShelfTitle}>서재에 담겨 있어요</Text>
              <Text style={styles.inShelfSub}>
                {existing ? STATUS_LABEL[existing.status] : picked ? STATUS_LABEL[picked] : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.goToShelfBtn} onPress={goToShelfItem}>
              <Text style={styles.goToShelfText}>상세 보기 →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>서재에 담기</Text>
              <View style={styles.statusList}>
                {STATUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.statusRow, picked === opt.key && styles.statusRowActive]}
                    onPress={() => setPicked(opt.key)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radioOuter, picked === opt.key && styles.radioOuterActive]}>
                      {picked === opt.key && <View style={styles.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.statusLabel, picked === opt.key && styles.statusLabelActive]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.statusDesc}>{opt.desc}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.addBtn, !picked && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!picked}
            >
              <Text style={styles.addBtnText}>
                {picked
                  ? `"${STATUS_OPTIONS.find((o) => o.key === picked)?.label}"로 담기`
                  : '상태를 선택해주세요'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md,
  },
  backText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600', width: 48 },
  screenTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },

  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 60 },

  hero: {
    alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.lg, ...Shadow.card,
  },
  cover: {
    width: 120, height: 170, borderRadius: Radius.sm,
    backgroundColor: Colors.border, marginBottom: Spacing.sm,
  },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  coverPlaceholderText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  titleText: {
    fontSize: FontSize.xl, fontWeight: '700', color: Colors.text,
    textAlign: 'center', lineHeight: 28,
  },
  authorText: { fontSize: FontSize.md, color: Colors.textSub },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.sm, color: Colors.textMuted },
  metaDot: { fontSize: FontSize.sm, color: Colors.border },

  descLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', padding: Spacing.md },
  descLoadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  descCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, gap: Spacing.sm, ...Shadow.card,
  },
  descTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSub },
  descText: { fontSize: FontSize.sm, color: Colors.textSub, lineHeight: 22 },

  inShelfCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.greenLight, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.green,
  },
  inShelfEmoji: { fontSize: 28 },
  inShelfTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.green },
  inShelfSub: { fontSize: FontSize.sm, color: Colors.textSub, marginTop: 2 },
  goToShelfBtn: {
    backgroundColor: Colors.green, borderRadius: Radius.full,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  goToShelfText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  statusList: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    overflow: 'hidden', ...Shadow.card, borderWidth: 1, borderColor: Colors.border,
  },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  statusRowActive: { backgroundColor: Colors.primaryLight },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  statusLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSub },
  statusLabelActive: { color: Colors.primary },
  statusDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  addBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 16, alignItems: 'center', ...Shadow.card,
  },
  addBtnDisabled: { backgroundColor: Colors.primaryMid },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
