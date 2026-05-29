import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  TextInput, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, Radius } from '../../src/constants/tokens';
import { useTimerStore, POMODORO_SEC } from '../../src/store/timerStore';
import { useSessionStore } from '../../src/store/sessionStore';
import { useShelfStore } from '../../src/store/shelfStore';
import { useXpStore } from '../../src/store/xpStore';
import { TripleRing } from '../../src/components/timer/TripleRing';
import { XP_RULES } from '../../src/utils/xp';
import type { TimerMode } from '../../src/store/sessionStore';

const MODES: { key: TimerMode; label: string; desc: string }[] = [
  { key: 'free',     label: '자유',    desc: '∞' },
  { key: 'pomodoro', label: '뽀모도로', desc: '25분' },
];

export default function TimerScreen() {
  const router = useRouter();

  const {
    isRunning, elapsedSeconds, mode, sessionStartedAt, activeShelfItemId, pageStart,
    start, pause, resume, reset, tick,
  } = useTimerStore();

  const { addSession, todayMinutes, todayPages } = useSessionStore();
  const dailyGoalMinutes = useSessionStore((s) => s.dailyGoalMinutes);
  const dailyGoalPages   = useSessionStore((s) => s.dailyGoalPages);
  const addXp = useXpStore((s) => s.addXp);
  const shelfItems = useShelfStore((s) => s.items);
  const updatePage = useShelfStore((s) => s.updatePage);

  const readingBooks = shelfItems.filter((i) => i.status === 'READING');

  const [selectedMode, setSelectedMode] = useState<TimerMode>('free');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(
    readingBooks[0]?.id ?? null
  );
  const [showEndModal, setShowEndModal] = useState(false);
  const [pageEndInput, setPageEndInput] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const prevRunning = useRef(isRunning);
  useEffect(() => {
    if (prevRunning.current && !isRunning && mode === 'pomodoro' && elapsedSeconds >= POMODORO_SEC) {
      setShowEndModal(true);
    }
    prevRunning.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const handleStart = () => {
    const book = shelfItems.find((i) => i.id === selectedBookId);
    start(selectedBookId, selectedMode, book?.currentPage ?? 0);
  };

  const handleStop = () => {
    pause();
    const book = shelfItems.find((i) => i.id === activeShelfItemId);
    setPageEndInput(String(book?.currentPage ?? pageStart));
    setShowEndModal(true);
  };

  const handleSaveSession = () => {
    if (!sessionStartedAt) return;
    const pageEnd = parseInt(pageEndInput, 10);
    const validPageEnd = isNaN(pageEnd) ? pageStart : Math.max(pageEnd, pageStart);
    const isCompleted = elapsedSeconds >= 15 * 60;

    addSession({
      shelfItemId: activeShelfItemId, mode,
      startedAt: sessionStartedAt, endedAt: new Date().toISOString(),
      durationSec: elapsedSeconds, pageStart, pageEnd: validPageEnd, isCompleted,
    });

    if (activeShelfItemId && validPageEnd > pageStart) updatePage(activeShelfItemId, validPageEnd);
    if (isCompleted) addXp(XP_RULES.SESSION_COMPLETE, '독서 세션 완료');
    const newTodayMin = todayMinutes() + Math.floor(elapsedSeconds / 60);
    const newTodayPg  = todayPages()   + Math.max(validPageEnd - pageStart, 0);
    if (newTodayMin >= dailyGoalMinutes && newTodayPg >= dailyGoalPages)
      addXp(XP_RULES.DAILY_GOAL, '일일 목표 달성');

    setShowEndModal(false);
    reset();
  };

  const handleDiscard = () => { setShowEndModal(false); reset(); };

  // 진행률
  const todayMin = todayMinutes();
  const todayPg  = todayPages();
  const outerProgress  = Math.min(todayMin / dailyGoalMinutes, 1);
  const innerProgress  = Math.min(todayPg / dailyGoalPages, 1);
  const middleProgress = mode === 'pomodoro'
    ? Math.min(elapsedSeconds / POMODORO_SEC, 1)
    : Math.min(elapsedSeconds / (dailyGoalMinutes * 60), 1);

  // 표시 시간
  const displaySec = mode === 'pomodoro'
    ? Math.max(POMODORO_SEC - elapsedSeconds, 0)
    : elapsedSeconds;
  const mm = String(Math.floor(displaySec / 60)).padStart(2, '0');
  const ss = String(displaySec % 60).padStart(2, '0');

  const hasSession   = sessionStartedAt !== null;
  const selectedBook = shelfItems.find((i) => i.id === (hasSession ? activeShelfItemId : selectedBookId));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* 헤더 */}
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>독서 타이머</Text>
          <TouchableOpacity style={styles.bgmBtn} onPress={() => router.push('/(tabs)/bgm')}>
            <Text style={styles.bgmBtnText}>🎵 BGM</Text>
          </TouchableOpacity>
        </View>

        {/* 스타디움 트랙 + 시간 오버레이 */}
        <View style={styles.ringWrap}>
          <TripleRing
            outerProgress={outerProgress}
            middleProgress={middleProgress}
            innerProgress={innerProgress}
          />
          <View style={styles.ringCenter} pointerEvents="none">
            <Text style={styles.time}>{mm}:{ss}</Text>
            <Text style={styles.timeLabel}>
              {mode === 'pomodoro' ? '🍅 뽀모도로' : '📖 자유 독서'}
            </Text>
          </View>
        </View>

        {/* 일일 목표 요약 */}
        <View style={styles.statsRow}>
          <StatDot color={Colors.primary} label="오늘 독서"  current={`${todayMin}분`}  goal={`목표 ${dailyGoalMinutes}분`} />
          <StatDot color={Colors.green}   label="이번 세션"  current={`${Math.round(elapsedSeconds / 60)}분`} />
          <StatDot color={Colors.purple}  label="오늘 페이지" current={`${todayPg}p`}   goal={`목표 ${dailyGoalPages}p`} />
        </View>

        {/* 모드 선택 */}
        {!hasSession && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>모드</Text>
            <View style={styles.modeRow}>
              {MODES.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.modeBtn, selectedMode === m.key && styles.modeBtnActive]}
                  onPress={() => setSelectedMode(m.key)}
                >
                  <Text style={[styles.modeBtnLabel, selectedMode === m.key && styles.modeBtnLabelActive]}>
                    {m.label}
                  </Text>
                  <Text style={[styles.modeBtnDesc, selectedMode === m.key && styles.modeBtnDescActive]}>
                    {m.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 책 선택 */}
        {!hasSession && readingBooks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>읽는 책</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bookRow}>
              {readingBooks.map((book) => (
                <Pressable
                  key={book.id}
                  style={[styles.bookChip, selectedBookId === book.id && styles.bookChipActive]}
                  onPress={() => setSelectedBookId(book.id)}
                >
                  <Text style={[styles.bookChipText, selectedBookId === book.id && styles.bookChipTextActive]} numberOfLines={1}>
                    {book.book.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {selectedBook && (
          <View style={styles.nowReading}>
            <View style={[styles.nowReadingDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.nowReadingText} numberOfLines={1}>{selectedBook.book.title}</Text>
          </View>
        )}

        {/* 컨트롤 버튼 */}
        <View style={styles.controls}>
          {!hasSession && (
            <TouchableOpacity style={styles.btnStart} onPress={handleStart}>
              <Text style={styles.btnStartText}>▶  시작</Text>
            </TouchableOpacity>
          )}
          {hasSession && isRunning && (
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btnPause} onPress={pause}>
                <Text style={styles.btnPauseText}>⏸  일시정지</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnStop} onPress={handleStop}>
                <Text style={styles.btnStopText}>■  종료</Text>
              </TouchableOpacity>
            </View>
          )}
          {hasSession && !isRunning && (
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btnResume} onPress={resume}>
                <Text style={styles.btnStartText}>▶  재개</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnStop} onPress={handleStop}>
                <Text style={styles.btnStopText}>■  종료</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 세션 종료 모달 */}
      <Modal visible={showEndModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>세션 종료</Text>
            <Text style={styles.modalSub}>
              {Math.floor(elapsedSeconds / 60)}분 {elapsedSeconds % 60}초 동안 독서했어요 🎉
            </Text>
            {elapsedSeconds >= 15 * 60 && (
              <View style={styles.xpBadge}><Text style={styles.xpText}>+20 XP 획득!</Text></View>
            )}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>종료 페이지</Text>
              <TextInput
                style={styles.modalInput}
                value={pageEndInput}
                onChangeText={setPageEndInput}
                keyboardType="number-pad"
                placeholder={String(pageStart)}
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnDiscard} onPress={handleDiscard}>
                <Text style={styles.modalBtnDiscardText}>버리기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleSaveSession}>
                <Text style={styles.modalBtnSaveText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatDot({ color, label, current, goal }: {
  color: string; label: string; current: string; goal?: string;
}) {
  return (
    <View style={styles.statDot}>
      <View style={[styles.statDotMark, { backgroundColor: color }]} />
      <Text style={styles.statDotLabel}>{label}</Text>
      <Text style={[styles.statDotValue, { color }]}>{current}</Text>
      {goal && <Text style={styles.statDotGoal}>{goal}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },
  scroll: { padding: Spacing.md, alignItems: 'center', gap: Spacing.lg, paddingBottom: 80 },

  titleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', marginTop: Spacing.md,
  },
  screenTitle: { fontSize: FontSize.sm, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  bgmBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  bgmBtnText: { fontSize: FontSize.xs, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },

  // 스타디움 트랙 + 오버레이
  ringWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringCenter: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
  },
  time: { fontSize: 99, fontWeight: '800', color: '#fff', letterSpacing: -4, fontVariant: ['tabular-nums'] as any },
  timeLabel: { fontSize: FontSize.lg, color: 'rgba(255,255,255,0.5)', marginTop: 6, fontWeight: '500' },

  statsRow: { flexDirection: 'row', gap: Spacing.xl },
  statDot: { alignItems: 'center', gap: 8 },
  statDotMark: { width: 12, height: 12, borderRadius: 6 },
  statDotLabel: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  statDotValue: { fontSize: FontSize.xxl, fontWeight: '800', color: 'rgba(255,255,255,0.95)' },
  statDotGoal:  { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },

  section: { width: '100%', gap: Spacing.sm },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },

  modeRow: { flexDirection: 'row', gap: Spacing.sm },
  modeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  modeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeBtnLabel: { fontSize: FontSize.md, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  modeBtnLabelActive: { color: '#fff' },
  modeBtnDesc: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  modeBtnDescActive: { color: 'rgba(255,255,255,0.8)' },

  bookRow: { gap: Spacing.sm, paddingBottom: 4 },
  bookChip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', maxWidth: 180,
  },
  bookChipActive: { backgroundColor: Colors.primaryDark, borderColor: Colors.primary },
  bookChipText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  bookChipTextActive: { color: '#fff', fontWeight: '700' },

  nowReading: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.full,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  nowReadingDot: { width: 6, height: 6, borderRadius: 3 },
  nowReadingText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', flex: 1 },

  controls: { width: '100%', gap: Spacing.sm },
  btnStart: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 18, alignItems: 'center' },
  btnStartText: { color: '#fff', fontWeight: '700', fontSize: FontSize.lg },
  btnRow: { flexDirection: 'row', gap: Spacing.sm },
  btnPause: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.full, paddingVertical: 18, alignItems: 'center',
  },
  btnPauseText: { color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: FontSize.md },
  btnResume: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 18, alignItems: 'center' },
  btnStop: {
    flex: 1, backgroundColor: 'rgba(227,49,49,0.25)',
    borderRadius: Radius.full, paddingVertical: 18, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.red,
  },
  btnStopText: { color: Colors.red, fontWeight: '700', fontSize: FontSize.md },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#1A1D2E', borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg,
    padding: Spacing.xl, gap: Spacing.md,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: '#fff' },
  modalSub: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.55)' },
  xpBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.goldLight,
    borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 14,
  },
  xpText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.gold },
  modalField: { gap: 8 },
  modalFieldLabel: { fontSize: FontSize.sm, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.md,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: FontSize.lg, fontWeight: '700', color: '#fff', textAlign: 'center',
  },
  modalBtnRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  modalBtnDiscard: {
    flex: 1, paddingVertical: 14, borderRadius: Radius.full,
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)',
  },
  modalBtnDiscardText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: FontSize.md },
  modalBtnSave: { flex: 2, paddingVertical: 14, borderRadius: Radius.full, alignItems: 'center', backgroundColor: Colors.primary },
  modalBtnSaveText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
