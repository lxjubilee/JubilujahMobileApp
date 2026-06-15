import { useCallback } from 'react';
import {
  useAppDispatch,
  useAppSelector,
  setQueue,
  setCurrentTrack,
  setIsPlaying,
  cycleRepeatMode,
  toggleShuffle,
} from '@/redux';
import type { RepeatMode } from '@/redux';
import {
  playbackQueue,
  isExpoGo,
  TrackPlayer,
  RepeatMode as TPRepeatMode,
} from '@/services/music';
import { Track } from '@/types';

const toTPRepeat = (mode: RepeatMode) =>
  mode === 'track'
    ? TPRepeatMode.Track
    : mode === 'queue'
      ? TPRepeatMode.Queue
      : TPRepeatMode.Off;

/**
 * The single hook components use to read playback state and drive the player.
 * Reads come from Redux (synced by usePlayerSync); commands go to the engine
 * and update prefs. Keeps screens free of any track-player specifics.
 */
export function usePlayer() {
  const dispatch = useAppDispatch();
  const currentTrack = useAppSelector((s) => s.player.currentTrack);
  const isPlaying = useAppSelector((s) => s.player.isPlaying);
  const repeatMode = useAppSelector((s) => s.player.repeatMode);
  const shuffle = useAppSelector((s) => s.player.shuffle);
  const queue = useAppSelector((s) => s.player.queue);

  const playTracks = useCallback(
    async (tracks: Track[], startIndex = 0) => {
      dispatch(setQueue(tracks));
      dispatch(setCurrentTrack(tracks[startIndex] ?? null));
      await playbackQueue.playTracks(tracks, startIndex);
    },
    [dispatch],
  );

  const playFrom = useCallback(
    async (tracks: Track[], trackId: string) => {
      const idx = Math.max(
        0,
        tracks.findIndex((t) => t.id === trackId),
      );
      await playTracks(tracks, idx);
    },
    [playTracks],
  );

  // Optimistic: flip the icon immediately, then let the engine confirm via events.
  const toggle = useCallback(() => {
    dispatch(setIsPlaying(!isPlaying));
    return playbackQueue.toggle();
  }, [dispatch, isPlaying]);

  // Optimistic: move to the neighbouring track in the queue right away.
  const stepTo = useCallback(
    (delta: number) => {
      if (currentTrack && queue.length) {
        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        const target = queue[idx + delta];
        if (idx >= 0 && target) dispatch(setCurrentTrack(target));
      }
    },
    [currentTrack, queue, dispatch],
  );

  const next = useCallback(() => {
    stepTo(1);
    return isExpoGo ? undefined : TrackPlayer.skipToNext().catch(() => undefined);
  }, [stepTo]);

  const previous = useCallback(() => {
    stepTo(-1);
    return isExpoGo ? undefined : TrackPlayer.skipToPrevious().catch(() => undefined);
  }, [stepTo]);
  const seekTo = useCallback(
    (pos: number) => (isExpoGo ? undefined : TrackPlayer.seekTo(pos)),
    [],
  );

  const cycleRepeat = useCallback(async () => {
    const order: RepeatMode[] = ['off', 'queue', 'track'];
    const nextMode = order[(order.indexOf(repeatMode) + 1) % order.length];
    dispatch(cycleRepeatMode());
    if (!isExpoGo) await TrackPlayer.setRepeatMode(toTPRepeat(nextMode)).catch(() => undefined);
  }, [dispatch, repeatMode]);

  const onToggleShuffle = useCallback(() => dispatch(toggleShuffle()), [dispatch]);

  return {
    currentTrack,
    isPlaying,
    repeatMode,
    shuffle,
    queue,
    playTracks,
    playFrom,
    toggle,
    next,
    previous,
    seekTo,
    cycleRepeat,
    toggleShuffle: onToggleShuffle,
  };
}
