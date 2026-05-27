import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../src/constants/tokens';
import { useSessionStore } from '../src/store/sessionStore';
import { useShelfStore } from '../src/store/shelfStore';
import { useXpStore } from '../src/store/xpStore';
import { getLevelInfo } from '../src/utils/xp';
import { useQuotesStore } from '../src/store/quotesStore';
import { GenreDonutChart } from '../src/components/common/GenreDonutChart';

function getCurrentMonthLabel() {
  const now = new Date();
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
}

function buildGenreData(shelfItems: import('../src/types').ShelfItem[]) {
  const counts: Record<string, number> = {};
  shelfItems
    .filter((item) => item.status === 'DONE' || item.status === 'READING')
    .forEach((item) => {
      const genre = (item.book as any).genre ?? '기타';
      counts[genre] = (counts[genre] ?? 0) + 1;
    });
  return counts;
}

export default function MonthlyCardScreen() {
  const router = useRouter();
  const sessions = useSessionStore((s) => s.sessions);
  const shelfItems = useShelfStore((s) => s.items);
  const quotes = useQuotesStore((s) => s.quotes);
  const totalXp = useXpStore((s) => s.totalXp);
  const levelInfo = getLevelInfo(totalXp);
  const streak = useSessionStore((s) => s.getStreak());

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthSessions = sessions.filter((s) => s.startedAt >= monthStart);

  const monthMinutes = Math.floor(monthSessions.reduce((s, ss) => s + ss.durationSec, 0) / 60);
  const monthPages = monthSessions.reduce((s, ss) => s + Math.max(ss.pageEnd - ss.pageStart, 0), 0);
  const monthDone = shelfItems.filter((i) => i.status === 'DONE' && i.finishedAt && i.finishedAt >= monthStart).length;
  const monthQuotes = quotes.filter((q) => q.savedAt >= monthStart).length;

  const genreData = buildGenreData(shelfItems);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← 돌아가기</Text>
        </TouchableOpacity>
        <Text style={styles.title}>월간 포트폴리오</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Text style={styles.shareBtnText}>공유</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 헤더 카드 */}
        <View style={styles.heroCard}>
          <Text style={styles.heroMonth}>{getCurrentMonthLabel()}</Text>
          <Text style={styles.heroTitle}>이달의 독서 리포트</Text>
          <View style={styles.heroStats}>
            <HeroStat value={`${monthMinutes}분`} label="독서 시간" color="#A5B4FC" />
            <HeroStat value={`${monthDone}권`} label="완독" color="#86EFAC" />
            <HeroStat value={`${monthPages}p`} label="읽은 페이지" color="#FCA5A5" />
            <HeroStat value={`${monthQuotes}개`} label="수집 문장" color="#FCD34D" />
          </View>
        </View>

        {/* 레벨 & 스트릭 */}
        <View style={styles.row}>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardEmoji}>⭐</Text>
            <Text style={styles.cardBigVal}>{levelInfo.name}</Text>
            <Text style={styles.cardLabel}>현재 레벨 {levelInfo.level}</Text>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${Math.round(levelInfo.progressPercent * 100)}%` as any }]} />
            </View>
            <Text style={styles.cardSub}>{levelInfo.currentXp} XP</Text>
          </View>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardEmoji}>🔥</Text>
            <Text style={[styles.cardBigVal, { color: Colors.accent }]}>{streak}일</Text>
            <Text style={styles.cardLabel}>연속 독서 스트릭</Text>
          </View>
        </View>

        {/* 장르 도넛 차트 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>장르 분포</Text>
          <GenreDonutChart data={genreData} size={160} />
        </View>

        {/* 연간 리포트 진입 */}
        <TouchableOpacity style={styles.annualBtn} onPress={() => router.push('/annual-report')}>
          <Text style={styles.annualBtnEmoji}>📊</Text>
          <View>
            <Text style={styles.annualBtnTitle}>연간 독서 결산 보기</Text>
            <Text style={styles.annualBtnSub}>올해 전체 독서 여정을 슬라이드로</Text>
          </View>
          <Text style={styles.annualBtnArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={[styles.heroStatVal, { color }]}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md,
  },
  backText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  shareBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 6, paddingHorizontal: 14 },
  shareBtnText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },

  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 60 },

  heroCard: {
    backgroundColor: Colors.dark, borderRadius: Radius.md,
    padding: Spacing.lg, gap: Spacing.md,
  },
  heroMonth: { fontSize: FontSize.xs, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 2 },
  heroTitle: { fontSize: FontSize.xl, fontWeight: '700', color: '#fff' },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between' },
  heroStat: { alignItems: 'center', gap: 3 },
  heroStatVal: { fontSize: FontSize.lg, fontWeight: '700' },
  heroStatLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.4)' },

  row: { flexDirection: 'row', gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, gap: 6, ...Shadow.card,
  },
  cardEmoji: { fontSize: 28 },
  cardBigVal: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  cardLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  xpBarBg: { height: 4, backgroundColor: Colors.primaryLight, borderRadius: Radius.full },
  xpBarFill: { height: 4, backgroundColor: Colors.primary, borderRadius: Radius.full },
  cardSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },

  annualBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.primaryMid,
  },
  annualBtnEmoji: { fontSize: 28 },
  annualBtnTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  annualBtnSub: { fontSize: FontSize.xs, color: Colors.textSub, marginTop: 2 },
  annualBtnArrow: { marginLeft: 'auto', fontSize: 22, color: Colors.primary, fontWeight: '700' },
});
