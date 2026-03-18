import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { MotorcycleBrands, VehicleColors } from '@/constants/CarData';
import { PickerModal } from '@/components/ui/picker-modal';
import api from '@/services/api';
import { Image } from 'expo-image';
import { useTheme } from '@/context/ThemeContext';
import { rtlStyles } from '@/lib/rtl';
import { PageHeader } from '@/components/ui/page-header';
import { useAuthStore } from '@/store/authStore';

type ListingType = 'CAR' | 'PLATE' | 'PART' | 'MOTORCYCLE';

interface ListingFormData {
  title: string;
  description: string;
  price: string;
  locationGovernorate: string;
  locationArea: string;
  contactPreference: 'CALL' | 'WHATSAPP' | 'IN_APP_CHAT';
}

interface CarDetails {
  make: string;
  model: string;
  year: string;
  mileageKm: string;
  transmission: 'AUTO' | 'MANUAL';
  fuel: 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';
  condition: 'NEW' | 'USED';
  color: string;
  trim: string;
  bodyType: string;
  interiorColor: string;
  bodyCondition: string;
  paintType: string;
}

interface MotorcycleDetails {
  make: string;
  model: string;
  year: string;
  mileageKm: string;
  transmission: 'AUTO' | 'MANUAL';
  condition: 'NEW' | 'USED';
  color: string;
  engineSize: string;
  bodyType: string;
}

interface PlateDetails {
  plateNumber: string;
  plateCategory: string;
  plateCode: string;
  plateType: 'PRIVATE' | 'TRANSPORT' | 'MOTORCYCLE';
}

interface PartDetails {
  partCategory: string;
  partName: string;
  compatibleCarMake: string;
  compatibleCarModel: string;
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  deliveryAvailable: boolean;
}

interface MediaItem {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
}

const GOVERNORATES: { [key: string]: string[] } = {
  'العاصمة': [
    'المنامة', 'الجفير', 'العدلية', 'ام الحصم', 'الزنج', 'السلمانية', 'البلاد القديم', 
    'توبلي', 'جدحفص', 'السنابس', 'ضاحية السيف', 'كرباباد', 'النبيه صالح', 'سترة', 
    'العكر', 'المعامير', 'جزيرة الريف', 'مرفأ البحرين المالي', 'خليج البحرين', 'القضيبية', 'الحورة', 'النعيم'
  ],
  'المحرق': [
    'المحرق', 'حالة بوماهر', 'عراد', 'الحد', 'البسيتين', 'سماهيج', 'الدير', 'قلالي', 
    'جزر أمواج', 'ديار المحرق', 'دلمونيا'
  ],
  'الشمالية': [
    'مدينة حمد', 'البديع', 'الجنبية', 'سار', 'بوري', 'الهملة', 'دمستان', 'كرزكان', 
    'المالكية', 'صدد', 'دار كليب', 'شهركان', 'جدة', 'مدينة سلمان', 'المقشع', 'باربار', 
    'الدراز', 'بني جمرة', 'المرخ', 'أبوصيبع', 'الشاخورة', 'قدم', 'الحجر', 'جبلة حبشي', 
    'السهلة', 'عالي', 'سلماباد', 'مقابة'
  ],
  'الجنوبية': [
    'الرفاع الغربي', 'الرفاع الشرقي', 'الرفاع الشمالي', 'مدينة عيسى', 'سند', 'جرداب', 
    'عوالي', 'عسكر', 'جو', 'الدور', 'الزلاق', 'درة البحرين', 'جزر حوار', 'البحير', 
    'وادي السيل', 'الحجيات', 'سافرة', 'الرميثة'
  ]
};

const contactPreferences = [
  { value: 'CALL' as const, label: 'مكالمة هاتفية' },
  { value: 'WHATSAPP' as const, label: 'واتساب' },
  { value: 'IN_APP_CHAT' as const, label: 'دردشة داخل التطبيق' },
];

