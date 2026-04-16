import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { useAppTranslation, useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { PageHeader } from '@/components/ui/page-header';

type ListingType = 'CAR' | 'PLATE' | 'PART' | 'MOTORCYCLE';

interface TypeOption {
  type: ListingType;
  title: string;
  summary: string;
  fields: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const typeOptions: TypeOption[] = [
  { type: 'CAR', title: '', summary: '', fields: '', icon: 'car-sport' },
  { type: 'MOTORCYCLE', title: '', summary: '', fields: '', icon: 'bicycle' },
  { type: 'PLATE', title: '', summary: '', fields: '', icon: 'document-text' },
  { type: 'PART', title: '', summary: '', fields: '', icon: 'settings' },
];

export default function AddListingScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useAppTranslation();
  const { isRTL } = useLanguage();
  const { isDark } = useTheme();
  const [selectedType, setSelectedType] = useState<ListingType | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const localizedTypeOptions: TypeOption[] = useMemo(() => [
    { type: 'CAR', title: t('addHub.carTitle'), summary: t('addHub.carSummary'), fields: t('addHub.carFields'), icon: 'car-sport' },
    { type: 'MOTORCYCLE', title: t('addHub.motorcycleTitle'), summary: t('addHub.motorcycleSummary'), fields: t('addHub.motorcycleFields'), icon: 'bicycle' },
    { type: 'PLATE', title: t('addHub.plateTitle'), summary: t('addHub.plateSummary'), fields: t('addHub.plateFields'), icon: 'document-text' },
    { type: 'PART', title: t('addHub.partTitle'), summary: t('addHub.partSummary'), fields: t('addHub.partFields'), icon: 'settings' },
  ], [t]);

  const selectedOption = useMemo(
    () => localizedTypeOptions.find((option) => option.type === selectedType) ?? localizedTypeOptions[0],
    [localizedTypeOptions, selectedType]
  );

  const theme = {
    background: isDark ? Colors.dark.background : Colors.background,
    card: isDark ? Colors.dark.surface : Colors.surface,
    text: isDark ? Colors.dark.text : Colors.text,
    textMuted: isDark ? '#94a3b8' : Colors.textSecondary,
    border: isDark ? '#1f2937' : Colors.border,
    primary: Colors.primary,
  };

  const dirText = { textAlign: isRTL ? 'right' as const : 'left' as const, writingDirection: isRTL ? 'rtl' as const : 'ltr' as const };
  const rowDirection = { flexDirection: isRTL ? 'row-reverse' as const : 'row' as const };

  const getDraftTitle = (type: ListingType) => {
    switch (type) {
      case 'CAR':
        return t('addHub.draftCar');
      case 'MOTORCYCLE':
        return t('addHub.draftMotorcycle');
      case 'PLATE':
        return t('addHub.draftPlate');
      case 'PART':
        return t('addHub.draftPart');
      default:
        return t('addHub.draftGeneric');
    }
  };

  const handleStart = async () => {
    const type = selectedType ?? 'CAR';
    if (!isAuthenticated) {
      Alert.alert(
        t('addHub.loginRequiredTitle'),
        t('addHub.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    setIsCreating(true);
    try {
      const response = await api.post('/listings', {
        type,
        title: getDraftTitle(type),
        price: 0,
        currency: 'BHD',
      });

      const listingId = response.data.data.id;

      router.push({ pathname: '/add-listing/[id]', params: { id: listingId, type } });
    } catch (error: any) {
      console.error('Failed to create draft listing:', error);
      Alert.alert(t('common.error'), error.response?.data?.message || t('addHub.startCreateFailed'), [{ text: t('common.ok') }]);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader
        title={t('addHub.addNewListing')}
        variant="gradient"
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.heroTitle, { color: theme.text }, dirText]}>{t('addHub.chooseTypeTitle')}</Text>
          <Text style={[styles.heroDescription, { color: theme.textMuted }, dirText]}>{t('addHub.chooseTypeDescription')}</Text>
        </View>

        <View style={[styles.chipsContainer, rowDirection]}>
          {localizedTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.typeChip,
                { backgroundColor: theme.card, borderColor: theme.border },
                (selectedType ?? 'CAR') === option.type && [styles.typeChipActive, { borderColor: theme.primary, backgroundColor: isDark ? '#0b1835' : '#eff6ff' }],
              ]}
              onPress={() => setSelectedType(option.type)}
              disabled={isCreating}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={(selectedType ?? 'CAR') === option.type ? theme.primary : theme.textMuted}
              />
              <Text style={[styles.typeChipText, { color: (selectedType ?? 'CAR') === option.type ? theme.primary : theme.text }, dirText]}>{option.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.previewCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.previewTitle, { color: theme.text }, dirText]}>{selectedOption.title}</Text>
          <Text style={[styles.previewSummary, { color: theme.textMuted }, dirText]}>{selectedOption.summary}</Text>
          <Text style={[styles.previewFieldsLabel, { color: theme.text }, dirText]}>{t('addHub.basicFieldsLabel')}</Text>
          <Text style={[styles.previewFields, { color: theme.textMuted }, dirText]}>{selectedOption.fields}</Text>
        </View>

        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: theme.primary }, rowDirection, isCreating && styles.startButtonDisabled]}
          onPress={handleStart}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={18} color="#FFFFFF" />
              <Text style={[styles.startButtonText, dirText]}>{t('addHub.startAdding', { type: selectedOption.title })}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'flex-end',
    width: '100%',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'flex-end',
    width: '100%',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typeChipActive: {
    borderWidth: 1.5,
  },
  typeChipText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'flex-end',
    width: '100%',
    marginBottom: 6,
  },
  previewSummary: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'flex-end',
    width: '100%',
  },
  previewFieldsLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'flex-end',
    width: '100%',
  },
  previewFields: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'flex-end',
    width: '100%',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
});
