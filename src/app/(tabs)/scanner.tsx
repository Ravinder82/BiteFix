import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import { useAppStore } from '../../stores/appStore';
import { useTheme } from '../../hooks/useTheme';
import { SugarPile } from '../../components/features/SugarPile';
import { OrbMascot as Mascot } from '../../components/features/OrbMascot';
import { NutritionFacts } from '../../components/features/NutritionFacts';
import { Keyboard, ArrowLeft, Camera as CameraIcon, HelpCircle, AlertCircle, Zap, ZapOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type ScanMode = 'camera' | 'manual' | 'result';

// Timeout for the Open Food Facts API call — 10 seconds
const API_TIMEOUT_MS = 10_000;
// Minimum delay before next scan can fire (prevents double-scans)
const SCAN_COOLDOWN_MS = 2_500;

// ─────────────────────────────────────────────────────────
// Fetch with timeout helper — prevents scanner from hanging
// ─────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────
// Main Scanner Screen
// ─────────────────────────────────────────────────────────
export default function ScannerScreen() {
  const { colors, isDark } = useTheme();
  const { addScan } = useAppStore();

  // Camera permission hook from expo-camera
  const [permission, requestPermission] = useCameraPermissions();

  const [mode, setMode] = useState<ScanMode>('camera');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);

  // Synchronous ref-lock prevents duplicate scan callbacks from camera frames
  const isScanningRef = useRef(false);
  // Track whether the component is still mounted to prevent setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Animated laser line (0 → 1 normalized, mapped in style)
  const laserY = useSharedValue(0);

  useEffect(() => {
    if (mode === 'camera' && permission?.granted) {
      laserY.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    } else {
      laserY.value = withTiming(0, { duration: 300 });
    }
  }, [mode, permission?.granted]);

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserY.value * 230 }],
  }));

  // Torch button pulse
  const torchScale = useSharedValue(1);
  const torchStyle = useAnimatedStyle(() => ({ transform: [{ scale: torchScale.value }] }));

  const toggleTorch = () => {
    torchScale.value = withSequence(
      withSpring(0.85, { damping: 8 }),
      withSpring(1, { damping: 8 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTorchOn((prev) => !prev);
  };

  // Manual Input State
  const [manualName, setManualName] = useState('');
  const [manualSugarGrams, setManualSugarGrams] = useState('');
  const [focusName, setFocusName] = useState(false);
  const [focusSugar, setFocusSugar] = useState(false);

  // Scan Result State
  const [scanResult, setScanResult] = useState<{
    name: string;
    brand: string;
    sugarGrams: number;
    sugarTeaspoons: number;
    imageUrl?: string;
    servingSize?: string;
    calories?: number;
    carbsGrams?: number;
    fatGrams?: number;
    proteinGrams?: number;
  } | null>(null);

  // Auto-switch to manual if camera permission is denied
  useEffect(() => {
    if (permission && !permission.granted && mode === 'camera') {
      setMode('manual');
    }
  }, [permission]);

  // Turn torch off when leaving camera mode
  useEffect(() => {
    if (mode !== 'camera') {
      setTorchOn(false);
    }
  }, [mode]);

  // ─── Core barcode scan handler ───────────────────────────
  const handleBarcodeScanned = useCallback(async ({ data }: BarcodeScanningResult) => {
    // Double-scan guard
    if (isScanningRef.current || loading) return;
    if (!data || !data.trim()) return;

    isScanningRef.current = true;

    if (!mountedRef.current) return;
    setLoading(true);
    setErrorMsg(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      const response = await fetchWithTimeout(
        `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(data.trim())}.json`,
        API_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const resData = await response.json();

      if (resData?.product) {
        const p = resData.product;
        const name = (p.product_name || p.product_name_en || 'Unknown Product').trim();
        const brand = (p.brands || 'Generic Brand').trim();
        const imageUrl: string | undefined = p.image_front_url || p.image_url || undefined;

        // Prioritize per-serving sugar, fallback to per-100g, fallback to 0
        const sugarGrams =
          p.nutriments?.sugars_serving !== undefined
            ? parseFloat(p.nutriments.sugars_serving)
            : p.nutriments?.sugars_100g !== undefined
            ? parseFloat(p.nutriments.sugars_100g)
            : 0;

        const sugarTeaspoons = parseFloat((sugarGrams / 3.2).toFixed(1));

        const servingSize: string | undefined = p.serving_size || undefined;
        const calories =
          p.nutriments?.['energy-kcal_serving'] !== undefined
            ? parseFloat(p.nutriments['energy-kcal_serving'])
            : p.nutriments?.['energy-kcal_100g'] !== undefined
            ? parseFloat(p.nutriments['energy-kcal_100g'])
            : undefined;
        const carbsGrams =
          p.nutriments?.carbohydrates_serving !== undefined
            ? parseFloat(p.nutriments.carbohydrates_serving)
            : p.nutriments?.carbohydrates_100g !== undefined
            ? parseFloat(p.nutriments.carbohydrates_100g)
            : undefined;
        const fatGrams =
          p.nutriments?.fat_serving !== undefined
            ? parseFloat(p.nutriments.fat_serving)
            : p.nutriments?.fat_100g !== undefined
            ? parseFloat(p.nutriments.fat_100g)
            : undefined;
        const proteinGrams =
          p.nutriments?.proteins_serving !== undefined
            ? parseFloat(p.nutriments.proteins_serving)
            : p.nutriments?.proteins_100g !== undefined
            ? parseFloat(p.nutriments.proteins_100g)
            : undefined;

        addScan(name, sugarGrams, brand, imageUrl, data, servingSize, calories, carbsGrams, fatGrams, proteinGrams);

        if (!mountedRef.current) return;
        setScanResult({ name, brand, sugarGrams, sugarTeaspoons, imageUrl, servingSize, calories, carbsGrams, fatGrams, proteinGrams });
        setMode('result');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('Product not found in Open Food Facts database.');
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const isTimeout = err?.name === 'AbortError';
      setErrorMsg(
        isTimeout
          ? 'Request timed out. Check your internet connection and try again.'
          : 'Product not found. Try entering the sugar amount manually!'
      );
      setMode('manual');
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      // Release scan lock after cooldown so user can try again
      setTimeout(() => {
        isScanningRef.current = false;
      }, SCAN_COOLDOWN_MS);
    }
  }, [loading, addScan]);

  const handleManualSubmit = () => {
    const sugarVal = parseFloat(manualSugarGrams);
    if (!manualName.trim()) {
      setErrorMsg('Please enter a product name');
      return;
    }
    if (isNaN(sugarVal) || sugarVal < 0) {
      setErrorMsg('Please enter a valid sugar amount (0 or more)');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const teaspoons = parseFloat((sugarVal / 3.2).toFixed(1));
    addScan(manualName.trim(), sugarVal, 'Custom Entry');

    setScanResult({
      name: manualName.trim(),
      brand: 'Custom Entry',
      sugarGrams: sugarVal,
      sugarTeaspoons: teaspoons,
    });

    setLoading(false);
    setMode('result');
    setManualName('');
    setManualSugarGrams('');
  };

  const resetScanner = () => {
    setScanResult(null);
    setErrorMsg(null);
    isScanningRef.current = false;
    setLoading(false);
    setTorchOn(false);
    setMode('camera');
  };

  // ─── Loading state before permission resolves ───────────
  if (!permission) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontWeight: '700', fontSize: 13 }}>
          Initializing camera...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ════════════════════════════════════════════════════
          1. BARCODE CAMERA MODE
          ════════════════════════════════════════════════════ */}
      {mode === 'camera' && (
        <View style={{ flex: 1 }}>
          {permission.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torchOn}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'upc_a', 'upc_e', 'ean13', 'ean8', 'code128', 'code39'],
              }}
              onBarcodeScanned={handleBarcodeScanned}
            >
              {/* Dark overlay with scanning reticle */}
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' }}>
                {/* Scanning Reticle Box */}
                <View style={{
                  width: 280,
                  height: 280,
                  borderColor: 'rgba(255,255,255,0.2)',
                  borderWidth: 1,
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                  position: 'relative',
                }}>
                  {/* Corner: Top Left */}
                  <View style={{ borderColor: colors.primary, position: 'absolute', top: 0, left: 0, width: 32, height: 32, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 28 }} />
                  {/* Corner: Top Right */}
                  <View style={{ borderColor: colors.primary, position: 'absolute', top: 0, right: 0, width: 32, height: 32, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 28 }} />
                  {/* Corner: Bottom Left */}
                  <View style={{ borderColor: colors.primary, position: 'absolute', bottom: 0, left: 0, width: 32, height: 32, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 28 }} />
                  {/* Corner: Bottom Right */}
                  <View style={{ borderColor: colors.primary, position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 28 }} />

                  {/* Animated Scanning Laser Line */}
                  <AnimatedReanimated.View
                    style={[
                      {
                        position: 'absolute',
                        top: 2,
                        left: 8,
                        right: 8,
                        height: 3,
                        backgroundColor: colors.primary,
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.9,
                        shadowRadius: 8,
                        borderRadius: 1.5,
                      },
                      laserStyle,
                    ]}
                  />

                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '700', textAlign: 'center', position: 'absolute', bottom: -44 }}>
                    Align barcode inside the box
                  </Text>
                </View>
              </View>
            </CameraView>
          ) : (
            /* Permission Denied UI */
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, backgroundColor: '#1a1a1a' }}>
              <AlertCircle size={48} color={colors.error} />
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginTop: 16 }}>
                Camera Permission Required
              </Text>
              <Text style={{ color: '#9a9a9a', fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 }}>
                We need camera access to scan barcode nutritional values automatically.
              </Text>
              <TouchableOpacity
                onPress={requestPermission}
                style={{ backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20 }}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ─── Top Label: "Barcode Scanner" ─── */}
          <SafeAreaView
            style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: Platform.OS === 'android' ? 12 : 0 }}
            pointerEvents="none"
          >
            <View style={{ borderRadius: 99, overflow: 'hidden', marginTop: 12 }}>
              <BlurView
                intensity={60}
                tint="dark"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderWidth: 1.5,
                  borderColor: colors.primary + '40',
                  borderRadius: 99,
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  Barcode Scanner
                </Text>
              </BlurView>
            </View>
          </SafeAreaView>

          {/* ─── Bottom Controls Row: Torch + Manual Entry ─── */}
          <View
            style={{ position: 'absolute', bottom: 130, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}
            pointerEvents="box-none"
          >
            {/* Torch Toggle Button */}
            <AnimatedReanimated.View style={torchStyle}>
              <TouchableOpacity
                onPress={toggleTorch}
                style={{ borderRadius: 99, overflow: 'hidden' }}
                activeOpacity={0.85}
              >
                <BlurView
                  intensity={60}
                  tint="dark"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderWidth: 1.5,
                    borderColor: torchOn ? '#FFD700' + '80' : 'rgba(255,255,255,0.25)',
                    borderRadius: 99,
                  }}
                >
                  {torchOn
                    ? <Zap size={14} color="#FFD700" />
                    : <ZapOff size={14} color="rgba(255,255,255,0.6)" />}
                  <Text style={{ color: torchOn ? '#FFD700' : 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {torchOn ? 'Flash On' : 'Flash'}
                  </Text>
                </BlurView>
              </TouchableOpacity>
            </AnimatedReanimated.View>

            {/* Manual Entry Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setMode('manual');
              }}
              style={{ borderRadius: 99, overflow: 'hidden' }}
              activeOpacity={0.8}
            >
              <BlurView
                intensity={60}
                tint="dark"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderWidth: 1.5,
                  borderColor: colors.primary + '40',
                  borderRadius: 99,
                }}
              >
                <Keyboard size={14} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Manual Entry
                </Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ════════════════════════════════════════════════════
          2. MANUAL INPUT FALLBACK MODE
          ════════════════════════════════════════════════════ */}
      {mode === 'manual' && (
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              borderColor: colors.border,
              borderWidth: 1.5,
              backgroundColor: colors.surface,
              borderRadius: 24,
              marginHorizontal: 16,
              marginTop: 12,
              marginBottom: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.35 : 0.04,
              shadowRadius: 12,
              elevation: 4,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={resetScanner}
                style={{ backgroundColor: colors.surfaceRaised, padding: 8, borderRadius: 99 }}
              >
                <ArrowLeft size={18} color={colors.text} />
              </TouchableOpacity>
              <Mascot state="idle" size={30} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>Manual Sugar Log</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setMode('camera');
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, backgroundColor: colors.primary + '18' }}
            >
              <CameraIcon size={12} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 10 }}>Scan Mode</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Error Banner */}
            {errorMsg && (
              <View style={{ backgroundColor: colors.error + '10', borderColor: colors.error + '30', borderWidth: 1, padding: 16, borderRadius: 16, marginBottom: 16, flexDirection: 'row', gap: 12 }}>
                <AlertCircle size={18} color={colors.error} />
                <Text style={{ color: colors.error, fontSize: 12, fontWeight: '700', flex: 1 }}>{errorMsg}</Text>
              </View>
            )}

            {/* Product Name */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4 }}>
                Product Name
              </Text>
              <TextInput
                value={manualName}
                onChangeText={setManualName}
                onFocus={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFocusName(true); }}
                onBlur={() => setFocusName(false)}
                placeholder="e.g. Cola, Yogurt, Ketchup"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: focusName ? colors.primary : colors.border,
                  borderWidth: 1.5,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: focusName ? 0.12 : 0,
                  shadowRadius: 8,
                  color: colors.text,
                  padding: 16,
                  borderRadius: 16,
                  fontSize: 14,
                  fontWeight: '700',
                }}
              />
            </View>

            {/* Sugar Amount */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4 }}>
                Total Sugar in Grams (g)
              </Text>
              <TextInput
                value={manualSugarGrams}
                onChangeText={(val) => { setManualSugarGrams(val); setErrorMsg(null); }}
                onFocus={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFocusSugar(true); }}
                onBlur={() => setFocusSugar(false)}
                keyboardType="decimal-pad"
                placeholder="e.g. 12.8"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: focusSugar ? colors.primary : colors.border,
                  borderWidth: 1.5,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: focusSugar ? 0.12 : 0,
                  shadowRadius: 8,
                  color: colors.text,
                  padding: 16,
                  borderRadius: 16,
                  fontSize: 16,
                  fontWeight: '900',
                }}
              />
            </View>

            {/* Live Preview */}
            {parseFloat(manualSugarGrams) > 0 && (
              <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 24, padding: 24, marginBottom: 24, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                  Live Conversion Preview
                </Text>
                <SugarPile teaspoons={parseFloat(manualSugarGrams) / 3.2} />
              </View>
            )}

            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleManualSubmit(); }}
              style={{ backgroundColor: colors.primary, width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.9}
            >
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Convert to Teaspoons</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      )}

      {/* ════════════════════════════════════════════════════
          3. SCAN RESULT DISPLAY MODE
          ════════════════════════════════════════════════════ */}
      {mode === 'result' && scanResult && (
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              borderColor: colors.border,
              borderWidth: 1.5,
              backgroundColor: colors.surface,
              borderRadius: 24,
              marginHorizontal: 16,
              marginTop: 12,
              marginBottom: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.35 : 0.04,
              shadowRadius: 12,
              elevation: 4,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 14,
            }}
          >
            <TouchableOpacity
              onPress={resetScanner}
              style={{ backgroundColor: colors.surfaceRaised, padding: 8, borderRadius: 99 }}
            >
              <ArrowLeft size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', marginLeft: 16 }}>Sugar Scan Result</Text>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Product Card */}
            <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, padding: 24, borderRadius: 28, alignItems: 'center', marginBottom: 24 }}>
              {scanResult.imageUrl && (
                <Image
                  source={{ uri: scanResult.imageUrl }}
                  style={{ width: 112, height: 112, borderRadius: 16, marginBottom: 16 }}
                  contentFit="contain"
                  transition={200}
                />
              )}
              <Text style={{ color: colors.text, fontSize: 21, fontWeight: '900', textAlign: 'center', lineHeight: 26 }}>
                {scanResult.name}
              </Text>
              <View style={{ backgroundColor: colors.surfaceRaised, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginTop: 6 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {scanResult.brand}
                </Text>
              </View>

              {/* Reactive Mascot */}
              <View style={{ marginVertical: 16 }}>
                <Mascot
                  state={
                    scanResult.sugarTeaspoons > 6 ? 'shocked'
                      : scanResult.sugarTeaspoons > 3 ? 'dizzy'
                      : 'happy'
                  }
                  size={110}
                />
              </View>

              {/* Sugar Pile Visualizer */}
              <SugarPile teaspoons={scanResult.sugarTeaspoons} />
            </View>

            {/* Nutrition Facts */}
            <NutritionFacts
              colors={colors}
              sugarGrams={scanResult.sugarGrams}
              calories={scanResult.calories}
              carbsGrams={scanResult.carbsGrams}
              fatGrams={scanResult.fatGrams}
              proteinGrams={scanResult.proteinGrams}
              servingSize={scanResult.servingSize}
            />

            {/* WHO Reference Card */}
            <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, padding: 20, borderRadius: 24, marginBottom: 32, flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
              <View style={{ backgroundColor: colors.primary + '12', padding: 8, borderRadius: 12 }}>
                <HelpCircle size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>Sugar Reference Guide</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, lineHeight: 18 }}>
                  WHO recommends limiting free sugars to under{' '}
                  <Text style={{ fontWeight: '900', color: colors.text }}>6 teaspoons</Text> per day for adults.
                  This product contains{' '}
                  <Text style={{ fontWeight: '900', color: colors.text }}>{scanResult.sugarTeaspoons} teaspoons</Text>,
                  which is{' '}
                  <Text style={{ fontWeight: '900', color: colors.text }}>
                    {((scanResult.sugarTeaspoons / 6) * 100).toFixed(0)}%
                  </Text>{' '}
                  of that limit.
                </Text>
              </View>
            </View>

            {/* Scan Again Button */}
            <TouchableOpacity
              onPress={resetScanner}
              style={{ backgroundColor: colors.primary, width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.9}
            >
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Scan Another Item</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      )}

      {/* ─── Global Loading Overlay ─── */}
      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14, marginTop: 16 }}>
            Analyzing nutritional values...
          </Text>
        </View>
      )}
    </View>
  );
}