export default function AddListingDetailScreen() {
  const params = useLocalSearchParams<{ id: string; type: ListingType; mode?: 'edit' }>();
  const { id: listingId, type, mode } = params;
  const isEditMode = mode === 'edit';
  const { isDark } = useTheme();
  const theme = {
    background: isDark ? '#0f172a' : '#f8f9fa',
    surface: isDark ? '#1f2937' : '#fff',
    card: isDark ? '#1f2937' : '#fff',
    border: isDark ? '#334155' : '#e5e5e5',
    text: isDark ? '#e5e7eb' : '#1f2937',
    textMuted: isDark ? '#94a3b8' : '#9ca3af',
    subText: isDark ? '#cbd5e1' : '#6b7280',
    primary: Colors.primary,
  };

  const inputStyle = [styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }];
  const pickerItemStyle = [styles.pickerItem, { backgroundColor: theme.card, borderColor: theme.border }];

  const [step, setStep] = useState(1); // 1: Basic Info, 2: Specific Details, 3: Images
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [listingStatus, setListingStatus] = useState<string | null>(null);

  // Motorcycle Modals
  const [showMotorcycleMakeModal, setShowMotorcycleMakeModal] = useState(false);
  const [showMotorcycleModelModal, setShowMotorcycleModelModal] = useState(false);
  const [showMotorcycleColorModal, setShowMotorcycleColorModal] = useState(false);
  
  // Custom Flags
  const [isCustomMotorcycleMake, setIsCustomMotorcycleMake] = useState(false);
  const [isCustomMotorcycleModel, setIsCustomMotorcycleModel] = useState(false);
  const [isCustomMotorcycleColor, setIsCustomMotorcycleColor] = useState(false);

  // Car Modals
  const [showCarColorModal, setShowCarColorModal] = useState(false);
  const [isCustomCarColor, setIsCustomCarColor] = useState(false);

  // Location Modals
  const [showGovernorateModal, setShowGovernorateModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    price: '',
    locationGovernorate: Object.keys(GOVERNORATES)[0],
    locationArea: '',
    contactPreference: 'CALL',
  });

  const [carDetails, setCarDetails] = useState<CarDetails>({
    make: '',
    model: '',
    year: '',
    mileageKm: '',
    transmission: 'AUTO',
    fuel: 'PETROL',
    condition: 'USED',
    color: '',
    trim: '',
    bodyType: '',
    interiorColor: '',
    bodyCondition: '',
    paintType: '',
  });

  const [motorcycleDetails, setMotorcycleDetails] = useState<MotorcycleDetails>({
    make: '',
    model: '',
    year: '',
    mileageKm: '',
    transmission: 'AUTO',
    condition: 'USED',
    color: '',
    engineSize: '',
    bodyType: 'رياضية',
  });

  const [plateDetails, setPlateDetails] = useState<PlateDetails>({
    plateNumber: '',
    plateCategory: 'Private',
    plateCode: '',
    plateType: 'PRIVATE',
  });

  const [partDetails, setPartDetails] = useState<PartDetails>({
    partCategory: '',
    partName: '',
    compatibleCarMake: '',
    compatibleCarModel: '',
    condition: 'USED',
    deliveryAvailable: false,
  });

  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [existingMedia, setExistingMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!listingId || hasPrefilled) return;
    let isMounted = true;

    const loadListing = async () => {
      setIsPrefilling(true);
      try {
        let response;
        try {
          response = await api.get(`/listings/my/${listingId}`);
        } catch (err: any) {
          if (err?.response?.status === 404) {
            response = await api.get(`/listings/${listingId}`);
          } else {
            throw err;
          }
        }

        const payload = response.data?.data ?? response.data;
        if (!payload || !isMounted) return;

        setListingStatus(payload.status || null);

        const govKeys = Object.keys(GOVERNORATES);
        const governorate = payload.locationGovernorate && govKeys.includes(payload.locationGovernorate)
          ? payload.locationGovernorate
          : govKeys[0];

        const priceValue = payload.price ?? '';
        const priceText = typeof priceValue === 'number'
          ? String(priceValue)
          : String(priceValue || '');

        setFormData({
          title: payload.title || '',
          description: payload.description || '',
          price: priceText,
          locationGovernorate: governorate,
          locationArea: payload.locationArea || '',
          contactPreference: payload.contactPreference || 'CALL',
        });

        const car = payload.carDetails || payload.details?.car || payload.car || null;
        if (car) {
          const specs = car.specs && typeof car.specs === 'object' ? car.specs : {};
          setCarDetails((prev) => ({
            ...prev,
            make: car.make || '',
            model: car.model || '',
            year: car.year ? String(car.year) : '',
            mileageKm: car.mileageKm ? String(car.mileageKm) : '',
            transmission: car.transmission || prev.transmission,
            fuel: car.fuel || prev.fuel,
            condition: car.condition || prev.condition,
            color: car.color || '',
            trim: car.trim || '',
            bodyType: car.bodyType || '',
            interiorColor: String((specs as any).interiorColor || ''),
            bodyCondition: String((specs as any).bodyCondition || ''),
            paintType: String((specs as any).paintType || (specs as any).paint || ''),
          }));
        }

        const motorcycle = payload.motorcycleDetails || payload.details?.motorcycle || payload.motorcycle || null;
        if (motorcycle) {
          setMotorcycleDetails((prev) => ({
            ...prev,
            make: motorcycle.make || '',
            model: motorcycle.model || '',
            year: motorcycle.year ? String(motorcycle.year) : '',
            mileageKm: motorcycle.mileageKm ? String(motorcycle.mileageKm) : '',
            transmission: motorcycle.transmission || prev.transmission,
            condition: motorcycle.condition || prev.condition,
            engineSize: motorcycle.engineSize || '',
            bodyType: motorcycle.bodyType || 'رياضية',
          }));
        }

        const plate = payload.plateDetails || payload.details?.plate || payload.plate || null;
        if (plate) {
          setPlateDetails({
            plateNumber: plate.plateNumber || '',
            plateCategory: plate.plateCategory || 'Private',
            plateCode: plate.plateCode || '',
            plateType: plate.plateType || 'PRIVATE',
          });
        }

        const part = payload.partDetails || payload.details?.part || payload.part || null;
        if (part) {
          setPartDetails({
            partCategory: part.partCategory || '',
            partName: part.partName || '',
            compatibleCarMake: part.compatibleCarMake || '',
            compatibleCarModel: part.compatibleCarModel || '',
            condition: part.condition || 'USED',
            deliveryAvailable: part.deliveryAvailable || false,
          });
        }

        const mediaItems: MediaItem[] = Array.isArray(payload.media)
          ? payload.media
              .map((m: any) => ({
                id: m?.id,
                url: m?.url,
                type: m?.type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
              }))
              .filter((m: any) => m?.id && m?.url)
          : [];
        setExistingMedia(mediaItems);
        setHasPrefilled(true);
      } catch (error) {
        console.warn('Failed to prefill listing data:', error);
      } finally {
        if (isMounted) setIsPrefilling(false);
      }
    };

    loadListing();
    return () => {
      isMounted = false;
    };
  }, [listingId, hasPrefilled]);

  const handleNextStep = async () => {
    // Validate current step
    let titleToSave = formData.title;

    if (step === 1) {
      if (type === 'MOTORCYCLE') {
         if (!motorcycleDetails.make || !motorcycleDetails.model || !motorcycleDetails.year) {
             Alert.alert('تنبيه', 'يرجى تعبئة جميع الحقول المطلوبة (الشركة، الموديل، السنة)');
             return;
         }
         titleToSave = `${motorcycleDetails.make} ${motorcycleDetails.model} ${motorcycleDetails.year}`;
         setFormData(prev => ({ ...prev, title: titleToSave }));
      } else {
        // Only validate title length if it's NOT a motorcycle
         if (!titleToSave || titleToSave.trim().length < 5) {
            Alert.alert('خطأ', 'العنوان يجب أن يكون 5 أحرف على الأقل');
            return;
         }
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        Alert.alert('خطأ', 'السعر يجب أن يكون أكبر من صفر');
        return;
      }

      // Save basic info
      await saveBasicInfo(titleToSave);
      
      // Auto-save specific details right away for motorcycles to avoid data loss on step switch
      if (type === 'MOTORCYCLE') {
         await api.post(`/listings/${listingId}/details/motorcycle`, {
          make: motorcycleDetails.make,
          model: motorcycleDetails.model,
          year: parseInt(motorcycleDetails.year),
          mileageKm: parseInt(motorcycleDetails.mileageKm) || 0,
          transmission: motorcycleDetails.transmission,
          condition: motorcycleDetails.condition,
          color: motorcycleDetails.color,
          engineSize: motorcycleDetails.engineSize,
          bodyType: motorcycleDetails.bodyType,
        });
      }
    } else if (step === 2) {
      // Validate and save specific details
      await saveSpecificDetails();
    }

    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const saveBasicInfo = async (titleOverride?: string) => {
    setIsSaving(true);
    try {
      const response = await api.patch(`/listings/${listingId}`, {
        title: titleOverride || formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        locationGovernorate: formData.locationGovernorate,
        locationArea: formData.locationArea,
        contactPreference: formData.contactPreference,
      });
      const updated = response.data?.data ?? response.data;
      if (updated?.status) {
        setListingStatus(updated.status);
      }
    } catch (error: any) {
      console.error('Failed to save basic info:', error);
      const apiError = error?.response?.data?.error;
      if (apiError?.details && Array.isArray(apiError.details)) {
        Alert.alert('خطأ', apiError.details.join('\n'));
      } else if (apiError?.message) {
        Alert.alert('خطأ', String(apiError.message));
      } else {
        Alert.alert('خطأ', 'فشل حفظ البيانات');
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const saveSpecificDetails = async () => {
    setIsSaving(true);
    try {
      if (type === 'CAR') {
        await api.post(`/listings/${listingId}/details/car`, {
          make: carDetails.make,
          model: carDetails.model,
          year: parseInt(carDetails.year),
          mileageKm: parseInt(carDetails.mileageKm) || 0,
          transmission: carDetails.transmission,
          fuel: carDetails.fuel,
          condition: carDetails.condition,
          color: carDetails.color,
          trim: carDetails.trim,
          bodyType: carDetails.bodyType,
          specs: {
            interiorColor: carDetails.interiorColor || undefined,
            bodyCondition: carDetails.bodyCondition || undefined,
            paintType: carDetails.paintType || undefined,
            paint: carDetails.paintType || undefined,
          },
        });
      } else if (type === 'MOTORCYCLE') {
        await api.post(`/listings/${listingId}/details/motorcycle`, {
          make: motorcycleDetails.make,
          model: motorcycleDetails.model,
          year: parseInt(motorcycleDetails.year),
          mileageKm: parseInt(motorcycleDetails.mileageKm) || 0,
          transmission: motorcycleDetails.transmission,
          condition: motorcycleDetails.condition,
          color: motorcycleDetails.color,
          engineSize: motorcycleDetails.engineSize,
          bodyType: motorcycleDetails.bodyType,
        });
      } else if (type === 'PLATE') {
        await api.post(`/listings/${listingId}/details/plate`, {
          plateNumber: plateDetails.plateNumber,
          plateCategory: plateDetails.plateCategory,
          plateCode: plateDetails.plateCode,
          plateType: plateDetails.plateType,
        });
      } else if (type === 'PART') {
        await api.post(`/listings/${listingId}/details/part`, {
          partCategory: partDetails.partCategory,
          partName: partDetails.partName,
          compatibleCarMake: partDetails.compatibleCarMake,
          compatibleCarModel: partDetails.compatibleCarModel,
          condition: partDetails.condition,
          deliveryAvailable: partDetails.deliveryAvailable,
        });
      }
    } catch (error: any) {
      console.error('Failed to save specific details:', error);
      Alert.alert('خطأ', 'فشل حفظ التفاصيل');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 15 - images.length,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Failed to pick images:', error);
      Alert.alert('خطأ', 'فشل اختيار الصور');
    }
  };

  const pickVideos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: 6 - videos.length,
      });

      if (!result.canceled && result.assets) {
        const newVideos = result.assets.map(asset => asset.uri);
        setVideos([...videos, ...newVideos]);
      }
    } catch (error) {
      console.error('Failed to pick videos:', error);
      Alert.alert('خطأ', 'فشل اختيار الفيديو');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const removeExistingMedia = async (mediaId: string) => {
    try {
      await api.delete(`/media/${mediaId}`);
      setExistingMedia(existingMedia.filter((m) => m.id !== mediaId));
    } catch (error) {
      console.error('Failed to delete media:', error);
      Alert.alert('خطأ', 'فشل حذف الوسائط');
    }
  };

  const submitListing = async (action: 'submit' | 'draft') => {
    const existingImages = existingMedia.filter((m) => m.type === 'IMAGE').length;
    const totalImages = images.length + existingImages;

    if (action === 'submit') {
      if (totalImages === 0) {
        Alert.alert('تنبيه', 'يجب إضافة صورة واحدة على الأقل');
        return;
      }

      if (type === 'CAR' && totalImages < 3) {
        Alert.alert('تنبيه', 'يجب إضافة 3 صور على الأقل للسيارة');
        return;
      }
    }

    setIsLoading(true);
    try {
      const guessMimeType = (uri: string, kind: 'IMAGE' | 'VIDEO') => {
        const lower = uri.toLowerCase();
        if (kind === 'IMAGE') {
          if (lower.endsWith('.png')) return 'image/png';
          if (lower.endsWith('.webp')) return 'image/webp';
          if (lower.endsWith('.heic')) return 'image/heic';
          if (lower.endsWith('.heif')) return 'image/heif';
          return 'image/jpeg';
        }

        if (lower.endsWith('.mov')) return 'video/quicktime';
        if (lower.endsWith('.webm')) return 'video/webm';
        return 'video/mp4';
      };

      const guessFileName = (uri: string, kind: 'IMAGE' | 'VIDEO', index: number) => {
        const clean = uri.split('?')[0];
        const parts = clean.split('/');
        const last = parts[parts.length - 1];
        if (last && last.includes('.')) return last;
        const ext = kind === 'IMAGE' ? 'jpg' : 'mp4';
        return `${kind.toLowerCase()}-${index + 1}.${ext}`;
      };

      const uploadOne = async (uri: string, kind: 'IMAGE' | 'VIDEO', index: number) => {
        const form = new FormData();
        form.append('listingId', listingId);
        form.append('type', kind);
        form.append('file', {
          uri,
          name: guessFileName(uri, kind, index),
          type: guessMimeType(uri, kind),
        } as any);

        await api.post('/media/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      };

      for (let i = 0; i < images.length; i++) {
        await uploadOne(images[i], 'IMAGE', i);
      }

      for (let i = 0; i < videos.length; i++) {
        await uploadOne(videos[i], 'VIDEO', i);
      }

      if (action === 'draft') {
        if (listingStatus && listingStatus !== 'DRAFT') {
          await api.post(`/listings/${listingId}/save-draft`);
        }
      } else {
        if (listingStatus === 'APPROVED') {
          await api.post(`/listings/${listingId}/save-draft`);
        }
        await api.post(`/listings/${listingId}/submit`);
      }

      Alert.alert(
        'تم بنجاح',
        action === 'submit'
          ? 'تم إرسال إعلانك للمراجعة. سيتم نشره بعد الموافقة'
          : 'تم حفظ الإعلان كمسودة',
        [
          {
            text: 'حسناً',
            onPress: () => {
              router.replace('/(tabs)/my-listings');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to submit listing:', error);
      const errMsg: string = error.response?.data?.message ||
        error.response?.data?.error?.message || 'فشل نشر الإعلان';
      const isCreditsError = errMsg.includes('رصيد') || errMsg.includes('باقة') || errMsg.includes('اشتراك') || errMsg.includes('credit') || errMsg.includes('package') || errMsg.includes('canPost') || errMsg.includes('allowed');
      if (isCreditsError) {
        const isShowroom = useAuthStore.getState().user?.role === 'USER_SHOWROOM';
        Alert.alert(
          isShowroom ? 'لا يوجد اشتراك نشط' : 'لا يوجد رصيد إعلانات',
          isShowroom
            ? 'يجب الاشتراك في باقة معرض لنشر الإعلانات.'
            : 'يجب شراء باقة إعلانات أولاً لنشر إعلانك.',
          [
            { text: 'إلغاء', style: 'cancel' },
            {
              text: isShowroom ? 'اشترك الآن' : 'اشتري باقة الآن',
              onPress: () => isShowroom
                ? router.push('/(tabs)/profile/subscriptions')
                : router.push('/(tabs)/profile/individual-packages'),
            },
          ]
        );
      } else {
        Alert.alert('خطأ', errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={[styles.stepIndicator, { backgroundColor: theme.card }]}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              { backgroundColor: isDark ? '#1f2937' : '#E2E8F0' },
              step >= s && { backgroundColor: theme.primary },
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                { color: theme.textMuted },
                step >= s && { color: '#FFFFFF' },
              ]}
            >
              {s}
            </Text>
          </View>
          {s < 3 && (
            <View
              style={[
                styles.stepLine,
                { backgroundColor: theme.border },
                step > s && { backgroundColor: theme.primary },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderBasicInfoForm = () => {
    const selectedBrand = MotorcycleBrands.find(b => b.nameAr === motorcycleDetails.make || b.name === motorcycleDetails.make);
    const availableModels = selectedBrand ? selectedBrand.models : [];

    return (
    <View style={styles.form}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>المعلومات الأساسية</Text>

      {type === 'MOTORCYCLE' ? (
        <View>
            <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: theme.text }]}>الشركة المصنعة *</Text>
                <TouchableOpacity 
                    style={[inputStyle, { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }]}
                    onPress={() => setShowMotorcycleMakeModal(true)}
                >
                    <Text style={{ color: motorcycleDetails.make ? theme.text : theme.textMuted }}>
                    {isCustomMotorcycleMake ? (motorcycleDetails.make || 'أخرى') : (motorcycleDetails.make || 'اختر الشركة')}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                </TouchableOpacity>
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: theme.text }]}>الموديل *</Text>
                <TouchableOpacity 
                    style={[inputStyle, { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }, (!motorcycleDetails.make && !isCustomMotorcycleMake) && { opacity: 0.5 }]}
                    onPress={() => (motorcycleDetails.make || isCustomMotorcycleMake) && setShowMotorcycleModelModal(true)}
                    disabled={!motorcycleDetails.make && !isCustomMotorcycleMake}
                >
                    <Text style={{ color: motorcycleDetails.model ? theme.text : theme.textMuted }}>
                    {isCustomMotorcycleModel ? (motorcycleDetails.model || 'أخرى') : (motorcycleDetails.model || 'اختر الموديل')}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                </TouchableOpacity>
                </View>
            </View>

             {(isCustomMotorcycleMake || isCustomMotorcycleModel) && (
                 <View style={styles.row}>
                    {isCustomMotorcycleMake && (
                         <View style={[styles.inputGroup, styles.halfWidth]}>
                            <TextInput
                            style={inputStyle}
                            value={motorcycleDetails.make}
                            onChangeText={(text) => setMotorcycleDetails({ ...motorcycleDetails, make: text })}
                            placeholder="اسم الشركة"
                            textAlign="right"
                            placeholderTextColor={theme.textMuted}
                            />
                        </View>
                    )}
                    {isCustomMotorcycleModel && (
                         <View style={[styles.inputGroup, styles.halfWidth]}>
                            <TextInput
                            style={inputStyle}
                            value={motorcycleDetails.model}
                            onChangeText={(text) => setMotorcycleDetails({ ...motorcycleDetails, model: text })}
                            placeholder="اسم الموديل"
                            textAlign="right"
                            placeholderTextColor={theme.textMuted}
                            />
                        </View>
                    )}
                 </View>
             )}

            <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>السنة *</Text>
            <TextInput
                style={inputStyle}
                value={motorcycleDetails.year}
                onChangeText={(text) => setMotorcycleDetails({ ...motorcycleDetails, year: text.replace(/[^0-9]/g, '') })}
                placeholder="2024"
                textAlign="right"
                keyboardType="number-pad"
                maxLength={4}
                placeholderTextColor={theme.textMuted}
            />
            </View>
        </View>
      ) : (
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>العنوان *</Text>
        <TextInput
          style={inputStyle}
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
          placeholder="مثال: تويوتا كامري 2020"
          textAlign="right"
          maxLength={150}
          placeholderTextColor={theme.textMuted}
        />
      </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>الوصف</Text>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="اكتب وصف تفصيلي للإعلان..."
          textAlign="right"
          multiline
          numberOfLines={4}
          maxLength={5000}
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>السعر (دينار بحريني) *</Text>
        <TextInput
          style={inputStyle}
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text.replace(/[^0-9.]/g, '') })}
          placeholder="0.00"
          textAlign="right"
          keyboardType="decimal-pad"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>المحافظة</Text>
        <View style={styles.pickerContainer}>
          {Object.keys(GOVERNORATES).map((gov) => (
            <TouchableOpacity
              key={gov}
              style={[
                pickerItemStyle,
                formData.locationGovernorate === gov && styles.pickerItemActive,
                formData.locationGovernorate === gov && { backgroundColor: theme.surface, borderColor: theme.primary },
              ]}
              onPress={() => setFormData({ ...formData, locationGovernorate: gov, locationArea: '' })}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  { color: theme.textMuted },
                  formData.locationGovernorate === gov && { color: theme.primary, fontWeight: '500' },
                ]}
              >
                {gov}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>المنطقة</Text>
        <TouchableOpacity 
          style={[inputStyle, { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }]}
          onPress={() => setShowAreaModal(true)}
        >
          <Text style={{ color: formData.locationArea ? theme.text : theme.textMuted }}>
            {formData.locationArea || 'اختر المنطقة'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Area Picker Modal */}
      <PickerModal
        visible={showAreaModal}
        title="اختر المنطقة"
        items={GOVERNORATES[formData.locationGovernorate] || []}
        selectedValue={formData.locationArea}
        onSelect={(val) => setFormData({ ...formData, locationArea: val })}
        onClose={() => setShowAreaModal(false)}
      />

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>طريقة التواصل المفضلة</Text>
        <View style={styles.pickerContainer}>
          {contactPreferences.map((pref) => (
            <TouchableOpacity
              key={pref.value}
              style={[
                pickerItemStyle,
                formData.contactPreference === pref.value && styles.pickerItemActive,
                formData.contactPreference === pref.value && { backgroundColor: theme.surface, borderColor: theme.primary },
              ]}
              onPress={() => setFormData({ ...formData, contactPreference: pref.value })}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  { color: theme.textMuted },
                  formData.contactPreference === pref.value && { color: theme.primary, fontWeight: '500' },
                ]}
              >
                {pref.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pickers for Step 1 */}
      {type === 'MOTORCYCLE' && (
      <>
        <PickerModal
            visible={showMotorcycleMakeModal}
            title="اختر الشركة المصنعة"
            items={MotorcycleBrands.map(b => b.nameAr)}
            selectedValue={isCustomMotorcycleMake ? 'أخرى' : motorcycleDetails.make}
            onSelect={(value) => {
              if (value === 'أخرى') {
                 setIsCustomMotorcycleMake(true);
                 setMotorcycleDetails(prev => ({ ...prev, make: '', model: '' }));
              } else {
                 setIsCustomMotorcycleMake(false);
                 setMotorcycleDetails(prev => ({ ...prev, make: value, model: '' }));
              }
            }}
            onClose={() => setShowMotorcycleMakeModal(false)}
          />

          <PickerModal
            visible={showMotorcycleModelModal}
            title="اختر الموديل"
            items={availableModels}
            selectedValue={isCustomMotorcycleModel ? 'أخرى' : motorcycleDetails.model}
            onSelect={(value) => {
              if (value === 'أخرى') {
                 setIsCustomMotorcycleModel(true);
                 setMotorcycleDetails(prev => ({ ...prev, model: '' }));
              } else {
                 setIsCustomMotorcycleModel(false);
                 setMotorcycleDetails(prev => ({ ...prev, model: value }));
              }
            }}
            onClose={() => setShowMotorcycleModelModal(false)}
          />
      </>
      )}
    </View>
  );
  };

  const renderCarDetailsForm = () => (
    <View style={styles.form}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>تفاصيل السيارة</Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>الصنع *</Text>
          <TextInput
            style={inputStyle}
            value={carDetails.make}
            onChangeText={(text) => setCarDetails({ ...carDetails, make: text })}
            placeholder="تويوتا"
            textAlign="right"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>الموديل *</Text>
          <TextInput
            style={inputStyle}
            value={carDetails.model}
            onChangeText={(text) => setCarDetails({ ...carDetails, model: text })}
            placeholder="كامري"
            textAlign="right"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>السنة *</Text>
          <TextInput
            style={inputStyle}
            value={carDetails.year}
            onChangeText={(text) => setCarDetails({ ...carDetails, year: text.replace(/[^0-9]/g, '') })}
            placeholder="2020"
            textAlign="right"
            keyboardType="number-pad"
            maxLength={4}
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>الكيلومترات</Text>
          <TextInput
            style={inputStyle}
            value={carDetails.mileageKm}
            onChangeText={(text) => setCarDetails({ ...carDetails, mileageKm: text.replace(/[^0-9]/g, '') })}
            placeholder="50000"
            textAlign="right"
            keyboardType="number-pad"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>الحالة</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={[
              pickerItemStyle,
              carDetails.condition === 'NEW' && styles.pickerItemActive,
              carDetails.condition === 'NEW' && { backgroundColor: theme.surface, borderColor: theme.primary },
            ]}
            onPress={() => setCarDetails({ ...carDetails, condition: 'NEW' })}
          >
            <Text style={[
              styles.pickerItemText,
              { color: theme.textMuted },
              carDetails.condition === 'NEW' && { color: theme.primary, fontWeight: '500' },
            ]}>جديدة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              pickerItemStyle,
              carDetails.condition === 'USED' && styles.pickerItemActive,
              carDetails.condition === 'USED' && { backgroundColor: theme.surface, borderColor: theme.primary },
            ]}
            onPress={() => setCarDetails({ ...carDetails, condition: 'USED' })}
          >
            <Text style={[
              styles.pickerItemText,
              { color: theme.textMuted },
              carDetails.condition === 'USED' && { color: theme.primary, fontWeight: '500' },
            ]}>مستعملة</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>ناقل الحركة</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={[
              pickerItemStyle,
              carDetails.transmission === 'AUTO' && styles.pickerItemActive,
              carDetails.transmission === 'AUTO' && { backgroundColor: theme.surface, borderColor: theme.primary },
            ]}
            onPress={() => setCarDetails({ ...carDetails, transmission: 'AUTO' })}
          >
            <Text style={[
              styles.pickerItemText,
              { color: theme.textMuted },
              carDetails.transmission === 'AUTO' && { color: theme.primary, fontWeight: '500' },
            ]}>أوتوماتيك</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              pickerItemStyle,
              carDetails.transmission === 'MANUAL' && styles.pickerItemActive,
              carDetails.transmission === 'MANUAL' && { backgroundColor: theme.surface, borderColor: theme.primary },
            ]}
            onPress={() => setCarDetails({ ...carDetails, transmission: 'MANUAL' })}
          >
            <Text style={[
              styles.pickerItemText,
              { color: theme.textMuted },
              carDetails.transmission === 'MANUAL' && { color: theme.primary, fontWeight: '500' },
            ]}>يدوي</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>نوع الوقود</Text>
        <View style={styles.pickerContainer}>
          {['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC'].map((fuel) => (
            <TouchableOpacity
              key={fuel}
              style={[
                pickerItemStyle,
                carDetails.fuel === fuel && styles.pickerItemActive,
                carDetails.fuel === fuel && { backgroundColor: theme.surface, borderColor: theme.primary },
              ]}
              onPress={() => setCarDetails({ ...carDetails, fuel: fuel as any })}
            >
              <Text style={[
                styles.pickerItemText,
                { color: theme.textMuted },
                carDetails.fuel === fuel && { color: theme.primary, fontWeight: '500' },
              ]}>
                {fuel === 'PETROL' ? 'بنزين' : fuel === 'DIESEL' ? 'ديزل' : fuel === 'HYBRID' ? 'هايبرد' : 'كهربائي'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>اللون</Text>
        <TouchableOpacity 
          style={[inputStyle, { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }]}
          onPress={() => setShowCarColorModal(true)}
        >
          <Text style={{ color: carDetails.color ? theme.text : theme.textMuted }}>
            {isCustomCarColor ? (carDetails.color || 'أخرى') : (carDetails.color || 'اختر اللون')}
          </Text>
          <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
        </TouchableOpacity>
        {isCustomCarColor && (
          <TextInput
            style={[inputStyle, { marginTop: 8 }]}
            value={carDetails.color}
            onChangeText={(text) => setCarDetails({ ...carDetails, color: text })}
            placeholder="حدد اللون..."
            textAlign="right"
            placeholderTextColor={theme.textMuted}
          />
        )}
      </View>

      <PickerModal
        visible={showCarColorModal}
        title="اختر اللون"
        items={VehicleColors}
        selectedValue={isCustomCarColor ? 'أخرى' : carDetails.color}
        onSelect={(value) => {
          if (value === 'أخرى') {
            setIsCustomCarColor(true);
            setCarDetails(prev => ({ ...prev, color: '' }));
          } else {
            setIsCustomCarColor(false);
            setCarDetails(prev => ({ ...prev, color: value }));
          }
        }}
        onClose={() => setShowCarColorModal(false)}
      />

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>الفئة</Text>
        <TextInput
          style={inputStyle}
          value={carDetails.trim}
          onChangeText={(text) => setCarDetails({ ...carDetails, trim: text })}
          placeholder="LE / فول / نص فل"
          textAlign="right"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>نوع الهيكل</Text>
        <TextInput
          style={inputStyle}
          value={carDetails.bodyType}
          onChangeText={(text) => setCarDetails({ ...carDetails, bodyType: text })}
          placeholder="سيدان / SUV / كوبيه"
          textAlign="right"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>اللون الداخلي</Text>
        <TextInput
          style={inputStyle}
          value={carDetails.interiorColor}
          onChangeText={(text) => setCarDetails({ ...carDetails, interiorColor: text })}
          placeholder="بيج / أسود / أحمر"
          textAlign="right"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      {carDetails.condition === 'USED' && (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>حالة الهيكل</Text>
          <TextInput
            style={inputStyle}
            value={carDetails.bodyCondition}
            onChangeText={(text) => setCarDetails({ ...carDetails, bodyCondition: text })}
            placeholder="ممتازة / يوجد صدمات بسيطة / بحاجة لإصلاح"
            textAlign="right"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      )}

      {carDetails.condition === 'USED' && (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>نوع الدهان</Text>
          <TextInput
            style={inputStyle}
            value={carDetails.paintType}
            onChangeText={(text) => setCarDetails({ ...carDetails, paintType: text })}
            placeholder="صبغ وكالة / مصبوغ جزئياً / مصبوغ بالكامل"
            textAlign="right"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      )}

    </View>
  );

// Constants for new Motorcyle Fields
const MOTORCYCLE_BODY_TYPES = ['رياضية', 'كروزر', 'سكوتر', 'تيورنج', 'أخرى'];

// ...
  const renderMotorcycleDetailsForm = () => {
    return (
    <View style={styles.form}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>تفاصيل الدراجة النارية</Text>

      <View style={styles.row}>
        {/* Mileage */}
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>المسافة المقطوعة (كم)</Text>
          <TextInput
            style={[
              inputStyle, 
              motorcycleDetails.condition === 'NEW' && { opacity: 0.5, backgroundColor: theme.surface }
            ]}
            value={motorcycleDetails.condition === 'NEW' ? '0' : motorcycleDetails.mileageKm}
            onChangeText={(text) => setMotorcycleDetails({ ...motorcycleDetails, mileageKm: text.replace(/[^0-9]/g, '') })}
            placeholder="0"
            textAlign="right"
            keyboardType="number-pad"
            placeholderTextColor={theme.textMuted}
            editable={motorcycleDetails.condition !== 'NEW'}
          />
        </View>

        {/* Engine Size */}
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>سعة المحرك (CC)</Text>
          <TextInput
            style={inputStyle}
            value={motorcycleDetails.engineSize}
            onChangeText={(text) => setMotorcycleDetails({ ...motorcycleDetails, engineSize: text })}
            placeholder="1000"
            textAlign="right"
            keyboardType="number-pad"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

       {/* Condition */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>الحالة</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={[
              pickerItemStyle,
              motorcycleDetails.condition === 'NEW' && styles.pickerItemActive,
              motorcycleDetails.condition === 'NEW' && { backgroundColor: theme.surface, borderColor: theme.primary },
            ]}
            onPress={() => setMotorcycleDetails({ ...motorcycleDetails, condition: 'NEW', mileageKm: '0' })}
          >
            <Text style={[
              styles.pickerItemText,
              { color: theme.textMuted },
              motorcycleDetails.condition === 'NEW' && { color: theme.primary, fontWeight: '500' },
            ]}>جديدة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              pickerItemStyle,
              motorcycleDetails.condition === 'USED' && styles.pickerItemActive,
              motorcycleDetails.condition === 'USED' && { backgroundColor: theme.surface, borderColor: theme.primary },
            ]}
            onPress={() => setMotorcycleDetails({ ...motorcycleDetails, condition: 'USED' })}
          >
            <Text style={[
              styles.pickerItemText,
              { color: theme.textMuted },
              motorcycleDetails.condition === 'USED' && { color: theme.primary, fontWeight: '500' },
            ]}>مستعملة</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Body Type */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>نوع الهيكل</Text>
        <View style={styles.pickerContainer}>
          {MOTORCYCLE_BODY_TYPES.map((type) => (
             <TouchableOpacity
                key={type}
                style={[
                  pickerItemStyle,
                  motorcycleDetails.bodyType === type && styles.pickerItemActive,
                  motorcycleDetails.bodyType === type && { backgroundColor: theme.surface, borderColor: theme.primary },
                ]}
                onPress={() => setMotorcycleDetails({ ...motorcycleDetails, bodyType: type })}
              >
                <Text style={[
                  styles.pickerItemText,
                  { color: theme.textMuted },
                  motorcycleDetails.bodyType === type && { color: theme.primary, fontWeight: '500' },
                ]}>{type}</Text>
             </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Transmission */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>ناقل الحركة</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={[
              pickerItemStyle,
              motorcycleDetails.transmission === 'AUTO' && styles.pickerItemActive,
              motorcycleDetails.transmission === 'AUTO' && { backgroundColor: theme.surface, borderColor: theme.primary },
            ]}
            onPress={() => setMotorcycleDetails({ ...motorcycleDetails, transmission: 'AUTO' })}
          >
            <Text style={[
              styles.pickerItemText,
              { color: theme.textMuted },
              motorcycleDetails.transmission === 'AUTO' && { color: theme.primary, fontWeight: '500' },
            ]}>أوتوماتيك</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              pickerItemStyle,
              motorcycleDetails.transmission === 'MANUAL' && styles.pickerItemActive,
              motorcycleDetails.transmission === 'MANUAL' && { backgroundColor: theme.surface, borderColor: theme.primary },
            ]}
            onPress={() => setMotorcycleDetails({ ...motorcycleDetails, transmission: 'MANUAL' })}
          >
            <Text style={[
              styles.pickerItemText,
              { color: theme.textMuted },
              motorcycleDetails.transmission === 'MANUAL' && { color: theme.primary, fontWeight: '500' },
            ]}>يدوي</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Color Dropdown */}
      <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>اللون</Text>
          <TouchableOpacity 
            style={[inputStyle, { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }]}
            onPress={() => setShowMotorcycleColorModal(true)}
          >
            <Text style={{ color: motorcycleDetails.color ? theme.text : theme.textMuted }}>
              {isCustomMotorcycleColor ? (motorcycleDetails.color || 'أخرى') : (motorcycleDetails.color || 'اختر اللون')}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          {isCustomMotorcycleColor && (
            <TextInput
              style={[inputStyle, { marginTop: 8 }]}
              value={motorcycleDetails.color}
              onChangeText={(text) => setMotorcycleDetails({ ...motorcycleDetails, color: text })}
              placeholder="حدد اللون..."
              textAlign="right"
              placeholderTextColor={theme.textMuted}
            />
          )}
      </View>

      {/* Modals */}
      <PickerModal
        visible={showMotorcycleColorModal}
        title="اختر اللون"
        items={VehicleColors}
        selectedValue={isCustomMotorcycleColor ? 'أخرى' : motorcycleDetails.color}
        onSelect={(value) => {
          if (value === 'أخرى') {
            setIsCustomMotorcycleColor(true);
            setMotorcycleDetails(prev => ({ ...prev, color: '' }));
          } else {
            setIsCustomMotorcycleColor(false);
            setMotorcycleDetails(prev => ({ ...prev, color: value }));
          }
        }}
        onClose={() => setShowMotorcycleColorModal(false)}
      />
    </View>
  );
  };

  const renderPlateDetailsForm = () => (
    <View style={styles.form}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>تفاصيل اللوحة</Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>رقم اللوحة *</Text>
        <TextInput
          style={inputStyle}
          value={plateDetails.plateNumber}
          onChangeText={(text) => setPlateDetails({ ...plateDetails, plateNumber: text })}
          placeholder="123456"
          textAlign="right"
          keyboardType="number-pad"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>نوع اللوحة</Text>
        <View style={styles.pickerContainer}>
          {[
            { type: 'PRIVATE', label: 'خاصة' },
            { type: 'TRANSPORT', label: 'نقل مشترك' },
            { type: 'MOTORCYCLE', label: 'دراجة نارية' }
          ].map((item) => (
            <TouchableOpacity
              key={item.type}
              style={[
                pickerItemStyle,
                plateDetails.plateType === item.type && styles.pickerItemActive,
                plateDetails.plateType === item.type && { backgroundColor: theme.surface, borderColor: theme.primary },
              ]}
              onPress={() => setPlateDetails({
                ...plateDetails,
                plateType: item.type as any,
                plateCategory: item.label
              })}
            >
              <Text style={[
                styles.pickerItemText,
                { color: theme.textMuted },
                plateDetails.plateType === item.type && { color: theme.primary, fontWeight: '500' },
              ]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>رمز اللوحة (اختياري)</Text>
        <TextInput
          style={inputStyle}
          value={plateDetails.plateCode}
          onChangeText={(text) => setPlateDetails({ ...plateDetails, plateCode: text })}
          placeholder="أ"
          textAlign="right"
          placeholderTextColor={theme.textMuted}
        />
      </View>
    </View>
  );

  const renderPartDetailsForm = () => (
    <View style={styles.form}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>تفاصيل قطعة الغيار</Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>فئة القطعة *</Text>
        <TextInput
          style={inputStyle}
          value={partDetails.partCategory}
          onChangeText={(text) => setPartDetails({ ...partDetails, partCategory: text })}
          placeholder="محرك / هيكل / داخلية"
          textAlign="right"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>اسم القطعة</Text>
        <TextInput
          style={inputStyle}
          value={partDetails.partName}
          onChangeText={(text) => setPartDetails({ ...partDetails, partName: text })}
          placeholder="مثال: مصد أمامي"
          textAlign="right"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>الصنع المتوافق</Text>
          <TextInput
            style={inputStyle}
            value={partDetails.compatibleCarMake}
            onChangeText={(text) => setPartDetails({ ...partDetails, compatibleCarMake: text })}
            placeholder="تويوتا"
            textAlign="right"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>الموديل المتوافق</Text>
          <TextInput
            style={inputStyle}
            value={partDetails.compatibleCarModel}
            onChangeText={(text) => setPartDetails({ ...partDetails, compatibleCarModel: text })}
            placeholder="كامري"
            textAlign="right"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>الحالة</Text>
        <View style={styles.pickerContainer}>
          {['NEW', 'USED', 'REFURBISHED'].map((cond) => (
            <TouchableOpacity
              key={cond}
              style={[
                pickerItemStyle,
                partDetails.condition === cond && styles.pickerItemActive,
                partDetails.condition === cond && { backgroundColor: theme.surface, borderColor: theme.primary },
              ]}
              onPress={() => setPartDetails({ ...partDetails, condition: cond as any })}
            >
              <Text style={[
                styles.pickerItemText,
                { color: theme.textMuted },
                partDetails.condition === cond && { color: theme.primary, fontWeight: '500' },
              ]}>
                {cond === 'NEW' ? 'جديدة' : cond === 'USED' ? 'مستعملة' : 'مجددة'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.inputGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>هل تتوفر خدمة التوصيل؟</Text>
        <TouchableOpacity
            style={[
              { width: 50, height: 30, borderRadius: 15, justifyContent: 'center', padding: 2 },
              { backgroundColor: partDetails.deliveryAvailable ? theme.primary : theme.border }
            ]}
            onPress={() => setPartDetails({ ...partDetails, deliveryAvailable: !partDetails.deliveryAvailable })}
        >
             <View style={{
                 width: 26,
                 height: 26,
                 borderRadius: 13,
                 backgroundColor: 'white',
                 alignSelf: partDetails.deliveryAvailable ? 'flex-end' : 'flex-start' 
             }} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderImagesStep = () => (
    <View style={styles.form}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>الصور</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        {type === 'CAR' ? 'يجب إضافة 3 صور على الأقل' : 'أضف صور واضحة للإعلان'}
      </Text>

      {existingMedia.length > 0 && (
        <View style={styles.existingMediaSection}>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>الوسائط الحالية</Text>
          <View style={styles.imageGrid}>
            {existingMedia.map((media) => (
              <View key={media.id} style={styles.imageContainer}>
                {media.type === 'IMAGE' ? (
                  <View style={{ width: '100%', height: '100%' }}>
                    <Image source={{ uri: media.url }} style={styles.image} contentFit="cover" />
                    <View style={styles.watermarkContainer} pointerEvents="none">
                      <Image 
                        source={require('@/assets/images/logo.png')}
                        style={styles.watermarkImage}
                        contentFit="contain"
                      />
                    </View>
                  </View>
                ) : (
                  <View style={[styles.image, styles.videoPlaceholder, { backgroundColor: theme.border }]}>
                    <Ionicons name="videocam-outline" size={24} color={theme.text} />
                    <View style={styles.watermarkContainer} pointerEvents="none">
                      <Image 
                        source={require('@/assets/images/logo.png')}
                        style={styles.watermarkImage}
                        contentFit="contain"
                      />
                    </View>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeExistingMedia(media.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity style={[styles.addImageButton, { backgroundColor: theme.surface, borderColor: theme.primary }]} onPress={pickImages}>
        <Ionicons name="images" size={32} color={theme.primary} />
        <Text style={[styles.addImageText, { color: theme.primary }]}>اختر صور ({images.length}/15)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.addImageButton, { backgroundColor: theme.surface, borderColor: theme.primary }]} onPress={pickVideos}>
        <Ionicons name="videocam-outline" size={32} color={theme.primary} />
        <Text style={[styles.addImageText, { color: theme.primary }]}>اختر فيديو ({videos.length}/6)</Text>
      </TouchableOpacity>

      <View style={styles.imageGrid}>
        {images.map((uri, index) => (
          <View key={index} style={styles.imageContainer}>
             <View style={{ width: '100%', height: '100%' }}>
              <Image source={{ uri }} style={styles.image} contentFit="cover" />
              <View style={styles.watermarkContainer} pointerEvents="none">
                <Image 
                  source={require('@/assets/images/logo.png')}
                  style={styles.watermarkImage}
                  contentFit="contain"
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
        {videos.map((uri, index) => (
          <View key={`video-${index}`} style={styles.imageContainer}>
            <View style={[styles.image, styles.videoPlaceholder, { backgroundColor: theme.border }]}>
              <Ionicons name="videocam" size={24} color={theme.text} />
              <View style={styles.watermarkContainer} pointerEvents="none">
                <Image 
                  source={require('@/assets/images/logo.png')}
                  style={styles.watermarkImage}
                  contentFit="contain"
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeVideo(index)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {isEditMode ? (
        <View style={styles.editActions}>
          <TouchableOpacity
            style={[styles.submitButton, styles.submitSecondaryButton, isLoading && styles.submitButtonDisabled]}
            onPress={() => submitListing('draft')}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>حفظ كمسودة</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={() => submitListing('submit')}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>إعادة نشر</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={() => submitListing('submit')}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>نشر الإعلان</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (isPrefilling) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, rtlStyles.container, { backgroundColor: theme.background }]}>
      <PageHeader
        title={
          type === 'CAR'
            ? 'إعلان سيارة'
            : type === 'MOTORCYCLE'
            ? 'إعلان دراجة نارية'
            : type === 'PLATE'
            ? 'إعلان لوحة'
            : 'إعلان قطعة غيار'
        }
        backgroundColor={theme.card}
        borderColor={theme.border}
        textColor={theme.text}
      />

      {renderStepIndicator()}

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 20 }}>
        {step === 1 && renderBasicInfoForm()}
        {step === 2 && type === 'CAR' && renderCarDetailsForm()}
        {step === 2 && type === 'MOTORCYCLE' && renderMotorcycleDetailsForm()}
        {step === 2 && type === 'PLATE' && renderPlateDetailsForm()}
        {step === 2 && type === 'PART' && renderPartDetailsForm()}
        {step === 3 && renderImagesStep()}
      </ScrollView>

      {step < 3 && (
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          {step > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handlePreviousStep}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.textMuted }]}>السابق</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isSaving && styles.buttonDisabled]}
            onPress={handleNextStep}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>التالي</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'right',
    marginRight: 12,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  pickerItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  pickerItemText: {
    fontSize: 14,
    color: '#64748B',
  },
  pickerItemTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  addImageButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addImageText: {
    fontSize: 16,
    color: Colors.primary,
    marginTop: 8,
    fontWeight: '500',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    width: '30%',
    aspectRatio: 1,
    position: 'relative',
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  existingMediaSection: {
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    zIndex: 2,
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  watermarkImage: {
    width: 30,
    height: 30,
    opacity: 0.3,
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitSecondaryButton: {
    backgroundColor: '#64748B',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 24,
  },
  footer: {
    flexDirection: 'row-reverse',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
});
