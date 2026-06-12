import { logger } from '@/utils';
import { isExpoGo } from './env';
import {
  TrackPlayer,
  AppKilledPlaybackBehavior,
  Capability,
  IOSCategory,
  IOSCategoryMode,
} from './rntp';

let isSetup = false;

/**
 * Initialize the playback engine exactly once. Configures lock-screen /
 * notification capabilities so transport controls work while backgrounded.
 * Safe to call repeatedly (subsequent calls are no-ops).
 */
export async function setupPlayer(): Promise<boolean> {
  if (isExpoGo) {
    logger.warn('Skipping TrackPlayer setup — running in Expo Go (no native audio).');
    return false;
  }
  if (isSetup) return true;
  try {
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
      iosCategory: IOSCategory.Playback,
      iosCategoryMode: IOSCategoryMode.Default,
    });
  } catch (e) {
    // setupPlayer throws if the player is already initialized — treat as ready.
    logger.debug('TrackPlayer.setupPlayer skipped (already initialized)', e);
  }

  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
    },
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.SeekTo,
      Capability.Stop,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
    progressUpdateEventInterval: 1,
  });

  isSetup = true;
  return true;
}
