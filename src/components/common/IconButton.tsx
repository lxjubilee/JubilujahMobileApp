import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context';

interface IconButtonProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  size?: number;
  color?: string;
  style?: ViewStyle;
  hitSlop?: number;
  disabled?: boolean;
}

/** Pressable icon with a subtle press-opacity, used across headers and the player. */
export const IconButton: React.FC<IconButtonProps> = ({
  name,
  onPress,
  size = 24,
  color,
  style,
  hitSlop = 10,
  disabled,
}) => {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.base,
        style,
        { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
      ]}
    >
      <Ionicons name={name} size={size} color={color ?? theme.colors.icon} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
