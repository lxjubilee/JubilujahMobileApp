import React from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context';
import { AppText, IconButton } from '@/components/common';

/** Filter categories shown as chips under the Home header. */
export const HOME_FILTERS = [
  'Home',
  'Inspire Family',
  'Children Music',
  'Faith-Based',
  'General',
  'Jubilee Prayers',
  'Playlists',
] as const;

export type HomeFilter = (typeof HOME_FILTERS)[number];

/** Height the chips row collapses from / expands to. */
export const CHIP_ROW_HEIGHT = 48;

interface HomeHeaderProps {
  selected: HomeFilter;
  onSelect: (filter: HomeFilter) => void;
  /** 1 = chips fully visible, 0 = fully collapsed. */
  chipsAnim: Animated.Value;
  /** 0 = transparent/gradient (at top), 1 = solid black (scrolled). */
  bgAnim: Animated.Value;
  onPressDownloads?: () => void;
  onPressNotifications?: () => void;
  notificationCount?: number;
}

/**
 * Fixed header overlaying the top of the Home hero (Netflix style):
 *  - At the top: a soft dark gradient with the title, actions, and filter chips.
 *  - On scroll down: chips collapse (height + fade) and the background
 *    cross-fades to solid black; scrolling back up restores the chips.
 * The collapse/solid state is driven by `chipsAnim` / `bgAnim` from the screen.
 */
export const HomeHeader: React.FC<HomeHeaderProps> = ({
  selected,
  onSelect,
  chipsAnim,
  bgAnim,
  onPressDownloads,
  onPressNotifications,
  notificationCount = 0,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Soft gradient visible at the top over the hero. */}
      <LinearGradient
        colors={['rgba(11,11,15,0.55)', 'rgba(11,11,15,0.2)', 'transparent']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Solid black layer that fades in once scrolled. */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: bgAnim }]}
      />

      <View style={[styles.inner, { paddingTop: insets.top + 6 }]}>
        <View style={styles.topRow}>
          <AppText variant="h1">Home</AppText>

          <View style={styles.actions}>
            <View style={styles.iconWrap}>
              <IconButton name="download-outline" size={24} onPress={onPressDownloads} />
              <View style={[styles.checkBadge, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="checkmark" size={9} color="#fff" />
              </View>
            </View>

            <View style={[styles.iconWrap, styles.bellWrap]}>
              <IconButton
                name="notifications-outline"
                size={24}
                onPress={onPressNotifications}
              />
              {notificationCount > 0 ? (
                <View style={[styles.countBadge, { backgroundColor: theme.colors.danger }]}>
                  <AppText variant="caption" style={styles.countText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Collapsible chips row. */}
        <Animated.View
          style={[
            styles.chipsWrap,
            {
              opacity: chipsAnim,
              height: chipsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, CHIP_ROW_HEIGHT],
              }),
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {HOME_FILTERS.map((filter) => {
              const active = filter === selected;
              return (
                <Pressable
                  key={filter}
                  onPress={() => onSelect(filter)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? theme.colors.text : theme.colors.border,
                      backgroundColor: active ? theme.colors.text : 'rgba(30,30,40,0.45)',
                    },
                  ]}
                >
                  <AppText
                    variant="label"
                    style={{ color: active ? '#000' : theme.colors.text }}
                  >
                    {filter}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
  inner: { paddingHorizontal: 16, paddingBottom: 8 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { position: 'relative' },
  bellWrap: { marginLeft: 18 },
  checkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { color: '#fff', fontSize: 9, lineHeight: 12, fontWeight: '700' },
  chipsWrap: { overflow: 'hidden', justifyContent: 'center' },
  chipsRow: { paddingRight: 16, gap: 10, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
});
