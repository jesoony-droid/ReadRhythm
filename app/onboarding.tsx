import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../src/constants/tokens';
import { useSessionStore } from '../src/store/sessionStore';

const TOTAL_STEPS = 3;

const PRESETS = [
  { label: '입문', emoji: '🌱', minutes: 15, pages: 10 },
  { label: '기본', emoji: '📖', minutes: 30, pages: 20 },
  { label: '심화', emoji: '🔥', minutes: 60, pages: 40 },
  { label: '도전', emoji: '🏆', minutes: 90, pages: 60 },
] as const;

const FEATURES = [
  { emoji: '⏱', title: '독서 타이머', desc: '3중 링 타이머로 집중 독서, 뽀모도로 모드 지원' },
  { emoji: '📚', title: '스마트 서재', desc: '읽는 중·완독·읽고 싶은 책 한눈에 관리' },
  { emoji: '🤖', title: 'AI 사서', desc: '5,910건 실제 사서 답변 기반 도서 추천·질문 응답' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const setNickname = useSessionStore((s) => s.setNickname);
  const setDailyGoal = useSessionStore((s) => s.setDailyGoal);
  const setHasOnboarded = useSessionStore((s) => s.setHasOnboarded);

  const [step, setStep] = useState(0);
  const [nameInput, setNameInput] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(1); // 기본(30분/20p)

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  function finish() {
    if (nameInput.trim()) setNickname(nameInput.trim());
    setDailyGoal(PRESETS[selectedPreset].minutes, PRESETS[selectedPreset].pages);
    setHasOnboarded(true);
    router.replace('/(tabs)');
  }

  const canNext = step !== 1 || nameInput.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 진행 표시 */}
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && <StepWelcome />}
          {step === 1 && (
            <StepProfile
              nameInput={nameInput}
              setNameInput={setNameInput}
            />
          )}
          {step === 2 && (
            <StepGoal
              selectedPreset={selectedPreset}
              setSelectedPreset={setSelectedPreset}
            />
          )}
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
              <Text style={styles.backBtnText}>← 이전</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canNext}
          >
            <Text style={styles.nextBtnText}>
              {step === TOTAL_STEPS - 1 ? '시작하기 🚀' : '다음'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepWelcome() {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.bigEmoji}>📖</Text>
      <Text style={styles.stepTitle}>ReadRhythm에{'\n'}오신 것을 환영해요!</Text>
      <Text style={styles.stepDesc}>
        AI와 함께하는 스마트 독서 습관 앱{'\n'}나만의 독서 리듬을 만들어보세요
      </Text>

      <View style={styles.featureList}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <Text style={styles.featureEmoji}>{f.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function StepProfile({
  nameInput, setNameInput,
}: {
  nameInput: string;
  setNameInput: (v: string) => void;
}) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.bigEmoji}>✏️</Text>
      <Text style={styles.stepTitle}>닉네임을 정해볼까요?</Text>
      <Text style={styles.stepDesc}>앱 전반에 표시되는 이름이에요{'\n'}나중에 내정보에서 변경 가능해요</Text>

      <View style={styles.inputWrap}>
        <TextInput
          style={styles.nameInput}
          placeholder="예) 책벌레, 김독서, 페이지터너"
          placeholderTextColor={Colors.textMuted}
          value={nameInput}
          onChangeText={setNameInput}
          maxLength={12}
          autoFocus
          returnKeyType="done"
        />
        <Text style={styles.inputCount}>{nameInput.length}/12</Text>
      </View>

      {nameInput.trim().length === 0 && (
        <Text style={styles.inputHint}>닉네임을 입력해야 다음으로 넘어갈 수 있어요</Text>
      )}
    </View>
  );
}

