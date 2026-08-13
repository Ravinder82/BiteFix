import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CloudRain, CheckCircle, Globe, Sparkles, Leaf } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

interface EcoScoreCardProps {
  grade?: 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown' | string;
  carbonFootprint?: number;
  isOrganic?: boolean;
  isVegan?: boolean;
  isVegetarian?: boolean;
}

export function EcoScoreCard({ grade, carbonFootprint, isOrganic, isVegan, isVegetarian }: EcoScoreCardProps) {
  const { colors, isDark } = useTheme();

  const normalizedGrade = grade?.toLowerCase();

  const getEcoColor = (g?: string) => {
    switch (g) {
      case 'a': return '#1E8F4E';
      case 'b': return '#2ECC71';
      case 'c': return '#F1C40F';
      case 'd': return '#E67E22';
      case 'e': return '#E74C3C';
      default: return '#10B981';
    }
  };

  const ecoColor = getEcoColor(normalizedGrade);

  const getImpactText = (co2?: number, g?: string) => {
    if (g === 'a' || (co2 !== undefined && co2 <= 100)) {
      return '🍃 Ultra-Low Climate Footprint';
    }
    if (g === 'b' || (co2 !== undefined && co2 <= 250)) {
      return '🌱 Low Environmental Impact';
    }
    if (g === 'c' || (co2 !== undefined && co2 <= 500)) {
      return '⚖️ Moderate Ecological Footprint';
    }
    return '🏭 High Carbon Intensity';
  };

  const borderDivider = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const innerBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF';

  return (
    <LinearGradient
      colors={isDark ? ['rgba(16, 185, 129, 0.09)', 'rgba(6, 182, 212, 0.03)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(240, 253, 250, 0.95)']}
      style={{
        borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)',
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 18,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.25 : 0.06,
        shadowRadius: 16,
        elevation: 6,
        marginBottom: 16,
        gap: 12,
      }}
    >
      {/* Top Header: Unique Carbon-Footprint Badge */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Globe size={18} color="#10B981" strokeWidth={2.4} />
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900', letterSpacing: -0.3 }}>
              Carbon-Footprint
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '700' }}>
              Exclusive Planetary Audit
            </Text>
          </View>
        </View>

        {/* Eco-Score Grade Badge */}
        {normalizedGrade && normalizedGrade !== 'unknown' ? (
          <View style={{
            backgroundColor: `${ecoColor}18`,
            borderColor: `${ecoColor}40`,
            borderWidth: 1.2,
            paddingHorizontal: 9,
            paddingVertical: 3.5,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ecoColor }} />
            <Text style={{ color: ecoColor, fontSize: 11.5, fontWeight: '900', letterSpacing: 0.3 }}>
              GRADE {normalizedGrade.toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 5-Step Mini Eco Bar */}
      <View style={{ flexDirection: 'row', gap: 4, height: 6, alignItems: 'center' }}>
        {[
          { key: 'a', color: '#1E8F4E' },
          { key: 'b', color: '#2ECC71' },
          { key: 'c', color: '#F1C40F' },
          { key: 'd', color: '#E67E22' },
          { key: 'e', color: '#E74C3C' }
        ].map((g) => {
          const isActive = normalizedGrade === g.key;
          return (
            <View
              key={g.key}
              style={{
                flex: 1,
                height: isActive ? 6 : 4,
                borderRadius: 3,
                backgroundColor: g.color,
                opacity: isActive ? 1 : 0.25,
              }}
            />
          );
        })}
      </View>

      {/* CO2 Emissions Metric Row */}
      <View style={{
        backgroundColor: innerBg,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CloudRain size={18} color={isDark ? '#34D399' : '#059669'} />
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.4 }}>
                {carbonFootprint !== undefined ? `${carbonFootprint.toFixed(1)} g` : 'Minimal'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                CO₂ eq / 100g
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '600', marginTop: 1 }}>
              {getImpactText(carbonFootprint, normalizedGrade)}
            </Text>
          </View>
        </View>

        <View style={{
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
        }}>
          <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '900', letterSpacing: 0.3 }}>
            ECO AUDIT
          </Text>
        </View>
      </View>

      {/* Sustainable Badges */}
      {(isOrganic || isVegan || isVegetarian) && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {isOrganic && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: 'rgba(0, 194, 136, 0.1)',
              borderColor: 'rgba(0, 194, 136, 0.25)',
              borderWidth: 1,
              paddingHorizontal: 9,
              paddingVertical: 3,
              borderRadius: 8,
            }}>
              <CheckCircle size={12} color="#00C288" />
              <Text style={{ color: '#00C288', fontSize: 10.5, fontWeight: '800' }}>Organic Certified</Text>
            </View>
          )}
          {isVegan && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: 'rgba(46, 204, 113, 0.1)',
              borderColor: 'rgba(46, 204, 113, 0.25)',
              borderWidth: 1,
              paddingHorizontal: 9,
              paddingVertical: 3,
              borderRadius: 8,
            }}>
              <Leaf size={12} color="#2ECC71" />
              <Text style={{ color: '#2ECC71', fontSize: 10.5, fontWeight: '800' }}>Vegan Friendly</Text>
            </View>
          )}
          {isVegetarian && !isVegan && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: 'rgba(77, 141, 232, 0.1)',
              borderColor: 'rgba(77, 141, 232, 0.25)',
              borderWidth: 1,
              paddingHorizontal: 9,
              paddingVertical: 3,
              borderRadius: 8,
            }}>
              <Text style={{ color: '#4D8DE8', fontSize: 10.5, fontWeight: '800' }}>Vegetarian</Text>
            </View>
          )}
        </View>
      )}
    </LinearGradient>
  );
}
