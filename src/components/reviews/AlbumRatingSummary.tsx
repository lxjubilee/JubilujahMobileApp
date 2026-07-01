import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { AppText } from '@/components/common';
import { formatCount } from '@/utils';
import type { ReviewSummary } from '@/types';
import { StarRating } from './StarRating';

/**
 * Album-page rating summary (RN port of the web `PublicAlbumRating`). Shows only
 * aggregates — average, count, star indicator — plus a "Rate this album" action
 * and a link to the full Ratings & Reviews screen. Never lists reviews.
 */

interface Props {
  summary: ReviewSummary | null;
  onRate: () => void;
  /** When omitted (e.g. on the reviews screen itself), the "see all" link is hidden. */
  onSeeAll?: () => void;
}

export const AlbumRatingSummary: React.FC<Props> = ({ summary, onRate, onSeeAll }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const avg = summary?.average ?? null;
  const count = summary?.ratingCount ?? 0;
  const reviewCount = summary?.reviewCount ?? 0;
  const rated = !!summary?.mine;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }]}>
      <View style={styles.main}>
        <StarRating value={avg ?? 0} size="md" />
        {avg != null ? (
          <AppText variant="h3" style={styles.avg}>
            {avg.toFixed(1)}
          </AppText>
        ) : (
          <AppText variant="h3" color="textMuted" style={styles.avg}>
            —
          </AppText>
        )}
        <AppText variant="bodySm" color="textMuted" style={styles.count} numberOfLines={1}>
          {count > 0 ? t('reviews.basedOn', { count: formatCount(count) }) : t('reviews.noRatingsYet')}
        </AppText>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onRate}
          style={[styles.rateBtn, { backgroundColor: theme.colors.accent, borderRadius: theme.radius.pill }]}
        >
          <Ionicons name="star" size={16} color="#FFFFFF" style={styles.rateIcon} />
          <AppText variant="label" style={{ color: '#FFFFFF' }}>
            {rated ? t('reviews.editYourRating') : t('reviews.rateThisAlbum')}
          </AppText>
        </Pressable>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAll}>
            <AppText variant="label" color="accent">
              {reviewCount > 0
                ? t('reviews.seeAllReviewsCount', { count: reviewCount })
                : t('reviews.seeAllReviews')}
            </AppText>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.accent} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 16, marginTop: 4 },
  main: { flexDirection: 'row', alignItems: 'center' },
  avg: { marginLeft: 10 },
  count: { flex: 1, marginLeft: 12 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  rateBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 18 },
  rateIcon: { marginRight: 6 },
  seeAll: { flexDirection: 'row', alignItems: 'center' },
});
