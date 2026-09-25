import { useState } from 'react';
import { Song } from '../types';

interface AiAssistantProps {
  currentSong: Song | null;
  allSongs: Song[];
}

const API_URL = 'http://localhost:3001/api';

export default function AiAssistant({ currentSong, allSongs }: AiAssistantProps) {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const fetchAiFeature = async (endpoint: string, body: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      setResult(data.recommendations || data.description || data.response || data.lyrics || data.results || '');
    } catch (error) {
      setResult('Error: Make sure Ollama is running on localhost:11434');
    }
    setLoading(false);
  };

  const handleRecommendations = () => {
    if (!currentSong) return;
    fetchAiFeature('/recommendations', { currentSong, allSongs });
  };

  const handleDescription = () => {
    if (!currentSong) return;
    fetchAiFeature('/description', { title: currentSong.title, artist: currentSong.artist });
  };

  const handleLyrics = () => {
    if (!currentSong) return;
    fetchAiFeature('/lyrics', { title: currentSong.title, artist: currentSong.artist });
  };

  return (
    <div className="fixed right-0 top-24 w-80 h-96 bg-gradient-to-b from-purple-900 via-pink-900 to-blue-900 rounded-l-lg shadow-2xl overflow-hidden flex flex-col border-l-4 border-purple-400">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-pink-700 p-4">
        <h3 className="text-white font-bold text-lg">🤖 AI Assistant</h3>
        <p className="text-purple-200 text-sm">Powered by Ollama</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 bg-black/30">
        {[
          { id: 'recommendations', label: '🎵' },
          { id: 'description', label: '📝' },
          { id: 'lyrics', label: '🎤' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1 px-2 text-sm rounded transition ${
              activeTab === tab.id
                ? 'bg-purple-500 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
            title={tab.label}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 text-white">
        {!currentSong ? (
          <p className="text-gray-400 text-sm">Select a song to enable AI features</p>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin">⏳</div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{result || 'Click a button below to generate content'}</p>
        )}
      </div>

      {/* Buttons */}
      <div className="p-4 border-t border-purple-500 bg-black/20">
        {activeTab === 'recommendations' && (
          <button
            onClick={handleRecommendations}
            disabled={!currentSong || loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded font-semibold transition"
          >
            Get Recommendations
          </button>
        )}
        {activeTab === 'description' && (
          <button
            onClick={handleDescription}
            disabled={!currentSong || loading}
            className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white py-2 rounded font-semibold transition"
          >
            Generate Description
          </button>
        )}
        {activeTab === 'lyrics' && (
          <button
            onClick={handleLyrics}
            disabled={!currentSong || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded font-semibold transition"
          >
            Generate Lyrics
          </button>
        )}
      </div>
    </div>
  );
}
