import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { CONFIG } from '@/constants';

interface TurnstileWidgetProps {
  /** Called with a fresh CAPTCHA token once the challenge is solved. */
  onToken: (token: string) => void;
  /** Called when the widget errors or the token expires (so the screen can reset). */
  onError?: (reason: string) => void;
}

/**
 * Cloudflare Turnstile rendered inside a WebView (there is no native SDK). The
 * widget auto-solves and posts the token back over the RN bridge. Renders
 * nothing when no site key is configured (e.g. environments with CAPTCHA off).
 */
export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({ onToken, onError }) => {
  const siteKey = CONFIG.TURNSTILE_SITE_KEY;

  const html = useMemo(
    () => `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <style>
      html, body { margin: 0; padding: 0; background: transparent; }
      .box { display: flex; justify-content: center; align-items: center; padding: 4px 0; width: 100%; }
      /* Stretch the widget to fill the field width. */
      .box .cf-turnstile, .box iframe { width: 100% !important; }
    </style>
  </head>
  <body>
    <div class="box">
      <div class="cf-turnstile"
        data-sitekey="${siteKey}"
        data-callback="onTok"
        data-error-callback="onErr"
        data-expired-callback="onExp"
        data-size="flexible"
        data-theme="dark"></div>
    </div>
    <script>
      function send(o) { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
      function onTok(t) { send({ type: 'token', token: t }); }
      function onErr(e) { send({ type: 'error', reason: String(e) }); }
      function onExp() { send({ type: 'expired' }); }
    </script>
  </body>
</html>`,
    [siteKey],
  );

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as {
        type: string;
        token?: string;
        reason?: string;
      };
      if (msg.type === 'token' && msg.token) onToken(msg.token);
      else if (msg.type === 'error' || msg.type === 'expired') onError?.(msg.reason ?? msg.type);
    } catch {
      // ignore non-JSON messages
    }
  };

  if (!siteKey) return null;

  return (
    <View style={styles.wrap}>
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: CONFIG.TURNSTILE_BASE_URL }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        style={styles.web}
        // Transparent so it blends into the dark sign-in screen.
        backgroundColor="transparent"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { height: 78, marginTop: 18 },
  web: { flex: 1, backgroundColor: 'transparent' },
});
