import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppTranslation, useLanguage } from '@/context/LanguageContext';
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
export default function ModalScreen() {
  const { t } = useAppTranslation();
  const { isRTL } = useLanguage();
  return (
    <View style={[styles.container]}>
      <TouchableOpacity onPress={() => router.back()} style={[styles.closeButton, { right: isRTL ? 20 : undefined, left: isRTL ? undefined : 20 }]}>
        <Ionicons name="close" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={[styles.title, { textAlign: 'auto'}]}>{t('modalScreen.title')}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/modal.tsx" />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    padding: 10,
    zIndex: 10,
  },
});
