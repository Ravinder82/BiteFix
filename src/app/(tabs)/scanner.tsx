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
import * as ImagePicker from 'expo-image-picker';
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
  useAnimatedProps,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const AnimatedRect = AnimatedReanimated.createAnimatedComponent(Rect);
import { useAppStore } from '../../stores/appStore';
import { useTheme } from '../../hooks/useTheme';
import { formatSugar } from '../../utils/sugar';
import { formatWeight, getNovaShortLabel, getNovaColor, getNovaLabel } from '../../utils/format';

import {
  ScanResultData,
  isAbortError,
  isRequestTimeoutError,
  lookupOpenFoodFacts,
  fetchWithTimeout,
  extractSugarFromNutriments,
  parseQuantityString,
  detectShieldAlerts,
  API_TIMEOUT_MS
} from '../../utils/scannerAPI';
import { OrbMascot as Mascot } from '../../components/features/OrbMascot';
import { NutritionFacts } from '../../components/features/NutritionFacts';
import ProductHeroCardDashboard from '../../components/features/ProductHeroCardDashboard';
import { ShieldPillCard } from '../../components/ShieldPillCard';
import { SubscriptionModal } from '../../components/SubscriptionModal';
import { EcoScoreCard } from '../../components/EcoScoreCard';
import { GutShieldCard } from '../../components/features/GutShieldCard';
import { AdditiveDetectiveCard } from '../../components/features/AdditiveDetectiveCard';
import { evaluateGutHealth } from '../../utils/gutShieldEvaluator';
import { AdditiveDetail } from '../../types/app.types';
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
  const { sugarUnit, addToCollection, collection, isPremium, freeScansUsed, incrementFreeScans, allergenFilters, dietPreference, setActiveScanResult } = useAppStore();

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const reticleWidth = 350;
  const reticleHeight = 220;
  const reticleTop = (screenHeight - reticleHeight) / 2;
  const reticleLeft = (screenWidth - reticleWidth) / 2;

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
    transform: [{ translateY: laserY.value * 212 }],
  }));

  // Liquid Energy Border Animations - Double Counter-Rotating Paths
  const borderOffsetCW = useSharedValue(0);
  const borderOffsetCCW = useSharedValue(0);
  const solidOpacity = useSharedValue(0);

  useEffect(() => {
    if (scannerIsLive) {
      if (loading) {
        cancelAnimation(borderOffsetCW);
        cancelAnimation(borderOffsetCCW);
        borderOffsetCW.value = withRepeat(
          withTiming(1140, { duration: 650, easing: Easing.linear }),
          -1,
          false
        );
        borderOffsetCCW.value = withRepeat(
          withTiming(-1140, { duration: 500, easing: Easing.linear }),
          -1,
          false
        );
        solidOpacity.value = withTiming(1, { duration: 250 });
      } else {
        cancelAnimation(borderOffsetCW);
        cancelAnimation(borderOffsetCCW);
        borderOffsetCW.value = withRepeat(
          withTiming(1140, { duration: 4000, easing: Easing.linear }),
          -1,
          false
        );
        borderOffsetCCW.value = withRepeat(
          withTiming(-1140, { duration: 3200, easing: Easing.linear }),
          -1,
          false
        );
        solidOpacity.value = withTiming(0, { duration: 200 });
      }
    } else {
      cancelAnimation(borderOffsetCW);
      cancelAnimation(borderOffsetCCW);
      borderOffsetCW.value = 0;
      borderOffsetCCW.value = 0;
      solidOpacity.value = 0;
    }
  }, [scannerIsLive, loading]);

  const energyCWProps = useAnimatedProps(() => ({
    strokeDashoffset: borderOffsetCW.value,
  }));

  const energyCCWProps = useAnimatedProps(() => ({
    strokeDashoffset: borderOffsetCCW.value,
  }));

  const solidGlowProps = useAnimatedProps(() => ({
    opacity: solidOpacity.value * 0.45,
  }));

  const solidCoreProps = useAnimatedProps(() => ({
    opacity: solidOpacity.value,
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
  // We also wipe out the previous activeScanResult so the home screen resets to empty immediately when a new scan session begins.
  useEffect(() => {
    if (scannerIsVisible && mode === 'camera') {
      isScanningRef.current = false;
      loadingRef.current = false;
      setLoading(false);
      setLoadingText('Analyzing...');
      setErrorMsg(null);
      setActiveScanResult(null);
    }
  }, [mode, scannerIsVisible, setActiveScanResult]);

  // Helper to sleep/delay
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    setLoadingText('Querying databases...');
    setErrorMsg(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let productFound = false;
    let localErrorMsg = null;
    let lookupResult: any = null;

    try {
      // --- PHASE 1: OpenFoodFacts ---
      lookupResult = await lookupOpenFoodFacts(barcode, lookupController.signal);

      if (!isCurrentLookup()) return;

      if (lookupResult) {
        if (!isPremium) {
          incrementFreeScans();
          const countAfterScan = (freeScansUsed || 0) + 1;
          if (countAfterScan >= 5) {
            setShowSubscriptionModal(true);
          }
        }

        if (isCurrentLookup()) {
          setScanResult(lookupResult);
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

      if (productFound) {
        const isStillValid = () => mountedRef.current && !lookupController.signal.aborted;

        // Premium animated analysis step sequence
        setLoadingText('Auditing ingredients & additives...');
        await delay(700);
        if (!isStillValid()) return;
        
        setLoadingText('Analyzing gut health safety...');
        await delay(700);
        if (!isStillValid()) return;
        
        setLoadingText('Calculating carbon footprint...');
        await delay(700);
        if (!isStillValid()) return;

        // Force a completely fresh object clone with unique timestamp to guarantee React re-render
        const freshResult = {
          ...lookupResult,
          id: `${barcode}_${Date.now()}`,
          scanTimestamp: Date.now(),
        };
        setActiveScanResult(freshResult);
        setMode('camera');
        setScanResult(null);
        isScanningRef.current = false;
        loadingRef.current = false;
        setLoading(false);
        setLoadingText('Analyzing...');
        activeLookupControllerRef.current = null;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push('/');
      } else {
        activeLookupControllerRef.current = null;
        loadingRef.current = false;
        setLoading(false);
        setLoadingText('Analyzing...');
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
  }, [freeScansUsed, incrementFreeScans, isPremium, setActiveScanResult]);



  const resetScanner = () => {
    stopActiveScannerSession();
    setScanResult(null);
    setErrorMsg(null);
    isScanningRef.current = false;
    setLoading(false);
    setLoadingText('Analyzing...');
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
                    width: 350,
                    height: 220,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    position: 'relative',
                  }}>
                    {/* Glass Bevel Outer Frame (High-end Liquid Glass highlight) */}
                    <View style={{
                      position: 'absolute',
                      top: -2,
                      left: -2,
                      width: 354,
                      height: 224,
                      borderRadius: 26,
                      borderWidth: 1.5,
                      borderColor: 'rgba(255, 255, 255, 0.18)',
                      backgroundColor: 'transparent',
                    }} pointerEvents="none" />

                    {/* Liquid Energy Border SVG */}
                    {cameraReady && (
                      <Svg width={358} height={228} style={{ position: 'absolute', top: -4, left: -4 }}>
                        <Defs>
                          <SvgLinearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor={colors.primary} stopOpacity={1} />
                            <Stop offset="50%" stopColor="#A3E66F" stopOpacity={0.8} />
                            <Stop offset="100%" stopColor={colors.primary} stopOpacity={1} />
                          </SvgLinearGradient>
                        </Defs>
                        {/* Faint static/breathing background border path */}
                        <Rect
                          x={4}
                          y={4}
                          width={350}
                          height={220}
                          rx={24}
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.12)"
                          strokeWidth={2}
                        />
                        {/* Background Static Glowing Aura */}
                        <Rect
                          x={4}
                          y={4}
                          width={350}
                          height={220}
                          rx={24}
                          fill="none"
                          stroke="url(#energyGrad)"
                          strokeWidth={8}
                          opacity={0.16}
                        />
                        {/* Active running energy border path 1 (Clockwise - Emerald) */}
                        <AnimatedRect
                          x={4}
                          y={4}
                          width={350}
                          height={220}
                          rx={24}
                          fill="none"
                          stroke="url(#energyGrad)"
                          strokeWidth={3.8}
                          strokeDasharray="180, 960"
                          animatedProps={energyCWProps}
                        />
                        {/* Active running energy border path 2 (Counter-Clockwise - Gold) */}
                        <AnimatedRect
                          x={4}
                          y={4}
                          width={350}
                          height={220}
                          rx={24}
                          fill="none"
                          stroke="#FBBF24"
                          strokeWidth={3.2}
                          strokeDasharray="120, 1020"
                          animatedProps={energyCCWProps}
                        />
                        {/* Solid neon outer glow (fades in on detection/loading) */}
                        <AnimatedRect
                          x={4}
                          y={4}
                          width={350}
                          height={220}
                          rx={24}
                          fill="none"
                          stroke={colors.primary}
                          strokeWidth={6.5}
                          animatedProps={solidGlowProps}
                        />
                        {/* Solid white core focus line (fades in on detection/loading) */}
                        <AnimatedRect
                          x={4}
                          y={4}
                          width={350}
                          height={220}
                          rx={24}
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth={2.8}
                          animatedProps={solidCoreProps}
                        />
                      </Svg>
                    )}

                    {/* Animated Scanning Laser Line — only show after camera is ready */}
                    {cameraReady && (
                      <AnimatedReanimated.View
                        style={[
                          {
                            position: 'absolute',
                            top: 4,
                            left: 10,
                            right: 10,
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

                    {/* Floating Blur Badge Instructions */}
                    {cameraReady && (
                      <BlurView
                        intensity={40}
                        tint="dark"
                        style={{
                          position: 'absolute',
                          bottom: -54,
                          borderRadius: 20,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderWidth: 1,
                          borderColor: 'rgba(255, 255, 255, 0.08)',
                          overflow: 'hidden',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '800', letterSpacing: 0.2 }}>
                          Hold barcode steady inside the box
                        </Text>
                      </BlurView>
                    )}
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
              We couldn't find this barcode in our global OpenFoodFacts or USDA databases. Please ensure good lighting and try scanning another barcode!
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
              marginBottom: 16,
            }}
            activeOpacity={0.9}
          >
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 16 }}>Scan Another Barcode</Text>
          </TouchableOpacity>
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
