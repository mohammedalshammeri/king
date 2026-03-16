import { useTheme } from './ThemeContext';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import React from 'react';

// Helper function to apply dark mode classes
export function tw(className: string, isDark: boolean): string {
  if (!isDark) {
    // Remove all dark: prefixed classes
    return className.replace(/dark:[^\s]+/g, '').trim();
  }
  
  // In dark mode, replace classes with their dark equivalents
  const classes = className.split(' ');
  const result: string[] = [];
  
  for (const cls of classes) {
    if (cls.startsWith('dark:')) {
      // Add the dark class without the prefix
      result.push(cls.replace('dark:', ''));
    } else if (!classes.some(c => c === `dark:${cls}`)) {
      // Only add light class if there's no dark override
      result.push(cls);
    }
  }
  
  return result.join(' ');
}

// Themed components
export function ThemedView({ className = '', style, ...props }: any) {
  const { isDark } = useTheme();
  return <View className={tw(className, isDark)} style={style} {...props} />;
}

export function ThemedText({ className = '', style, ...props }: any) {
  const { isDark } = useTheme();
  return <Text className={tw(className, isDark)} style={style} {...props} />;
}

export function ThemedScrollView({ className = '', style, ...props }: any) {
  const { isDark } = useTheme();
  return <ScrollView className={tw(className, isDark)} style={style} {...props} />;
}

export function ThemedTouchableOpacity({ className = '', style, ...props }: any) {
  const { isDark } = useTheme();
  return <TouchableOpacity className={tw(className, isDark)} style={style} {...props} />;
}

export function ThemedTextInput({ className = '', style, ...props }: any) {
  const { isDark } = useTheme();
  return <TextInput className={tw(className, isDark)} style={style} {...props} />;
}
