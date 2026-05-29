import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../src/constants/tokens';
import { useSessionStore } from '../src/store/sessionStore';
import type { PlanKey } from '../src/store/sessionStore';

interface Plan {
  key: PlanKey;
  label: string;
  monthlyPrice: string;
  annualPrice: string;
  annualNote: string;
  color: string;
  bg: string;
  highlight?: boolean;
  features: string[];
  missing: string[];
}

const PLANS: Plan[] = [
  {
    key: 'free',
    label: 'Free',
    monthlyPrice: '무료',
    annualPrice: '무료',
    annualNote: '',
    color: Colors.textSub,
    bg: Colors.surface,
    features: ['타이머 & 서재 관리', '기본 통계', '나만의 한줄 (월 10개)', '일일 목표 설정'],
    missing: ['AI 도서 추천', '코치 리포트', 'BGM 매칭', '무제한 나만의 한줄'],
  },
  {
    key: 'premium',
    label: 'Premium',
    monthlyPrice: '₩4,900/월',
    annualPrice: '₩3,900/월',
    annualNote: '연 ₩46,800 · 20% 절약',
    color: Colors.primary,
    bg: Colors.dark,
    highlight: true,
    features: [
      'Free 모든 기능',
      'AI 맞춤 도서 추천 (궁합%)',
      '주간 AI 코치 리포트',
      '감성 BGM 자동 매칭',
      '무제한 나만의 한줄',
      '12주 성장 그래프',
      '배지 전체 해금',
    ],
    missing: [],
  },
  {
    key: 'team',
    label: 'Team',
    monthlyPrice: '₩2,900/인·월',
    annualPrice: '₩2,300/인·월',
    annualNote: '5인 이상 · 연 결제 시',
    color: Colors.purple,
    bg: Colors.surface,
    features: [
      'Premium 모든 기능',
      '그룹 서재 공유',
      '독서 클럽 챌린지',
      '팀 통계 대시보드',
      '어드민 관리 콘솔',
    ],
    missing: [],
  },
];

const PLAN_RANK: Record<PlanKey, number> = { free: 0, premium: 1, team: 2 };

