import React, { useState, useEffect } from 'react';
import { Text } from '@/components/Text';
import {
  View,
  TouchableOpacity,
  useWindowDimensions,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Camera } from 'expo-camera';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { OrbMascot } from '../../components/features/OrbMascot';
import { MagicalBackground } from '../../components/features/MagicalBackground';
import {
  ArrowRight,
  Check,
  Search,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Sparkles,
  RefreshCw,
  Zap,
  Star,
  X,
  Layers,
  Heart,
  Flame,
  Award,
  ShoppingCart,
  Smile,
  CheckCircle2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Line,
  Text as SvgText,
  Circle,
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';

// ─────────────────────────────────────────────────────────
// Animated Mascot Shadow Component
// ─────────────────────────────────────────────────────────
function MascotShadow({ size, scaleStyle }: { size: number; scaleStyle: any }) {
  return (
    <Animated.View style={[{ width: size, height: size * 0.15, alignSelf: 'center' }, scaleStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 15">
        <Defs>
          <SvgRadialGradient id="shadowG" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Circle cx="50" cy="7.5" r="50" fill="url(#shadowG)" />
      </Svg>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────
// Mascot Thought Bubble ("Think Message")
// ─────────────────────────────────────────────────────────
function ThoughtBubble({ text, visible }: { text: string; visible: boolean }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && text) {
      scale.value = withDelay(250, withSpring(1, { damping: 14, stiffness: 200 }));
      opacity.value = withDelay(250, withTiming(1, { duration: 250 }));
    } else {
      scale.value = withTiming(0, { duration: 180 });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible, text]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!text) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          right: -58,
          top: -46,
          width: 140,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          paddingHorizontal: 10,
          paddingVertical: 9,
          shadowColor: '#FF9500',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.22,
          shadowRadius: 14,
          elevation: 9,
          borderWidth: 1.5,
          borderColor: '#FFD54F',
          zIndex: 100,
        },
        animStyle,
      ]}
    >
      <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#8C4A00', lineHeight: 14, textAlign: 'center' }}>
        {text}
      </Text>
      <View
        style={{
          position: 'absolute',
          bottom: -6,
          left: 28,
          width: 11,
          height: 11,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1.5,
          borderRightWidth: 1.5,
          borderColor: '#FFD54F',
          transform: [{ rotate: '45deg' }],
        }}
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 1: Name Personalization Card
// ─────────────────────────────────────────────────────────
function NameCard({ cardW, C, value, onChange }: { cardW: number; C: any; value: string; onChange: (v: string) => void }) {
  return (
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: C.cardBorder,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 6,
        gap: 14,
      }}
    >
      <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        Personal Account Profile
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: value.trim() ? C.amber : C.cardBorder,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === 'ios' ? 12 : 8,
          backgroundColor: C.cardInner,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Enter your first name"
          placeholderTextColor={C.textMuted}
          style={{
            flex: 1,
            color: C.text,
            fontSize: 16,
            fontWeight: '700',
          }}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={20}
        />
      </View>

      <View
        style={{
          backgroundColor: C.amberLight,
          borderRadius: 12,
          padding: 10,
          borderWidth: 1,
          borderColor: C.amber + '30',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Sparkles size={16} color={C.amber} />
        <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', flex: 1 }}>
          {value.trim() ? `Welcome, ${value.trim()}! Ready to fix your food?` : 'Type your name above to personalize your scanner!'}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 2: Primary Health Goal Card
// ─────────────────────────────────────────────────────────
type GoalOption = 'energy' | 'gut_microbiome' | 'weight_management' | 'family_safety';

function GoalCard({ cardW, C, selected, onSelect }: { cardW: number; C: any; selected: GoalOption[]; onSelect: (vals: GoalOption[]) => void }) {
  const options: { label: string; tag: string; icon: React.ReactNode; value: GoalOption }[] = [
    { label: 'Increase Daily Energy', tag: 'Reduce Fatigue', icon: <Flame size={18} color={C.amber} />, value: 'energy' },
    { label: 'Improve Gut Microbiome', tag: 'Stop Bloating', icon: <ShieldCheck size={18} color={C.green} />, value: 'gut_microbiome' },
    { label: 'Weight Management', tag: 'Cut Hidden Sugar', icon: <Activity size={18} color="#AF52DE" />, value: 'weight_management' },
    { label: 'Family Food Safety', tag: 'Avoid Synthetic Dyes', icon: <Heart size={18} color={C.red} />, value: 'family_safety' },
  ];

  const handleToggle = (val: GoalOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selected.includes(val)) {
      onSelect(selected.filter((item) => item !== val));
    } else {
      onSelect([val]); // Single select preferred for goal
    }
  };

  return (
    <View
      style={{
        width: cardW,
        backgroundColor: C.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: C.cardBorder,
        padding: 14,
        gap: 8,
      }}
    >
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => handleToggle(opt.value)}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isSelected ? C.amberLight : C.cardInner,
              borderColor: isSelected ? C.amber : C.cardBorder,
              borderWidth: 1.5,
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: isSelected ? 'transparent' : C.card, alignItems: 'center', justifyContent: 'center' }}>
                {opt.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 13.5, fontWeight: '800' }}>{opt.label}</Text>
                <Text style={{ color: C.textMuted, fontSize: 10, fontWeight: '600', marginTop: 1 }}>{opt.tag}</Text>
              </View>
            </View>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: 1.5,
                borderColor: isSelected ? C.amber : C.textMuted,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected ? C.amber : 'transparent',
              }}
            >
              {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 3: Food Sourcing Baseline Card
// ─────────────────────────────────────────────────────────
function FoodSourcingCard({ cardW, C, value, onSelect }: { cardW: number; C: any; value: string; onSelect: (v: string) => void }) {
  const options = [
    { label: 'Daily / Multiple times a day', desc: 'Rely heavily on packaged snacks & meals', val: 'daily', color: C.red },
    { label: '3 to 4 times a week', desc: 'Mix of home-cooked foods and packaged snacks', val: 'weekly', color: C.amber },
    { label: 'Rarely / Whole Foods', desc: 'Cook almost everything fresh from scratch', val: 'rarely', color: C.green },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.cardBorder, padding: 14, gap: 10 }}>
      {options.map((opt) => {
        const isSelected = value === opt.val;
        return (
          <TouchableOpacity
            key={opt.val}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(opt.val);
            }}
            activeOpacity={0.85}
            style={{
              backgroundColor: isSelected ? C.amberLight : C.cardInner,
              borderColor: isSelected ? C.amber : C.cardBorder,
              borderWidth: 1.5,
              borderRadius: 14,
              padding: 12,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: C.text, fontSize: 13.5, fontWeight: '800' }}>{opt.label}</Text>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: opt.color }} />
            </View>
            <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '500' }}>{opt.desc}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 4: Symptom & Energy Audit Card
