import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/tokens';
import { useBgmStore, MOODS, NAT_SOUNDS, type NatSound } from '../../src/store/bgmStore';
import { useShelfStore } from '../../src/store/shelfStore';
import { useBgmPlayer } from '../../src/hooks/useBgmPlayer';
import { useNatPlayer } from '../../src/hooks/useNatPlayer';

type BgmTab = 'music' | 'nature';

export default function BgmScreen() {
  const [activeTab, setActiveTab] = useState<BgmTab>('music');

  const currentMood        = useBgmStore((s) => s.currentMood);
  const isPlaying          = useBgmStore((s) => s.isPlaying);
  const currentTrack       = useBgmStore((s) => s.currentTrack);
  const isSpotifyConnected = useBgmStore((s) => s.isSpotifyConnected);
  const setMood            = useBgmStore((s) => s.setMood);
  const togglePlay         = useBgmStore((s) => s.togglePlay);
  const connectSpotify     = useBgmStore((s) => s.connectSpotify);
  const currentNat         = useBgmStore((s) => s.currentNat);
  const isNatPlaying       = useBgmStore((s) => s.isNatPlaying);
  const mixEnabled         = useBgmStore((s) => s.mixEnabled);
  const musicVolume        = useBgmStore((s) => s.musicVolume);
  const natVolume          = useBgmStore((s) => s.natVolume);
  const setNat             = useBgmStore((s) => s.setNat);
  const toggleNat          = useBgmStore((s) => s.toggleNat);
  const toggleMix          = useBgmStore((s) => s.toggleMix);

  const shelfItems   = useShelfStore((s) => s.items);
  const readingBooks = shelfItems.filter((i) => i.status === 'READING');

  const musicVol = mixEnabled ? musicVolume / 100 : 0.65;
  const natVol   = mixEnabled ? natVolume / 100   : 0.7;
  useBgmPlayer(currentMood, isPlaying, musicVol);
  useNatPlayer(currentNat, isNatPlaying, natVol);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const rotateLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isPlaying) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: false }),
        ])
      );
      rotateLoop.current = Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 8000, useNativeDriver: false })
      );
      pulseLoop.current.start();
      rotateLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      rotateLoop.current?.stop();
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    }
    return () => { pulseLoop.current?.stop(); rotateLoop.current?.stop(); };
  }, [isPlaying]);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const mood = MOODS.find((m) => m.key === currentMood);
  const natInfo = NAT_SOUNDS.find((n) => n.key === currentNat);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>독서 BGM</Text>
          {isSpotifyConnected ? (
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedText}>✓ Spotify</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.spotifyBtn} onPress={connectSpotify}>
              <Text style={styles.spotifyBtnText}>🎵 Spotify 연결</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 자동 매칭 카드 */}
        {readingBooks.length > 0 && (
          <View style={styles.autoCard}>
            <Text style={styles.autoLabel}>📖 지금 읽는 책</Text>
            <Text style={styles.autoBook} numberOfLines={1}>{readingBooks[0].book.title}</Text>
            <TouchableOpacity style={styles.autoMatchBtn} onPress={() => setMood('focus')}>
              <Text style={styles.autoMatchText}>✨ 분위기 자동 매칭</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 플레이어 */}
        <View style={styles.playerArea}>
          <Animated.View style={[
            styles.disc,
            mood && { backgroundColor: mood.color + '30', borderColor: mood.color },
            { transform: [{ scale: pulseAnim }, { rotate: spin }] },
          ]}>
            <Text style={styles.discEmoji}>{mood?.emoji ?? '🎵'}</Text>
          </Animated.View>
          <View style={styles.trackInfo}>
            {currentTrack ? (
              <>
                <Text style={styles.trackTitle}>{currentTrack.title}</Text>
                <Text style={styles.trackArtist}>{currentTrack.artist}</Text>
              </>
            ) : (
              <Text style={styles.noTrack}>분위기를 선택해 시작하세요</Text>
            )}
          </View>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlBtn} disabled={!currentMood}>
              <Text style={[styles.controlIcon, !currentMood && { opacity: 0.3 }]}>⏮</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playBtn, mood && { backgroundColor: mood.color }]}
              onPress={currentMood ? togglePlay : undefined}
              disabled={!currentMood}
            >
              <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} disabled={!currentMood}>
              <Text style={[styles.controlIcon, !currentMood && { opacity: 0.3 }]}>⏭</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 탭: 음악 | 자연음 */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'music' && styles.tabBtnActive]}
            onPress={() => setActiveTab('music')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'music' && styles.tabBtnTextActive]}>🎵 음악</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'nature' && styles.tabBtnActive]}
            onPress={() => setActiveTab('nature')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'nature' && styles.tabBtnTextActive]}>🌿 자연음</Text>
          </TouchableOpacity>
        </View>

        {/* 음악 탭 */}
        {activeTab === 'music' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>분위기 선택</Text>
            <View style={styles.moodGrid}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.moodCard,
                    currentMood === m.key && {
                      borderColor: m.color, borderWidth: 2,
                      backgroundColor: m.color + '18',
                    },
                  ]}
                  onPress={() => setMood(m.key)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodName, currentMood === m.key && { color: m.color, fontWeight: '700' }]}>
                    {m.label}
                  </Text>
                  <Text style={styles.moodDesc} numberOfLines={2}>{m.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {!isSpotifyConnected && (
              <View style={styles.spotifyNotice}>
                <Text style={styles.noticeText}>Spotify 연결 시 실제 플레이리스트가 재생됩니다</Text>
                <TouchableOpacity style={styles.connectBigBtn} onPress={connectSpotify}>
                  <Text style={styles.connectBigText}>🎵 Spotify로 연결하기</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* 자연음 탭 */}
        {activeTab === 'nature' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>자연음 / ASMR 선택</Text>
            <View style={styles.natGrid}>
              {NAT_SOUNDS.map((n) => (
                <TouchableOpacity
                  key={n.key}
                  style={[styles.natCard, currentNat === n.key && styles.natCardActive]}
                  onPress={() => setNat(n.key as NatSound)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.natEmoji}>{n.emoji}</Text>
                  <Text style={[styles.natLabel, currentNat === n.key && styles.natLabelActive]}>
                    {n.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 현재 자연음 재생 카드 */}
            {currentNat && natInfo && (
              <View style={styles.natPlayCard}>
                <View style={styles.natPlayRow}>
                  <Text style={styles.natPlayEmoji}>{natInfo.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.natPlayName}>{natInfo.label}</Text>
                    <Text style={styles.natPlayDesc}>{natInfo.desc}</Text>
                  </View>
                  <TouchableOpacity onPress={toggleNat}>
                    <Text style={styles.natPlayBtn}>{isNatPlaying ? '⏸' : '▶'}</Text>
                  </TouchableOpacity>
                </View>
                {/* 볼륨 슬라이더 (시각 표시용) */}
                <View style={styles.volRow}>
                  <Text style={styles.volIcon}>🔉</Text>
                  <View style={styles.volTrack}>
                    <View style={[styles.volFill, { width: `${natVolume}%` as any }]} />
                  </View>
                  <Text style={styles.volIcon}>🔊</Text>
                </View>
              </View>
            )}

            {/* 음악 + 자연음 믹서 */}
            <View style={[styles.mixCard, mixEnabled && styles.mixCardActive]}>
              <View style={styles.mixHeader}>
                <Text style={styles.mixTitle}>🎛 음악 + 자연음 믹서</Text>
                <TouchableOpacity
                  style={[styles.mixToggle, mixEnabled && styles.mixToggleOn]}
                  onPress={toggleMix}
                >
                  <Text style={[styles.mixToggleText, mixEnabled && styles.mixToggleTextOn]}>
                    {mixEnabled ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>
              {mixEnabled && (
                <View style={styles.mixSliders}>
                  <View style={styles.sliderRow}>
                    <Text style={styles.sliderLabel}>🎵 음악</Text>
                    <View style={styles.sliderTrack}>
                      <View style={[styles.sliderFill, { width: `${musicVolume}%` as any, backgroundColor: Colors.primary }]} />
                    </View>
                    <Text style={styles.sliderVal}>{musicVolume}%</Text>
                  </View>
                  <View style={styles.sliderRow}>
                    <Text style={styles.sliderLabel}>🌿 자연음</Text>
                    <View style={styles.sliderTrack}>
                      <View style={[styles.sliderFill, { width: `${natVolume}%` as any, backgroundColor: Colors.green }]} />
                    </View>
                    <Text style={styles.sliderVal}>{natVolume}%</Text>
                  </View>
                  <Text style={styles.mixHint}>음악과 자연음을 동시에 재생해 나만의 독서 공간을 만들어보세요</Text>
                </View>
              )}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },
  scroll: { padding: Spacing.md, paddingBottom: 80, gap: Spacing.md },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: '#fff' },
  spotifyBtn: { backgroundColor: '#1DB954', borderRadius: Radius.full, paddingVertical: 6, paddingHorizontal: 14 },
  spotifyBtnText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },
  connectedBadge: { backgroundColor: '#1DB95420', borderRadius: Radius.full, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: '#1DB954' },
  connectedText: { fontSize: FontSize.xs, fontWeight: '700', color: '#1DB954' },

  autoCard: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: Radius.md, padding: Spacing.md, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  autoLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  autoBook: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  autoMatchBtn: { alignSelf: 'flex-start', backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 6, paddingHorizontal: 14 },
  autoMatchText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },

  playerArea: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md },
  disc: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  discEmoji: { fontSize: 48 },
  trackInfo: { alignItems: 'center', gap: 4, minHeight: 44 },
  trackTitle: { fontSize: FontSize.lg, fontWeight: '700', color: '#fff' },
  trackArtist: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)' },
  noTrack: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.3)' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  controlBtn: { padding: Spacing.sm },
  controlIcon: { fontSize: 22, color: 'rgba(255,255,255,0.6)' },
  playBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 20, color: '#fff' },

  // 탭
  tabRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: 3, gap: 2 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  tabBtnTextActive: { color: '#fff', fontWeight: '700' },

  section: { gap: Spacing.md },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },

  // 음악 분위기
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  moodCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.md, padding: Spacing.md, gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  moodEmoji: { fontSize: 28 },
  moodName: { fontSize: FontSize.md, fontWeight: '600', color: '#fff' },
  moodDesc: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.4)', lineHeight: 16 },

  // 자연음
  natGrid: { flexDirection: 'row', gap: Spacing.sm },
  natCard: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  natCardActive: { backgroundColor: Colors.primaryLight + '22', borderColor: Colors.primary },
  natEmoji: { fontSize: 22 },
  natLabel: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  natLabelActive: { color: Colors.primaryMid, fontWeight: '700' },

  natPlayCard: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  natPlayRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  natPlayEmoji: { fontSize: 24 },
  natPlayName: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  natPlayDesc: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  natPlayBtn: { fontSize: 22, color: '#fff' },
  volRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  volIcon: { fontSize: 14 },
  volTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  volFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2 },

  // 믹서
  mixCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: Spacing.sm },
  mixCardActive: { borderColor: Colors.green + '60', backgroundColor: Colors.green + '08' },
  mixHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mixTitle: { fontSize: FontSize.sm, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  mixToggle: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 14 },
  mixToggleOn: { backgroundColor: Colors.green + '30' },
  mixToggleText: { fontSize: FontSize.xs, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  mixToggleTextOn: { color: Colors.green },
  mixSliders: { gap: 10 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', width: 52 },
  sliderTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  sliderFill: { height: '100%', borderRadius: 2 },
  sliderVal: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.4)', width: 32, textAlign: 'right' },
  mixHint: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 16 },

  spotifyNotice: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  noticeText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 18 },
  connectBigBtn: { backgroundColor: '#1DB954', borderRadius: Radius.full, paddingVertical: 10, paddingHorizontal: 28 },
  connectBigText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
});
