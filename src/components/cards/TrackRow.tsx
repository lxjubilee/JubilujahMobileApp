import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context';
import { Track } from '@/types';
import { cdnUrl, formatDuration } from '@/utils';
import { AppText } from '../common/AppText';
import { IconButton } from '../common/IconButton';

interface TrackRowProps {
  track: Track;
  onPress?: (track: Track) => void;
  onOptions?: (track: Track) => void;
  /** Show a leading index number instead of artwork (album track listing). */
  index?: number;
  isActive?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (track: Track) => void;
}

/** Single track row — used in album listings, artist top tracks, search, queue. */
export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  onPress,
  onOptions,
  index,
  isActive,
  isFavorite,
  onToggleFavorite,
}) => {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => onPress?.(track)}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      {index != null ? (
        <View style={styles.indexBox}>
          {isActive ? (
            <Ionicons name="musical-notes" size={16} color={theme.colors.accent} />
          ) : (
            <AppText variant="body" color="textMuted">
              {index}
            </AppText>
          )}
        </View>
      ) : (
        <Image
          source={{ uri: cdnUrl(track.artwork) }}
          style={[styles.art, { borderRadius: theme.radius.sm }]}
          contentFit="cover"
          transition={150}
        />
      )}

      <View style={styles.meta}>
        <AppText
          variant="h3"
          numberOfLines={1}
          color={isActive ? 'accent' : 'text'}
        >
          {track.title}
        </AppText>
        <AppText variant="bodySm" color="textMuted" numberOfLines={1}>
          {track.artistName}
        </AppText>
      </View>

      {onToggleFavorite ? (
        <IconButton
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={20}
          color={isFavorite ? theme.colors.accent : theme.colors.iconMuted}
          onPress={() => onToggleFavorite(track)}
          style={styles.action}
        />
      ) : (
        <AppText variant="caption" color="textMuted" style={styles.action}>
          {formatDuration(track.duration)}
        </AppText>
      )}

      {onOptions ? (
        <IconButton
          name="ellipsis-horizontal"
          size={20}
          color={theme.colors.iconMuted}
          onPress={() => onOptions(track)}
        />
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  indexBox: { width: 36, alignItems: 'center', justifyContent: 'center' },
  art: { width: 48, height: 48, backgroundColor: '#222' },
  meta: { flex: 1, marginLeft: 12, marginRight: 8 },
  action: { marginHorizontal: 6 },
});
