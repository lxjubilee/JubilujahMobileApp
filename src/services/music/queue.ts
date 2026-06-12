import { Track } from '@/types';
import { logger } from '@/utils';
import { setupPlayer } from './setup';
import { toTPTracks } from './trackAdapter';
import { isExpoGo } from './env';
import { TrackPlayer, State } from './rntp';

/**
 * Higher-level queue helpers used by the UI. Each ensures the engine is set up
 * before issuing commands, so screens never worry about init ordering.
 */
export const playbackQueue = {
  /** Replace the queue with `tracks` and start playing at `startIndex`. */
  async playTracks(tracks: Track[], startIndex = 0): Promise<void> {
    if (!tracks.length || isExpoGo) return;
    await setupPlayer();
    await TrackPlayer.reset();
    await TrackPlayer.add(toTPTracks(tracks));
    if (startIndex > 0) await TrackPlayer.skip(startIndex);
    await TrackPlayer.play();
  },

  /** Play a whole album/playlist starting from a specific track id. */
  async playFrom(tracks: Track[], trackId: string): Promise<void> {
    const idx = Math.max(
      0,
      tracks.findIndex((t) => t.id === trackId),
    );
    await this.playTracks(tracks, idx);
  },

  /** Append tracks to the end of the current queue. */
  async addToQueue(tracks: Track[]): Promise<void> {
    if (isExpoGo) return;
    await setupPlayer();
    await TrackPlayer.add(toTPTracks(tracks));
  },

  async toggle(): Promise<void> {
    if (isExpoGo) return;
    try {
      const state = (await TrackPlayer.getPlaybackState()).state;
      if (state === State.Playing) await TrackPlayer.pause();
      else await TrackPlayer.play();
    } catch (e) {
      logger.warn('playbackQueue.toggle failed', e);
    }
  },
};
