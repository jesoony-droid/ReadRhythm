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

const DAILY_QUOTES = [
  '책 속에 길이 있다.',
  '오늘 읽은 한 페이지가 내일의 나를 만든다.',
  '독서는 마음의 여행이다.',
  '좋은 책 한 권은 천 명의 친구와 같다.',
  '지식에 투자하는 것이 최고의 이자를 낳는다.',
  '배움에는 끝이 없다.',
  '꾸준함이 재능을 이긴다.',
  '매일 조금씩, 그것이 비결이다.',
  '생각하는 대로 살지 않으면, 사는 대로 생각하게 된다.',
  '한 권의 책이 하나의 세계를 열어준다.',
  '오늘의 나는 어제의 독서가 만들었다.',
  '작은 습관이 큰 변화를 만든다.',
  '지금 이 순간이 남은 인생 중 가장 젊은 순간이다.',
  '독서 없이 성취된 위대함은 없다.',
  '책은 우리가 잠든 사이 미래를 꿈꾸게 한다.',
  '천 리 길도 한 걸음부터.',
  '지식은 나눌수록 커진다.',
  '모든 독자는 자신만의 책을 읽는다.',
  '독서는 가장 조용한 혁명이다.',
  '책은 꿈을 담는 그릇이다.',
  '오늘 걷지 않으면 내일 뛰어야 한다.',
  '당신의 오늘이 내일의 당신을 만든다.',
  '책을 읽는다는 것은 자신의 미래를 만드는 일이다.',
  '시작이 반이다.',
  '완독 한 권이 세상을 보는 눈을 하나 더 갖는 것이다.',
  '독서는 완성된 사람을 만든다.',
  '좋은 습관은 좋은 삶을 만든다.',
  '책과 함께라면 어디서든 여행할 수 있다.',
  '오늘의 독서가 내일의 나를 밝힌다.',
  '조금 느려도 괜찮다. 멈추지만 않으면 된다.',
];

