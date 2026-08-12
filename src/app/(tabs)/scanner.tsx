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
  fetchWithTimeout,
  extractSugarFromNutriments,
  parseQuantityString,
  detectShieldAlerts,
  API_TIMEOUT_MS
} from '../../utils/scannerAPI';
import { analyzeImageWithVision } from '../../utils/visionAPI';

import { OrbMascot as Mascot } from '../../components/features/OrbMascot';
import { NutritionFacts } from '../../components/features/NutritionFacts';
import ProductHeroCardDashboard from '../../components/features/ProductHeroCardDashboard';
import { ShieldPillCard } from '../../components/ShieldPillCard';
import { SubscriptionModal } from '../../components/SubscriptionModal';
import { EcoScoreCard } from '../../components/EcoScoreCard';
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
  const { sugarUnit, addToCollection, collection, isPremium, freeScansUsed, incrementFreeScans, allergenFilters, dietPreference } = useAppStore();

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

  const handleVisionScan = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setMode('camera'); // Switch back to loading mode
        setLoading(true);
        setErrorMsg(null);
        
        // Creative loading sequence
        setLoadingText('Scanning packaging details...');
        setTimeout(() => { if (loadingRef.current) setLoadingText('Analyzing chemical additives...'); }, 2000);
        setTimeout(() => { if (loadingRef.current) setLoadingText('Calculating health metrics...'); }, 4000);

        loadingRef.current = true;
        
        const visionResult = await analyzeImageWithVision(result.assets[0].base64);
        
        if (visionResult) {
          setScanResult(visionResult);
          setMode('result');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Vision Scan Error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg('Failed to analyze image. Please try again or ensure your Vercel Proxy is running.');
      setMode('not-found');
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingText('Analyzing...');
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
              We couldn't find this barcode in our database. Take a photo of the front and ingredients label to scan it with AI!
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleVisionScan}
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
              flexDirection: 'row',
              gap: 10
            }}
            activeOpacity={0.9}
          >
            <CameraIcon size={20} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 16 }}>Scan Label with AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={resetScanner}
            style={{
              backgroundColor: 'transparent',
              width: '100%',
              paddingVertical: 18,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: colors.border
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.textSecondary, fontWeight: '800', fontSize: 15 }}>Try another barcode</Text>
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
            {/* 0. Proactive Shield Pill Cards (Allergens, Palm Oil, Diet) */}
            <View style={{ marginBottom: 12 }}>
              {scanResult.ingredientsText && allergenFilters.length > 0 && detectShieldAlerts(scanResult.ingredientsText, allergenFilters).map((alert, idx) => (
                <ShieldPillCard key={`${alert.id}-${idx}`} alert={alert} index={idx} />
              ))}
              
              {dietPreference === 'vegan' && scanResult.isVegan === false && (
                <ShieldPillCard key="diet-vegan" alert={{ id: 'vegan', type: 'allergen', name: 'Non-Vegan Ingredients' }} index={5} />
              )}
              {dietPreference === 'vegetarian' && scanResult.isVegetarian === false && (
                <ShieldPillCard key="diet-veg" alert={{ id: 'veg', type: 'allergen', name: 'Non-Vegetarian Ingredients' }} index={5} />
              )}
            </View>

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
              totalWeightGrams={scanResult.totalWeightGrams}
              totalSugarGrams={scanResult.totalSugarGrams}
              sugarPer100g={scanResult.sugarPer100g}
              whoLimitServingPercent={scanResult.whoLimitServingPercent ?? (scanResult.sugarTeaspoons !== undefined ? Math.round((scanResult.sugarTeaspoons / 12) * 100) : undefined)}
              isDefaultServing={scanResult.isDefaultServing}
              hasHiddenSugars={scanResult.hasHiddenSugars}
              hiddenSugars={scanResult.hiddenSugars}
              hiddenSugarCount={scanResult.hiddenSugarCount}
              nutriScore={scanResult.nutriScore}
            />

            {/* NEW: Eco-Score & Dietary Metrics */}
            <EcoScoreCard 
              grade={scanResult.ecoscoreGrade}
              carbonFootprint={scanResult.carbonFootprint100g}
              isOrganic={scanResult.isOrganic}
              isVegan={scanResult.isVegan}
              isVegetarian={scanResult.isVegetarian}
              delayIndex={3}
            />

            {/* 3. Action Dock: Save & Scan Another */}
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
                      flex: 1.2,
                      backgroundColor: isAlreadySaved ? `${colors.primary}15` : colors.primary,
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                      paddingVertical: 14,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 8,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isAlreadySaved ? 0.05 : 0.15,
                      shadowRadius: 8,
                      elevation: isAlreadySaved ? 1 : 3,
                    }}
                    activeOpacity={0.8}
                  >
                    <Bookmark size={16} color={isAlreadySaved ? colors.primary : '#FFFFFF'} fill={isAlreadySaved ? colors.primary : 'transparent'} />
                    <Text style={{ color: isAlreadySaved ? colors.primary : '#FFFFFF', fontWeight: '900', fontSize: 13 }}>
                      {isAlreadySaved ? 'Added to Basket' : 'Add to Basket'}
                    </Text>
                  </TouchableOpacity>
                );
              })()}

              {/* Scan Again Button */}
              <TouchableOpacity
                onPress={resetScanner}
                style={{
                  flex: 1,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  paddingVertical: 14,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13 }}>Scan Another</Text>
              </TouchableOpacity>
            </View>

            {/* Attribution footer */}
            <Text style={{ color: colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 24, fontWeight: '600' }}>
              Data sourced from Open Food Facts (ODbL)
            </Text>
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
