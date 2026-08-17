// ═══════════════════════════════════════════════════════════
// BiteFix — Final 10-Screen Onboarding
// ═══════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Image,
  AccessibilityInfo,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../stores/appStore';
import { OrbMascot } from '../../components/features/OrbMascot';
import * as Haptics from 'expo-haptics';
import {
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Leaf,
  Activity,
  Droplets,
  CheckCircle,
  Circle,
  Wind,
  Package,
  Zap,
} from 'lucide-react-native';

const GREEN = '#01922aff';
const GREEN_DIM = '#00C28820';
const TOTAL_SCREENS = 10;

const ALLERGEN_OPTIONS = [
  { id: 'none', label: 'No Known Food Allergies' },
  { id: 'dairy', label: 'Dairy & Milk' },
  { id: 'gluten', label: 'Gluten & Wheat' },
  { id: 'nuts', label: 'Tree Nuts & Peanuts' },
  { id: 'soy', label: 'Soy' },
  { id: 'eggs', label: 'Eggs' },
];

const PRIORITY_OPTIONS = [
  { id: 'ultra_processed', label: 'Less Ultra-Processed', icon: Package },
  { id: 'nutri_score', label: 'Higher Nutrition', icon: Activity },
  { id: 'clean_swaps', label: 'Allergen Awareness', icon: ShieldCheck },
  { id: 'healthy_habits', label: 'Lower Sugar', icon: Droplets },
];

const FEATURE_PILLS = ['Processing', 'Nutrition', 'Allergens', 'Ingredients', 'Additives', 'Sugar', 'Eco Impact'];

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);
  return reduceMotion;
}

