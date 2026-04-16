import React from 'react';
import type { ComponentProps } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: IoniconName;
  rightIcon?: React.ReactNode;
  containerStyle?: ComponentProps<typeof View>['style'];
}

export function Input({
  label,
  error,
  icon,
  rightIcon,
  style,
  containerStyle,
  ...props
}: InputProps) {
  const { isDark } = useTheme();
  const { isRTL } = useLanguage();

  const theme = {
    label: isDark ? '#e5e7eb' : Colors.text,
    text: isDark ? '#e5e7eb' : Colors.text,
    background: isDark ? '#1f2937' : Colors.surface,
    border: isDark ? '#334155' : 'transparent',
    placeholder: isDark ? '#94a3b8' : '#999',
    icon: isDark ? '#cbd5e1' : '#64748B',
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: theme.label }]}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
          { backgroundColor: theme.background, borderColor: theme.border },
          error && styles.inputWrapperError,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? Colors.error : theme.icon}
            style={styles.leadingIcon}
          />
        )}

        <TextInput
          {...props}
          style={[
            styles.input,
            icon && styles.inputWithLeadingIcon,
            rightIcon && styles.inputWithTrailingIcon,
            { color: theme.text },
            style,
            { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          placeholderTextColor={theme.placeholder}

          textAlign={isRTL ? 'right' : 'left'}
          textAlignVertical="center"

          /* Android stability */
          multiline={false}
        />

        {rightIcon && <View style={styles.trailingIcon}>{rightIcon}</View>}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },

  inputWrapper: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  inputWrapperError: {
    borderColor: Colors.error,
  },

  leadingIcon: {
    marginStart: 8,
  },

  trailingIcon: {
    marginEnd: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  inputWithLeadingIcon: {},
  inputWithTrailingIcon: {},

  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
});
