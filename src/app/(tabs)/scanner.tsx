import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, Easing } from 'react-native-reanimated';
import { useAppStore } from '../../stores/appStore';
import { useTheme } from '../../hooks/useTheme';
import { SugarPile } from '../../components/features/SugarPile';
import { OrbMascot as Mascot } from '../../components/features/OrbMascot';
import { NutritionFacts } from '../../components/features/NutritionFacts';
import { ScanBarcode, Keyboard, ArrowLeft, Camera as CameraIcon, HelpCircle, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

type ScanMode = 'camera' | 'manual' | 'result';

export default function ScannerScreen() {
  const { colors, isDark } = useTheme();
  const { addScan } = useAppStore();
  const [permission, requestPermission] = useCameraPermissions();

  const [mode, setMode] = useState<ScanMode>('camera');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronous scan ref lock to prevent duplicate scans on camera frame callbacks
  const isScanningRef = useRef(false);

  // Animated laser line Y coordinate
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
      laserY.value = 0;
    }
  }, [mode, permission]);

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserY.value * 230 }],
  }));

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

  // Re-request permissions or auto-open manual mode if denied
  useEffect(() => {
    if (permission && !permission.granted && mode === 'camera') {
      setMode('manual');
    }
  }, [permission]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isScanningRef.current || loading) return;
    isScanningRef.current = true;
    setScanning(true);
    setLoading(true);
    setErrorMsg(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v3/product/${data}.json`);
      const resData = await response.json();

      if (resData && resData.product) {
        const p = resData.product;
        const name = p.product_name || 'Unknown Product';
        const brand = p.brands || 'Generic Brand';
        const imageUrl = p.image_url || undefined;

        // Prioritize sugar per serving, fallback to 100g, fallback to 0
        const sugarGrams = p.nutriments?.sugars_serving !== undefined
          ? parseFloat(p.nutriments.sugars_serving)
          : p.nutriments?.sugars_100g !== undefined
            ? parseFloat(p.nutriments.sugars_100g)
            : 0;

        const teaspoons = sugarGrams / 3.2;

        const servingSize = p.serving_size || undefined;
        const calories = p.nutriments?.['energy-kcal_serving'] !== undefined
          ? parseFloat(p.nutriments['energy-kcal_serving'])
          : p.nutriments?.['energy-kcal_100g'] !== undefined
            ? parseFloat(p.nutriments['energy-kcal_100g'])
            : undefined;
        const carbsGrams = p.nutriments?.carbohydrates_serving !== undefined
          ? parseFloat(p.nutriments.carbohydrates_serving)
          : p.nutriments?.carbohydrates_100g !== undefined
            ? parseFloat(p.nutriments.carbohydrates_100g)
            : undefined;
        const fatGrams = p.nutriments?.fat_serving !== undefined
          ? parseFloat(p.nutriments.fat_serving)
          : p.nutriments?.fat_100g !== undefined
            ? parseFloat(p.nutriments.fat_100g)
            : undefined;
        const proteinGrams = p.nutriments?.proteins_serving !== undefined
          ? parseFloat(p.nutriments.proteins_serving)
          : p.nutriments?.proteins_100g !== undefined
            ? parseFloat(p.nutriments.proteins_100g)
            : undefined;

        addScan(
          name,
          sugarGrams,
          brand,
          imageUrl,
          data,
          servingSize,
          calories,
          carbsGrams,
          fatGrams,
          proteinGrams
        );

        setScanResult({
          name,
          brand,
          sugarGrams,
          sugarTeaspoons: parseFloat(teaspoons.toFixed(1)),
          imageUrl,
          servingSize,
          calories,
          carbsGrams,
          fatGrams,
          proteinGrams,
        });
        setMode('result');
      } else {
        throw new Error('Product not found in Open Food Facts');
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg('Product not found. Try entering the sugar amount manually!');
      setMode('manual');
    } finally {
      setLoading(false);
      // Wait a bit before enabling barcode scanning again
      setTimeout(() => {
        setScanning(false);
        isScanningRef.current = false;
      }, 2000);
    }
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

    const teaspoons = sugarVal / 3.2;

    addScan(manualName, sugarVal, 'Custom Entry');

    setScanResult({
      name: manualName,
      brand: 'Custom Entry',
      sugarGrams: sugarVal,
      sugarTeaspoons: parseFloat(teaspoons.toFixed(1)),
    });

    setLoading(false);
    setMode('result');
    // Clear inputs
    setManualName('');
    setManualSugarGrams('');
  };

  const resetScanner = () => {
    setScanResult(null);
    setErrorMsg(null);
    isScanningRef.current = false;
    setScanning(false);
    setMode('camera');
  };

  if (!permission) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary }} className="mt-4 font-bold text-sm">Initializing camera...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* 1. Barcode Camera Mode */}
      {mode === 'camera' && (
        <View className="flex-1">
          {permission.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'upc_a', 'upc_e', 'ean13', 'ean8'],
              }}
              onBarcodeScanned={handleBarcodeScanned}
            >
              {/* Overlays */}
              <View className="flex-1 items-center justify-center bg-black/55">
                {/* Aiming Reticle */}
                <View className="w-72 h-72 border border-white/20 rounded-[32px] items-center justify-center bg-transparent relative">
                  {/* Glowing Corners */}
                  <View style={{ borderColor: colors.primary }} className="absolute top-0 left-0 w-8 h-8 border-t-[5px] border-l-[5px] rounded-tl-[28px]" />
                  <View style={{ borderColor: colors.primary }} className="absolute top-0 right-0 w-8 h-8 border-t-[5px] border-r-[5px] rounded-tr-[28px]" />
                  <View style={{ borderColor: colors.primary }} className="absolute bottom-0 left-0 w-8 h-8 border-b-[5px] border-l-[5px] rounded-bl-[28px]" />
                  <View style={{ borderColor: colors.primary }} className="absolute bottom-0 right-0 w-8 h-8 border-b-[5px] border-r-[5px] rounded-br-[28px]" />

                  {/* Pulsing Scanning Laser */}
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
                        shadowOpacity: 0.85,
                        shadowRadius: 6,
                        borderRadius: 1.5,
                      },
                      laserStyle,
                    ]}
                  />

                  <Text className="text-white/70 text-xs font-bold text-center absolute -bottom-12">
                    Align barcode inside the box
                  </Text>
                </View>
              </View>
            </CameraView>
          ) : (
            <View className="flex-1 items-center justify-center px-8 bg-stone-900">
              <AlertCircle size={48} color={colors.error} />
              <Text className="text-white text-lg font-black text-center mt-4">Camera Permission Required</Text>
              <Text className="text-stone-400 text-xs text-center mt-2 mb-6 leading-relaxed">
                We need camera access to scan barcode nutritional values automatically.
              </Text>
              <TouchableOpacity
                onPress={requestPermission}
                style={{ backgroundColor: colors.primary }}
                className="py-3 px-6 rounded-2xl active:opacity-90"
              >
                <Text className="text-white font-bold text-sm">Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Top Actions */}
          <SafeAreaView 
            className="absolute top-0 left-0 right-0 p-4 items-center justify-center"
            pointerEvents="box-none"
          >
            <View style={{ borderRadius: 99, overflow: 'hidden' }}>
              <BlurView
                intensity={50}
                tint="dark"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  position: 'absolute', top:10,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderWidth: 1.5,
                  borderColor: colors.primary + '40',
                }}
              >
                <Text style={{ color: colors.primary }} className="font-black text-xs uppercase tracking-wider">
                  Barcode Scanner
                </Text>
              </BlurView>
            </View>
          </SafeAreaView>

          {/* Centered Floating Manual Entry Button */}
          <View 
            style={{ position: 'absolute', bottom: 130, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setMode('manual');
              }}
              style={{ borderRadius: 99, overflow: 'hidden' }}
              activeOpacity={0.8}
            >
              <BlurView
                intensity={50}
                tint="dark"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderWidth: 1.5,
                  borderColor: colors.primary + '40',
                }}
              >
                <Keyboard size={14} color={colors.primary} />
                <Text style={{ color: colors.primary }} className="font-black text-xs uppercase tracking-wider">
                  Manual Entry
                </Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2. Manual Input Fallback Mode */}
      {mode === 'manual' && (
        <SafeAreaView style={{ flex: 1 }}>
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
            }} 
            className="flex-row items-center justify-between px-5 py-3.5"
          >
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={resetScanner}
                style={{ backgroundColor: colors.surfaceRaised }}
                className="p-2 rounded-full"
              >
                <ArrowLeft size={18} color={colors.text} />
              </TouchableOpacity>
              <Mascot state="idle" size={30} />
              <Text style={{ color: colors.text }} className="text-base font-black">Manual Sugar Log</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setMode('camera');
              }}
              className="flex-row items-center gap-1.5 py-1.5 px-3 rounded-full bg-purple-50 dark:bg-stone-850"
            >
              <CameraIcon size={12} color={colors.primary} />
              <Text style={{ color: colors.primary }} className="font-bold text-[10px]">Scan Mode</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {errorMsg && (
              <View
                style={{ backgroundColor: colors.error + '10', borderColor: colors.error + '30' }}
                className="border p-4 rounded-2xl mb-4 flex-row gap-3"
              >
                <AlertCircle size={18} color={colors.error} className="mt-0.5" />
                <Text style={{ color: colors.error }} className="text-xs font-bold flex-1">{errorMsg}</Text>
              </View>
            )}

            <View className="mb-5">
              <Text style={{ color: colors.textSecondary }} className="text-[10px] font-black uppercase tracking-wider mb-2 px-1">Product Name</Text>
              <TextInput
                value={manualName}
                onChangeText={setManualName}
                onFocus={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFocusName(true);
                }}
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
                }}
                className="w-full p-4 rounded-2xl font-bold text-sm"
              />
            </View>

            <View className="mb-6">
              <Text style={{ color: colors.textSecondary }} className="text-[10px] font-black uppercase tracking-wider mb-2 px-1">Total Sugar in Grams (g)</Text>
              <TextInput
                value={manualSugarGrams}
                onChangeText={(val) => {
                  setManualSugarGrams(val);
                  setErrorMsg(null);
                }}
                onFocus={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFocusSugar(true);
                }}
                onBlur={() => setFocusSugar(false)}
                keyboardType="numeric"
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
                }}
                className="w-full p-4 rounded-2xl font-black text-base"
              />
            </View>

            {/* Live Teaspoon Calculator Preview */}
            {parseFloat(manualSugarGrams) > 0 && (
              <View
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                className="mb-6 p-6 rounded-[24px] border items-center shadow-sm"
              >
                <Text style={{ color: colors.textSecondary }} className="text-[10px] font-bold uppercase tracking-wider mb-2">Live Conversion Preview</Text>
                <SugarPile teaspoons={parseFloat(manualSugarGrams) / 3.2} />
              </View>
            )}

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleManualSubmit();
              }}
              style={{ backgroundColor: colors.primary }}
              className="w-full py-4 rounded-2xl items-center justify-center mt-2 active:opacity-90 shadow-sm"
              activeOpacity={0.9}
            >
              <Text className="text-white font-bold text-sm">Convert to Teaspoons</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      )}

      {/* 3. Scan Result Display Mode */}
      {mode === 'result' && scanResult && (
        <SafeAreaView style={{ flex: 1 }}>
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
            }} 
            className="flex-row items-center px-5 py-3.5"
          >
            <TouchableOpacity
              onPress={resetScanner}
              style={{ backgroundColor: colors.surfaceRaised }}
              className="p-2 rounded-full"
            >
              <ArrowLeft size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ color: colors.text }} className="text-base font-black ml-4">Sugar Scan Result</Text>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              className="border p-6 rounded-[28px] shadow-sm items-center mb-6"
            >
              {scanResult.imageUrl && (
                <Image
                  source={{ uri: scanResult.imageUrl }}
                  className="w-28 h-28 rounded-2xl mb-4"
                  contentFit="contain"
                  transition={200}
                />
              )}

              <Text style={{ color: colors.text }} className="text-xl font-black text-center leading-tight">
                {scanResult.name}
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-[10px] font-bold uppercase tracking-wider mt-1 px-2.5 py-0.5 bg-stone-100 dark:bg-stone-850 rounded-full">
                {scanResult.brand}
              </Text>

              {/* Reactive Mascot */}
              <View className="my-4">
                <Mascot
                  state={
                    scanResult.sugarTeaspoons > 6
                      ? 'shocked'
                      : scanResult.sugarTeaspoons > 3
                        ? 'dizzy'
                        : 'happy'
                  }
                  size={110}
                />
              </View>

              {/* Teaspoon Pile Visualizer */}
              <SugarPile teaspoons={scanResult.sugarTeaspoons} />
            </View>

            {/* Nutrition Facts Label */}
            <NutritionFacts
              colors={colors}
              sugarGrams={scanResult.sugarGrams}
              calories={scanResult.calories}
              carbsGrams={scanResult.carbsGrams}
              fatGrams={scanResult.fatGrams}
              proteinGrams={scanResult.proteinGrams}
              servingSize={scanResult.servingSize}
            />

            {/* Health Interpretation Card */}
            <View
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              className="p-5 rounded-[24px] border shadow-sm mb-8 flex-row items-start gap-4"
            >
              <View
                style={{ backgroundColor: colors.primary + '12' }}
                className="p-2 rounded-xl self-start"
              >
                <HelpCircle size={18} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="font-bold text-sm">Sugar Reference Guide</Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs mt-2 leading-relaxed">
                  WHO recommends limiting free sugars to under <Text className="font-bold text-stone-850 dark:text-stone-100">6 teaspoons</Text> per day for adults. This product contains <Text className="font-bold text-stone-850 dark:text-stone-100">{scanResult.sugarTeaspoons} teaspoons</Text>, which matches <Text className="font-bold text-stone-850 dark:text-stone-100">{((scanResult.sugarTeaspoons / 6) * 100).toFixed(0)}%</Text> of that limit!
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={resetScanner}
              style={{ backgroundColor: colors.primary }}
              className="w-full py-4 rounded-2xl items-center justify-center mb-12 active:opacity-90 shadow-sm"
            >
              <Text className="text-white font-bold text-sm">Scan Another Item</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      )}

      {loading && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white font-bold text-sm mt-4">Analyzing nutritional values...</Text>
        </View>
      )}
    </View>
  );
}
