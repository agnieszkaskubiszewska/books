export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  genre: Genre;
  rating?: number;
  description?: string;
  image?: string;
  rent?: boolean;
  rentMode?: 'local' | 'shipping';
  rentRegion?: string;
  ownerId?: string;
}

export type Genre = 
  | 'fantasy'
  | 'thriller'
  | 'romance'
  | 'sci-fi'
  | 'mystery'
  | 'biography'
  | 'history'
  | 'other';

export interface GenreOption {
  value: Genre;
  label: string;
}

export interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export type Section = 'main' | 'books' | 'about' | 'contact' | 'welcome' | 'login'; 