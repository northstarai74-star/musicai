import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://whpwpmikzkjogrztackv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndocHdwbWlremtqb2dyenRhY2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMzIxOTEsImV4cCI6MjEwNTgwODE5MX0.L21jt50Wp0VZhy00o8C48BTX68srwUkiTm3lmqqX5_Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const encodeFilename = (name) => {
  return name.replace(/\s/g, '%20');
};

const audioUrls = {
  1: `https://whpwpmikzkjogrztackv.supabase.co/storage/v1/object/public/audio/songs/${encodeFilename('WhatsApp Audio 2026-09-18 at 2.57.16 PM.mpeg')}`,
  2: `https://whpwpmikzkjogrztackv.supabase.co/storage/v1/object/public/audio/songs/${encodeFilename('WhatsApp Audio 2026-09-18 at 2.58.26 PM.mpeg')}`,
  3: `https://whpwpmikzkjogrztackv.supabase.co/storage/v1/object/public/audio/songs/${encodeFilename('WhatsApp Audio 2026-09-18 at 2.58.35 PM.mpeg')}`,
  4: `https://whpwpmikzkjogrztackv.supabase.co/storage/v1/object/public/audio/songs/${encodeFilename('WhatsApp Audio 2026-09-18 at 2.58.43 PM.mpeg')}`,
  5: `https://whpwpmikzkjogrztackv.supabase.co/storage/v1/object/public/audio/songs/${encodeFilename('WhatsApp Audio 2026-09-18 at 2.58.58 PM.mp4')}`,
};

async function updateSongsUrls() {
  console.log('🔄 Updating songs with correct audio URLs...\n');

  try {
    // First, delete existing songs
    const { error: deleteError } = await supabase
      .from('songs')
      .delete()
      .gt('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error('Error deleting existing songs:', deleteError);
    }

    // Insert new songs with correct URLs
    const { data, error } = await supabase
      .from('songs')
      .insert([
        {
          title: "I'm Lucky!",
          artist: 'orangebass9948',
          language: 'Punjabi',
          duration: 263,
          featured: true,
          image_url: '/images/song-1.avif',
          audio_url: audioUrls[1],
        },
        {
          title: 'Silent Love!',
          artist: 'orangebass9948',
          language: 'Punjabi',
          duration: 238,
          featured: true,
          image_url: '/images/song-2.jpg',
          audio_url: audioUrls[2],
        },
        {
          title: 'Dildenatads (Cover)',
          artist: 'orangebass9948',
          language: 'Punjabi',
          duration: 176,
          featured: true,
          image_url: '/images/song-3.webp',
          audio_url: audioUrls[3],
        },
        {
          title: 'Fairy Tale!',
          artist: 'orangebass9948',
          language: 'Punjabi',
          duration: 302,
          featured: true,
          image_url: '/images/song-4.jpg',
          audio_url: audioUrls[4],
        },
        {
          title: 'Untitled Track',
          artist: 'orangebass9948',
          language: 'Punjabi',
          duration: 213,
          featured: true,
          image_url: '/images/song-5.jpg',
          audio_url: audioUrls[5],
        },
      ]);

    if (error) {
      console.error('❌ Error updating songs:', error);
    } else {
      console.log('✅ Songs updated successfully!\n');
      console.log('Audio URLs:');
      Object.entries(audioUrls).forEach(([ key, url ]) => {
        console.log(`  ${key}: ${url}`);
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

updateSongsUrls();
