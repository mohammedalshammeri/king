import React, { useEffect, useState } from 'react';
import AdsBanner from '@/components/ads/AdsBanner';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import { PageHeader } from '@/components/ui/page-header';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, uploadAvatar } = useAuthStore();
  const { isDark } = useTheme();

  const theme = {
    background: isDark ? '#0f172a' : '#fff',
    card: isDark ? '#111827' : '#fff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#1f2937' : '#e2e8f0',
    avatarBg: isDark ? '#1f2937' : '#f1f5f9',
    primary: '#D4AF37',
  };

  const isShowroom = user?.role === 'USER_SHOWROOM';
  const displayName = isShowroom
    ? user?.showroomProfile?.showroomName
    : user?.individualProfile?.fullName;
  const displayImage = isShowroom
    ? user?.showroomProfile?.logoUrl
    : user?.individualProfile?.avatarUrl;
  const avatarLetter = (displayName?.trim()?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setName(displayName || '');
    setPhone(user?.phone || '');
  }, [displayName, user?.phone]);

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('تنبيه', 'يرجى السماح بالوصول إلى الصور');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      setIsUploading(true);
      await uploadAvatar({
        uri: asset.uri,
        fileName: (asset as any).fileName,
        mimeType: (asset as any).mimeType,
        file: (asset as any).file,
      });
      Alert.alert('تم', 'تم تحديث الصورة بنجاح');
    } catch (error) {
      console.error('Upload avatar failed', error);
      Alert.alert('خطأ', 'فشل تحديث الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      Alert.alert('تنبيه', 'يرجى إدخال الاسم');
      return;
    }

    const payload: any = isShowroom
      ? { showroomName: trimmedName }
      : { fullName: trimmedName };

    if (trimmedPhone) {
      payload.phone = trimmedPhone;
    }

    try {
      setIsSaving(true);
      await updateProfile(payload);
      Alert.alert('تم', 'تم تحديث البيانات بنجاح');
      router.back();
    } catch (error: any) {
      console.error('Update profile failed', error);
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'فشل تحديث البيانات';
      Alert.alert('خطأ', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <PageHeader
        title="تعديل الملف الشخصي"
        variant="gradient"
        onBack={() => router.replace('/profile')}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: theme.avatarBg, borderColor: theme.border }]}>
            {displayImage ? (
              <Image source={{ uri: displayImage }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: theme.primary }]}>{avatarLetter}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.changePhoto} onPress={handlePickImage} disabled={isUploading}>
            {isUploading ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <Text style={[styles.changePhotoText, { color: theme.primary }]}>تغيير الصورة</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textMuted }]}>{isShowroom ? 'اسم الصالة' : 'الاسم الكامل'}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            value={name}
            onChangeText={setName}
            placeholder={isShowroom ? 'اسم الصالة' : 'الاسم الكامل'}
            textAlign="right"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textMuted }]}>رقم الهاتف</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="+97339001001"
            keyboardType="phone-pad"
            textAlign="right"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
          )}
        </TouchableOpacity>
        <AdsBanner />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    padding: 20,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 96,
    height: 96,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  changePhoto: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  changePhotoText: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  saveButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
