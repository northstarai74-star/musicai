import { useState } from 'react';
import { Song } from '../types';

interface SearchModalProps {
  onClose: () => void;
  songs: Song[];
  onSearch: (query: string) => void;
}

export default function SearchModal({ onClose, songs, onSearch }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (query: string) => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className="bg-gradient-to-b from-white via-pink-50 to-purple-50 rounded-2xl w-full max-w-2xl shadow-2xl border border-purple-300">
        <div className="p-6 border-b border-purple-200">
          <input
            autoFocus
            type="text"
            placeholder="Search songs, artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-purple-100 text-purple-900 placeholder-purple-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredSongs.length > 0 ? (
            <div className="p-4 space-y-2">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  onClick={() => {
                    handleSearch(searchTerm);
                  }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-pink-100 cursor-pointer transition">
                  <div className="text-2xl">🎵</div>
                  <div className="flex-1">
                    <p className="text-purple-900 font-semibold">{song.title}</p>
                    <p className="text-sm text-purple-600">{song.artist}</p>
                  </div>
                  <span className="text-xs text-purple-500">
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-purple-600">
              {searchTerm ? 'No songs found' : 'Start typing to search'}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-purple-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-purple-600 hover:text-purple-900 transition">
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