function StepGoal({
  selectedPreset, setSelectedPreset,
}: {
  selectedPreset: number;
  setSelectedPreset: (i: number) => void;
}) {
  const preset = PRESETS[selectedPreset];
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.bigEmoji}>🎯</Text>
      <Text style={styles.stepTitle}>하루 독서 목표를{'\n'}설정해볼까요?</Text>
      <Text style={styles.stepDesc}>언제든지 내정보 › 목표 설정에서 변경할 수 있어요</Text>

      <View style={styles.presetGrid}>
        {PRESETS.map((p, i) => (
          <TouchableOpacity
            key={p.label}
            style={[styles.presetCard, i === selectedPreset && styles.presetCardActive]}
            onPress={() => setSelectedPreset(i)}
            activeOpacity={0.8}
          >
            <Text style={styles.presetEmoji}>{p.emoji}</Text>
            <Text style={[styles.presetLabel, i === selectedPreset && styles.presetLabelActive]}>
              {p.label}
            </Text>
            <Text style={[styles.presetValues, i === selectedPreset && styles.presetValuesActive]}>
              {p.minutes}분 · {p.pages}p
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.selectedSummary}>
        <Text style={styles.selectedSummaryText}>
          하루 <Text style={styles.highlight}>{preset.minutes}분</Text> 독서,{' '}
          <Text style={styles.highlight}>{preset.pages}페이지</Text> 목표로 시작해요
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  progressRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  progressDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border,
  },
  progressDotActive: { backgroundColor: Colors.primary, width: 24 },

  scroll: { flexGrow: 1, padding: Spacing.lg },

  stepWrap: { alignItems: 'center', gap: Spacing.lg, paddingTop: Spacing.md },
  bigEmoji: { fontSize: 72 },
  stepTitle: {
    fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text,
    textAlign: 'center', lineHeight: 36,
  },
  stepDesc: {
    fontSize: FontSize.md, color: Colors.textSub,
    textAlign: 'center', lineHeight: 22,
  },

  featureList: {
    width: '100%', gap: Spacing.sm, marginTop: Spacing.sm,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, ...Shadow.card,
  },
  featureEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
  featureTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  featureDesc: { fontSize: FontSize.sm, color: Colors.textSub, marginTop: 2, lineHeight: 18 },

  inputWrap: { width: '100%', position: 'relative' },
  nameInput: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: FontSize.lg, color: Colors.text, textAlign: 'center',
    ...Shadow.card,
  },
  inputCount: {
    position: 'absolute', right: Spacing.sm, bottom: -20,
    fontSize: FontSize.xs, color: Colors.textMuted,
  },
  inputHint: {
    fontSize: FontSize.xs, color: Colors.textMuted,
    textAlign: 'center', marginTop: Spacing.md,
  },

  presetGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    width: '100%', justifyContent: 'center',
  },
  presetCard: {
    flexBasis: '47%', backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: Spacing.md,
    alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: Colors.border,
    ...Shadow.card,
  },
  presetCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  presetEmoji: { fontSize: 28 },
  presetLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSub },
  presetLabelActive: { color: Colors.primary },
  presetValues: { fontSize: FontSize.sm, color: Colors.textMuted },
  presetValuesActive: { color: Colors.primary },

  selectedSummary: {
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.primaryMid,
    width: '100%',
  },
  selectedSummaryText: {
    fontSize: FontSize.md, color: Colors.textSub, textAlign: 'center', lineHeight: 22,
  },
  highlight: { fontWeight: '700', color: Colors.primary },

  footer: {
    flexDirection: 'row', gap: Spacing.sm,
    padding: Spacing.md, paddingBottom: Spacing.lg,
  },
  backBtn: {
    paddingVertical: 16, paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  backBtnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSub },
  nextBtn: {
    flex: 1, backgroundColor: Colors.primary,
    borderRadius: Radius.full, paddingVertical: 16,
    alignItems: 'center', ...Shadow.card,
  },
  nextBtnDisabled: { backgroundColor: Colors.primaryMid },
  nextBtnText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
});
