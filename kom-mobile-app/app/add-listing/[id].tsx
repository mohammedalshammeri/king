import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { CarBodyTypes, CarBrands, CarTrimOptions, GenericCarTrimOptions, MotorcycleBodyTypes, MotorcycleBrands, VehicleColors } from '@/constants/CarData';
import { PickerModal } from '@/components/ui/picker-modal';
import api from '@/services/api';
import { Image } from 'expo-image';
import { useTheme } from '@/context/ThemeContext';
import { PageHeader } from '@/components/ui/page-header';
import { useAuthStore } from '@/store/authStore';
import { useAppTranslation, useLanguage } from '@/context/LanguageContext';

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

interface BrandOption {
  nameAr: string;
  models: string[];
}

const normalizeBrandModels = (models: any[] = []) =>
  Array.from(
    new Set(
      models
        .map((model) => {
          if (typeof model === 'string') return model;
          return model?.ar || model?.nameAr || model?.name || model?.en || '';
        })
        .filter(Boolean)
    )
  );

const buildBrandOptions = (brands: any[], fallbackBrands: string[] = []): BrandOption[] => {
  const normalized = brands
    .filter((brand) => brand?.id !== 'all')
    .map((brand) => ({
      nameAr: brand?.nameAr || brand?.name || '',
      models: normalizeBrandModels(brand?.models),
    }))
    .filter((brand) => brand.nameAr);

  const existing = new Set(normalized.map((brand) => brand.nameAr));
  const extra = fallbackBrands
    .filter((name) => !existing.has(name))
    .map((name) => ({ nameAr: name, models: [] }));

  return [...normalized, ...extra];
};

const CAR_BRAND_OPTIONS = buildBrandOptions(CarBrands);

const MOTORCYCLE_BRAND_OPTIONS = buildBrandOptions(MotorcycleBrands);

const getCarTrimOptions = (make: string, model: string) => {
  if (!make || !model) return GenericCarTrimOptions;
  return CarTrimOptions[make]?.[model] || GenericCarTrimOptions;
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1960 + 1 }, (_, index) => String(CURRENT_YEAR - index));

const PART_CATEGORIES = ['مكينه', 'جير', 'هيكل', 'كهرباء', 'داخليه', 'مكيف', 'إطارات', 'زيوت', 'إكسسوارات', 'أخرى'];
const MOTORCYCLE_ENGINE_SIZES = ['50', '125', '150', '250', '300', '400', '600', '750', '900', '1000', '1200', 'أخرى'];
const PLATE_TYPE_OPTIONS = [
  { value: 'PRIVATE' as const, label: 'خاصة' },
  { value: 'TRANSPORT' as const, label: 'نقل مشترك' },
  { value: 'MOTORCYCLE' as const, label: 'دراجة نارية' },
];
const PLATE_CATEGORY_OPTIONS: Record<PlateDetails['plateType'], string[]> = {
  PRIVATE: ['عادي', 'مميز', 'ثنائي', 'ثلاثي', 'رباعي', 'خماسي'],
  TRANSPORT: ['نقل خفيف', 'نقل ثقيل', 'أجرة', 'مميز'],
  MOTORCYCLE: ['عادي', 'مميز'],
};
const PLATE_CODE_OPTIONS: Record<PlateDetails['plateType'], string[]> = {
  PRIVATE: ['بدون رمز', 'أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'],
  TRANSPORT: ['بدون رمز', 'أ', 'ب', 'ج', 'د', 'هـ'],
  MOTORCYCLE: ['بدون رمز', 'أ', 'ب', 'ج'],
};

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

const getMotorcycleBodyTypeTranslationKey = (bodyType: string) => {
  switch (bodyType) {
    case 'رياضية':
      return 'addListing.motorcycleBodySport' as const;
    case 'سكوتر':
      return 'addListing.motorcycleBodyScooter' as const;
    case 'كروزر':
      return 'addListing.motorcycleBodyCruiser' as const;
    case 'تجوال':
      return 'addListing.motorcycleBodyTouring' as const;
    case 'ديرت بايك':
      return 'addListing.motorcycleBodyDirtBike' as const;
    case 'نيكد':
      return 'addListing.motorcycleBodyNaked' as const;
    case 'أدفنشر':
      return 'addListing.motorcycleBodyAdventure' as const;
    default:
      return 'common.other' as const;
  }
};

const getVehicleColorTranslationKey = (color: string) => {
  switch (color) {
    case 'أبيض':
      return 'addListing.colorWhite' as const;
    case 'أسود':
      return 'addListing.colorBlack' as const;
    case 'رمادي':
      return 'addListing.colorGray' as const;
    case 'فضي':
      return 'addListing.colorSilver' as const;
    case 'أحمر':
      return 'addListing.colorRed' as const;
    case 'أزرق':
      return 'addListing.colorBlue' as const;
    case 'بني':
      return 'addListing.colorBrown' as const;
    case 'أخضر':
      return 'addListing.colorGreen' as const;
    case 'بيج':
      return 'addListing.colorBeige' as const;
    case 'ذهبي':
      return 'addListing.colorGold' as const;
    case 'أصفر':
      return 'addListing.colorYellow' as const;
    case 'برتقالي':
      return 'addListing.colorOrange' as const;
    case 'بنفسجي':
      return 'addListing.colorPurple' as const;
    case 'برونزي':
      return 'addListing.colorBronze' as const;
    case 'عنابي':
      return 'addListing.colorBurgundy' as const;
    case 'كحلي':
      return 'addListing.colorNavy' as const;
    case 'زيتي':
      return 'addListing.colorOlive' as const;
    case 'فيروزي':
      return 'addListing.colorTurquoise' as const;
    case 'زهري':
      return 'addListing.colorPink' as const;
    case 'لؤلؤي':
      return 'addListing.colorPearl' as const;
    case 'ماروني':
      return 'addListing.colorMaroon' as const;
    case 'تيتانيوم':
      return 'addListing.colorTitanium' as const;
    default:
      return 'common.other' as const;
  }
};

const getGovernorateTranslationKey = (governorate: string) => {
  switch (governorate) {
    case 'العاصمة':
      return 'addListing.governorateCapital' as const;
    case 'المحرق':
      return 'addListing.governorateMuharraq' as const;
    case 'الشمالية':
      return 'addListing.governorateNorthern' as const;
    case 'الجنوبية':
      return 'addListing.governorateSouthern' as const;
    default:
      return null;
  }
};

const getPlateCategoryTranslationKey = (category: string) => {
  switch (category) {
    case 'عادي':
      return 'addListing.plateCategoryRegular' as const;
    case 'مميز':
      return 'addListing.plateCategorySpecial' as const;
    case 'ثنائي':
      return 'addListing.plateCategoryDouble' as const;
    case 'ثلاثي':
      return 'addListing.plateCategoryTriple' as const;
    case 'رباعي':
      return 'addListing.plateCategoryQuad' as const;
    case 'خماسي':
      return 'addListing.plateCategoryFive' as const;
    case 'نقل خفيف':
      return 'addListing.plateCategoryLightTransport' as const;
    case 'نقل ثقيل':
      return 'addListing.plateCategoryHeavyTransport' as const;
    case 'أجرة':
      return 'addListing.plateCategoryTaxi' as const;
    default:
      return null;
  }
};

const normalizePlateCategory = (plateType: PlateDetails['plateType'], category?: string) => {
  const allowed = PLATE_CATEGORY_OPTIONS[plateType];
  if (!category) return allowed[0] || '';

  if (allowed.includes(category)) {
    return category;
  }

  if (plateType === 'PRIVATE') {
    const legacyMap: Record<string, string> = {
      Private: 'عادي',
      Regular: 'عادي',
      Special: 'مميز',
      'Double digit': 'ثنائي',
      'Triple digit': 'ثلاثي',
      'Quad digit': 'رباعي',
      'Five digit': 'خماسي',
    };
    return legacyMap[category] || allowed[0] || '';
  }

  if (plateType === 'TRANSPORT') {
    const legacyMap: Record<string, string> = {
      'Shared transport': 'نقل خفيف',
      'Light transport': 'نقل خفيف',
      'Heavy transport': 'نقل ثقيل',
      Taxi: 'أجرة',
      Special: 'مميز',
    };
    return legacyMap[category] || allowed[0] || '';
  }

  const legacyMap: Record<string, string> = {
    Motorcycle: 'عادي',
    Regular: 'عادي',
    Special: 'مميز',
  };
  return legacyMap[category] || allowed[0] || '';
};

