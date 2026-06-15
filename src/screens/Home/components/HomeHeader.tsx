import React from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { AppText, ProfileButton } from '@/components/common';

/** The "show everything" chip, always first in the filter row. */
export const HOME_FILTER_ALL = 'Home';

/** A Home filter is the "Home" sentinel or a catalog category label. */
export type HomeFilter = string;

/** Height the chips row collapses from / expands to. */
export const CHIP_ROW_HEIGHT = 48;

interface HomeHeaderProps {
  /** Chips to render, e.g. ['Home', 'Inspire Family', …] derived from the feed. */
  filters: HomeFilter[];
  selected: HomeFilter;
  onSelect: (filter: HomeFilter) => void;
  /** 1 = chips fully visible, 0 = fully collapsed. */
  chipsAnim: Animated.Value;
  /** 0 = transparent/gradient (at top), 1 = solid black (scrolled). */
  bgAnim: Animated.Value;
  /** Opens the profile page. */
  onPressProfile?: () => void;
}

/**
 * Fixed header overlaying the top of the Home hero (Netflix style):
 *  - At the top: a soft dark gradient with the title, actions, and filter chips.
 *  - On scroll down: chips collapse (height + fade) and the background
 *    cross-fades to solid black; scrolling back up restores the chips.
 * The collapse/solid state is driven by `chipsAnim` / `bgAnim` from the screen.
 */
export const HomeHeader: React.FC<HomeHeaderProps> = ({
  filters,
  selected,
  onSelect,
  chipsAnim,
  bgAnim,
  onPressProfile,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular });

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Solid black header background. */}
      <View style={[StyleSheet.absoluteFill, styles.solidBg]} pointerEvents="none" />
      {/* Solid black layer that fades in once scrolled. */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: bgAnim }]}
      />

      <View style={[styles.inner, { paddingTop: insets.top + 6 }]}>
        <View style={styles.topRow}>
          <AppText
            style={[styles.brand, fontsLoaded ? styles.brandBebas : styles.brandFallback]}
            allowFontScaling={false}
          >
            JUBILUJAH
          </AppText>

          <View style={styles.actions}>
            <ProfileButton onPress={onPressProfile} />
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
            {filters.map((filter) => {
              const active = filter === selected;
              return (
                <Pressable
                  key={filter}
                  onPress={() => onSelect(filter)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.18)',
                      backgroundColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.08)',
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
  solidBg: { backgroundColor: '#000' },
  brand: { color: '#E50914' },
  // Netflix-style condensed, premium wordmark.
  brandBebas: { fontFamily: 'BebasNeue_400Regular', fontSize: 30, lineHeight: 34, letterSpacing: 2 },
  brandFallback: { fontSize: 24, lineHeight: 28, fontWeight: '900', letterSpacing: 1.5 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { position: 'relative' },
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
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
