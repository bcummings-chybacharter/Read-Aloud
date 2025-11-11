import { Voice } from './types';

export const VOICES: Voice[] = [
  { id: 'Kore', name: 'Kore - Clear Female' },
  { id: 'Zephyr', name: 'Zephyr - Calm Male' },
  { id: 'Puck', name: 'Puck - Energetic Male' },
  { id: 'Charon', name: 'Charon - Deep Male' },
  { id: 'Fenrir', name: 'Fenrir - Strong Male' },
];

export const DEFAULT_STORY_TEXT = `Narrator: In a quiet, forgotten corner of the library, bound in leather the color of a midnight sky, lay a book that hadn't been opened in over a century. A young librarian, Elara, found it.
Elara: What's this? It looks ancient.
Old Man: That, my dear, is the Clockmaker's book. They say he could wind back time. He didn't use it for fame or fortune, but to relive precious moments with his daughter.
Elara: What happened to him?
Old Man: The book doesn't have an ending. It simply stops. Some say he is still lost in the beautiful, bittersweet loop of yesterday.`;
