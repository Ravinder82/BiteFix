import React from 'react';
import { View, Text } from 'react-native';
import { ShieldAlert, ShieldCheck, Activity, Leaf } from 'lucide-react-native';
import { GutInsight } from '../../utils/gutShieldEvaluator';

interface GutShieldCardProps {
  score: number;
  insights: GutInsight[];
  colors: any;
  isDark: boolean;
}

export function GutShieldCard({ score, insights, colors, isDark }: GutShieldCardProps) {
  const isHealthy = score >= 80;
  const isModerate = score >= 50 && score < 80;

  const borderDivider = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const bgSurface = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';

  if (insights.length === 0 && isHealthy) {
    return (
      <View style={{
        backgroundColor: colors.surface,
        borderColor: borderDivider,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.2 : 0.03,
        shadowRadius: 10,
        elevation: 2,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldCheck size={18} color="#10B981" />
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>Gut Shield Pro</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 1 }}>
              Microbiome Friendly • 0 Disruptors
            </Text>
          </View>
        </View>

        <View style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>{score}/100</Text>
        </View>
      </View>
    );
  }

  const headerColor = isHealthy ? '#10B981' : isModerate ? '#F59E0B' : '#EF4444';
  const headerIcon = isHealthy ? (
    <ShieldCheck size={20} color={headerColor} />
  ) : (
    <ShieldAlert size={20} color={headerColor} />
  );

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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {headerIcon}
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>
            Gut Shield Pro
          </Text>
        </View>
        <View style={{
          backgroundColor: `${headerColor}15`,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: `${headerColor}30`,
        }}>
          <Text style={{ color: headerColor, fontSize: 14, fontWeight: '800' }}>
            {score}/100
          </Text>
        </View>
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 16 }}>
        {isHealthy 
          ? 'This product is microbiome-friendly and free from major gut disruptors.'
          : 'Microbiome disruption detected. Frequent consumption may affect gut lining and flora.'}
      </Text>

      {/* Insights */}
      {insights.length === 0 ? (
        <View style={{
          backgroundColor: bgSurface,
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(16, 185, 129, 0.2)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12
        }}>
          <Leaf size={24} color="#10B981" />
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', flex: 1 }}>
            Optimal for gut health. No disruptive synthetic compounds detected.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {insights.map((insight, idx) => {
             const severityColor = insight.severity === 'high' ? '#EF4444' : insight.severity === 'medium' ? '#F59E0B' : '#3B82F6';
             return (
               <View key={idx} style={{
                 backgroundColor: bgSurface,
                 padding: 16,
                 borderRadius: 16,
                 borderWidth: 1,
                 borderColor: borderDivider,
                 borderLeftWidth: 4,
                 borderLeftColor: severityColor
               }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                   <Activity size={16} color={severityColor} />
                   <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                     {insight.title}
                   </Text>
                 </View>
                 <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
                   {insight.description}
                 </Text>
                 <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                   {insight.additivesFound.map((a, i) => (
                     <View key={i} style={{
                       backgroundColor: `${severityColor}15`,
                       paddingHorizontal: 8,
                       paddingVertical: 2,
                       borderRadius: 8,
                     }}>
                       <Text style={{ color: severityColor, fontSize: 11, fontWeight: '700' }}>
                         {a.displayName}
                       </Text>
                     </View>
                   ))}
                 </View>
               </View>
             );
          })}
        </View>
      )}
    </View>
  );
}
