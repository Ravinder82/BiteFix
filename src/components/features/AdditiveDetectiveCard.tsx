import React from 'react';
import { View, Text } from 'react-native';
import { Search, AlertTriangle, CheckCircle2, Zap } from 'lucide-react-native';
import { AdditiveDetail } from '../../types/app.types';

interface AdditiveDetectiveCardProps {
  additives: AdditiveDetail[];
  colors: any;
  isDark: boolean;
}

export function AdditiveDetectiveCard({ additives, colors, isDark }: AdditiveDetectiveCardProps) {
  const borderDivider = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const bgSurface = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';

  const elevated = additives.filter(a => a.riskLevel === 'elevated');
  const moderate = additives.filter(a => a.riskLevel === 'moderate');
  const safe = additives.filter(a => a.riskLevel === 'low');

  const hasAlerts = elevated.length > 0 || moderate.length > 0;

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderColor: borderDivider,
      borderWidth: 1,
      borderRadius: 24,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.35 : 0.04,
      shadowRadius: 18,
      elevation: 5,
      marginTop: 16,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Search size={20} color="#8B5CF6" />
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>
          Additive Detective
        </Text>
      </View>

      {!hasAlerts ? (
        <View style={{
          backgroundColor: 'rgba(34, 197, 94, 0.08)',
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(34, 197, 94, 0.2)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12
        }}>
          <CheckCircle2 size={24} color="#22C55E" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '800' }}>Clean Label</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              No concerning synthetic dyes, chemical sweeteners, or harmful preservatives detected.
            </Text>
          </View>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {elevated.length > 0 && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertTriangle size={14} color="#EF4444" />
                <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>
                  High Risk Compounds
                </Text>
              </View>
              <View style={{ gap: 8 }}>
                {elevated.map((item, idx) => (
                  <View key={idx} style={{
                    backgroundColor: bgSurface,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(239, 68, 68, 0.2)'
                  }}>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                      {item.displayName}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      Found as: <Text style={{ color: colors.text }}>{item.functionLabel}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {moderate.length > 0 && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Zap size={14} color="#F59E0B" />
                <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>
                  Moderate Risk
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {moderate.map((item, idx) => (
                  <View key={idx} style={{
                    backgroundColor: bgSurface,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(245, 158, 11, 0.2)'
                  }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
                      {item.displayName}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
      
      {/* Footer context */}
      <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: borderDivider }}>
        <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center' }}>
          {additives.length} total additive{additives.length !== 1 ? 's' : ''} logged.
        </Text>
      </View>
    </View>
  );
}
