import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';

interface Props {
  size: number;
  strokeWidth: number;
  progress: number; // 0 to 1
  color: string;
  label: string;
  current: number;
  goal: number;
  unit: string;
}

export default function ProgressRing({
  size,
  strokeWidth,
  progress,
  color,
  label,
  current,
  goal,
  unit,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(progress, 1);
  const strokeDashoffset = circumference * (1 - clampedProgress);
  const center = size / 2;

  const isOver = progress > 1;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.card2}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={isOver ? Colors.orange : color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={styles.labelContainer}>
        <Text style={[styles.current, { color: isOver ? Colors.orange : color }]}>
          {Math.round(current)}
        </Text>
        <Text style={styles.unit}>{unit}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.goal}>/ {Math.round(goal)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  current: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: -2,
  },
  label: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goal: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});
