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
import { formatWeight, getNovaShortLabel, getNovaColor, getNovaLabel } from '../../utils/format';

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
import { SubscriptionModal } from '../../components/SubscriptionModal';
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
  Bookmark,
  Search,
  Share2,
  Plus,
  Award,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type ScanMode = 'camera' | 'result' | 'not-found';

// Minimum delay before next scan can fire (prevents double-scans)
const SCAN_COOLDOWN_MS = 2_500;
const PRODUCT_BARCODE_TYPES = ['qr', 'upc_a', 'upc_e', 'ean13', 'ean8', 'code128', 'code39', 'itf14'] as const;

// ─────────────────────────────────────────────────────────
// Main Scanner Screen
// ─────────────────────────────────────────────────────────
export default function ScannerScreen() {
  const { colors, isDark } = useTheme();
  const { sugarUnit, addToCollection, collection, isPremium, freeScansUsed, incrementFreeScans } = useAppStore();

  // Camera permission hook from expo-camera
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();

  const [mode, setMode] = useState<ScanMode>('camera');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Analyzing...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
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

  // Auto-trigger modal if they are out of scans
  useEffect(() => {
    if (scannerIsVisible && !isPremium && typeof freeScansUsed === 'number' && freeScansUsed >= 5) {
      setShowSubscriptionModal(true);
    }
  }, [scannerIsVisible, isPremium, freeScansUsed]);

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



  // Scan Result State
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);

  const [alternatives, setAlternatives] = useState<ScanResultData[]>([]);
  const [selectedAltIndex, setSelectedAltIndex] = useState(0);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);



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



  // ─── Core barcode scan handler (Waterfall Lookup) ───────────────────────────
  const handleBarcodeScanned = useCallback(async ({ data }: BarcodeScanningResult) => {
    if (!scannerIsLiveRef.current || isScanningRef.current || loadingRef.current) return;
    const barcode = data?.trim();
    if (!barcode) return;

    // Check 5 Free Scans Limit
    if (!isPremium && typeof freeScansUsed === 'number' && freeScansUsed >= 5) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowSubscriptionModal(true);
      return;
    }

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

        if (!isPremium) {
          incrementFreeScans();
          const countAfterScan = (freeScansUsed || 0) + 1;
          if (countAfterScan >= 5) {
            setShowSubscriptionModal(true);
          }
        }

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
        setErrorMsg(localErrorMsg || 'Product not found.');
        setMode('not-found');
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
  }, []);





  const resetScanner = () => {
    stopActiveScannerSession();
    setScanResult(null);
    setErrorMsg(null);
    isScanningRef.current = false;
    setLoading(false);
    setLoadingText('Analyzing...');
    setTorchOn(false);

    setAlternatives([]);
    setLoadingAlternatives(false);
    setShowAlternatives(false);
    setMode('camera');
  };

  const handleFindAlternatives = async () => {
    if (!scanResult) return;
    const category = scanResult.categoryTag || 'unknown';

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingAlternatives(true);

    try {
      const controller = new AbortController();
      const list = await lookupAlternatives(category, scanResult, controller.signal);
      setAlternatives(list);
      setSelectedAltIndex(0);
      setShowAlternatives(true);

      if (list.length === 0) {
        Alert.alert(
          'Top Choice!',
          'Great news! This product is already one of the cleanest choices in its category.',
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 12 }}>

              {/* Free Scans Counter Pill */}
              {!isPremium && (
                <View style={{
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                    Used {freeScansUsed || 0} of 5
                  </Text>
                </View>
              )}
            </View>
          </SafeAreaView>



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
          4. NOT FOUND FALLBACK MODE
          ════════════════════════════════════════════════════ */}
      {mode === 'not-found' && (
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Mascot state="dizzy" size={140} />
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 24, textAlign: 'center' }}>
              Product Not Found!
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 22, paddingHorizontal: 24 }}>
              We couldn't find this barcode in our database. Please try scanning a different food product.
            </Text>
          </View>

          <TouchableOpacity
            onPress={resetScanner}
            style={{
              backgroundColor: colors.primary,
              width: '100%',
              paddingVertical: 18,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.9}
          >
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>Back to Scanner</Text>
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
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', marginLeft: 16 }}>Scan Result</Text>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Executive Telemetry: Purity & Additives Audit */}
            <View style={{ marginBottom: 4 }}>
              <ProductHeroCardDashboard
                scanResult={scanResult}
                colors={colors}
                isDark={isDark}
              />
            </View>

            {/* 2. Sugar & Energy Telemetry (Includes integrated WHO & Burn Down metrics) */}
            <NutritionFacts
              colors={colors}
              productName={scanResult.name}
              sugarGrams={scanResult.sugarGrams ?? scanResult.sugarPer100g ?? 0}
              calories={scanResult.calories}
              servingSize={formatWeight(scanResult.servingSize, sugarUnit) || '100 g / 100 ml'}
              sugarPer100g={scanResult.sugarPer100g}
              whoLimitServingPercent={scanResult.whoLimitServingPercent ?? (scanResult.sugarTeaspoons !== undefined ? Math.round((scanResult.sugarTeaspoons / 12) * 100) : undefined)}
              isDefaultServing={scanResult.isDefaultServing}
              hasHiddenSugars={scanResult.hasHiddenSugars}
              hiddenSugars={scanResult.hiddenSugars}
              hiddenSugarCount={scanResult.hiddenSugarCount}
              nutriScore={scanResult.nutriScore}
            />

            {/* 3. Action Dock: Save, Alternatives & Scan Another */}
            <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 12, marginBottom: 12 }}>
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
                          ...scanResult,
                          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                          name: scanResult.name,
                          brand: scanResult.brand,
                          sugarGrams: scanResult.sugarGrams ?? scanResult.sugarPer100g ?? 0,
                          sugarTeaspoons: scanResult.sugarTeaspoons ?? 0,
                          timestamp: Date.now(),
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
                      {isAlreadySaved ? 'Saved' : 'Save'}
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' }} />
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>
                      Find Clean Swap
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Scan Again Button */}
            <TouchableOpacity
              onPress={resetScanner}
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                width: '100%',
                paddingVertical: 15,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>Scan Another Item</Text>
            </TouchableOpacity>

            {/* Comprehensive Healthy Swap Modal */}
            {showAlternatives && alternatives.length > 0 && (() => {
              const alt = alternatives[selectedAltIndex || 0] || alternatives[0];
              const originalNova = scanResult.novaClass;
              const altNova = alt.novaClass;
              const originalAdditives = scanResult.additiveCount ?? (scanResult.additives?.length || 0);
              const altAdditives = alt.additiveCount ?? (alt.additives?.length || 0);
              const originalElevated = (scanResult.additives || []).filter(a => a.riskLevel === 'elevated').length;
              const altElevated = (alt.additives || []).filter(a => a.riskLevel === 'elevated').length;
              const originalScore = scanResult.biteFixScore ?? 50;
              const altScore = alt.biteFixScore ?? 85;
              const scoreDiff = altScore - originalScore;
              const originalSugar = scanResult.sugarPer100g ?? scanResult.sugarGrams ?? 0;
              const altSugar = alt.sugarPer100g ?? alt.sugarGrams ?? 0;

              const isAltSaved = collection.some(
                (item) => item.name === alt.name && item.brand === alt.brand
              );

              const borderDivider = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
              const bentoBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';

              return (
                <Modal
                  visible={showAlternatives}
                  animationType="slide"
                  transparent={true}
                  onRequestClose={() => setShowAlternatives(false)}
                >
                  <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    justifyContent: 'flex-end',
                  }}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      activeOpacity={1}
                      onPress={() => setShowAlternatives(false)}
                    />

                    {/* Modal Content Card (Styled matching index.tsx Details Modal) */}
                    <View style={{
                      backgroundColor: colors.surface,
                      borderTopLeftRadius: 32,
                      borderTopRightRadius: 32,
                      maxHeight: '85%',
                      padding: 28,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: -4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 32,
                      elevation: 16,
                      borderTopWidth: 1,
                      borderColor: borderDivider,
                    }}>
                      {/* Drag Handle & Header */}
                      <View style={{ width: '100%', alignItems: 'center', paddingBottom: 12 }}>
                        <View style={{ width: 48, height: 5, backgroundColor: isDark ? '#444' : '#ccc', borderRadius: 3, marginBottom: 8 }} />
                        
                        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>
                            Healthy Substitute
                          </Text>
                          <TouchableOpacity
                            onPress={() => setShowAlternatives(false)}
                            style={{ backgroundColor: colors.background, padding: 8, borderRadius: 20 }}
                          >
                            <X size={18} color={colors.text} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, gap: 16 }}>
                        {/* Recommended Swap Telemetry Banner */}
                        <View style={{
                          backgroundColor: isDark ? 'rgba(52, 199, 89, 0.08)' : 'rgba(52, 199, 89, 0.05)',
                          borderRadius: 16,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.15)',
                          gap: 4
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
                              <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>
                                RECOMMENDED SWAP
                              </Text>
                            </View>
                            <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '800' }}>
                              +{scoreDiff > 0 ? scoreDiff : 15} pts BiteFix Boost
                            </Text>
                          </View>
                          <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                            Replaces: <Text style={{ color: colors.text, fontWeight: '700' }}>{scanResult.brand ? `${scanResult.brand} - ` : ''}{scanResult.name}</Text>
                          </Text>
                        </View>

                        {/* Substitute Hero Details Card (ProductHeroCardDashboard layout theme) */}
                        <ProductHeroCardDashboard
                          scanResult={alt}
                          colors={colors}
                          isDark={isDark}
                        />

                        {/* Side-by-Side Health Audit Compare Card (Highly Visual Premium Theme) */}
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
                          gap: 16
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                              Side-by-Side Comparison
                            </Text>
                          </View>

                          <View style={{ height: 1, backgroundColor: borderDivider }} />

                          {/* 1. NOVA Classification */}
                          <View style={{ gap: 8 }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              NOVA Processing Level
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                              {/* Scanned */}
                              {(() => {
                                const origNovaColor = getNovaColor(originalNova);
                                const isUltraProcessed = originalNova === 4;
                                return (
                                  <View style={{ flex: 1, backgroundColor: bentoBg, borderColor: isUltraProcessed ? 'rgba(239, 68, 68, 0.15)' : borderDivider, borderWidth: 1, padding: 12, borderRadius: 16, gap: 6 }}>
                                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Scanned</Text>
                                    <Text style={{ color: origNovaColor, fontSize: 15, fontWeight: '900' }}>NOVA {originalNova || '?'}</Text>
                                    
                                    <View style={{ flexDirection: 'row', gap: 4, height: 4, width: '100%' }}>
                                      {[1, 2, 3, 4].map((step) => {
                                        const active = (originalNova || 4) >= step;
                                        return (
                                          <View
                                            key={step}
                                            style={{
                                              flex: 1,
                                              height: '100%',
                                              borderRadius: 2,
                                              backgroundColor: active ? origNovaColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                                            }}
                                          />
                                        );
                                      })}
                                    </View>
                                    <Text style={{ color: origNovaColor, fontSize: 10, fontWeight: '700' }}>{getNovaShortLabel(originalNova)}</Text>
                                  </View>
                                );
                              })()}

                              {/* Healthy Swap */}
                              {(() => {
                                const swapNovaColor = getNovaColor(altNova || 1);
                                const isClean = (altNova || 1) <= 2;
                                return (
                                  <View style={{ flex: 1, backgroundColor: bentoBg, borderColor: isClean ? 'rgba(34, 197, 94, 0.15)' : borderDivider, borderWidth: 1, padding: 12, borderRadius: 16, gap: 6 }}>
                                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Healthy Swap</Text>
                                    <Text style={{ color: swapNovaColor, fontSize: 15, fontWeight: '900' }}>NOVA {altNova || '?'}</Text>
                                    
                                    <View style={{ flexDirection: 'row', gap: 4, height: 4, width: '100%' }}>
                                      {[1, 2, 3, 4].map((step) => {
                                        const active = (altNova || 1) >= step;
                                        return (
                                          <View
                                            key={step}
                                            style={{
                                              flex: 1,
                                              height: '100%',
                                              borderRadius: 2,
                                              backgroundColor: active ? swapNovaColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                                            }}
                                          />
                                        );
                                      })}
                                    </View>
                                    <Text style={{ color: swapNovaColor, fontSize: 10, fontWeight: '700' }}>{getNovaShortLabel(altNova)}</Text>
                                  </View>
                                );
                              })()}
                            </View>
                          </View>

                          <View style={{ height: 1, backgroundColor: borderDivider }} />

                          {/* 2. Additive Count */}
                          <View style={{ gap: 8 }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Additives Exposure
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                              <View style={{ flex: 1, backgroundColor: bentoBg, borderColor: originalElevated > 0 ? 'rgba(239, 68, 68, 0.15)' : borderDivider, borderWidth: 1, padding: 12, borderRadius: 16, gap: 4 }}>
                                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Scanned</Text>
                                <Text style={{ color: originalElevated > 0 ? '#EF4444' : colors.text, fontSize: 15, fontWeight: '900' }}>{originalAdditives} Additives</Text>
                                <Text style={{ color: originalElevated > 0 ? '#EF4444' : colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
                                  {originalElevated > 0 ? `${originalElevated} elevated risk` : '0 elevated risk'}
                                </Text>
                              </View>
                              <View style={{ flex: 1, backgroundColor: bentoBg, borderColor: altAdditives === 0 ? 'rgba(34, 197, 94, 0.15)' : borderDivider, borderWidth: 1, padding: 12, borderRadius: 16, gap: 4 }}>
                                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Healthy Swap</Text>
                                <Text style={{ color: altAdditives === 0 ? '#22C55E' : colors.text, fontSize: 15, fontWeight: '900' }}>{altAdditives} Additives</Text>
                                <Text style={{ color: altAdditives === 0 ? '#22C55E' : (altElevated > 0 ? '#EF4444' : colors.textSecondary), fontSize: 10, fontWeight: '700' }}>
                                  {altElevated > 0 ? `${altElevated} elevated risk` : '0 elevated risk'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={{ height: 1, backgroundColor: borderDivider }} />

                          {/* 3. Sugar Density Compare */}
                          <View style={{ gap: 8 }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Sugar Density (per 100g)
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                              <View style={{ flex: 1, backgroundColor: bentoBg, borderColor: originalSugar > 15 ? 'rgba(239, 68, 68, 0.15)' : borderDivider, borderWidth: 1, padding: 12, borderRadius: 16, gap: 4 }}>
                                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Scanned</Text>
                                <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '900', textDecorationLine: 'line-through' }}>{originalSugar}g</Text>
                              </View>
                              {(() => {
                                const sugarRedux = originalSugar > 0 ? Math.round(((originalSugar - altSugar) / originalSugar) * 100) : 0;
                                return (
                                  <View style={{ flex: 1, backgroundColor: bentoBg, borderColor: 'rgba(34, 197, 94, 0.15)', borderWidth: 1, padding: 12, borderRadius: 16, gap: 4 }}>
                                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Healthy Swap</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                      <Text style={{ color: '#22C55E', fontSize: 15, fontWeight: '900' }}>{altSugar}g</Text>
                                      {sugarRedux > 0 && (
                                        <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                                          <Text style={{ color: '#22C55E', fontSize: 9, fontWeight: '800' }}>-{sugarRedux}%</Text>
                                        </View>
                                      )}
                                    </View>
                                  </View>
                                );
                              })()}
                            </View>
                          </View>
                        </View>

                        {/* Why Swapping Transforms Your Health Card */}
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
                          gap: 10
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                              Why Swapping Transforms Your Health
                            </Text>
                          </View>
                          <View style={{ height: 1, backgroundColor: borderDivider }} />
                          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
                            By substituting with <Text style={{ color: colors.text, fontWeight: '800' }}>{alt.name}</Text>, you transition from {getNovaLabel(originalNova)} (NOVA {originalNova || '?'}) to a significantly cleaner food matrix ({getNovaLabel(altNova)} NOVA {altNova || '?'}) while reducing chemical additive exposure.
                          </Text>
                        </View>

                        {/* Action Dock (Saved Product Details styling) */}
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                          <TouchableOpacity
                            onPress={() => setShowAlternatives(false)}
                            style={{
                              flex: 1,
                              paddingVertical: 15,
                              borderRadius: 16,
                              borderWidth: 1,
                              borderColor: borderDivider,
                              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13 }}>Keep Scanned</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              if (!isAltSaved) {
                                addToCollection({
                                  ...alt,
                                  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                  name: alt.name,
                                  brand: alt.brand,
                                  sugarGrams: alt.sugarGrams ?? alt.sugarPer100g ?? 0,
                                  sugarTeaspoons: alt.sugarTeaspoons ?? 0,
                                  timestamp: Date.now(),
                                  isSwapped: true,
                                  swappedForOriginalName: scanResult.name,
                                  originalNovaClass: scanResult.novaClass,
                                  originalBiteFixScore: scanResult.biteFixScore,
                                  originalAdditiveCount: scanResult.additiveCount,
                                  originalSugarGrams: scanResult.sugarGrams ?? scanResult.sugarPer100g,
                                });
                              }
                              setShowAlternatives(false);
                            }}
                            style={{
                              flex: 1.3,
                              paddingVertical: 15,
                              borderRadius: 16,
                              backgroundColor: colors.primary,
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: colors.primary,
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.25,
                              shadowRadius: 10,
                              elevation: 4,
                            }}
                            activeOpacity={0.85}
                          >
                            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.3 }}>
                              {isAltSaved ? 'Already Saved' : 'Save Swapped Choice'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                </Modal>
              );
            })()}
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

      {/* ─── Subscription Half-Modal ─── */}
      <SubscriptionModal 
        visible={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)}
        showCloseButton={(!isPremium && typeof freeScansUsed === 'number' && freeScansUsed < 5)}
      />
    </View>
  );
}
