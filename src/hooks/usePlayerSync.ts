import { useEffect } from 'react';
import { useAppDispatch, useAppSelector, setCurrentTrack, setIsPlaying } from '@/redux';
import {
  isExpoGo,
  TrackPlayer,
  Event,
  State,
  useTrackPlayerEvents,
} from '@/services/music';

// Built lazily so `Event` (undefined in Expo Go) is never dereferenced there.
const SYNC_EVENTS = isExpoGo ? [] : [Event.PlaybackState, Event.PlaybackActiveTrackChanged];

/**
 * Bridges the track-player engine (source of truth) into Redux so the UI can
 * react. MUST be mounted exactly once, near the app root, to avoid duplicate
 * listeners. Components read state via useAppSelector / usePlayer.
 *
 * In Expo Go the native module is absent, so the hook + effect are skipped
 * entirely (`isExpoGo` is constant, so these conditional hooks are stable).
 */
export function usePlayerSync(): void {
  const dispatch = useAppDispatch();
  const queue = useAppSelector((s) => s.player.queue);

  if (!isExpoGo) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTrackPlayerEvents(SYNC_EVENTS, async (event) => {
      if (event.type === Event.PlaybackState) {
        dispatch(setIsPlaying(event.state === State.Playing));
      }
      if (event.type === Event.PlaybackActiveTrackChanged) {
        const activeId = event.track?.id;
        if (activeId == null) return;
        const domainTrack = queue.find((t) => t.id === activeId);
        if (domainTrack) dispatch(setCurrentTrack(domainTrack));
      }
    });
  }

  // Keep play/pause state fresh on mount (e.g. after returning to foreground).
  useEffect(() => {
    if (isExpoGo) return;
    let cancelled = false;
    TrackPlayer.getPlaybackState()
      .then((s) => {
        if (!cancelled) dispatch(setIsPlaying(s.state === State.Playing));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [dispatch]);
}
