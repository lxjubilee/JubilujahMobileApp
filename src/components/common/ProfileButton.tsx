import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/context';
import { useAppSelector } from '@/hooks';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

interface ProfileButtonProps {
  onPress?: () => void;
  /** Diameter of the avatar circle. */
  size?: number;
}

/**
 * Header profile control: shows the first letter of the signed-in user's name
 * in a circle. Falls back to the generic person icon when no name is available.
 */
export const ProfileButton: React.FC<ProfileButtonProps> = ({ onPress, size = 32 }) => {
  const theme = useTheme();
  const user = useAppSelector((s) => s.auth.user);

  const initial = useMemo(() => {
    const name = user?.firstName || user?.displayName || user?.email || '';
    return name.trim().charAt(0).toUpperCase();
  }, [user]);

  if (!initial) {
    return <IconButton name="person-circle-outline" size={size - 2} onPress={onPress} />;
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.primary,
        },
      ]}
    >
      <AppText style={[styles.text, { fontSize: Math.round(size * 0.47) }]} allowFontScaling={false}>
        {initial}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '700' },
});
