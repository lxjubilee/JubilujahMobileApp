import React, { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image, ImageContentFit, ImageStyle } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context';
import { cdnUrl } from '@/utils';

interface ArtworkProps {
  /** CDN-relative or absolute path. Resolved via cdnUrl(). */
  uri?: string | null;
  /** Background for the placeholder shown when there's no image / it fails to load. */
  accentColor?: string;
  /** Sizing/radius style — applied identically to the image and the placeholder. */
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  transition?: number;
  blurRadius?: number;
  /** Placeholder glyph size. */
  iconSize?: number;
}

/**
 * Album/artist artwork with a graceful fallback. Covers are not yet published to
 * the CDN, so most resolve to a 404 today — on error (or empty uri) this renders
 * an accent-colored tile with a music glyph instead of a broken image. When
 * covers are later published, real artwork appears automatically with no change.
 */
export const Artwork: React.FC<ArtworkProps> = ({
  uri,
  accentColor,
  style,
  contentFit = 'cover',
  transition = 250,
  blurRadius,
  iconSize = 28,
}) => {
  const theme = useTheme();
  const resolved = cdnUrl(uri ?? '');
  const [failed, setFailed] = useState(false);

  // Reset on source change so recycled list rows re-attempt the new image.
  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) {
    return (
      <View
        style={[
          styles.fallback,
          style as StyleProp<ViewStyle>,
          // Applied last so the accent wins over any backgroundColor in `style`.
          { backgroundColor: accentColor ?? theme.colors.surface },
        ]}
      >
        <Ionicons name="musical-notes" size={iconSize} color="rgba(255,255,255,0.55)" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolved }}
      style={style}
      contentFit={contentFit}
      transition={transition}
      blurRadius={blurRadius}
      recyclingKey={resolved}
      onError={() => setFailed(true)}
    />
  );
};

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