function getDailyQuote(): string {
  const d = new Date();
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
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
  const dailyQuote = useMemo(() => getDailyQuote(), []);
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

          {/* 우측: 인사말 + 추천 문구 + 데모버튼 */}
          <View style={styles.headerRight}>
            <View style={styles.greetingWrap}>
              <Text style={styles.greetingEmoji}>{greeting.emoji}</Text>
              <Text style={styles.greetingText}>{greeting.text}</Text>
            </View>
            <Text style={styles.quoteText}>"{dailyQuote}"</Text>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => {
                seedDemoData();
                Alert.alert('데모 데이터', '샘플 책·세션·문장이 추가됐어요!');
              }}
            >
              <Text style={styles.demoBtnText}>데모 채우기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Row 1: 지금 읽는 책(좌) + 오늘의 목표(우) ── */}
        <View style={styles.twoCol}>
          {/* 지금 읽는 책 */}
          <View style={[styles.box, styles.boxReading]}>
            <View style={styles.boxHeader}>
              <Text style={styles.boxTitle}>지금 읽는 책</Text>
              <TouchableOpacity onPress={() => router.push('/search')}>
                <Text style={styles.boxAction}>+</Text>
              </TouchableOpacity>
            </View>
            {reading.length === 0 ? (
              <TouchableOpacity style={styles.emptyBox} onPress={() => router.push('/search')}>
                <Text style={styles.emptyEmoji}>📚</Text>
                <Text style={styles.emptyText}>책을 추가해보세요</Text>
              </TouchableOpacity>
            ) : (
              <Pressable
                style={styles.compactBook}
                onPress={() => router.push(`/book/${reading[0].id}`)}
              >
                <BookCover
                  coverUrl={reading[0].book.coverUrl}
                  title={reading[0].book.title}
                  spineColor={reading[0].spineColor}
                  width={44}
                  height={62}
                />
                <View style={styles.compactBookInfo}>
                  <Text style={styles.compactTitle} numberOfLines={2}>{reading[0].book.title}</Text>
                  <Text style={styles.compactAuthor} numberOfLines={1}>{reading[0].book.author}</Text>
                  {reading[0].book.totalPages ? (
                    <View style={styles.progressWrap}>
                      <View style={styles.progressBg}>
                        <View style={[styles.progressFill, {
                          width: `${Math.round(reading[0].currentPage / reading[0].book.totalPages * 100)}%` as any,
                        }]} />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(reading[0].currentPage / reading[0].book.totalPages * 100)}%
                      </Text>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.startBtnSm, isTimerRunning && styles.startBtnActive]}
                    onPress={() => handleQuickStart(reading[0].id, reading[0].currentPage)}
                  >
                    <Text style={styles.startBtnSmText}>{isTimerRunning ? '⏱ 진행중' : '▶ 시작'}</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            )}
            {reading.length > 1 && (
              <Text style={styles.moreBooks}>외 {reading.length - 1}권 더 ›</Text>
            )}
          </View>

          {/* 오늘의 목표 */}
          <TouchableOpacity
            style={[styles.box, goalDone && styles.boxDone]}
            onPress={() => router.push('/goal-settings')}
          >
            <View style={styles.boxHeader}>
              <Text style={styles.boxTitle}>오늘의 목표</Text>
              {goalDone && <Text style={styles.doneBadge}>🎉</Text>}
            </View>
            <View style={styles.goalMetric}>
              <Text style={styles.goalMetricIcon}>⏱</Text>
              <View style={styles.goalMetricBody}>
                <View style={styles.goalNumRow}>
                  <Text style={styles.goalNumBig}>{todayMin}</Text>
                  <Text style={styles.goalNumUnit}>/ {dailyGoalMinutes}분</Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, {
                    width: `${Math.min(todayMin / dailyGoalMinutes, 1) * 100}%` as any,
                  }]} />
                </View>
              </View>
            </View>
            <View style={styles.goalMetric}>
              <Text style={styles.goalMetricIcon}>📄</Text>
              <View style={styles.goalMetricBody}>
                <View style={styles.goalNumRow}>
                  <Text style={[styles.goalNumBig, { color: Colors.green }]}>{todayPg}</Text>
                  <Text style={styles.goalNumUnit}>/ {dailyGoalPages}p</Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, {
                    width: `${Math.min(todayPg / dailyGoalPages, 1) * 100}%` as any,
                    backgroundColor: Colors.green,
                  }]} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Row 2: AI 독서 코치(좌) + AI 맞춤 추천(우) ── */}
        <View style={styles.twoCol}>
          <TouchableOpacity style={styles.box} onPress={() => router.push('/coach-report')}>
            <Text style={styles.aiBoxEmoji}>🤖</Text>
            <Text style={styles.aiBoxTitle}>AI 독서 코치</Text>
            <Text style={styles.aiBoxSub} numberOfLines={2}>
              {streak > 0 ? `🔥 ${streak}일 연속\n주간 리포트 보기` : '나의 독서 인사이트\n확인하기'}
            </Text>
            <Text style={styles.aiBoxArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.box} onPress={() => router.push('/recommend')}>
            <Text style={styles.aiBoxEmoji}>✨</Text>
            <Text style={styles.aiBoxTitle}>AI 맞춤 추천</Text>
            <Text style={styles.aiBoxSub} numberOfLines={2}>{'독서 패턴 분석\n궁합 맞는 책 찾기'}</Text>
            <Text style={styles.aiBoxArrow}>›</Text>
          </TouchableOpacity>
        </View>

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
    fontSize: 32, fontWeight: '700', color: Colors.text,
  },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weatherEmoji: { fontSize: 24 },
  weatherText: { fontSize: 22, color: Colors.textSub, fontWeight: '500' },

  headerRight: { alignItems: 'flex-end', gap: 6, flex: 1 },
  greetingWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  greetingEmoji: { fontSize: 32 },
  greetingText: { fontSize: 28, fontWeight: '800', color: Colors.text, textAlign: 'right' },
  quoteText: {
    fontSize: FontSize.sm, color: Colors.textSub, textAlign: 'right',
    fontStyle: 'italic', lineHeight: 20, opacity: 0.85,
  },
  demoBtn: {
    backgroundColor: Colors.primaryLight, borderRadius: Radius.full,
    paddingVertical: 5, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.primaryMid,
    marginTop: 4,
  },
  demoBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },

  // ── 2컬럼 행 ──
  twoCol: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'stretch',
  },

  // ── 공통 박스 ──
  box: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  boxReading: { minHeight: 180 },
  boxDone: { borderColor: Colors.green, borderWidth: 1.5 },
  boxHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  boxTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  boxAction: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },
  doneBadge: { fontSize: 18 },

  // ── 지금 읽는 책 (compact) ──
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md },
  emptyEmoji: { fontSize: 28 },
  emptyText: { fontSize: FontSize.xs, color: Colors.textSub, textAlign: 'center' },
  compactBook: { flexDirection: 'row', gap: Spacing.sm, flex: 1 },
  compactBookInfo: { flex: 1, gap: 4, justifyContent: 'center' },
  compactTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text, lineHeight: 18 },
  compactAuthor: { fontSize: FontSize.xs, color: Colors.textSub },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressBg: { flex: 1, height: 4, backgroundColor: Colors.primaryLight, borderRadius: Radius.full },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: Radius.full },
  progressText: { fontSize: FontSize.xs, color: Colors.textMuted, width: 28 },
  startBtnSm: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 5, paddingHorizontal: 10, alignSelf: 'flex-start', marginTop: 4,
  },
  startBtnActive: { backgroundColor: Colors.accent },
  startBtnSmText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },
  moreBooks: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600', textAlign: 'right' },

  // ── 오늘의 목표 (큰 숫자) ──
  goalMetric: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  goalMetricIcon: { fontSize: 16, marginTop: 4 },
  goalMetricBody: { flex: 1, gap: 4 },
  goalNumRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  goalNumBig: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary, lineHeight: 34 },
  goalNumUnit: { fontSize: FontSize.sm, color: Colors.textSub },

  // ── AI 박스 ──
  aiBoxEmoji: { fontSize: 28 },
  aiBoxTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  aiBoxSub: { fontSize: FontSize.xs, color: Colors.textSub, lineHeight: 18, flex: 1 },
  aiBoxArrow: { fontSize: 22, color: Colors.primary, fontWeight: '700', alignSelf: 'flex-end' },

  // ── 공통 섹션 (이번 주) ──
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },

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
