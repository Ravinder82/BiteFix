import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { BloodSugarLog } from '../../types/app.types';
import { useTheme } from '../../hooks/useTheme';
import { formatBloodSugarValue } from '../../utils/bloodSugar';

interface BloodSugarChartProps {
  logs: BloodSugarLog[];
}

export function BloodSugarChart({ logs }: BloodSugarChartProps) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  // Screen width minus padding
  const chartWidth = windowWidth - 48;
  const chartHeight = 180;
  const paddingLeft = 32;
  const paddingRight = 10;
  const paddingTop = 24;
  const paddingBottom = 24;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  // Filter logs for the chart: last 7 readings, sorted oldest to newest (left to right)
  const chartLogs = [...logs]
    .slice(0, 7)
    .reverse();

  if (chartLogs.length === 0) {
    return (
      <View 
        style={{ height: chartHeight, borderColor: colors.border, backgroundColor: colors.surface }} 
        className="items-center justify-center border border-dashed rounded-[24px] px-6"
      >
        <Text style={{ color: colors.textSecondary }} className="font-bold text-sm">No blood sugar logs yet</Text>
        <Text style={{ color: colors.textMuted }} className="text-xs text-center mt-1 leading-relaxed">
          Add a few readings to view your clinical trend lines.
        </Text>
      </View>
    );
  }

  // Find min and max values to scale Y axis
  const unit = chartLogs[0].unit;
  const values = chartLogs.map((l) => l.value);
  
  // Set default bounds based on unit
  const defaultMin = unit === 'mg/dL' ? 60 : 3.0;
  const defaultMax = unit === 'mg/dL' ? 220 : 12.0;

  const yMin = Math.max(0, Math.min(defaultMin, ...values) - (unit === 'mg/dL' ? 10 : 0.5));
  const yMax = Math.max(defaultMax, ...values) + (unit === 'mg/dL' ? 20 : 1.0);
  const yRange = yMax - yMin;

  // Map data to coordinates
  const points = chartLogs.map((log, index) => {
    // X mapping: spread points equally across width
    const x = paddingLeft + (index / Math.max(1, chartLogs.length - 1)) * graphWidth;
    // Y mapping: scale value to height
    const y = paddingTop + graphHeight - ((log.value - yMin) / yRange) * graphHeight;
    return { x, y, value: log.value, status: log.status, date: new Date(log.timestamp) };
  });

  // Calculate smooth Bezier path using control points
  const linePath = (() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      // Generate control points for a smooth Bezier curve
      const cp1x = curr.x + (next.x - curr.x) / 3;
      const cp1y = curr.y;
      const cp2x = curr.x + (2 * (next.x - curr.x)) / 3;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  })();

  // Generate fill area path (under the line)
  const fillPath = (() => {
    if (!linePath || points.length === 0) return '';
    return `${linePath} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`;
  })();

  // Helper to color code points
  const getPointColor = (status: BloodSugarLog['status']) => {
    switch (status) {
      case 'low':
        return '#f97316'; // orange
      case 'normal':
        return '#10b981'; // green
      case 'pre-diabetes':
        return '#eab308'; // yellow
      case 'diabetes':
        return '#ef4444'; // red
      default:
        return colors.primary;
    }
  };

  // Grid line values
  const gridLines = [];
  const stepCount = 3;
  for (let i = 0; i <= stepCount; i++) {
    const val = yMin + (i / stepCount) * yRange;
    const y = paddingTop + graphHeight - (i / stepCount) * graphHeight;
    gridLines.push({ y, val });
  }

  return (
    <View 
      style={{ backgroundColor: colors.surface, borderColor: colors.border }} 
      className="border p-5 rounded-[28px] shadow-sm"
    >
      <Text style={{ color: colors.text }} className="font-black text-sm mb-3">Glucose Trend (Last 7 logs)</Text>
      
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="chartFillGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.00" />
          </LinearGradient>
        </Defs>

        {/* Grid lines & Y Axis Labels */}
        {gridLines.map((line, idx) => (
          <G key={`grid-${idx}`}>
            <Line
              x1={paddingLeft}
              y1={line.y}
              x2={chartWidth - paddingRight}
              y2={line.y}
              stroke={colors.border}
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <SvgText
              x={paddingLeft - 8}
              y={line.y + 3}
              fontSize="8"
              fill={colors.textMuted}
              textAnchor="end"
              fontWeight="bold"
            >
              {formatBloodSugarValue(line.val, unit)}
            </SvgText>
          </G>
        ))}

        {/* Fill under the curve */}
        {fillPath && (
          <Path d={fillPath} fill="url(#chartFillGrad)" />
        )}

        {/* The trend line */}
        {linePath && (
          <Path
            d={linePath}
            fill="none"
            stroke={colors.primary}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points & X Labels */}
        {points.map((pt, idx) => (
          <G key={`point-${idx}`}>
            {/* Draw Point Circle */}
            <Circle
              cx={pt.x}
              cy={pt.y}
              r="5"
              fill={getPointColor(pt.status)}
              stroke={colors.surface}
              strokeWidth="2"
            />
            {/* Hover Tooltip Value */}
            <SvgText
              x={pt.x}
              y={pt.y - 8}
              fontSize="8"
              fontWeight="black"
              fill={colors.text}
              textAnchor="middle"
            >
              {formatBloodSugarValue(pt.value, unit)}
            </SvgText>

            {/* Date label at bottom */}
            <SvgText
              x={pt.x}
              y={chartHeight - 4}
              fontSize="7"
              fill={colors.textMuted}
              textAnchor="middle"
              fontWeight="bold"
            >
              {pt.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </SvgText>
          </G>
        ))}
      </Svg>

      {/* Chart Legend */}
      <View 
        style={{ borderTopColor: colors.border }} 
        className="flex-row items-center justify-around mt-4 pt-3 border-t"
      >
        <LegendItem color="#10b981" label="Normal" colors={colors} />
        <LegendItem color="#eab308" label="Pre-Diab" colors={colors} />
        <LegendItem color="#ef4444" label="Diabetes" colors={colors} />
        <LegendItem color="#f97316" label="Low" colors={colors} />
      </View>
    </View>
  );
}

function LegendItem({ color, label, colors }: { color: string; label: string; colors: any }) {
  return (
    <View className="flex-row items-center">
      <View style={{ backgroundColor: color }} className="w-2 h-2 rounded-full mr-1.5" />
      <Text style={{ color: colors.textSecondary }} className="text-[9px] font-bold">{label}</Text>
    </View>
  );
}
