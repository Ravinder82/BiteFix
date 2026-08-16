import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  useWindowDimensions,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../stores/appStore';
import { useTheme } from '../../hooks/useTheme';
import { OrbMascot } from '../../components/features/OrbMascot';
import {
  ArrowRight,
  ChevronLeft,
  Check,
  ShieldCheck,
  Activity,
  Sparkles,
  Leaf,
  Droplets,
  Search,
  Zap,
  Info,
  ShieldAlert,
  Globe,
  Utensils,
  Award,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// ── Colors & Branding Constants ────────────────────────────
const MINT = '#10B981';
const GOLD = '#D4AF37';

const ICON_ASSET = require('../../../assets/icon.png');

// ── Types ──────────────────────────────────────────────────
type AllergenOption = {
  id: string;
  label: string;
  iconName: string;
};

const ALLERGEN_OPTIONS: AllergenOption[] = [
  { id: 'none', label: 'No Known Food Allergies', iconName: 'shield' },
  { id: 'Dairy', label: 'Dairy & Milk', iconName: 'droplets' },
  { id: 'Gluten', label: 'Gluten & Wheat', iconName: 'wheat' },
  { id: 'Nuts', label: 'Tree Nuts & Peanuts', iconName: 'nut' },
  { id: 'Soy', label: 'Soy', iconName: 'leaf' },
  { id: 'Eggs', label: 'Eggs', iconName: 'egg' },
];

type PriorityOption = {
  id: 'ultra_processed' | 'nutrition' | 'allergens' | 'lower_sugar';
  title: string;
  description: string;
};

const PRIORITY_OPTIONS: PriorityOption[] = [
  { id: 'ultra_processed', title: 'Less Ultra-Processed', description: 'Identify NOVA 4 industrial formulations.' },
  { id: 'nutrition', title: 'Higher Nutrition', description: 'Focus on A & B Nutri-Score nutrient profiles.' },
  { id: 'allergens', title: 'Allergen Awareness', description: 'Flag matching ingredients automatically.' },
  { id: 'lower_sugar', title: 'Lower Sugar', description: 'Track estimated sugar equivalents in teaspoons.' },
];

// ───────────────────────────────────────────────────────────
// ORBITAL ANIMATED PILLS COMPONENT (Slide 9)
// ─────────────────────────────────────────────────────────
function OrbitalActivationVisual() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 14000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const pills = [
    { label: 'Processing', angle: 0, distance: 110, color: '#FF9500' },
    { label: 'Nutrition', angle: 51, distance: 115, color: '#34C759' },
    { label: 'Allergens', angle: 102, distance: 105, color: '#FF3B30' },
    { label: 'Ingredients', angle: 153, distance: 118, color: '#AF52DE' },
    { label: 'Additives', angle: 204, distance: 110, color: '#007AFF' },
    { label: 'Sugar', angle: 255, distance: 112, color: '#FFCC00' },
    { label: 'Eco Impact', angle: 306, distance: 115, color: '#30B0C7' },
  ];

  return (
    <View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center', marginVertical: 10 }}>
      {/* Central Mascot */}
      <View style={{ zIndex: 10 }}>
        <OrbMascot state="happy" size={90} />
      </View>

      {/* Orbiting Pills */}
      {pills.map((pill, index) => {
        const animStyle = useAnimatedStyle(() => {
          const currentAngleRad = ((pill.angle + rotation.value) * Math.PI) / 180;
          const translateX = Math.cos(currentAngleRad) * pill.distance;
          const translateY = Math.sin(currentAngleRad) * pill.distance;
          return {
            transform: [{ translateX }, { translateY }],
          };
        });

        return (
          <Animated.View
            key={index}
            style={[
              {
                position: 'absolute',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 14,
                backgroundColor: 'rgba(20,25,30,0.85)',
                borderWidth: 1,
                borderColor: `${pill.color}60`,
                shadowColor: pill.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              },
              animStyle,
            ]}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.2 }}>
              {pill.label}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ───────────────────────────────────────────────────────────
// MAIN ONBOARDING SCREEN COMPONENT
// ───────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { setProfile, setAllergenFilters, setDietPreference, setTrackEcoScore, setTrackOrganic, setOnboardingComplete } = useAppStore();

  const [currentSlide, setCurrentSlide] = useState(0);

  // Form State
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(['ultra_processed', 'nutrition']);

  // Theme palette
  const C = {
    bg: isDark ? '#080A0C' : '#F6F7F8',
    card: isDark ? '#14171A' : '#FFFFFF',
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    text: isDark ? '#F2F5F4' : '#111827',
    textSub: isDark ? '#9CA3AF' : '#4B5563',
    textMuted: isDark ? '#6B7280' : '#9CA3AF',
    primary: MINT,
  };

  // ── Navigation Handlers ──────────────────────────────────
  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentSlide < 9) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleCompleteOnboarding = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Save profile and preferences to Zustand
    const primaryGoal = (selectedPriorities[0] as any) || 'ultra_processed';
    setProfile({
      userName: 'Friend',
      userGoal: primaryGoal,
    });
    setAllergenFilters(selectedAllergens.filter(a => a !== 'none'));
    setDietPreference('standard');
    setTrackEcoScore(true);
    setTrackOrganic(true);
    setOnboardingComplete(true);

    router.replace('/paywall');
  };

  // Allergen multi-select toggle
  const toggleAllergen = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id === 'none') {
      setSelectedAllergens(['none']);
    } else {
      setSelectedAllergens(prev => {
        const filtered = prev.filter(item => item !== 'none');
        if (filtered.includes(id)) {
          const updated = filtered.filter(item => item !== id);
          return updated.length === 0 ? ['none'] : updated;
        } else {
          return [...filtered, id];
        }
      });
    }
  };

  // Priority multi-select toggle
  const togglePriority = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPriorities(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(p => p !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // ── Render Individual Slide Content ───────────────────────
  const renderSlideContent = () => {
    switch (currentSlide) {

      // ── SLIDE 0: WELCOME ─────────────────────────────────
      case 0:
        return (
          <View style={styles.slideContainer}>
            {/* Top Brand Tag */}
            <View style={styles.brandCapsule}>
              <Text style={{ color: GOLD, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 }}>
                ✦  B I T E F I X  ✦
              </Text>
            </View>

            {/* Hero App Icon with Floating Badges */}
            <View style={{ alignItems: 'center', marginVertical: 18, position: 'relative', width: 220, height: 200, justifyContent: 'center' }}>
              <Image
                source={ICON_ASSET}
                style={{ width: 110, height: 110, borderRadius: 26 }}
                resizeMode="contain"
              />

              {/* Floating Badges */}
              <View style={[styles.floatingBadge, { top: 4, left: -20 }]}>
                <Text style={styles.floatingBadgeText}>🔍 Ingredient Watch</Text>
              </View>
              <View style={[styles.floatingBadge, { top: 28, right: -24 }]}>
                <Text style={styles.floatingBadgeText}>🌱 Eco Impact</Text>
              </View>
              <View style={[styles.floatingBadge, { bottom: 20, left: -24 }]}>
                <Text style={styles.floatingBadgeText}>⚙️ Processing Level</Text>
              </View>
              <View style={[styles.floatingBadge, { bottom: 4, right: -16 }]}>
                <Text style={styles.floatingBadgeText}>⚡ Sugar Load</Text>
              </View>
            </View>

            {/* Headline & Subtitle */}
            <View style={{ alignItems: 'center', paddingHorizontal: 12 }}>
              <Text style={[styles.headline, { color: C.text, fontSize: 22, lineHeight: 28 }]}>
                Stop Reading. Start Scanning. Get Instant Insights.
              </Text>
              <Text style={[styles.subtitle, { color: C.textSub, marginTop: 10, fontSize: 13, lineHeight: 19 }]}>
                Scan a Barcode. See the Nova Score, Additives, Carbon Footprint and Sugar at a glance
              </Text>
            </View>
          </View>
        );

      // ── SLIDE 1: THE PROBLEM ──────────────────────────────
      case 1:
        return (
          <View style={styles.slideContainer}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.headline, { color: C.text }]}>
                Shopping Shouldn't Require Detective Work.
              </Text>
              <Text style={[styles.subtitle, { color: C.textSub, marginTop: 8 }]}>
                Food labels can take time to decode while you're standing in the aisle.
              </Text>
            </View>

            {/* Dense Label vs BiteFix Insight Visual */}
            <View style={[styles.cardSurface, { backgroundColor: C.card, borderColor: C.cardBorder, padding: 18, gap: 14 }]}>
              {/* Dense Label Simulation */}
              <View style={{ opacity: 0.45 }}>
                <Text style={{ color: C.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }}>
                  Complex Fine Print
                </Text>
                <Text style={{ color: C.textSub, fontSize: 10, lineHeight: 14 }}>
                  INGREDIENTS: WATER, HIGH FRUCTOSE CORN SYRUP, MODIFIED CORN STARCH, SODIUM BENZOATE (E211), CARBOXYMETHYLCELLULOSE, ARTIFICIAL FLAVOR, RED 40 (E129), MONO AND DIGLYCERIDES...
                </Text>
              </View>

              {/* Scanning Divider Line */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: MINT }} />
                <View style={{ backgroundColor: `${MINT}20`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                  <Text style={{ color: MINT, fontSize: 10, fontWeight: '900' }}>⚡ INSTANT BITEFIX REVIEW</Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: MINT }} />
              </View>

              {/* Clean BiteFix Output */}
              <View style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.05)', padding: 12, borderRadius: 14, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: '800' }}>NOVA 4 Ultra-Processed</Text>
                  <Text style={{ color: MINT, fontSize: 11, fontWeight: '900' }}>Clear Overview</Text>
                </View>
                <Text style={{ color: C.textSub, fontSize: 11, lineHeight: 15 }}>
                  Key items identified cleanly without manual reading.
                </Text>
              </View>
            </View>
          </View>
        );

      // ── SLIDE 2: NOVA + NUTRI-SCORE EDUCATION ─────────────
      case 2:
        return (
          <View style={styles.slideContainer}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.headline, { color: C.text }]}>
                Two Scores. Two Different Questions.
              </Text>
              <Text style={[styles.subtitle, { color: C.textSub, marginTop: 8 }]}>
                NOVA describes processing. Nutri-Score describes nutritional profile.
              </Text>
            </View>

            <View style={{ gap: 14, width: '100%' }}>
              {/* NOVA Card */}
              <View style={[styles.cardSurface, { backgroundColor: C.card, borderColor: C.cardBorder, padding: 16 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: C.text, fontSize: 14, fontWeight: '800' }}>NOVA Classification</Text>
                  <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600' }}>Processing Level</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  {['1', '2', '3', '4'].map(n => (
                    <View
                      key={n}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 10,
                        alignItems: 'center',
                        backgroundColor: n === '4' ? 'rgba(239,68,68,0.15)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                        borderWidth: 1,
                        borderColor: n === '4' ? '#EF4444' : C.cardBorder,
                      }}
                    >
                      <Text style={{ color: n === '4' ? '#EF4444' : C.text, fontSize: 14, fontWeight: '900' }}>{n}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ color: C.textSub, fontSize: 11, lineHeight: 15 }}>
                  Rates food from Unprocessed (1) to Ultra-Processed (4).
                </Text>
              </View>

              {/* Nutri-Score Card */}
              <View style={[styles.cardSurface, { backgroundColor: C.card, borderColor: C.cardBorder, padding: 16 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: C.text, fontSize: 14, fontWeight: '800' }}>Nutri-Score Grade</Text>
                  <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600' }}>Nutrition Profile</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                  {[
                    { grade: 'A', color: '#10B981' },
                    { grade: 'B', color: '#84CC16' },
                    { grade: 'C', color: '#F59E0B' },
                    { grade: 'D', color: '#F97316' },
                    { grade: 'E', color: '#EF4444' },
                  ].map(item => (
                    <View
                      key={item.grade}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 10,
                        alignItems: 'center',
                        backgroundColor: item.grade === 'A' ? `${item.color}20` : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                        borderWidth: 1,
                        borderColor: item.grade === 'A' ? item.color : C.cardBorder,
                      }}
                    >
                      <Text style={{ color: item.grade === 'A' ? item.color : C.text, fontSize: 13, fontWeight: '900' }}>{item.grade}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ color: C.textSub, fontSize: 11, lineHeight: 15 }}>
                  Overall nutritional quality grade based on available nutrient data.
                </Text>
              </View>
            </View>
          </View>
        );

      // ── SLIDE 3: ALLERGIES ─────────────────────────────────
      case 3:
        return (
          <View style={styles.slideContainer}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.headline, { color: C.text }]}>
                Any Food Allergies to Watch For?
              </Text>
              <Text style={[styles.subtitle, { color: C.textSub, marginTop: 6 }]}>
                BiteFix can highlight matching allergens when the available product information identifies them.
              </Text>
            </View>

            <View style={{ gap: 8, width: '100%' }}>
              {ALLERGEN_OPTIONS.map(opt => {
                const isSelected = selectedAllergens.includes(opt.id);
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => toggleAllergen(opt.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.cardSurface,
                      {
                        backgroundColor: isSelected ? `${MINT}12` : C.card,
                        borderColor: isSelected ? MINT : C.cardBorder,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      },
                    ]}
                  >
                    <Text style={{ color: isSelected ? MINT : C.text, fontSize: 13, fontWeight: '700' }}>
                      {opt.label}
                    </Text>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: isSelected ? MINT : C.textMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? MINT : 'transparent',
                      }}
                    >
                      {isSelected && <Check size={12} color="#FFF" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      // ── SLIDE 4: GUT SHIELD + ADDITIVES ────────────────────
      case 4:
        return (
          <View style={styles.slideContainer}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.headline, { color: C.text }]}>
                Your Ingredients, Reviewed.
              </Text>
              <Text style={[styles.subtitle, { color: C.textSub, marginTop: 6 }]}>
                Personal ingredient review and additive identification from available product data.
              </Text>
            </View>

            {/* Mascot in Center with Particle Ring */}
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <OrbMascot state="happy" size={80} />
            </View>

            <View style={{ gap: 10, width: '100%' }}>
              <View style={[styles.cardSurface, { backgroundColor: C.card, borderColor: C.cardBorder, padding: 14 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${MINT}18`, alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={18} color={MINT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontSize: 14, fontWeight: '800' }}>Gut Shield</Text>
                    <Text style={{ color: C.textSub, fontSize: 11, marginTop: 1 }}>Ingredient Review & Additive Flags</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.cardSurface, { backgroundColor: C.card, borderColor: C.cardBorder, padding: 14 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(175,82,222,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Search size={18} color="#AF52DE" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontSize: 14, fontWeight: '800' }}>Additives Identified</Text>
                    <Text style={{ color: C.textSub, fontSize: 11, marginTop: 1 }}>Colours · Preservatives · Acidity Regulators</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );

      // ── SLIDE 5: SUGAR ─────────────────────────────────────
      case 5:
        return (
          <View style={styles.slideContainer}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.headline, { color: C.text }]}>
                See Sugar at a Glance.
              </Text>
              <Text style={[styles.subtitle, { color: C.textSub, marginTop: 6 }]}>
                Easily visualize hidden sugar in terms of teaspoons.
              </Text>
            </View>

            {/* Feature Hero Visual Card */}
            <View style={[styles.cardSurface, { backgroundColor: C.card, borderColor: C.cardBorder, padding: 20, alignItems: 'center', gap: 10 }]}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,204,0,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={26} color="#FFCC00" />
              </View>

              <Text style={{ color: C.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.5 }}>
                ≈ 3.2 tsp
              </Text>
              <Text style={{ color: GOLD, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>
                ESTIMATED SUGAR EQUIVALENT
              </Text>
              <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600' }}>
                13.4 g per serving
              </Text>

              <View style={{ marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.cardBorder, width: '100%', alignItems: 'center' }}>
                <Text style={{ color: C.textMuted, fontSize: 10, fontWeight: '600' }}>
                  Based on available product data.
                </Text>
              </View>
            </View>
          </View>
        );

      // ── SLIDE 6: ENVIRONMENTAL IMPACT ─────────────────────
      case 6:
        return (
          <View style={styles.slideContainer}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.headline, { color: C.text }]}>
                See the Bigger Impact.
              </Text>
              <Text style={[styles.subtitle, { color: C.textSub, marginTop: 6 }]}>
                Understand environmental footprint estimates per product.
              </Text>
            </View>

            <View style={[styles.cardSurface, { backgroundColor: C.card, borderColor: C.cardBorder, padding: 20, gap: 14 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(77,141,232,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={20} color="#4D8DE8" />
                  </View>
                  <View>
                    <Text style={{ color: C.text, fontSize: 15, fontWeight: '800' }}>Environmental Impact</Text>
                    <Text style={{ color: C.textSub, fontSize: 11 }}>Estimated CO₂ Footprint</Text>
                  </View>
                </View>

                <View style={{ backgroundColor: 'rgba(52,199,89,0.15)', borderWidth: 1, borderColor: '#34C759', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: '#34C759', fontSize: 12, fontWeight: '900' }}>Grade B</Text>
                </View>
              </View>

              <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: C.text, fontSize: 20, fontWeight: '900' }}>1.4 kg CO₂e</Text>
                <Text style={{ color: C.textMuted, fontSize: 10, marginTop: 2 }}>Estimated lifecycle emissions</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 4 }}>
                <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '700' }}>• Carbon</Text>
                <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '700' }}>• Packaging</Text>
                <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '700' }}>• Sourcing</Text>
              </View>
            </View>
          </View>
        );

      // ── SLIDE 7: PERSONAL PRIORITIES ──────────────────────
      case 7:
        return (
          <View style={styles.slideContainer}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.headline, { color: C.text }]}>
                What Matters Most to You?
              </Text>
              <Text style={[styles.subtitle, { color: C.textSub, marginTop: 6 }]}>
                Choose as many as you like.
              </Text>
            </View>

            <View style={{ gap: 10, width: '100%' }}>
              {PRIORITY_OPTIONS.map(opt => {
                const isSelected = selectedPriorities.includes(opt.id);
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => togglePriority(opt.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.cardSurface,
                      {
                        backgroundColor: isSelected ? `${MINT}12` : C.card,
                        borderColor: isSelected ? MINT : C.cardBorder,
                        padding: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      },
                    ]}
                  >
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={{ color: isSelected ? MINT : C.text, fontSize: 14, fontWeight: '800' }}>
                        {opt.title}
                      </Text>
                      <Text style={{ color: C.textSub, fontSize: 11, marginTop: 2 }}>
                        {opt.description}
                      </Text>
                    </View>

                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: isSelected ? MINT : C.textMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? MINT : 'transparent',
                      }}
                    >
                      {isSelected && <Check size={12} color="#FFF" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      // ── SLIDE 8: BITEFIX RESULT PREVIEW ────────────────────
      case 8:
        return (
          <View style={styles.slideContainer}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <Text style={[styles.headline, { color: C.text }]}>
                One Scan. The Important Details, Together.
              </Text>
            </View>

            {/* Miniature Scan Result Card */}
            <View style={[styles.cardSurface, { backgroundColor: C.card, borderColor: C.cardBorder, padding: 16, gap: 10 }]}>
              {/* Identity strip */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: C.text, fontSize: 14, fontWeight: '900' }}>Organic Almond Oat Milk</Text>
                  <Text style={{ color: C.textSub, fontSize: 10, fontWeight: '600' }}>Data Source: Open Food Facts</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(52,211,153,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: MINT }} />
                  <Text style={{ color: MINT, fontSize: 9, fontWeight: '800' }}>Product Data Available</Text>
                </View>
              </View>

              {/* Badges */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(52,199,89,0.12)', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#34C759' }}>
                  <Text style={{ color: '#34C759', fontSize: 10, fontWeight: '900' }}>NOVA 1</Text>
                  <Text style={{ color: C.textSub, fontSize: 9 }}>Unprocessed</Text>
                </View>

                <View style={{ flex: 1, backgroundColor: 'rgba(52,199,89,0.12)', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#34C759' }}>
                  <Text style={{ color: '#34C759', fontSize: 10, fontWeight: '900' }}>Nutri-Score A</Text>
                  <Text style={{ color: C.textSub, fontSize: 9 }}>High Quality</Text>
                </View>
              </View>

              {/* Ingredient review & sugar summary */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', padding: 10, borderRadius: 10 }}>
                <Text style={{ color: C.text, fontSize: 11, fontWeight: '700' }}>Ingredient Review: No Flags</Text>
                <Text style={{ color: C.text, fontSize: 11, fontWeight: '700' }}>Sugar: ≈ 0.8 tsp</Text>
              </View>
            </View>
          </View>
        );

      // ── SLIDE 9: FINAL ACTIVATION ─────────────────────────
      case 9:
        return (
          <View style={styles.slideContainer}>
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <Text style={[styles.headline, { color: C.text }]}>
                Your BiteFix Scanner Is Ready
              </Text>
              <Text style={[styles.subtitle, { color: C.textSub, marginTop: 6 }]}>
                Scan a product and let BiteFix turn available food data into a clear snapshot.
              </Text>
            </View>

            {/* Orbital Activation Visual */}
            <OrbitalActivationVisual />
          </View>
        );

      default:
        return null;
    }
  };

  // ── Render Footer Actions ────────────────────────────────
  const renderCTAButtonText = () => {
    switch (currentSlide) {
      case 0: return 'Get Started';
      case 1: return 'Show Me More';
      case 3: return 'Continue';
      case 7: return 'Continue';
      case 8: return 'Almost There';
      case 9: return 'Activate BiteFix';
      default: return 'Next';
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: C.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* ── Top Header Navigation & Progress Bar ───────────── */}
      <View style={styles.headerRow}>
        {currentSlide > 0 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityLabel="Go back">
            <ChevronLeft size={20} color={C.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}

        {/* Step Indicator Pills */}
        <View style={styles.progressContainer}>
          {Array.from({ length: 10 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                {
                  backgroundColor: i === currentSlide
                    ? MINT
                    : i < currentSlide
                    ? `${MINT}80`
                    : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'),
                  width: i === currentSlide ? 14 : 6,
                },
              ]}
            />
          ))}
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* ── Scrollable Body Area ───────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View key={currentSlide} entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={{ flex: 1 }}>
          {renderSlideContent()}
        </Animated.View>
      </ScrollView>

      {/* ── Fixed Bottom CTA ───────────────────────────────── */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.88}
          style={[styles.primaryCTA, { backgroundColor: MINT }]}
        >
          <Text style={styles.ctaText}>{renderCTAButtonText()}</Text>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(150,150,150,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressDot: {
    height: 5,
    borderRadius: 2.5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCapsule: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderColor: 'rgba(212,175,55,0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  headline: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  cardSurface: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  floatingBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(15,20,25,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  floatingBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  primaryCTA: {
    borderRadius: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: MINT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});