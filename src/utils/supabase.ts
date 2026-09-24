import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://whpwpmikzkjogrztackv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndocHdwbWlremtqb2dyenRhY2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMzIxOTEsImV4cCI6MjEwNTgwODE5MX0.L21jt50Wp0VZhy00o8C48BTX68srwUkiTm3lmqqX5_Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
