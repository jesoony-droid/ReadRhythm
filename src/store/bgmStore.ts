import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BgmMood = 'focus' | 'emotional' | 'energetic' | 'calm';
export type NatSound = 'rain' | 'forest' | 'cafe' | 'wave' | 'white';

export const MOODS: Array<{ key: BgmMood; label: string; emoji: string; desc: string; color: string }> = [
  { key: 'focus',     label: '집중', emoji: '🎯', desc: '깊은 몰입을 위한 잔잔한 음악',    color: '#3B5BDB' },
  { key: 'emotional', label: '감성', emoji: '🌙', desc: '감정을 풍부하게 만드는 선율',     color: '#7048E8' },
  { key: 'energetic', label: '활기', emoji: '⚡', desc: '독서 의욕을 높이는 경쾌한 리듬',  color: '#F76707' },
  { key: 'calm',      label: '평온', emoji: '🌿', desc: '마음을 차분하게 가라앉히는 소리', color: '#2F9E44' },
];

export const NAT_SOUNDS: Array<{ key: NatSound; label: string; emoji: string; desc: string }> = [
  { key: 'rain',   label: '빗소리',      emoji: '🌧️', desc: '창문에 떨어지는 빗소리' },
  { key: 'forest', label: '숲속',        emoji: '🌲', desc: '새소리 + 바람 + 나뭇잎' },
  { key: 'cafe',   label: '카페소음',    emoji: '☕', desc: '커피숍 배경 소음' },
  { key: 'wave',   label: '파도',        emoji: '🌊', desc: '해변의 파도 소리' },
  { key: 'white',  label: '화이트노이즈', emoji: '⬜', desc: '집중을 돕는 백색소음' },
];

interface BgmState {
  isSpotifyConnected: boolean;
  currentMood: BgmMood | null;
  isPlaying: boolean;
  currentTrack: { title: string; artist: string } | null;
  // 자연음
  currentNat: NatSound | null;
  isNatPlaying: boolean;
  musicVolume: number;   // 0~100
  natVolume: number;     // 0~100
  mixEnabled: boolean;
  setMood: (mood: BgmMood) => void;
  togglePlay: () => void;
  connectSpotify: () => void;
  setNat: (nat: NatSound) => void;
  toggleNat: () => void;
  toggleMix: () => void;
  setMusicVolume: (v: number) => void;
  setNatVolume: (v: number) => void;
}

const MOCK_TRACKS: Record<BgmMood, { title: string; artist: string }> = {
  focus:     { title: 'Weightless',         artist: 'Marconi Union'    },
  emotional: { title: 'Experience',         artist: 'Ludovico Einaudi' },
  energetic: { title: 'Clair de Lune',      artist: 'Claude Debussy'   },
  calm:      { title: 'River Flows in You', artist: 'Yiruma'           },
};

export const useBgmStore = create<BgmState>()(
  persist(
    (set) => ({
      isSpotifyConnected: false,
      currentMood: null,
      isPlaying: false,      // 재시작 시 항상 false (재생 중 상태는 유지 안 함)
      currentTrack: null,
      currentNat: null,
      isNatPlaying: false,   // 재시작 시 항상 false
      musicVolume: 70,
      natVolume: 50,
      mixEnabled: false,

      setMood: (mood) =>
        set({ currentMood: mood, currentTrack: MOCK_TRACKS[mood], isPlaying: true }),

      togglePlay: () =>
        set((s) => ({ isPlaying: !s.isPlaying })),

      connectSpotify: () =>
        set({ isSpotifyConnected: true }),

      setNat: (nat) =>
        set({ currentNat: nat, isNatPlaying: true }),

      toggleNat: () =>
        set((s) => ({ isNatPlaying: !s.isNatPlaying })),

      toggleMix: () =>
        set((s) => ({ mixEnabled: !s.mixEnabled })),

      setMusicVolume: (v) => set({ musicVolume: v }),
      setNatVolume: (v) => set({ natVolume: v }),
    }),
    {
      name: 'readrhythm-bgm',
      storage: createJSONStorage(() => AsyncStorage),
      // 재생 상태(isPlaying, isNatPlaying)는 앱 재시작 시 초기화 — 설정값만 저장
      partialize: (state) => ({
        currentMood: state.currentMood,
        currentNat: state.currentNat,
        musicVolume: state.musicVolume,
        natVolume: state.natVolume,
        mixEnabled: state.mixEnabled,
      }),
    }
  )
);