// ── Screen 0: Welcome ─────────────────────────────────────
// Flagship hero: product mockup + live scan beam + floating capability pills.
function WelcomeScreen({ colors, isDark }: { colors: any; isDark: boolean }) {
  const { width, height } = useWindowDimensions();
  const scanY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const travel = Math.max(180, Math.min(310, height * 0.30));
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: travel,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(650),
        Animated.timing(scanY, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(900),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [height, scanY]);

  const pillBase = {
    position: 'absolute' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: isDark ? 'rgba(12,17,14,0.90)' : 'rgba(255,255,255,0.95)',
    borderColor: GREEN + '55',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: isDark ? 0.18 : 0.08,
    shadowRadius: 12,
    elevation: 4,
  };

  const mockupWidth = Math.min(width - 44, 382);
  const mockupHeight = Math.min(Math.max(height * 0.57, 420), 500);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 18, paddingTop: 10 }}>
      {/* Quiet atmospheric glows — intentionally not a full-screen image. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: -70, left: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: isDark ? 'rgba(0,194,136,0.08)' : 'rgba(0,194,136,0.10)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', top: 70, right: -80, width: 230, height: 230, borderRadius: 115, backgroundColor: isDark ? 'rgba(246,183,66,0.07)' : 'rgba(246,183,66,0.10)' }} />

      {/* Product mockup card — the visual hero. */}
      <View
        style={{
          width: mockupWidth,
          height: mockupHeight,
          alignSelf: 'center',
          borderRadius: 34,
          overflow: 'hidden',
          backgroundColor: isDark ? '#121817' : '#EAF2EA',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,52,31,0.12)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 18 },
          shadowOpacity: isDark ? 0.30 : 0.12,
          shadowRadius: 28,
          elevation: 8,
        }}
      >
        {/* Soft image wash around the product — makes it feel like a photographed premium mockup. */}
        <View pointerEvents="none" style={{ position: 'absolute', inset: 0, backgroundColor: isDark ? '#18221B' : '#DCEBD4' }} />
        <Image
          source={require('../../../assets/images/onboarding_welcome_product.png')}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: isDark ? 0.84 : 0.98 }}
          resizeMode="cover"
        />

        {/* Phone-like glass frame to echo the reference without copying its branding/UI. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            bottom: 12,
            borderRadius: 26,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.72)',
          }}
        />

        {/* Tiny top sensor/detail pill. */}
        <View pointerEvents="none" style={{ position: 'absolute', top: 20, alignSelf: 'center', width: 58, height: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.58)' }} />

        {/* Live barcode scan beam. */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 30,
            right: 30,
            top: 82,
            height: 2,
            transform: [{ translateY: scanY }],
            backgroundColor: GREEN,
            shadowColor: GREEN,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.95,
            shadowRadius: 10,
            elevation: 4,
          }}
        />
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 30,
            right: 30,
            top: 74,
            height: 18,
            opacity: 0.22,
            transform: [{ translateY: scanY }],
            backgroundColor: GREEN,
          }}
        />

        {/* Scanner focus corners. */}
        <View pointerEvents="none" style={{ position: 'absolute', left: 42, top: 96, width: 38, height: 38, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#FFFFFF', borderTopLeftRadius: 8 }} />
        <View pointerEvents="none" style={{ position: 'absolute', right: 42, top: 96, width: 38, height: 38, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#FFFFFF', borderTopRightRadius: 8 }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 42, bottom: 96, width: 38, height: 38, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#FFFFFF', borderBottomLeftRadius: 8 }} />
        <View pointerEvents="none" style={{ position: 'absolute', right: 42, bottom: 96, width: 38, height: 38, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#FFFFFF', borderBottomRightRadius: 8 }} />

        {/* A quiet scan status — deliberately not AI language. */}
        <View style={{ position: 'absolute', top: 58, alignSelf: 'center', borderRadius: 999, backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.86)', borderWidth: 1, borderColor: GREEN + '55', paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ color: isDark ? '#FFFFFF' : '#11301F', fontSize: 9, fontWeight: '900', letterSpacing: 0.9, textTransform: 'uppercase' }}>
            Scanning Product
          </Text>
        </View>

        {/* Capability pills. Each stays single-line. */}
        <View style={[pillBase, { left: 10, top: mockupHeight * 0.22 }]}>
          <Package size={14} color={GREEN} strokeWidth={2.2} />
          <Text style={{ color: isDark ? '#FFFFFF' : '#102017', fontSize: 10.5, fontWeight: '800' }} numberOfLines={1}>Processing</Text>
        </View>

        <View style={[pillBase, { right: 10, top: mockupHeight * 0.17 }]}>
          <Activity size={14} color={GREEN} strokeWidth={2.2} />
          <Text style={{ color: isDark ? '#FFFFFF' : '#102017', fontSize: 10.5, fontWeight: '800' }} numberOfLines={1}>Nutrition</Text>
        </View>

        <View style={[pillBase, { left: 10, bottom: mockupHeight * 0.26, maxWidth: mockupWidth * 0.47 }]}>
          <ShieldCheck size={14} color={GREEN} strokeWidth={2.2} />
          <Text style={{ color: isDark ? '#FFFFFF' : '#102017', fontSize: 10.5, fontWeight: '800', flexShrink: 1 }} numberOfLines={1}>Ingredient Review</Text>
        </View>

        <View style={[pillBase, { right: 10, bottom: mockupHeight * 0.26, borderColor: '#D97706' + '55', maxWidth: mockupWidth * 0.42 }]}>
          <Droplets size={14} color={isDark ? '#FBBF24' : '#D97706'} strokeWidth={2.2} />
          <Text style={{ color: isDark ? '#FFFFFF' : '#102017', fontSize: 10.5, fontWeight: '800', flexShrink: 1 }} numberOfLines={1}>Sugar Insights</Text>
        </View>

        {/* BiteFix hero mark sits inside the mockup instead of being cut off. */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 22, alignItems: 'center' }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              backgroundColor: isDark ? 'rgba(17,23,19,0.86)' : 'rgba(255,255,255,0.90)',
              borderWidth: 1.5,
              borderColor: GREEN + '75',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: GREEN,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.20,
              shadowRadius: 15,
              elevation: 6,
            }}
          >
            <Image source={require('../../../assets/icon.png')} style={{ width: 72, height: 72, borderRadius: 20 }} resizeMode="contain" />
          </View>
        </View>
      </View>

      {/* Editorial brand/message block. */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, paddingTop: 10, paddingBottom: 4 }}>
        <Text style={{ color: GREEN, fontSize: 10.5, fontWeight: '900', letterSpacing: 3.4, textTransform: 'uppercase', marginBottom: 10 }}>
          BITEFIX
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: Math.min(31, Math.max(28, width * 0.074)),
            fontWeight: '900',
            textAlign: 'center',
            lineHeight: Math.min(36, Math.max(32, width * 0.087)),
            letterSpacing: -0.95,
            maxWidth: 370,
          }}
          numberOfLines={3}
          adjustsFontSizeToFit
        >
          Stop <Text style={{ color: GREEN }}>Reading</Text>.{"\n"}
          Start <Text style={{ color: GREEN }}>Scanning</Text>.{"\n"}
          Get <Text style={{ color: GREEN }}>Instant Insights</Text>.
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13.5, fontWeight: '600', textAlign: 'center', lineHeight: 20, maxWidth: 370, marginTop: 12 }}>
          Scan any barcode and BiteFix turns available food data into clear, Insights — in seconds.
        </Text>
      </View>
    </View>
  );
}

