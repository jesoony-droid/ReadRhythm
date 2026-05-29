import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/tokens';
import { useShelfStore } from '../../src/store/shelfStore';
import { useSessionStore } from '../../src/store/sessionStore';
import { BookCover } from '../../src/components/book/BookCover';
import { GenreDonutChart } from '../../src/components/common/GenreDonutChart';
import type { ReadingStatus, ShelfItem } from '../../src/types';

const TABS: { key: ReadingStatus | 'ALL'; label: string }[] = [
  { key: 'ALL',     label: '전체' },
  { key: 'READING', label: '읽는 중' },
  { key: 'DONE',    label: '완독' },
  { key: 'WANT',    label: '읽고 싶어요' },
];

function predictDaysToFinish(
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
  return `D+${Math.ceil(remaining / avg)}`;
}

export default function LibraryScreen() {
  const router = useRouter();
  const items    = useShelfStore((s) => s.items);
  const sessions = useSessionStore((s) => s.sessions);
  const [activeTab, setActiveTab] = useState<ReadingStatus | 'ALL'>('ALL');

  const filtered = activeTab === 'ALL' ? items : items.filter((i) => i.status === activeTab);

  // 도넛 차트 데이터
  const statusData: Record<string, number> = {};
  items.forEach((it) => {
    const label =
      it.status === 'READING' ? '읽는 중' :
      it.status === 'DONE'    ? '완독' :
      it.status === 'WANT'    ? '읽고 싶어요' : '잠시 멈춤';
    statusData[label] = (statusData[label] ?? 0) + 1;
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>서재</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/search')}>
          <Text style={styles.addBtnText}>+ 책 추가</Text>
        </TouchableOpacity>
      </View>

      {/* 탭 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 독서 현황 — 중앙 정렬, 1.5배 */}
        {items.length >= 2 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>독서 현황</Text>
            <GenreDonutChart data={statusData} size={210} />
          </View>
        )}

        {/* 2열 그리드 */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>아직 담은 책이 없어요</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/search')}>
              <Text style={styles.emptyBtnText}>도서 검색하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((item) => (
              <GridCard
                key={item.id}
                item={item}
                sessions={sessions}
                onPress={() => router.push(`/book/${item.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── 2열 그리드 카드 (세로형) ──────────────────────────────────────────────────

function GridCard({
  item, sessions, onPress,
}: {
  item: ShelfItem & { spineColor: string };
  sessions: ReturnType<typeof useSessionStore.getState>['sessions'];
  onPress: () => void;
}) {
  const progress = item.book.totalPages
    ? Math.round((item.currentPage / item.book.totalPages) * 100)
    : null;
  const prediction = item.status === 'READING'
    ? predictDaysToFinish(item.currentPage, item.book.totalPages, sessions)
    : null;

  return (
    <Pressable style={styles.gridCard} onPress={onPress}>
      {/* 표지 */}
      <View style={styles.gridCover}>
        <BookCover
          coverUrl={item.book.coverUrl}
          title={item.book.title}
          spineColor={item.spineColor}
          width={styles.gridCover.width as number}
          height={styles.gridCover.height as number}
        />
      </View>

      {/* 정보 */}
      <View style={styles.gridInfo}>
        <Text style={styles.gridTitle} numberOfLines={2}>{item.book.title}</Text>
        <Text style={styles.gridAuthor} numberOfLines={1}>{item.book.author}</Text>
        <StatusBadge status={item.status} />

        {progress !== null && (
          <View style={styles.progressWrap}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {
                width: `${progress}%` as any,
                backgroundColor: item.status === 'DONE' ? Colors.green : Colors.primary,
              }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}
        {prediction && (
          <Text style={styles.predictionText}>📅 {prediction}</Text>
        )}
        {item.status === 'DONE' && item.rating ? (
          <View style={styles.ratingRow}>
            {[1,2,3,4,5].map((s) => (
              <Text key={s} style={[styles.ratingStar, (item.rating ?? 0) >= s && styles.ratingStarFilled]}>★</Text>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: ReadingStatus }) {
  const map: Record<ReadingStatus, { label: string; color: string; bg: string }> = {
    READING: { label: '읽는 중',    color: Colors.primary, bg: Colors.primaryLight },
    DONE:    { label: '완독',        color: Colors.green,   bg: Colors.greenLight },
    WANT:    { label: '읽고 싶어요', color: Colors.textSub, bg: Colors.border },
    PAUSED:  { label: '잠시 멈춤',  color: Colors.textMuted, bg: Colors.border },
  };
  const { label, color, bg } = map[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const COVER_W = 110;
const COVER_H = 155;

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, paddingTop: Spacing.lg,
  },
  title:      { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  addBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 8, paddingHorizontal: 16 },
  addBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: '#fff' },

  tabScroll: { flexGrow: 0 },
  tabRow:    { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.sm },
  tab: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: Radius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:       { fontSize: FontSize.sm, color: Colors.textSub, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 80 },

  // ── 독서 현황 차트 (중앙, 1.5배) ──
  chartCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm,
    ...Shadow.card, borderWidth: 1, borderColor: Colors.border,
  },
  chartTitle: { fontSize: 21, fontWeight: '700', color: Colors.text },

  // ── 2열 그리드 ──
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    overflow: 'hidden', ...Shadow.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  gridCover: {
    width: COVER_W,         // used for BookCover prop
    height: COVER_H,        // used for BookCover prop
    alignSelf: 'center',
    marginTop: Spacing.md,
  },
  gridInfo: {
    padding: Spacing.sm, gap: 4,
  },
  gridTitle:  { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text, lineHeight: 18 },
  gridAuthor: { fontSize: FontSize.xs, color: Colors.textSub },

  // ── 공통 ──
  badge: {
    alignSelf: 'flex-start', paddingVertical: 2, paddingHorizontal: 8,
    borderRadius: Radius.full, marginTop: 2,
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: '600' },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  progressBg:   { flex: 1, height: 4, backgroundColor: Colors.primaryLight, borderRadius: Radius.full },
  progressFill: { height: 4, borderRadius: Radius.full },
  progressText: { fontSize: FontSize.xs, color: Colors.textMuted, width: 28 },
  predictionText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '500' },
  ratingRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  ratingStar:       { fontSize: 12, color: Colors.border },
  ratingStarFilled: { color: Colors.gold },

  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyIcon:    { fontSize: 48 },
  emptyText:    { fontSize: FontSize.md, color: Colors.textMuted },
  emptyBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 10, paddingHorizontal: 24 },
  emptyBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: '#fff' },
});
