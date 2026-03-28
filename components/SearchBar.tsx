import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import React, { useCallback } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
}

export default function SearchBar({
  placeholder,
  value,
  onChangeText,
  onClear,
}: SearchBarProps) {
  const handleClear = useCallback(() => {
    onChangeText('');
    onClear?.();
  }, [onChangeText, onClear]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        editable={true}
      />
      {value.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    paddingRight: 40,
    fontWeight: FontWeight.medium,
  },
  clearButton: {
    position: 'absolute',
    right: Spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  clearIcon: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
  },
});