// ── Screen 1: The Problem ─────────────────────────────────
function TheProblemScreen({ colors, isDark }: { colors: any; isDark: boolean }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', lineHeight: 34, letterSpacing: -0.4, marginBottom: 16 }}>
        Shopping Shouldn't Require Detective Work.
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontWeight: '500', marginBottom: 32 }}>
        Food labels can take time to decode while you're standing in the aisle.
      </Text>
      <View style={{ gap: 10 }}>
        {[
          { icon: '🏷️', label: 'Dense ingredient list', sub: '37 ingredients, unreadable type size' },
          { icon: '📱', label: 'One quick scan', sub: 'BiteFix reads the barcode for you' },
          { icon: '✅', label: 'Clear overview', sub: 'Scores, allergens, sugar, additives' },
        ].map((row, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 14, padding: 14 }}>
            <Text style={{ fontSize: 24 }}>{row.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>{row.label}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500', marginTop: 2 }}>{row.sub}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Screen 2: NOVA + Nutri-Score ──────────────────────────
function TwoScoresScreen({ colors, isDark }: { colors: any; isDark: boolean }) {
  const cardStyle = { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' };
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', lineHeight: 34, letterSpacing: -0.4, marginBottom: 8 }}>
        Two Scores.{'\n'}Two Different Questions.
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500', lineHeight: 20, marginBottom: 28 }}>
        NOVA describes processing. Nutri-Score describes nutritional profile.
      </Text>
      <View style={[cardStyle, { marginBottom: 14 }]}>
        <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>NOVA Scale</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['1', '2', '3', '4'].map((n, i) => {
            const clr = ['#34D399', '#86EFAC', '#FBBF24', '#F87171'][i];
            return (
              <View key={n} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: clr + '25', alignItems: 'center', borderWidth: 1, borderColor: clr + '40' }}>
                <Text style={{ color: clr, fontSize: 18, fontWeight: '900' }}>{n}</Text>
              </View>
            );
          })}
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 8 }}>Processing Level</Text>
      </View>
      <View style={cardStyle}>
        <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Nutri-Score</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['A', 'B', 'C', 'D', 'E'].map((letter, i) => {
            const clr = ['#34D399', '#86EFAC', '#FBBF24', '#FB923C', '#F87171'][i];
            return (
              <View key={letter} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: clr + '25', alignItems: 'center', borderWidth: 1, borderColor: clr + '40' }}>
                <Text style={{ color: clr, fontSize: 18, fontWeight: '900' }}>{letter}</Text>
              </View>
            );
          })}
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 8 }}>Nutrition Profile</Text>
      </View>
    </View>
  );
}

