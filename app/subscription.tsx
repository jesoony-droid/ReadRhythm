import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../src/constants/tokens';

interface Plan {
  key: string;
  label: string;
  price: string;
  priceNote?: string;
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
    price: '무료',
    color: Colors.textSub,
    bg: Colors.surface,
    features: ['타이머 & 서재 관리', '기본 통계', '문장 수집 (월 10개)', '일일 목표 설정'],
    missing: ['AI 도서 추천', '코치 리포트', 'BGM 매칭', '무제한 문장 수집'],
  },
  {
    key: 'premium',
    label: 'Premium',
    price: '₩4,900/월',
    color: Colors.primary,
    bg: Colors.dark,
    highlight: true,
    features: [
      'Free 모든 기능',
      'AI 맞춤 도서 추천 (궁합%)',
      '주간 AI 코치 리포트',
      '감성 BGM 자동 매칭',
      '무제한 문장 수집',
      '12주 성장 그래프',
      '배지 전체 해금',
    ],
    missing: [],
  },
  {
    key: 'team',
    label: 'Team',
    price: '₩2,900/인·월',
    priceNote: '(5인 이상)',
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

export default function SubscriptionScreen() {
  const router = useRouter();

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

        {PLANS.map((plan) => (
          <View key={plan.key} style={[
            styles.planCard,
            plan.highlight && styles.planCardHighlight,
            { backgroundColor: plan.bg },
          ]}>
            {plan.highlight && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>⭐ 인기</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planLabel, { color: plan.color }]}>{plan.label}</Text>
                <Text style={[styles.planPrice, plan.highlight && { color: '#fff' }]}>{plan.price}</Text>
                {'priceNote' in plan && plan.priceNote && (
                  <Text style={styles.planPriceNote}>{plan.priceNote}</Text>
                )}
              </View>
              <TouchableOpacity style={[styles.selectBtn, { backgroundColor: plan.color }]}>
                <Text style={styles.selectBtnText}>
                  {plan.key === 'free' ? '현재 플랜' : '시작하기'}
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

            {plan.missing.length > 0 && plan.missing.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureMinus}>−</Text>
                <Text style={styles.featureMissing}>{f}</Text>
              </View>
            ))}
          </View>
        ))}

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

  planCard: {
    borderRadius: Radius.md, padding: Spacing.lg, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.card, position: 'relative',
  },
  planCardHighlight: { borderColor: Colors.primary, borderWidth: 2 },
  popularBadge: {
    position: 'absolute', top: -12, alignSelf: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 3, paddingHorizontal: 14,
  },
  popularText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },

  planHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  planLabel: { fontSize: FontSize.sm, fontWeight: '700', letterSpacing: 1 },
  planPrice: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginTop: 2 },
  planPriceNote: { fontSize: FontSize.xs, color: Colors.textMuted },
  selectBtn: { borderRadius: Radius.full, paddingVertical: 8, paddingHorizontal: 18 },
  selectBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  featureRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  featureCheck: { fontSize: FontSize.sm, fontWeight: '700', width: 16, marginTop: 1 },
  featureText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSub, lineHeight: 20 },
  featureMinus: { fontSize: FontSize.sm, color: Colors.border, width: 16, marginTop: 1 },
  featureMissing: { flex: 1, fontSize: FontSize.sm, color: Colors.border, lineHeight: 20 },

  footerNote: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
