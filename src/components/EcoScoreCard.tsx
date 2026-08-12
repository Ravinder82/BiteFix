import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Leaf, CloudRain, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

interface EcoScoreCardProps {
  grade?: 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown';
  carbonFootprint?: number;
  isOrganic?: boolean;
  isVegan?: boolean;
  isVegetarian?: boolean;
  delayIndex?: number;
}

export function EcoScoreCard({ grade, carbonFootprint, isOrganic, isVegan, isVegetarian, delayIndex = 0 }: EcoScoreCardProps) {
  const { colors, isDark } = useTheme();
  
  if (!grade && carbonFootprint === undefined && !isOrganic && !isVegan && !isVegetarian) {
    return null;
  }

  const getEcoColor = (g?: string) => {
    switch (g?.toLowerCase()) {
      case 'a': return '#1E8F4E';
      case 'b': return '#2ECC71';
      case 'c': return '#F1C40F';
      case 'd': return '#E67E22';
      case 'e': return '#E74C3C';
      default: return '#95A5A6';
    }
  };

  const ecoColor = getEcoColor(grade);

  return (
    <Animated.View 
      entering={FadeInUp.delay(delayIndex * 150).springify().damping(14)}
      style={[
        styles.container, 
        { 
          backgroundColor: isDark ? '#14171A' : '#FFFFFF', 
          borderColor: isDark ? '#2B3136' : '#E1E5E8' 
        }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Leaf size={18} color={ecoColor} strokeWidth={2.5} />
          <Text style={[styles.title, { color: colors.text }]}>Sustainability & Diet</Text>
        </View>
        {grade && grade !== 'unknown' && (
          <View style={[styles.gradeBadge, { backgroundColor: ecoColor }]}>
            <Text style={styles.gradeText}>{grade.toUpperCase()}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.body}>
        {carbonFootprint !== undefined && (
          <View style={[styles.metricRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <CloudRain size={16} color={isDark ? '#A3ABB2' : '#626B74'} />
            <Text style={[styles.metricText, { color: isDark ? '#A3ABB2' : '#626B74' }]}>
              Carbon Footprint: <Text style={{ color: colors.text, fontWeight: '800' }}>{carbonFootprint.toFixed(1)} g CO₂/100g</Text>
            </Text>
          </View>
        )}

        <View style={styles.tagsContainer}>
          {isOrganic && (
            <View style={[styles.tag, { backgroundColor: 'rgba(0, 194, 136, 0.15)', borderColor: '#00C288' }]}>
              <CheckCircle size={14} color="#00C288" />
              <Text style={[styles.tagText, { color: '#00C288' }]}>Organic</Text>
            </View>
          )}
          {isVegan && (
            <View style={[styles.tag, { backgroundColor: 'rgba(46, 204, 113, 0.15)', borderColor: '#2ECC71' }]}>
              <Leaf size={14} color="#2ECC71" />
              <Text style={[styles.tagText, { color: '#2ECC71' }]}>Vegan</Text>
            </View>
          )}
          {isVegetarian && !isVegan && (
            <View style={[styles.tag, { backgroundColor: 'rgba(77, 141, 232, 0.15)', borderColor: '#4D8DE8' }]}>
              <Leaf size={14} color="#4D8DE8" />
              <Text style={[styles.tagText, { color: '#4D8DE8' }]}>Vegetarian</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  gradeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  body: {
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
  },
  metricText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
