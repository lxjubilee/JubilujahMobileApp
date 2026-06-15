import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';

interface SplashScreenProps {
  /** Called once the intro animation completes and the app should be revealed. */
  onFinish: () => void;
}

/**
 * Netflix-style intro splash: the "JUBILUJAH" wordmark (Bebas Neue — the tall,
 * condensed, all-caps face used to mimic the Netflix logo) settles in (scale +
 * fade), holds, then zooms toward the viewer while the black overlay fades out,
 * revealing the app. Uses RN Animated (native driver) so it runs in Expo Go.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular });
  // Don't block forever if the font can't load (e.g. offline) — fall back to system.
  const [ready, setReady] = useState(false);

  const textScale = useRef(new Animated.Value(1.25)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timeout = setTimeout(() => setReady(true), 2000);
    if (fontsLoaded) {
      setReady(true);
      clearTimeout(timeout);
    }
    return () => clearTimeout(timeout);
  }, [fontsLoaded]);

  useEffect(() => {
    if (!ready) return undefined;

    const animation = Animated.sequence([
      // 1. Wordmark settles in.
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(textScale, {
          toValue: 1,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }),
      ]),
      // 2. Hold.
      Animated.delay(550),
      // 3. Zoom into the wordmark while the overlay fades to reveal the app.
      Animated.parallel([
        Animated.timing(textScale, {
          toValue: 14,
          duration: 650,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 650,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) onFinish();
    });

    return () => animation.stop();
  }, [ready, textScale, textOpacity, overlayOpacity, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: overlayOpacity }]} pointerEvents="none">
      <Animated.Text
        style={[
          styles.wordmark,
          fontsLoaded ? styles.bebas : styles.systemFallback,
          { opacity: textOpacity, transform: [{ scale: textScale }] },
        ]}
        allowFontScaling={false}
      >
        JUBILUJAH
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  wordmark: {
    color: '#E50914',
    textShadowColor: 'rgba(229,9,20,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  // Bebas Neue is tall/condensed, so it reads best larger with tight tracking.
  bebas: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 72,
    letterSpacing: 3,
  },
  systemFallback: {
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: 4,
  },
});