// ── Screen 3: Allergies ───────────────────────────────────
function AllergyScreen({ selected, onToggle, colors, isDark }: { selected: string[]; onToggle: (id: string) => void; colors: any; isDark: boolean }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', lineHeight: 34, letterSpacing: -0.4, marginBottom: 8 }}>
        Any Food Allergies to Watch For?
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontWeight: '500', marginBottom: 24 }}>
        BiteFix can highlight matching allergens when the available product information identifies them.
      </Text>
      <View style={{ gap: 10 }}>
        {ALLERGEN_OPTIONS.map((opt) => {
          const active = selected.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => onToggle(opt.id)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: active ? GREEN : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
                backgroundColor: active ? GREEN_DIM : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              }}
            >
              {active ? <CheckCircle size={20} color={GREEN} strokeWidth={2.5} /> : <Circle size={20} color={colors.textMuted} strokeWidth={1.5} />}
              <Text style={{ color: active ? GREEN : colors.text, fontSize: 14, fontWeight: active ? '800' : '600', flex: 1 }}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Screen 4: Gut Shield + Additives ──────────────────────
function GutShieldScreen({ colors, isDark }: { colors: any; isDark: boolean }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
      <View style={{ alignItems: 'center', marginBottom: 28 }}>
        <OrbMascot state="happy" size={90} />
      </View>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', lineHeight: 34, letterSpacing: -0.4, marginBottom: 8 }}>
        Your Ingredients, Reviewed.
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontWeight: '500', marginBottom: 24 }}>
        BiteFix shows a structured overview of the ingredients and additives in a scanned product.
      </Text>
      <View style={{ gap: 12 }}>
        {[
          { icon: <ShieldCheck size={20} color={GREEN} />, title: 'Gut Shield', sub: 'Ingredient Review', desc: 'An overview of notable ingredients based on available data.' },
          { icon: <Zap size={20} color="#F5A623" />, title: 'Additives Identified', sub: 'Colours · Preservatives · Acidity Regulators', desc: 'Lists identified additives from the product ingredient data.' },
        ].map((card) => (
          <View key={card.title} style={{ flexDirection: 'row', gap: 14, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: GREEN_DIM, alignItems: 'center', justifyContent: 'center' }}>{card.icon}</View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{card.title}</Text>
              <Text style={{ color: GREEN, fontSize: 10, fontWeight: '700', marginTop: 1 }}>{card.sub}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500', marginTop: 4 }}>{card.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Screen 5: Sugar ───────────────────────────────────────
function SugarScreen({ colors, isDark }: { colors: any; isDark: boolean }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', lineHeight: 34, letterSpacing: -0.4, marginBottom: 8 }}>
        See Sugar at a Glance.
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontWeight: '500', marginBottom: 28 }}>
        BiteFix estimates the sugar equivalent in familiar terms.
      </Text>
      <View style={{ alignItems: 'center', backgroundColor: isDark ? 'rgba(251,191,36,0.07)' : 'rgba(217,119,6,0.05)', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: isDark ? 'rgba(251,191,36,0.20)' : 'rgba(217,119,6,0.15)', marginBottom: 16 }}>
        <Text style={{ fontSize: 44 }}>🥄</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>≈</Text>
          <Text style={{ color: isDark ? '#FBBF24' : '#D97706', fontSize: 52, fontWeight: '900', letterSpacing: -1 }}>3.2</Text>
          <Text style={{ color: isDark ? '#FBBF24' : '#D97706', fontSize: 20, fontWeight: '800' }}>tsp</Text>
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 4 }}>Estimated Sugar Equivalent</Text>
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2 }}>13.4 g per serving</Text>
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'center' }}>Based on available product data.</Text>
    </View>
  );
}

