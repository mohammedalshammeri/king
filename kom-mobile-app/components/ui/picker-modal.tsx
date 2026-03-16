import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface PickerModalProps {
  visible: boolean;
  title: string;
  items: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  hasOther?: boolean; // New prop to ensure "Other" is always available
}

export const PickerModal = ({ visible, title, items, selectedValue, onSelect, onClose, hasOther = true }: PickerModalProps) => {
  const { isDark } = useTheme();
  
  // Ensure "أخرى" (Other) is in the list if hasOther is true
  const displayItems = [...items];
  const otherText = 'أخرى';
  
  if (hasOther && !displayItems.includes(otherText)) {
    displayItems.push(otherText);
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
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalList}>
            {displayItems.map((item, index) => (
              <TouchableOpacity
                key={`${item}-${index}`}
                style={[
                  styles.modalItem,
                  { borderBottomColor: theme.border },
                  selectedValue === item && styles.modalItemSelected,
                  selectedValue === item && { backgroundColor: theme.selectedBg },
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  { color: theme.text },
                  selectedValue === item && styles.modalItemTextSelected,
                ]}>
                  {item}
                </Text>
                {selectedValue === item && (
                  <Ionicons name="checkmark" size={20} color={isDark ? '#fff' : '#000'} />
                )}
              </TouchableOpacity>
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    flexDirection: 'row-reverse',
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
    textAlign: 'right',
    flex: 1,
  },
  modalItemTextSelected: {
    fontWeight: '600',
  },
});
