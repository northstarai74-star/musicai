import { Song } from '../types';

interface SongCardProps {
  song: Song;
  onPlay: (song: Song) => void;
  isFavorite: boolean;
  onToggleFavorite: (songId: string) => void;
}

export default function SongCard({
  song,
  onPlay,
  isFavorite,
  onToggleFavorite,
}: SongCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(song.id);
  };

  return (
    <div className="group flex flex-col rounded overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-pink-300">
      <div className="relative overflow-hidden h-40 w-full">
        <img src={song.image} alt="" className="w-full h-full object-cover" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay(song);
          }}
          className="absolute bottom-3 right-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 shadow-lg"
          title="Play song">
          ▶
        </button>
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 text-xl opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col cursor-pointer" onClick={() => onPlay(song)}>
        <h3 className="font-semibold text-purple-900 text-sm truncate group-hover:text-purple-700 transition-all leading-tight">
          {song.title}
        </h3>
        <p className="text-xs text-purple-600 truncate mt-1.5 font-medium">{song.artist}</p>
        <div className="mt-auto pt-3 flex items-center justify-between text-xs">
          <button
            onClick={handleFavoriteClick}
            className="text-purple-600 hover:text-red-500 transition">
            {isFavorite ? '❤️' : '🤍'} {Math.floor(Math.random() * 1000)}
          </button>
          <span className="bg-gradient-to-r from-pink-300 to-purple-300 text-purple-900 px-2 py-1 rounded text-xs font-medium">
            {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}
