import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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

const typeLabel = (t: string) =>
  t === 'CAR' ? 'سيارة' : t === 'MOTORCYCLE' ? 'دراجة' : t === 'PLATE' ? 'لوحة' : 'قطعة';

const typeColor = (t: string) =>
  t === 'CAR' ? '#3B82F6' : t === 'MOTORCYCLE' ? '#8B5CF6' : t === 'PLATE' ? '#059669' : '#F59E0B';

export default function ListingCard({ id, title, price, image, location, type, viewsCount }: ListingCardProps) {
  const accent = typeColor(type);
  return (
    <Link href={`/listing/${id}`} asChild>
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
          <View style={[styles.typeBadge, { backgroundColor: accent }]}>
            <Text style={styles.typeText}>{typeLabel(type)}</Text>
          </View>

          {/* Price inside the image - bottom left */}
          <View style={styles.priceWrap}>
            <Text style={styles.priceValue}>{Number(price).toLocaleString()}</Text>
            <Text style={styles.priceCur}>د.ب</Text>
          </View>
        </View>

        {/* ── Content Section ── */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-sharp" size={13} color="#9BA3B2" />
              <Text style={styles.metaText}>{location || 'البحرين'}</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={13} color="#9BA3B2" />
              <Text style={styles.metaText}>{viewsCount || 0}</Text>
            </View>
          </View>
        </View>

        {/* Left accent stripe */}
        <View style={[styles.accentStripe, { backgroundColor: accent }]} />
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
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    zIndex: 2,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  priceWrap: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 4,
    zIndex: 2,
  },
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
    paddingLeft: 22,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0B14',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row-reverse',
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
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
});
