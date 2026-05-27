import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import type { NatSound } from '../store/bgmStore';

// require()는 Metro가 빌드 타임에 정적 분석해야 해서 반드시 직접 작성
const NAT_ASSETS: Record<NatSound, any> = {
  rain:   require('../../assets/sounds/rain.mp3'),
  forest: require('../../assets/sounds/forest.mp3'),
  cafe:   require('../../assets/sounds/cafe.mp3'),
  wave:   require('../../assets/sounds/wave.mp3'),
  white:  require('../../assets/sounds/white.mp3'),
};

export function useNatPlayer(nat: NatSound | null, isPlaying: boolean, volume = 0.7) {
  const soundRef     = useRef<Audio.Sound | null>(null);
  const loadedNat    = useRef<NatSound | null>(null);
  const isLoadingRef = useRef(false);

  // 오디오 세션 초기화 (iOS 무음 모드에서도 재생, 백그라운드 유지)
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    }).catch(() => {});
  }, []);

  // nat 변경 → 새 사운드 로드
  useEffect(() => {
    if (!nat) return;

    if (loadedNat.current === nat) {
      if (isPlaying) soundRef.current?.playAsync().catch(() => {});
      else           soundRef.current?.pauseAsync().catch(() => {});
      return;
    }

    let cancelled = false;
    isLoadingRef.current = true;

    const load = async () => {
      // 기존 사운드 정리
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }

      try {
        const { sound } = await Audio.Sound.createAsync(
          NAT_ASSETS[nat],
          { isLooping: true, volume, shouldPlay: false }
        );

        if (cancelled) {
          await sound.unloadAsync().catch(() => {});
          return;
        }

        soundRef.current   = sound;
        loadedNat.current  = nat;
        isLoadingRef.current = false;

        if (isPlaying) await sound.playAsync().catch(() => {});
      } catch (e) {
        console.warn('[NatPlayer] 로드 실패:', nat, e);
        isLoadingRef.current = false;
      }
    };

    load();
    return () => { cancelled = true; };
  }, [nat]);

  // isPlaying 변경 → 재생 / 일시정지
  useEffect(() => {
    if (!soundRef.current || isLoadingRef.current) return;
    if (isPlaying) soundRef.current.playAsync().catch(() => {});
    else           soundRef.current.pauseAsync().catch(() => {});
  }, [isPlaying]);

  // volume 변경 → 실시간 반영
  useEffect(() => {
    soundRef.current?.setVolumeAsync(volume).catch(() => {});
  }, [volume]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      soundRef.current?.stopAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current  = null;
      loadedNat.current = null;
    };
  }, []);
}