// ── Screen 6: Environmental Impact ────────────────────────
function EcoScreen({ colors, isDark }: { colors: any; isDark: boolean }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', lineHeight: 34, letterSpacing: -0.4, marginBottom: 8 }}>
        See the Bigger Impact.
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontWeight: '500', marginBottom: 28 }}>
        Where available, BiteFix surfaces environmental estimates alongside your food data.
      </Text>
      <View style={{ backgroundColor: isDark ? 'rgba(52,211,153,0.07)' : 'rgba(22,163,74,0.05)', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: isDark ? 'rgba(52,211,153,0.20)' : 'rgba(22,163,74,0.12)', marginBottom: 16, alignItems: 'center' }}>
        <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Environmental Impact</Text>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: '#22C55E25', alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#22C55E40' }}>
          <Text style={{ color: '#22C55E', fontSize: 28, fontWeight: '900' }}>B</Text>
        </View>
        <Text style={{ color: isDark ? '#34D399' : '#16A34A', fontSize: 16, fontWeight: '800', marginBottom: 4 }}>≈ 1.4 kg CO₂e</Text>
        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}>Estimated per kg of product</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[
          { icon: <Wind size={16} color={GREEN} />, label: 'Carbon' },
          { icon: <Package size={16} color="#F5A623" />, label: 'Packaging' },
          { icon: <Leaf size={16} color={GREEN} />, label: 'Sourcing' },
        ].map((tag) => (
          <View key={tag.label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
            {tag.icon}
            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>{tag.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Screen 7: Personal Priorities ─────────────────────────
function PrioritiesScreen({ selected, onToggle, colors, isDark }: { selected: string[]; onToggle: (id: string) => void; colors: any; isDark: boolean }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', lineHeight: 34, letterSpacing: -0.4, marginBottom: 8 }}>
        What Matters Most to You?
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontWeight: '500', marginBottom: 24 }}>
        Choose as many as you like.
      </Text>
      <View style={{ gap: 10 }}>
        {PRIORITY_OPTIONS.map((opt) => {
          const active = selected.includes(opt.id);
          const IconComponent = opt.icon;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => onToggle(opt.id)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 16,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: active ? GREEN : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
                backgroundColor: active ? GREEN_DIM : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              }}
            >
              {active ? <CheckCircle size={20} color={GREEN} strokeWidth={2.5} /> : <Circle size={20} color={colors.textMuted} strokeWidth={1.5} />}
              <IconComponent size={16} color={GREEN} />
              <Text style={{ color: active ? GREEN : colors.text, fontSize: 14, fontWeight: active ? '800' : '600', flex: 1 }}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Screen 8: Result Preview ──────────────────────────────
function ResultPreviewScreen({ colors, isDark }: { colors: any; isDark: boolean }) {
  const borderDivider = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', lineHeight: 32, letterSpacing: -0.4, marginBottom: 20 }}>
        One Scan. The Important Details, Together.
      </Text>
      <View style={{ backgroundColor: isDark ? 'rgba(18,18,18,0.98)' : '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: borderDivider, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.18 : 0.06, shadowRadius: 12, elevation: 3 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
          <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
            <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>EXAMPLE RESULT</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20 }}>🍫</Text>
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>Chocolate Bar</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600' }}>Product Data Available</Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: borderDivider, marginBottom: 10 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {[
            { label: 'BiteFix Intelligence Score™', value: '54', color: '#FBBF24' },
            { label: 'NOVA', value: '4', color: '#F87171' },
            { label: 'Nutri-Score', value: 'D', color: '#FB923C' },
          ].map((item) => (
            <View key={item.label} style={{ flex: 1, minWidth: 70, backgroundColor: item.color + '15', borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: item.color + '30' }}>
              <Text style={{ color: item.color, fontSize: 16, fontWeight: '900' }}>{item.value}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: '700', marginTop: 2, textAlign: 'center' }} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
        {[
          { label: 'Ingredient Review', value: 'No Flags' },
          { label: 'Sugar Equivalent', value: '≈ 3.2 tsp' },
          { label: 'Environmental Impact', value: 'Grade B' },
        ].map((row) => (
          <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderColor: borderDivider }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>{row.label}</Text>
            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Screen 9: Final Activation ────────────────────────────
function FinalScreen({ colors, isDark }: { colors: any; isDark: boolean }) {
  const reduceMotion = useReduceMotion();
  const orbitAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const animation = Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, orbitAnim]);

  const rotate = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const counterRotate = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const RADIUS = 118;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', lineHeight: 32, letterSpacing: -0.4, textAlign: 'center', marginBottom: 6 }}>
        Your BiteFix Scanner Is Ready
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontWeight: '500', textAlign: 'center', marginBottom: 36 }}>
        Scan a product and let BiteFix turn available food data into a clear snapshot.
      </Text>
      <View style={{ width: RADIUS * 2, height: RADIUS * 2, alignItems: 'center', justifyContent: 'center' }}>
        <OrbMascot state="happy" size={90} />

        {/* Orbit track */}
        <Animated.View
          style={{
            position: 'absolute',
            width: RADIUS * 2,
            height: RADIUS * 2,
            transform: reduceMotion ? [] : [{ rotate }],
          }}
          pointerEvents="none"
        >
          {FEATURE_PILLS.map((pill, i) => {
            const angle = (i / FEATURE_PILLS.length) * 2 * Math.PI;
            const r = RADIUS - 16;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            return (
              <Animated.View
                key={pill}
                style={{
                  position: 'absolute',
                  left: RADIUS + x - 34,
                  top: RADIUS + y - 12,
                  width: 68,
                  alignItems: 'center',
                  transform: reduceMotion ? [] : [{ rotate: counterRotate }],
                }}
              >
                <View
                  style={{
                    backgroundColor: isDark ? 'rgba(20, 24, 22, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 12,
                    paddingHorizontal: 7,
                    paddingVertical: 4,
                    borderWidth: 1,
                    borderColor: GREEN + '50',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.25 : 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 9.5, fontWeight: '800' }}>{pill}</Text>
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function OnboardingScreen() {
  const { colors, isDark } = useTheme();
  const {
    setOnboardingComplete,
    setProfile,
    setAllergenFilters,
    setDietPreference,
    setTrackEcoScore,
    setTrackOrganic,
  } = useAppStore();

  const [currentScreen, setCurrentScreen] = useState(0);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  const toggleAllergen = useCallback((id: string) => {
    Haptics.selectionAsync();
    setAllergens((prev) => {
      if (id === 'none') return prev.includes('none') ? [] : ['none'];
      const withoutNone = prev.filter((a) => a !== 'none');
      return withoutNone.includes(id) ? withoutNone.filter((a) => a !== id) : [...withoutNone, id];
    });
  }, []);

  const togglePriority = useCallback((id: string) => {
    Haptics.selectionAsync();
    setPriorities((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }, []);

  const goTo = useCallback(
    (screen: number) => {
      if (reduceMotion) {
        setCurrentScreen(screen);
        return;
      }
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
        setCurrentScreen(screen);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    },
    [fadeAnim, reduceMotion]
  );

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const realAllergens = allergens.filter((a) => a !== 'none');
    setAllergenFilters(realAllergens);

    const goalMap: Record<string, 'ultra_processed' | 'nutri_score' | 'clean_swaps' | 'healthy_habits' | 'none'> = {
      ultra_processed: 'ultra_processed',
      nutri_score: 'nutri_score',
      clean_swaps: 'clean_swaps',
      healthy_habits: 'healthy_habits',
    };
    const primaryGoal = priorities.length > 0 ? goalMap[priorities[0]] ?? 'none' : 'none';
    setProfile({ userGoal: primaryGoal });

    setTrackEcoScore(true);
    setTrackOrganic(false);
    setDietPreference('standard');

    setOnboardingComplete(true);
    router.replace('/paywall');
  }, [allergens, priorities, setAllergenFilters, setProfile, setDietPreference, setTrackEcoScore, setTrackOrganic, setOnboardingComplete]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentScreen < TOTAL_SCREENS - 1) {
      goTo(currentScreen + 1);
    } else {
      handleComplete();
    }
  }, [currentScreen, goTo, handleComplete]);

  const handleBack = useCallback(() => {
    if (currentScreen > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goTo(currentScreen - 1);
    }
  }, [currentScreen, goTo]);

  const ctaLabel =
    currentScreen === TOTAL_SCREENS - 1 ? 'Activate BiteFix' :
      currentScreen === 0 ? 'Get Started' :
        currentScreen === 1 ? 'Show Me More' :
          currentScreen === 8 ? 'Almost There' : 'Next';

  const screenContent = [
    <WelcomeScreen key={0} colors={colors} isDark={isDark} />,
    <TheProblemScreen key={1} colors={colors} isDark={isDark} />,
    <TwoScoresScreen key={2} colors={colors} isDark={isDark} />,
    <AllergyScreen key={3} selected={allergens} onToggle={toggleAllergen} colors={colors} isDark={isDark} />,
    <GutShieldScreen key={4} colors={colors} isDark={isDark} />,
    <SugarScreen key={5} colors={colors} isDark={isDark} />,
    <EcoScreen key={6} colors={colors} isDark={isDark} />,
    <PrioritiesScreen key={7} selected={priorities} onToggle={togglePriority} colors={colors} isDark={isDark} />,
    <ResultPreviewScreen key={8} colors={colors} isDark={isDark} />,
    <FinalScreen key={9} colors={colors} isDark={isDark} />,
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top navigation row — intentionally hidden on the Welcome hero. */}
      {currentScreen > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
          {currentScreen > 0 ? (
            <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}>
              <ChevronLeft size={18} color={colors.textSecondary} strokeWidth={2} />
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 52 }} />
          )}

          {/* Progress dots */}
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {Array.from({ length: TOTAL_SCREENS }).map((_, i) => (
              <View key={i} style={{ width: i === currentScreen ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === currentScreen ? GREEN : colors.textMuted + '50' }} />
            ))}
          </View>

          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', width: 52, textAlign: 'right' }}>
            {currentScreen + 1}/{TOTAL_SCREENS}
          </Text>
        </View>
      )}

      {/* Screen content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {screenContent[currentScreen]}
        </ScrollView>
      </Animated.View>

      {/* Bottom CTA button */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12 }}>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.82}
          style={{ backgroundColor: GREEN, borderRadius: 16, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 }}>{ctaLabel}</Text>
          <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}