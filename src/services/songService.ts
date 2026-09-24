import { supabase } from '../utils/supabase';
import { Song } from '../types';

export async function fetchSongs(): Promise<Song[]> {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((song: any) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      language: song.language,
      duration: song.duration,
      featured: song.featured,
      trending: song.trending,
      image: song.image_url,
      audioUrl: song.audio_url,
    }));
  } catch (error) {
    console.error('Error fetching songs:', error);
    return [];
  }
}

export async function fetchFeaturedSongs(): Promise<Song[]> {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('featured', true);

    if (error) throw error;

    return (data || []).map((song: any) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      language: song.language,
      duration: song.duration,
      featured: song.featured,
      trending: song.trending,
      image: song.image_url,
      audioUrl: song.audio_url,
    }));
  } catch (error) {
    console.error('Error fetching featured songs:', error);
    return [];
  }
}

export async function fetchTrendingSongs(): Promise<Song[]> {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('trending', true)
      .limit(5);

    if (error) throw error;

    return (data || []).map((song: any) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      language: song.language,
      duration: song.duration,
      featured: song.featured,
      trending: song.trending,
      image: song.image_url,
      audioUrl: song.audio_url,
    }));
  } catch (error) {
    console.error('Error fetching trending songs:', error);
    return [];
  }
}
