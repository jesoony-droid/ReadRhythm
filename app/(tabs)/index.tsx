import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/tokens';
import { useShelfStore } from '../../src/store/shelfStore';
import { useSessionStore } from '../../src/store/sessionStore';
import { BookCover } from '../../src/components/book/BookCover';
import { seedDemoData } from '../../src/utils/seedDemoData';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function getThisWeekDays(): string[] {
  const today = new Date();
  const dow = today.getDay(); // 0=일, 1=월 ... 6=토
  const mondayOffset = (dow + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - mondayOffset + i);
    return d.toISOString().slice(0, 10);
  });
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const router = useRouter();
  const items = useShelfStore((s) => s.items);
  const reading = items.filter((i) => i.status === 'READING');
  const { todayMinutes, todayPages, getDayStats, getStreak } = useSessionStore();
  const dailyGoalMinutes = useSessionStore((s) => s.dailyGoalMinutes);
  const dailyGoalPages   = useSessionStore((s) => s.dailyGoalPages);
  const todayMin = todayMinutes();
  const todayPg  = todayPages();
  const streak   = getStreak();

  const weekDays = getThisWeekDays();
  const todayStr = getTodayStr();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>좋은 아침이에요 👋</Text>
            <Text style={styles.subtitle}>오늘의 독서를 시작해볼까요?</Text>
          </View>
          {items.length === 0 && (
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => {
                seedDemoData();
                Alert.alert('데모 데이터 추가됨', '샘플 책·세션·문장이 추가됐어요!');
              }}
            >
              <Text style={styles.demoBtnText}>데모 채우기</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 오늘의 목표 */}
        <View style={styles.goalCard}>
          <Text style={styles.goalTitle}>오늘의 목표</Text>
          <View style={styles.goalRow}>
            <GoalItem label="시간" value={`${todayMin} / ${dailyGoalMinutes}분`} percent={Math.min(todayMin / dailyGoalMinutes, 1)} />
            <GoalItem label="페이지" value={`${todayPg} / ${dailyGoalPages}p`} percent={Math.min(todayPg / dailyGoalPages, 1)} />
          </View>
        </View>

        {/* 지금 읽는 책 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>지금 읽는 책</Text>
          {reading.length === 0 ? (
            <TouchableOpacity style={styles.emptyCard} onPress={() => router.push('/search')}>
              <Text style={styles.emptyText}>+ 읽고 있는 책을 추가해보세요</Text>
            </TouchableOpacity>
          ) : (
            reading.map((item) => {
              const progress = item.book.totalPages
                ? Math.round((item.currentPage / item.book.totalPages) * 100)
                : null;
              return (
                <Pressable key={item.id} style={styles.readingCard} onPress={() => router.push(`/book/${item.id}`)}>
                  <BookCover
                    coverUrl={item.book.coverUrl}
                    title={item.book.title}
                    spineColor={item.spineColor}
                    width={52}
                    height={72}
                  />
                  <View style={styles.readingInfo}>
                    <Text style={styles.readingTitle} numberOfLines={2}>{item.book.title}</Text>
                    <Text style={styles.readingAuthor}>{item.book.author}</Text>
                    {progress !== null && (
                      <View style={styles.progressWrap}>
                        <View style={styles.progressBg}>
                          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
                        </View>
                        <Text style={styles.progressText}>{progress}%</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* AI 코치 카드 */}
        <TouchableOpacity style={styles.coachCard} onPress={() => router.push('/coach-report')}>
          <View style={styles.coachLeft}>
            <View style={styles.coachIconWrap}>
              <Text style={styles.coachIcon}>🤖</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.coachTitle}>AI 독서 코치</Text>
              <Text style={styles.coachSub}>
                {streak > 0
                  ? `🔥 ${streak}일 연속 독서 중 · 주간 리포트 확인하기`
                  : '오늘의 독서 인사이트를 확인해보세요'}
              </Text>
            </View>
          </View>
          <Text style={styles.coachArrow}>›</Text>
        </TouchableOpacity>

        {/* AI 맞춤 추천 배너 */}
        <TouchableOpacity style={styles.aiBanner} onPress={() => router.push('/recommend')}>
          <View style={styles.aiBannerLeft}>
            <Text style={styles.aiBannerEmoji}>✨</Text>
            <View>
              <Text style={styles.aiBannerTitle}>AI 맞춤 추천</Text>
              <Text style={styles.aiBannerSub}>내 독서 패턴으로 궁합 맞는 책 찾기</Text>
            </View>
          </View>
          <Text style={styles.aiBannerArrow}>›</Text>
        </TouchableOpacity>

        {/* 이번 주 독서 — 실데이터 연동 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이번 주 독서</Text>
          <View style={styles.weekCard}>
            <View style={styles.weekRow}>
              {weekDays.map((dateStr, i) => {
                const stats = getDayStats(dateStr);
                const isToday = dateStr === todayStr;
                const done = stats.hasSession;
                const goalAchieved = stats.goalAchieved;
                return (
                  <View key={dateStr} style={styles.dayDot}>
                    <View style={[
                      styles.dot,
                      done && !goalAchieved && styles.dotDone,
                      goalAchieved && styles.dotGoal,
                      isToday && !done && styles.dotToday,
                    ]}>
                      {done && <Text style={styles.dotCheck}>{goalAchieved ? '★' : '✓'}</Text>}
                    </View>
                    <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{DAY_LABELS[i]}</Text>
                  </View>
                );
              })}
            </View>
            {streak > 0 && (
              <Text style={styles.streakMsg}>🔥 {streak}일 연속 독서 중</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalItem({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <View style={styles.goalItem}>
      <Text style={styles.goalLabel}>{label}</Text>
      <Text style={styles.goalValue}>{value}</Text>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${Math.round(percent * 100)}%` as any }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 80 },
  header: { paddingTop: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSub, marginTop: 4 },
  demoBtn: {
    backgroundColor: Colors.primaryLight, borderRadius: Radius.full,
    paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.primaryMid,
  },
  demoBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },

  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadow.card,
  },
  goalTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSub, marginBottom: Spacing.sm },
  goalRow: { flexDirection: 'row', gap: Spacing.md },
  goalItem: { flex: 1 },
  goalLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2 },
  goalValue: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: 6 },

  section: {},
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },

  emptyCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.xl,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
  },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },

  readingCard: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.md, ...Shadow.card,
  },
  readingInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  readingTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  readingAuthor: { fontSize: FontSize.sm, color: Colors.textSub },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  progressBg: { flex: 1, height: 4, backgroundColor: Colors.primaryLight, borderRadius: Radius.full },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: Radius.full },
  progressText: { fontSize: FontSize.xs, color: Colors.textMuted, width: 30 },

  // AI 코치 카드
  coachCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A2E', borderRadius: Radius.md,
    padding: Spacing.md, gap: Spacing.sm, ...Shadow.card,
  },
  coachLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  coachIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  coachIcon: { fontSize: 20 },
  coachTitle: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  coachSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  coachArrow: { fontSize: 22, color: Colors.primary, fontWeight: '700' },

  // AI 추천 배너
  aiBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.dark, borderRadius: Radius.md, padding: Spacing.md, ...Shadow.card,
  },
  aiBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiBannerEmoji: { fontSize: 28 },
  aiBannerTitle: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  aiBannerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  aiBannerArrow: { fontSize: 22, color: Colors.primary, fontWeight: '700' },

  // 이번 주 독서
  weekCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, ...Shadow.card,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayDot: { alignItems: 'center', gap: 6, flex: 1 },
  dot: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dotDone: { backgroundColor: Colors.primaryLight, borderWidth: 2, borderColor: Colors.primary },
  dotGoal: { backgroundColor: Colors.green },
  dotToday: { borderWidth: 2, borderColor: Colors.primary, backgroundColor: 'transparent' },
  dotCheck: { fontSize: 13, fontWeight: '700', color: '#fff' },
  dayLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  dayLabelToday: { color: Colors.primary, fontWeight: '700' },
  streakMsg: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 10 },
});
