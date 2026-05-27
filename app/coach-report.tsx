import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../src/constants/tokens';
import { useSessionStore } from '../src/store/sessionStore';
import { useShelfStore } from '../src/store/shelfStore';
import { useXpStore } from '../src/store/xpStore';
import { getLevelInfo } from '../src/utils/xp';
import { fetchCoachReport, type CoachReport } from '../src/api/ai';
import { WeeklyChart, type WeekData } from '../src/components/common/WeeklyChart';

function buildWeeklyData(sessions: import('../src/store/sessionStore').Session[]): WeekData[] {
  const weeks: WeekData[] = [];
  const now = new Date();

  for (let w = 11; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - w * 7 - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekMinutes = sessions
      .filter((s: import('../src/store/sessionStore').Session) => {
        const d = new Date(s.startedAt);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((sum: number, s: import('../src/store/sessionStore').Session) => sum + s.durationSec, 0) / 60;

    const month = weekStart.getMonth() + 1;
    const day = weekStart.getDate();
    weeks.push({ week: `${month}/${day}`, minutes: Math.floor(weekMinutes) });
  }
  return weeks;
}

export default function CoachReportScreen() {
  const router = useRouter();
  const sessions = useSessionStore((s) => s.sessions);
  const shelfItems = useShelfStore((s) => s.items);
  const streak = useSessionStore((s) => s.getStreak());
  const dailyGoalMinutes = useSessionStore((s) => s.dailyGoalMinutes);
  const totalXp = useXpStore((s) => s.totalXp);
  const levelInfo = getLevelInfo(totalXp);

  const weeklyData = buildWeeklyData(sessions);
  const totalWeekMin = weeklyData.slice(-1)[0]?.minutes ?? 0;
  const prevWeekMin = weeklyData.slice(-2)[0]?.minutes ?? 0;
  const growthPct = prevWeekMin > 0 ? Math.round(((totalWeekMin - prevWeekMin) / prevWeekMin) * 100) : 0;

  const [report, setReport] = useState<CoachReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCoachReport(shelfItems, sessions, streak, levelInfo.level);
      setReport(result);
    } catch {
      setError('리포트를 불러오지 못했어요. 백엔드 서버를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  }, [shelfItems, sessions, streak, levelInfo.level]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← 돌아가기</Text>
        </TouchableOpacity>
        <Text style={styles.title}>주간 코치 리포트</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* 12주 성장 그래프 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>12주 독서 현황</Text>
            <View style={[styles.growthBadge, { backgroundColor: growthPct >= 0 ? Colors.greenLight : Colors.redLight }]}>
              <Text style={[styles.growthText, { color: growthPct >= 0 ? Colors.green : Colors.red }]}>
                {growthPct >= 0 ? '▲' : '▼'} {Math.abs(growthPct)}%
              </Text>
            </View>
          </View>
          <WeeklyChart data={weeklyData} goalMinutes={dailyGoalMinutes * 7} height={160} />
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>목표 달성</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primaryMid }]} />
              <Text style={styles.legendText}>부분 달성</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.accentLight, borderWidth: 1, borderColor: Colors.accent, borderStyle: 'dashed' }]} />
              <Text style={[styles.legendText, { color: Colors.accent }]}>주간 목표선</Text>
            </View>
          </View>
        </View>

        {/* 이번 주 요약 */}
        <View style={styles.summaryRow}>
          <SummaryCard icon="⏱" value={`${totalWeekMin}분`} label="이번 주 독서" color={Colors.primary} />
          <SummaryCard icon="🔥" value={`${streak}일`} label="연속 독서" color={Colors.accent} />
          <SummaryCard icon="📚" value={`Lv.${levelInfo.level}`} label={levelInfo.name} color={Colors.purple} />
        </View>

        {/* AI 코치 리포트 */}
        {!report && !loading && (
          <TouchableOpacity style={styles.aiPromptCard} onPress={loadReport}>
            <Text style={styles.aiPromptEmoji}>🤖</Text>
            <View style={styles.aiPromptText}>
              <Text style={styles.aiPromptTitle}>AI 코치 분석 받기</Text>
              <Text style={styles.aiPromptSub}>강점, 개선 팁, 동기부여 메시지</Text>
            </View>
            <Text style={styles.aiPromptArrow}>›</Text>
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>AI 코치가 분석 중이에요...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadReport}>
              <Text style={styles.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}

        {report && (
          <>
            <View style={[styles.card, { backgroundColor: Colors.dark }]}>
              <Text style={styles.coachMsgTitle}>코치 메시지</Text>
              <Text style={styles.coachMsg}>{report.motivationMessage}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>💪 이번 주 강점</Text>
              {report.strengths.map((s, i) => (
                <View key={i} style={styles.listRow}>
                  <Text style={styles.listBullet}>✓</Text>
                  <Text style={styles.listText}>{s}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>💡 성장 팁</Text>
              {report.tips.map((t, i) => (
                <View key={i} style={styles.listRow}>
                  <Text style={[styles.listBullet, { color: Colors.accent }]}>{i + 1}</Text>
                  <Text style={styles.listText}>{t}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={[styles.summaryCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
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
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 60 },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, gap: Spacing.sm, ...Shadow.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  growthBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: Radius.full },
  growthText: { fontSize: FontSize.xs, fontWeight: '700' },
  chartLegend: { flexDirection: 'row', gap: Spacing.md, paddingTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FontSize.xs, color: Colors.textMuted },

  summaryRow: { flexDirection: 'row', gap: Spacing.sm },
  summaryCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', gap: 3, ...Shadow.card,
  },
  summaryIcon: { fontSize: 22 },
  summaryValue: { fontSize: FontSize.lg, fontWeight: '700' },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },

  aiPromptCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.primaryMid,
  },
  aiPromptEmoji: { fontSize: 28 },
  aiPromptText: { flex: 1 },
  aiPromptTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  aiPromptSub: { fontSize: FontSize.xs, color: Colors.textSub, marginTop: 2 },
  aiPromptArrow: { fontSize: 22, color: Colors.primary, fontWeight: '700' },

  loadingCard: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, ...Shadow.card,
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSub },

  errorCard: {
    backgroundColor: Colors.redLight, borderRadius: Radius.md,
    padding: Spacing.md, gap: Spacing.sm, alignItems: 'center',
  },
  errorText: { fontSize: FontSize.sm, color: Colors.red, textAlign: 'center' },
  retryText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },

  coachMsgTitle: { fontSize: FontSize.xs, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  coachMsg: { fontSize: FontSize.md, color: '#fff', lineHeight: 22 },
  listRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  listBullet: { fontSize: FontSize.sm, color: Colors.green, fontWeight: '700', marginTop: 1, width: 16 },
  listText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSub, lineHeight: 20 },
});
