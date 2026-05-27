import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useRef, useCallback } from 'react';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../src/constants/tokens';
import { useShelfStore } from '../src/store/shelfStore';
import { useSessionStore } from '../src/store/sessionStore';
import { useXpStore } from '../src/store/xpStore';
import { getLevelInfo } from '../src/utils/xp';
import { fetchRecommendations, type BookRecommendation, type RecommendationsResponse } from '../src/api/ai';

export default function RecommendScreen() {
  const router = useRouter();
  const shelfItems = useShelfStore((s) => s.items);
  const sessions = useSessionStore((s) => s.sessions);
  const streak = useSessionStore((s) => s.getStreak());
  const totalXp = useXpStore((s) => s.totalXp);
  const levelInfo = getLevelInfo(totalXp);

  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const startSpin = useCallback(() => {
    spinAnim.setValue(0);
    Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 800, useNativeDriver: true })).start();
  }, [spinAnim]);

  const stopSpin = useCallback(() => {
    spinAnim.stopAnimation();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [spinAnim, fadeAnim]);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    fadeAnim.setValue(0);
    startSpin();

    try {
      const result = await fetchRecommendations(shelfItems, sessions, streak, levelInfo.level);
      setData(result);
      stopSpin();
    } catch (e) {
      setError('추천을 불러오지 못했어요. 백엔드 서버가 실행 중인지 확인해 주세요.');
      spinAnim.stopAnimation();
    } finally {
      setLoading(false);
    }
  }, [shelfItems, sessions, streak, levelInfo.level, fadeAnim, startSpin, stopSpin, spinAnim]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← 돌아가기</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>AI 도서 추천</Text>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <TouchableOpacity
            style={[styles.refreshBtn, loading && styles.refreshBtnDisabled]}
            onPress={loadRecommendations}
            disabled={loading}
          >
            <Text style={styles.refreshIcon}>↻</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!data && !loading && !error && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>나만을 위한 추천</Text>
            <Text style={styles.emptyDesc}>
              내 독서 이력을 분석해{'\n'}궁합이 맞는 책을 찾아드려요
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={loadRecommendations}>
              <Text style={styles.startBtnText}>AI 추천 받기</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>독서 패턴 분석 중...</Text>
            <Text style={styles.loadingSubText}>Claude AI가 최적의 책을 찾고 있어요</Text>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.skeleton} />
            ))}
          </View>
        )}

        {error && (
          <View style={styles.errorWrap}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadRecommendations}>
              <Text style={styles.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}

        {data && !loading && (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* 코치 메시지 */}
            <View style={styles.coachCard}>
              <View style={styles.coachHeader}>
                <Text style={styles.coachEmoji}>🤖</Text>
                <Text style={styles.coachLabel}>AI 코치 메시지</Text>
              </View>
              <Text style={styles.coachMessage}>{data.coachMessage}</Text>
              <View style={styles.patternWrap}>
                <Text style={styles.patternLabel}>독서 패턴</Text>
                <Text style={styles.patternText}>{data.patternSummary}</Text>
              </View>
            </View>

            {/* 추천 카드 목록 */}
            <Text style={styles.sectionTitle}>맞춤 추천 도서</Text>
            {data.recommendations.map((rec, i) => (
              <RecommendCard key={i} rec={rec} rank={i + 1} />
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RecommendCard({ rec, rank }: { rec: BookRecommendation; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 1);
  const addBook = useShelfStore((s) => s.addBook);
  const shelfItems = useShelfStore((s) => s.items);
  const inShelf = shelfItems.some(
    (i) => i.book.title === rec.title && i.book.author === rec.author
  );

  const compatColor =
    rec.compatibilityPercent >= 90 ? Colors.green :
    rec.compatibilityPercent >= 75 ? Colors.primary :
    Colors.gold;

  const handleAdd = () => {
    addBook(
      { id: `rec_${Date.now()}`, isbn: `rec_${Date.now()}`, title: rec.title, author: rec.author },
      'WANT',
    );
  };

  return (
    <TouchableOpacity style={styles.recCard} onPress={() => setExpanded(!expanded)} activeOpacity={0.85}>
      {/* 헤더 */}
      <View style={styles.recHeader}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
        <View style={styles.recTitleWrap}>
          <Text style={styles.recTitle} numberOfLines={1}>{rec.title}</Text>
          <Text style={styles.recAuthor}>{rec.author} · {rec.genre}</Text>
        </View>
        <View style={[styles.compatBadge, { backgroundColor: compatColor + '20' }]}>
          <Text style={[styles.compatText, { color: compatColor }]}>
            {rec.compatibilityPercent}%
          </Text>
        </View>
      </View>

      {/* 궁합 바 */}
      <View style={styles.compatBarBg}>
        <View style={[styles.compatBarFill, {
          width: `${rec.compatibilityPercent}%` as any,
          backgroundColor: compatColor,
        }]} />
      </View>

      {/* 상세 (펼치면 보임) */}
      {expanded && (
        <View style={styles.recDetail}>
          <View style={styles.reasonsList}>
            {rec.reasons.map((r, i) => (
              <View key={i} style={styles.reasonRow}>
                <Text style={styles.reasonBullet}>✓</Text>
                <Text style={styles.reasonText}>{r}</Text>
              </View>
            ))}
          </View>
          <View style={styles.recFooter}>
            <Text style={styles.estDays}>예상 독서 기간 {rec.estimatedReadingDays}일</Text>
            {inShelf ? (
              <View style={styles.addedBadge}>
                <Text style={styles.addedText}>✓ 서재에 있음</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.addToShelfBtn} onPress={handleAdd}>
                <Text style={styles.addToShelfText}>+ 서재 담기</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  backText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  screenTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  refreshBtnDisabled: { opacity: 0.4 },
  refreshIcon: { fontSize: 20, color: Colors.primary, fontWeight: '700' },

  scroll: { padding: Spacing.md, paddingBottom: 80, gap: Spacing.md },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  emptyDesc: { fontSize: FontSize.md, color: Colors.textSub, textAlign: 'center', lineHeight: 22 },
  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: Spacing.sm,
  },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

  loadingWrap: { alignItems: 'center', paddingTop: 40, gap: Spacing.md },
  loadingText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  loadingSubText: { fontSize: FontSize.sm, color: Colors.textMuted },
  skeleton: {
    width: '100%', height: 80,
    backgroundColor: Colors.border,
    borderRadius: Radius.md,
    opacity: 0.5,
  },

  errorWrap: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  errorEmoji: { fontSize: 48 },
  errorText: { fontSize: FontSize.sm, color: Colors.textSub, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    borderWidth: 1, borderColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  retryText: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.sm },

  coachCard: {
    backgroundColor: Colors.dark,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  coachHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coachEmoji: { fontSize: 20 },
  coachLabel: { fontSize: FontSize.xs, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
  coachMessage: { fontSize: FontSize.md, color: '#fff', lineHeight: 22 },
  patternWrap: {
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: Spacing.sm, gap: 4,
  },
  patternLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  patternText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },

  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginTop: Spacing.sm },

  recCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rankBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  recTitleWrap: { flex: 1 },
  recTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  recAuthor: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  compatBadge: {
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  compatText: { fontSize: FontSize.sm, fontWeight: '700' },
  compatBarBg: { height: 4, backgroundColor: Colors.border, borderRadius: Radius.full },
  compatBarFill: { height: 4, borderRadius: Radius.full },

  recDetail: { gap: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  reasonsList: { gap: 6 },
  reasonRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  reasonBullet: { color: Colors.green, fontWeight: '700', fontSize: FontSize.sm, marginTop: 1 },
  reasonText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSub, lineHeight: 18 },
  recFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  estDays: { fontSize: FontSize.xs, color: Colors.textMuted },
  addToShelfBtn: {
    borderWidth: 1, borderColor: Colors.primary,
    borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 12,
  },
  addToShelfText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
  addedBadge: {
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 12,
  },
  addedText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.green },
});
