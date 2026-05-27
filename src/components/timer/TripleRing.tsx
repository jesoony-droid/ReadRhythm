import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Circle, Svg, G } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RINGS = [
  { r: 108, color: '#3B5BDB', trackColor: 'rgba(59,91,219,0.15)' }, // 바깥: 일일 목표 시간
  { r: 86,  color: '#7048E8', trackColor: 'rgba(112,72,232,0.15)' }, // 중간: 현재 세션
  { r: 64,  color: '#2F9E44', trackColor: 'rgba(47,158,68,0.15)'  }, // 안쪽: 일일 목표 페이지
] as const;

const STROKE = 14;
const SIZE = 260;

interface Props {
  outerProgress: number;  // 0~1: 일일 목표 시간
  middleProgress: number; // 0~1: 현재 세션
  innerProgress: number;  // 0~1: 일일 목표 페이지
}

export function TripleRing({ outerProgress, middleProgress, innerProgress }: Props) {
  const progresses = [outerProgress, middleProgress, innerProgress];

  return (
    <View style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE} viewBox={`-130 -130 260 260`}>
        <G>
          {RINGS.map((ring, i) => (
            <RingPair
              key={ring.r}
              r={ring.r}
              color={ring.color}
              trackColor={ring.trackColor}
              progress={Math.min(Math.max(progresses[i], 0), 1)}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

function RingPair({
  r, color, trackColor, progress,
}: {
  r: number; color: string; trackColor: string; progress: number;
}) {
  const circumference = 2 * Math.PI * r;
  const offset = useSharedValue(circumference);

  useEffect(() => {
    offset.value = withTiming(circumference * (1 - progress), {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, circumference]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  return (
    <>
      {/* 트랙 (배경 링) */}
      <Circle
        r={r}
        strokeWidth={STROKE}
        stroke={trackColor}
        fill="none"
        strokeDasharray={circumference}
      />
      {/* 진행 링 */}
      <AnimatedCircle
        r={r}
        strokeWidth={STROKE}
        stroke={color}
        fill="none"
        strokeDasharray={circumference}
        strokeLinecap="round"
        transform="rotate(-90)"
        animatedProps={animatedProps}
      />
    </>
  );
}
