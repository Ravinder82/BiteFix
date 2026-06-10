import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, Modal, PanResponder, Animated } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useAppStore } from '../../stores/appStore';
import { useTheme } from '../../hooks/useTheme';
import { Mascot } from '../../components/features/Mascot';
import { SugarPile } from '../../components/features/SugarPile';
import { NutritionFacts } from '../../components/features/NutritionFacts';
import { ScanBarcode, Activity, ArrowRight, Info, Sparkles, Trash2, Clock, X, AlertTriangle } from 'lucide-react-native';
import { formatBloodSugarValue, getStatusColor, getStatusLabel } from '../../utils/bloodSugar';
import * as Haptics from 'expo-haptics';
import { ScanHistoryItem } from '../../types/app.types';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { logs, scans, deleteScan, clearScans } = useAppStore();
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null);

  // Animated value and PanResponder for drag/swipe down to close gesture
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Active gesture only on downward vertical drag
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120) {
          // Slide down completely and close modal
          Animated.timing(panY, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setSelectedScan(null);
            panY.setValue(0);
          });
        } else {
          // Bounce back to top position
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const latestLog = logs[0];
  const latestScan = scans[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Premium Custom Header */}
      <View 
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }} 
        className="flex-row items-center justify-between px-6 py-4"
      >
        <View className="flex-row items-center gap-3">
          {/* Cute Miniature Mascot Logo */}
          <Mascot state="idle" size={36} />
          <View>
            <Text 
              style={{ color: colors.text }} 
              className="text-lg font-black tracking-tight"
            >
              GoodBye Sugar
            </Text>
            <Text 
              style={{ color: colors.textSecondary }} 
              className="text-[9px] font-bold uppercase tracking-wider"
            >
              Teaspoon Scanner
            </Text>
          </View>
        </View>
        <View className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full">
          <Sparkles size={16} color={colors.primary} />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <View 
          style={{ backgroundColor: colors.surface, borderColor: colors.border }} 
          className="flex-row items-center justify-between p-6 rounded-[28px] border shadow-sm mb-6"
        >
          <View className="flex-1 pr-3">
            <Text 
              style={{ color: colors.primary }} 
              className="text-[10px] font-black uppercase tracking-widest"
            >
              Welcome Back
            </Text>
            <Text 
              style={{ color: colors.text }} 
              className="text-xl font-black mt-1 leading-tight"
            >
              Ready to see the sugar?
            </Text>
            <Text 
              style={{ color: colors.textSecondary }} 
              className="text-xs mt-2 leading-relaxed"
            >
              Let's scan barcodes to reveal hidden sugars and track your glucose log.
            </Text>
          </View>
          <Mascot state={latestScan && latestScan.sugarTeaspoons > 6 ? 'shocked' : 'happy'} size={80} />
        </View>

        {/* Premium Call To Action Button */}
        <TouchableOpacity
          onPress={() => router.push('/scanner')}
          style={{ backgroundColor: colors.primary }}
          className="w-full p-5 rounded-[24px] flex-row items-center justify-between shadow-md mb-6 active:opacity-90"
        >
          <View className="flex-row items-center gap-4">
            <View className="p-3 bg-white/10 rounded-xl">
              <ScanBarcode size={24} color="white" />
            </View>
            <View>
              <Text className="text-white text-base font-black leading-tight">Scan Packaged Food</Text>
              <Text className="text-white/70 text-xs mt-1">Converts grams of sugar to teaspoons</Text>
            </View>
          </View>
          <View className="p-2 bg-white/10 rounded-full">
            <ArrowRight size={16} color="white" />
          </View>
        </TouchableOpacity>

        {/* Dashboard Grid */}
        <View className="flex-row gap-4 mb-6">
          {/* Latest Scan Card */}
          <TouchableOpacity
            onPress={() => router.push('/scanner')}
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            className="flex-1 p-5 border rounded-[24px] shadow-sm justify-between min-h-[135px]"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text style={{ color: colors.textSecondary }} className="text-[9px] font-bold uppercase tracking-wider">Latest Scan</Text>
              <ScanBarcode size={14} color={colors.primary} />
            </View>
            {latestScan ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={{ color: colors.text }} className="text-2xl font-black leading-none">
                    {latestScan.sugarTeaspoons} <Text style={{ color: colors.textSecondary }} className="text-xs font-bold">tsp</Text>
                  </Text>
                  <Text numberOfLines={1} style={{ color: colors.text }} className="text-[11px] font-bold mt-2">
                    {latestScan.name}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-[9px] mt-0.5">
                    ({latestScan.sugarGrams}g sugar)
                  </Text>
                </View>
                {latestScan.imageUrl ? (
                  <Image
                    source={{ uri: latestScan.imageUrl }}
                    style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border }}
                    contentFit="contain"
                    transition={200}
                  />
                ) : (
                  <View 
                    style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: 10, 
                      backgroundColor: colors.primary + '12', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}
                  >
                    <ScanBarcode size={18} color={colors.primary} />
                  </View>
                )}
              </View>
            ) : (
              <View className="py-1">
                <Text style={{ color: colors.textMuted }} className="text-xs italic">No items scanned</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Latest Blood Sugar Card */}
          <TouchableOpacity
            onPress={() => router.push('/tracker')}
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            className="flex-1 p-5 border rounded-[24px] shadow-sm justify-between min-h-[125px]"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text style={{ color: colors.textSecondary }} className="text-[9px] font-bold uppercase tracking-wider">Latest Log</Text>
              <Activity size={14} color={colors.secondary} />
            </View>
            {latestLog ? (
              <View>
                <Text style={{ color: colors.text }} className="text-2xl font-black leading-none">
                  {formatBloodSugarValue(latestLog.value, latestLog.unit)}{' '}
                  <Text style={{ color: colors.textSecondary }} className="text-[10px] font-bold">{latestLog.unit}</Text>
                </Text>
                {/* Health Range Pill */}
                <View 
                  style={{ backgroundColor: getStatusColor(latestLog.status, colors) + '15' }}
                  className="px-2.5 py-0.5 rounded-full self-start mt-2"
                >
                  <Text 
                    style={{ color: getStatusColor(latestLog.status, colors) }}
                    className="text-[8px] font-black uppercase tracking-wider"
                  >
                    {getStatusLabel(latestLog.status)}
                  </Text>
                </View>
              </View>
            ) : (
              <View className="py-1">
                <Text style={{ color: colors.textMuted }} className="text-xs italic">No logs recorded</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Premium Educational Banner */}
        <View 
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.secondary, borderLeftWidth: 4 }} 
          className="p-5 rounded-r-[24px] rounded-l-[8px] border shadow-sm mb-6 flex-row gap-4"
        >
          <View 
            style={{ backgroundColor: colors.secondary + '12' }} 
            className="p-2.5 rounded-xl self-start"
          >
            <Info size={18} color={colors.secondary} />
          </View>
          <View className="flex-1">
            <Text style={{ color: colors.text }} className="font-bold text-sm">Why Teaspoons instead of Grams?</Text>
            <Text style={{ color: colors.textSecondary }} className="text-xs mt-2 leading-relaxed">
              Grams are abstract, but teaspoons are tangible. We convert sugar content using the standard conversion of <Text className="font-bold">1 teaspoon = 3.2 grams</Text>. Seeing sugar content in teaspoons helps you make quick, intuitive healthy choices.
            </Text>
          </View>
        </View>

        {/* Scan History Section */}
        <View className="mb-12">
          <View className="flex-row items-center justify-between mb-4 px-1">
            <Text style={{ color: colors.text }} className="font-black text-sm">
              Scan History
            </Text>
            {scans.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert(
                    'Clear History',
                    'Are you sure you want to clear your scanned food history?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear All', style: 'destructive', onPress: () => clearScans() }
                    ]
                  );
                }}
              >
                <Text style={{ color: colors.primary }} className="text-xs font-black">
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {scans.length === 0 ? (
            <View 
              style={{ backgroundColor: colors.surface, borderColor: colors.border }} 
              className="border p-6 rounded-[24px] items-center justify-center shadow-sm"
            >
              <ScanBarcode size={24} color={colors.textMuted} />
              <Text style={{ color: colors.textSecondary }} className="text-xs font-bold mt-2">
                No items scanned yet
              </Text>
              <Text style={{ color: colors.textMuted }} className="text-[10px] mt-1 text-center">
                Tap 'Scan Packaged Food' to scan your first product.
              </Text>
            </View>
          ) : (
            scans.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  panY.setValue(0);
                  setSelectedScan(item);
                }}
                style={{ 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 20,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  elevation: 1
                }}
                activeOpacity={0.95}
              >
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {/* Product Image */}
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: '#ffffff' }}
                      contentFit="contain"
                      transition={200}
                    />
                  ) : (
                    <View 
                      style={{ 
                        width: 52, 
                        height: 52, 
                        borderRadius: 12, 
                        backgroundColor: colors.primary + '12', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      <ScanBarcode size={22} color={colors.primary} />
                    </View>
                  )}

                  {/* Product Metadata */}
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text 
                      numberOfLines={1} 
                      style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}
                    >
                      {item.name}
                    </Text>
                    <Text 
                      numberOfLines={1} 
                      style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}
                    >
                      {item.brand || 'Generic Brand'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <Clock size={10} color={colors.textMuted} />
                      <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '600' }}>
                        {new Date(item.timestamp).toLocaleDateString()} · {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Right Side: Sugar Teaspoons & Delete Action */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ alignItems: 'flex-end', marginRight: 2 }}>
                    <Text 
                      style={{ color: getSugarColor(item.sugarTeaspoons, colors), fontSize: 15, fontWeight: '900', lineHeight: 15 }}
                    >
                      {item.sugarTeaspoons} <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700' }}>tsp</Text>
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 9, marginTop: 2 }}>
                      ({item.sugarGrams}g)
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      deleteScan(item.id);
                    }}
                    style={{ 
                      backgroundColor: colors.background,
                      padding: 8,
                      borderRadius: 10
                    }}
                    activeOpacity={0.85}
                  >
                    <Trash2 size={13} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Scan Details Modal */}
      <Modal
        visible={selectedScan !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedScan(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <TouchableOpacity 
            className="flex-1" 
            activeOpacity={1} 
            onPress={() => setSelectedScan(null)} 
          />
          <Animated.View 
            style={{ 
              backgroundColor: colors.surface, 
              transform: [{ translateY: panY }],
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              maxHeight: '85%',
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 10
            }}
          >
            {/* Drag Handle Area */}
            <View 
              {...panResponder.panHandlers} 
              style={{ width: '100%', alignItems: 'center', paddingBottom: 12 }}
            >
              {/* Modal Pull Bar */}
              <View style={{ width: 48, height: 5, backgroundColor: isDark ? '#444' : '#ccc', borderRadius: 3, marginBottom: 8 }} />
              
              {/* Modal Header */}
              <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>
                  Product Details
                </Text>
                <TouchableOpacity 
                  onPress={() => setSelectedScan(null)}
                  style={{ backgroundColor: colors.background, padding: 8, borderRadius: 20 }}
                >
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {selectedScan && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Product Summary Card */}
                <View 
                  style={{ backgroundColor: colors.background, borderColor: colors.border }} 
                  className="border p-5 rounded-[24px] items-center mb-5"
                >
                  {selectedScan.imageUrl ? (
                    <Image
                      source={{ uri: selectedScan.imageUrl }}
                      className="w-24 h-24 rounded-2xl mb-4"
                      contentFit="contain"
                      transition={200}
                    />
                  ) : (
                    <View 
                      style={{ backgroundColor: colors.primary + '12' }} 
                      className="w-24 h-24 rounded-2xl items-center justify-center mb-4"
                    >
                      <ScanBarcode size={36} color={colors.primary} />
                    </View>
                  )}
                  
                  <Text style={{ color: colors.text }} className="text-lg font-black text-center leading-tight">
                    {selectedScan.name}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-[10px] font-bold uppercase tracking-wider mt-1 px-3 py-1 bg-white dark:bg-stone-900 rounded-full border border-stone-100 dark:border-stone-800">
                    {selectedScan.brand || 'Generic Brand'}
                  </Text>
                  {selectedScan.barcode && (
                    <Text style={{ color: colors.textMuted }} className="text-[9px] font-mono mt-1.5">
                      Barcode: {selectedScan.barcode}
                    </Text>
                  )}
                </View>

                {/* Mascot Reacts */}
                <View className="items-center mb-4">
                  <Mascot 
                    state={
                      selectedScan.sugarTeaspoons > 6 
                        ? 'shocked' 
                        : selectedScan.sugarTeaspoons > 3 
                          ? 'dizzy' 
                          : 'happy'
                    }
                    size={100}
                  />
                </View>

                {/* Sugar Teaspoon Pile representation */}
                <SugarPile teaspoons={selectedScan.sugarTeaspoons} />

                {/* Nutrition Facts Label */}
                <NutritionFacts
                  colors={colors}
                  sugarGrams={selectedScan.sugarGrams}
                  calories={selectedScan.calories}
                  carbsGrams={selectedScan.carbsGrams}
                  fatGrams={selectedScan.fatGrams}
                  proteinGrams={selectedScan.proteinGrams}
                  servingSize={selectedScan.servingSize}
                />

                {/* Info and WHO guidance */}
                <View 
                  style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border }} 
                  className="p-4 rounded-[20px] border flex-row gap-3 items-start mb-6"
                >
                  <AlertTriangle size={18} color={selectedScan.sugarTeaspoons > 6 ? colors.error : colors.warning} className="mt-0.5" />
                  <View className="flex-1">
                    <Text style={{ color: colors.text }} className="text-xs font-bold">Sugar Limit Analysis</Text>
                    <Text style={{ color: colors.textSecondary }} className="text-[11px] mt-1 leading-relaxed">
                      WHO recommends limiting free sugars to under 6 teaspoons per day. This product contains {selectedScan.sugarTeaspoons} tsp ({selectedScan.sugarGrams}g), which takes up <Text className="font-bold">{( (selectedScan.sugarTeaspoons / 6) * 100 ).toFixed(0)}%</Text> of your entire daily sugar budget!
                    </Text>
                  </View>
                </View>

                {/* Delete scan option from details */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      Alert.alert(
                        'Delete Scan',
                        'Remove this item from your scan history?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Delete', 
                            style: 'destructive', 
                            onPress: () => {
                              deleteScan(selectedScan.id);
                              setSelectedScan(null);
                            }
                          }
                        ]
                      );
                    }}
                    style={{ borderColor: colors.error }}
                    className="flex-1 py-3.5 border rounded-2xl flex-row items-center justify-center gap-2 active:opacity-90"
                  >
                    <Trash2 size={16} color={colors.error} />
                    <Text style={{ color: colors.error }} className="font-bold text-xs">Delete From History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedScan(null)}
                    style={{ backgroundColor: colors.primary }}
                    className="flex-1 py-3.5 rounded-2xl items-center justify-center active:opacity-95"
                  >
                    <Text className="text-white font-bold text-xs">Close Details</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Helpers
function getSugarColor(teaspoons: number, colors: any) {
  if (teaspoons > 6) {
    return colors.error || '#ef4444';
  }
  if (teaspoons > 3) {
    return colors.warning || '#eab308';
  }
  return colors.success || '#10b981';
}
