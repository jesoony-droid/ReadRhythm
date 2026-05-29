import { View, Text, StyleSheet } from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import { Colors, FontSize, Spacing } from '../../constants/tokens';

const GENRE_COLORS = [
  '#3B5BDB', '#7048E8', '#2F9E44', '#F76707',
  '#E03131', '#F59F00', '#0C8599', '#862E9C',
  '#C0CA33', '#E91E63',
];

interface Props {
  data: Record<string, number>;
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number, inner: number) {
  const s = polarToCartesian(cx, cy, r, startDeg);
  const e = polarToCartesian(cx, cy, r, endDeg);
  const si = polarToCartesian(cx, cy, inner, startDeg);
  const ei = polarToCartesian(cx, cy, inner, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${s.x} ${s.y}`,
    `A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`,
    `L ${ei.x} ${ei.y}`,
    `A ${inner} ${inner} 0 ${large} 0 ${si.x} ${si.y}`,
    'Z',
  ].join(' ');
}

export function GenreDonutChart({ data, size = 180 }: Props) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 8;
  const innerR = outerR * 0.55;

  let startAngle = 0;
  const segments = entries.map(([genre, count], i) => {
    const angle = (count / total) * 360;
    const path = arcPath(cx, cy, outerR, startAngle, startAngle + angle - 1, innerR);
    const seg = { genre, count, color: GENRE_COLORS[i % GENRE_COLORS.length], path };
    startAngle += angle;
    return seg;
  });

  if (entries.length === 0) {
    return (
      <View style={[styles.wrap, { width: size }]}>
        <View style={[styles.emptyCircle, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={styles.emptyText}>📚</Text>
        </View>
        <Text style={styles.emptyLabel}>서재에 책을 추가하면{'\n'}장르 분포가 보여요</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {segments.map((seg, i) => (
          <Path key={i} d={seg.path} fill={seg.color} />
        ))}
        <Circle cx={cx} cy={cy} r={innerR - 4} fill={Colors.surface} />
      </Svg>

      {/* 범례 */}
      <View style={styles.legend}>
        {segments.slice(0, 6).map((seg, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
            <Text style={styles.legendGenre} numberOfLines={1}>{seg.genre || '기타'}</Text>
            <Text style={styles.legendPct}>{Math.round((seg.count / total) * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  wrap: { alignItems: 'center', gap: Spacing.md },
  emptyCircle: {
    backgroundColor: Colors.bg, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontSize: 36 },
  emptyLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  legend: { flex: 1, gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 16, height: 16, borderRadius: 8, flexShrink: 0 },
  legendGenre: { flex: 1, fontSize: 24, color: Colors.textSub },
  legendPct: { fontSize: 24, fontWeight: '700', color: Colors.text },
});
