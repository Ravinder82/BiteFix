import React from 'react';
import { Linking, Modal, SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '../hooks/useTheme';
import { DISCLAIMER_SECTIONS } from '../constants/disclaimerContent';

export function MainDisclaimerModal({
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
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingVertical: 16,
          }}
        >
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

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, paddingBottom: 36, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 20,
              gap: 8,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>
              BiteFix Disclaimer
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 18 }}>
              Review this information before relying on scan results or product summaries.
            </Text>
          </View>

          {DISCLAIMER_SECTIONS.map((section) => (
            <View
              key={section.title}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 18,
                gap: 6,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 }}>
                {section.title}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
                {section.body}
              </Text>
              {section.links && section.links.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {section.links.map((link) => (
                    <TouchableOpacity
                      key={link.url}
                      onPress={() => Linking.openURL(link.url)}
                      style={{
                        backgroundColor: isDark ? 'rgba(110, 224, 65, 0.12)' : '#EBF8D6',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(110, 224, 65, 0.35)' : 'rgba(74, 138, 26, 0.3)',
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                      }}
                    >
                      <Text style={{ color: isDark ? '#6EE041' : '#2E5A0A', fontSize: 11.5, fontWeight: '800' }}>
                        {link.label} ↗
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