export default function SubscriptionScreen() {
  const router = useRouter();
  const currentPlan = useSessionStore((s) => s.plan);
  const setPlan = useSessionStore((s) => s.setPlan);
  const [annual, setAnnual] = useState(false);

  function handleSelect(plan: Plan) {
    if (plan.key === currentPlan) return;

    const isUpgrade = PLAN_RANK[plan.key] > PLAN_RANK[currentPlan];
    const price = annual ? plan.annualPrice : plan.monthlyPrice;
    const note = annual && plan.annualNote ? `\n${plan.annualNote}` : '';

    if (plan.key === 'free') {
      Alert.alert(
        '무료 플랜으로 변경',
        'AI 추천, 코치 리포트 등 프리미엄 기능을 더 이상 사용할 수 없어요. 정말 변경할까요?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '변경하기',
            style: 'destructive',
            onPress: () => {
              setPlan('free');
              Alert.alert('변경 완료', '무료 플랜으로 변경됐어요.');
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      `${plan.label} 플랜 ${isUpgrade ? '업그레이드' : '변경'}`,
      `${price}${note}\n\n구독을 시작할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '시작하기',
          onPress: () => {
            setPlan(plan.key);
            Alert.alert(
              `${plan.label} 시작!`,
              `${plan.label} 플랜이 활성화됐어요. 모든 기능을 자유롭게 사용해보세요!`,
              [{ text: '확인', onPress: () => router.back() }]
            );
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← 돌아가기</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ReadRhythm+</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroWrap}>
          <Text style={styles.heroTitle}>독서를 더 깊게,{'\n'}더 스마트하게</Text>
          <Text style={styles.heroSub}>AI와 함께하는 개인화 독서 경험</Text>
        </View>

        {/* 월간 / 연간 토글 */}
        <View style={styles.toggleWrap}>
          <TouchableOpacity
            style={[styles.toggleBtn, !annual && styles.toggleBtnActive]}
            onPress={() => setAnnual(false)}
          >
            <Text style={[styles.toggleText, !annual && styles.toggleTextActive]}>월간</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, annual && styles.toggleBtnActive]}
            onPress={() => setAnnual(true)}
          >
            <Text style={[styles.toggleText, annual && styles.toggleTextActive]}>연간</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>20% 절약</Text>
            </View>
          </TouchableOpacity>
        </View>

        {PLANS.map((plan) => {
          const isCurrent = plan.key === currentPlan;
          return (
            <View key={plan.key} style={[
              styles.planCard,
              plan.highlight && styles.planCardHighlight,
              isCurrent && styles.planCardCurrent,
              { backgroundColor: plan.bg },
            ]}>
              {plan.highlight && !isCurrent && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>⭐ 인기</Text>
                </View>
              )}
              {isCurrent && (
                <View style={[styles.popularBadge, { backgroundColor: Colors.green }]}>
                  <Text style={styles.popularText}>✓ 현재 플랜</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planLabel, { color: plan.color }]}>{plan.label}</Text>
                  <Text style={[styles.planPrice, plan.highlight && { color: '#fff' }]}>
                    {annual ? plan.annualPrice : plan.monthlyPrice}
                  </Text>
                  {annual && plan.annualNote ? (
                    <Text style={styles.planPriceNote}>{plan.annualNote}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[
                    styles.selectBtn,
                    { backgroundColor: isCurrent ? Colors.green : plan.color },
                    isCurrent && styles.selectBtnCurrent,
                  ]}
                  onPress={() => handleSelect(plan)}
                  disabled={isCurrent}
                >
                  <Text style={styles.selectBtnText}>
                    {isCurrent ? '이용 중' : plan.key === 'free' ? '다운그레이드' : '시작하기'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {plan.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={[styles.featureCheck, { color: plan.color }]}>✓</Text>
                  <Text style={[styles.featureText, plan.highlight && { color: 'rgba(255,255,255,0.85)' }]}>{f}</Text>
                </View>
              ))}

              {plan.missing.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={styles.featureMinus}>−</Text>
                  <Text style={styles.featureMissing}>{f}</Text>
                </View>
              ))}
            </View>
          );
        })}

        <Text style={styles.footerNote}>
          언제든지 취소 가능 · 구독 갱신 3일 전 알림 · 연간 구독 시 20% 할인
        </Text>
      </ScrollView>
    </SafeAreaView>
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

  heroWrap: { paddingVertical: Spacing.lg, alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, textAlign: 'center', lineHeight: 34 },
  heroSub: { fontSize: FontSize.md, color: Colors.textSub },

  toggleWrap: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: Radius.full, padding: 4, borderWidth: 1, borderColor: Colors.border,
    alignSelf: 'center', gap: 4,
  },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 20, borderRadius: Radius.full,
  },
  toggleBtnActive: { backgroundColor: Colors.primary },
  toggleText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  toggleTextActive: { color: '#fff' },
  saveBadge: {
    backgroundColor: Colors.accentLight, borderRadius: Radius.full,
    paddingVertical: 2, paddingHorizontal: 6,
  },
  saveBadgeText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.accent },

  planCard: {
    borderRadius: Radius.md, padding: Spacing.lg, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.card, position: 'relative',
  },
  planCardHighlight: { borderColor: Colors.primary, borderWidth: 2 },
  planCardCurrent: { borderColor: Colors.green, borderWidth: 2 },
  popularBadge: {
    position: 'absolute', top: -12, alignSelf: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 3, paddingHorizontal: 14,
  },
  popularText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },

  planHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  planLabel: { fontSize: FontSize.sm, fontWeight: '700', letterSpacing: 1 },
  planPrice: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginTop: 2 },
  planPriceNote: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  selectBtn: { borderRadius: Radius.full, paddingVertical: 8, paddingHorizontal: 18 },
  selectBtnCurrent: { opacity: 0.85 },
  selectBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  featureRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  featureCheck: { fontSize: FontSize.sm, fontWeight: '700', width: 16, marginTop: 1 },
  featureText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSub, lineHeight: 20 },
  featureMinus: { fontSize: FontSize.sm, color: Colors.border, width: 16, marginTop: 1 },
  featureMissing: { flex: 1, fontSize: FontSize.sm, color: Colors.border, lineHeight: 20 },

  footerNote: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
