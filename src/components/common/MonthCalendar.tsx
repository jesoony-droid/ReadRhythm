import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '../../constants/tokens';
import { useState } from 'react';
import type { DayStats } from '../../store/sessionStore';

const WEEK_DAYS = ['월', '화', '수', '목', '금', '토', '일'];

interface Props {
  getMonthStats: (year: number, month: number) => Map<string, DayStats>;
}

export function MonthCalendar({ getMonthStats }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const stats = getMonthStats(year, month);

  // 월의 첫 날 요일 (월=0 기준으로 변환)
  const firstDay = new Date(year, month, 1).getDay(); // 0=일
  const startOffset = (firstDay + 6) % 7; // 월요일 기준
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // 6행 맞추기
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const isNextDisabled = year === now.getFullYear() && month === now.getMonth();

  return (
    <View style={styles.wrap}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{year}년 {month + 1}월</Text>
        <TouchableOpacity style={styles.navBtn} onPress={nextMonth} disabled={isNextDisabled}>
          <Text style={[styles.navText, isNextDisabled && styles.navDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.weekRow}>
        {WEEK_DAYS.map((d) => (
          <Text key={d} style={styles.weekDay}>{d}</Text>
        ))}
      </View>

      {/* 날짜 그리드 */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`empty-${i}`} style={styles.cell} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const stat = stats.get(dateStr);
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;

          return (
            <View key={dateStr} style={styles.cell}>
              <View style={[
                styles.dayCircle,
                stat?.goalAchieved && styles.dayGoal,
                stat?.hasSession && !stat.goalAchieved && styles.dayPartial,
                isToday && !stat?.goalAchieved && styles.dayToday,
              ]}>
                <Text style={[
                  styles.dayNum,
                  isFuture && styles.dayFuture,
                  stat?.goalAchieved && styles.dayNumGoal,
                  isToday && !stat?.goalAchieved && styles.dayNumToday,
                ]}>
                  {day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* 범례 */}
      <View style={styles.legend}>
        <LegendItem color={Colors.primary} label="목표 달성" />
        <LegendItem color={Colors.primaryMid} label="부분 독서" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const CELL_SIZE = 36;

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  navBtn: { padding: 8 },
  navText: { fontSize: 22, color: Colors.primary, fontWeight: '700' },
  navDisabled: { color: Colors.border },
  monthLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  weekRow: { flexDirection: 'row' },
  weekDay: { flex: 1, textAlign: 'center', fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted, paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dayCircle: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayGoal: { backgroundColor: Colors.primary },
  dayPartial: { backgroundColor: Colors.primaryLight, borderWidth: 1.5, borderColor: Colors.primaryMid },
  dayToday: { borderWidth: 1.5, borderColor: Colors.primary },
  dayNum: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.text },
  dayFuture: { color: Colors.border },
  dayNumGoal: { color: '#fff', fontWeight: '700' },
  dayNumToday: { color: Colors.primary, fontWeight: '700' },
  legend: { flexDirection: 'row', gap: Spacing.md, paddingTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FontSize.xs, color: Colors.textMuted },
});