// ─────────────────────────────────────────────────────────
function SymptomAuditCard({ cardW, C, selected, onToggle }: { cardW: number; C: any; selected: string[]; onToggle: (s: string) => void }) {
  const symptoms = [
    { id: 'slumps', label: '🥱 Afternoon slumps' },
    { id: 'bloating', label: '💨 Post-meal bloating' },
    { id: 'brainfog', label: '🧠 Brain fog' },
    { id: 'cravings', label: '🍫 Intense sugar cravings' },
    { id: 'skin', label: '🧴 Skin breakouts' },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.cardBorder, padding: 14, gap: 10 }}>
      <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '700' }}>Select symptoms you experience frequently:</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {symptoms.map((s) => {
          const active = selected.includes(s.id);
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(s.id);
              }}
              style={{
                backgroundColor: active ? C.redLight : C.cardInner,
                borderColor: active ? C.red : C.cardBorder,
                borderWidth: 1.5,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: active ? C.red : C.text, fontSize: 12, fontWeight: active ? '800' : '600' }}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 5: NOVA 4 Wake-Up Call Graphic Card
// ─────────────────────────────────────────────────────────
function NovaWakeUpCard({ cardW, C }: { cardW: number; C: any }) {
  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 22, borderWidth: 1.5, borderColor: C.red + '40', padding: 18, gap: 12, alignItems: 'center' }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.redLight, alignItems: 'center', justifyContent: 'center' }}>
        <AlertTriangle size={24} color={C.red} />
      </View>
      <Text style={{ color: C.red, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>73%</Text>
      <Text style={{ color: C.text, fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 17 }}>
        of grocery foods in North America are NOVA 4 Ultra-Processed.
      </Text>
      <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '500', textAlign: 'center', lineHeight: 15 }}>
        Loaded with synthetic emulsifiers, gums, and artificial preservatives engineered for hyper-palatability.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 6: Additive Priorities Card
