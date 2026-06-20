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
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
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
  Shuffle,
  X,
  Leaf,
  ShieldAlert,
  FlaskConical,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type ScanMode = 'camera' | 'manual' | 'result' | 'not-found';

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
// Robust sugar extraction from OpenFoodFacts nutriments
// ─────────────────────────────────────────────────────────
// OpenFoodFacts is a community database and MANY products have
// `sugars_100g = 0` even when the product is mostly sugar (e.g. glucose/
// dextrose-based products like Glucon D). This function uses a smart
// priority waterfall to extract the most accurate sugar value possible.
//
// Priority order:
//  1. sugars_serving        → most accurate (per-serving value)
//  2. sugars_100g (> 0)     → per-100g value, ONLY if non-zero
//  3. added-sugars_100g     → partial fallback (when sugars field is 0)
//  4. carbohydrates_100g    → last-resort: carbs = sugars for pure-sugar
//                             products (glucose, dextrose, honey, etc.)
//                             but only when sugars field is explicitly 0
//                             and carbs represent a plausibly "sugar-like"
//                             fraction of the product.
//
// The function NEVER silently returns 0 when meaningful data is present.
function extractSugarFromNutriments(n: Record<string, any>): number {
  if (!n) return 0;

  const toNum = (v: any): number | null => {
    if (v === undefined || v === null || v === '') return null;
    const num = parseFloat(String(v));
    return isNaN(num) ? null : num;
  };

  // Priority 1: per-serving sugar (most accurate for typical consumption)
  const sugarServing = toNum(n.sugars_serving);
  if (sugarServing !== null && sugarServing > 0) return sugarServing;

  // Priority 2: per-100g sugar field, but ONLY if it's non-zero
  // (zero is often an unfilled field, not a real value)
  const sugar100g = toNum(n.sugars_100g ?? n.sugars);
  if (sugar100g !== null && sugar100g > 0) return sugar100g;

  // Priority 3: added-sugars_100g (partial data, but better than nothing)
  const addedSugar100g = toNum(n['added-sugars_100g'] ?? n['added-sugars_serving']);
  if (addedSugar100g !== null && addedSugar100g > 0) return addedSugar100g;

  // Priority 4: carbohydrates as a last resort
  // Only use when the sugars field is explicitly 0 (not undefined/null)
  // AND carbohydrates are present. This handles pure-sugar products like
  // glucose (Glucon D), dextrose, honey, maple syrup, etc. where the
  // contributor filled carbs but forgot to fill in sugars separately.
  const carbs100g = toNum(n.carbohydrates_100g ?? n.carbohydrates);
  const sugarFieldExistsAsZero = sugar100g === 0;
  if (sugarFieldExistsAsZero && carbs100g !== null && carbs100g > 0) {
    return carbs100g;
  }

  // Absolute fallback: return whatever sugars_100g actually was (could be 0)
  return sugar100g ?? 0;
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
  const [loadingText, setLoadingText] = useState('Analyzing...');
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
    sugarGrams: number;
    sugarTeaspoons: number;
    sugarPer100g?: number;     // Used for accurate normalized comparisons
    imageUrl?: string;
    servingSize?: string;
    calories?: number;
    carbsGrams?: number;
    fatGrams?: number;
    proteinGrams?: number;
    novaGroup?: number;        // NOVA classification 1-4
    additivesTags?: string[];  // e.g. ['en:e330', 'en:e621']
    categoryTag?: string;      // e.g. 'en:breakfast-cereals'
  } | null>(null);

  // Better Choices Modal State
  const [betterChoicesVisible, setBetterChoicesVisible] = useState(false);
  const [betterChoicesLoading, setBetterChoicesLoading] = useState(false);
  const [betterChoices, setBetterChoices] = useState<Array<{
    name: string;
    brand: string;
    sugarGrams: number;
    sugarTeaspoons: number;
    imageUrl?: string;
  }>>([]);

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

  // Unlock scanner lock when mode changes to camera
  useEffect(() => {
    if (mode === 'camera') {
      isScanningRef.current = false;
      setLoading(false);
      setErrorMsg(null);
    }
  }, [mode]);

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
        addScan(manualName.trim(), sugarVal, 'Custom Entry', manualImageUri || undefined);
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
    // Double-scan guard
    if (isScanningRef.current || loading) return;
    const barcode = data?.trim();
    if (!barcode) return;

    isScanningRef.current = true;

    if (!mountedRef.current) return;
    setLoading(true);
    setErrorMsg(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let productFound = false;

    // --- PHASE 1: OpenFoodFacts ---
    try {
      const response = await fetchWithTimeout(
        `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode)}.json`,
        API_TIMEOUT_MS
      );

      if (response.ok) {
        const resData = await response.json();
        if (resData?.product) {
          const p = resData.product;
          const name = (p.product_name || p.product_name_en || 'Unknown Product').trim();
          
          if (name !== 'Unknown Product') {
            const brand = (p.brands || 'Generic Brand').trim();
            const imageUrl: string | undefined = p.image_front_url || p.image_url || undefined;

            // Use the robust sugar extractor — handles data quality issues in OFFs
            // where community contributors often leave sugars=0 for glucose products
            const sugarGrams = extractSugarFromNutriments(p.nutriments ?? {});
            const sugarTeaspoons = parseFloat((sugarGrams / 4.2).toFixed(1));
            
            // Extract the strict 100g sugar value for normalized Smart Swaps comparison
            const sugarPer100g = p.nutriments?.sugars_100g !== undefined 
                ? parseFloat(p.nutriments.sugars_100g) 
                : undefined;

            const servingSize: string | undefined = p.serving_size || undefined;
            const calories =
              p.nutriments?.['energy-kcal_serving'] !== undefined ? parseFloat(p.nutriments['energy-kcal_serving'])
              : p.nutriments?.['energy-kcal_100g'] !== undefined ? parseFloat(p.nutriments['energy-kcal_100g'])
              : undefined;
            const carbsGrams =
              p.nutriments?.carbohydrates_serving !== undefined ? parseFloat(p.nutriments.carbohydrates_serving)
              : p.nutriments?.carbohydrates_100g !== undefined ? parseFloat(p.nutriments.carbohydrates_100g)
              : undefined;
            const fatGrams =
              p.nutriments?.fat_serving !== undefined ? parseFloat(p.nutriments.fat_serving)
              : p.nutriments?.fat_100g !== undefined ? parseFloat(p.nutriments.fat_100g)
              : undefined;
            const proteinGrams =
              p.nutriments?.proteins_serving !== undefined ? parseFloat(p.nutriments.proteins_serving)
              : p.nutriments?.proteins_100g !== undefined ? parseFloat(p.nutriments.proteins_100g)
              : undefined;

            // NOVA classification (1-4) and additives for the NOVA LED indicator
            const novaGroup: number | undefined =
              typeof p.nova_group === 'number' ? p.nova_group
              : typeof p.nova_group === 'string' ? parseInt(p.nova_group, 10) || undefined
              : undefined;

            const additivesTags: string[] = Array.isArray(p.additives_tags) ? p.additives_tags : [];

            // Best category tag for "Better Choices" lookup
            // Prefer the most specific category (last in the array) from categories_tags
            const categoryTag: string | undefined =
              Array.isArray(p.categories_tags) && p.categories_tags.length > 0
                ? p.categories_tags[p.categories_tags.length - 1]
                : undefined;

            addScan(name, sugarGrams, brand, imageUrl, data, servingSize, calories, carbsGrams, fatGrams, proteinGrams);

            if (mountedRef.current) {
              setScanResult({ name, brand, sugarGrams, sugarTeaspoons, sugarPer100g, imageUrl, servingSize, calories, carbsGrams, fatGrams, proteinGrams, novaGroup, additivesTags, categoryTag });
              productFound = true;
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('OpenFoodFacts fetch error:', err);
    }

    // --- PHASE 2: USDA FoodData Central ---
    if (!productFound && process.env.EXPO_PUBLIC_USDA_API_KEY && mountedRef.current) {
      try {
        const response = await fetchWithTimeout(
          `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(barcode)}&api_key=${process.env.EXPO_PUBLIC_USDA_API_KEY}&pageSize=1`,
          API_TIMEOUT_MS
        );
        if (response.ok) {
          const resData = await response.json();
          if (resData.foods && resData.foods.length > 0) {
            const food = resData.foods[0];
            const name = food.description || 'Unknown Product';
            const brand = food.brandOwner || food.brandName || 'Generic Brand';
            
            // Look for sugar in the nutrients array
            const sugarsNutrient = food.foodNutrients?.find((n: any) => 
              n.nutrientName?.toLowerCase().includes('sugars, total') || 
              n.nutrientName?.toLowerCase() === 'sugars'
            );
            
            let sugarGrams = 0;
            if (sugarsNutrient && sugarsNutrient.value !== undefined) {
               sugarGrams = parseFloat(sugarsNutrient.value);
            }

            const sugarTeaspoons = parseFloat((sugarGrams / 4.2).toFixed(1));
            const servingSize = food.servingSize ? `${food.servingSize} ${food.servingSizeUnit || ''}`.trim() : undefined;

            addScan(name, sugarGrams, brand, undefined, data, servingSize, undefined, undefined, undefined, undefined);

            if (mountedRef.current) {
              setScanResult({ name, brand, sugarGrams, sugarTeaspoons, servingSize });
              productFound = true;
            }
          }
        }
      } catch (err: any) {
        console.warn('USDA API fetch error:', err);
      }
    }



    // --- FINAL OUTCOME ---
    if (!mountedRef.current) return;
    
    setLoading(false);
    
    if (productFound) {
      setMode('result');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg('Product not found. Entering manual mode.');
      setMode('manual');
    }

    // Release scan lock after cooldown so user can try again
    setTimeout(() => {
      isScanningRef.current = false;
    }, SCAN_COOLDOWN_MS);

  }, [loading, addScan]);

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
    setScanResult(null);
    setErrorMsg(null);
    isScanningRef.current = false;
    setLoading(false);
    setTorchOn(false);
    setManualName('');
    setManualSugarGrams('');
    setManualSugarPer100('');
    setManualProductSize('');
    setManualImageUri(null);
    setCalculationMode('total');
    setBetterChoicesVisible(false);
    setBetterChoices([]);
    setMode('camera');
  };

  // ─────────────────────────────────────────────────────────
  // NOVA LED color + label helper
  // ─────────────────────────────────────────────────────────
  const getNovaInfo = (group?: number) => {
    switch (group) {
      case 1: return {
        color: '#22C55E',
        glowColor: 'rgba(34, 197, 94, 0.4)',
        label: 'Unprocessed',
        description: 'Unprocessed or minimally processed foods. These are natural foods altered only by removal of inedible parts, drying, crushing, grinding, pasteurization, or fermentation. No added substances.',
      };
      case 2: return {
        color: '#84CC16',
        glowColor: 'rgba(132, 204, 22, 0.4)',
        label: 'Processed Ingredient',
        description: 'Processed culinary ingredients obtained from Group 1 foods by pressing, refining, grinding, or milling. Examples: oils, butter, sugar, salt, flour. Used in food preparation, not eaten alone.',
      };
      case 3: return {
        color: '#F59E0B',
        glowColor: 'rgba(245, 158, 11, 0.4)',
        label: 'Processed',
        description: 'Processed foods made by adding salt, oil, sugar, or other Group 2 substances to Group 1 foods. Includes canned vegetables, cheeses, freshly made bread. Usually 2-3 ingredients.',
      };
      case 4: return {
        color: '#EF4444',
        glowColor: 'rgba(239, 68, 68, 0.5)',
        label: 'Ultra-Processed',
        description: 'Ultra-processed food products made mostly from substances derived from foods and additives. Studies in The BMJ (2019) and JAMA (2022) link high intake to increased risk of obesity, type 2 diabetes, cardiovascular disease, and all-cause mortality.',
      };
      default: return {
        color: '#9CA3AF',
        glowColor: 'rgba(156, 163, 175, 0.3)',
        label: 'Unknown',
        description: 'Processing level data not available for this product.',
      };
    }
  };

  // Format additive tag like 'en:e330' → 'E330'
  const formatAdditive = (tag: string) => {
    const parts = tag.split(':');
    const code = parts[parts.length - 1];
    return code.toUpperCase().replace('-', ' ');
  };

  // ─────────────────────────────────────────────────────────
  // Fetch "Better Choices" (3 lower-sugar alternatives)
  // ─────────────────────────────────────────────────────────
  const fetchBetterChoices = async () => {
    if (!scanResult?.categoryTag) return;

    setBetterChoicesLoading(true);
    setBetterChoicesVisible(true);
    setBetterChoices([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=${encodeURIComponent(scanResult.categoryTag)}&sort_by=sugars_100g&page_size=15&json=1`;
      
      const response = await fetchWithTimeout(url, API_TIMEOUT_MS);
      if (response.ok) {
        const data = await response.json();
        const products = data.products || [];
        
        // Filter: must have a name, must have sugar data, must not be the same product
        const alternatives: Array<{
          name: string;
          brand: string;
          sugarGrams: number;
          sugarTeaspoons: number;
          imageUrl?: string;
        }> = [];

        // Calculate scaling factor from the scanned product (total sugar / sugar per 100g)
        // If it's a 500ml coke, 53g total / 10.6g per 100g = 5 (meaning 500g serving size)
        let scalingFactor: number | null = null;
        if (scanResult.sugarPer100g && scanResult.sugarPer100g > 0) {
           scalingFactor = scanResult.sugarGrams / scanResult.sugarPer100g;
        }

        for (const p of products) {
          if (alternatives.length >= 3) break;
          
          const pName = (p.product_name || p.product_name_en || '').trim();
          if (!pName) continue;
          
          // Skip if it's the same product name (case insensitive)
          // or if one name is a very close substring of the other (e.g. "Coca-Cola" vs "Coca Cola Original taste")
          const normalizedScanned = scanResult.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normalizedPName = pName.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (normalizedPName.includes(normalizedScanned) || normalizedScanned.includes(normalizedPName)) {
            continue;
          }
          
          let altSugar100g = p.nutriments?.sugars_100g !== undefined ? parseFloat(p.nutriments.sugars_100g) : null;
          
          // Only compare if we have 100g values for both, or use the raw values as fallback
          let comparativeSugar: number;
          let scannedComparative: number;

          if (scalingFactor !== null && altSugar100g !== null) {
              // Scale the alternative's sugar to match the scanned product's serving size
              comparativeSugar = altSugar100g * scalingFactor;
              scannedComparative = scanResult.sugarGrams;
          } else {
              // Fallback to absolute sugar from whatever the API gave us
              comparativeSugar = extractSugarFromNutriments(p.nutriments ?? {});
              scannedComparative = scanResult.sugarGrams;
          }
          
          // Only suggest if it has strictly LESS sugar (at least 0.5g difference to avoid rounding issues)
          if (comparativeSugar >= scannedComparative - 0.5) continue;
          
          alternatives.push({
            name: pName,
            brand: (p.brands || 'Generic Brand').trim(),
            sugarGrams: parseFloat(comparativeSugar.toFixed(1)),
            sugarTeaspoons: parseFloat((comparativeSugar / 4.2).toFixed(1)),
            imageUrl: p.image_front_small_url || p.image_front_url || undefined,
          });
        }
        
        setBetterChoices(alternatives);
      }
    } catch (err) {
      console.warn('Better Choices fetch error:', err);
    } finally {
      setBetterChoicesLoading(false);
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
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torchOn}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'upc_a', 'upc_e', 'ean13', 'ean8', 'code128', 'code39', 'aztec', 'pdf417', 'datamatrix', 'code93', 'itf14', 'codabar'],
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

              {/* Reactive Mascot */}
              <View style={{ marginTop: 24, marginBottom: 16 }}>
                <Mascot
                  state={
                    scanResult.sugarTeaspoons > 6 ? 'shocked'
                      : scanResult.sugarTeaspoons > 3 ? 'dizzy'
                        : 'happy'
                  }
                  size={120}
                />
              </View>

              {/* Massive Impact Typography for Sugar */}
              <View style={{ alignItems: 'center', marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={{
                    color: scanResult.sugarTeaspoons > 6 ? colors.error : scanResult.sugarTeaspoons > 3 ? colors.warning : colors.success,
                    fontSize: 72,
                    fontWeight: '900',
                    letterSpacing: -2,
                    lineHeight: 72
                  }}>
                    {scanResult.sugarTeaspoons}
                  </Text>
                  <Text style={{
                    color: scanResult.sugarTeaspoons > 6 ? colors.error : scanResult.sugarTeaspoons > 3 ? colors.warning : colors.success,
                    fontSize: 24,
                    fontWeight: '800',
                    marginLeft: 6
                  }}>
                    tsp
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Total Sugar
                </Text>
              </View>
            </View>

            {/* 2. Unified Health Insights Card (NOVA + Additives + Better Choices) */}
            {(() => {
              const nova = getNovaInfo(scanResult.novaGroup);
              // Only show this card if we have NOVA data or additives or if it's an OFF product
              if (!scanResult.novaGroup && (!scanResult.additivesTags || scanResult.additivesTags.length === 0)) return null;

              return (
                <View style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 28,
                  padding: 24,
                  marginBottom: 24,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <ShieldAlert size={18} color={colors.text} />
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>Health Insights</Text>
                  </View>

                  {/* NOVA Pill & Studies Pill Row */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {scanResult.novaGroup && (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: nova.color + '15',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 99,
                        borderWidth: 1,
                        borderColor: nova.color + '30',
                        gap: 6
                      }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: nova.color }} />
                        <Text style={{ color: nova.color, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          NOVA {scanResult.novaGroup} — {nova.label}
                        </Text>
                      </View>
                    )}
                    
                    {scanResult.novaGroup === 4 && (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 99,
                        gap: 4
                      }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                          📚 Backed by BMJ & JAMA Studies
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Additives Mini Card */}
                  {scanResult.additivesTags && scanResult.additivesTags.length > 0 && (
                    <View style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      padding: 16,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginBottom: scanResult.categoryTag ? 20 : 0
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <FlaskConical size={14} color={colors.textSecondary} />
                        <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                          {scanResult.additivesTags.length} Additive{scanResult.additivesTags.length > 1 ? 's' : ''} Detected
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {scanResult.additivesTags.slice(0, 12).map((tag, i) => (
                          <View key={i} style={{
                            backgroundColor: colors.surfaceRaised,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: colors.border
                          }}>
                            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>
                              {formatAdditive(tag)}
                            </Text>
                          </View>
                        ))}
                        {scanResult.additivesTags.length > 12 && (
                          <View style={{
                            backgroundColor: colors.surfaceRaised,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: colors.border
                          }}>
                            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>
                              +{scanResult.additivesTags.length - 12} more
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Better Choices Button (Inside the Card) */}
                  {scanResult.categoryTag && (
                    <TouchableOpacity
                      onPress={fetchBetterChoices}
                      activeOpacity={0.85}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        backgroundColor: colors.success,
                        paddingVertical: 14,
                        borderRadius: 16,
                        marginTop: (scanResult.additivesTags && scanResult.additivesTags.length > 0) ? 0 : 8,
                        shadowColor: colors.success,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <Shuffle size={18} color="#ffffff" />
                      <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 15 }}>
                        Find Better Choices
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}

            {/* 3. Nutrition Facts */}
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

          {/* ═══════════════════════════════════════════════
              Better Choices Modal
              ═══════════════════════════════════════════════ */}
          <Modal
            visible={betterChoicesVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setBetterChoicesVisible(false)}
          >
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
              {/* Modal Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ backgroundColor: colors.success + '18', padding: 8, borderRadius: 12 }}>
                    <Shuffle size={18} color={colors.success} />
                  </View>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>Better Choices</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setBetterChoicesVisible(false)}
                  style={{ backgroundColor: colors.surfaceRaised, padding: 8, borderRadius: 99 }}
                >
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Context Banner */}
                <View style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                    You scanned <Text style={{ fontWeight: '900', color: colors.text }}>{scanResult.name}</Text> with{' '}
                    <Text style={{ fontWeight: '900', color: colors.error }}>{scanResult.sugarGrams}g sugar</Text>.
                    Here are alternatives in the same category with less sugar:
                  </Text>
                </View>

                {/* Loading State */}
                {betterChoicesLoading && (
                  <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <ActivityIndicator size="large" color={colors.success} />
                    <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 13, marginTop: 16 }}>
                      Finding healthier alternatives...
                    </Text>
                  </View>
                )}

                {/* No Results */}
                {!betterChoicesLoading && betterChoices.length === 0 && (
                  <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Mascot state="dizzy" size={100} />
                    <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18, marginTop: 16 }}>
                      No Alternatives Found
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 16 }}>
                      We couldn't find products in this category with less sugar. This product might already be a good choice!
                    </Text>
                  </View>
                )}

                {/* Alternative Product Cards */}
                {betterChoices.map((alt, index) => {
                  const sugarSaved = scanResult.sugarGrams - alt.sugarGrams;
                  const pctLess = scanResult.sugarGrams > 0
                    ? Math.round((sugarSaved / scanResult.sugarGrams) * 100)
                    : 0;

                  return (
                    <View
                      key={index}
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: 20,
                        padding: 16,
                        marginBottom: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 14,
                      }}
                    >
                      {/* Rank Badge */}
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: index === 0 ? colors.success + '20' : colors.surfaceRaised,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Text style={{
                          color: index === 0 ? colors.success : colors.textSecondary,
                          fontWeight: '900',
                          fontSize: 14,
                        }}>
                          {index + 1}
                        </Text>
                      </View>

                      {/* Product Image */}
                      {alt.imageUrl && (
                        <Image
                          source={{ uri: alt.imageUrl }}
                          style={{ width: 48, height: 48, borderRadius: 10 }}
                          contentFit="contain"
                          transition={200}
                        />
                      )}

                      {/* Product Info */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, lineHeight: 18 }} numberOfLines={2}>
                          {alt.name}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                          {alt.brand}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <View style={{
                            backgroundColor: colors.success + '15',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 99,
                          }}>
                            <Text style={{ color: colors.success, fontSize: 11, fontWeight: '900' }}>
                              {alt.sugarGrams}g sugar
                            </Text>
                          </View>
                          {pctLess > 0 && (
                            <Text style={{ color: colors.success, fontSize: 11, fontWeight: '800' }}>
                              ↓ {pctLess}% less
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Teaspoons */}
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>
                          {alt.sugarTeaspoons}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>
                          tsp
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </SafeAreaView>
          </Modal>
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
