import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context';
import { Track } from '@/types';
import { cdnUrl } from '@/utils';
import { AppText } from '../common/AppText';

export interface TrackOption {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: (track: Track) => void;
  destructive?: boolean;
}

interface TrackOptionsModalProps {
  track: Track | null;
  options: TrackOption[];
  onClose: () => void;
}

/** Bottom-sheet style action menu for a track (favorite, queue, downloads…). */
export const TrackOptionsModal: React.FC<TrackOptionsModalProps> = ({
  track,
  options,
  onClose,
}) => {
  const theme = useTheme();
  const visible = track != null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.backgroundElevated, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl },
          ]}
        >
          {track ? (
            <View style={styles.header}>
              <Image
                source={{ uri: cdnUrl(track.artwork) }}
                style={[styles.art, { borderRadius: theme.radius.sm }]}
                contentFit="cover"
              />
              <View style={styles.headerMeta}>
                <AppText variant="h3" numberOfLines={1}>
                  {track.title}
                </AppText>
                <AppText variant="bodySm" color="textMuted" numberOfLines={1}>
                  {track.artistName}
                </AppText>
              </View>
            </View>
          ) : null}

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {options.map((opt) => (
            <Pressable
              key={opt.key}
              style={({ pressed }) => [styles.option, { opacity: pressed ? 0.6 : 1 }]}
              onPress={() => {
                if (track) opt.onPress(track);
                onClose();
              }}
            >
              <Ionicons
                name={opt.icon}
                size={22}
                color={opt.destructive ? theme.colors.danger : theme.colors.icon}
              />
              <AppText
                variant="body"
                color={opt.destructive ? 'danger' : 'text'}
                style={styles.optionLabel}
              >
                {opt.label}
              </AppText>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  art: { width: 52, height: 52, backgroundColor: '#222' },
  headerMeta: { flex: 1, marginLeft: 12 },
  divider: { height: 1, marginBottom: 8 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  optionLabel: { marginLeft: 16 },
});
