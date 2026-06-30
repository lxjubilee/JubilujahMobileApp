import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/context';
import { AppText } from './AppText';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  /** Primary action label. */
  confirmLabel?: string;
  /** When provided, a secondary (Cancel) button is shown — omit for a single-button acknowledge dialog. */
  cancelLabel?: string;
  /** Tints the primary button danger-red (for destructive actions). */
  destructive?: boolean;
  /** Shows a spinner on the primary button and blocks dismissal. */
  loading?: boolean;
  /** Disables the primary button (e.g. until a required input is filled). */
  confirmDisabled?: boolean;
  /** Extra content (e.g. a password input) rendered between the message and buttons. */
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * Themed confirmation / acknowledgement dialog — a drop-in for `Alert.alert`
 * that matches the app's dark theme. Tapping the backdrop cancels (unless
 * loading or no cancel action is provided).
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel,
  destructive,
  loading,
  confirmDisabled,
  children,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();
  const confirmBg = destructive ? theme.colors.danger : theme.colors.primary;
  const dismiss = loading ? undefined : onCancel;
  const primaryDisabled = loading || confirmDisabled;
  // Dialogs with an input (children) get a keyboard. Anchor them near the top so
  // the buttons stay above it. We deliberately DON'T use KeyboardAvoidingView —
  // it's unreliable inside an Android Modal (and stacking it under a native-stack
  // screen can wedge the UI thread); top-anchoring keeps the buttons reachable.
  const hasInput = children != null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss ?? onConfirm}>
      <Pressable style={[styles.backdrop, hasInput && styles.backdropTop]} onPress={dismiss}>
        {/* Inner press swallows taps so they don't close the dialog. */}
        <Pressable
          style={[
            styles.card,
            { backgroundColor: theme.colors.backgroundElevated, borderRadius: theme.radius.lg },
          ]}
        >
          <AppText variant="h2" style={styles.title}>
            {title}
          </AppText>
          {message ? (
            <AppText variant="body" color="textSecondary" style={styles.message}>
              {message}
            </AppText>
          ) : null}

          {children ? <View style={styles.children}>{children}</View> : null}

          <View style={styles.actions}>
            {cancelLabel ? (
              <Pressable
                onPress={onCancel}
                disabled={loading}
                style={({ pressed }) => [
                  styles.btn,
                  styles.cancelBtn,
                  { borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <AppText variant="label" style={{ color: theme.colors.text }}>
                  {cancelLabel}
                </AppText>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onConfirm}
              disabled={primaryDisabled}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: confirmBg, opacity: primaryDisabled ? 0.6 : pressed ? 0.85 : 1 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <AppText variant="label" style={styles.confirmLabel}>
                  {confirmLabel}
                </AppText>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  // Top-anchored variant for input dialogs so the keyboard can't cover the buttons.
  backdropTop: { justifyContent: 'flex-start', paddingTop: 96 },
  card: { width: '100%', maxWidth: 360, padding: 22 },
  title: { marginBottom: 8 },
  message: { lineHeight: 22 },
  children: { marginTop: 16 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 22 },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: { borderWidth: 1, backgroundColor: 'transparent' },
  confirmLabel: { color: '#FFFFFF', fontWeight: '700' },
});
