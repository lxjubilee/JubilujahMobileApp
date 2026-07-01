import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context';

/**
 * Star rating display + picker (RN port of the web `StarRating`).
 *  - Display mode (default): renders `value` (0..5, may be fractional) as a
 *    gold fill clipped to the exact percentage, so 4.8 reads as 4.8.
 *  - Interactive mode (onChange set): 5 tappable stars filled up to the choice.
 */

/** Conventional rating gold — reads as "rating" on the dark theme. */
export const RATING_GOLD = '#F6B01E';

type StarSize = 'sm' | 'md' | 'lg';
const STAR_PX: Record<StarSize, number> = { sm: 14, md: 20, lg: 34 };

interface Props {
  value: number;
  onChange?: (n: number) => void;
  size?: StarSize;
}

export const StarRating: React.FC<Props> = ({ value, onChange, size = 'md' }) => {
  const theme = useTheme();
  const px = STAR_PX[size];
  const gap = Math.max(2, Math.round(px * 0.12));
  const emptyColor = theme.colors.border;

  if (!onChange) {
    const pct = Math.max(0, Math.min(100, (value / 5) * 100));
    const rowWidth = px * 5 + gap * 4;
    const stars = (color: string) =>
      [0, 1, 2, 3, 4].map((i) => (
        <Ionicons
          key={i}
          name="star"
          size={px}
          color={color}
          style={i < 4 ? { marginRight: gap } : undefined}
        />
      ));
    return (
      <View style={{ width: rowWidth, height: px }}>
        <View style={styles.row}>{stars(emptyColor)}</View>
        <View style={[styles.fillClip, { width: `${pct}%` }]}>
          <View style={[styles.row, { width: rowWidth }]}>{stars(RATING_GOLD)}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
          style={n < 5 ? { marginRight: gap } : undefined}
        >
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={px}
            color={n <= value ? RATING_GOLD : emptyColor}
          />
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  fillClip: { position: 'absolute', top: 0, left: 0, height: '100%', overflow: 'hidden', flexDirection: 'row' },
});
