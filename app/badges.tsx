import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../src/constants/tokens';
import { useBadgeStore, type Badge } from '../src/store/badgeStore';

export default function BadgesScreen() {
  const router = useRouter();
  const badges = useBadgeStore((s) => s.badges);
  const unlocked = badges.filter((b) => b.unlockedAt);
  const locked = badges.filter((b) => !b.unlockedAt);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← 돌아가기</Text>
        </TouchableOpacity>
        <Text style={styles.title}>배지 컬렉션</Text>
        <Text style={styles.count}>{unlocked.length}/{badges.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {unlocked.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>획득한 배지</Text>
            <View style={styles.grid}>
              {unlocked.map((b) => (
                <BadgeCard key={b.id} badge={b} onLongPress={() => setSelectedBadge(b)} />
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>도전 중인 배지</Text>
        <View style={styles.grid}>
          {locked.map((b) => (
            <BadgeCard key={b.id} badge={b} locked onLongPress={() => setSelectedBadge(b)} />
          ))}
        </View>
      </ScrollView>

      {/* 배지 상세 툴팁 모달 (홍수경 어노테이션 배지) */}
      <Modal visible={!!selectedBadge} transparent animationType="fade" onRequestClose={() => setSelectedBadge(null)}>
        <Pressable style={styles.tooltipOverlay} onPress={() => setSelectedBadge(null)}>
          <Pressable style={styles.tooltipCard} onPress={(e) => e.stopPropagation()}>
            {selectedBadge && (
              <>
                <View style={[styles.tooltipEmojiWrap, !selectedBadge.unlockedAt && styles.tooltipEmojiLocked]}>
                  <Text style={[styles.tooltipEmoji, !selectedBadge.unlockedAt && { opacity: 0.4 }]}>
                    {selectedBadge.emoji}
                  </Text>
                </View>
                <Text style={styles.tooltipTitle}>{selectedBadge.title}</Text>
                <Text style={styles.tooltipDesc}>{selectedBadge.desc}</Text>
                <View style={styles.tooltipDivider} />
                <View style={styles.tooltipMeta}>
                  {selectedBadge.unlockedAt ? (
                    <>
                      <View style={styles.tooltipBadgeGreen}>
                        <Text style={styles.tooltipBadgeGreenText}>✅ 획득 완료</Text>
                      </View>
                      <Text style={styles.tooltipDate}>
                        {new Date(selectedBadge.unlockedAt).toLocaleDateString('ko-KR')} 획득
                      </Text>
                    </>
                  ) : (
                    <>
                      <View style={styles.tooltipBadgeGold}>
                        <Text style={styles.tooltipBadgeGoldText}>+{selectedBadge.xp} XP</Text>
                      </View>
                      <Text style={styles.tooltipLocked}>🔒 아직 잠겨 있어요</Text>
                    </>
                  )}
                </View>
                <TouchableOpacity style={styles.tooltipCloseBtn} onPress={() => setSelectedBadge(null)}>
                  <Text style={styles.tooltipCloseBtnText}>닫기</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function BadgeCard({ badge, locked, onLongPress }: { badge: Badge; locked?: boolean; onLongPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(locked ? 0.95 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(locked ? 0.4 : 1)).current;

  useEffect(() => {
    if (!locked && badge.unlockedAt) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [badge.unlockedAt]);

  const date = badge.unlockedAt ? new Date(badge.unlockedAt) : null;

  return (
    <Animated.View style={[styles.badgeCard, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <Pressable onLongPress={onLongPress} onPress={onLongPress} style={styles.badgePressable}>
        <View style={[styles.badgeEmojiWrap, locked && styles.badgeEmojiLocked]}>
          <Text style={[styles.badgeEmoji, locked && { opacity: 0.3 }]}>{badge.emoji}</Text>
          {locked && <Text style={styles.lockIcon}>🔒</Text>}
        </View>
        <Text style={[styles.badgeTitle, locked && styles.badgeTitleLocked]}>{badge.title}</Text>
        <Text style={styles.badgeDesc} numberOfLines={2}>{badge.desc}</Text>
        {!locked && date && (
          <Text style={styles.badgeDate}>{date.getMonth() + 1}/{date.getDate()} 획득</Text>
        )}
        {locked && (
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>+{badge.xp}XP</Text>
          </View>
        )}
        <Text style={styles.tapHint}>탭하여 상세 보기</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md,
  },
  backText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  count: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  scroll: { padding: Spacing.md, paddingBottom: 60 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badgeCard: {
    width: '30%', backgroundColor: Colors.surface, borderRadius: Radius.md,
    ...Shadow.card,
  },
  badgePressable: { padding: Spacing.sm, alignItems: 'center', gap: 4 },
  badgeEmojiWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  badgeEmojiLocked: { backgroundColor: Colors.border },
  badgeEmoji: { fontSize: 28 },
  lockIcon: { position: 'absolute', bottom: -2, right: -2, fontSize: 14 },
  badgeTitle: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  badgeTitleLocked: { color: Colors.textMuted },
  badgeDesc: { fontSize: 9, color: Colors.textMuted, textAlign: 'center', lineHeight: 13 },
  badgeDate: { fontSize: 9, color: Colors.primary, fontWeight: '600' },
  xpBadge: { backgroundColor: Colors.goldLight, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  xpText: { fontSize: 9, fontWeight: '700', color: Colors.gold },
  tapHint: { fontSize: 8, color: Colors.border, marginTop: 2 },

  // 툴팁 모달
  tooltipOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', padding: Spacing.xl,
  },
  tooltipCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.xl, width: '100%', maxWidth: 320,
    alignItems: 'center', gap: Spacing.sm, ...Shadow.card,
  },
  tooltipEmojiWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  tooltipEmojiLocked: { backgroundColor: Colors.border },
  tooltipEmoji: { fontSize: 36 },
  tooltipTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  tooltipDesc: { fontSize: FontSize.sm, color: Colors.textSub, textAlign: 'center', lineHeight: 20 },
  tooltipDivider: { height: 1, backgroundColor: Colors.border, width: '100%', marginVertical: 4 },
  tooltipMeta: { alignItems: 'center', gap: 6 },
  tooltipBadgeGreen: {
    backgroundColor: Colors.greenLight, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 4,
  },
  tooltipBadgeGreenText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.green },
  tooltipBadgeGold: {
    backgroundColor: Colors.goldLight, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 4,
  },
  tooltipBadgeGoldText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.gold },
  tooltipDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  tooltipLocked: { fontSize: FontSize.xs, color: Colors.textMuted },
  tooltipCloseBtn: {
    marginTop: 8, backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 10, paddingHorizontal: 32,
  },
  tooltipCloseBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
});
