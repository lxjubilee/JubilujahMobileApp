import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { AppText } from './AppText';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

/** Row title with an optional "See all" action — used above each Home rail. */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onSeeAll }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.row, { paddingHorizontal: theme.spacing.lg }]}>
      <AppText variant="h2">{title}</AppText>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <AppText variant="label" color="textMuted">
            {t('common.seeAll')}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
});
