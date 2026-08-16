import React from 'react';
import { Modal, SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '../hooks/useTheme';
import { DISCLAIMER_SECTIONS } from '../constants/disclaimerContent';

export function PaywallDisclaimerModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(6, 10, 12, 0.56)',
          justifyContent: 'flex-end',
        }}
      >
        <SafeAreaView
          style={{
            maxHeight: '86%',
            backgroundColor: colors.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: 'hidden',
            borderTopWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 14,
              paddingBottom: 16,
              backgroundColor: colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 44,
                height: 5,
                borderRadius: 999,
                backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
                marginBottom: 14,
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ width: 56 }} />
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' }}>
                Disclaimer
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 18,
                gap: 8,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 }}>
                BiteFix Disclaimer
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 18 }}>
                Review this information before subscribing or relying on app results.
              </Text>
            </View>

            {DISCLAIMER_SECTIONS.map((section) => (
              <View
                key={section.title}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  gap: 6,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: '800', letterSpacing: -0.2 }}>
                  {section.title}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 19 }}>
                  {section.body}
                </Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
