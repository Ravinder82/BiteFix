import React from 'react';
import { View, Text } from 'react-native';
import { Search, AlertTriangle, CheckCircle2, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AdditiveDetail } from '../../types/app.types';

interface AdditiveDetectiveCardProps {
  additives: AdditiveDetail[];
  colors: any;
  isDark: boolean;
}

export function AdditiveDetectiveCard({ additives, colors, isDark }: AdditiveDetectiveCardProps) {
  const borderDivider = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const bgSurface = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';

  const elevated = additives.filter(a => a.riskLevel === 'elevated');
  const moderate = additives.filter(a => a.riskLevel === 'moderate');

  const hasAlerts = elevated.length > 0 || moderate.length > 0;

  if (!hasAlerts) {
    return (
      <LinearGradient
        colors={isDark ? ['rgba(34, 197, 94, 0.07)', 'rgba(34, 197, 94, 0.01)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(240, 253, 250, 0.95)']}
        style={{
          borderColor: borderDivider,
          borderWidth: 1.5,
          borderRadius: 24,
          paddingHorizontal: 20,
          paddingVertical: 16,
          marginTop: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.25 : 0.03,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CheckCircle2 size={18} color="#22C55E" />
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>Additive Detective</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 1 }}>
              0 Harmful Synthetics • Clean Label
            </Text>
          </View>
        </View>

        <View style={{
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          borderColor: 'rgba(34, 197, 94, 0.3)',
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>CLEAN</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={isDark ? ['rgba(139, 92, 246, 0.07)', 'rgba(139, 92, 246, 0.01)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(245, 243, 255, 0.95)']}
      style={{
        borderColor: borderDivider,
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 16,
        elevation: 5,
        marginTop: 16,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Search size={20} color="#8B5CF6" />
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>
          Additive Detective
        </Text>
      </View>
      
      <View style={{ gap: 16 }}>
        {elevated.length > 0 && (
          <View style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <AlertTriangle size={14} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>
                Watch List Compounds
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
                Generally Accepted
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
      
      {/* Footer context */}
      <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: borderDivider }}>
        <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center' }}>
          {additives.length} total additive{additives.length !== 1 ? 's' : ''} logged.
        </Text>
      </View>
    </LinearGradient>
  );
}
