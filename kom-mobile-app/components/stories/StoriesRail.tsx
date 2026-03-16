import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';

export interface StoryUser {
  userId: string;
  userName: string;
  userAvatar: string | null;
  role?: string;
  stories: any[];
}

interface StoriesRailProps {
  onPressStory: (userIndex: number, stories: StoryUser[], userId?: string) => void;
  onAddStory: () => void;
  refreshTrigger?: number;
}

export default function StoriesRail({ onPressStory, onAddStory, refreshTrigger }: StoriesRailProps) {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const [stories, setStories] = useState<StoryUser[]>([]);
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    fetchStories();
  }, [refreshTrigger]);

  const fetchStories = async () => {
    try {
      const res = await api.get('/stories/feed');
      // Handle wrapped response from TransformInterceptor ({ success: true, data: [...] })
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setStories(data);
    } catch (error) {
      console.log('Failed to fetch stories', error);
    }
  };

  const wrapperBg = isDark ? '#0B0F1E' : '#FFFFFF';
  const borderBg   = isDark ? '#1E2A40' : '#f8fafc';
  const borderClr  = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const usernameClr = isDark ? '#CBD5E1' : '#333';
  const avatarBg   = isDark ? '#1E2A40' : '#f1f5f9';
  const avatarWrapBg = isDark ? '#0B0F1E' : '#fff';

  return (
    <View style={[styles.wrapper, { backgroundColor: wrapperBg }]}>
      <ScrollView 
        ref={scrollRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Add Story Button */}
        <TouchableOpacity style={styles.item} onPress={onAddStory}>
          <View style={[styles.avatarContainer, styles.addAvatar, { backgroundColor: borderBg, borderColor: borderClr }]}>
            <Image 
              source={{ uri: user?.individualProfile?.avatarUrl || user?.showroomProfile?.logoUrl || undefined }} 
              style={[styles.avatar, { backgroundColor: avatarBg }]} 
              contentFit="cover"
            />
            <View style={styles.plusBadge}>
              <Ionicons name="add" size={16} color="white" />
            </View>
          </View>
          <Text style={[styles.username, { color: usernameClr }]}>إضافة قصة</Text>
        </TouchableOpacity>

        {/* Stories List */}
        {stories.map((storyUser, index) => (
          <TouchableOpacity 
            key={storyUser.userId} 
            style={styles.item} 
            onPress={() => onPressStory(index, stories, storyUser.userId)}
          >
            {/* Gradient Border for Story */}
            <LinearGradient
              colors={['#D4AF37', '#F6EFD3', '#D4AF37']} // Gold Shimmer
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storyBorder}
            >
              <View style={[styles.avatarWrapper, { backgroundColor: avatarWrapBg }]}>
                <Image 
                  source={
                     (storyUser.role === 'ADMIN' || storyUser.role === 'SUPER_ADMIN' || storyUser.userName?.toLowerCase().includes('admin'))
                      ? require('../../assets/images/logo.png')
                      : { uri: storyUser.userAvatar || 'https://ui-avatars.com/api/?name=User' }
                  } 
                  style={[
                    styles.avatar,
                    { backgroundColor: avatarBg },
                    (storyUser.role === 'ADMIN' || storyUser.role === 'SUPER_ADMIN' || storyUser.userName?.toLowerCase().includes('admin')) && { backgroundColor: isDark ? '#1E2A40' : '#fff' }
                  ]} 
                  contentFit="cover"
                />
              </View>
            </LinearGradient>
            <Text style={[styles.username, { color: usernameClr }]} numberOfLines={1}>{storyUser.userName}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 110,
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  container: {
    flex: 1,
  },
  rtlFlip: {
    transform: [{ scaleX: -1 }],
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 16, 
    flexDirection: 'row', // Ensure it respects RTL (starts from right) or simple row (RTL=row-reverse by native?)
    // In React Native with I18nManager.isRTL, 'row' is automatically reversed visually. 
    // IF we want explicit RTL, we just use logical properties, but let's stick to standard flow.
  },
  item: {
    alignItems: 'center',
    width: 72,
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    marginBottom: 6,
  },
  addAvatar: {
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 34,
  },
  storyBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 2.5, // Border width
    marginBottom: 6,
  },
  avatarWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 35,
    padding: 2, // Space between border and image
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    backgroundColor: '#f1f5f9',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#D4AF37',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Cairo_500Medium', // Use new font
  },
});
