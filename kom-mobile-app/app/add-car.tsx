import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Colors } from '../constants/Colors';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { useTheme } from '../context/ThemeContext';
import { PageHeader } from '@/components/ui/page-header';
import { PickerModal } from '../components/ui/picker-modal';
import { VehicleColors, CarBrands } from '../constants/CarData';


// ماركات السيارات المتوفرة (مشتقة من CarBrands)
const CAR_MAKES = CarBrands
  .filter(brand => brand.id !== 'all')
  .map(brand => brand.nameAr);

if (!CAR_MAKES.includes('أخرى')) {
  CAR_MAKES.push('أخرى');
}

// أنواع السيارات
const BODY_TYPES = [
  'سيدان',
  'SUV',
  'كوبيه', 
  'هاتشباك',
  'بيك أب',
  'فان',
  'ستيشن واغن',
  'كونفرتيبل',
  'كروس أوفر',
];

// موديلات حسب الماركة (مشتقة من CarBrands)
const CAR_MODELS: { [key: string]: string[] } = {};

CarBrands.forEach(brand => {
  if (brand.id === 'all') return;
  
  const models = brand.models.map(m => {
    if (typeof m === 'string') return m;
    return m.ar || m.en; 
  });
  
  CAR_MODELS[brand.nameAr] = models;
});

// سنوات الصنع
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let year = currentYear; year >= 1990; year--) {
    years.push(year.toString());
  }
  return years;
};

const YEARS = generateYears();

// المحافظات والمناطق
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

// ناقل الحركة
const TRANSMISSIONS = ['أوتوماتيك', 'يدوي'];

// نوع الوقود
const FUEL_TYPES = ['بنزين', 'ديزل', 'كهربائي', 'هايبرد', 'أخرى'];

// حالة السيارة
const CONDITIONS = ['جديدة', 'مستعملة'];

const BODY_CONDITIONS = [
  'ممتازة (خالية من الحوادث)',
  'جيدة جداً (عيوب بسيطة)',
  'يوجد صدمات بسيطة',
  'بحاجة لإصلاح',
  'تالفة (للتشليح)'
];

const PAINT_TYPES = [
  'صبغ الوكالة',
  'مصبوغ جزئياً',
  'مصبوغ بالكامل',
];

// دوال التحويل من العربي إلى الإنجليزي للـ API
const mapTransmissionToAPI = (arabicValue: string): string => {
  const map: { [key: string]: string } = {
    'أوتوماتيك': 'AUTO',
    'يدوي': 'MANUAL',
    'CVT': 'CVT'
  };
  return map[arabicValue] || 'AUTO';
};

const mapFuelTypeToAPI = (arabicValue: string): string => {
  const map: { [key: string]: string } = {
    'بنزين': 'PETROL',
    'ديزل': 'DIESEL',
    'كهربائي': 'ELECTRIC',
    'هايبرد': 'HYBRID',
    'أخرى': 'OTHER'
  };
  return map[arabicValue] || 'PETROL';
};

const mapConditionToAPI = (arabicValue: string): string => {
  const map: { [key: string]: string } = {
    'جديدة': 'NEW',
    'مستعملة': 'USED'
  };
  return map[arabicValue] || 'USED';
};



