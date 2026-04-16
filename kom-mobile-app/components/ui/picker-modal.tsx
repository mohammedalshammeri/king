import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTranslation, useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface PickerModalProps {
  visible: boolean;
  title: string;
  items: Array<string | { value: string; label: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  hasOther?: boolean; // New prop to ensure "Other" is always available
}

export const PickerModal = ({ visible, title, items, selectedValue, onSelect, onClose, hasOther = true }: PickerModalProps) => {
  const { isDark } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useAppTranslation();
  
  // Ensure "أخرى" (Other) is in the list if hasOther is true
  const displayItems = items.map((item) => typeof item === 'string' ? { value: item, label: item } : item);
  const otherText = t('common.other');
  const canonicalOtherValue = 'أخرى';
  const isOtherOption = (value: string) => value === canonicalOtherValue || value === otherText;
  
  if (hasOther && !displayItems.some((item) => isOtherOption(item.value) || isOtherOption(item.label))) {
    displayItems.push({ value: canonicalOtherValue, label: otherText });
  }

  const theme = {
    card: isDark ? '#1e293b' : '#fff',
    text: isDark ? '#f8fafc' : '#1F2937',
    textMuted: isDark ? '#94a3b8' : '#6B7280',
    border: isDark ? '#334155' : '#E5E7EB',
    selectedBg: isDark ? '#334155' : '#F4F4F5',
    overlay: 'rgba(0, 0, 0, 0.5)',
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.modalTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalList}>
            {displayItems.map((item, index) => (
              (() => {
                const isSelected = selectedValue === item.value || (isOtherOption(item.value) && isOtherOption(selectedValue));
                const displayLabel = isOtherOption(item.value) ? otherText : item.label;

                return (
              <TouchableOpacity
                key={`${item.value}-${index}`}
                style={[
                  styles.modalItem,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  { borderBottomColor: theme.border },
                  isSelected && styles.modalItemSelected,
                  isSelected && { backgroundColor: theme.selectedBg },
                ]}
                onPress={() => {
                  onSelect(isOtherOption(item.value) ? canonicalOtherValue : item.value);
                  onClose();
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  { color: theme.text, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' },
                  isSelected && styles.modalItemTextSelected,
                ]}>
                  {displayLabel}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={20} color={isDark ? '#fff' : '#000'} />
                )}
              </TouchableOpacity>
                );
              })()
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    minHeight: 300,
  },
  modalHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalItemSelected: {
    // Style applied via code based on theme
  },
  modalItemText: {
    fontSize: 15,
    flex: 1,
  },
  modalItemTextSelected: {
    fontWeight: '600',
  },
});
