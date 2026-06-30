import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Track } from '@/types';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { addTrackToPlaylist, createPlaylist, toggleFavoriteTrack } from '@/redux';
import { newId } from '@/utils';
import { TrackOptionsModal, TrackOption } from '@/components/modals';
import { PlaylistPickerSheet } from './PlaylistPickerSheet';
import { PlaylistNameDialog } from './PlaylistNameDialog';

interface PlaylistMenu {
  /** Open the "add this track to a playlist" picker directly. */
  addToPlaylist: (track: Track) => void;
  /** Open the generic track "⋮" options sheet (Like / Add to playlist). */
  openTrackOptions: (track: Track) => void;
}

const Ctx = createContext<PlaylistMenu | null>(null);

export function usePlaylistMenu(): PlaylistMenu {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlaylistMenu must be used within a PlaylistMenuProvider');
  return ctx;
}

/**
 * Renders the "Add to playlist" UI (options sheet + playlist picker + create
 * dialog) exactly once, near the root, and exposes it via `usePlaylistMenu()` so
 * any track list can offer "Add to playlist" without managing its own modals.
 */
export const PlaylistMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const playlists = useAppSelector((s) => s.library.playlists);
  const favoriteIds = useAppSelector((s) => s.library.favoriteTrackIds);

  const [optionsTrack, setOptionsTrack] = useState<Track | null>(null);
  const [pickerTrack, setPickerTrack] = useState<Track | null>(null);
  const [namingTrack, setNamingTrack] = useState<Track | null>(null);

  const addToPlaylist = useCallback((track: Track) => setPickerTrack(track), []);
  const openTrackOptions = useCallback((track: Track) => setOptionsTrack(track), []);

  const value = useMemo<PlaylistMenu>(
    () => ({ addToPlaylist, openTrackOptions }),
    [addToPlaylist, openTrackOptions],
  );

  // Defer opening the next modal until the current one has finished dismissing —
  // presenting two RN modals in the same frame can swallow the second on iOS.
  const handoff = useCallback((open: () => void) => {
    setTimeout(open, 260);
  }, []);

  const isFavorite = optionsTrack ? favoriteIds.includes(optionsTrack.id) : false;
  const trackOptions: TrackOption[] = [
    {
      key: 'like',
      label: isFavorite ? t('player.removeFromLiked') : t('player.like'),
      icon: isFavorite ? 'heart' : 'heart-outline',
      onPress: (track) => dispatch(toggleFavoriteTrack(track)),
    },
    {
      key: 'addToPlaylist',
      label: t('playlist.addToPlaylist'),
      icon: 'add-circle-outline',
      onPress: (track) => handoff(() => setPickerTrack(track)),
    },
  ];

  const onPick = (playlistId: string) => {
    if (pickerTrack) {
      dispatch(
        addTrackToPlaylist({ playlistId, trackId: pickerTrack.id, artwork: pickerTrack.artwork }),
      );
    }
    setPickerTrack(null);
  };

  const onConfirmCreate = (title: string) => {
    const id = newId('pl');
    dispatch(createPlaylist({ id, title }));
    if (namingTrack) {
      dispatch(addTrackToPlaylist({ playlistId: id, trackId: namingTrack.id, artwork: namingTrack.artwork }));
    }
    setNamingTrack(null);
  };

  return (
    <Ctx.Provider value={value}>
      {children}

      <TrackOptionsModal
        track={optionsTrack}
        options={trackOptions}
        onClose={() => setOptionsTrack(null)}
      />

      <PlaylistPickerSheet
        visible={pickerTrack != null}
        playlists={playlists}
        onPick={onPick}
        onCreateNew={() => {
          const track = pickerTrack;
          setPickerTrack(null);
          handoff(() => setNamingTrack(track));
        }}
        onClose={() => setPickerTrack(null)}
      />

      <PlaylistNameDialog
        visible={namingTrack != null}
        title={t('playlist.namePrompt')}
        confirmLabel={t('playlist.create')}
        onConfirm={onConfirmCreate}
        onCancel={() => setNamingTrack(null)}
      />
    </Ctx.Provider>
  );
};
