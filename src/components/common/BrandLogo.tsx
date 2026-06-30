import React from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

/**
 * Wordmark span colors, mirrored from the JubiLujah.com web header: the outer
 * words are white and the middle highlight is gold.
 */
const WHITE = '#FFFFFF';
const GOLD = '#ffbd59';

interface BrandLogoProps {
  /** Diameter of the circular logo image. Defaults to 28. */
  size?: number;
  /** Style applied to the wordmark text (used for fontSize / letterSpacing). */
  textStyle?: StyleProp<TextStyle>;
  /** Optional style for the wrapping row. */
  style?: StyleProp<ViewStyle>;
}

/**
 * App wordmark: the circular Jubilujah logo followed by the "JubiLujah.com"
 * text in the Orbitron brand font (loaded in App.tsx, matching the web header)
 * — "Jubi" + ".com" white, "Lujah" gold.
 *
 * Pass `textStyle` to control the size per header; `fontWeight` and `color`
 * from it are stripped because the Orbitron_600SemiBold family already encodes
 * the weight (a fontWeight makes Android drop the custom font) and the spans
 * set color.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 28, textStyle, style }) => {
  const { fontWeight, fontStyle, color, ...textRest } =
    StyleSheet.flatten<TextStyle>(textStyle) ?? {};

  return (
    <View style={[styles.row, style]}>
      <Image
        source={require('../../../assets/Jubilujah-app-logo.png')}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
      />
      <Text allowFontScaling={false} style={[textRest, styles.wordmark]}>
        <Text style={styles.white}>Jubi</Text>
        <Text style={styles.gold}>Lujah</Text>
        <Text style={styles.white}>.com</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  logo: { marginRight: 8 },
  // Orbitron_600SemiBold already encodes weight 600 — no fontWeight (it makes
  // Android drop the custom font and fall back to the system sans-serif).
  wordmark: { fontFamily: 'Orbitron_600SemiBold' },
  white: { color: WHITE },
  gold: { color: GOLD },
});
