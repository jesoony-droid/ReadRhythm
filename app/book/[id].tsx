import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/tokens';
import { useShelfStore } from '../../src/store/shelfStore';
import { useSessionStore } from '../../src/store/sessionStore';
import { BookCover } from '../../src/components/book/BookCover';
import type { ReadingStatus } from '../../src/types';

const STATUS_OPTIONS: { key: ReadingStatus; label: string }[] = [
  { key: 'READING', label: '읽는 중' },
  { key: 'WANT', label: '읽고 싶어요' },
  { key: 'DONE', label: '완독' },
  { key: 'PAUSED', label: '잠시 멈춤' },
];

function calcPrediction(
  currentPage: number,
  totalPages: number | undefined,
  sessions: ReturnType<typeof useSessionStore.getState>['sessions']
): string | null {
  if (!totalPages || currentPage >= totalPages) return null;
  const remaining = totalPages - currentPage;
  const recent = sessions.slice(-10);
  const avg = recent.length > 0
    ? recent.reduce((s, sess) => s + Math.max(sess.pageEnd - sess.pageStart, 0), 0) / recent.length
    : 0;
  if (avg < 1) return null;
  return `D+${Math.ceil(remaining / avg)} 완독 예측`;
}

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, updateStatus, updatePage, updateRating, updateMemo, removeItem } = useShelfStore();
  const sessions = useSessionStore((s) => s.sessions);
  const item = items.find((i) => i.id === id);

  const [pageInput, setPageInput] = useState(String(item?.currentPage ?? 0));
  const [memoInput, setMemoInput] = useState(item?.memo ?? '');
  const [memoEditing, setMemoEditing] = useState(false);

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>책을 찾을 수 없어요</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progress = item.book.totalPages
    ? Math.round((item.currentPage / item.book.totalPages) * 100)
    : null;

  const prediction = item.status === 'READING'
    ? calcPrediction(item.currentPage, item.book.totalPages, sessions)
    : null;

  const handleSavePage = () => {
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && p >= 0) updatePage(item.id, p);
  };

  const handleSaveMemo = () => {
    updateMemo(item.id, memoInput.trim());
    setMemoEditing(false);
  };

  const handleRemove = () => {
    Alert.alert('서재에서 삭제', `"${item.book.title}"을 서재에서 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => { removeItem(item.id); router.back(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← 서재</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRemove}>
          <Text style={styles.deleteText}>삭제</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 책 헤더 */}
        <View style={styles.bookHeader}>
          <BookCover
            coverUrl={item.book.coverUrl}
            title={item.book.title}
            spineColor={item.spineColor}
            width={96}
            height={136}
          />
          <View style={styles.bookMeta}>
            <Text style={styles.bookTitle}>{item.book.title}</Text>
            <Text style={styles.bookAuthor}>{item.book.author}</Text>
            {item.book.publisher && (
              <Text style={styles.bookPublisher}>{item.book.publisher}</Text>
            )}
            {/* 완독 날짜 예측 */}
            {prediction && (
              <View style={styles.predictionBadge}>
                <Text style={styles.predictionText}>📅 {prediction}</Text>
              </View>
            )}
            {/* 완독일 */}
            {item.status === 'DONE' && item.finishedAt && (
              <View style={styles.predictionBadge}>
                <Text style={[styles.predictionText, { color: Colors.green }]}>
                  ✅ {new Date(item.finishedAt).toLocaleDateString('ko-KR')} 완독
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 독서 상태 */}
        <Section title="독서 상태">
          <View style={styles.statusGrid}>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.statusBtn, item.status === opt.key && styles.statusBtnActive]}
                onPress={() => updateStatus(item.id, opt.key)}
              >
                <Text style={[styles.statusBtnText, item.status === opt.key && styles.statusBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* 읽은 페이지 */}
        <Section title="읽은 페이지">
          <View style={styles.pageRow}>
            <TextInput
              style={styles.pageInput}
              value={pageInput}
              onChangeText={setPageInput}
              keyboardType="number-pad"
              onBlur={handleSavePage}
              onSubmitEditing={handleSavePage}
            />
            {item.book.totalPages && (
              <Text style={styles.pageTotal}> / {item.book.totalPages}p</Text>
            )}
            <TouchableOpacity style={styles.saveBtnSmall} onPress={handleSavePage}>
              <Text style={styles.saveBtnText}>저장</Text>
            </TouchableOpacity>
          </View>
          {progress !== null && (
            <View style={styles.progressWrap}>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
          )}
        </Section>

        {/* 별점 */}
        <Section title="별점">
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => updateRating(item.id, star)}>
                <Text style={[styles.star, (item.rating ?? 0) >= star && styles.starFilled]}>★</Text>
              </TouchableOpacity>
            ))}
            {item.rating ? <Text style={styles.ratingText}>{item.rating}.0</Text> : null}
          </View>
        </Section>

        {/* 독서 메모 (완독·읽는 중 모두 가능) */}
        <Section title="독서 메모">
          {memoEditing ? (
            <View style={styles.memoEditWrap}>
              <TextInput
                style={styles.memoInput}
                value={memoInput}
                onChangeText={setMemoInput}
                placeholder="이 책에 대한 감상을 남겨보세요"
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
                autoFocus
              />
              <View style={styles.memoBtnRow}>
                <TouchableOpacity style={styles.memoCancelBtn} onPress={() => { setMemoInput(item.memo ?? ''); setMemoEditing(false); }}>
                  <Text style={styles.memoCancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.memoSaveBtn} onPress={handleSaveMemo}>
                  <Text style={styles.memoSaveText}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : item.memo ? (
            <TouchableOpacity onPress={() => setMemoEditing(true)}>
              <Text style={styles.memoText}>{item.memo}</Text>
              <Text style={styles.memoEditHint}>탭하여 수정</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.memoEmptyBtn} onPress={() => setMemoEditing(true)}>
              <Text style={styles.memoEmptyText}>+ 감상 메모 남기기</Text>
            </TouchableOpacity>
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md,
  },
  backText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },
  deleteText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.red },
  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 60 },
  bookHeader: {
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, ...Shadow.card,
  },
  bookMeta: { flex: 1, gap: 4, justifyContent: 'center' },
  bookTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, lineHeight: 24 },
  bookAuthor: { fontSize: FontSize.sm, color: Colors.textSub },
  bookPublisher: { fontSize: FontSize.xs, color: Colors.textMuted },
  predictionBadge: {
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingVertical: 3, paddingHorizontal: 10,
  },
  predictionText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSub },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, ...Shadow.card },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: {
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  statusBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statusBtnText: { fontSize: FontSize.sm, color: Colors.textSub, fontWeight: '500' },
  statusBtnTextActive: { color: '#fff', fontWeight: '700' },
  pageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageInput: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 6,
    fontSize: FontSize.md, fontWeight: '700', color: Colors.text, minWidth: 70, textAlign: 'center',
  },
  pageTotal: { fontSize: FontSize.md, color: Colors.textMuted },
  saveBtnSmall: {
    marginLeft: 'auto', backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full, paddingVertical: 6, paddingHorizontal: 14,
  },
  saveBtnText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  progressBg: { flex: 1, height: 6, backgroundColor: Colors.primaryLight, borderRadius: Radius.full },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: Radius.full },
  progressText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary, width: 36 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { fontSize: 28, color: Colors.border },
  starFilled: { color: Colors.gold },
  ratingText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.gold, marginLeft: 8 },
  // 메모
  memoEditWrap: { gap: Spacing.sm },
  memoInput: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md,
    color: Colors.text, minHeight: 100,
  },
  memoBtnRow: { flexDirection: 'row', gap: Spacing.sm },
  memoCancelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.full,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  memoCancelText: { fontSize: FontSize.sm, color: Colors.textSub, fontWeight: '600' },
  memoSaveBtn: { flex: 2, paddingVertical: 10, borderRadius: Radius.full, alignItems: 'center', backgroundColor: Colors.primary },
  memoSaveText: { fontSize: FontSize.sm, color: '#fff', fontWeight: '700' },
  memoText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },
  memoEditHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  memoEmptyBtn: {
    paddingVertical: 14, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center',
  },
  memoEmptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  notFoundText: { fontSize: FontSize.md, color: Colors.textMuted },
  backLink: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '600' },
});
