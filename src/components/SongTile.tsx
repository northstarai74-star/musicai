import { Song } from '../types';

export type TileVariant = 'lead' | 'wide' | 'standard';

interface SongTileProps {
  song: Song;
  variant: TileVariant;
  rank?: number;
  eyebrow?: string;
  onPlay: (song: Song) => void;
  isFavorite: boolean;
  onToggleFavorite: (songId: string) => void;
}

const formatDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

export default function SongTile({
  song,
  variant,
  rank,
  eyebrow,
  onPlay,
  isFavorite,
  onToggleFavorite,
}: SongTileProps) {
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(song.id);
  };

  const favoriteButton = (
    <button
      onClick={handleFavorite}
      className="text-lg leading-none transition hover:scale-125"
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
      {isFavorite ? '❤️' : '🤍'}
    </button>
  );

  const playButton = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onPlay(song);
      }}
      className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1.5 text-sm leading-none text-white shadow-lg transition hover:scale-110"
      title={`Play ${song.title}`}>
      ▶
    </button>
  );

  // Lead — full-bleed artwork with the headline set over it.
  if (variant === 'lead') {
    return (
      <article
        onClick={() => onPlay(song)}
        className="group relative col-span-2 row-span-2 cursor-pointer overflow-hidden rounded-2xl border-2 border-pink-300 shadow-lg transition hover:shadow-2xl">
        <img
          src={song.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/85 via-purple-900/35 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-5 sm:p-7">
          {eyebrow && (
            <span className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-pink-200">
              {eyebrow}
            </span>
          )}
          <h3 className="text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
            {song.title}
          </h3>
          <p className="mt-1 text-sm text-pink-100/90 sm:text-base">{song.artist}</p>
          <div className="mt-4 flex items-center gap-3 text-xs text-pink-100/80">
            {playButton}
            <span className="rounded-full border border-white/40 px-2 py-0.5">{song.language}</span>
            <span>{formatDuration(song.duration)}</span>
            <span className="ml-auto">{favoriteButton}</span>
          </div>
        </div>
      </article>
    );
  }

  // Wide — artwork left, copy right, spanning two columns.
  if (variant === 'wide') {
    return (
      <article
        onClick={() => onPlay(song)}
        className="group col-span-2 flex cursor-pointer overflow-hidden rounded-2xl border-2 border-pink-300 bg-gradient-to-r from-pink-200 to-purple-200 shadow-lg transition hover:shadow-2xl">
        <div className="relative w-2/5 shrink-0 overflow-hidden">
          <img
            src={song.image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
          {rank !== undefined && (
            <span className="text-xs font-black tracking-widest text-pink-500">
              {rank.toString().padStart(2, '0')}
            </span>
          )}
          <h3 className="truncate text-lg font-bold text-purple-900 sm:text-xl">{song.title}</h3>
          <p className="truncate text-sm text-purple-600">{song.artist}</p>
          <div className="mt-3 flex items-center gap-3 text-xs text-purple-700">
            {playButton}
            <span>{formatDuration(song.duration)}</span>
            <span className="ml-auto">{favoriteButton}</span>
          </div>
        </div>
      </article>
    );
  }

  // Standard — artwork on top, copy below.
  return (
    <article
      onClick={() => onPlay(song)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 border-pink-300 bg-gradient-to-br from-pink-200 to-purple-200 shadow-lg transition hover:shadow-2xl">
      <div className="relative flex-1 overflow-hidden">
        <img
          src={song.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
          {favoriteButton}
        </span>
        <span className="absolute bottom-2 right-2 opacity-0 transition group-hover:opacity-100">
          {playButton}
        </span>
      </div>
      <div className="shrink-0 p-3">
        <h3 className="truncate text-sm font-semibold text-purple-900">{song.title}</h3>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-purple-600">{song.artist}</p>
          <span className="shrink-0 text-xs font-medium text-purple-500">
            {formatDuration(song.duration)}
          </span>
        </div>
      </div>
    </article>
  );
}
