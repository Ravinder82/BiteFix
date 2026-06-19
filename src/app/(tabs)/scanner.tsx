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
} from 'react-native';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
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
import {
  Keyboard,
  ArrowLeft,
  Camera as CameraIcon,
  HelpCircle,
  AlertCircle,
  Zap,
  ZapOff,
  ScanText,
  CheckCircle,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { parseNutritionLabel } from '../../utils/ocrParser';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
// 'ocr-label' = camera open in label-scan mode
// 'ocr-review' = photo captured, show image + text input for OCR review
type ScanMode = 'camera' | 'manual' | 'result' | 'not-found' | 'ocr-label' | 'ocr-review';

// Timeout for the Open Food Facts API call — 10 seconds
const API_TIMEOUT_MS = 10_000;
// Minimum delay before next scan can fire (prevents double-scans)
const SCAN_COOLDOWN_MS = 2_500;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
// Fetch with timeout helper — prevents scanner from hanging
// ─────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GoodbyeSugarApp/1.0.0 (React Native; iOS/Android; contact@goodbyesugar.org)',
        'Accept': 'application/json',
      },
    });
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

  // Captured photo URI for OCR review screen
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);

  // Reference to the camera view for takePictureAsync
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);

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

  // OCR label laser sweeps wider/taller rectangle
  const ocrLaserY = useSharedValue(0);
  useEffect(() => {
    if (mode === 'ocr-label' && permission?.granted) {
      ocrLaserY.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    } else {
      ocrLaserY.value = withTiming(0, { duration: 300 });
    }
  }, [mode, permission?.granted]);

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserY.value * 230 }],
  }));

  const ocrLaserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ocrLaserY.value * 340 }],
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

  // Capture button animation
  const captureScale = useSharedValue(1);
  const captureStyle = useAnimatedStyle(() => ({ transform: [{ scale: captureScale.value }] }));

  // Manual Input State
  const [manualName, setManualName] = useState('');
  const [manualSugarGrams, setManualSugarGrams] = useState('');
  const [focusName, setFocusName] = useState(false);
  const [focusSugar, setFocusSugar] = useState(false);

  // OCR Input State (for review screen)
  const [ocrText, setOcrText] = useState('');
  const [ocrFocus, setOcrFocus] = useState(false);

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

  // Auto-OCR scan execution function
  const performOcrOnImage = async (imageUri: string) => {
    if (isOcrLoading || !imageUri) return;
    setIsOcrLoading(true);
    setErrorMsg(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      const formData = new FormData();
      formData.append('apikey', 'K87595304388957');
      formData.append('base64Image', `data:image/jpeg;base64,${base64}`);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const result = await response.json();
      if (result?.ParsedResults && result.ParsedResults.length > 0) {
        const text = result.ParsedResults[0].ParsedText;
        if (text && text.trim()) {
          setOcrText(text);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Auto-parse sugar value
          const parsed = parseNutritionLabel(text);
          if (parsed) {
            setManualSugarGrams(parsed.amount.toString());
            setManualName('');
            setErrorMsg(
              `Auto-Scan Successful! Found ${parsed.amount}g of sugar. Now enter the product name to save.`
            );
            setTimeout(() => {
              setMode('manual');
              setOcrText('');
              setCapturedPhotoUri(null);
            }, 1000);
          } else {
            setErrorMsg('Text scanned successfully, but we could not find the sugar value automatically. Please type it below.');
          }
        } else {
          throw new Error('No text found in the image.');
        }
      } else {
        const errorDetails = result?.ErrorMessage ? result.ErrorMessage.join(', ') : 'Unknown OCR error';
        throw new Error(errorDetails);
      }
    } catch (err: any) {
      console.error('OCR Error:', err);
      // Fallback to helloworld key
      try {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64',
        });
        const formData = new FormData();
        formData.append('apikey', 'helloworld');
        formData.append('base64Image', `data:image/jpeg;base64,${base64}`);
        formData.append('language', 'eng');
        const fallbackResponse = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const fallbackResult = await fallbackResponse.json();
        if (fallbackResult?.ParsedResults && fallbackResult.ParsedResults.length > 0) {
          const text = fallbackResult.ParsedResults[0].ParsedText;
          if (text && text.trim()) {
            setOcrText(text);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const parsed = parseNutritionLabel(text);
            if (parsed) {
              setManualSugarGrams(parsed.amount.toString());
              setManualName('');
              setErrorMsg(`Auto-Scan Successful! Found ${parsed.amount}g of sugar. Now enter the product name to save.`);
              setTimeout(() => {
                setMode('manual');
                setOcrText('');
                setCapturedPhotoUri(null);
              }, 1000);
            } else {
              setErrorMsg('Text scanned successfully, but we could not find the sugar value automatically. Please type it below.');
            }
            return;
          }
        }
      } catch (fbErr) {
        console.error('Fallback OCR Error:', fbErr);
      }
      setErrorMsg(`Auto-Scan failed: ${err.message || err}. You can still use iOS keyboard OCR or type it manually below.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsOcrLoading(false);
    }
  };

  // Auto-switch to manual if camera permission is denied
  useEffect(() => {
    if (permission && !permission.granted && mode === 'camera') {
      setMode('manual');
    }
  }, [permission]);

  // Turn torch off when leaving camera modes
  useEffect(() => {
    if (mode !== 'camera' && mode !== 'ocr-label') {
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
      if (isTimeout) {
        setErrorMsg('Request timed out. Check your internet connection and try again.');
        setMode('manual');
      } else {
        setErrorMsg('Product not found in database.');
        setMode('not-found');
      }
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      // Release scan lock after cooldown so user can try again
      setTimeout(() => {
        isScanningRef.current = false;
      }, SCAN_COOLDOWN_MS);
    }
  }, [loading, addScan]);

  // ─── Capture photo from camera for OCR label mode ──────
  const handleCaptureLabelPhoto = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    captureScale.value = withSequence(
      withSpring(0.88, { damping: 8 }),
      withSpring(1, { damping: 8 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.75,
        base64: false,
        exif: false,
      });

      if (photo?.uri) {
        setCapturedPhotoUri(photo.uri);
        setOcrText('');
        setErrorMsg(null);
        setMode('ocr-review');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg('Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  // ─── Process OCR text extracted from label ──────────────
  const handleOcrSubmit = () => {
    if (!ocrText.trim()) return;
    setLoading(true);

    setTimeout(() => {
      const parsed = parseNutritionLabel(ocrText);
      setLoading(false);

      if (parsed) {
        // Pre-fill the sugar value in manual entry
        setManualSugarGrams(parsed.amount.toString());
        setManualName(''); // User must type product name
        setErrorMsg(
          `Found: ${parsed.amount}g of ${parsed.type === 'added' ? 'added' : 'total'} sugars. Now enter the product name and save.`
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMode('manual');
      } else {
        // Could not parse — let user fill sugar manually
        setManualSugarGrams('');
        setManualName('');
        setErrorMsg('Could not extract sugar automatically. Please enter the sugar amount from the label.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setMode('manual');
      }
      setOcrText('');
      setCapturedPhotoUri(null);
    }, 400);
  };

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
    setCapturedPhotoUri(null);
    setOcrText('');
    setManualName('');
    setManualSugarGrams('');
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

          {/* ─── Top Segmented Control (Unified Switcher) ─── */}
          <SafeAreaView
            style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: Platform.OS === 'android' ? 12 : 0 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 12 }}>
              <View style={{
                flexDirection: 'row',
                backgroundColor: 'rgba(0,0,0,0.65)',
                borderRadius: 99,
                padding: 4,
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.2)',
              }}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMode('camera');
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 20,
                    borderRadius: 99,
                    backgroundColor: colors.primary,
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Barcode
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMode('ocr-label');
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 20,
                    borderRadius: 99,
                    backgroundColor: 'transparent',
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, opacity: 0.65 }}>
                    Scan Label
                  </Text>
                </TouchableOpacity>
              </View>
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
              We couldn't find this barcode in our database. Scan the ingredients label instead — our app will extract the sugar value automatically.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setMode('ocr-label'); }}
            style={{ backgroundColor: colors.primary, width: '100%', paddingVertical: 18, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 }}
            activeOpacity={0.9}
          >
            <ScanText color="#fff" size={20} />
            <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 }}>Scan Ingredients Label</Text>
          </TouchableOpacity>

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
          5. OCR LABEL CAMERA MODE
          Full-screen camera for capturing nutrition label
          ════════════════════════════════════════════════════ */}
      {mode === 'ocr-label' && (
        <View style={{ flex: 1 }}>
          {permission.granted ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torchOn}
              // No barcode scanning in this mode
            >
              {/* Overlay */}
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.50)' }}>

                {/* Wide label scanning frame — centered */}
                <View style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {/* Label frame — wide rectangle */}
                  <View style={{
                    width: SCREEN_WIDTH - 40,
                    height: 360,
                    position: 'relative',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {/* Transparent cut-out effect via borders */}
                    {/* Corner: Top Left */}
                    <View style={{ borderColor: colors.primary, position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 12 }} />
                    {/* Corner: Top Right */}
                    <View style={{ borderColor: colors.primary, position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 12 }} />
                    {/* Corner: Bottom Left */}
                    <View style={{ borderColor: colors.primary, position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 12 }} />
                    {/* Corner: Bottom Right */}
                    <View style={{ borderColor: colors.primary, position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 12 }} />

                    {/* Horizontal dividers to look like a nutrition label */}
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

                    {/* Animated scan laser (horizontal, sweeping down) */}
                    <AnimatedReanimated.View
                      style={[
                        {
                          position: 'absolute',
                          top: 4,
                          left: 12,
                          right: 12,
                          height: 2.5,
                          backgroundColor: colors.primary,
                          shadowColor: colors.primary,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 1,
                          shadowRadius: 12,
                          borderRadius: 2,
                          opacity: 0.9,
                        },
                        ocrLaserStyle,
                      ]}
                    />

                    {/* Instructional text above frame */}
                    <Text style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 12,
                      fontWeight: '700',
                      textAlign: 'center',
                      position: 'absolute',
                      top: -36,
                      left: 0,
                      right: 0,
                    }}>
                      Position the Nutrition Facts label inside
                    </Text>
                  </View>
                </View>
              </View>
            </CameraView>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, backgroundColor: '#1a1a1a' }}>
              <AlertCircle size={48} color={colors.error} />
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginTop: 16 }}>Camera Permission Required</Text>
            </View>
          )}

          {/* ─── Top bar ─── */}
          <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: Platform.OS === 'android' ? 12 : 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  resetScanner();
                }}
                style={{ borderRadius: 99, overflow: 'hidden' }}
                activeOpacity={0.85}
              >
                <BlurView intensity={60} tint="dark" style={{ padding: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 99 }}>
                  <ArrowLeft size={20} color="#fff" />
                </BlurView>
              </TouchableOpacity>

              {/* Center Segmented Control switcher */}
              <View style={{
                flexDirection: 'row',
                backgroundColor: 'rgba(0,0,0,0.65)',
                borderRadius: 99,
                padding: 4,
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.2)',
              }}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMode('camera');
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 20,
                    borderRadius: 99,
                    backgroundColor: 'transparent',
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, opacity: 0.65 }}>
                    Barcode
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMode('ocr-label');
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 20,
                    borderRadius: 99,
                    backgroundColor: colors.primary,
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Scan Label
                  </Text>
                </TouchableOpacity>
              </View>

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

          {/* ─── Bottom: Capture Button ─── */}
          <View style={{ position: 'absolute', bottom: 110, left: 0, right: 0, alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 20, textAlign: 'center' }}>
              Tap the button to capture the label
            </Text>

            {/* Big shutter button */}
            <AnimatedReanimated.View style={captureStyle}>
              <TouchableOpacity
                onPress={handleCaptureLabelPhoto}
                disabled={isCapturing || !permission.granted}
                style={{ alignItems: 'center', justifyContent: 'center' }}
                activeOpacity={0.85}
              >
                {/* Outer ring */}
                <View style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 4, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Inner white circle */}
                  <View style={{
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    backgroundColor: isCapturing ? colors.primary : '#ffffff',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isCapturing
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <ImageIcon size={28} color={colors.primary} />
                    }
                  </View>
                </View>
              </TouchableOpacity>
            </AnimatedReanimated.View>
          </View>
        </View>
      )}

      {/* ════════════════════════════════════════════════════
          6. OCR REVIEW MODE
          Show captured photo + text field for OCR extraction
          ════════════════════════════════════════════════════ */}
      {mode === 'ocr-review' && (
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TouchableOpacity
              onPress={() => setMode('ocr-label')}
              style={{ padding: 8, backgroundColor: colors.surfaceRaised, borderRadius: 99, marginRight: 14 }}
            >
              <RotateCcw size={18} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>Read the Label</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>
                Tap the text box below — iOS will let you scan text from the image
              </Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Captured photo preview */}
            {capturedPhotoUri && (
              <View style={{ marginBottom: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.border }}>
                <Image
                  source={{ uri: capturedPhotoUri }}
                  style={{ width: '100%', height: 220 }}
                  contentFit="cover"
                  transition={200}
                />
                {/* Overlay badge */}
                <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.65)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99 }}>
                  <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>Captured Label</Text>
                </View>
              </View>
            )}

            {/* Direct Auto-Scan OCR Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                performOcrOnImage(capturedPhotoUri!);
              }}
              disabled={isOcrLoading}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 16,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 3,
              }}
              activeOpacity={0.85}
            >
              {isOcrLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <ScanText size={20} color="#ffffff" />
              )}
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 15 }}>
                {isOcrLoading ? 'Scanning Text...' : 'Scan Text from Image'}
              </Text>
            </TouchableOpacity>

            {/* Instruction Card */}
            <View style={{
              backgroundColor: colors.surfaceRaised,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              borderRadius: 16,
              marginBottom: 20,
              flexDirection: 'row',
              gap: 14,
              alignItems: 'flex-start',
            }}>
              <AlertCircle size={20} color={colors.textSecondary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800', marginBottom: 4 }}>
                  How it works
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                  Tapping "Scan Text from Image" will automatically read the nutrition label and extract the sugar value. Alternatively, you can type or paste text manually into the box below.
                </Text>
              </View>
            </View>

            {/* OCR Text Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, paddingHorizontal: 4 }}>
                Nutrition Label Text
              </Text>
              <TextInput
                value={ocrText}
                onChangeText={setOcrText}
                onFocus={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOcrFocus(true); }}
                onBlur={() => setOcrFocus(false)}
                multiline
                keyboardType="default"
                placeholder="Or type/paste the nutrition label text manually here (e.g. 'Total Sugars 12g')..."
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: ocrFocus ? colors.primary : colors.border,
                  borderWidth: 1.5,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: ocrFocus ? 0.12 : 0,
                  shadowRadius: 8,
                  color: colors.text,
                  padding: 20,
                  paddingTop: 20,
                  borderRadius: 20,
                  fontSize: 14,
                  minHeight: 160,
                  textAlignVertical: 'top',
                }}
              />
            </View>

            {/* Divider with "or" */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>or skip to manual</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); handleOcrSubmit(); }}
              disabled={!ocrText.trim()}
              style={{
                backgroundColor: ocrText.trim() ? colors.primary : colors.surfaceRaised,
                width: '100%',
                paddingVertical: 18,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
              activeOpacity={0.9}
            >
              <Text style={{ color: ocrText.trim() ? '#ffffff' : colors.textMuted, fontWeight: '900', fontSize: 15 }}>
                Extract Sugar Value
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setErrorMsg(null);
                setCapturedPhotoUri(null);
                setOcrText('');
                setMode('manual');
              }}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1.5,
                borderColor: colors.border,
                width: '100%',
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>Enter Sugar Manually Instead</Text>
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
