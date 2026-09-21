// frontend/src/components/BarChart.tsx
// ------------------------------------------------------------
// 꿈 기록 통계용 막대그래프. react-native-chart-kit으로는 연도 윗첨자 라벨과
// "칸이 적을 땐 가운데 정렬"을 할 수 없어 View로 직접 그린다.
// 칸 너비는 최대 칸 수(8) 기준으로 고정 → 막대가 1개면 한가운데, 늘어날수록 옆으로 퍼진다.
// ------------------------------------------------------------
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../theme/colors';
import {MAX_PERIODS} from '../logic/statsPeriods';

export type BarDatum = {
  label: string;
  /** 라벨 왼쪽 위에 작게 붙는 윗첨자(예: '26년') */
  superscript?: string;
  value: number;
};

type Props = {
  data: BarDatum[];
  unit?: string;
  height?: number;
};

const SLOT_WIDTH = `${100 / MAX_PERIODS}%` as const;

export default function BarChart({data, unit = '회', height = 160}: Props) {
  const max = Math.max(1, ...data.map(d => d.value));
  const lastIndex = data.length - 1;

  return (
    <View>
      <View style={[styles.plot, {height}]}>
        {data.map((d, i) => {
          // 0회 칸도 얇은 바닥 표시를 남긴다 — 완전히 비우면 '데이터 없는 칸'처럼 읽힌다.
          const barHeight = d.value === 0 ? 2 : Math.max(4, (d.value / max) * (height - 22));
          return (
            <View
              key={`${d.superscript ?? ''}${d.label}`}
              style={styles.slot}
              accessible
              accessibilityLabel={`${d.superscript ?? ''} ${d.label} ${d.value}${unit}`}>
              {d.value > 0 && (
                <Text style={styles.value}>
                  {d.value}
                  {unit}
                </Text>
              )}
              <View
                style={[
                  styles.bar,
                  {height: barHeight},
                  // 최신 칸(이번 주/이번 달)만 진하게 — 지금이 어디인지 한눈에 보이게
                  i !== lastIndex && styles.barPast,
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.baseline} />

      <View style={styles.labelRow}>
        {data.map((d, i) => (
          <View key={`${d.superscript ?? ''}${d.label}`} style={styles.slot}>
            <View style={styles.labelInner}>
              {d.superscript ? <Text style={styles.superscript}>{d.superscript}</Text> : null}
              <Text
                style={[styles.label, i === lastIndex && styles.labelCurrent]}
                numberOfLines={1}>
                {d.label}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  slot: {
    width: SLOT_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '62%',
    backgroundColor: Colors.accentPrimary,
  },
  barPast: {
    opacity: 0.5,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  baseline: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  labelInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  superscript: {
    color: Colors.textMuted,
    fontSize: 8,
    lineHeight: 10,
    marginRight: 1,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  labelCurrent: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
});
