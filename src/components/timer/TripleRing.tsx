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
  { r: 108, color: '#5B7EFF', trackColor: 'rgba(91,126,255,0.18)'  }, // 바깥: 일일 목표 시간
  { r: 86,  color: '#9B6DFF', trackColor: 'rgba(155,109,255,0.18)' }, // 중간: 현재 세션
  { r: 64,  color: '#30D158', trackColor: 'rgba(48,209,88,0.18)'   }, // 안쪽: 일일 목표 페이지
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
