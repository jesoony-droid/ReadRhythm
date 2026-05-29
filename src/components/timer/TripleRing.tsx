import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, Easing,
} from 'react-native-reanimated';
import { Path, Svg, G } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// 스타디움(운동장 트랙) 치수
const STROKE  = 14;
const SIZE_W  = 320;
const SIZE_H  = 170;

// 3개 트랙: 바깥→중간→안쪽
const TRACKS = [
  { a: 148, b: 76, color: '#5B7EFF', trackColor: 'rgba(91,126,255,0.2)'  },
  { a: 116, b: 58, color: '#9B6DFF', trackColor: 'rgba(155,109,255,0.2)' },
  { a:  84, b: 40, color: '#30D158', trackColor: 'rgba(48,209,88,0.2)'   },
] as const;

// 스타디움 SVG path (center=0,0, 상단 중심에서 시계방향 출발)
function stadiumPath(a: number, b: number): string {
  const x = a - b; // 직선 구간 끝점
  return (
    `M 0 ${-b} ` +
    `L ${x} ${-b} ` +
    `A ${b} ${b} 0 1 1 ${x} ${b} ` +
    `L ${-x} ${b} ` +
    `A ${b} ${b} 0 1 1 ${-x} ${-b} Z`
  );
}

// 스타디움 둘레: 4*(a-b) + 2π*b
function perim(a: number, b: number): number {
  return 4 * (a - b) + 2 * Math.PI * b;
}

interface Props {
  outerProgress:  number; // 0~1: 일일 목표 시간
  middleProgress: number; // 0~1: 현재 세션
  innerProgress:  number; // 0~1: 일일 목표 페이지
}

export function TripleRing({ outerProgress, middleProgress, innerProgress }: Props) {
  const progresses = [outerProgress, middleProgress, innerProgress];

  return (
    <View style={{ width: SIZE_W, height: SIZE_H }}>
      <Svg
        width={SIZE_W}
        height={SIZE_H}
        viewBox={`${-SIZE_W / 2} ${-SIZE_H / 2} ${SIZE_W} ${SIZE_H}`}
      >
        <G>
          {TRACKS.map((track, i) => (
            <StadiumTrack
              key={i}
              a={track.a}
              b={track.b}
              color={track.color}
              trackColor={track.trackColor}
              progress={Math.min(Math.max(progresses[i], 0), 1)}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

function StadiumTrack({
  a, b, color, trackColor, progress,
}: {
  a: number; b: number; color: string; trackColor: string; progress: number;
}) {
  const p = perim(a, b);
  const offset = useSharedValue(p);

  useEffect(() => {
    offset.value = withTiming(p * (1 - progress), {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, p]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  const d = stadiumPath(a, b);

  return (
    <>
      {/* 배경 트랙 */}
      <Path d={d} stroke={trackColor} strokeWidth={STROKE} fill="none" />
      {/* 진행 트랙 */}
      <AnimatedPath
        d={d}
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeDasharray={p}
        strokeLinecap="round"
        animatedProps={animatedProps}
      />
    </>
  );
}
