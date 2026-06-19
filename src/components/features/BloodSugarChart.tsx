import React, { useEffect } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop, G, ClipPath, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { BloodSugarLog } from '../../types/app.types';
import { useTheme } from '../../hooks/useTheme';
import { formatBloodSugarValue } from '../../utils/bloodSugar';

interface BloodSugarChartProps {
  logs: BloodSugarLog[];
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

export function BloodSugarChart({ logs }: BloodSugarChartProps) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  // Screen width minus padding
  const chartWidth = windowWidth - 48;
  const chartHeight = 220;
  const paddingLeft = 32;
  const paddingRight = 15;
  const paddingTop = 24;
  const paddingBottom = 28;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  // Animation shared values
  const drawProgress = useSharedValue(0);
  const dotScale = useSharedValue(0);

  useEffect(() => {
    drawProgress.value = 0;
    dotScale.value = 0;

    // Draw the trendlines
    drawProgress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });

    // Pop the dots into view
    dotScale.value = withDelay(
      800,
      withSpring(1, { damping: 12, stiffness: 100 })
    );
  }, [logs]);

  const clipRectProps = useAnimatedProps(() => ({
    width: paddingLeft + drawProgress.value * (chartWidth - paddingLeft),
  }));

  const dotProps = useAnimatedProps(() => ({
    r: dotScale.value * 4.5,
  }));

  if (logs.length === 0) {
    return (
      <View 
        style={[{ height: chartHeight, borderColor: colors.border, backgroundColor: colors.surface }, { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: 24, paddingHorizontal: 24 }]} 
      >
        <Text style={[{ color: colors.textSecondary }, { fontWeight: 'bold', fontSize: 14 }]}>No logs yet</Text>
        <Text style={[{ color: colors.textMuted }, { fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 20 }]}>
          Add readings to view your Fasting vs Post-Meal clinical trends.
        </Text>
      </View>
    );
  }

  // Group logs by day to form a chronological timeline
  const groupedByDay = logs.reduce((acc, log) => {
    const d = new Date(log.timestamp);
    const dayStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!acc[dayStr]) {
      acc[dayStr] = { date: d, timestamp: log.timestamp, fasting: null, postMeal: null };
    }
    if (log.type === 'fasting' && (!acc[dayStr].fasting || log.timestamp > acc[dayStr].fasting.timestamp)) {
      acc[dayStr].fasting = log;
    }
    if (log.type === 'post-meal' && (!acc[dayStr].postMeal || log.timestamp > acc[dayStr].postMeal.timestamp)) {
      acc[dayStr].postMeal = log;
    }
    return acc;
  }, {} as Record<string, { date: Date; timestamp: number; fasting: BloodSugarLog | null; postMeal: BloodSugarLog | null; }>);

  // Take the last 7 distinct days
  const chartDays = Object.values(groupedByDay)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-7);

  // Find min and max values to scale Y axis
  const unit = logs[0].unit;
  let allValues: number[] = [];
  chartDays.forEach(day => {
    if (day.fasting) allValues.push(day.fasting.value);
    if (day.postMeal) allValues.push(day.postMeal.value);
  });
  
  if (allValues.length === 0) allValues = [0];

  const defaultMin = unit === 'mg/dL' ? 60 : 3.0;
  const defaultMax = unit === 'mg/dL' ? 220 : 12.0;

  const yMin = Math.max(0, Math.min(defaultMin, ...allValues) - (unit === 'mg/dL' ? 10 : 0.5));
  const yMax = Math.max(defaultMax, ...allValues) + (unit === 'mg/dL' ? 20 : 1.0);
  const yRange = yMax - yMin;

  // Build points for fasting and postMeal
  const fastingPoints: {x: number, y: number, value: number, log: BloodSugarLog}[] = [];
  const postMealPoints: {x: number, y: number, value: number, log: BloodSugarLog}[] = [];
  const xLabels: {x: number, label: string}[] = [];

  chartDays.forEach((day, index) => {
    const x = paddingLeft + (chartDays.length > 1 ? (index / (chartDays.length - 1)) * graphWidth : graphWidth / 2);
    
    xLabels.push({
      x,
      label: day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    });

    if (day.fasting) {
      const y = paddingTop + graphHeight - ((day.fasting.value - yMin) / yRange) * graphHeight;
      fastingPoints.push({ x, y, value: day.fasting.value, log: day.fasting });
    }
    if (day.postMeal) {
      const y = paddingTop + graphHeight - ((day.postMeal.value - yMin) / yRange) * graphHeight;
      postMealPoints.push({ x, y, value: day.postMeal.value, log: day.postMeal });
    }
  });

  // Calculate smooth Bezier path
  const createSmoothPath = (pts: {x: number, y: number}[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.1} ${pts[0].y}`;
    
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 3;
      const cp1y = curr.y;
      const cp2x = curr.x + (2 * (next.x - curr.x)) / 3;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const fastingPath = createSmoothPath(fastingPoints);
  const postMealPath = createSmoothPath(postMealPoints);

  const getPointColor = (status: BloodSugarLog['status']) => {
    switch (status) {
      case 'low': return '#f97316';
      case 'normal': return '#22C55E';
      case 'pre-diabetes': return '#F5A623';
      case 'diabetes': return '#DC2626';
      default: return colors.primary;
    }
  };

  const gridLines = [];
  const stepCount = 4;
  for (let i = 0; i <= stepCount; i++) {
    const val = yMin + (i / stepCount) * yRange;
    const y = paddingTop + graphHeight - (i / stepCount) * graphHeight;
    gridLines.push({ y, val });
  }

  // iOS Apple Health styled colors
  const colorFasting = '#0A84FF'; // iOS Blue
  const colorPostMeal = colors.primary; // App Primary

  return (
    <View 
      style={[{ backgroundColor: colors.surface, borderColor: colors.border }, { borderWidth: 1, padding: 20, borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, marginBottom: 16 }]} 
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={[{ color: colors.text }, { fontWeight: '900', fontSize: 14 }]}>Clinical Trends</Text>
        <Text style={[{ color: colors.textMuted }, { fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase' }]}>Last {chartDays.length} Days</Text>
      </View>
      
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <ClipPath id="chartDrawClip">
            <AnimatedRect x={0} y={0} height={chartHeight} animatedProps={clipRectProps} />
          </ClipPath>
        </Defs>

        {/* Grid lines & Y Axis */}
        {gridLines.map((line, idx) => (
          <G key={`grid-${idx}`}>
            <Line
              x1={paddingLeft}
              y1={line.y}
              x2={chartWidth - paddingRight}
              y2={line.y}
              stroke={colors.border}
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <SvgText
              x={paddingLeft - 8}
              y={line.y + 3}
              fontSize="9"
              fill={colors.textMuted}
              textAnchor="end"
              fontWeight="800"
            >
              {formatBloodSugarValue(line.val, unit)}
            </SvgText>
          </G>
        ))}

        {/* X Axis Labels */}
        {xLabels.map((lbl, idx) => (
          <SvgText
            key={`xlbl-${idx}`}
            x={lbl.x}
            y={chartHeight - 4}
            fontSize="8.5"
            fill={colors.textMuted}
            textAnchor="middle"
            fontWeight="700"
          >
            {lbl.label}
          </SvgText>
        ))}

        {/* Clipped Group for animated draw in */}
        <G clipPath="url(#chartDrawClip)">
          {/* Post-Meal Line */}
          {postMealPath && (
            <Path
              d={postMealPath}
              fill="none"
              stroke={colorPostMeal}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
            />
          )}

          {/* Fasting Line */}
          {fastingPath && (
            <Path
              d={fastingPath}
              fill="none"
              stroke={colorFasting}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
            />
          )}
        </G>

        {/* Data points */}
        {[...fastingPoints, ...postMealPoints].map((pt, idx) => (
          <G key={`point-${idx}`}>
            <AnimatedCircle
              cx={pt.x}
              cy={pt.y}
              fill={getPointColor(pt.log.status)}
              stroke={colors.surface}
              strokeWidth="2.5"
              animatedProps={dotProps}
            />
            <SvgText
              x={pt.x}
              y={pt.y - 12}
              fontSize="9"
              fontWeight="900"
              fill={colors.text}
              textAnchor="middle"
              opacity={idx < (fastingPoints.length + postMealPoints.length) ? 1 : 0}
            >
              {formatBloodSugarValue(pt.value, unit)}
            </SvgText>
          </G>
        ))}
      </Svg>

      {/* Chart Legend */}
      <View 
        style={[{ borderColor: colors.border }, { marginTop: 20, paddingTop: 16, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <LegendLineItem color={colorFasting} label="Fasting" colors={colors} />
          <LegendLineItem color={colorPostMeal} label="Post-Meal" colors={colors} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LegendDotItem color={colors.warning} label="Pre" colors={colors} />
          <LegendDotItem color={colors.error} label="High" colors={colors} />
          <LegendDotItem color={colors.success} label="Normal" colors={colors} />
        </View>
      </View>
    </View>
  );
}

function LegendLineItem({ color, label, colors }: { color: string; label: string; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ backgroundColor: color, width: 12, height: 3, borderRadius: 1.5, marginRight: 8 }} />
      <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}

function LegendDotItem({ color, label, colors }: { color: string; label: string; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ backgroundColor: color, width: 6, height: 6, borderRadius: 3, marginRight: 4 }} />
      <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}
