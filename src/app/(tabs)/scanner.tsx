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
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  lookupAlternatives,
  fetchWithTimeout,
  extractSugarFromNutriments,
  parseQuantityString,
  API_TIMEOUT_MS
} from '../../utils/scannerAPI';

import { OrbMascot as Mascot } from '../../components/features/OrbMascot';
import { NutritionFacts } from '../../components/features/NutritionFacts';
import ProductHeroCardDashboard from '../../components/features/ProductHeroCardDashboard';
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
  Search,
  Share2,
  Plus,
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
  // cameraReady: set to true only after the CameraView fires onCameraReady
  const [cameraReady, setCameraReady] = useState(false);
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

  // Reset cameraReady when scanner goes offline (tab switch / mode switch)
  useEffect(() => {
    if (!scannerIsLive) {
      setCameraReady(false);
    }
  }, [scannerIsLive]);

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

  const lastSavedRef = useRef<{ name: string, sugarVal: number } | null>(null);
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



    imageUrl?: string;
    sugarPer100g?: number;     // Used for accurate normalized comparisons
    categoryTag?: string;      // e.g. 'en:breakfast-cereals'
    whoLimitServingPercent?: number;
    whoLimitIdealServingPercent?: number;
    isDefaultServing?: boolean;
  } | null>(null);

  // Alternatives State
  const [alternatives, setAlternatives] = useState<ScanResultData[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

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

  // Unconditionally reset scan lock whenever the scanner tab gains focus.
  // This is the most important unlock: if the user navigated away and returned,
  // isScanningRef must be false so the next barcode registers immediately.
  useEffect(() => {
    if (scannerIsVisible && mode === 'camera') {
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
            sugarVal,
            'Custom Entry',
            manualImageUri || undefined,
            undefined,
            `${manualProductSize} g`,
            undefined,
            undefined,
            undefined,
            undefined,
            parseFloat(manualSugarPer100),
            'Custom Entry'
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
          result.categoryTag
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
    setAlternatives([]);
    setLoadingAlternatives(false);
    setShowAlternatives(false);
    setMode('camera');
  };

  const handleFindAlternatives = async () => {
    if (!scanResult) return;
    const category = scanResult.categoryTag;
    if (!category) {
      Alert.alert(
        'Alternatives Search',
        'We couldn\'t find a specific category for this product in the database to search for alternatives.',
        [{ text: 'OK' }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingAlternatives(true);

    try {
      const currentSugar = scanResult.sugarPer100g ?? (scanResult.sugarGrams ?? 0);
      const controller = new AbortController();
      const list = await lookupAlternatives(category, currentSugar, controller.signal);
      setAlternatives(list);
      setShowAlternatives(true);

      if (list.length === 0) {
        Alert.alert(
          'Top Choice!',
          'Great news! This product is already one of the lowest-sugar choices in its category.',
          [{ text: 'Awesome' }]
        );
      }
    } catch (err) {
      console.warn('Error seeking alternatives:', err);
      Alert.alert('Search Failed', 'Could not search for alternatives. Please check your network connection.');
    } finally {
      setLoadingAlternatives(false);
    }
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
                active={true}
                facing="back"
                autofocus="on"
                enableTorch={torchOn}
                barcodeScannerSettings={{
                  barcodeTypes: [...PRODUCT_BARCODE_TYPES],
                }}
                onCameraReady={() => {
                  setCameraReady(true);
                  // Forcefully unlock scan ref after camera is confirmed ready
                  isScanningRef.current = false;
                  loadingRef.current = false;
                }}
                onBarcodeScanned={handleBarcodeScanned}
              >
                {/* Dark overlay with scanning reticle */}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' }}>
                  {/* Scanning Reticle Box — landscape-wide for EAN-13 grocery barcodes */}
                  <View style={{
                    width: 340,
                    height: 190,
                    borderColor: cameraReady ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    position: 'relative',
                  }}>
                    {/* Corner: Top Left */}
                    <View style={{ borderColor: cameraReady ? colors.primary : 'rgba(255,255,255,0.3)', position: 'absolute', top: 0, left: 0, width: 32, height: 32, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 20 }} />
                    {/* Corner: Top Right */}
                    <View style={{ borderColor: cameraReady ? colors.primary : 'rgba(255,255,255,0.3)', position: 'absolute', top: 0, right: 0, width: 32, height: 32, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 20 }} />
                    {/* Corner: Bottom Left */}
                    <View style={{ borderColor: cameraReady ? colors.primary : 'rgba(255,255,255,0.3)', position: 'absolute', bottom: 0, left: 0, width: 32, height: 32, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 20 }} />
                    {/* Corner: Bottom Right */}
                    <View style={{ borderColor: cameraReady ? colors.primary : 'rgba(255,255,255,0.3)', position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 20 }} />

                    {/* Animated Scanning Laser Line — only show after camera is ready */}
                    {cameraReady && (
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
                    )}

                    {/* Camera initializing indicator */}
                    {!cameraReady && (
                      <View style={{ alignItems: 'center', gap: 8 }}>
                        <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' }}>Initializing camera...</Text>
                      </View>
                    )}

                    <Text style={{ color: cameraReady ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', textAlign: 'center', position: 'absolute', bottom: -44 }}>
                      {cameraReady ? 'Hold barcode steady inside the box' : 'Please wait...'}
                    </Text>
                  </View>
                </View>
              </CameraView>
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
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



              {/* Left back button only */}
            </View>
          </SafeAreaView>

          {/* ─── Bottom Controls Row: Manual Entry & Torch ─── */}
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

          {/* Torch toggle bottom right - Extra large for 1-hand thumb reach */}
          <AnimatedReanimated.View
            style={[
              torchStyle,
              {
                position: 'absolute',
                bottom: 115,
                right: 20,
                width: 64,
                height: 64,
                borderRadius: 32,
                overflow: 'hidden',
                shadowColor: torchOn ? '#FFD700' : '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 6,
              }
            ]}
          >
            <TouchableOpacity
              onPress={toggleTorch}
              style={{ width: '100%', height: '100%' }}
              activeOpacity={0.85}
            >
              <BlurView
                intensity={70}
                tint="dark"
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: torchOn ? '#FFD700' : 'rgba(255,255,255,0.3)',
                  borderRadius: 32,
                }}
              >
                {torchOn ? <Zap size={28} color="#FFD700" /> : <ZapOff size={28} color="rgba(255,255,255,0.8)" />}
              </BlurView>
            </TouchableOpacity>
          </AnimatedReanimated.View>
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
                    <Text style={{ color: calculationMode === 'total' ? '#fff' : colors.textSecondary, fontSize: 12, fontWeight: '800' }}>Enter per Serving</Text>
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
                    Sugar per Serving (g)
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
                      Serving Size (g/ml)
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
            {/* 1. Unified Hero Section: Screenshot-Ready Report Card */}
            <View style={{ marginBottom: 24 }}>
              <ProductHeroCardDashboard
                scanResult={scanResult}
                colors={colors}
                isDark={isDark}
              />
            </View>

            {/* Action Buttons Row */}
            <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginBottom: 16 }}>
              {/* Save to Collections Button */}
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
                      flex: 1,
                      backgroundColor: isAlreadySaved ? `${colors.primary}15` : isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                      paddingVertical: 14,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 8,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                    activeOpacity={0.8}
                  >
                    <Bookmark size={16} color={colors.primary} fill={isAlreadySaved ? colors.primary : 'transparent'} />
                    <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>
                      {isAlreadySaved ? 'Saved' : 'Save to Pantry'}
                    </Text>
                  </TouchableOpacity>
                );
              })()}

              {/* Find Healthy Alternatives Button */}
              <TouchableOpacity
                onPress={handleFindAlternatives}
                disabled={loadingAlternatives}
                style={{
                  flex: 1.2,
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 3,
                }}
                activeOpacity={0.9}
              >
                {loadingAlternatives ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Search size={16} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>
                      Alternatives
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* 1-Alternative Healthy Swap Modal */}
            {showAlternatives && alternatives.length > 0 && (() => {
              const alt = alternatives[0];
              const originalTsp = scanResult.sugarTeaspoons ?? 0;
              const altTsp = alt.sugarTeaspoons ?? 0;
              const savings = Math.max(0, originalTsp - altTsp);
              const isAltSaved = collection.some(
                (item) => item.name === alt.name && item.brand === alt.brand
              );

              return (
                <Modal
                  visible={showAlternatives}
                  animationType="slide"
                  transparent={true}
                  onRequestClose={() => setShowAlternatives(false)}
                >
                  <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'flex-end',
                  }}>
                    {/* Blur Backdrop */}
                    <BlurView
                      intensity={60}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      }}
                      tint={isDark ? 'dark' : 'light'}
                    />

                    {/* Modal Content Card */}
                    <View style={{
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderTopLeftRadius: 32,
                      borderTopRightRadius: 32,
                      padding: 24,
                      paddingBottom: Platform.OS === 'ios' ? 44 : 24,
                      maxHeight: '90%',
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: -10 },
                      shadowOpacity: 0.15,
                      shadowRadius: 20,
                      elevation: 10,
                    }}>
                      {/* Close Header */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>
                          💡 Healthy Swap
                        </Text>
                        <TouchableOpacity
                          onPress={() => setShowAlternatives(false)}
                          style={{
                            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                            padding: 8,
                            borderRadius: 99,
                          }}
                        >
                          <X size={18} color={colors.text} />
                        </TouchableOpacity>
                      </View>

                      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
                        {/* Comparison Row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                          {/* Original Scanned Card */}
                          <View style={{
                            flex: 1,
                            backgroundColor: isDark ? 'rgba(255,59,48,0.05)' : '#FFF5F5',
                            borderWidth: 1.5,
                            borderColor: '#FF3B30',
                            borderRadius: 20,
                            padding: 12,
                            alignItems: 'center',
                            gap: 8,
                            minHeight: 180,
                          }}>
                            <Text style={{ color: '#FF3B30', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>
                              Current Item
                            </Text>
                            <View style={{
                              width: 60,
                              height: 60,
                              borderRadius: 12,
                              backgroundColor: '#FFFFFF',
                              padding: 4,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              {scanResult.imageUrl ? (
                                <Image source={{ uri: scanResult.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 8 }} contentFit="contain" />
                              ) : (
                                <Mascot state="shocked" size={40} />
                              )}
                            </View>
                            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800', textAlign: 'center' }} numberOfLines={2}>
                              {scanResult.name}
                            </Text>
                            <Text style={{ color: '#FF3B30', fontSize: 16, fontWeight: '900', marginTop: 'auto' }}>
                              {originalTsp.toFixed(1).replace(/\.0$/, '')} tsp
                            </Text>
                          </View>

                          {/* Vs Indicator */}
                          <View style={{
                            backgroundColor: colors.border,
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1.5,
                            borderColor: colors.textMuted,
                          }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900' }}>VS</Text>
                          </View>

                          {/* Healthiest Alternative Card */}
                          <View style={{
                            flex: 1,
                            backgroundColor: isDark ? 'rgba(52,199,89,0.05)' : '#F2FBF4',
                            borderWidth: 1.5,
                            borderColor: '#34C759',
                            borderRadius: 20,
                            padding: 12,
                            alignItems: 'center',
                            gap: 8,
                            minHeight: 180,
                          }}>
                            <Text style={{ color: '#34C759', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>
                              Better Swap
                            </Text>
                            <View style={{
                              width: 60,
                              height: 60,
                              borderRadius: 12,
                              backgroundColor: '#FFFFFF',
                              padding: 4,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              {alt.imageUrl ? (
                                <Image source={{ uri: alt.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 8 }} contentFit="contain" />
                              ) : (
                                <Leaf size={30} color="#34C759" />
                              )}
                            </View>
                            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800', textAlign: 'center' }} numberOfLines={2}>
                              {alt.name}
                            </Text>
                            <Text style={{ color: '#34C759', fontSize: 16, fontWeight: '900', marginTop: 'auto' }}>
                              {altTsp.toFixed(1).replace(/\.0$/, '')} tsp
                            </Text>
                          </View>
                        </View>

                        {/* Teaspoon Savings Banner */}
                        {savings > 0 && (
                          <LinearGradient
                            colors={['#34C759', '#00C7BE']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              borderRadius: 16,
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: '#34C759',
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.2,
                              shadowRadius: 8,
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900', textAlign: 'center' }}>
                              📉 Save {savings.toFixed(1).replace(/\.0$/, '')} Teaspoons of Sugar!
                            </Text>
                          </LinearGradient>
                        )}

                        {/* Health Benefit Explanation */}
                        <View style={{
                          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          padding: 16,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: colors.border,
                          gap: 8,
                        }}>
                          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>
                            Why Swapping Benefits You
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                            Choosing {alt.name} cuts down your added sugar intake by {savings.toFixed(1).replace(/\.0$/, '')} teaspoons.
                            This reduces the workload on your pancreas, prevents immediate blood insulin spikes, and eliminates the fatigue crash often experienced 30–60 minutes after consuming processed sugars.
                          </Text>
                        </View>

                        {/* Action Buttons */}
                        <View style={{ gap: 12, marginTop: 10 }}>
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              if (!isAltSaved) {
                                addToCollection({
                                  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                  name: alt.name,
                                  brand: alt.brand,
                                  sugarGrams: alt.sugarGrams ?? alt.sugarPer100g ?? 0,
                                  sugarTeaspoons: alt.sugarTeaspoons ?? 0,
                                  timestamp: Date.now(),
                                  imageUrl: alt.imageUrl,
                                  calories: alt.calories,
                                  servingSize: alt.servingSize,
                                  sugarPer100g: alt.sugarPer100g,
                                  categoryTag: alt.categoryTag,
                                });
                              }
                              setShowAlternatives(false);
                            }}
                            style={{
                              backgroundColor: '#34C759',
                              paddingVertical: 16,
                              borderRadius: 16,
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: '#34C759',
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.2,
                              shadowRadius: 8,
                              elevation: 3,
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>
                              {isAltSaved ? 'Already Saved in Pantry' : 'Save Alternative to Pantry'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => setShowAlternatives(false)}
                            style={{
                              paddingVertical: 12,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 13 }}>
                              Keep Scanned Product
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                </Modal>
              );
            })()}

            {/* Collapsible/Clean Nutrition Facts */}
            <NutritionFacts
              colors={colors}
              productName={scanResult.name}
              sugarGrams={scanResult.sugarGrams ?? scanResult.sugarPer100g ?? 0}
              calories={scanResult.calories}
              servingSize={formatWeight(scanResult.servingSize, sugarUnit) || '100 g / 100 ml'}
              sugarPer100g={scanResult.sugarPer100g}
              whoLimitServingPercent={scanResult.whoLimitServingPercent ?? (scanResult.sugarTeaspoons !== undefined ? Math.round((scanResult.sugarTeaspoons / 12) * 100) : undefined)}
              isDefaultServing={scanResult.isDefaultServing}
            />

            {/* Scan Again Button */}
            <TouchableOpacity
              onPress={resetScanner}
              style={{ backgroundColor: colors.primary, width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20 }}
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
