import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';

interface AddStoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStoryModal({ visible, onClose, onSuccess }: AddStoryModalProps) {
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const { isDark } = useTheme();

  const theme = {
    background: isDark ? '#0A0B14' : '#F2F5FC',
    surface: isDark ? '#13142A' : '#FFFFFF',
    text: isDark ? '#F2F5FC' : '#0A0B14',
    subText: isDark ? '#CBD5E1' : '#4A5568',
    border: isDark ? '#252540' : '#E4EAF4',
    muted: isDark ? '#6B7280' : '#9BA3B2',
  };

  const videoSource = media?.type === 'video' ? media.uri : null;
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    if (videoSource) player.play();
  });

  const pickMedia = async (type: 'image' | 'video') => {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
        allowsEditing: true,
        });

        if (!result.canceled && result.assets[0]) {
        setMedia(result.assets[0]);
        }
    } catch (e) {
        console.log(e);
        Alert.alert('Error', 'Please allow permission to access gallery');
    }
  };

  const uploadStory = async () => {
    if (!media) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: media.uri,
        type: media.type === 'video' ? 'video/mp4' : 'image/jpeg',
        name: media.fileName || (media.type === 'video' ? 'story.mp4' : 'story.jpg'),
      } as any);
      
      formData.append('mediaType', media.type === 'video' ? 'VIDEO' : 'IMAGE');
      if (media.duration) {
          formData.append('duration', Math.round(media.duration / 1000).toString());
      } else {
          formData.append('duration', '5');
      }

      await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      Alert.alert('تم الإرسال', 'القصة قيد المراجعة من قبل الإدارة');
      setMedia(null);
      onSuccess();
    } catch (error) {
      console.log(error);
      Alert.alert('خطأ', 'فشل رفع القصة');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header — navy gradient matching the rest of the app */}
        <LinearGradient
          colors={['#0E1830', '#162444']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <View style={styles.closeCircle}>
              <Ionicons name="arrow-forward" size={18} color="#D4AF37" />
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>إضافة قصة</Text>
          <View style={styles.closeBtnPlaceholder} />
        </LinearGradient>

        <View style={[styles.content, { backgroundColor: theme.background }]}>
           {!media ? (
               <View style={styles.buttons}>
                   <TouchableOpacity style={styles.btn} onPress={() => pickMedia('image')}>
                       <Ionicons name="image" size={32} color="white" />
                       <Text style={styles.btnText}>اختر صورة</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={styles.btn} onPress={() => pickMedia('video')}>
                       <Ionicons name="videocam" size={32} color="white" />
                       <Text style={styles.btnText}>اختر فيديو</Text>
                   </TouchableOpacity>
               </View>
           ) : (
               <View style={styles.preview}>
                   {media.type === 'video' ? (
                       <VideoView
                           player={player}
                           style={styles.previewMedia}
                           contentFit="contain"
                           allowsFullscreen
                           allowsPictureInPicture
                       />
                   ) : (
                       <Image source={{ uri: media.uri }} style={styles.previewMedia} contentFit="contain" />
                   )}
                   
                   <View style={styles.actions}>
                        <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setMedia(null)} disabled={uploading}>
                            <Text style={[styles.cancelText, { color: theme.text }]}>إلغاء</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.uploadBtn]} onPress={uploadStory} disabled={uploading}>
                            {uploading ? <ActivityIndicator color="white" /> : <Text style={styles.uploadText}>نشر القصة</Text>}
                        </TouchableOpacity>
                   </View>
               </View>
           )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    width: 44,
    alignItems: 'center',
    zIndex: 2,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnPlaceholder: {
    position: 'absolute',
    left: 16,
    width: 44,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    color: '#D4AF37',
    writingDirection: 'rtl',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 20,
  },
  btn: {
    width: 120,
    height: 120,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  btnText: {
    color: 'white',
    marginTop: 10,
    fontWeight: 'bold',
  },
  preview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewMedia: {
    width: '100%',
    height: '60%',
    borderRadius: 12,
    backgroundColor: '#000',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtn: {
    backgroundColor: Colors.primary,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  uploadText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelText: {
    fontSize: 16,
  },
});
