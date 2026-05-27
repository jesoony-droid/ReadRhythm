import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { Colors, FontSize, Spacing } from '../../constants/tokens';

export interface WeekData {
  week: string;
  minutes: number;
}

interface Props {
  data: WeekData[];
  goalMinutes?: number;
  height?: number;
}

export function WeeklyChart({ data, goalMinutes = 30 * 7, height = 160 }: Props) {
  const maxMinutes = Math.max(...data.map((d) => d.minutes), goalMinutes, 1);
  const last12 = data.slice(-12);

  return (
    <View style={[styles.wrap, { height: height + 28 }]}>
      {/* 목표선 */}
      <View style={[styles.goalLine, { bottom: 24 + (goalMinutes / maxMinutes) * height }]}>
        <Text style={styles.goalLabel}>목표</Text>
      </View>

      {/* 바 차트 */}
      <View style={[styles.barsRow, { height }]}>
        {last12.map((d, i) => (
          <Bar
            key={i}
            index={i}
            minutes={d.minutes}
            maxMinutes={maxMinutes}
            goalMinutes={goalMinutes}
            totalHeight={height}
          />
        ))}
      </View>

      {/* X축 레이블 */}
      <View style={styles.labels}>
        {last12.map((d, i) => (
          <Text key={i} style={styles.xLabel} numberOfLines={1}>{d.week}</Text>
        ))}
      </View>
    </View>
  );
}

function Bar({ index, minutes, maxMinutes, goalMinutes, totalHeight }: {
  index: number; minutes: number; maxMinutes: number; goalMinutes: number; totalHeight: number;
}) {
  const heightPercent = minutes / maxMinutes;
  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withDelay(
      index * 50,
      withTiming(heightPercent, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, [minutes]);

  const barStyle = useAnimatedStyle(() => ({
    height: anim.value * totalHeight,
  }));

  const color = minutes === 0 ? Colors.border
    : minutes >= goalMinutes ? Colors.primary
    : Colors.primaryMid;

  return (
    <View style={styles.barWrap}>
      <View style={[styles.barBg, { height: totalHeight }]}>
        <Animated.View style={[styles.barFill, barStyle, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  goalLine: {
    position: 'absolute',
    left: 0, right: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.accent,
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  goalLabel: { fontSize: FontSize.xs, color: Colors.accent, marginTop: -10, paddingRight: 2 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barWrap: { flex: 1, alignItems: 'center' },
  barBg: { width: '80%', justifyContent: 'flex-end', backgroundColor: Colors.bg, borderRadius: 4 },
  barFill: { borderRadius: 4, width: '100%' },
  labels: { flexDirection: 'row', marginTop: 4 },
  xLabel: { flex: 1, textAlign: 'center', fontSize: 9, color: Colors.textMuted },
});
