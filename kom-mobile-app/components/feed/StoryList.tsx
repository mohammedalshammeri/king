import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';

// Mock types - align with API response later
interface StoryGroup {
  userId: string;
  userName: string;
  userAvatar: string | null;
  role?: string;
  stories: any[];
}

interface StoryListProps {
  stories: StoryGroup[];
  onStoryPress?: (index: number) => void;
}

export default function StoryList({ stories, onStoryPress }: StoryListProps) {
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>القصص</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rtlFlip}
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* Helper to add new story (static for now) */}
        <TouchableOpacity style={[styles.itemContainer, styles.rtlFlip]}>
            <View style={[styles.avatarContainer, { borderColor: isDark ? '#333' : '#eee', borderStyle: 'dashed' }]}>
                <Text style={{ fontSize: 24, color: Colors.primary }}>+</Text>
            </View>
            <Text style={[styles.name, { color: isDark ? '#ccc' : '#666' }]}>قصتي</Text>
        </TouchableOpacity>

        {stories.map((group, index) => {
          const isSystemAdmin = group.role === 'ADMIN' || group.role === 'SUPER_ADMIN' || group.userName.toLowerCase().includes('admin');
          const avatarSource = isSystemAdmin 
              ? require('../../assets/images/logo.png') 
              : { uri: group.userAvatar || 'https://via.placeholder.com/60' };

          return (
            <TouchableOpacity 
              key={group.userId} 
              style={[styles.itemContainer, styles.rtlFlip]}
              onPress={() => onStoryPress && onStoryPress(index)}
            >
              <View style={[styles.avatarContainer, { borderColor: Colors.primary, backgroundColor: isSystemAdmin ? '#fff' : 'transparent' }]}>
                <Image 
                    source={avatarSource} 
                    style={styles.avatar} 
                    resizeMode={isSystemAdmin ? 'contain' : 'cover'}
                />
              </View>
              <Text numberOfLines={1} style={[styles.name, { color: isDark ? '#fff' : '#000' }]}>
                  {group.userName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  rtlFlip: {
    transform: [{ scaleX: -1 }],
  },
  itemContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 70,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#eee'
  },
  name: {
    fontSize: 11,
    textAlign: 'center',
  }
});