export default function AddCarScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const { isDark } = useTheme();
  const theme = {
    background: isDark ? Colors.dark.background : Colors.background,
    card: isDark ? Colors.dark.surface : Colors.surface,
    text: isDark ? Colors.dark.text : Colors.text,
    textMuted: isDark ? '#94a3b8' : Colors.textSecondary,
    border: isDark ? '#1f2937' : Colors.border,
    surface: isDark ? '#0b1220' : Colors.surface,
    primary: Colors.primary,
  };

  const selectInputStyle = [styles.selectInput, { backgroundColor: theme.card, borderColor: theme.border }];
  const textInputStyle = [styles.textInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }];
  const sectionStyle = [styles.section, { backgroundColor: theme.card }];
  
  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'تسجيل الدخول مطلوب',
        'يجب تسجيل الدخول أولاً لإضافة إعلان',
        [
          { 
            text: 'تسجيل الدخول',
            onPress: () => router.replace('/(auth)/login'),
          },
          {
            text: 'إنشاء حساب',
            onPress: () => router.replace('/(auth)/register'),
          },
          {
            text: 'إلغاء',
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [isAuthenticated]);
  
  // البيانات الأساسية
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [mileage, setMileage] = useState('');
  
  // التفاصيل الإضافية
  const [transmission, setTransmission] = useState('أوتوماتيك');
  const [fuelType, setFuelType] = useState('بنزين');
  const [condition, setCondition] = useState('مستعملة');
  const [color, setColor] = useState('');
  
  // حقول جديدة
  const [interiorColor, setInteriorColor] = useState('');
  const [bodyCondition, setBodyCondition] = useState('');
  const [paintType, setPaintType] = useState('');

  // الموقع
  const [governorate, setGovernorate] = useState('العاصمة');
  const [area, setArea] = useState('');
  
  // الصور والفيديوهات
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  
  // حالات التحميل
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals
  const [showMakeModal, setShowMakeModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showBodyTypeModal, setShowBodyTypeModal] = useState(false);
  const [showGovernorateModal, setShowGovernorateModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showTransmissionModal, setShowTransmissionModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [isCustomColor, setIsCustomColor] = useState(false);
  
  const [showInteriorColorModal, setShowInteriorColorModal] = useState(false);
  const [isCustomInteriorColor, setIsCustomInteriorColor] = useState(false);
  const [showBodyConditionModal, setShowBodyConditionModal] = useState(false);
  const [showPaintTypeModal, setShowPaintTypeModal] = useState(false);

  const availableModels = make ? (CAR_MODELS[make] || ['أخرى']) : [];
  const availableAreas = GOVERNORATES[governorate] || [];

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('خطأ', 'نحتاج إلى إذن للوصول إلى المعرض');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 15 - images.length,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages([...images, ...newImages]);
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('خطأ', 'نحتاج إلى إذن للوصول إلى المعرض');
      return;
    }

    if (videos.length >= 2) {
      Alert.alert('تنبيه', 'يمكنك رفع فيديوهين كحد أقصى');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });

    if (!result.canceled) {
      setVideos([...videos, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!make) {
      Alert.alert('خطأ', 'الرجاء اختيار ماركة السيارة');
      return false;
    }
    if (!model) {
      Alert.alert('خطأ', 'الرجاء اختيار موديل السيارة');
      return false;
    }
    if (!year) {
      Alert.alert('خطأ', 'الرجاء اختيار سنة الصنع');
      return false;
    }
    if (!bodyType) {
      Alert.alert('خطأ', 'الرجاء اختيار نوع السيارة');
      return false;
    }
    if (mileage && parseInt(mileage) > 9999999) {
      Alert.alert('خطأ', 'عدد الكيلومترات يجب أن يكون أقل من 10 مليون');
      return false;
    }
    if (!description.trim() || description.length < 20) {
      Alert.alert('خطأ', 'الرجاء كتابة وصف تفصيلي (20 حرف على الأقل)');
      return false;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('خطأ', 'الرجاء إدخال السعر');
      return false;
    }
    if (price && parseFloat(price) > 99999999) {
      Alert.alert('خطأ', 'السعر يجب أن يكون أقل من 100 مليون دينار');
      return false;
    }
    if (images.length < 3) {
      Alert.alert('خطأ', 'الرجاء رفع 3 صور على الأقل للسيارة');
      return false;
    }
    if (!area) {
      Alert.alert('خطأ', 'الرجاء اختيار المنطقة');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert('تنبيه', 'يجب تسجيل الدخول أولاً', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسجيل الدخول', onPress: () => router.push('/(auth)/login') }
      ]);
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // إنشاء الإعلان
      const listingData = {
        type: 'CAR',
        title: `${make} ${model} ${year}`,
        description,
        price: parseFloat(price),
        currency: 'BHD',
        locationGovernorate: governorate,
        locationArea: area,
        contactPreference: 'CALL',
      };
      
      console.log('Creating listing with data:', listingData);
      const listingResponse = await api.post('/listings', listingData);

      const listingId = listingResponse.data.data.id;
      console.log('Listing created with ID:', listingId);

      // إضافة تفاصيل السيارة
      const carDetailsData = {
        make,
        model,
        year: parseInt(year),
        mileageKm: mileage ? parseInt(mileage) : 0,
        transmission: mapTransmissionToAPI(transmission),
        fuel: mapFuelTypeToAPI(fuelType),
        condition: mapConditionToAPI(condition),
        color: color || undefined,
        bodyType,
        interiorColor: interiorColor || undefined,
        bodyCondition: bodyCondition || undefined,
        paintType: paintType || undefined,
      };
      
      console.log('Adding car details:', carDetailsData);
      const carDetailsResponse = await api.post(`/listings/${listingId}/details/car`, carDetailsData);
      console.log('Car details added successfully:', carDetailsResponse.data);

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

        const name = guessFileName(uri, kind, index);
        const type = guessMimeType(uri, kind);

        form.append('file', {
          uri,
          name,
          type,
        } as any);

        const res = await api.post('/media/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 600000, // 10 minutes for heavy uploads
        });

        return res.data?.data ?? res.data;
      };

      // رفع الصور والفيديوهات (Cloudinary عبر الباكند)
      if (images.length > 0 || videos.length > 0) {
        console.log(`Uploading media... images=${images.length} videos=${videos.length}`);
      }

      for (let i = 0; i < images.length; i++) {
        await uploadOne(images[i], 'IMAGE', i);
      }
      for (let i = 0; i < videos.length; i++) {
        await uploadOne(videos[i], 'VIDEO', i);
      }
      
      // تقديم الإعلان للمراجعة
      console.log('Submitting listing for review...');
      const submitResponse = await api.post(`/listings/${listingId}/submit`);
      console.log('Listing submitted successfully:', submitResponse.data);
      
      Alert.alert(
        'تم بنجاح! ✅',
        'تم إرسال إعلان السيارة للمراجعة. سيتم نشره بعد الموافقة عليه من قبل الإدارة.',
        [
          {
            text: 'عرض إعلاناتي',
            onPress: () => router.push('/(tabs)/my-listings'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to create listing:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.join(', ') ||
                          'فشل إضافة الإعلان. حاول مرة أخرى';
      
      Alert.alert('خطأ', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader
        title="إضافة إعلان سيارة"
        backgroundColor={theme.card}
        borderColor={theme.border}
        textColor={theme.text}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* معلومات السيارة */}
        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>معلومات السيارة</Text>
          
          {/* ماركة السيارة */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>الماركة *</Text>
            <TouchableOpacity 
              style={selectInputStyle}
              onPress={() => setShowMakeModal(true)}
            >
              <Text style={[styles.selectText, !make && styles.placeholder, { color: make ? theme.text : theme.textMuted }]}>
                {make || 'اختر الماركة'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* موديل السيارة */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>الموديل *</Text>
            <TouchableOpacity 
              style={[selectInputStyle, !make && styles.inputDisabled]}
              onPress={() => make && setShowModelModal(true)}
              disabled={!make}
            >
              <Text style={[styles.selectText, !model && styles.placeholder, { color: model ? theme.text : theme.textMuted }]}>
                {model || 'اختر الموديل'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* سنة الصنع */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>سنة الصنع *</Text>
            <TouchableOpacity 
              style={selectInputStyle}
              onPress={() => setShowYearModal(true)}
            >
              <Text style={[styles.selectText, !year && styles.placeholder, { color: year ? theme.text : theme.textMuted }]}>
                {year || 'اختر السنة'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* نوع السيارة */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>نوع السيارة *</Text>
            <TouchableOpacity 
              style={selectInputStyle}
              onPress={() => setShowBodyTypeModal(true)}
            >
              <Text style={[styles.selectText, !bodyType && styles.placeholder, { color: bodyType ? theme.text : theme.textMuted }]}>
                {bodyType || 'اختر النوع'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* الكيلومترات */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>عدد الكيلومترات</Text>
            <TextInput
              style={textInputStyle}
              placeholder="مثال: 50000"
              value={mileage}
              onChangeText={setMileage}
              keyboardType="numeric"
              textAlign="right"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          {/* ناقل الحركة */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>ناقل الحركة</Text>
            <TouchableOpacity 
              style={selectInputStyle}
              onPress={() => setShowTransmissionModal(true)}
            >
              <Text style={[styles.selectText, { color: theme.text }]}>{transmission}</Text>
              <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* نوع الوقود */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>نوع الوقود</Text>
            <TouchableOpacity 
              style={selectInputStyle}
              onPress={() => setShowFuelModal(true)}
            >
              <Text style={[styles.selectText, { color: theme.text }]}>{fuelType}</Text>
              <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* الحالة */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>الحالة</Text>
            <TouchableOpacity 
              style={selectInputStyle}
              onPress={() => setShowConditionModal(true)}
            >
              <Text style={[styles.selectText, { color: theme.text }]}>{condition}</Text>
              <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* اللون */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>اللون</Text>
            <TouchableOpacity 
              style={selectInputStyle}
              onPress={() => setShowColorModal(true)}
            >
              <Text style={[styles.selectText, !color && styles.placeholder, { color: color ? theme.text : theme.textMuted }]}>
                {isCustomColor ? 'أخرى' : (color || 'اختر اللون')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
            </TouchableOpacity>
            
            {isCustomColor && (
              <TextInput
                style={[textInputStyle, { marginTop: 8 }]}
                placeholder="حدد اللون..."
                value={color}
                onChangeText={setColor}
                textAlign="right"
                placeholderTextColor={theme.textMuted}
              />
            )}
          </View>
          
          {/* اللون الداخلي */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>اللون الداخلي</Text>
            <TouchableOpacity 
              style={selectInputStyle}
              onPress={() => setShowInteriorColorModal(true)}
            >
              <Text style={[styles.selectText, !interiorColor && styles.placeholder, { color: interiorColor ? theme.text : theme.textMuted }]}>
                {isCustomInteriorColor ? 'أخرى' : (interiorColor || 'اختر اللون الداخلي')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
            </TouchableOpacity>
            
            {isCustomInteriorColor && (
              <TextInput
                style={[textInputStyle, { marginTop: 8 }]}
                placeholder="حدد اللون..."
                value={interiorColor}
                onChangeText={setInteriorColor}
                textAlign="right"
                placeholderTextColor={theme.textMuted}
              />
            )}
          </View>
          
          {/* حالة الهيكل - فقط للمسمتعمل */}
          {condition === 'مستعملة' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>حالة الهيكل</Text>
              <TouchableOpacity 
                style={selectInputStyle}
                onPress={() => setShowBodyConditionModal(true)}
              >
                <Text style={[styles.selectText, !bodyCondition && styles.placeholder, { color: bodyCondition ? theme.text : theme.textMuted }]}>
                  {bodyCondition || 'اختر حالة الهيكل'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* نوع الدهان - فقط للمستعمل */}
          {condition === 'مستعملة' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>نوع الدهان</Text>
              <TouchableOpacity 
                style={selectInputStyle}
                onPress={() => setShowPaintTypeModal(true)}
              >
                <Text style={[styles.selectText, !paintType && styles.placeholder, { color: paintType ? theme.text : theme.textMuted }]}>
                  {paintType || 'اختر نوع الدهان'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* الوصف والسعر */}
        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>التفاصيل</Text>
          
          {/* الوصف */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>الوصف *</Text>
            <TextInput
              style={[textInputStyle, styles.textArea]}
              placeholder="اكتب وصفاً تفصيلياً للسيارة..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlign="right"
              textAlignVertical="top"
              placeholderTextColor={theme.textMuted}
            />
            <Text style={[styles.hint, { color: theme.textMuted }]}>{description.length}/20 حرف على الأقل</Text>
          </View>

          {/* السعر */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>السعر (د.ب) *</Text>
            <TextInput
              style={textInputStyle}
              placeholder="مثال: 5000"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              textAlign="right"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>

        {/* الموقع */}
        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>الموقع</Text>
          
          {/* المحافظة */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>المحافظة *</Text>
            <TouchableOpacity 
              style={selectInputStyle}
              onPress={() => setShowGovernorateModal(true)}
            >
              <Text style={[styles.selectText, { color: theme.text }]}>{governorate}</Text>
              <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* المنطقة */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>المنطقة *</Text>
            <TouchableOpacity 
              style={selectInputStyle}
              onPress={() => setShowAreaModal(true)}
            >
              <Text style={[styles.selectText, !area && styles.placeholder, { color: area ? theme.text : theme.textMuted }]}>
                {area || 'اختر المنطقة'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* الصور والفيديوهات */}
        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>الصور والفيديوهات (اختياري)</Text>
          <Text style={[styles.hint, { color: theme.textMuted }]}>يمكنك إضافة حتى 15 صورة و 2 فيديو</Text>
          
          {/* الصور */}
          <View style={styles.mediaContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.mediaItem}>
                <Image source={{ uri }} style={styles.mediaImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            
            {images.length < 15 && (
              <TouchableOpacity style={[styles.addMediaButton, { backgroundColor: theme.surface, borderColor: theme.primary }]} onPress={pickImages}>
                <Ionicons name="images" size={32} color={theme.primary} />
                <Text style={[styles.addMediaText, { color: theme.primary }]}>إضافة صور</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* الفيديوهات */}
          {videos.length > 0 && (
            <View style={styles.mediaContainer}>
              {videos.map((uri, index) => (
                <View key={index} style={styles.mediaItem}>
                  <View style={styles.videoPlaceholder}>
                    <Ionicons name="videocam" size={40} color="#fff" />
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeVideo(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {videos.length < 2 && (
            <TouchableOpacity style={[styles.addVideoButton, { borderColor: theme.primary }]} onPress={pickVideo}>
              <Ionicons name="videocam" size={20} color={theme.primary} />
              <Text style={[styles.addVideoText, { color: theme.primary }]}>إضافة فيديو</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* زر النشر */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>نشر الإعلان</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <PickerModal
        visible={showMakeModal}
        title="اختر الماركة"
        items={CAR_MAKES}
        selectedValue={make}
        onSelect={(value) => {
          setMake(value);
          setModel(''); // إعادة تعيين الموديل عند تغيير الماركة
        }}
        onClose={() => setShowMakeModal(false)}
      />

      <PickerModal
        visible={showModelModal}
        title="اختر الموديل"
        items={availableModels}
        selectedValue={model}
        onSelect={setModel}
        onClose={() => setShowModelModal(false)}
      />

      <PickerModal
        visible={showYearModal}
        title="اختر سنة الصنع"
        items={YEARS}
        selectedValue={year}
        onSelect={setYear}
        onClose={() => setShowYearModal(false)}
      />

      <PickerModal
        visible={showBodyTypeModal}
        title="اختر نوع السيارة"
        items={BODY_TYPES}
        selectedValue={bodyType}
        onSelect={setBodyType}
        onClose={() => setShowBodyTypeModal(false)}
      />

      <PickerModal
        visible={showGovernorateModal}
        title="اختر المحافظة"
        items={Object.keys(GOVERNORATES)}
        selectedValue={governorate}
        onSelect={(value) => {
          setGovernorate(value);
          setArea(''); // إعادة تعيين المنطقة عند تغيير المحافظة
        }}
        onClose={() => setShowGovernorateModal(false)}
      />

      <PickerModal
        visible={showAreaModal}
        title="اختر المنطقة"
        items={availableAreas}
        selectedValue={area}
        onSelect={setArea}
        onClose={() => setShowAreaModal(false)}
      />

      <PickerModal
        visible={showTransmissionModal}
        title="اختر ناقل الحركة"
        items={TRANSMISSIONS}
        selectedValue={transmission}
        onSelect={setTransmission}
        onClose={() => setShowTransmissionModal(false)}
      />

      <PickerModal
        visible={showFuelModal}
        title="اختر نوع الوقود"
        items={FUEL_TYPES}
        selectedValue={fuelType}
        onSelect={setFuelType}
        onClose={() => setShowFuelModal(false)}
      />

      <PickerModal
        visible={showConditionModal}
        title="اختر الحالة"
        items={CONDITIONS}
        selectedValue={condition}
        onSelect={setCondition}
        onClose={() => setShowConditionModal(false)}
      />

      <PickerModal
        visible={showColorModal}
        title="اختر اللون"
        items={VehicleColors}
        selectedValue={isCustomColor ? 'أخرى' : color}
        onSelect={(value) => {
          if (value === 'أخرى') {
            setIsCustomColor(true);
            setColor('');
          } else {
            setIsCustomColor(false);
            setColor(value);
          }
        }}
        onClose={() => setShowColorModal(false)}
      />

      <PickerModal
        visible={showInteriorColorModal}
        title="اختر اللون الداخلي"
        items={VehicleColors}
        selectedValue={isCustomInteriorColor ? 'أخرى' : interiorColor}
        onSelect={(value) => {
          if (value === 'أخرى') {
            setIsCustomInteriorColor(true);
            setInteriorColor('');
          } else {
            setIsCustomInteriorColor(false);
            setInteriorColor(value);
          }
        }}
        onClose={() => setShowInteriorColorModal(false)}
      />

      <PickerModal
        visible={showBodyConditionModal}
        title="اختر حالة الهيكل"
        items={BODY_CONDITIONS}
        selectedValue={bodyCondition}
        onSelect={setBodyCondition}
        onClose={() => setShowBodyConditionModal(false)}
      />

      <PickerModal
        visible={showPaintTypeModal}
        title="اختر نوع الدهان"
        items={PAINT_TYPES}
        selectedValue={paintType}
        onSelect={setPaintType}
        onClose={() => setShowPaintTypeModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  selectInput: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  selectText: {
    fontSize: 15,
    color: '#1F2937',
  },
  placeholder: {
    color: '#9CA3AF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 120,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
  mediaContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  mediaItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addMediaButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
  },
  addMediaText: {
    fontSize: 12,
    color: '#000000',
    marginTop: 4,
    fontWeight: '600',
  },
  addVideoButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#000000',
    marginTop: 12,
  },
  addVideoText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemSelected: {
    backgroundColor: '#F4F4F5',
  },
  modalItemText: {
    fontSize: 15,
    color: '#1F2937',
  },
  modalItemTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
});
