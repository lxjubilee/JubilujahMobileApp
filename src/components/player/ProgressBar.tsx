import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '@/context';
import { formatDuration } from '@/utils';
import { AppText } from '../common/AppText';

interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

/** Scrubber with elapsed/remaining labels for the full Music Player screen. */
export const ProgressBar: React.FC<ProgressBarProps> = ({ position, duration, onSeek }) => {
  const theme = useTheme();
  // While dragging, show the dragged value rather than the streamed position.
  const [seeking, setSeeking] = useState<number | null>(null);
  const value = seeking ?? position;

  return (
    <View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration > 0 ? duration : 1}
        value={value}
        // Let a single tap/click on the track jump to that position (not just drag).
        tapToSeek
        minimumTrackTintColor={theme.colors.text}
        maximumTrackTintColor={theme.colors.border}
        thumbTintColor={theme.colors.text}
        onSlidingStart={() => setSeeking(value)}
        onValueChange={(v) => setSeeking(v)}
        onSlidingComplete={(v) => {
          setSeeking(null);
          onSeek(v);
        }}
      />
      <View style={styles.labels}>
        <AppText variant="caption" color="textMuted">
          {formatDuration(value)}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {formatDuration(duration)}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  slider: { width: '100%', height: 36 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
});
