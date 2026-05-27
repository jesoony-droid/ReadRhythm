import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../src/constants/tokens';
import { useSessionStore } from '../src/store/sessionStore';

// ── 프리셋 ───────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: '입문',   emoji: '🌱', minutes: 15, pages: 10, desc: '부담 없이 시작하는 독서 습관' },
  { label: '기본',   emoji: '📖', minutes: 30, pages: 20, desc: '꾸준한 독서의 표준 목표' },
  { label: '심화',   emoji: '🔥', minutes: 60, pages: 40, desc: '진지한 독서가를 위한 목표' },
  { label: '도전',   emoji: '🏆', minutes: 90, pages: 60, desc: '독서 마라토너의 목표' },
] as const;

// ── 스텝 설정 ─────────────────────────────────────────────────────────────────

const TIME_MIN  = 10;
const TIME_MAX  = 180;
const TIME_STEP = 5;

const PAGE_MIN  = 5;
const PAGE_MAX  = 100;
const PAGE_STEP = 5;

// ── 메인 화면 ────────────────────────────────────────────────────────────────

export default function GoalSettingsScreen() {
  const router = useRouter();
  const savedGoalMin   = useSessionStore((s) => s.dailyGoalMinutes);
  const savedGoalPages = useSessionStore((s) => s.dailyGoalPages);
  const setDailyGoal   = useSessionStore((s) => s.setDailyGoal);
  const todayMinutes   = useSessionStore((s) => s.todayMinutes);
  const todayPages     = useSessionStore((s) => s.todayPages);

  const [goalMin,   setGoalMin]   = useState(savedGoalMin);
  const [goalPages, setGoalPages] = useState(savedGoalPages);

  // 변경 여부
  const isDirty = goalMin !== savedGoalMin || goalPages !== savedGoalPages;

  // 오늘 달성률 미리보기
  const todayMin  = todayMinutes();
  const todayPg   = todayPages();
  const minPct    = Math.min(todayMin  / goalMin   * 100, 100);
  const pagesPct  = Math.min(todayPg   / goalPages * 100, 100);

  // 선택된 프리셋
  const activePreset = PRESETS.findIndex(
    (p) => p.minutes === goalMin && p.pages === goalPages,
  );

  function handleSave() {
    setDailyGoal(goalMin, goalPages);
    Alert.alert(
      '목표 저장됨',
      `하루 ${goalMin}분 · ${goalPages}페이지 목표가 적용됐어요!`,
      [{ text: '확인', onPress: () => router.back() }],
    );
  }

  function adjustMin(delta: number) {
    setGoalMin((v) => Math.min(TIME_MAX, Math.max(TIME_MIN, v + delta)));
  }

  function adjustPages(delta: number) {
    setGoalPages((v) => Math.min(PAGE_MAX, Math.max(PAGE_MIN, v + delta)));
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* 헤더 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← 돌아가기</Text>
        </TouchableOpacity>
        <Text style={styles.title}>목표 설정</Text>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── 프리셋 카드 ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 선택</Text>
          <View style={styles.presetRow}>
            {PRESETS.map((p, i) => (
              <TouchableOpacity
                key={p.label}
                style={[styles.presetCard, i === activePreset && styles.presetCardActive]}
                onPress={() => { setGoalMin(p.minutes); setGoalPages(p.pages); }}
                activeOpacity={0.8}
              >
                <Text style={styles.presetEmoji}>{p.emoji}</Text>
                <Text style={[styles.presetLabel, i === activePreset && styles.presetLabelActive]}>
                  {p.label}
                </Text>
                <Text style={[styles.presetValues, i === activePreset && styles.presetValuesActive]}>
                  {p.minutes}분 · {p.pages}p
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {activePreset >= 0 && (
            <Text style={styles.presetDesc}>{PRESETS[activePreset].desc}</Text>
          )}
        </View>

        {/* ── 세부 조정 ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>세부 조정</Text>

          {/* 독서 시간 */}
          <View style={styles.adjustCard}>
            <View style={styles.adjustHeader}>
              <Text style={styles.adjustIcon}>⏱</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.adjustLabel}>하루 독서 시간</Text>
                <Text style={styles.adjustRange}>{TIME_MIN}분 ~ {TIME_MAX}분 · {TIME_STEP}분 단위</Text>
              </View>
            </View>
            <View style={styles.stepRow}>
              <TouchableOpacity
                style={[styles.stepBtn, goalMin <= TIME_MIN && styles.stepBtnDisabled]}
                onPress={() => adjustMin(-TIME_STEP)}
                disabled={goalMin <= TIME_MIN}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepValueWrap}>
                <Text style={styles.stepValue}>{goalMin}</Text>
                <Text style={styles.stepUnit}>분</Text>
              </View>
              <TouchableOpacity
                style={[styles.stepBtn, goalMin >= TIME_MAX && styles.stepBtnDisabled]}
                onPress={() => adjustMin(TIME_STEP)}
                disabled={goalMin >= TIME_MAX}
              >
                <Text style={styles.stepBtnText}>＋</Text>
              </TouchableOpacity>
            </View>
            {/* 진행 바 미리보기 */}
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>오늘 달성</Text>
              <View style={styles.previewBarBg}>
                <View style={[styles.previewBarFill, { width: `${minPct}%` as any }]} />
              </View>
              <Text style={styles.previewPct}>{Math.round(minPct)}%</Text>
            </View>
            <Text style={styles.previewSub}>
              {todayMin}분 / {goalMin}분
            </Text>
          </View>

          {/* 페이지 목표 */}
          <View style={styles.adjustCard}>
            <View style={styles.adjustHeader}>
              <Text style={styles.adjustIcon}>📄</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.adjustLabel}>하루 읽기 페이지</Text>
                <Text style={styles.adjustRange}>{PAGE_MIN}p ~ {PAGE_MAX}p · {PAGE_STEP}p 단위</Text>
              </View>
            </View>
            <View style={styles.stepRow}>
              <TouchableOpacity
                style={[styles.stepBtn, goalPages <= PAGE_MIN && styles.stepBtnDisabled]}
                onPress={() => adjustPages(-PAGE_STEP)}
                disabled={goalPages <= PAGE_MIN}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepValueWrap}>
                <Text style={styles.stepValue}>{goalPages}</Text>
                <Text style={styles.stepUnit}>페이지</Text>
              </View>
              <TouchableOpacity
                style={[styles.stepBtn, goalPages >= PAGE_MAX && styles.stepBtnDisabled]}
                onPress={() => adjustPages(PAGE_STEP)}
                disabled={goalPages >= PAGE_MAX}
              >
                <Text style={styles.stepBtnText}>＋</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>오늘 달성</Text>
              <View style={styles.previewBarBg}>
                <View style={[styles.previewBarFill, {
                  width: `${pagesPct}%` as any,
                  backgroundColor: Colors.green,
                }]} />
              </View>
              <Text style={styles.previewPct}>{Math.round(pagesPct)}%</Text>
            </View>
            <Text style={styles.previewSub}>
              {todayPg}p / {goalPages}p
            </Text>
          </View>
        </View>

        {/* ── 목표 달성 조건 안내 ──────────────────────────────── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 목표 달성 기준</Text>
          <Text style={styles.infoText}>
            시간 목표({goalMin}분)와 페이지 목표({goalPages}p){'\n'}
            <Text style={{ fontWeight: '700' }}>모두 달성</Text>해야 캘린더에 {' '}
            <Text style={{ color: Colors.primary, fontWeight: '700' }}>●</Text>
            {' '}표시되고 XP가 부여돼요.
          </Text>
        </View>

        {/* ── 저장 버튼 ────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.saveBtn, !isDirty && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isDirty}
        >
          <Text style={styles.saveBtnText}>
            {isDirty ? '목표 저장하기' : '현재 목표와 동일해요'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  backText:  { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  title:     { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },

  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 48 },

  section:      { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },

  // ── 프리셋 ──
  presetRow: { flexDirection: 'row', gap: Spacing.sm },
  presetCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  presetCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  presetEmoji:  { fontSize: 22 },
  presetLabel:  { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSub },
  presetLabelActive: { color: Colors.primary },
  presetValues: { fontSize: FontSize.xs, color: Colors.textMuted },
  presetValuesActive: { color: Colors.primary },
  presetDesc:   {
    fontSize: FontSize.xs,
    color: Colors.textSub,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    fontStyle: 'italic',
  },

  // ── 조정 카드 ──
  adjustCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  adjustHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  adjustIcon:   { fontSize: 24 },
  adjustLabel:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  adjustRange:  { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryMid,
  },
  stepBtnDisabled: {
    backgroundColor: Colors.bg,
    borderColor: Colors.border,
  },
  stepBtnText: { fontSize: 24, fontWeight: '700', color: Colors.primary, lineHeight: 28 },
  stepValueWrap: { alignItems: 'center', gap: 2 },
  stepValue: { fontSize: 44, fontWeight: '700', color: Colors.text, lineHeight: 50 },
  stepUnit:  { fontSize: FontSize.sm, color: Colors.textMuted },

  // 미리보기 바
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  previewLabel: { fontSize: FontSize.xs, color: Colors.textMuted, width: 44 },
  previewBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  previewBarFill: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  previewPct:  { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary, width: 32, textAlign: 'right' },
  previewSub:  { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },

  // ── 안내 ──
  infoCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
  },
  infoTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  infoText:  { fontSize: FontSize.sm, color: Colors.textSub, lineHeight: 20 },

  // ── 저장 버튼 ──
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.card,
  },
  saveBtnDisabled: { backgroundColor: Colors.primaryMid },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
