export type Language = 'en' | 'zh';
export type Theme = 'light' | 'dark';
export type Orientation = 'portrait' | 'landscape';

export interface AppSettings {
  theme: Theme;
  language: Language;
  debugMode: boolean;
}

export interface ImageFile {
  name: string;
  type: string;
  dataUrl: string;
}

export interface InitialSettings {
  promptLanguage: string;
  orientation: Orientation;
  duration: number;
  referenceImages: ImageFile[];
  idea: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  initialSettings: InitialSettings;
  createdAt: number;
}
