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
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';

import * as ImagePicker from 'expo-image-picker';
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
import { formatSugar } from '../../utils/sugar';
import { formatWeight } from '../../utils/format';

import {
  ScanResultData,
  isAbortError,
  isRequestTimeoutError,
  lookupOpenFoodFacts,
  lookupUSDA,
  fetchWithTimeout,
  extractSugarFromNutriments,
  parseQuantityString,
  API_TIMEOUT_MS
} from '../../utils/scannerAPI';

import { OrbMascot as Mascot } from '../../components/features/OrbMascot';
import { NutritionFacts } from '../../components/features/NutritionFacts';
import {
  Keyboard,
  ArrowLeft,
  Camera as CameraIcon,
  HelpCircle,
  AlertCircle,
  Zap,
  ZapOff,
  CheckCircle,
  RotateCcw,
  X,
  Leaf,
  Bookmark,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type ScanMode = 'camera' | 'manual' | 'result' | 'not-found';

// Minimum delay before next scan can fire (prevents double-scans)
const SCAN_COOLDOWN_MS = 2_500;
const PRODUCT_BARCODE_TYPES = ['qr', 'upc_a', 'upc_e', 'ean13', 'ean8', 'code128', 'code39', 'itf14'] as const;

// ─────────────────────────────────────────────────────────
// Main Scanner Screen
// ─────────────────────────────────────────────────────────
export default function ScannerScreen() {
  const { colors, isDark } = useTheme();
  const { addScan, sugarUnit, addToCollection, collection } = useAppStore();

  // Camera permission hook from expo-camera
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();

  const [mode, setMode] = useState<ScanMode>('camera');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Analyzing...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const scannerIsVisible = isFocused && appState === 'active';
  const scannerIsLive = scannerIsVisible && mode === 'camera' && permission?.granted === true;

  // Synchronous ref-lock prevents duplicate scan callbacks from camera frames
  const isScanningRef = useRef(false);
  const loadingRef = useRef(false);
  const activeLookupControllerRef = useRef<AbortController | null>(null);
  const scanCooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scannerIsLiveRef = useRef(false);
  // Track whether the component is still mounted to prevent setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeLookupControllerRef.current?.abort();
      activeLookupControllerRef.current = null;
      if (scanCooldownTimerRef.current) {
        clearTimeout(scanCooldownTimerRef.current);
        scanCooldownTimerRef.current = null;
      }
      isScanningRef.current = false;
      loadingRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    scannerIsLiveRef.current = scannerIsLive;
  }, [scannerIsLive]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);



  const stopActiveScannerSession = useCallback((clearLoading = true) => {
    activeLookupControllerRef.current?.abort();
    activeLookupControllerRef.current = null;
    if (scanCooldownTimerRef.current) {
      clearTimeout(scanCooldownTimerRef.current);
      scanCooldownTimerRef.current = null;
    }
    isScanningRef.current = false;
    loadingRef.current = false;
    if (clearLoading && mountedRef.current) {
      setLoading(false);
      setLoadingText('Analyzing...');
    }
  }, []);

  // 10-Second Hardware Camera Timeout
  useEffect(() => {
    let timeoutTimer: ReturnType<typeof setTimeout>;
    
    if (scannerIsLive) {
      timeoutTimer = setTimeout(() => {
        // If 10 seconds have passed, we are still live, and NOT actively querying the database:
        if (scannerIsLiveRef.current && !isScanningRef.current) {
          stopActiveScannerSession();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setErrorMsg('Having trouble scanning? The barcode might be damaged or unsupported.');
          setMode('manual');
        }
      }, 10000);
    }

    return () => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [scannerIsLive, stopActiveScannerSession]);

  // Animated laser line (0 → 1 normalized, mapped in style)
  const laserY = useSharedValue(0);

  useEffect(() => {
    if (scannerIsLive) {
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
  }, [scannerIsLive]);

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserY.value * 230 }],
  }));

  // Torch button pulse
  const torchScale = useSharedValue(1);
  const torchStyle = useAnimatedStyle(() => ({ transform: [{ scale: torchScale.value }] }));

  const toggleTorch = () => {
    if (!scannerIsLive) {
      setTorchOn(false);
      return;
    }

    torchScale.value = withSequence(
      withSpring(0.85, { damping: 8 }),
      withSpring(1, { damping: 8 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTorchOn((prev) => !prev);
  };

  // Capture button animation
  const captureScale = useSharedValue(1);
  const captureStyle = useAnimatedStyle(() => ({ transform: [{ scale: captureScale.value }] }));

  // Manual Input State
  const [manualName, setManualName] = useState('');
  const [focusName, setFocusName] = useState(false);

  const [manualImageUri, setManualImageUri] = useState<string | null>(null);
  const [calculationMode, setCalculationMode] = useState<'total' | 'per100'>('total');
  
  const [manualSugarGrams, setManualSugarGrams] = useState('');
  const [focusSugar, setFocusSugar] = useState(false);
  
  const [manualSugarPer100, setManualSugarPer100] = useState('');
  const [manualProductSize, setManualProductSize] = useState('');
  const [focusPer100, setFocusPer100] = useState(false);
  const [focusSize, setFocusSize] = useState(false);

  const lastSavedRef = useRef<{name: string, sugarVal: number} | null>(null);
  const [saveStatus, setSaveStatus] = useState<'typing' | 'saving' | 'saved'>('typing');

  // Scan Result State
  const [scanResult, setScanResult] = useState<{
    name: string;
    brand: string;
    
    // Serving-based
    sugarGrams?: number;
    sugarTeaspoons?: number;
    servingSize?: string;
    calories?: number;
    carbsGrams?: number;
    fatGrams?: number;
    proteinGrams?: number;

    // Total/Package-based
    totalSugarGrams?: number;
    totalSugarTeaspoons?: number;
    packageSize?: string;
    totalCalories?: number;
    totalCarbsGrams?: number;
    totalFatGrams?: number;
    totalProteinGrams?: number;

    imageUrl?: string;
    sugarPer100g?: number;     // Used for accurate normalized comparisons
    categoryTag?: string;      // e.g. 'en:breakfast-cereals'
  } | null>(null);

  // Auto-switch to manual if camera permission is denied
  useEffect(() => {
    if (permission && !permission.granted && mode === 'camera') {
      setMode('manual');
    }
  }, [mode, permission]);

  // Stop camera-owned side effects whenever the scanner is not the active screen.
  useEffect(() => {
    if (!scannerIsLive) {
      setTorchOn(false);
      if (mode === 'camera') {
        stopActiveScannerSession();
      }
    }
  }, [mode, scannerIsLive, stopActiveScannerSession]);

  // Turn torch and any in-flight camera lookup off when leaving camera mode.
  useEffect(() => {
    if (mode !== 'camera') {
      setTorchOn(false);
      stopActiveScannerSession();
    }
  }, [mode, stopActiveScannerSession]);

  // Unlock scanner lock when mode changes to camera
  useEffect(() => {
    if (mode === 'camera' && scannerIsVisible) {
      isScanningRef.current = false;
      loadingRef.current = false;
      setLoading(false);
      setLoadingText('Analyzing...');
      setErrorMsg(null);
    }
  }, [mode, scannerIsVisible]);

  // Auto-Save Manual Entry
  useEffect(() => {
    if (mode !== 'manual') return;

    let sugarVal = 0;
    if (calculationMode === 'total') {
      sugarVal = parseFloat(manualSugarGrams);
    } else {
      const per100 = parseFloat(manualSugarPer100);
      const size = parseFloat(manualProductSize);
      if (!isNaN(per100) && !isNaN(size) && per100 >= 0 && size > 0) {
        sugarVal = parseFloat(((per100 * size) / 100).toFixed(1));
      }
    }

    if (sugarVal > 0 && manualName.trim().length > 0) {
      if (lastSavedRef.current?.name === manualName.trim() && lastSavedRef.current?.sugarVal === sugarVal) {
        setSaveStatus('saved');
        return;
      }

      setSaveStatus('saving');
      const timer = setTimeout(() => {
        if (calculationMode === 'total') {
          addScan(
            manualName.trim(),
            sugarVal,
            'Custom Entry',
            manualImageUri || undefined,
            undefined,
            '1 serving'
          );
        } else {
          addScan(
            manualName.trim(),
            parseFloat(manualSugarPer100),
            'Custom Entry',
            manualImageUri || undefined,
            undefined,
            '100 g',
            undefined,
            undefined,
            undefined,
            undefined,
            parseFloat(manualSugarPer100),
            undefined,
            sugarVal,
            `${manualProductSize} g`
          );
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        lastSavedRef.current = { name: manualName.trim(), sugarVal };
        setSaveStatus('saved');
      }, 1500);

      return () => {
        clearTimeout(timer);
        setSaveStatus('typing');
      };
    } else {
      setSaveStatus('typing');
    }
  }, [
    mode, 
    manualName, 
    manualSugarGrams, 
    manualSugarPer100, 
    manualProductSize, 
    calculationMode, 
    manualImageUri, 
    addScan
  ]);

  // ─── Core barcode scan handler (Waterfall Lookup) ───────────────────────────
  const handleBarcodeScanned = useCallback(async ({ data }: BarcodeScanningResult) => {
    if (!scannerIsLiveRef.current || isScanningRef.current || loadingRef.current) return;
    const barcode = data?.trim();
    if (!barcode) return;

    isScanningRef.current = true;
    const lookupController = new AbortController();
    activeLookupControllerRef.current?.abort();
    activeLookupControllerRef.current = lookupController;
    const isCurrentLookup = () =>
      mountedRef.current &&
      activeLookupControllerRef.current === lookupController &&
      !lookupController.signal.aborted;

    if (!isCurrentLookup()) return;
    loadingRef.current = true;
    setLoading(true);
    setLoadingText('Checking product databases...');
    setErrorMsg(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let productFound = false;
    let localErrorMsg = null;

    try {
      // --- PHASE 1: OpenFoodFacts ---
      let result = await lookupOpenFoodFacts(barcode, lookupController.signal);
      
      if (!isCurrentLookup()) return;

      // --- PHASE 2: USDA FoodData Central ---
      if (!result && process.env.EXPO_PUBLIC_USDA_API_KEY) {
        result = await lookupUSDA(barcode, process.env.EXPO_PUBLIC_USDA_API_KEY, lookupController.signal);
        if (!isCurrentLookup()) return;
      }

      if (result) {
        addScan(
          result.name,
          result.sugarGrams ?? 0,
          result.brand,
          result.imageUrl,
          data,
          result.servingSize,
          result.calories,
          result.carbsGrams,
          result.fatGrams,
          result.proteinGrams,
          result.sugarPer100g,
          result.categoryTag,
          result.totalSugarGrams,
          result.packageSize,
          result.totalCalories,
          result.totalCarbsGrams,
          result.totalFatGrams,
          result.totalProteinGrams
        );

        if (isCurrentLookup()) {
          setScanResult(result);
          productFound = true;
        }
      }
    } catch (err: any) {
      if (!isCurrentLookup() || isAbortError(err)) return;
      console.warn('Scanner API Error:', err);
      if (isRequestTimeoutError(err)) {
        localErrorMsg = 'Connection timed out. Please check your internet.';
      } else {
        localErrorMsg = 'Network error. Please try again later.';
      }
    } finally {
      if (!isCurrentLookup()) return;
      
      activeLookupControllerRef.current = null;
      loadingRef.current = false;
      setLoading(false);
      setLoadingText('Analyzing...');
      
      if (productFound) {
        setMode('result');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setErrorMsg(localErrorMsg || 'Product not found. Entering manual mode.');
        setMode('manual');
      }

      // Release scan lock after cooldown so user can try again
      if (scanCooldownTimerRef.current) {
        clearTimeout(scanCooldownTimerRef.current);
      }
      scanCooldownTimerRef.current = setTimeout(() => {
        isScanningRef.current = false;
        scanCooldownTimerRef.current = null;
      }, SCAN_COOLDOWN_MS);
    }
  }, [addScan]);

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setManualImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Image picker error', err);
    }
  };



  const resetScanner = () => {
    stopActiveScannerSession();
    setScanResult(null);
    setErrorMsg(null);
    isScanningRef.current = false;
    setLoading(false);
    setLoadingText('Analyzing...');
    setTorchOn(false);
    setManualName('');
    setManualSugarGrams('');
    setManualSugarPer100('');
    setManualProductSize('');
    setManualImageUri(null);
    setCalculationMode('total');
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
            scannerIsLive ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                active={scannerIsLive}
                facing="back"
                autofocus="on"
                enableTorch={scannerIsLive && torchOn}
                barcodeScannerSettings={{
                  barcodeTypes: [...PRODUCT_BARCODE_TYPES],
                }}
                onBarcodeScanned={!loading ? handleBarcodeScanned : undefined}
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
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
            )
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

          {/* ─── Top Segmented Control (Unified Switcher) ─── */}
          <SafeAreaView
            style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: Platform.OS === 'android' ? 12 : 0 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.replace('/');
                }}
                style={{ borderRadius: 99, overflow: 'hidden' }}
                activeOpacity={0.85}
              >
                <BlurView intensity={60} tint="dark" style={{ padding: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 99 }}>
                  <ArrowLeft size={20} color="#fff" />
                </BlurView>
              </TouchableOpacity>



              {/* Torch toggle */}
              <AnimatedReanimated.View style={torchStyle}>
                <TouchableOpacity onPress={toggleTorch} style={{ borderRadius: 99, overflow: 'hidden' }} activeOpacity={0.85}>
                  <BlurView intensity={60} tint="dark" style={{ padding: 10, borderWidth: 1.5, borderColor: torchOn ? '#FFD700' + '80' : 'rgba(255,255,255,0.25)', borderRadius: 99 }}>
                    {torchOn ? <Zap size={20} color="#FFD700" /> : <ZapOff size={20} color="rgba(255,255,255,0.7)" />}
                  </BlurView>
                </TouchableOpacity>
              </AnimatedReanimated.View>
            </View>
          </SafeAreaView>

          {/* ─── Bottom Controls Row: Manual Entry ─── */}
          <View
            style={{ position: 'absolute', bottom: 130, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
            pointerEvents="box-none"
          >
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

          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >


            {/* Error/Success Banner */}
            {errorMsg && (
              <View style={{
                backgroundColor: errorMsg.includes('Found') ? colors.success + '10' : colors.error + '10',
                borderColor: errorMsg.includes('Found') ? colors.success + '30' : colors.error + '30',
                borderWidth: 1,
                padding: 16,
                borderRadius: 16,
                marginBottom: 16,
                flexDirection: 'row',
                gap: 12,
              }}>
                {errorMsg.includes('Found')
                  ? <CheckCircle size={18} color={colors.success} />
                  : <AlertCircle size={18} color={colors.error} />
                }
                <Text style={{
                  color: errorMsg.includes('Found') ? colors.success : colors.error,
                  fontSize: 12,
                  fontWeight: '700',
                  flex: 1,
                }}>{errorMsg}</Text>
              </View>
            )}

            {/* Image Picker Container */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4 }}>
                Product Image (Optional)
              </Text>
              <TouchableOpacity
                onPress={handlePickImage}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: manualImageUri ? colors.border : colors.primary + '40',
                  borderWidth: 1.5,
                  borderRadius: 20,
                  height: 120,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderStyle: manualImageUri ? 'solid' : 'dashed',
                  overflow: 'hidden'
                }}
                activeOpacity={0.8}
              >
                {manualImageUri ? (
                  <View style={{ width: '100%', height: '100%' }}>
                    <Image source={{ uri: manualImageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 12 }}>
                      <RotateCcw size={14} color="#fff" />
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <View style={{ backgroundColor: colors.primary + '15', padding: 12, borderRadius: 99 }}>
                      <CameraIcon size={24} color={colors.primary} />
                    </View>
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>Tap to take photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

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

            {/* Calculation Mode Switcher */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceRaised, padding: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                <TouchableOpacity
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCalculationMode('total'); setErrorMsg(null); }}
                  style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: calculationMode === 'total' ? colors.primary : 'transparent' }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: calculationMode === 'total' ? '#fff' : colors.textSecondary, fontSize: 12, fontWeight: '800' }}>Enter Total</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCalculationMode('per100'); setErrorMsg(null); }}
                  style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: calculationMode === 'per100' ? colors.primary : 'transparent' }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: calculationMode === 'per100' ? '#fff' : colors.textSecondary, fontSize: 12, fontWeight: '800' }}>Calculate (Per 100g/ml)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {calculationMode === 'total' ? (
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
            ) : (
              <View style={{ marginBottom: 24, flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4 }}>
                    Sugar per 100g/ml
                  </Text>
                  <TextInput
                    value={manualSugarPer100}
                    onChangeText={(val) => { setManualSugarPer100(val); setErrorMsg(null); }}
                    onFocus={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFocusPer100(true); }}
                    onBlur={() => setFocusPer100(false)}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 10.5"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: focusPer100 ? colors.primary : colors.border,
                      borderWidth: 1.5,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: focusPer100 ? 0.12 : 0,
                      shadowRadius: 8,
                      color: colors.text,
                      padding: 16,
                      borderRadius: 16,
                      fontSize: 16,
                      fontWeight: '900',
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4 }}>
                    Total Size (g/ml)
                  </Text>
                  <TextInput
                    value={manualProductSize}
                    onChangeText={(val) => { setManualProductSize(val); setErrorMsg(null); }}
                    onFocus={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFocusSize(true); }}
                    onBlur={() => setFocusSize(false)}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 250"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: focusSize ? colors.primary : colors.border,
                      borderWidth: 1.5,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: focusSize ? 0.12 : 0,
                      shadowRadius: 8,
                      color: colors.text,
                      padding: 16,
                      borderRadius: 16,
                      fontSize: 16,
                      fontWeight: '900',
                    }}
                  />
                </View>
              </View>
            )}

            {/* Live Preview */}
            {(() => {
              let liveSugarVal = 0;
              if (calculationMode === 'total') {
                liveSugarVal = parseFloat(manualSugarGrams);
              } else {
                const per100 = parseFloat(manualSugarPer100);
                const size = parseFloat(manualProductSize);
                if (!isNaN(per100) && !isNaN(size) && per100 >= 0 && size > 0) {
                  liveSugarVal = parseFloat(((per100 * size) / 100).toFixed(1));
                }
              }
              
              if (liveSugarVal > 0) {
                return (
                  <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 24, padding: 24, marginBottom: 24, alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                      Live Conversion Preview
                    </Text>
                    {calculationMode === 'per100' && (
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', marginBottom: 4 }}>
                        Calculated Total: {liveSugarVal}g
                      </Text>
                    )}
                    <Text style={{ color: colors.primary, fontSize: 36, fontWeight: '900', marginTop: 8 }}>
                      {(liveSugarVal / 4.2).toFixed(1)} <Text style={{ fontSize: 16, color: colors.textSecondary }}>Teaspoons</Text>
                    </Text>
                  </View>
                );
              }
              return null;
            })()}

            {manualName.trim().length > 0 && (() => {
              let liveSugarVal = 0;
              if (calculationMode === 'total') {
                liveSugarVal = parseFloat(manualSugarGrams);
              } else {
                const per100 = parseFloat(manualSugarPer100);
                const size = parseFloat(manualProductSize);
                if (!isNaN(per100) && !isNaN(size) && per100 >= 0 && size > 0) {
                  liveSugarVal = parseFloat(((per100 * size) / 100).toFixed(1));
                }
              }
              if (liveSugarVal > 0) {
                return (
                  <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                    {saveStatus === 'saving' && (
                      <>
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 8 }}>
                          Auto-saving...
                        </Text>
                      </>
                    )}
                    {saveStatus === 'saved' && (
                      <Text style={{ color: '#4CAF50', fontSize: 14, fontWeight: '800', marginTop: 8 }}>
                        ✓ Saved to History!
                      </Text>
                    )}
                  </View>
                );
              }
              return null;
            })()}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}

      {/* ════════════════════════════════════════════════════
          4. NOT FOUND FALLBACK MODE
          ════════════════════════════════════════════════════ */}
      {mode === 'not-found' && (
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Mascot state="dizzy" size={140} />
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 24, textAlign: 'center' }}>
              Product Not Found!
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 22, paddingHorizontal: 16 }}>
              We couldn't find this barcode in our database. Enter the sugar value manually.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode('manual'); }}
            style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, width: '100%', paddingVertical: 18, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}
            activeOpacity={0.8}
          >
            <Keyboard color={colors.text} size={20} />
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>Enter Manually</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={resetScanner}
            style={{ marginTop: 32, paddingVertical: 12 }}
          >
            <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 14 }}>Back to Barcode Scanner</Text>
          </TouchableOpacity>
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
            {/* 1. Hero Section: Product Card & Sugar Impact */}
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

              {/* Reactive Mascot based on full package sugar */}
              {(() => {
                const currentTsp = scanResult.totalSugarTeaspoons !== undefined ? scanResult.totalSugarTeaspoons : (scanResult.sugarTeaspoons ?? 0);
                return (
                  <View style={{ marginTop: 24, marginBottom: 16 }}>
                    <Mascot
                      state={
                        currentTsp > 6 ? 'shocked'
                          : currentTsp > 3 ? 'dizzy'
                            : 'happy'
                      }
                      size={120}
                    />
                  </View>
                );
              })()}

              {/* Massive Impact Typography for Total Package Sugar */}
              {(() => {
                const isUnknown = scanResult.totalSugarTeaspoons === undefined;
                const currentTsp = isUnknown ? '--' : scanResult.totalSugarTeaspoons;
                const currentColor = isUnknown ? colors.textMuted : (scanResult.totalSugarTeaspoons! > 6 ? colors.error : scanResult.totalSugarTeaspoons! > 3 ? colors.warning : colors.success);
                
                return (
                  <View style={{ alignItems: 'center', marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                      <Text style={{
                        color: currentColor,
                        fontSize: 72,
                        fontWeight: '900',
                        letterSpacing: -2,
                        lineHeight: 72
                      }}>
                        {currentTsp}
                      </Text>
                      {!isUnknown && (
                        <Text style={{
                          color: currentColor,
                          fontSize: 24,
                          fontWeight: '800',
                          marginLeft: 6
                        }}>
                          tsp
                        </Text>
                      )}
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Total Sugars in Full Package
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                      {scanResult.packageSize ? `(${formatWeight(scanResult.packageSize, sugarUnit)})` : '(Package Size Unknown)'}
                    </Text>
                  </View>
                );
              })()}

              {/* Side-by-side summary cards */}
              <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 28 }}>
                {/* Per Serving Card */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.surfaceRaised,
                    padding: 16,
                    borderRadius: 20,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.border
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>Per Serving</Text>
                  {scanResult.servingSize && scanResult.sugarTeaspoons !== undefined ? (
                    <>
                      <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800', marginTop: 2 }}>{formatWeight(scanResult.servingSize, sugarUnit) || scanResult.servingSize}</Text>
                      <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', marginTop: 10 }}>
                        {scanResult.sugarTeaspoons} <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>tsp</Text>
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>({formatSugar(scanResult.sugarGrams ?? 0, sugarUnit)} sugar)</Text>
                    </>
                  ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 12 }}>
                      <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>No Serving Size found</Text>
                    </View>
                  )}
                </View>

                {/* Per 100g Card */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.surfaceRaised,
                    padding: 16,
                    borderRadius: 20,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.border
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>Per 100g / 100ml</Text>
                  <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800', marginTop: 2 }}>Standard</Text>
                  
                  {scanResult.sugarPer100g !== undefined && scanResult.sugarPer100g > 0 ? (
                    <>
                      <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', marginTop: 10 }}>
                        {parseFloat((scanResult.sugarPer100g / 4.2).toFixed(1))} <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>tsp</Text>
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>({formatSugar(scanResult.sugarPer100g ?? 0, sugarUnit)} sugar)</Text>
                    </>
                  ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 12 }}>
                      <Text style={{ color: colors.textMuted, fontSize: 26, fontWeight: '900', textAlign: 'center' }}>--</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* 3. Nutrition Facts - Shows 100g fallback or serving size if available */}
            <NutritionFacts
              colors={colors}
              productName={scanResult.name}
              sugarGrams={scanResult.sugarGrams ?? scanResult.sugarPer100g ?? 0}
              calories={scanResult.calories}
              servingSize={formatWeight(scanResult.servingSize, sugarUnit) || '100 g'}
            />

            {/* WHO Reference Card */}
            <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, padding: 20, borderRadius: 24, marginBottom: 32, gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ backgroundColor: colors.primary + '12', padding: 8, borderRadius: 12 }}>
                  <HelpCircle size={18} color={colors.primary} />
                </View>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>WHO Guidelines</Text>
              </View>

              {(() => {
                const currentTsp = scanResult.sugarTeaspoons;
                if (currentTsp === undefined) {
                   return (
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
                      Serving size is unknown, so we can't calculate your total daily limit usage for this serving.
                    </Text>
                   )
                }
                return (
                  <>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
                      This serving contains <Text style={{ fontWeight: '900', color: colors.text }}>{currentTsp} tsp</Text> of sugar. Here is how it compares to the World Health Organization's daily limits for adults:
                    </Text>

                    <View style={{ gap: 12 }}>
                      <View style={{ backgroundColor: colors.background, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, marginBottom: 4 }}>Conditional Recommendation</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8, lineHeight: 18 }}>Limit to 6 tsp ({formatSugar(25, sugarUnit)}) for additional health benefits.</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Daily Limit Used</Text>
                          <Text style={{ color: currentTsp > 6 ? colors.error : colors.text, fontWeight: '900', fontSize: 16 }}>{((currentTsp / 6) * 100).toFixed(0)}%</Text>
                        </View>
                      </View>

                      <View style={{ backgroundColor: colors.background, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, marginBottom: 4 }}>Strong Recommendation</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8, lineHeight: 18 }}>Limit to 12 tsp ({formatSugar(50, sugarUnit)}) to reduce health risks.</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Daily Limit Used</Text>
                          <Text style={{ color: currentTsp > 12 ? colors.error : colors.text, fontWeight: '900', fontSize: 16 }}>{((currentTsp / 12) * 100).toFixed(0)}%</Text>
                        </View>
                      </View>
                    </View>
                  </>
                );
              })()}
            </View>

            {/* Save to CleanBite Collection Button */}
            {(() => {
              const isAlreadySaved = collection.some(
                (item) => item.name === scanResult.name && item.brand === scanResult.brand
              );
              return (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (!isAlreadySaved) {
                      addToCollection({
                        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: scanResult.name,
                        brand: scanResult.brand,
                        sugarGrams: scanResult.sugarGrams ?? scanResult.sugarPer100g ?? 0,
                        sugarTeaspoons: scanResult.sugarTeaspoons ?? 0,
                        timestamp: Date.now(),
                        imageUrl: scanResult.imageUrl,
                        calories: scanResult.calories,
                        servingSize: scanResult.servingSize,
                        sugarPer100g: scanResult.sugarPer100g,
                        categoryTag: scanResult.categoryTag,
                      });
                    }
                  }}
                  disabled={isAlreadySaved}
                  style={{
                    backgroundColor: isAlreadySaved ? `${colors.primary}20` : isDark ? colors.surfaceRaised : colors.surface,
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                    width: '100%',
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    marginBottom: 12,
                  }}
                  activeOpacity={0.8}
                >
                  <Bookmark size={18} color={colors.primary} fill={isAlreadySaved ? colors.primary : 'transparent'} />
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 14 }}>
                    {isAlreadySaved ? 'Saved in CleanBite Collection' : 'Save to CleanBite Collection'}
                  </Text>
                </TouchableOpacity>
              );
            })()}

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
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14, marginTop: 16, textAlign: 'center', paddingHorizontal: 24 }}>
            {loadingText}
          </Text>
        </View>
      )}
    </View>
  );
}
