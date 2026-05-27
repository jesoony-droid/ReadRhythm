import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import { Colors, Spacing, FontSize, Radius } from '../src/constants/tokens';
import { useSessionStore } from '../src/store/sessionStore';
import { useShelfStore } from '../src/store/shelfStore';
import { useQuotesStore } from '../src/store/quotesStore';
import { useXpStore } from '../src/store/xpStore';
import { getLevelInfo } from '../src/utils/xp';

const { width: SW, height: SH } = Dimensions.get('window');

const SLIDE_GRADIENTS = [
  ['#0D0F1A', '#1A2560'],
  ['#1A0D2E', '#3B1F6A'],
  ['#0D1F0A', '#1A4A15'],
  ['#2E0D0A', '#6A1F1A'],
  ['#0D1A2E', '#1A3B5B'],
];

export default function AnnualReportScreen() {
  const router = useRouter();
  const sessions = useSessionStore((s) => s.sessions);
  const shelfItems = useShelfStore((s) => s.items);
  const quotes = useQuotesStore((s) => s.quotes);
  const totalXp = useXpStore((s) => s.totalXp);
  const levelInfo = getLevelInfo(totalXp);

  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // 연간 통계 계산
  const year = new Date().getFullYear();
  const yearSessions = sessions.filter((s) => s.startedAt.startsWith(String(year)));
  const totalMinutes = Math.floor(yearSessions.reduce((s, ss) => s + ss.durationSec, 0) / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const doneBooks = shelfItems.filter((i) => i.status === 'DONE').length;
  const totalPages = yearSessions.reduce((s, ss) => s + Math.max(ss.pageEnd - ss.pageStart, 0), 0);

  // 최장 스트릭 계산
  const streak = useSessionStore.getState().getStreak();

  // 감정 히스토그램
  const emotionCounts = quotes.reduce<Record<string, number>>((acc, q) => {
    const e = q.emotion ?? 'wise';
    acc[e] = (acc[e] ?? 0) + 1;
    return acc;
  }, {});

  const slides = [
    { type: 'intro',   title: `${year}년\n독서 결산`, sub: '올 한 해 당신의 독서를 돌아봐요' },
    { type: 'time',    value: totalHours, unit: '시간', label: '총 독서 시간', sub: `${totalMinutes}분 · ${yearSessions.length}회 세션` },
    { type: 'books',   value: doneBooks, unit: '권', label: '완독한 책', sub: `${totalPages.toLocaleString()}페이지 독파` },
    { type: 'emotions', label: '수집한 문장 감정', data: emotionCounts, total: quotes.length },
    { type: 'streak',  value: streak, unit: '일', label: '현재 연속 독서', sub: `레벨 ${levelInfo.level} · ${levelInfo.name}` },
    { type: 'outro',   title: '대단해요!', sub: `${year}년도 훌륭한 독서가였어요 🎉` },
  ];

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    setCurrentSlide(idx);
  };

  const goNext = () => {
    if (currentSlide < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentSlide + 1) * SW, animated: true });
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, i) => (
          <Slide key={i} slide={slide} index={i} colors={SLIDE_GRADIENTS[i % SLIDE_GRADIENTS.length]} />
        ))}
      </ScrollView>

      {/* 페이지 인디케이터 */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, currentSlide === i && styles.dotActive]} />
        ))}
      </View>

      {/* 컨트롤 */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        {currentSlide < slides.length - 1 && (
          <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextBtnText}>다음 →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function Slide({ slide, index, colors }: { slide: any; index: number; colors: string[] }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // 슬라이드 등장 애니메이션
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.slide, { backgroundColor: colors[0] }]}>
      <Animated.View style={[styles.slideContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {slide.type === 'intro' && <IntroSlide slide={slide} />}
        {slide.type === 'time' && <StatSlide slide={slide} color="#A5B4FC" />}
        {slide.type === 'books' && <StatSlide slide={slide} color="#86EFAC" />}
        {slide.type === 'emotions' && <EmotionSlide slide={slide} />}
        {slide.type === 'streak' && <StatSlide slide={slide} color="#FCA5A5" />}
        {slide.type === 'outro' && <OutroSlide slide={slide} />}
      </Animated.View>
    </View>
  );
}

function IntroSlide({ slide }: { slide: any }) {
  return (
    <View style={styles.centerContent}>
      <Text style={styles.bigEmoji}>📚</Text>
      <Text style={styles.introTitle}>{slide.title}</Text>
      <Text style={styles.introSub}>{slide.sub}</Text>
    </View>
  );
}

function StatSlide({ slide, color }: { slide: any; color: string }) {
  return (
    <View style={styles.centerContent}>
      <Text style={styles.statLabel}>{slide.label}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statBigNum, { color }]}>{slide.value.toLocaleString()}</Text>
        <Text style={[styles.statUnit, { color }]}>{slide.unit}</Text>
      </View>
      <Text style={styles.statSub}>{slide.sub}</Text>
    </View>
  );
}

