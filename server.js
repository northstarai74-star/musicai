import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;
const OLLAMA_API = 'http://localhost:11434/api/generate';

app.use(cors());
app.use(express.json());

// Call Ollama API
async function callOllama(prompt, model = 'qwen2.5-coder:7b') {
  try {
    const response = await fetch(OLLAMA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    });

    const data = await response.json();
    return data.response || '';
  } catch (error) {
    console.error('Ollama error:', error);
    return 'Error connecting to Ollama. Make sure it\'s running locally.';
  }
}

// Song Recommendations
app.post('/api/recommendations', async (req, res) => {
  const { currentSong, allSongs } = req.body;
  const songList = allSongs.map(s => `${s.title} by ${s.artist}`).join(', ');

  const prompt = `Based on the user listening to "${currentSong.title}" by ${currentSong.artist}, recommend 3 songs from this list: ${songList}. Format: Just list the song titles, one per line.`;

  const recommendations = await callOllama(prompt);
  res.json({ recommendations });
});

// Song Descriptions
app.post('/api/description', async (req, res) => {
  const { title, artist } = req.body;
  const prompt = `Write a 2-sentence description for the song "${title}" by ${artist}. Make it engaging and musical.`;

  const description = await callOllama(prompt);
  res.json({ description });
});

// Chat Assistant
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  const contextStr = context ? `Context: Currently playing "${context.title}" by ${context.artist}. ` : '';
  const prompt = `${contextStr}User: ${message}\n\nRespond helpfully about music, songs, or the music player. Keep response short (1-2 sentences).`;

  const response = await callOllama(prompt);
  res.json({ response });
});

// Lyrics Generation
app.post('/api/lyrics', async (req, res) => {
  const { title, artist } = req.body;
  const prompt = `Generate 4 lines of lyrics for a song titled "${title}" by ${artist}. Make them catchy and relevant to the title.`;

  const lyrics = await callOllama(prompt);
  res.json({ lyrics });
});

// Smart Search
app.post('/api/smart-search', async (req, res) => {
  const { query, allSongs } = req.body;
  const songList = allSongs.map(s => `${s.title} by ${s.artist}`).join(', ');

  const prompt = `The user searched for: "${query}". From this song list: ${songList}, which songs match best? Consider mood, genre, or keyword similarity. List matching songs, one per line.`;

  const results = await callOllama(prompt);
  res.json({ results });
});

// Test connection
app.get('/api/health', async (req, res) => {
  try {
    const response = await fetch(OLLAMA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b',
        prompt: 'hi',
        stream: false,
      }),
    });

    if (response.ok) {
      res.json({ status: 'Ollama connected ✅' });
    } else {
      res.json({ status: 'Ollama not responding' });
    }
  } catch (error) {
    res.json({ status: 'Ollama not running. Start it with: ollama run qwen2.5-coder:7b' });
  }
});

app.listen(PORT, () => {
  console.log(`🎵 Music AI Server running on port ${PORT}`);
  console.log(`📡 Ollama API: ${OLLAMA_API}`);
  console.log(`💬 Make sure Ollama is running: ollama run qwen2.5-coder:7b`);
});
