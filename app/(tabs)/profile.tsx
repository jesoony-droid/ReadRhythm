import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/tokens';
import { useXpStore } from '../../src/store/xpStore';
import { useSessionStore } from '../../src/store/sessionStore';
import { useShelfStore } from '../../src/store/shelfStore';
import { useBadgeStore } from '../../src/store/badgeStore';
import { MonthCalendar } from '../../src/components/common/MonthCalendar';
import { getLevelInfo } from '../../src/utils/xp';

export default function ProfileScreen() {
  const router = useRouter();
  const totalXp = useXpStore((s) => s.totalXp);
  const levelInfo = getLevelInfo(totalXp);
  const { getMonthStats, getStreak, sessions } = useSessionStore();
  const nickname = useSessionStore((s) => s.nickname);
  const setNickname = useSessionStore((s) => s.setNickname);
  const shelfItems = useShelfStore((s) => s.items);
  const unlockedCount = useBadgeStore(
    (s) => s.badges.reduce((n, b) => n + (b.unlockedAt ? 1 : 0), 0)
  );

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(nickname);

  function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert('닉네임을 입력해주세요');
      return;
    }
    setNickname(trimmed);
    setEditingName(false);
  }

  const streak = getStreak();
  const doneBooks = shelfItems.filter((i) => i.status === 'DONE').length;
  const totalReadMin = Math.floor(sessions.reduce((sum, s) => sum + s.durationSec, 0) / 60);
  const totalPages = sessions.reduce((sum, s) => sum + Math.max(s.pageEnd - s.pageStart, 0), 0);

  const xpPercent = Math.round(levelInfo.progressPercent * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>📖</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Lv.{levelInfo.level}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  maxLength={12}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                  onBlur={handleSaveName}
                />
                <TouchableOpacity onPress={handleSaveName} style={styles.nameSaveBtn}>
                  <Text style={styles.nameSaveBtnText}>저장</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.nicknameRow}
                onPress={() => { setNameInput(nickname); setEditingName(true); }}
              >
                <Text style={styles.nickname}>{nickname}</Text>
                <Text style={styles.editHint}>✏️</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.levelName}>{levelInfo.name}</Text>

            {/* XP 바 */}
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>{levelInfo.currentXp} XP</Text>
              {levelInfo.nextLevelXp && (
                <Text style={styles.xpLabel}>{levelInfo.nextLevelXp} XP</Text>
              )}
            </View>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${xpPercent}%` as any }]} />
            </View>
            {levelInfo.nextLevelXp && (
              <Text style={styles.xpNext}>
                다음 레벨까지 {levelInfo.nextLevelXp - levelInfo.currentXp} XP
              </Text>
            )}
          </View>
        </View>

        {/* 통계 4칸 */}
        <View style={styles.statsGrid}>
          <StatCard icon="🔥" value={String(streak)} label="연속 독서" sub="일" color={Colors.accent} />
          <StatCard icon="📚" value={String(doneBooks)} label="완독한 책" sub="권" color={Colors.primary} />
          <StatCard icon="⏱" value={String(totalReadMin)} label="총 독서" sub="분" color={Colors.purple} />
          <StatCard icon="📄" value={String(totalPages)} label="읽은 페이지" sub="p" color={Colors.green} />
        </View>

        {/* 목표 현황 미니 카드 */}
        <GoalSummaryCard />

        {/* 빠른 메뉴 */}
        <View style={styles.menuGrid}>
          <MenuButton emoji="🎯" label="목표 설정" onPress={() => router.push('/goal-settings')} color={Colors.primary} />
          <MenuButton emoji="📊" label="코치 리포트" onPress={() => router.push('/coach-report')} color={Colors.primary} />
          <MenuButton emoji="🎵" label="독서 BGM" onPress={() => router.push('/(tabs)/bgm')} color={Colors.primary} />
          <MenuButton emoji="🏆" label={`배지 ${unlockedCount}개`} onPress={() => router.push('/badges')} color={Colors.gold} />
          <MenuButton emoji="✨" label="AI 추천" onPress={() => router.push('/recommend')} color={Colors.purple} />
          <MenuButton emoji="💎" label="Premium" onPress={() => router.push('/subscription')} color={Colors.accent} />
          <MenuButton emoji="📅" label="월간 포트폴리오" onPress={() => router.push('/monthly-card')} color={Colors.green} />
          <MenuButton emoji="🎊" label="연간 리포트" onPress={() => router.push('/annual-report')} color={Colors.primary} />
        </View>

        {/* 월간 캘린더 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>독서 캘린더</Text>
          <View style={styles.card}>
            <MonthCalendar getMonthStats={getMonthStats} />
          </View>
        </View>

        {/* 최근 세션 */}
        {sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>최근 독서 기록</Text>
            <View style={styles.card}>
              {sessions
                .slice()
                .reverse()
                .slice(0, 5)
                .map((s) => (
                  <SessionRow key={s.id} session={s} />
                ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label, sub, color }: {
  icon: string; value: string; label: string; sub: string; color: string;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statSub}>{sub}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── 목표 현황 미니 카드 ────────────────────────────────────────────────────────

function GoalSummaryCard() {
  const router = useRouter();
  const dailyGoalMinutes = useSessionStore((s) => s.dailyGoalMinutes);
  const dailyGoalPages   = useSessionStore((s) => s.dailyGoalPages);
  const todayMinutes     = useSessionStore((s) => s.todayMinutes());
  const todayPages       = useSessionStore((s) => s.todayPages());

  const minPct   = Math.min(todayMinutes  / dailyGoalMinutes  * 100, 100);
  const pagesPct = Math.min(todayPages    / dailyGoalPages     * 100, 100);
  const allDone  = minPct >= 100 && pagesPct >= 100;

  return (
    <Pressable style={styles.goalCard} onPress={() => router.push('/goal-settings')}>
      <View style={styles.goalCardHeader}>
        <Text style={styles.goalCardTitle}>오늘의 목표</Text>
        <View style={[styles.goalStatusBadge, allDone && styles.goalStatusDone]}>
          <Text style={[styles.goalStatusText, allDone && styles.goalStatusTextDone]}>
            {allDone ? '🎉 달성!' : '진행 중'}
          </Text>
        </View>
        <Text style={styles.goalEditHint}>목표 수정 ›</Text>
      </View>
      <View style={styles.goalRows}>
        <GoalRow icon="⏱" label="독서 시간" current={todayMinutes} goal={dailyGoalMinutes} unit="분" pct={minPct} color={Colors.primary} />
        <GoalRow icon="📄" label="읽기 페이지" current={todayPages} goal={dailyGoalPages} unit="p" pct={pagesPct} color={Colors.green} />
      </View>
    </Pressable>
  );
}

function GoalRow({ icon, label, current, goal, unit, pct, color }: {
  icon: string; label: string; current: number; goal: number; unit: string; pct: number; color: string;
}) {
  return (
    <View style={styles.goalRow}>
      <Text style={styles.goalRowIcon}>{icon}</Text>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.goalRowTop}>
          <Text style={styles.goalRowLabel}>{label}</Text>
          <Text style={[styles.goalRowValue, { color }]}>{current}{unit} / {goal}{unit}</Text>
        </View>
        <View style={styles.goalBarBg}>
          <View style={[styles.goalBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

function MenuButton({ emoji, label, onPress, color }: { emoji: string; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity style={[styles.menuBtn, { borderColor: color + '40' }]} onPress={onPress}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SessionRow({ session }: { session: import('../../src/store/sessionStore').Session }) {
  const date = new Date(session.startedAt);
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
  const minutes = Math.floor(session.durationSec / 60);
  const pages = Math.max(session.pageEnd - session.pageStart, 0);

  return (
    <View style={styles.sessionRow}>
      <View style={[styles.sessionDot, { backgroundColor: session.isCompleted ? Colors.green : Colors.border }]} />
      <Text style={styles.sessionDate}>{dateStr}</Text>
      <Text style={styles.sessionMode}>{session.mode === 'pomodoro' ? '🍅' : '📖'}</Text>
      <Text style={styles.sessionTime}>{minutes}분</Text>
      {pages > 0 && <Text style={styles.sessionPages}>{pages}p</Text>}
      {session.isCompleted && <Text style={styles.sessionXp}>+20XP</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 80 },

  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
    ...Shadow.card,
  },
  avatarWrap: { alignItems: 'center' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 34 },
  levelBadge: {
    marginTop: -12,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  levelBadgeText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },
  profileInfo: { flex: 1, gap: 4, justifyContent: 'center' },
  nicknameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nickname: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  editHint: { fontSize: 14 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameInput: {
    flex: 1, fontSize: FontSize.lg, fontWeight: '700', color: Colors.text,
    borderBottomWidth: 2, borderBottomColor: Colors.primary, paddingVertical: 2,
  },
  nameSaveBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 4, paddingHorizontal: 12,
  },
  nameSaveBtnText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },
  levelName: { fontSize: FontSize.sm, color: Colors.textSub },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  xpLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  xpBarBg: {
    height: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  xpNext: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 2,
    ...Shadow.card,
  },
  statIcon: { fontSize: 22 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 4 },
  statValue: { fontSize: FontSize.xxl, fontWeight: '700' },
  statSub: { fontSize: FontSize.sm, color: Colors.textMuted },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },

  // ── 목표 카드 ──
  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  goalCardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, flex: 1 },
  goalStatusBadge: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.full,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalStatusDone: { backgroundColor: Colors.greenLight, borderColor: Colors.green },
  goalStatusText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSub },
  goalStatusTextDone: { color: Colors.green },
  goalEditHint: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  goalRows: { gap: 10 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  goalRowIcon: { fontSize: 18, width: 22, textAlign: 'center' },
  goalRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalRowLabel: { fontSize: FontSize.xs, color: Colors.textSub },
  goalRowValue: { fontSize: FontSize.xs, fontWeight: '700' },
  goalBarBg: { height: 6, backgroundColor: Colors.primaryLight, borderRadius: Radius.full, overflow: 'hidden' },
  goalBarFill: { height: 6, borderRadius: Radius.full },

  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  menuBtn: {
    flexBasis: '47%', flexGrow: 1,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', gap: 6,
    borderWidth: 1, ...Shadow.card,
  },
  menuEmoji: { fontSize: 28 },
  menuLabel: { fontSize: FontSize.sm, fontWeight: '700' },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadow.card,
  },

  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sessionDot: { width: 8, height: 8, borderRadius: 4 },
  sessionDate: { fontSize: FontSize.sm, color: Colors.textSub, width: 36 },
  sessionMode: { fontSize: 14 },
  sessionTime: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, flex: 1 },
  sessionPages: { fontSize: FontSize.xs, color: Colors.textMuted },
  sessionXp: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.gold },
});
