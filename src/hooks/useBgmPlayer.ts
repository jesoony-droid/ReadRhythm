import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import type { BgmMood } from '../store/bgmStore';

// SoundHelix 무료 데모 트랙 (CORS 허용, 항상 접근 가능)
const TRACK_URLS: Record<BgmMood, string> = {
  focus:     'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  emotional: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  energetic: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  calm:      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3',
};

export function useBgmPlayer(mood: BgmMood | null, isPlaying: boolean, volume = 0.65) {
  const soundRef      = useRef<Audio.Sound | null>(null);
  const loadedMood    = useRef<BgmMood | null>(null);
  const isLoadingRef  = useRef(false);

  // 오디오 세션 설정 (웹에서는 지원 안 될 수 있어 try/catch)
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    }).catch(() => {});
  }, []);

  // mood 변경 → 새 트랙 로드
  useEffect(() => {
    if (!mood) return;
    if (loadedMood.current === mood) {
      // 같은 mood → 재생/일시정지만
      if (isPlaying) {
        soundRef.current?.playAsync().catch(() => {});
      } else {
        soundRef.current?.pauseAsync().catch(() => {});
      }
      return;
    }

    let cancelled = false;
    isLoadingRef.current = true;

    const load = async () => {
      // 기존 사운드 정리
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: TRACK_URLS[mood] },
          { isLooping: true, volume, shouldPlay: false }
        );

        if (cancelled) {
          await sound.unloadAsync().catch(() => {});
          return;
        }

        soundRef.current  = sound;
        loadedMood.current = mood;
        isLoadingRef.current = false;

        if (isPlaying) {
          await sound.playAsync().catch(() => {});
        }
      } catch (e) {
        console.warn('[BGM] 로드 실패:', e);
        isLoadingRef.current = false;
      }
    };

    load();
    return () => { cancelled = true; };
  }, [mood]);

  // isPlaying 변경 → 재생/일시정지
  useEffect(() => {
    if (!soundRef.current || isLoadingRef.current) return;
    if (isPlaying) {
      soundRef.current.playAsync().catch(() => {});
    } else {
      soundRef.current.pauseAsync().catch(() => {});
    }
  }, [isPlaying]);

  // volume 변경 → 실시간 반영
  useEffect(() => {
    soundRef.current?.setVolumeAsync(volume).catch(() => {});
  }, [volume]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current   = null;
      loadedMood.current = null;
    };
  }, []);
}
