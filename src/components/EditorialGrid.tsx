import SongTile, { TileVariant } from './SongTile';
import { Song } from '../types';

interface EditorialGridProps {
  songs: Song[];
  onPlay: (song: Song) => void;
  favorites: Set<string>;
  onToggleFavorite: (songId: string) => void;
  leadEyebrow?: string;
}

/**
 * Repeating six-tile rhythm: a 2x2 lead, two standard tiles beside it,
 * a full-width feature below them, then two more standard tiles. Positions
 * are derived from the index so any length of list stays balanced.
 */
const variantForIndex = (index: number, total: number): TileVariant => {
  // A final tile at these positions would sit alone in its row, so widen it
  // to close the gap the lead tile's two-row span opens up.
  const isLast = index === total - 1;
  if (isLast && (index % 6 === 1 || index % 6 === 4)) return 'wide';

  switch (index % 6) {
    case 0:
      return 'lead';
    case 3:
      return 'wide';
    default:
      return 'standard';
  }
};

export default function EditorialGrid({
  songs,
  onPlay,
  favorites,
  onToggleFavorite,
  leadEyebrow,
}: EditorialGridProps) {
  return (
    <div className="grid auto-rows-[150px] grid-cols-2 gap-4 sm:auto-rows-[170px] lg:grid-cols-4 lg:auto-rows-[185px]">
      {songs.map((song, index) => (
        <SongTile
          key={song.id}
          song={song}
          variant={variantForIndex(index, songs.length)}
          rank={index + 1}
          eyebrow={index % 6 === 0 ? leadEyebrow : undefined}
          onPlay={onPlay}
          isFavorite={favorites.has(song.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
