export type EmotionMode = 'sweet' | 'romantic' | 'playful' | 'jealous';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: EmotionMode;
}

export interface EmotionConfig {
  label: string;
  icon: string;
  color: string;
  bg: string;
  systemPrompt: string;
}
