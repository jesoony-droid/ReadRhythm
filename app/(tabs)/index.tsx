import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMemo, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/tokens';
import { useShelfStore } from '../../src/store/shelfStore';
import { useSessionStore } from '../../src/store/sessionStore';
import { useTimerStore } from '../../src/store/timerStore';
import { BookCover } from '../../src/components/book/BookCover';
import { seedDemoData } from '../../src/utils/seedDemoData';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

function getThisWeekDays(): string[] {
  const today = new Date();
  const dow = today.getDay();
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

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 4  && hour < 6)  return { text: '일찍 일어나셨네요',    emoji: '🌅' };
  if (hour >= 6  && hour < 11) return { text: '좋은 아침이에요',      emoji: '☀️' };
  if (hour >= 11 && hour < 14) return { text: '점심 시간이에요',      emoji: '🌤' };
  if (hour >= 14 && hour < 18) return { text: '좋은 오후예요',        emoji: '📖' };
  if (hour >= 18 && hour < 21) return { text: '오늘 하루 어떠셨나요', emoji: '🌇' };
  return { text: '오늘도 수고하셨어요', emoji: '🌙' };
}

function getTodayLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAY_KO[d.getDay()]}요일`;
}

// WMO 날씨 코드 → 이모지 + 한국어
function decodeWeather(code: number): { emoji: string; label: string } {
  if (code === 0)              return { emoji: '☀️',  label: '맑음' };
  if (code <= 2)               return { emoji: '🌤',  label: '구름 조금' };
  if (code === 3)              return { emoji: '☁️',  label: '흐림' };
  if (code <= 48)              return { emoji: '🌫',  label: '안개' };
  if (code <= 55)              return { emoji: '🌦',  label: '이슬비' };
  if (code <= 65)              return { emoji: '🌧',  label: '비' };
  if (code <= 77)              return { emoji: '❄️',  label: '눈' };
  if (code <= 82)              return { emoji: '🌩',  label: '소나기' };
  if (code <= 86)              return { emoji: '🌨',  label: '눈보라' };
  return                              { emoji: '⛈',  label: '뇌우' };
}

interface WeatherInfo {
  temp: number;
  emoji: string;
  label: string;
}

function useWeather(): WeatherInfo | null {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const { latitude, longitude } = loc.coords;
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
        );
        const data = await res.json();
        if (cancelled) return;
        const temp = Math.round(data.current.temperature_2m);
        const { emoji, label } = decodeWeather(data.current.weather_code);
        setWeather({ temp, emoji, label });
      } catch {
        // 날씨 로드 실패 시 표시 안함
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return weather;
}

export default function HomeScreen() {
  const router = useRouter();
  const items = useShelfStore((s) => s.items);
  const reading = items.filter((i) => i.status === 'READING');
  const { todayMinutes, todayPages, getDayStats, getStreak } = useSessionStore();
  const dailyGoalMinutes = useSessionStore((s) => s.dailyGoalMinutes);
  const dailyGoalPages   = useSessionStore((s) => s.dailyGoalPages);
  const timerStart = useTimerStore((s) => s.start);
  const isTimerRunning = useTimerStore((s) => s.isRunning);

  const todayMin = todayMinutes();
  const todayPg  = todayPages();
  const streak   = getStreak();
  const weekDays = getThisWeekDays();
  const todayStr = getTodayStr();

  const greeting   = useMemo(() => getGreeting(), []);
  const todayLabel = useMemo(() => getTodayLabel(), []);
  const weather    = useWeather();

  const goalDone = todayMin >= dailyGoalMinutes && todayPg >= dailyGoalPages;

  function handleQuickStart(shelfItemId: string, currentPage: number) {
    if (isTimerRunning) {
      Alert.alert('타이머 진행 중', '현재 타이머가 실행 중이에요. 타이머 화면으로 이동할까요?', [
        { text: '취소', style: 'cancel' },
        { text: '이동', onPress: () => router.push('/(tabs)/timer') },
      ]);
      return;
    }
    timerStart(shelfItemId, 'free', currentPage);
    router.push('/(tabs)/timer');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* 헤더 */}
        <View style={styles.header}>
          {/* 좌측: 날짜 + 날씨 */}
          <View style={styles.headerLeft}>
            <Text style={styles.todayLabel}>{todayLabel}</Text>
            {weather ? (
              <View style={styles.weatherRow}>
                <Text style={styles.weatherEmoji}>{weather.emoji}</Text>
                <Text style={styles.weatherText}>{weather.label} · {weather.temp}°C</Text>
              </View>
            ) : (
              <View style={styles.weatherRow}>
                <Text style={styles.weatherText}>날씨 불러오는 중...</Text>
              </View>
            )}
          </View>

          {/* 우측: 인사말 + 데모버튼 */}
          <View style={styles.headerRight}>
            <Text style={styles.greeting}>{greeting.emoji}</Text>
            <Text style={styles.greetingText}>{greeting.text}</Text>
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
        </View>

        {/* 오늘의 목표 */}
        <View style={[styles.goalCard, goalDone && styles.goalCardDone]}>
          <View style={styles.goalCardHeader}>
            <Text style={styles.goalTitle}>오늘의 목표</Text>
            {goalDone && (
              <View style={styles.goalDoneBadge}>
                <Text style={styles.goalDoneText}>🎉 달성!</Text>
              </View>
            )}
          </View>
          <View style={styles.goalRow}>
            <GoalItem
              label="시간"
              value={`${todayMin} / ${dailyGoalMinutes}분`}
              percent={Math.min(todayMin / dailyGoalMinutes, 1)}
            />
            <View style={styles.goalDivider} />
            <GoalItem
              label="페이지"
              value={`${todayPg} / ${dailyGoalPages}p`}
              percent={Math.min(todayPg / dailyGoalPages, 1)}
              color={Colors.green}
            />
          </View>
        </View>

        {/* 지금 읽는 책 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>지금 읽는 책</Text>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Text style={styles.sectionAction}>+ 추가</Text>
            </TouchableOpacity>
          </View>

          {reading.length === 0 ? (
            <TouchableOpacity style={styles.emptyCard} onPress={() => router.push('/search')}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyText}>읽고 있는 책을 추가해보세요</Text>
              <Text style={styles.emptyHint}>도서 검색 →</Text>
            </TouchableOpacity>
          ) : (
            reading.map((item) => {
              const progress = item.book.totalPages
                ? Math.round((item.currentPage / item.book.totalPages) * 100)
                : null;
              return (
                <Pressable
                  key={item.id}
                  style={styles.readingCard}
                  onPress={() => router.push(`/book/${item.id}`)}
                >
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
                  <TouchableOpacity
                    style={[styles.startBtn, isTimerRunning && styles.startBtnActive]}
                    onPress={() => handleQuickStart(item.id, item.currentPage)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.startBtnIcon}>{isTimerRunning ? '⏱' : '▶'}</Text>
                    <Text style={styles.startBtnText}>{isTimerRunning ? '진행중' : '시작'}</Text>
                  </TouchableOpacity>
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

        {/* 이번 주 독서 */}
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

function GoalItem({
  label, value, percent, color = Colors.primary,
}: {
  label: string; value: string; percent: number; color?: string;
}) {
  return (
    <View style={styles.goalItem}>
      <Text style={styles.goalLabel}>{label}</Text>
      <Text style={[styles.goalValue, percent >= 1 && { color }]}>{value}</Text>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${Math.round(percent * 100)}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 80 },

  // ── 헤더 ──
  header: {
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  headerLeft: { flex: 1, gap: 6 },
  todayLabel: {
    fontSize: FontSize.md, fontWeight: '700', color: Colors.text,
  },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  weatherEmoji: { fontSize: FontSize.md },
  weatherText: { fontSize: FontSize.sm, color: Colors.textSub, fontWeight: '500' },

  headerRight: { alignItems: 'flex-end', gap: 4 },
  greeting: { fontSize: 28 },
  greetingText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSub, textAlign: 'right' },
  demoBtn: {
    backgroundColor: Colors.primaryLight, borderRadius: Radius.full,
    paddingVertical: 5, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.primaryMid,
    marginTop: 4,
  },
  demoBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },

  // ── 목표 카드 ──
  goalCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  goalCardDone: { borderColor: Colors.green, borderWidth: 1.5 },
  goalCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  goalTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSub, flex: 1 },
  goalDoneBadge: {
    backgroundColor: Colors.greenLight, borderRadius: Radius.full,
    paddingVertical: 2, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.green,
  },
  goalDoneText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.green },
  goalRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'stretch' },
  goalDivider: { width: 1, backgroundColor: Colors.border },
  goalItem: { flex: 1, gap: 4 },
  goalLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  goalValue: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },

  // ── 공통 섹션 ──
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  sectionAction: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },

  // ── 빈 서재 ──
  emptyCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.xl,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
    borderStyle: 'dashed', gap: 6,
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSub, fontWeight: '500' },
  emptyHint: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },

  // ── 읽는 책 카드 ──
  readingCard: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.md,
    ...Shadow.card, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  readingInfo: { flex: 1, gap: 4 },
  readingTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  readingAuthor: { fontSize: FontSize.sm, color: Colors.textSub },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  progressBg: { flex: 1, height: 4, backgroundColor: Colors.primaryLight, borderRadius: Radius.full },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: Radius.full },
  progressText: { fontSize: FontSize.xs, color: Colors.textMuted, width: 30 },

  startBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 10, paddingHorizontal: 12, gap: 2, minWidth: 52,
  },
  startBtnActive: { backgroundColor: Colors.accent },
  startBtnIcon: { fontSize: 14, color: '#fff' },
  startBtnText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },

  // ── AI 코치 카드 ──
  coachCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, gap: Spacing.sm, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  coachLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  coachIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  coachIcon: { fontSize: 20 },
  coachTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  coachSub: { fontSize: FontSize.xs, color: Colors.textSub, marginTop: 2 },
  coachArrow: { fontSize: 22, color: Colors.primary, fontWeight: '700' },

  // ── AI 추천 배너 ──
  aiBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.primaryMid,
  },
  aiBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiBannerEmoji: { fontSize: 28 },
  aiBannerTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  aiBannerSub: { fontSize: FontSize.xs, color: Colors.textSub, marginTop: 2 },
  aiBannerArrow: { fontSize: 22, color: Colors.primary, fontWeight: '700' },

  // ── 이번 주 독서 ──
  weekCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayDot: { alignItems: 'center', gap: 6, flex: 1 },
  dot: {
    width: 36, height: 36, borderRadius: 18,
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
