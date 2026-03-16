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
            { textAlign: 'right', writingDirection: 'rtl' },
          ]}
          placeholderTextColor={theme.placeholder}

          /* ✅ RTL FIX — الطريقة الصحيحة */
          textAlign="right"
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
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  inputWrapper: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  inputWrapperError: {
    borderColor: Colors.error,
  },

  leadingIcon: {
    marginLeft: 8,
  },

  trailingIcon: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,

    /* RTL هنا فقط */
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  inputWithLeadingIcon: {},
  inputWithTrailingIcon: {},

  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
