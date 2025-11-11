export type Voice = {
  id: string;
  name: string;
};

export type Speaker = {
  id: string;
  name: string;
  voiceId: string;
};

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'finished' | 'error';
