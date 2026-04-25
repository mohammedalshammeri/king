import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTranslation, useLanguage } from '@/context/LanguageContext';

interface ListingCardProps {
  id: string;
  title: string;
  price: string | number;
  image: string;
  location?: string;
  postedAt?: string;
  type: string;
  viewsCount?: number;
}

const typeLabelKey = (t: string) =>
  t === 'CAR' ? 'listing.types.car' : t === 'MOTORCYCLE' ? 'listing.types.motorcycle' : t === 'PLATE' ? 'listing.types.plate' : 'listing.types.part';

const typeColor = (t: string) =>
  t === 'CAR' ? '#3B82F6' : t === 'MOTORCYCLE' ? '#8B5CF6' : t === 'PLATE' ? '#059669' : '#F59E0B';

export default function ListingCard({ id, title, price, image, location, type, viewsCount }: ListingCardProps) {
  const { isRTL } = useLanguage();
  const { t } = useAppTranslation();
  const accent = typeColor(type);
  return (
    <Link href={{ pathname: '/listing/[id]', params: { id } }} asChild>
      <TouchableOpacity style={styles.card} activeOpacity={0.92}>
        {/* ── Image Section ── */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: image || 'https://placehold.co/400x300/E4EAF4/9BA3B2?text=KOM' }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Strong gradient for readability */}
          <LinearGradient
            colors={['transparent', 'rgba(10,11,20,0.75)']}
            style={styles.imgGradient}
          />

          {/* Logo watermark */}
          <View style={styles.watermark} pointerEvents="none">
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.watermarkImg}
              resizeMode="contain"
            />
          </View>

          {/* Type badge - colored accent */}
          <View style={[styles.typeBadge, isRTL ? styles.typeBadgeEnd : styles.typeBadgeStart, { backgroundColor: accent }]}>
            <Text style={styles.typeText}>{t(typeLabelKey(type))}</Text>
          </View>

          <View style={[styles.priceWrap, isRTL ? styles.priceWrapEnd : styles.priceWrapStart]}>
            <Text style={styles.priceValue}>{Number(price).toLocaleString()}</Text>
            <Text style={styles.priceCur}>{t('common.bhd')}</Text>
          </View>
        </View>

        {/* ── Content Section ── */}
        <View style={[styles.content, isRTL ? styles.contentEndInset : styles.contentStartInset]}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>{title}</Text>

          <View style={[styles.metaRow, { flexDirection: 'row' }]}>
            <View style={[styles.metaItem, { flexDirection: 'row' }]}>
              <Ionicons name="location-sharp" size={13} color="#9BA3B2" />
              <Text style={[styles.metaText, { textAlign: isRTL ? 'right' : 'left' }]}>{location || t('common.bahrain')}</Text>
            </View>

            <View style={[styles.metaItem, { flexDirection: 'row' }]}>
              <Ionicons name="eye-outline" size={13} color="#9BA3B2" />
              <Text style={[styles.metaText, { textAlign: isRTL ? 'right' : 'left' }]}>{viewsCount || 0}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.accentStripe, isRTL ? styles.accentStripeStart : styles.accentStripeEnd, { backgroundColor: accent }]} />
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#1A2050',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEF2FA',
  },
  imageWrap: {
    height: 190,
    width: '100%',
    backgroundColor: '#EEF2FA',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imgGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  watermark: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  watermarkImg: {
    width: 56,
    height: 56,
    opacity: 0.12,
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    zIndex: 2,
  },
  typeBadgeStart: { left: 12 },
  typeBadgeEnd: { right: 12 },
  typeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  priceWrap: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    zIndex: 2,
  },
  priceWrapStart: { left: 14 },
  priceWrapEnd: { right: 14 },
  priceValue: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  priceCur: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contentStartInset: { paddingEnd: 22 },
  contentEndInset: { paddingStart: 22 },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0B14',
    lineHeight: 22,
    marginBottom: 10,
  },
  metaRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#9BA3B2',
    fontWeight: '500',
  },
  accentStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
  },
  accentStripeStart: {
    left: 0,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  accentStripeEnd: {
    right: 0,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
});
