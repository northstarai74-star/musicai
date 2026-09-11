export interface Song {
  id: string;
  title: string;
  artist: string;
  language: 'Hindi' | 'Punjabi' | 'English';
  duration: number;
  featured?: boolean;
  trending?: boolean;
  image?: string;
  audioUrl?: string;
}
