import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface VideoItem {
  id: string;
  title?: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  viewsCount: number;
}

interface VideoFeedItemProps {
    video: VideoItem;
    isActive?: boolean;
    height?: number;
}

export default function VideoFeedItem({ video, isActive = false, height }: VideoFeedItemProps) {
  const { isDark } = useTheme();
  // Removed videoRef
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const insets = useSafeAreaInsets();

  const containerHeight = height || Dimensions.get('window').height;

  const player = useVideoPlayer(video.videoUrl, player => {
    player.loop = true;
  });

  useEffect(() => {
      const subscription = player.addListener('playingChange', (playing) => {
          setIsPlaying(playing.isPlaying);
      });
      return () => subscription.remove();
  }, [player]);

  useEffect(() => {
     player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (isActive) {
        player.play();
    } else {
        player.pause();
        // Reset position
        player.currentTime = 0;
    }
  }, [isActive, player]);

  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View style={[styles.container, { height: containerHeight, backgroundColor: '#000' }]}>
      <VideoView
        player={player}
        style={[styles.video, { height: containerHeight }]}
        contentFit="cover"
        nativeControls={false}
      />
      
      {/* Play Toggle Overlay */}
      <TouchableOpacity 
        activeOpacity={1} 
        style={styles.overlayResponse} 
        onPress={togglePlay} 
      >
        {!isPlaying && (
           <View style={styles.playIconContainer}>
              <Ionicons name="play" size={50} color="rgba(255,255,255,0.6)" />
           </View>
        )}
      </TouchableOpacity>
        
      {/* Side Actions (Like, Share, etc. - Mocked for now) */}
      <View style={[styles.sideActions, { bottom: 100 + insets.bottom }]}>
           <TouchableOpacity style={styles.actionButton} onPress={() => setIsMuted(!isMuted)}>
              <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={26} color="#fff" />
          </TouchableOpacity>
      </View>

      {/* Strong gradient at bottom for text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Detail Overlay */}
      <View style={[styles.detailsOverlay, { bottom: 20 + insets.bottom }]}>
         <View style={styles.userInfo}>
            <View style={[styles.adminAvatar, { backgroundColor: '#fff' }]}>
                <Image 
                  source={require('../../assets/images/logo.png')} 
                  resizeMode="cover"
                  style={{ width: '100%', height: '100%', borderRadius: 16 }}
                />
            </View>
            <Text style={styles.authorName}>KOM Admin</Text>
         </View>
         
         {video.title && <Text style={styles.title}>{video.title}</Text>}
         {video.description && (
             <Text numberOfLines={2} style={styles.description}>
                {video.description}
             </Text>
         )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    position: 'relative',
    overflow: 'hidden'
  },
  video: {
    width: '100%',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    zIndex: 1,
  },
  overlayResponse: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 50,
    padding: 20
  },
  sideActions: {
      position: 'absolute',
      right: 10,
      zIndex: 2,
      alignItems: 'center',
      gap: 20
  },
  actionButton: {
      alignItems: 'center',
      gap: 5
  },
  actionText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600'
  },
  detailsOverlay: {
      position: 'absolute',
      left: 10,
      right: 60, // Leave space for side actions on the right
      zIndex: 2,
      justifyContent: 'flex-end',
      paddingBottom: 20
  },
  userInfo: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      marginBottom: 8,
      justifyContent: 'flex-start',
      gap: 8,
  },
  adminAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#fff'
  },
  authorName: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 15,
      textAlign: 'right',
      textShadowColor: 'rgba(0,0,0,0.9)',
      textShadowOffset: {width: 0, height: 1},
      textShadowRadius: 4,
      writingDirection: 'rtl'
  },
  title: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 6,
      textAlign: 'right',
      textShadowColor: 'rgba(0,0,0,0.9)',
      textShadowOffset: {width: 0, height: 1},
      textShadowRadius: 4,
      writingDirection: 'rtl'
  },
  description: {
      color: '#f0f0f0',
      fontSize: 13,
      marginBottom: 6,
      textAlign: 'right',
      textShadowColor: 'rgba(0,0,0,0.9)',
      textShadowOffset: {width: 0, height: 1},
      textShadowRadius: 4,
      writingDirection: 'rtl'
  },
  stats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4
  },
  statsText: {
      color: '#ddd',
      fontSize: 12
  }
});
