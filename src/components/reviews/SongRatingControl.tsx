import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { AppText } from '@/components/common';
import type { ReviewSummary } from '@/types';
import { StarRating } from './StarRating';

/**
 * Compact per-song rating for the album track list (RN port of the web
 * `SongRatingControl`): tiny star indicator + rating count + a "Rate" / "★ Your
 * rating" affordance. Its own Pressable, so tapping it never triggers the row.
 */

interface Props {
  summary: ReviewSummary | null | undefined;
  onRate: () => void;
}

export const SongRatingControl: React.FC<Props> = ({ summary, onRate }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const avg = summary?.average ?? null;
  const count = summary?.ratingCount ?? 0;
  const rated = !!summary?.mine;

  return (
    <View style={styles.wrap}>
      <StarRating value={avg ?? 0} size="sm" />
      <AppText variant="caption" color="textMuted" style={styles.count}>
        ({count})
      </AppText>
      <Pressable
        onPress={onRate}
        hitSlop={8}
        style={[
          styles.rate,
          {
            borderColor: rated ? theme.colors.accent : theme.colors.border,
            borderRadius: theme.radius.pill,
          },
        ]}
      >
        <AppText variant="caption" color={rated ? 'accent' : 'textSecondary'}>
          {rated ? t('reviews.yourRatingShort') : t('reviews.rate')}
        </AppText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center' },
  count: { marginLeft: 4 },
  rate: { marginLeft: 8, borderWidth: 1, paddingVertical: 3, paddingHorizontal: 10 },
});