const normalizePlateCode = (plateType: PlateDetails['plateType'], code?: string) => {
  const allowed = PLATE_CODE_OPTIONS[plateType];
  if (!code) return '';
  if (allowed.includes(code)) {
    return code;
  }

  if (code === 'No code') {
    return 'بدون رمز';
  }

  return '';
};

export default function AddListingDetailScreen() {
  const params = useLocalSearchParams<{ id: string; type: ListingType; mode?: 'edit'; awaitingPackageApproval?: string }>();
  const { id: listingId, type, mode, awaitingPackageApproval } = params;
  const isEditMode = mode === 'edit';
  const { t } = useAppTranslation();
  const { isRTL } = useLanguage();
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
  const direction: 'rtl' | 'ltr' = isRTL ? 'rtl' : 'ltr';
  const textAlign: 'right' | 'left' = isRTL ? 'right' : 'left';
  const rowDirection: 'row-reverse' | 'row' = isRTL ? 'row-reverse' : 'row';
  const inputDirectionProps = { textAlign, writingDirection: direction as 'rtl' | 'ltr' };
  const otherOption = t('common.other');

  const translatedContactPreferences = [
    { value: 'CALL' as const, label: t('addListing.contactCall') },
    { value: 'WHATSAPP' as const, label: t('addListing.contactWhatsApp') },
    { value: 'IN_APP_CHAT' as const, label: t('addListing.contactChat') },
  ];

  const translatedPlateTypeOptions = [
    { value: 'PRIVATE' as const, label: t('addListing.platePrivate') },
    { value: 'TRANSPORT' as const, label: t('addListing.plateTransport') },
    { value: 'MOTORCYCLE' as const, label: t('addListing.plateMotorcycle') },
  ];

  const translatedPlateCategories: Record<PlateDetails['plateType'], Array<{ value: string; label: string }>> = {
    PRIVATE: PLATE_CATEGORY_OPTIONS.PRIVATE.map((category) => ({
      value: category,
      label: getPlateCategoryTranslationKey(category) ? t(getPlateCategoryTranslationKey(category)!) : category,
    })),
    TRANSPORT: PLATE_CATEGORY_OPTIONS.TRANSPORT.map((category) => ({
      value: category,
      label: getPlateCategoryTranslationKey(category) ? t(getPlateCategoryTranslationKey(category)!) : category,
    })),
    MOTORCYCLE: PLATE_CATEGORY_OPTIONS.MOTORCYCLE.map((category) => ({
      value: category,
      label: getPlateCategoryTranslationKey(category) ? t(getPlateCategoryTranslationKey(category)!) : category,
    })),
  };

  const translatedPlateCodes: Record<PlateDetails['plateType'], Array<{ value: string; label: string }>> = {
    PRIVATE: PLATE_CODE_OPTIONS.PRIVATE.map((code) => ({ value: code, label: code === 'بدون رمز' ? t('addListing.noCode') : code })),
    TRANSPORT: PLATE_CODE_OPTIONS.TRANSPORT.map((code) => ({ value: code, label: code === 'بدون رمز' ? t('addListing.noCode') : code })),
    MOTORCYCLE: PLATE_CODE_OPTIONS.MOTORCYCLE.map((code) => ({ value: code, label: code === 'بدون رمز' ? t('addListing.noCode') : code })),
  };

  const translatedPartCategories = [
    { value: 'مكينه', label: t('addListing.partCategoryEngine') },
    { value: 'جير', label: t('addListing.partCategoryGearbox') },
    { value: 'هيكل', label: t('addListing.partCategoryBody') },
    { value: 'كهرباء', label: t('addListing.partCategoryElectrical') },
    { value: 'داخليه', label: t('addListing.partCategoryInterior') },
    { value: 'مكيف', label: t('addListing.partCategoryAC') },
    { value: 'إطارات', label: t('addListing.partCategoryTires') },
    { value: 'زيوت', label: t('addListing.partCategoryOils') },
    { value: 'إكسسوارات', label: t('addListing.partCategoryAccessories') },
    { value: 'أخرى', label: t('addListing.allOther') },
  ];

  const translatedMotorcycleBodyTypes = MotorcycleBodyTypes.map((bodyType) => ({
    value: bodyType,
    label: t(getMotorcycleBodyTypeTranslationKey(bodyType)),
  }));

  const translatedMotorcycleEngineSizes = MOTORCYCLE_ENGINE_SIZES.map((engineSize) => ({
    value: engineSize,
    label: engineSize === 'أخرى' ? t('addListing.allOther') : `${engineSize} CC`,
  }));

  const translatedVehicleColors = VehicleColors.map((color) => ({
    value: color,
    label: color === 'أخرى' ? t('addListing.allOther') : t(getVehicleColorTranslationKey(color)),
  }));

  const translatedFuelOptions = [
    { value: 'PETROL' as const, label: t('addListing.fuelPetrol') },
    { value: 'DIESEL' as const, label: t('addListing.fuelDiesel') },
    { value: 'HYBRID' as const, label: t('addListing.fuelHybrid') },
    { value: 'ELECTRIC' as const, label: t('addListing.fuelElectric') },
  ];

  const translatedConditionOptions = [
    { value: 'NEW' as const, label: t('addListing.conditionNew') },
    { value: 'USED' as const, label: t('addListing.conditionUsed') },
  ];

  const inputStyle = [styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }];
  const pickerItemStyle = [styles.pickerItem, { backgroundColor: theme.card, borderColor: theme.border }];
  const totalSteps = 2;

  useEffect(() => {
    if (awaitingPackageApproval === '1') {
      Alert.alert(
        t('addListing.savedTitle'),
        t('addListing.awaitingPackageApprovalMessage'),
      );
    }
  }, [awaitingPackageApproval, t]);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [listingStatus, setListingStatus] = useState<string | null>(null);

  const [yearPickerTarget, setYearPickerTarget] = useState<'CAR' | 'MOTORCYCLE' | null>(null);

  // Motorcycle Modals
  const [showMotorcycleMakeModal, setShowMotorcycleMakeModal] = useState(false);
  const [showMotorcycleModelModal, setShowMotorcycleModelModal] = useState(false);
  const [showMotorcycleColorModal, setShowMotorcycleColorModal] = useState(false);
  const [showPartMakeModal, setShowPartMakeModal] = useState(false);
  const [showPartModelModal, setShowPartModelModal] = useState(false);
  
  // Custom Flags
  const [isCustomMotorcycleMake, setIsCustomMotorcycleMake] = useState(false);
  const [isCustomMotorcycleModel, setIsCustomMotorcycleModel] = useState(false);
  const [isCustomMotorcycleColor, setIsCustomMotorcycleColor] = useState(false);
  const [isCustomPartMake, setIsCustomPartMake] = useState(false);
  const [isCustomPartModel, setIsCustomPartModel] = useState(false);

  // Car Modals
  const [showCarMakeModal, setShowCarMakeModal] = useState(false);
  const [showCarModelModal, setShowCarModelModal] = useState(false);
  const [showCarTrimModal, setShowCarTrimModal] = useState(false);
  const [showCarColorModal, setShowCarColorModal] = useState(false);
  const [isCustomCarMake, setIsCustomCarMake] = useState(false);
  const [isCustomCarModel, setIsCustomCarModel] = useState(false);
  const [isCustomCarTrim, setIsCustomCarTrim] = useState(false);
  const [isCustomCarColor, setIsCustomCarColor] = useState(false);

  // Location Modals
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
    plateCategory: PLATE_CATEGORY_OPTIONS.PRIVATE[0],
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
    if (!carDetails.trim) {
      setIsCustomCarTrim(false);
      return;
    }

    const trimOptions = getCarTrimOptions(carDetails.make, carDetails.model);
    setIsCustomCarTrim(!trimOptions.includes(carDetails.trim));
  }, [carDetails.make, carDetails.model, carDetails.trim]);

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
          const normalizedPlateType = (plate.plateType || 'PRIVATE') as PlateDetails['plateType'];
          setPlateDetails({
            plateNumber: plate.plateNumber || '',
            plateCategory: normalizePlateCategory(normalizedPlateType, plate.plateCategory),
            plateCode: normalizePlateCode(normalizedPlateType, plate.plateCode),
            plateType: normalizedPlateType,
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

  const getAutoTitle = () => {
    if (type === 'CAR') {
      return [carDetails.make, carDetails.model, carDetails.year].filter(Boolean).join(' ');
    }

    if (type === 'MOTORCYCLE') {
      return [motorcycleDetails.make, motorcycleDetails.model, motorcycleDetails.year].filter(Boolean).join(' ');
    }

    if (type === 'PLATE') {
      return [t('listing.types.plate'), plateDetails.plateCategory || t('common.other'), plateDetails.plateNumber, plateDetails.plateCode].filter(Boolean).join(' ');
    }

    return [partDetails.partCategory || t('listing.types.part'), partDetails.partName, partDetails.compatibleCarMake, partDetails.compatibleCarModel]
      .filter(Boolean)
      .join(' ');
  };

  const isYearValid = (value: string) => {
    const numericYear = Number(value);
    return Number.isInteger(numericYear) && numericYear >= 1960 && numericYear <= CURRENT_YEAR;
  };

  const handleNextStep = async () => {
    if (step !== 1) return;

    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert(t('common.error'), t('addListing.priceGreaterThanZero'));
      return;
    }

    let titleToSave = getAutoTitle();

    if (type === 'CAR') {
      if (!carDetails.make || !carDetails.model || !carDetails.year || !carDetails.mileageKm) {
        Alert.alert(t('common.warning'), t('addListing.completeVehicleBasics'));
        return;
      }
      if (!isYearValid(carDetails.year)) {
        Alert.alert(t('common.warning'), t('addListing.carYearRange'));
        return;
      }
    }

    if (type === 'MOTORCYCLE') {
      if (!motorcycleDetails.make || !motorcycleDetails.model || !motorcycleDetails.year || !motorcycleDetails.mileageKm) {
        Alert.alert(t('common.warning'), t('addListing.completeVehicleBasics'));
        return;
      }
      if (!isYearValid(motorcycleDetails.year)) {
        Alert.alert(t('common.warning'), t('addListing.motorcycleYearRange'));
        return;
      }
    }

    if (type === 'PLATE' && !plateDetails.plateNumber.trim()) {
      Alert.alert(t('common.warning'), t('addListing.plateNumberRequired'));
      return;
    }

    if (type === 'PART' && !partDetails.partCategory.trim()) {
      Alert.alert(t('common.warning'), t('addListing.partCategoryRequired'));
      return;
    }

    if (!titleToSave || titleToSave.trim().length < 3) {
      titleToSave = t('addListing.newListing');
    }

    setFormData((prev) => ({ ...prev, title: titleToSave }));

    await saveBasicInfo(titleToSave);
    await saveSpecificDetails();

    if (step < totalSteps) {
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
        Alert.alert(t('common.error'), apiError.details.join('\n'));
      } else if (apiError?.message) {
        Alert.alert(t('common.error'), String(apiError.message));
      } else {
        Alert.alert(t('common.error'), t('addListing.saveFailed'));
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
          color: carDetails.color || undefined,
          trim: carDetails.trim || undefined,
          bodyType: carDetails.bodyType || undefined,
        });
      } else if (type === 'MOTORCYCLE') {
        await api.post(`/listings/${listingId}/details/motorcycle`, {
          make: motorcycleDetails.make,
          model: motorcycleDetails.model,
          year: parseInt(motorcycleDetails.year),
          mileageKm: parseInt(motorcycleDetails.mileageKm) || 0,
          transmission: motorcycleDetails.transmission,
          condition: motorcycleDetails.condition,
          color: motorcycleDetails.color || undefined,
          engineSize: motorcycleDetails.engineSize || undefined,
          bodyType: motorcycleDetails.bodyType || undefined,
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
      const apiError = error?.response?.data?.error;
      if (apiError?.details && Array.isArray(apiError.details)) {
        Alert.alert(t('common.error'), apiError.details.join('\n'));
      } else if (apiError?.message) {
        Alert.alert(t('common.error'), String(apiError.message));
      } else {
        Alert.alert(t('common.error'), error?.response?.data?.message || t('addListing.detailsSaveFailed'));
      }
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
      Alert.alert(t('common.error'), t('addListing.imagePickFailed'));
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
      Alert.alert(t('common.error'), t('addListing.videoPickFailed'));
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
      Alert.alert(t('common.error'), t('addListing.mediaDeleteFailed'));
    }
  };

  const submitListing = async (action: 'submit' | 'draft') => {
    const existingImages = existingMedia.filter((m) => m.type === 'IMAGE').length;
    const totalImages = images.length + existingImages;

    if (action === 'submit') {
      if (totalImages === 0) {
        Alert.alert(t('common.warning'), t('addListing.needAtLeastOneImage'));
        return;
      }

      if (type === 'CAR' && totalImages < 3) {
        Alert.alert(t('common.warning'), t('addListing.needAtLeastThreeCarImages'));
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
        t('addListing.submitSuccessTitle'),
        action === 'submit'
          ? t('addListing.submitSuccessReview')
          : t('addListing.submitSuccessDraft'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              router.replace('/(tabs)/my-listings');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to submit listing:', error);
      const errMsg: string = error.response?.data?.message ||
        error.response?.data?.error?.message || t('addListing.submitFailed');
      const isCreditsError = errMsg.includes('رصيد') || errMsg.includes('باقة') || errMsg.includes('اشتراك') || errMsg.includes('credit') || errMsg.includes('package') || errMsg.includes('canPost') || errMsg.includes('allowed');
      if (isCreditsError) {
        const isShowroom = useAuthStore.getState().user?.role === 'USER_SHOWROOM';
        Alert.alert(
          isShowroom ? t('addListing.noActiveSubscriptionTitle') : t('addListing.noCreditsTitle'),
          isShowroom
            ? t('addListing.noActiveSubscriptionMessage')
            : t('addListing.noCreditsMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: isShowroom ? t('addListing.subscribeNow') : t('addListing.buyPackageNow'),
              onPress: () =>
                isShowroom
                  ? router.push({
                      pathname: '/(tabs)/profile/subscriptions' as any,
                      params: { returnToListingId: String(listingId) },
                    })
                  : router.push({
                      pathname: '/(tabs)/profile/individual-packages' as any,
                      params: { returnToListingId: String(listingId) },
                    }),
            },
          ]
        );
      } else {
        Alert.alert(t('common.error'), errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={[styles.stepIndicator, { backgroundColor: theme.card }]}>
      {Array.from({ length: totalSteps }, (_, index) => index + 1).map((s) => (
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
          {s < totalSteps && (
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
    const selectedCarBrand = CAR_BRAND_OPTIONS.find((brand) => brand.nameAr === carDetails.make);
    const availableCarModels = selectedCarBrand?.models || [];
    const availableCarTrims = getCarTrimOptions(carDetails.make, carDetails.model);
    const selectedMotorcycleBrand = MOTORCYCLE_BRAND_OPTIONS.find((brand) => brand.nameAr === motorcycleDetails.make);
    const availableMotorcycleModels = selectedMotorcycleBrand?.models || [];
    const selectedPartBrand = CAR_BRAND_OPTIONS.find((brand) => brand.nameAr === partDetails.compatibleCarMake);
    const availablePartModels = selectedPartBrand?.models || [];
    const plateCategories = translatedPlateCategories[plateDetails.plateType] || [];
    const plateCodes = translatedPlateCodes[plateDetails.plateType] || [];

    const renderLocationFields = () => (
      <>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.governorate')}</Text>
          <View style={[styles.pickerContainer, { flexDirection: rowDirection }]}>
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
                  {(() => {
                    const translationKey = getGovernorateTranslationKey(gov);
                    return translationKey ? t(translationKey) : gov;
                  })()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.area')}</Text>
          <TouchableOpacity
            style={[inputStyle, styles.selectorField, { flexDirection: rowDirection }]}
            onPress={() => setShowAreaModal(true)}
          >
            <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
            <Text style={[styles.selectorText, { color: formData.locationArea ? theme.text : theme.textMuted, textAlign }]}>
              {formData.locationArea || t('addListing.selectArea')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.contactPreference')}</Text>
          <View style={[styles.pickerContainer, { flexDirection: rowDirection }]}>
            {translatedContactPreferences.map((pref) => (
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
      </>
    );

    return (
    <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: theme.text, textAlign }]}>{t('addListing.basicInfoTitle')}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted, textAlign }]}>{t('addListing.basicInfoSubtitle')}</Text>

      {type === 'CAR' && (
        <>
          <View style={[styles.row, { flexDirection: rowDirection }]}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.makeLabel')} *</Text>
              <TouchableOpacity style={[inputStyle, styles.selectorField, { flexDirection: rowDirection }]} onPress={() => setShowCarMakeModal(true)}>
                <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                <Text style={[styles.selectorText, { color: carDetails.make ? theme.text : theme.textMuted, textAlign }]}>
                  {isCustomCarMake ? (carDetails.make || t('addListing.allOther')) : (carDetails.make || t('addListing.selectMakePlaceholder'))}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.modelLabel')} *</Text>
              <TouchableOpacity
                style={[inputStyle, styles.selectorField, { flexDirection: rowDirection }, (!carDetails.make && !isCustomCarMake) && styles.disabledField]}
                onPress={() => (carDetails.make || isCustomCarMake) && setShowCarModelModal(true)}
                disabled={!carDetails.make && !isCustomCarMake}
              >
                <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                <Text style={[styles.selectorText, { color: carDetails.model ? theme.text : theme.textMuted, textAlign }]}>
                  {isCustomCarModel ? (carDetails.model || t('addListing.allOther')) : (carDetails.model || t('addListing.selectModelPlaceholder'))}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {(isCustomCarMake || isCustomCarModel) && (
            <View style={[styles.row, { flexDirection: rowDirection }]}>
              {isCustomCarMake && (
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <TextInput
                    style={inputStyle}
                    value={carDetails.make}
                    onChangeText={(text) => setCarDetails((prev) => ({ ...prev, make: text, model: '' }))}
                    placeholder={t('addListing.enterMake')}
                    {...inputDirectionProps}
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              )}
              {isCustomCarModel && (
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <TextInput
                    style={inputStyle}
                    value={carDetails.model}
                    onChangeText={(text) => setCarDetails((prev) => ({ ...prev, model: text }))}
                    placeholder={t('addListing.enterModel')}
                    {...inputDirectionProps}
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              )}
            </View>
          )}

          <View style={[styles.row, { flexDirection: rowDirection }]}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.yearLabel')} *</Text>
              <TouchableOpacity style={[inputStyle, styles.selectorField, { flexDirection: rowDirection }]} onPress={() => setYearPickerTarget('CAR')}>
                <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                <Text style={[styles.selectorText, { color: carDetails.year ? theme.text : theme.textMuted, textAlign }]}>
                  {carDetails.year || t('addListing.selectYear')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.mileageLabel')} *</Text>
              <TextInput
                style={inputStyle}
                value={carDetails.mileageKm}
                onChangeText={(text) => setCarDetails((prev) => ({ ...prev, mileageKm: text.replace(/[^0-9]/g, '') }))}
                placeholder={t('addListing.enterMileageCarExample')}
                {...inputDirectionProps}
                keyboardType="number-pad"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.transmissionLabel')}</Text>
            <View style={[styles.pickerContainer, { flexDirection: rowDirection }]}>
              {[
                { value: 'AUTO', label: t('addListing.transmissionAuto') },
                { value: 'MANUAL', label: t('addListing.transmissionManual') },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    pickerItemStyle,
                    carDetails.transmission === item.value && styles.pickerItemActive,
                    carDetails.transmission === item.value && { backgroundColor: theme.surface, borderColor: theme.primary },
                  ]}
                  onPress={() => setCarDetails((prev) => ({ ...prev, transmission: item.value as CarDetails['transmission'] }))}
                >
                  <Text style={[styles.pickerItemText, { color: carDetails.transmission === item.value ? theme.primary : theme.textMuted }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.fuelLabel')}</Text>
            <View style={[styles.pickerContainer, { flexDirection: rowDirection }]}>
              {[
                { value: 'PETROL', label: t('addListing.fuelPetrol') },
                { value: 'DIESEL', label: t('addListing.fuelDiesel') },
                { value: 'HYBRID', label: t('addListing.fuelHybrid') },
                { value: 'ELECTRIC', label: t('addListing.fuelElectric') },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    pickerItemStyle,
                    carDetails.fuel === item.value && styles.pickerItemActive,
                    carDetails.fuel === item.value && { backgroundColor: theme.surface, borderColor: theme.primary },
                  ]}
                  onPress={() => setCarDetails((prev) => ({ ...prev, fuel: item.value as CarDetails['fuel'] }))}
                >
                  <Text style={[styles.pickerItemText, { color: carDetails.fuel === item.value ? theme.primary : theme.textMuted }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {type === 'MOTORCYCLE' && (
        <>
          <View style={[styles.row, { flexDirection: rowDirection }]}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.makeLabel')} *</Text>
              <TouchableOpacity style={[inputStyle, styles.selectorField, { flexDirection: rowDirection }]} onPress={() => setShowMotorcycleMakeModal(true)}>
                <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                <Text style={[styles.selectorText, { color: motorcycleDetails.make ? theme.text : theme.textMuted, textAlign }]}>
                  {isCustomMotorcycleMake ? (motorcycleDetails.make || t('addListing.allOther')) : (motorcycleDetails.make || t('addListing.selectMakePlaceholder'))}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.modelLabel')} *</Text>
              <TouchableOpacity
                style={[inputStyle, styles.selectorField, { flexDirection: rowDirection }, (!motorcycleDetails.make && !isCustomMotorcycleMake) && styles.disabledField]}
                onPress={() => (motorcycleDetails.make || isCustomMotorcycleMake) && setShowMotorcycleModelModal(true)}
                disabled={!motorcycleDetails.make && !isCustomMotorcycleMake}
              >
                <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                <Text style={[styles.selectorText, { color: motorcycleDetails.model ? theme.text : theme.textMuted, textAlign }]}>
                  {isCustomMotorcycleModel ? (motorcycleDetails.model || t('addListing.allOther')) : (motorcycleDetails.model || t('addListing.selectModelPlaceholder'))}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {(isCustomMotorcycleMake || isCustomMotorcycleModel) && (
            <View style={[styles.row, { flexDirection: rowDirection }]}>
              {isCustomMotorcycleMake && (
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <TextInput
                    style={inputStyle}
                    value={motorcycleDetails.make}
                    onChangeText={(text) => setMotorcycleDetails((prev) => ({ ...prev, make: text, model: '' }))}
                    placeholder={t('addListing.enterMake')}
                    {...inputDirectionProps}
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              )}
              {isCustomMotorcycleModel && (
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <TextInput
                    style={inputStyle}
                    value={motorcycleDetails.model}
                    onChangeText={(text) => setMotorcycleDetails((prev) => ({ ...prev, model: text }))}
                    placeholder={t('addListing.enterModel')}
                    {...inputDirectionProps}
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              )}
            </View>
          )}

          <View style={[styles.row, { flexDirection: rowDirection }]}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.yearLabel')} *</Text>
              <TouchableOpacity style={[inputStyle, styles.selectorField, { flexDirection: rowDirection }]} onPress={() => setYearPickerTarget('MOTORCYCLE')}>
                <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                <Text style={[styles.selectorText, { color: motorcycleDetails.year ? theme.text : theme.textMuted, textAlign }]}>
                  {motorcycleDetails.year || t('addListing.selectYear')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.mileageLabel')} *</Text>
              <TextInput
                style={inputStyle}
                value={motorcycleDetails.mileageKm}
                onChangeText={(text) => setMotorcycleDetails((prev) => ({ ...prev, mileageKm: text.replace(/[^0-9]/g, '') }))}
                placeholder={t('addListing.enterMileageMotorcycleExample')}
                {...inputDirectionProps}
                keyboardType="number-pad"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.transmissionLabel')}</Text>
            <View style={[styles.pickerContainer, { flexDirection: rowDirection }]}>
              {[
                { value: 'AUTO', label: t('addListing.transmissionAuto') },
                { value: 'MANUAL', label: t('addListing.transmissionManual') },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    pickerItemStyle,
                    motorcycleDetails.transmission === item.value && styles.pickerItemActive,
                    motorcycleDetails.transmission === item.value && { backgroundColor: theme.surface, borderColor: theme.primary },
                  ]}
                  onPress={() => setMotorcycleDetails((prev) => ({ ...prev, transmission: item.value as MotorcycleDetails['transmission'] }))}
                >
                  <Text style={[styles.pickerItemText, { color: motorcycleDetails.transmission === item.value ? theme.primary : theme.textMuted }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.bodyTypeLabel')}</Text>
            <View style={[styles.pickerContainer, { flexDirection: rowDirection }]}>
              {translatedMotorcycleBodyTypes.map((bodyType) => (
                <TouchableOpacity
                  key={bodyType.value}
                  style={[
                    pickerItemStyle,
                    motorcycleDetails.bodyType === bodyType.value && styles.pickerItemActive,
                    motorcycleDetails.bodyType === bodyType.value && { backgroundColor: theme.surface, borderColor: theme.primary },
                  ]}
                  onPress={() => setMotorcycleDetails((prev) => ({ ...prev, bodyType: bodyType.value }))}
                >
                  <Text style={[styles.pickerItemText, { color: motorcycleDetails.bodyType === bodyType.value ? theme.primary : theme.textMuted }]}>{bodyType.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.engineSizeLabel')}</Text>
            <View style={[styles.pickerContainer, { flexDirection: rowDirection }]}>
              {translatedMotorcycleEngineSizes.map((engineSize) => (
                <TouchableOpacity
                  key={engineSize.value}
                  style={[
                    pickerItemStyle,
                    motorcycleDetails.engineSize === engineSize.value && styles.pickerItemActive,
                    motorcycleDetails.engineSize === engineSize.value && { backgroundColor: theme.surface, borderColor: theme.primary },
                  ]}
                  onPress={() => setMotorcycleDetails((prev) => ({ ...prev, engineSize: engineSize.value }))}
                >
                  <Text style={[styles.pickerItemText, { color: motorcycleDetails.engineSize === engineSize.value ? theme.primary : theme.textMuted }]}>
                    {engineSize.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {type === 'PLATE' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.plateTypeLabel')}</Text>
            <View style={[styles.pickerContainer, { flexDirection: rowDirection }]}>
              {translatedPlateTypeOptions.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    pickerItemStyle,
                    plateDetails.plateType === item.value && styles.pickerItemActive,
                    plateDetails.plateType === item.value && { backgroundColor: theme.surface, borderColor: theme.primary },
                  ]}
                  onPress={() =>
                    setPlateDetails((prev) => ({
                      ...prev,
                      plateType: item.value,
                      plateCategory: PLATE_CATEGORY_OPTIONS[item.value][0] || '',
                      plateCode: PLATE_CODE_OPTIONS[item.value][0] || '',
                    }))
                  }
                >
                  <Text style={[styles.pickerItemText, { color: plateDetails.plateType === item.value ? theme.primary : theme.textMuted }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.plateCategoryLabel')}</Text>
            <View style={[styles.pickerContainer, { flexDirection: rowDirection }]}>
              {plateCategories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    pickerItemStyle,
                    plateDetails.plateCategory === category.value && styles.pickerItemActive,
                    plateDetails.plateCategory === category.value && { backgroundColor: theme.surface, borderColor: theme.primary },
                  ]}
                  onPress={() => setPlateDetails((prev) => ({ ...prev, plateCategory: category.value }))}
                >
                  <Text style={[styles.pickerItemText, { color: plateDetails.plateCategory === category.value ? theme.primary : theme.textMuted }]}>{category.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.row, { flexDirection: rowDirection }]}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.plateNumberLabel')} *</Text>
              <TextInput
                style={inputStyle}
                value={plateDetails.plateNumber}
                onChangeText={(text) => setPlateDetails((prev) => ({ ...prev, plateNumber: text.replace(/[^0-9]/g, '') }))}
                placeholder={t('addListing.enterPlateNumberExample')}
                {...inputDirectionProps}
                keyboardType="number-pad"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.plateCodeLabel')}</Text>
              <View style={[styles.pickerContainer, { flexDirection: rowDirection }]}>
                {plateCodes.map((code) => (
                  <TouchableOpacity
                    key={code.value}
                    style={[
                      pickerItemStyle,
                      plateDetails.plateCode === code.value && styles.pickerItemActive,
                      plateDetails.plateCode === code.value && { backgroundColor: theme.surface, borderColor: theme.primary },
                    ]}
                    onPress={() => setPlateDetails((prev) => ({ ...prev, plateCode: code.value }))}
                  >
                    <Text style={[styles.pickerItemText, { color: plateDetails.plateCode === code.value ? theme.primary : theme.textMuted }]}>{code.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </>
      )}

      {type === 'PART' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.partCategoryLabel')} *</Text>
            <View style={[styles.pickerContainer, { flexDirection: rowDirection }]}>
              {translatedPartCategories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    pickerItemStyle,
                    partDetails.partCategory === category.value && styles.pickerItemActive,
                    partDetails.partCategory === category.value && { backgroundColor: theme.surface, borderColor: theme.primary },
                  ]}
                  onPress={() => setPartDetails((prev) => ({ ...prev, partCategory: category.value }))}
                >
                  <Text style={[styles.pickerItemText, { color: partDetails.partCategory === category.value ? theme.primary : theme.textMuted }]}>{category.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.partNameLabel')}</Text>
            <TextInput
              style={inputStyle}
              value={partDetails.partName}
              onChangeText={(text) => setPartDetails((prev) => ({ ...prev, partName: text }))}
              placeholder={t('addListing.enterPartNameExample')}
              {...inputDirectionProps}
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <View style={[styles.row, { flexDirection: rowDirection }]}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.compatibleMakeLabel')}</Text>
              <TouchableOpacity style={[inputStyle, styles.selectorField, { flexDirection: rowDirection }]} onPress={() => setShowPartMakeModal(true)}>
                <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                <Text style={[styles.selectorText, { color: partDetails.compatibleCarMake ? theme.text : theme.textMuted, textAlign }]}>
                  {isCustomPartMake ? (partDetails.compatibleCarMake || t('addListing.allOther')) : (partDetails.compatibleCarMake || t('addListing.selectMakePlaceholder'))}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.compatibleModelLabel')}</Text>
              <TouchableOpacity
                style={[inputStyle, styles.selectorField, { flexDirection: rowDirection }, (!partDetails.compatibleCarMake && !isCustomPartMake) && styles.disabledField]}
                onPress={() => (partDetails.compatibleCarMake || isCustomPartMake) && setShowPartModelModal(true)}
                disabled={!partDetails.compatibleCarMake && !isCustomPartMake}
              >
                <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                <Text style={[styles.selectorText, { color: partDetails.compatibleCarModel ? theme.text : theme.textMuted, textAlign }]}>
                  {isCustomPartModel ? (partDetails.compatibleCarModel || t('addListing.allOther')) : (partDetails.compatibleCarModel || t('addListing.selectModelPlaceholder'))}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {(isCustomPartMake || isCustomPartModel) && (
            <View style={[styles.row, { flexDirection: rowDirection }]}>
              {isCustomPartMake && (
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <TextInput
                    style={inputStyle}
                    value={partDetails.compatibleCarMake}
                    onChangeText={(text) => setPartDetails((prev) => ({ ...prev, compatibleCarMake: text, compatibleCarModel: '' }))}
                    placeholder={t('addListing.enterMake')}
                    {...inputDirectionProps}
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              )}
              {isCustomPartModel && (
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <TextInput
                    style={inputStyle}
                    value={partDetails.compatibleCarModel}
                    onChangeText={(text) => setPartDetails((prev) => ({ ...prev, compatibleCarModel: text }))}
                    placeholder={t('addListing.enterModel')}
                    {...inputDirectionProps}
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.conditionLabel')}</Text>
            <View style={[styles.pickerContainer, { flexDirection: rowDirection }]}>
              {[
                { value: 'NEW', label: t('listing.conditionNew') },
                { value: 'USED', label: t('listing.conditionUsed') },
                { value: 'REFURBISHED', label: t('addListing.conditionRefurbished') },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    pickerItemStyle,
                    partDetails.condition === item.value && styles.pickerItemActive,
                    partDetails.condition === item.value && { backgroundColor: theme.surface, borderColor: theme.primary },
                  ]}
                  onPress={() => setPartDetails((prev) => ({ ...prev, condition: item.value as PartDetails['condition'] }))}
                >
                  <Text style={[styles.pickerItemText, { color: partDetails.condition === item.value ? theme.primary : theme.textMuted }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.inputGroup, styles.toggleRow]}>
            <TouchableOpacity
              style={[
                styles.toggleTrack,
                { backgroundColor: partDetails.deliveryAvailable ? theme.primary : theme.border },
              ]}
              onPress={() => setPartDetails((prev) => ({ ...prev, deliveryAvailable: !prev.deliveryAvailable }))}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { alignSelf: partDetails.deliveryAvailable ? 'flex-start' : 'flex-end' },
                ]}
              />
            </TouchableOpacity>
            <Text style={[styles.label, { color: theme.text, marginBottom: 0, textAlign }]}>{t('addListing.deliveryAvailableLabel')}</Text>
          </View>
        </>
      )}

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text, textAlign }]}>{t('addListing.priceLabel')} *</Text>
        <TextInput
          style={inputStyle}
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text.replace(/[^0-9.]/g, '') })}
          placeholder="0.00"
          {...inputDirectionProps}
          keyboardType="decimal-pad"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{t('addListing.descriptionLabel')}</Text>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder={t('addListing.descriptionPlaceholder')}
          textAlign={isRTL ? 'right' : 'left'}
          writingDirection={isRTL ? 'rtl' : 'ltr'}
          multiline
          numberOfLines={4}
          maxLength={5000}
          placeholderTextColor={theme.textMuted}
        />
      </View>

      {renderLocationFields()}

      <PickerModal
        visible={showAreaModal}
        title={t('addListing.selectArea')}
        items={GOVERNORATES[formData.locationGovernorate] || []}
        selectedValue={formData.locationArea}
        onSelect={(val) => setFormData({ ...formData, locationArea: val })}
        onClose={() => setShowAreaModal(false)}
      />

      <PickerModal
        visible={showCarMakeModal}
        title={t('addListing.selectMake')}
        items={CAR_BRAND_OPTIONS.map((brand) => brand.nameAr)}
        selectedValue={isCustomCarMake ? otherOption : carDetails.make}
        onSelect={(value) => {
          if (value === otherOption) {
            setIsCustomCarMake(true);
            setCarDetails((prev) => ({ ...prev, make: '', model: '' }));
            return;
          }

          setIsCustomCarMake(false);
          setIsCustomCarModel(false);
          setIsCustomCarTrim(false);
          setCarDetails((prev) => ({ ...prev, make: value, model: '', trim: '' }));
        }}
        onClose={() => setShowCarMakeModal(false)}
      />

      <PickerModal
        visible={showCarModelModal}
        title={t('addListing.selectModel')}
        items={availableCarModels}
        selectedValue={isCustomCarModel ? otherOption : carDetails.model}
        onSelect={(value) => {
          if (value === otherOption) {
            setIsCustomCarModel(true);
            setCarDetails((prev) => ({ ...prev, model: '' }));
            return;
          }

          setIsCustomCarModel(false);
          setIsCustomCarTrim(false);
          setCarDetails((prev) => ({ ...prev, model: value, trim: '' }));
        }}
        onClose={() => setShowCarModelModal(false)}
      />

      <PickerModal
        visible={showCarTrimModal}
        title={t('addListing.selectTrim')}
        items={availableCarTrims}
        selectedValue={isCustomCarTrim ? otherOption : carDetails.trim}
        onSelect={(value) => {
          if (value === otherOption) {
            setIsCustomCarTrim(true);
            setCarDetails((prev) => ({ ...prev, trim: '' }));
            return;
          }

          setIsCustomCarTrim(false);
          setCarDetails((prev) => ({ ...prev, trim: value }));
        }}
        onClose={() => setShowCarTrimModal(false)}
      />

      <PickerModal
        visible={showMotorcycleMakeModal}
        title={t('addListing.selectMake')}
        items={MOTORCYCLE_BRAND_OPTIONS.map((brand) => brand.nameAr)}
        selectedValue={isCustomMotorcycleMake ? otherOption : motorcycleDetails.make}
        onSelect={(value) => {
          if (value === otherOption) {
            setIsCustomMotorcycleMake(true);
            setMotorcycleDetails((prev) => ({ ...prev, make: '', model: '' }));
            return;
          }

          setIsCustomMotorcycleMake(false);
          setIsCustomMotorcycleModel(false);
          setMotorcycleDetails((prev) => ({ ...prev, make: value, model: '' }));
        }}
        onClose={() => setShowMotorcycleMakeModal(false)}
      />

      <PickerModal
        visible={showMotorcycleModelModal}
        title={t('addListing.selectModel')}
        items={availableMotorcycleModels}
        selectedValue={isCustomMotorcycleModel ? otherOption : motorcycleDetails.model}
        onSelect={(value) => {
          if (value === otherOption) {
            setIsCustomMotorcycleModel(true);
            setMotorcycleDetails((prev) => ({ ...prev, model: '' }));
            return;
          }

          setIsCustomMotorcycleModel(false);
          setMotorcycleDetails((prev) => ({ ...prev, model: value }));
        }}
        onClose={() => setShowMotorcycleModelModal(false)}
      />

      <PickerModal
        visible={showPartMakeModal}
        title={t('addListing.selectCompatibleMake')}
        items={CAR_BRAND_OPTIONS.map((brand) => brand.nameAr)}
        selectedValue={isCustomPartMake ? otherOption : partDetails.compatibleCarMake}
        onSelect={(value) => {
          if (value === otherOption) {
            setIsCustomPartMake(true);
            setPartDetails((prev) => ({ ...prev, compatibleCarMake: '', compatibleCarModel: '' }));
            return;
          }

          setIsCustomPartMake(false);
          setIsCustomPartModel(false);
          setPartDetails((prev) => ({ ...prev, compatibleCarMake: value, compatibleCarModel: '' }));
        }}
        onClose={() => setShowPartMakeModal(false)}
      />

      <PickerModal
        visible={showPartModelModal}
        title={t('addListing.selectCompatibleModel')}
        items={availablePartModels}
        selectedValue={isCustomPartModel ? otherOption : partDetails.compatibleCarModel}
        onSelect={(value) => {
          if (value === otherOption) {
            setIsCustomPartModel(true);
            setPartDetails((prev) => ({ ...prev, compatibleCarModel: '' }));
            return;
          }

          setIsCustomPartModel(false);
          setPartDetails((prev) => ({ ...prev, compatibleCarModel: value }));
        }}
        onClose={() => setShowPartModelModal(false)}
      />

      <PickerModal
        visible={yearPickerTarget !== null}
        title={t('addListing.selectYear')}
        items={YEAR_OPTIONS}
        selectedValue={yearPickerTarget === 'CAR' ? carDetails.year : motorcycleDetails.year}
        onSelect={(value) => {
          if (yearPickerTarget === 'CAR') {
            setCarDetails((prev) => ({ ...prev, year: value }));
          } else {
            setMotorcycleDetails((prev) => ({ ...prev, year: value }));
          }
        }}
        onClose={() => setYearPickerTarget(null)}
        hasOther={false}
      />
    </View>
  );
  };

  const renderCarDetailsForm = () => (
    <View style={styles.form}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('addListing.carDetailsTitle')}</Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>{t('addListing.makeLabel')} *</Text>
          <TextInput
            style={inputStyle}
            value={carDetails.make}
            onChangeText={(text) => setCarDetails({ ...carDetails, make: text })}
            placeholder={t('addListing.enterMake')}
            textAlign={textAlign}
            writingDirection={direction}
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>{t('addListing.modelLabel')} *</Text>
          <TextInput
            style={inputStyle}
            value={carDetails.model}
            onChangeText={(text) => setCarDetails({ ...carDetails, model: text })}
            placeholder={t('addListing.enterModel')}
            textAlign={textAlign}
            writingDirection={direction}
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>{t('addListing.yearLabel')} *</Text>
          <TextInput
            style={inputStyle}
            value={carDetails.year}
            onChangeText={(text) => setCarDetails({ ...carDetails, year: text.replace(/[^0-9]/g, '') })}
            placeholder="2020"
            textAlign="right"
            writingDirection="rtl"
            keyboardType="number-pad"
            maxLength={4}
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>{t('addListing.mileageLabel')}</Text>
          <TextInput
            style={inputStyle}
            value={carDetails.mileageKm}
            onChangeText={(text) => setCarDetails({ ...carDetails, mileageKm: text.replace(/[^0-9]/g, '') })}
            placeholder="50000"
            textAlign="right"
            writingDirection="rtl"
            keyboardType="number-pad"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.conditionLabel')}</Text>
        <View style={styles.pickerContainer}>
          {translatedConditionOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                pickerItemStyle,
                carDetails.condition === option.value && styles.pickerItemActive,
                carDetails.condition === option.value && { backgroundColor: theme.surface, borderColor: theme.primary },
              ]}
              onPress={() => setCarDetails({ ...carDetails, condition: option.value })}
            >
              <Text style={[
                styles.pickerItemText,
                { color: theme.textMuted },
                carDetails.condition === option.value && { color: theme.primary, fontWeight: '500' },
              ]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>{t('addListing.trimLabel')}</Text>
            <TouchableOpacity
              style={[inputStyle, styles.selectorField, (!carDetails.model && !isCustomCarModel) && styles.disabledField]}
              onPress={() => (carDetails.model || isCustomCarModel) && setShowCarTrimModal(true)}
              disabled={!carDetails.model && !isCustomCarModel}
            >
              <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
              <Text style={[styles.selectorText, { color: carDetails.trim ? theme.text : theme.textMuted, textAlign, writingDirection: direction }]}> 
                {isCustomCarTrim ? (carDetails.trim || t('addListing.allOther')) : (carDetails.trim || t('addListing.selectTrim'))}
              </Text>
            </TouchableOpacity>
            {isCustomCarTrim && (
              <TextInput
                style={[inputStyle, { marginTop: 8 }]}
                value={carDetails.trim}
                onChangeText={(text) => setCarDetails((prev) => ({ ...prev, trim: text }))}
                placeholder={t('addListing.enterTrim')}
                textAlign={textAlign}
                writingDirection={direction}
                placeholderTextColor={theme.textMuted}
              />
            )}
          </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.transmissionLabel')}</Text>
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
            ]}>{t('addListing.transmissionAuto')}</Text>
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
            ]}>{t('addListing.transmissionManual')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.fuelLabel')}</Text>
        <View style={styles.pickerContainer}>
          {translatedFuelOptions.map((fuel) => (
            <TouchableOpacity
              key={fuel.value}
              style={[
                pickerItemStyle,
                carDetails.fuel === fuel.value && styles.pickerItemActive,
                carDetails.fuel === fuel.value && { backgroundColor: theme.surface, borderColor: theme.primary },
              ]}
              onPress={() => setCarDetails({ ...carDetails, fuel: fuel.value })}
            >
              <Text style={[
                styles.pickerItemText,
                { color: theme.textMuted },
                carDetails.fuel === fuel.value && { color: theme.primary, fontWeight: '500' },
              ]}>{fuel.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.exteriorColorLabel')}</Text>
        <TouchableOpacity 
          style={[inputStyle, { flexDirection: rowDirection, justifyContent: 'space-between', alignItems: 'center' }]}
          onPress={() => setShowCarColorModal(true)}
        >
          <Text style={{ color: carDetails.color ? theme.text : theme.textMuted, textAlign, writingDirection: direction }}>
            {isCustomCarColor ? (carDetails.color || t('addListing.allOther')) : (carDetails.color || t('addListing.colorSelectTitle'))}
          </Text>
          <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
        </TouchableOpacity>
        {isCustomCarColor && (
          <TextInput
            style={[inputStyle, { marginTop: 8 }]}
            value={carDetails.color}
            onChangeText={(text) => setCarDetails({ ...carDetails, color: text })}
            placeholder={t('addListing.colorPlaceholder')}
            textAlign={textAlign}
            writingDirection={direction}
            placeholderTextColor={theme.textMuted}
          />
        )}
      </View>

      <PickerModal
        visible={showCarColorModal}
        title={t('addListing.colorSelectTitle')}
        items={translatedVehicleColors}
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
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.trimLabel')}</Text>
        <TextInput
          style={inputStyle}
          value={carDetails.trim}
          onChangeText={(text) => setCarDetails({ ...carDetails, trim: text })}
          placeholder={t('addListing.trimPlaceholder')}
          textAlign={textAlign}
          writingDirection={direction}
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.bodyTypeLabel')}</Text>
        <View style={styles.pickerContainer}>
          {CarBodyTypes.map((type: string) => (
            <TouchableOpacity
              key={type}
              style={[
                pickerItemStyle,
                carDetails.bodyType === type && styles.pickerItemActive,
                carDetails.bodyType === type && { backgroundColor: theme.surface, borderColor: theme.primary },
              ]}
              onPress={() => setCarDetails({ ...carDetails, bodyType: type })}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  { color: theme.textMuted },
                  carDetails.bodyType === type && { color: theme.primary, fontWeight: '500' },
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.interiorColorLabel')}</Text>
        <TextInput
          style={inputStyle}
          value={carDetails.interiorColor}
          onChangeText={(text) => setCarDetails({ ...carDetails, interiorColor: text })}
          placeholder={t('addListing.interiorColorPlaceholder')}
          textAlign={textAlign}
          writingDirection={direction}
          placeholderTextColor={theme.textMuted}
        />
      </View>

      {carDetails.condition === 'USED' && (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>{t('addListing.bodyConditionLabel')}</Text>
          <TextInput
            style={inputStyle}
            value={carDetails.bodyCondition}
            onChangeText={(text) => setCarDetails({ ...carDetails, bodyCondition: text })}
            placeholder={t('addListing.bodyConditionPlaceholder')}
            textAlign={textAlign}
            writingDirection={direction}
            placeholderTextColor={theme.textMuted}
          />
        </View>
      )}

      {carDetails.condition === 'USED' && (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>{t('addListing.paintTypeLabel')}</Text>
          <TextInput
            style={inputStyle}
            value={carDetails.paintType}
            onChangeText={(text) => setCarDetails({ ...carDetails, paintType: text })}
            placeholder={t('addListing.paintTypePlaceholder')}
            textAlign={textAlign}
            writingDirection={direction}
            placeholderTextColor={theme.textMuted}
          />
        </View>
      )}

    </View>
  );

// Constants for new Motorcyle Fields
const MOTORCYCLE_BODY_TYPES = MotorcycleBodyTypes;

// ...
  const renderMotorcycleDetailsForm = () => {
    return (
    <View style={styles.form}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('addListing.motorcycleDetailsTitle')}</Text>

      <View style={styles.row}>
        {/* Mileage */}
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>{t('addListing.mileageLabel')}</Text>
          <TextInput
            style={[
              inputStyle, 
              motorcycleDetails.condition === 'NEW' && { opacity: 0.5, backgroundColor: theme.surface }
            ]}
            value={motorcycleDetails.condition === 'NEW' ? '0' : motorcycleDetails.mileageKm}
            onChangeText={(text) => setMotorcycleDetails({ ...motorcycleDetails, mileageKm: text.replace(/[^0-9]/g, '') })}
            placeholder="0"
            textAlign={textAlign}
            writingDirection={direction}
            keyboardType="number-pad"
            placeholderTextColor={theme.textMuted}
            editable={motorcycleDetails.condition !== 'NEW'}
          />
        </View>

        {/* Engine Size */}
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>{t('addListing.engineSizeLabel')}</Text>
          <TextInput
            style={inputStyle}
            value={motorcycleDetails.engineSize}
            onChangeText={(text) => setMotorcycleDetails({ ...motorcycleDetails, engineSize: text })}
            placeholder="1000"
            textAlign={textAlign}
            writingDirection={direction}
            keyboardType="number-pad"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

       {/* Condition */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.conditionLabel')}</Text>
        <View style={styles.pickerContainer}>
          {translatedConditionOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                pickerItemStyle,
                motorcycleDetails.condition === option.value && styles.pickerItemActive,
                motorcycleDetails.condition === option.value && { backgroundColor: theme.surface, borderColor: theme.primary },
              ]}
              onPress={() => setMotorcycleDetails({
                ...motorcycleDetails,
                condition: option.value,
                mileageKm: option.value === 'NEW' ? '0' : motorcycleDetails.mileageKm,
              })}
            >
              <Text style={[
                styles.pickerItemText,
                { color: theme.textMuted },
                motorcycleDetails.condition === option.value && { color: theme.primary, fontWeight: '500' },
              ]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Body Type */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.bodyTypeLabel')}</Text>
        <View style={styles.pickerContainer}>
          {translatedMotorcycleBodyTypes.map((type) => (
             <TouchableOpacity
                key={type.value}
                style={[
                  pickerItemStyle,
                  motorcycleDetails.bodyType === type.value && styles.pickerItemActive,
                  motorcycleDetails.bodyType === type.value && { backgroundColor: theme.surface, borderColor: theme.primary },
                ]}
                onPress={() => setMotorcycleDetails({ ...motorcycleDetails, bodyType: type.value })}
              >
                <Text style={[
                  styles.pickerItemText,
                  { color: theme.textMuted },
                  motorcycleDetails.bodyType === type.value && { color: theme.primary, fontWeight: '500' },
                ]}>{type.label}</Text>
             </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Transmission */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.transmissionLabel')}</Text>
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
            ]}>{t('addListing.transmissionAuto')}</Text>
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
            ]}>{t('addListing.transmissionManual')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Color Dropdown */}
      <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>{t('addListing.exteriorColorLabel')}</Text>
          <TouchableOpacity 
            style={[inputStyle, { flexDirection: rowDirection, justifyContent: 'space-between', alignItems: 'center' }]}
            onPress={() => setShowMotorcycleColorModal(true)}
          >
            <Text style={{ color: motorcycleDetails.color ? theme.text : theme.textMuted, textAlign, writingDirection: direction }}>
              {isCustomMotorcycleColor ? (motorcycleDetails.color || t('addListing.allOther')) : (motorcycleDetails.color || t('addListing.colorSelectTitle'))}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          {isCustomMotorcycleColor && (
            <TextInput
              style={[inputStyle, { marginTop: 8 }]}
              value={motorcycleDetails.color}
              onChangeText={(text) => setMotorcycleDetails({ ...motorcycleDetails, color: text })}
              placeholder={t('addListing.colorPlaceholder')}
              textAlign={textAlign}
              writingDirection={direction}
              placeholderTextColor={theme.textMuted}
            />
          )}
      </View>

      {/* Modals */}
      <PickerModal
        visible={showMotorcycleColorModal}
        title={t('addListing.colorSelectTitle')}
        items={translatedVehicleColors}
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
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('addListing.plateDetailsTitle')}</Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.plateNumberLabel')} *</Text>
        <TextInput
          style={inputStyle}
          value={plateDetails.plateNumber}
          onChangeText={(text) => setPlateDetails({ ...plateDetails, plateNumber: text })}
          placeholder={t('addListing.enterPlateNumberExample')}
          textAlign={textAlign}
          writingDirection={direction}
          keyboardType="number-pad"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.plateTypeLabel')}</Text>
        <View style={styles.pickerContainer}>
          {translatedPlateTypeOptions.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                pickerItemStyle,
                plateDetails.plateType === item.value && styles.pickerItemActive,
                plateDetails.plateType === item.value && { backgroundColor: theme.surface, borderColor: theme.primary },
              ]}
              onPress={() => setPlateDetails({
                ...plateDetails,
                plateType: item.value,
                plateCategory: PLATE_CATEGORY_OPTIONS[item.value][0] || ''
              })}
            >
              <Text style={[
                styles.pickerItemText,
                { color: theme.textMuted },
                plateDetails.plateType === item.value && { color: theme.primary, fontWeight: '500' },
              ]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.plateCodeOptionalLabel')}</Text>
        <TextInput
          style={inputStyle}
          value={plateDetails.plateCode}
          onChangeText={(text) => setPlateDetails({ ...plateDetails, plateCode: text })}
          placeholder="أ"
          textAlign={textAlign}
          writingDirection={direction}
          placeholderTextColor={theme.textMuted}
        />
      </View>
    </View>
  );

  const renderPartDetailsForm = () => (
    <View style={styles.form}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('addListing.partDetailsTitle')}</Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.partCategoryLabel')} *</Text>
        <TextInput
          style={inputStyle}
          value={partDetails.partCategory}
          onChangeText={(text) => setPartDetails({ ...partDetails, partCategory: text })}
          placeholder={t('addListing.partCategoryPlaceholder')}
          textAlign={textAlign}
          writingDirection={direction}
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.partNameLabel')}</Text>
        <TextInput
          style={inputStyle}
          value={partDetails.partName}
          onChangeText={(text) => setPartDetails({ ...partDetails, partName: text })}
          placeholder={t('addListing.enterPartNameExample')}
          textAlign={textAlign}
          writingDirection={direction}
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>{t('addListing.compatibleMakeLabel')}</Text>
          <TextInput
            style={inputStyle}
            value={partDetails.compatibleCarMake}
            onChangeText={(text) => setPartDetails({ ...partDetails, compatibleCarMake: text })}
            placeholder={t('addListing.enterMake')}
            textAlign={textAlign}
            writingDirection={direction}
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.text }]}>{t('addListing.compatibleModelLabel')}</Text>
          <TextInput
            style={inputStyle}
            value={partDetails.compatibleCarModel}
            onChangeText={(text) => setPartDetails({ ...partDetails, compatibleCarModel: text })}
            placeholder={t('addListing.enterModel')}
            textAlign={textAlign}
            writingDirection={direction}
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>{t('addListing.conditionLabel')}</Text>
        <View style={styles.pickerContainer}>
          {[
            { value: 'NEW', label: t('listing.conditionNew') },
            { value: 'USED', label: t('listing.conditionUsed') },
            { value: 'REFURBISHED', label: t('addListing.conditionRefurbished') },
          ].map((cond) => (
            <TouchableOpacity
              key={cond.value}
              style={[
                pickerItemStyle,
                partDetails.condition === cond.value && styles.pickerItemActive,
                partDetails.condition === cond.value && { backgroundColor: theme.surface, borderColor: theme.primary },
              ]}
              onPress={() => setPartDetails({ ...partDetails, condition: cond.value as PartDetails['condition'] })}
            >
              <Text style={[
                styles.pickerItemText,
                { color: theme.textMuted },
                partDetails.condition === cond.value && { color: theme.primary, fontWeight: '500' },
              ]}>
                {cond.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.inputGroup, { flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between' }]}>
        <Text style={[styles.label, { color: theme.text, marginBottom: 0, textAlign, writingDirection: direction }]}>{t('addListing.deliveryAvailableLabel')}</Text>
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
      <Text style={[styles.sectionTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{t('addListing.imagesTitle')}</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}> 
        {type === 'CAR' ? t('addListing.imagesCarSubtitle') : t('addListing.imagesGenericSubtitle')}
      </Text>

      {existingMedia.length > 0 && (
        <View style={styles.existingMediaSection}>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('addListing.currentMedia')}</Text>
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
        <Text style={[styles.addImageText, { color: theme.primary }]}>{t('addListing.chooseImages', { count: images.length })}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.addImageButton, { backgroundColor: theme.surface, borderColor: theme.primary }]} onPress={pickVideos}>
        <Ionicons name="videocam-outline" size={32} color={theme.primary} />
        <Text style={[styles.addImageText, { color: theme.primary }]}>{t('addListing.chooseVideos', { count: videos.length })}</Text>
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
        <View style={[styles.editActions, { flexDirection: rowDirection }]}>
          <TouchableOpacity
            style={[styles.submitButton, styles.submitSecondaryButton, isLoading && styles.submitButtonDisabled]}
            onPress={() => submitListing('draft')}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>{t('addListing.saveDraft')}</Text>
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
              <Text style={styles.submitButtonText}>{t('addListing.republish')}</Text>
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
            <Text style={styles.submitButtonText}>{t('addListing.publish')}</Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader
        title={
          type === 'CAR'
            ? t('addListing.carTitle')
            : type === 'MOTORCYCLE'
            ? t('addListing.motorcycleTitle')
            : type === 'PLATE'
            ? t('addListing.plateTitle')
            : t('addListing.partTitle')
        }
        backgroundColor={theme.card}
        borderColor={theme.border}
        textColor={theme.text}
      />

      {renderStepIndicator()}

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 20 }}>
        {step === 1 && renderBasicInfoForm()}
        {step === 2 && renderImagesStep()}
      </ScrollView>

      {step < totalSteps && (
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border, flexDirection: rowDirection }]}>
          {step > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handlePreviousStep}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.textMuted }]}>{t('addListing.previous')}</Text>
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
              <Text style={styles.primaryButtonText}>{t('addListing.next')}</Text>
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
    marginEnd: 12,
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
    alignSelf: 'flex-end',
    width: '100%',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'right',
    alignSelf: 'flex-end',
    width: '100%',
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
    alignSelf: 'flex-end',
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectorField: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  disabledField: {
    opacity: 0.5,
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
    flexDirection: 'row-reverse',
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
    alignSelf: 'flex-end',
    width: '100%',
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
    left: 4,
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
  toggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    padding: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
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
