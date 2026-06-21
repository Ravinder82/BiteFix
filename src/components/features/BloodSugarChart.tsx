import React, { useEffect, useRef } from 'react';
import { View,  useWindowDimensions, ScrollView } from 'react-native';
import { Text } from '@/components/Text';
import Svg, { Rect, Text as SvgText, Line, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withDelay,
  SharedValue,
} from 'react-native-reanimated';
import { BloodSugarLog } from '../../types/app.types';
import { useTheme } from '../../hooks/useTheme';
import { formatBloodSugarValue } from '../../utils/bloodSugar';

interface BloodSugarChartProps {
  logs: BloodSugarLog[];
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

// Child component to handle per-bar hooks without violating Rules of Hooks
function AnimatedBarItem({
  x,
  y,
  barWidth,
  height,
  value,
  color,
  bottomY,
  heightProgress,
  isFasting
}: {
  x: number;
  y: number;
  barWidth: number;
  height: number;
  value: number;
  color: string;
  bottomY: number;
  heightProgress: SharedValue<number>;
  isFasting: boolean;
}) {
  const { colors } = useTheme();
  
  const animatedRectProps = useAnimatedProps(() => ({
    height: heightProgress.value * height,
    y: bottomY - (heightProgress.value * height),
  }));

  const animatedTextProps = useAnimatedProps(() => ({
    opacity: heightProgress.value > 0.8 ? (heightProgress.value - 0.8) * 5 : 0,
    y: bottomY - (heightProgress.value * height) - 6,
  }));

  return (
    <G>
      <AnimatedRect
        x={x}
        width={barWidth}
        fill={isFasting ? 'url(#fastingGrad)' : 'url(#postMealGrad)'}
        rx={barWidth / 2}
        animatedProps={animatedRectProps}
      />
      <AnimatedSvgText
        x={x + (barWidth / 2)}
        fontSize="10"
        fontWeight="900"
        fill={colors.text}
        textAnchor="middle"
        animatedProps={animatedTextProps}
      >
        {Math.round(value)}
      </AnimatedSvgText>
    </G>
  );
}

export function BloodSugarChart({ logs }: BloodSugarChartProps) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);

  const containerWidth = windowWidth - 48; // Screen width minus horizontal padding
  const chartHeight = 240; 
  
  // Settings for dynamic scaling and rendering consecutive days
  const DAY_WIDTH = 65; // Minimum pixels per data point group
  const paddingLeft = 48; // Left padding for Y-Axis labels to prevent overlap
  const paddingRight = 24; 
  const internalPadding = 24; // Padding inside the graph to prevent first/last bar from touching edges
  const paddingTop = 36; // Extra space for value digits
  const paddingBottom = 28;
  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const bottomY = paddingTop + graphHeight;

  const heightProgress = useSharedValue(0);

  useEffect(() => {
    heightProgress.value = 0;

    heightProgress.value = withDelay(
      100,
      withSpring(1, { damping: 14, stiffness: 90 })
    );
    
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [logs]);

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
      acc[dayStr] = { 
        date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), // Normalized to midnight
        timestamp: log.timestamp, 
        fasting: null, 
        postMeal: null 
      };
    }
    if (log.type === 'fasting' && (!acc[dayStr].fasting || log.timestamp > acc[dayStr].fasting.timestamp)) {
      acc[dayStr].fasting = log;
    }
    if (log.type === 'post-meal' && (!acc[dayStr].postMeal || log.timestamp > acc[dayStr].postMeal.timestamp)) {
      acc[dayStr].postMeal = log;
    }
    return acc;
  }, {} as Record<string, { date: Date; timestamp: number; fasting: BloodSugarLog | null; postMeal: BloodSugarLog | null; }>);

  // Allow up to 30 history points to avoid huge memory, sorted chronologically
  const chartDays = Object.values(groupedByDay)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-30);

  // Space items sequentially and dynamically
  const drawableWidth = containerWidth - paddingLeft - paddingRight - (internalPadding * 2);
  const totalDaysDiff = Math.max(0, chartDays.length - 1);
  
  // Dynamically calculate day width so it stretches to fill the screen if there are few days
  const activeDayWidth = totalDaysDiff > 0 
    ? Math.max(DAY_WIDTH, drawableWidth / totalDaysDiff) 
    : DAY_WIDTH;
  
  // Total width required to draw all items sequentially
  const requiredWidth = paddingLeft + paddingRight + (internalPadding * 2) + (totalDaysDiff * activeDayWidth);
  const svgWidth = Math.max(containerWidth, requiredWidth);

  // Find min and max values to scale Y axis.
  const unit = logs[0].unit;
  let allValues: number[] = [];
  chartDays.forEach(day => {
    if (day.fasting) allValues.push(day.fasting.value);
    if (day.postMeal) allValues.push(day.postMeal.value);
  });
  if (allValues.length === 0) allValues = [0];

  const defaultMax = unit === 'mg/dL' ? 220 : 12.0;

  const yMin = 0; 
  const yMax = Math.max(defaultMax, ...allValues) + (unit === 'mg/dL' ? 20 : 1.0);
  const yRange = yMax - yMin;

  const barWidth = 14;
  const barGap = 4;
  
  const bars: {x: number, y: number, height: number, value: number, log: BloodSugarLog, color: string, type: 'fasting' | 'post-meal'}[] = [];
  const xLabels: {x: number, label: string}[] = [];

  const colorFasting = '#0A84FF'; // iOS Blue
  const colorPostMeal = colors.primary; // App Primary

  chartDays.forEach((day, index) => {
    // Space items sequentially and dynamically
    let centerX = paddingLeft + internalPadding + (index * activeDayWidth);
    if (chartDays.length === 1) {
      centerX = svgWidth / 2;
    }
    
    xLabels.push({
      x: centerX,
      label: day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    });

    const hasBoth = day.fasting && day.postMeal;
    
    if (day.fasting) {
      const rawHeight = (day.fasting.value / yMax) * graphHeight;
      const height = Math.max(barWidth, rawHeight);
      const x = hasBoth ? centerX - barWidth - (barGap/2) : centerX - (barWidth/2);
      bars.push({
        x,
        y: bottomY - height,
        height,
        value: day.fasting.value,
        log: day.fasting,
        color: colorFasting,
        type: 'fasting'
      });
    }

    if (day.postMeal) {
      const rawHeight = (day.postMeal.value / yMax) * graphHeight;
      const height = Math.max(barWidth, rawHeight);
      const x = hasBoth ? centerX + (barGap/2) : centerX - (barWidth/2);
      bars.push({
        x,
        y: bottomY - height,
        height,
        value: day.postMeal.value,
        log: day.postMeal,
        color: colorPostMeal,
        type: 'post-meal'
      });
    }
  });

  const gridLines = [];
  const stepCount = 4;
  for (let i = 0; i <= stepCount; i++) {
    const val = yMin + (i / stepCount) * yRange;
    const y = paddingTop + graphHeight - (i / stepCount) * graphHeight;
    gridLines.push({ y, val });
  }

  return (
    <View 
      style={[{ backgroundColor: colors.surface, borderColor: colors.border }, { borderWidth: 1, paddingVertical: 20, borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, marginBottom: 16 }]} 
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 20 }}>
        <Text style={[{ color: colors.text }, { fontWeight: '900', fontSize: 14 }]}>Blood Sugar Trends</Text>
        <Text style={[{ color: colors.textMuted }, { fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase' }]}>
          {chartDays.length > 0 ? `${chartDays[0].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric'})} - ${chartDays[chartDays.length - 1].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}` : 'No Data'}
        </Text>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={{ paddingRight: 0 }}
      >
        <Svg width={svgWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="fastingGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colorFasting} stopOpacity="1" />
              <Stop offset="1" stopColor={colorFasting} stopOpacity="0.75" />
            </LinearGradient>
            <LinearGradient id="postMealGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colorPostMeal} stopOpacity="1" />
              <Stop offset="1" stopColor={colorPostMeal} stopOpacity="0.75" />
            </LinearGradient>
          </Defs>

          {/* Grid lines & Y Axis */}
          {gridLines.map((line, idx) => (
            <G key={`grid-${idx}`}>
              <Line
                x1={paddingLeft}
                y1={line.y}
                x2={svgWidth}
                y2={line.y}
                stroke={colors.border}
                strokeWidth="1"
                strokeDasharray="3 4"
                opacity={line.y === bottomY ? 1 : 0.5} // Make bottom line solid
              />
              <SvgText
                x={paddingLeft - 8}
                y={line.y + 3}
                fontSize="9"
                fill={colors.textMuted}
                textAnchor="end"
                fontWeight="800"
              >
                {Math.round(line.val)}
              </SvgText>
            </G>
          ))}

          {/* X Axis Labels */}
          {xLabels.map((lbl, idx) => (
            <SvgText
              key={`xlbl-${idx}`}
              x={lbl.x}
              y={chartHeight - 4}
              fontSize="10"
              fill={colors.textSecondary}
              textAnchor="middle"
              fontWeight="800"
            >
              {lbl.label}
            </SvgText>
          ))}

          {/* Animated Bars and Digits */}
          {bars.map((bar, idx) => (
            <AnimatedBarItem
              key={`bar-group-${idx}`}
              x={bar.x}
              y={bar.y}
              barWidth={barWidth}
              height={bar.height}
              value={bar.value}
              color={bar.color}
              bottomY={bottomY}
              heightProgress={heightProgress}
              isFasting={bar.type === 'fasting'}
            />
          ))}
        </Svg>
      </ScrollView>

      {/* Chart Legend */}
      <View 
        style={[{ borderColor: colors.border }, { marginTop: 20, paddingTop: 16, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
          <LegendLineItem color={colorFasting} label="Fasting" colors={colors} />
          <LegendLineItem color={colorPostMeal} label="Post-Meal" colors={colors} />
        </View>
      </View>
    </View>
  );
}

function LegendLineItem({ color, label, colors }: { color: string; label: string; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ backgroundColor: color, width: 12, height: 12, borderRadius: 4, marginRight: 8 }} />
      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}