function EmotionSlide({ slide }: { slide: any }) {
  const EMOTION_MAP: Record<string, { label: string; color: string; emoji: string }> = {
    inspiring:  { label: '영감',   color: '#818CF8', emoji: '✨' },
    touching:   { label: '감동',   color: '#F87171', emoji: '🌙' },
    wise:       { label: '지혜',   color: '#A78BFA', emoji: '💡' },
    funny:      { label: '유머',   color: '#FCD34D', emoji: '😄' },
  };
  const total = Math.max(slide.total, 1);
  const entries = Object.entries(slide.data as Record<string, number>);

  return (
    <View style={styles.centerContent}>
      <Text style={styles.statLabel}>{slide.label}</Text>
      <Text style={[styles.statBigNum, { color: '#A5B4FC', fontSize: 56 }]}>{slide.total}</Text>
      <Text style={[styles.statUnit, { color: '#A5B4FC', marginBottom: Spacing.xl }]}>개 수집</Text>
      <View style={styles.emotionBars}>
        {entries.map(([key, count]) => {
          const em = EMOTION_MAP[key] ?? { label: key, color: '#888', emoji: '•' };
          const pct = (count / total) * 100;
          return (
            <View key={key} style={styles.emotionBarRow}>
              <Text style={styles.emotionEmoji}>{em.emoji}</Text>
              <Text style={styles.emotionBarLabel}>{em.label}</Text>
              <View style={styles.emotionBarBg}>
                <View style={[styles.emotionBarFill, { width: `${pct}%` as any, backgroundColor: em.color }]} />
              </View>
              <Text style={[styles.emotionBarCount, { color: em.color }]}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function OutroSlide({ slide }: { slide: any }) {
  return (
    <View style={styles.centerContent}>
      <Text style={{ fontSize: 72 }}>🏆</Text>
      <Text style={styles.introTitle}>{slide.title}</Text>
      <Text style={styles.introSub}>{slide.sub}</Text>
      <View style={styles.shareCard}>
        <Text style={styles.shareCardText}>📤 공유하기</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
  slide: { width: SW, height: SH, justifyContent: 'center', alignItems: 'center' },
  slideContent: { width: '100%', alignItems: 'center', paddingHorizontal: Spacing.xl },
  centerContent: { alignItems: 'center', gap: Spacing.md, width: '100%' },

  bigEmoji: { fontSize: 72 },
  introTitle: { fontSize: 38, fontWeight: '700', color: '#fff', textAlign: 'center', lineHeight: 46 },
  introSub: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 22 },

  statLabel: { fontSize: FontSize.sm, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' },
  statValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  statBigNum: { fontSize: 80, fontWeight: '700', lineHeight: 92 },
  statUnit: { fontSize: FontSize.xl, fontWeight: '600', marginBottom: 14 },
  statSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },

  emotionBars: { width: '100%', gap: 12 },
  emotionBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emotionEmoji: { fontSize: 18, width: 24 },
  emotionBarLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', width: 36 },
  emotionBarBg: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
  emotionBarFill: { height: 8, borderRadius: 4 },
  emotionBarCount: { fontSize: FontSize.xs, fontWeight: '700', width: 24, textAlign: 'right' },

  shareCard: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  shareCardText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

  dots: { position: 'absolute', bottom: 100, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: '#fff', width: 20 },

  controls: { position: 'absolute', top: 56, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
  nextBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 8, paddingHorizontal: 18 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
});