// ─────────────────────────────────────────────────────────
function AdditivePrioritiesCard({ cardW, C, selected, onToggle }: { cardW: number; C: any; selected: string[]; onToggle: (a: string) => void }) {
  const additives = [
    { id: 'dyes', label: 'Synthetic Food Dyes', desc: 'Red 40, Yellow 5, Blue 1' },
    { id: 'hfcs', label: 'High Fructose Corn Syrup', desc: 'Artificial sweeteners & syrups' },
    { id: 'emulsifiers', label: 'Microbiome Emulsifiers', desc: 'Polysorbate 80, Carboxymethylcellulose' },
    { id: 'oils', label: 'Refined Industrial Seed Oils', desc: 'Canola, Soybean, Palm Oil' },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.cardBorder, padding: 14, gap: 8 }}>
      {additives.map((item) => {
        const active = selected.includes(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(item.id);
            }}
            style={{
              backgroundColor: active ? C.amberLight : C.cardInner,
              borderColor: active ? C.amber : C.cardBorder,
              borderWidth: 1.5,
              borderRadius: 12,
              padding: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 13, fontWeight: '800' }}>{item.label}</Text>
              <Text style={{ color: C.textMuted, fontSize: 10, fontWeight: '500' }}>{item.desc}</Text>
            </View>
            <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: active ? C.amber : C.textMuted, backgroundColor: active ? C.amber : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {active && <Check size={10} color="#FFF" strokeWidth={3} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 7: Personal Allergen Defense Card
// ─────────────────────────────────────────────────────────
function AllergenDefenseCard({ cardW, C, selected, onToggle }: { cardW: number; C: any; selected: string[]; onToggle: (a: string) => void }) {
  const allergens = ['Gluten', 'Dairy', 'Soy', 'Nuts', 'Eggs', 'Palm Oil'];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.cardBorder, padding: 16, gap: 12 }}>
      <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '700' }}>Tap to activate RED shield alerts:</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {allergens.map((item) => {
          const active = selected.includes(item);
          return (
            <TouchableOpacity
              key={item}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(item);
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: active ? C.redLight : C.cardInner,
                borderWidth: 1.5,
                borderColor: active ? C.red : C.cardBorder,
              }}
            >
              <Text style={{ color: active ? C.red : C.text, fontSize: 12, fontWeight: active ? '900' : '700' }}>
                {active ? `🚨 ${item}` : item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 8: Commitment Level Card
// ─────────────────────────────────────────────────────────
function CommitmentLevelCard({ cardW, C, value, onSelect }: { cardW: number; C: any; value: string; onSelect: (v: string) => void }) {
  const levels = [
    { id: 'curious', title: 'Curious & Learning', desc: 'Want to scan & see what is inside food' },
    { id: 'moderate', title: 'Moderate Clean Swaps', desc: 'Ready to replace bad snacks with clean ones' },
    { id: 'committed', title: '100% Ultra-Clean Commitment', desc: 'Eliminate ultra-processed foods entirely' },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.cardBorder, padding: 14, gap: 10 }}>
      {levels.map((lvl) => {
        const active = value === lvl.id;
        return (
          <TouchableOpacity
            key={lvl.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(lvl.id);
            }}
            style={{
              backgroundColor: active ? C.amberLight : C.cardInner,
              borderColor: active ? C.amber : C.cardBorder,
              borderWidth: 1.5,
              borderRadius: 14,
              padding: 12,
            }}
          >
            <Text style={{ color: C.text, fontSize: 13.5, fontWeight: '800' }}>{lvl.title}</Text>
            <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '500', marginTop: 2 }}>{lvl.desc}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 9: Social Proof Card
// ─────────────────────────────────────────────────────────
function SocialProofCard({ cardW, C }: { cardW: number; C: any }) {
  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.cardBorder, padding: 16, gap: 12, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={18} color="#FFCC00" fill="#FFCC00" />
        ))}
      </View>
      <Text style={{ color: C.text, fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 17 }}>
        "BiteFix unmasked hidden ultra-processed dyes in my daily protein bar. Found an A-Grade clean swap instantly!"
      </Text>
      <Text style={{ color: C.amber, fontSize: 11, fontWeight: '800' }}>— Sarah M., Verified User</Text>
      <View style={{ backgroundColor: C.cardInner, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: C.cardBorder }}>
        <Text style={{ color: C.textSub, fontSize: 10, fontWeight: '700' }}>Backed by Open Food Facts Science</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 10: Dynamic Health Analysis Engine (Calculation Loader)
// ─────────────────────────────────────────────────────────
function HealthAnalysisCalculationCard({ cardW, C, onComplete }: { cardW: number; C: any; onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState('Analyzing health goals...');

  useEffect(() => {
    const t1 = setTimeout(() => { setProgress(35); setStepText('Calibrating NOVA 4 sensitivity...'); }, 800);
    const t2 = setTimeout(() => { setProgress(70); setStepText('Setting up Gut Shield alerts...'); }, 1800);
    const t3 = setTimeout(() => { setProgress(100); setStepText('Generating Clean Swap Matrix...'); }, 2800);
    const t4 = setTimeout(() => { onComplete(); }, 3500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 24, borderWidth: 1.5, borderColor: C.amber, padding: 24, gap: 16, alignItems: 'center' }}>
      <ActivityIndicator size="large" color={C.amber} />
      <Text style={{ color: C.text, fontSize: 16, fontWeight: '900', textAlign: 'center' }}>{stepText}</Text>
      <View style={{ width: '100%', height: 8, backgroundColor: C.cardInner, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${progress}%`, height: '100%', backgroundColor: C.amber, borderRadius: 4 }} />
      </View>
      <Text style={{ color: C.amber, fontSize: 13, fontWeight: '800' }}>{progress}% Completed</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 11: Instant Result Intelligence Preview (6-Point Matrix)
// ─────────────────────────────────────────────────────────
function InstantResultSummaryCard({ cardW, C, isDark }: { cardW: number; C: any; isDark: boolean }) {
  const features = [
    { title: 'NOVA Class', desc: 'Processing audit', icon: <Activity size={12} color="#FF9500" /> },
    { title: 'Nutri-Score', desc: 'Traffic light grade', icon: <Sparkles size={12} color="#34C759" /> },
    { title: 'Gut Shield', desc: 'Barrier alert', icon: <ShieldAlert size={12} color="#FF3B30" /> },
    { title: 'Dye Detective', desc: 'Synthetic dyes', icon: <Search size={12} color="#AF52DE" /> },
    { title: 'Hidden Sugar', desc: 'Teaspoon converter', icon: <Zap size={12} color="#FFCC00" /> },
    { title: 'Smart Swaps', desc: 'Clean A-Grade match', icon: <RefreshCw size={12} color="#007AFF" /> },
  ];

  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 22, borderWidth: 1.5, borderColor: C.amber, padding: 14, gap: 8 }}>
      <Text style={{ color: C.amber, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.5 }}>
        6-Point Instant Scan Matrix
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between' }}>
        {features.map((f, i) => (
          <View key={i} style={{ width: '48%', backgroundColor: C.cardInner, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: C.cardBorder, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {f.icon}
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 11, fontWeight: '800' }}>{f.title}</Text>
              <Text style={{ color: C.textMuted, fontSize: 8.5, fontWeight: '600' }}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 12: Paywall Transition Summary Card
// ─────────────────────────────────────────────────────────
function PaywallTransitionCard({ cardW, C }: { cardW: number; C: any }) {
  return (
    <View style={{ width: cardW, backgroundColor: C.card, borderRadius: 22, borderWidth: 1.5, borderColor: C.amber, padding: 16, gap: 10, alignItems: 'center' }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.amberLight, alignItems: 'center', justifyContent: 'center' }}>
        <Award size={22} color={C.amber} />
      </View>
      <Text style={{ color: C.text, fontSize: 16, fontWeight: '900', textAlign: 'center' }}>
        Your Custom Food Shield is Ready!
      </Text>
      <Text style={{ color: C.textSub, fontSize: 11.5, fontWeight: '600', textAlign: 'center', lineHeight: 15 }}>
        Unlock unlimited barcode scanning, full additive alerts, and clean food swaps.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// SLIDES DATA CONFIGURATION (12 STEPS)
// ─────────────────────────────────────────────────────────
interface SlideData {
  step: number;
  title: string;
  highlight: string;
  subtitle: string;
  buttonLabel: string;
  isLast: boolean;
  mascotState: 'happy' | 'idle' | 'shocked';
}

const SLIDES: SlideData[] = [
  { step: 1, title: 'Welcome to BiteFix', highlight: 'BiteFix', subtitle: "Let's personalize your food scanner.", buttonLabel: 'Continue', isLast: false, mascotState: 'happy' },
  { step: 2, title: 'Select Primary Goal', highlight: 'Primary Goal', subtitle: 'Tailor your scanner to focus on what matters.', buttonLabel: 'Continue', isLast: false, mascotState: 'idle' },
  { step: 3, title: 'Food Sourcing Baseline', highlight: 'Food Sourcing', subtitle: 'How often do you consume pre-packaged foods?', buttonLabel: 'Continue', isLast: false, mascotState: 'idle' },
  { step: 4, title: 'Energy & Gut Audit', highlight: 'Energy & Gut', subtitle: 'Select any symptoms you experience frequently:', buttonLabel: 'Continue', isLast: false, mascotState: 'shocked' },
  { step: 5, title: 'NOVA 4 Wake-Up Call', highlight: 'NOVA 4', subtitle: '73%+ of grocery foods are Ultra-Processed.', buttonLabel: 'I Want to Protect Myself', isLast: false, mascotState: 'shocked' },
  { step: 6, title: 'Additive Priorities', highlight: 'Additive Priorities', subtitle: 'Select hidden ingredients to flag instantly:', buttonLabel: 'Continue', isLast: false, mascotState: 'idle' },
  { step: 7, title: 'Personal Allergen Defense', highlight: 'Allergen Defense', subtitle: 'Lock ingredients with high-priority RED shields:', buttonLabel: 'Continue', isLast: false, mascotState: 'happy' },
  { step: 8, title: 'Commitment Level', highlight: 'Commitment', subtitle: 'How committed are you to clean eating?', buttonLabel: 'Continue', isLast: false, mascotState: 'happy' },
  { step: 9, title: 'Join 50,000+ Clean Eaters', highlight: '50,000+', subtitle: 'Backed by Open Food Facts Science.', buttonLabel: 'Build My Food Shield', isLast: false, mascotState: 'happy' },
  { step: 10, title: 'Analyzing Health Profile...', highlight: 'Analyzing', subtitle: 'Calibrating custom Gut Shield & Clean Swap Matrix.', buttonLabel: 'Analyzing...', isLast: false, mascotState: 'happy' },
  { step: 11, title: 'Instant Scan Intelligence', highlight: 'Scan Intelligence', subtitle: 'Your personalized 6-point scanner is ready.', buttonLabel: 'Unlock Full Access', isLast: false, mascotState: 'happy' },
  { step: 12, title: 'Your Clean Journey Begins', highlight: 'Clean Journey', subtitle: 'Start your unlimited food scanning experience.', buttonLabel: 'Start My Clean Journey', isLast: true, mascotState: 'happy' },
];

function DotIndicator({ active, C }: { active: boolean; C: any }) {
  const dotAnimStyle = useAnimatedStyle(() => ({
    width: withSpring(active ? 18 : 5, { damping: 15, stiffness: 150 }),
    backgroundColor: withTiming(active ? C.amber : C.cardBorder, { duration: 200 }),
  }), [active, C]);

  return <Animated.View style={[{ height: 5, borderRadius: 3 }, dotAnimStyle]} />;
}

// ─────────────────────────────────────────────────────────
// MAIN ONBOARDING SCREEN COMPONENT
// ─────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const { setProfile, setOnboardingComplete, toggleAllergenFilter, allergenFilters } = useAppStore();
  const { user } = useAuthStore();

  const C = {
    bg: colors.background,
    card: colors.surface,
    cardInner: isDark ? '#1F2937' : '#F9FAFB',
    cardBorder: colors.border,
    amber: '#FF9500',
    amberLight: isDark ? 'rgba(255, 149, 0, 0.15)' : '#FFFBEB',
    amberMid: '#F59E0B',
    red: '#EF4444',
    redLight: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
    green: '#10B981',
    greenLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
    text: colors.text,
    textSub: colors.textSecondary,
    textMuted: colors.textMuted,
  };

  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // User State
  const [userName, setUserName] = useState('');
  const [userGoals, setUserGoals] = useState<GoalOption[]>(['energy']);
  const [foodSourcing, setFoodSourcing] = useState('weekly');
  const [symptoms, setSymptoms] = useState<string[]>(['slumps', 'bloating']);
  const [additives, setAdditives] = useState<string[]>(['dyes', 'emulsifiers']);
  const [commitment, setCommitment] = useState('moderate');

  // Mascot Floating Animation
  const mascotFloatY = useSharedValue(0);
  const cardTranslateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);
  const textTranslateY = useSharedValue(0);
  const textOpacity = useSharedValue(1);
  const shineProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    mascotFloatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    shineProgress.value = withRepeat(
      withDelay(1200, withTiming(1, { duration: 1600, easing: Easing.linear })),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (currentSlide !== currentCardIndex) {
      cardOpacity.value = withTiming(0, { duration: 150 });
      cardScale.value = withTiming(0.93, { duration: 150 });
      cardTranslateX.value = withTiming(-35, { duration: 150 }, () => {
        runOnJS(setCurrentCardIndex)(currentSlide);
        cardTranslateX.value = 35;
        cardOpacity.value = withTiming(1, { duration: 250 });
        cardScale.value = withTiming(1, { duration: 250 });
        cardTranslateX.value = withSpring(0, { damping: 13, stiffness: 120 });
      });
    }

    if (currentSlide !== currentTextIndex) {
      textOpacity.value = withTiming(0, { duration: 150 });
      textTranslateY.value = withTiming(15, { duration: 150 }, () => {
        runOnJS(setCurrentTextIndex)(currentSlide);
        textTranslateY.value = -15;
        textOpacity.value = withTiming(1, { duration: 220 });
        textTranslateY.value = withSpring(0, { damping: 13, stiffness: 120 });
      });
    }
  }, [currentSlide]);

  const mascotAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: mascotFloatY.value }],
  }));

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateX: cardTranslateX.value }, { scale: cardScale.value }],
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleNext = async () => {
    if (currentSlide === 0 && !userName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (currentSlide === 3) {
      try {
        await Camera.requestCameraPermissionsAsync();
      } catch (_) {}
    }

    if (currentSlide < SLIDES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentSlide((s) => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setProfile({
        userName: userName.trim() || 'Friend',
        userGoal: userGoals[0] || 'energy',
      });
      setOnboardingComplete(true);
      router.replace(user ? '/paywall' : '/auth');
    }
  };

  const isNextDisabled = () => {
    if (currentSlide === 0 && !userName.trim()) return true;
    return false;
  };

  const slide = SLIDES[currentSlide] || SLIDES[0];
  const isShort = height < 700;
  const orbSize = Math.min(Math.round(width * 0.32), 130);
  const cardW = Math.min(width - 32, 380);

  const renderTitle = () => {
    const textSlide = SLIDES[currentTextIndex] || SLIDES[0];
    const parts = textSlide.title.split(textSlide.highlight);
    return (
      <Text style={{ color: C.text, fontSize: isShort ? 19 : 22, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 }}>
        {parts[0]}
        {textSlide.highlight ? <Text style={{ color: C.amber }}>{textSlide.highlight}</Text> : null}
        {parts[1] || ''}
      </Text>
    );
  };

  const toggleSymptom = (id: string) => {
    setSymptoms((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAdditive = (id: string) => {
    setAdditives((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <MagicalBackground />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isShort ? 4 : 8 }}>
          <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
            STEP {currentSlide + 1} OF 12
          </Text>

          {currentSlide > 0 && currentSlide !== 9 && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCurrentSlide((s) => s - 1);
              }}
              style={{ backgroundColor: C.cardInner, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
            >
              <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '700' }}>Back</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Mascot Header */}
        <View style={{ alignItems: 'center', marginVertical: isShort ? 4 : 8, position: 'relative' }}>
          <Animated.View style={mascotAnimStyle}>
            <OrbMascot state={slide.mascotState} size={orbSize} />
          </Animated.View>
          <MascotShadow size={orbSize} scaleStyle={{}} />
        </View>

        {/* Title & Subtitle */}
        <Animated.View style={[{ alignItems: 'center', marginVertical: isShort ? 4 : 8, gap: 4 }, textAnimStyle]}>
          {renderTitle()}
          <Text style={{ color: C.textSub, fontSize: isShort ? 11.5 : 13, fontWeight: '600', textAlign: 'center' }}>
            {SLIDES[currentTextIndex].subtitle}
          </Text>
        </Animated.View>

        {/* Card Component Slot */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 8 }}>
          <Animated.View style={cardAnimStyle}>
            {currentCardIndex === 0 && <NameCard cardW={cardW} C={C} value={userName} onChange={setUserName} />}
            {currentCardIndex === 1 && <GoalCard cardW={cardW} C={C} selected={userGoals} onSelect={setUserGoals} />}
            {currentCardIndex === 2 && <FoodSourcingCard cardW={cardW} C={C} value={foodSourcing} onSelect={setFoodSourcing} />}
            {currentCardIndex === 3 && <SymptomAuditCard cardW={cardW} C={C} selected={symptoms} onToggle={toggleSymptom} />}
            {currentCardIndex === 4 && <NovaWakeUpCard cardW={cardW} C={C} />}
            {currentCardIndex === 5 && <AdditivePrioritiesCard cardW={cardW} C={C} selected={additives} onToggle={toggleAdditive} />}
            {currentCardIndex === 6 && <AllergenDefenseCard cardW={cardW} C={C} selected={allergenFilters} onToggle={toggleAllergenFilter} />}
            {currentCardIndex === 7 && <CommitmentLevelCard cardW={cardW} C={C} value={commitment} onSelect={setCommitment} />}
            {currentCardIndex === 8 && <SocialProofCard cardW={cardW} C={C} />}
            {currentCardIndex === 9 && <HealthAnalysisCalculationCard cardW={cardW} C={C} onComplete={() => setCurrentSlide(10)} />}
            {currentCardIndex === 10 && <InstantResultSummaryCard cardW={cardW} C={C} isDark={isDark} />}
            {currentCardIndex === 11 && <PaywallTransitionCard cardW={cardW} C={C} />}
          </Animated.View>
        </View>

        {/* Pagination Dots & CTA Button */}
        {currentCardIndex !== 9 && (
          <View style={{ gap: 12, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
              {SLIDES.map((_, idx) => (
                <DotIndicator key={idx} active={currentSlide === idx} C={C} />
              ))}
            </View>

            <Animated.View style={[buttonAnimStyle, { width: '100%', opacity: isNextDisabled() ? 0.5 : 1 }]}>
              <TouchableOpacity
                onPress={handleNext}
                disabled={isNextDisabled()}
                activeOpacity={0.9}
                style={{
                  width: '100%',
                  backgroundColor: C.amber,
                  borderRadius: 18,
                  paddingVertical: isShort ? 13 : 15,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  shadowColor: C.amber,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
                  {slide.buttonLabel}
                </Text>
                {slide.isLast ? <Check size={16} color="#FFF" strokeWidth={3} /> : <ArrowRight size={16} color="#FFF" strokeWidth={2.5} />}
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
