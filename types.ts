
export type Voice = {
  id: string;
  name: string;
};

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'finished' | 'error';
