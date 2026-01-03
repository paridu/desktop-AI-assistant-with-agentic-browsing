
export enum ViewMode {
  AGENT = 'AGENT',
  VOICE = 'VOICE',
  CODE = 'CODE',
  SETTINGS = 'SETTINGS'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  groundingSources?: {
    title: string;
    uri: string;
  }[];
}

export interface CodeFile {
  id: string;
  name: string;
  content: string;
  language: string;
}
