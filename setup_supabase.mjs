import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://whpwpmikzkjogrztackv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndocHdwbWlremtqb2dyenRhY2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMzIxOTEsImV4cCI6MjEwNTgwODE5MX0.L21jt50Wp0VZhy00o8C48BTX68srwUkiTm3lmqqX5_Y';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSupabase() {
  console.log('🚀 Setting up Supabase...\n');

  // Step 1: Upload audio files
  console.log('📤 Uploading audio files...');
  const audioFiles = [
    { path: '/tmp/claude-0/-home-user-musicai/9240d0ef-ec0e-5b56-81c6-f1f64abebd45/scratchpad/new_song1.mp4', name: 'new_song1.mp4' },
    { path: '/tmp/claude-0/-home-user-musicai/9240d0ef-ec0e-5b56-81c6-f1f64abebd45/scratchpad/new_song2.mp4', name: 'new_song2.mp4' },
    { path: '/tmp/claude-0/-home-user-musicai/9240d0ef-ec0e-5b56-81c6-f1f64abebd45/scratchpad/new_song3.mp4', name: 'new_song3.mp4' },
    { path: '/tmp/claude-0/-home-user-musicai/9240d0ef-ec0e-5b56-81c6-f1f64abebd45/scratchpad/new_song4.mp4', name: 'new_song4.mp4' },
    { path: '/tmp/claude-0/-home-user-musicai/9240d0ef-ec0e-5b56-81c6-f1f64abebd45/scratchpad/new_song5.mp4', name: 'new_song5.mp4' },
  ];

  for (const file of audioFiles) {
    try {
      const fileData = fs.readFileSync(file.path);
      const { error } = await supabase.storage
        .from('audio')
        .upload(`songs/${file.name}`, fileData, { upsert: true });
      
      if (error) {
        console.log(`❌ ${file.name}: ${error.message}`);
      } else {
        console.log(`✅ ${file.name} uploaded`);
      }
    } catch (err) {
      console.log(`❌ ${file.name}: ${err.message}`);
    }
  }

  console.log('\n✨ Supabase setup complete!');
  console.log('\nNext steps:');
  console.log('1. Go to Supabase SQL Editor');
  console.log('2. Run the CREATE TABLE query');
  console.log('3. Insert the songs data');
}

setupSupabase().catch(console.error);
