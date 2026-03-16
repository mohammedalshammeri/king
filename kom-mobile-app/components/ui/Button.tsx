import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  style,
  textStyle
}: ButtonProps) {
  
  const getBackgroundColor = () => {
    if (disabled) return '#CCCCCC';
    switch (variant) {
      case 'primary': return Colors.primary;
      case 'secondary': return Colors.surface;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return Colors.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary': return '#000000'; // Black text on Gold/Yellow background
      case 'secondary': return Colors.text;
      case 'outline': return Colors.primary;
      case 'ghost': return Colors.textSecondary;
      default: return '#000000';
    }
  };

  const getBorder = () => {
    if (variant === 'outline') return { borderWidth: 1, borderColor: Colors.border };
    return {};
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getBorder(),
        style
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 25, // Rounded Pill
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
