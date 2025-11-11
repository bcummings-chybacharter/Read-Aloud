import React, { useState, useRef, useCallback } from 'react';
import { VOICES, DEFAULT_STORY_TEXT } from './constants';
import { generateSpeech } from './services/geminiService';
import { fetchTextFromUrl } from './services/contentService';
import { decode, decodeAudioData } from './utils/audioUtils';
import { AudioState, Speaker } from './types';

const PlayIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z"></path></svg>
);

const PauseIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z"></path></svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5v7a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 10.5v-7Z"></path></svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"></path></svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .53 1.405c.78-.246 1.565-.389 2.365-.466v.118a2.75 2.75 0 0 0 2.75 2.75h2.5A2.75 2.75 0 0 0 14 5.25v-.118c.8.077 1.585.22 2.365.466a.75.75 0 0 0 .53-1.405c-.785-.248-1.57-.391-2.365-.468V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.414 0 .75.336.75.75v.118c-.373.04-.747.09-1.12.152A.75.75 0 0 1 9.25 5v.25c0 .414.336.75.75.75h.01a.75.75 0 0 1 0 1.5H10a.75.75 0 0 1-.75-.75V7a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 0 1.5H10a.75.75 0 0 1-.75-.75V6.362c.373-.062.747-.112 1.12-.152a.75.75 0 0 1 .38.148V5.25c0-.414-.336-.75-.75-.75h-.01a.75.75 0 0 1 0-1.5H10ZM7.58 8.132a.75.75 0 0 1 .838.668l.25 1.5a.75.75 0 0 1-1.476.244l-.25-1.5a.75.75 0 0 1 .638-.912Zm4.84 0a.75.75 0 0 1 .638.912l-.25 1.5a.75.75 0 0 1-1.476-.244l.25-1.5a.75.75 0 0 1 .838-.668ZM4.25 7.5c.414 0 .75.336.75.75v8.5a.75.75 0 0 1-1.5 0v-8.5A.75.75 0 0 1 4.25 7.5Zm3.5 0c.414 0 .75.336.75.75v8.5a.75.75 0 0 1-1.5 0v-8.5A.75.75 0 0 1 7.75 7.5Zm3.5 0c.414 0 .75.336.75.75v8.5a.75.75 0 0 1-1.5 0v-8.5A.75.75 0 0 1 11.25 7.5Zm3.5 0c.414 0 .75.336.75.75v8.5a.75.75 0 0 1-1.5 0v-8.5A.75.75 0 0 1 14.75 7.5Z" clipRule="evenodd"></path></svg>
);

const Loader: React.FC = () => (
    <div className="flex justify-center items-center space-x-1">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
    </div>
);

export default function App() {
  const [storyText, setStoryText] = useState<string>(DEFAULT_STORY_TEXT);
  const [speakers, setSpeakers] = useState<Speaker[]>([
    { id: crypto.randomUUID(), name: 'Narrator', voiceId: VOICES[0].id },
    { id: crypto.randomUUID(), name: 'Elara', voiceId: VOICES[0].id },
    { id: crypto.randomUUID(), name: 'Old Man', voiceId: VOICES[1].id },
  ]);
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [url, setUrl] = useState<string>('');
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const cleanupAudio = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.onended = null;
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
  }, []);
  
  const playAudio = useCallback((buffer: AudioBuffer) => {
    cleanupAudio();
    if (!audioContextRef.current) return;
    
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
      setAudioState('finished');
      cleanupAudio();
    };
    source.start(0);
    audioSourceRef.current = source;
    setAudioState('playing');
  }, [cleanupAudio]);

  const handleFetchFromUrl = async () => {
    setIsFetching(true);
    setErrorMessage(null);
    try {
      const text = await fetchTextFromUrl(url);
      setStoryText(text);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred while fetching from URL.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleGenerateAndPlay = async () => {
    if (!storyText.trim()) {
        setErrorMessage("Text cannot be empty.");
        setAudioState('error');
        return;
    }
    setAudioState('loading');
    setErrorMessage(null);

    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      } catch (e) {
        setErrorMessage("AudioContext is not supported by your browser.");
        setAudioState('error');
        return;
      }
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    try {
      const base64Audio = await generateSpeech(storyText, speakers);
      const audioBytes = decode(base64Audio);
      const buffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
      audioBufferRef.current = buffer;
      playAudio(buffer);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
      setAudioState('error');
    }
  };

  const handlePause = () => {
    if (audioContextRef.current && audioState === 'playing') {
      audioContextRef.current.suspend();
      setAudioState('paused');
    }
  };

  const handleResume = () => {
    if (audioContextRef.current && audioState === 'paused') {
      audioContextRef.current.resume();
      setAudioState('playing');
    }
  };

  const handleStop = () => {
    cleanupAudio();
    setAudioState('idle');
    audioBufferRef.current = null;
  };
  
  const handleMainButtonClick = () => {
    switch (audioState) {
        case 'idle':
        case 'finished':
        case 'error':
            handleGenerateAndPlay();
            break;
        case 'playing':
            handlePause();
            break;
        case 'paused':
            handleResume();
            break;
        default:
            break; // Do nothing while loading
    }
  };
  
  const handleAddSpeaker = () => {
    setSpeakers(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: `Speaker ${prev.length + 1}`, voiceId: VOICES[0].id }
    ]);
  };
  
  const handleRemoveSpeaker = (id: string) => {
    if (speakers.length > 1) {
      setSpeakers(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleSpeakerChange = (id: string, field: 'name' | 'voiceId', value: string) => {
    setSpeakers(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const isPlayButtonDisabled = audioState === 'loading' || (['idle', 'finished', 'error'].includes(audioState) && !storyText.trim());

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 font-sans">
      <div className="w-full max-w-2xl mx-auto bg-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-400">Story Aloud</h1>
          <p className="text-slate-400 mt-2">Bring any text to life with natural-sounding AI voices.</p>
        </header>

        <div className="space-y-2">
            <label htmlFor="url-input" className="block text-sm font-medium text-slate-300">
                Fetch from URL
            </label>
            <div className="flex space-x-2">
                <input
                    id="url-input"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetchFromUrl()}
                    disabled={isFetching}
                    className="flex-grow p-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 placeholder:text-slate-500"
                    placeholder="e.g., https://www.gutenberg.org/files/1342/1342-h/1342-h.htm"
                />
                <button
                    onClick={handleFetchFromUrl}
                    disabled={isFetching || !url.trim()}
                    className="flex-shrink-0 flex items-center justify-center w-24 px-4 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {isFetching ? <Loader /> : <span>Fetch</span>}
                </button>
            </div>
            <p className="text-xs text-slate-500 px-1">Note: This is an experimental feature and may not work for all websites.</p>
        </div>
        
        <div className="flex items-center text-slate-600">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold">OR</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        <div className="space-y-4">
          <label htmlFor="story-text" className="block text-sm font-medium text-slate-300">
            Paste your story or text below
          </label>
          <div className="relative">
            <textarea
              id="story-text"
              rows={10}
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              className="w-full p-4 bg-slate-900/50 border-2 border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 resize-none"
              placeholder="Narrator: Once upon a time...&#10;Character: Hello there!"
            />
            <span className="absolute bottom-3 right-3 text-xs text-slate-500">{storyText.length} characters</span>
          </div>
        </div>
        
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-300">
                    Configure Speakers
                </label>
                <button
                    onClick={handleAddSpeaker}
                    className="flex items-center space-x-2 px-2 py-1 text-sm text-cyan-400 hover:text-cyan-300 rounded-md hover:bg-slate-700 transition-colors"
                    aria-label="Add new speaker"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Speaker</span>
                </button>
            </div>
            <div className="space-y-2">
                {speakers.map((speaker, index) => (
                    <div key={speaker.id} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={speaker.name}
                            onChange={(e) => handleSpeakerChange(speaker.id, 'name', e.target.value)}
                            placeholder={`Speaker ${index + 1}`}
                            className="w-1/3 p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                            aria-label="Speaker Name"
                        />
                        <select
                            value={speaker.voiceId}
                            onChange={(e) => handleSpeakerChange(speaker.id, 'voiceId', e.target.value)}
                            className="flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                            aria-label="Speaker Voice"
                        >
                            {VOICES.map(voice => (
                                <option key={voice.id} value={voice.id}>{voice.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => handleRemoveSpeaker(speaker.id)}
                            disabled={speakers.length <= 1}
                            className="p-2 text-slate-400 rounded-md hover:bg-slate-600 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                            aria-label="Remove speaker"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {errorMessage && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg text-sm">
                <p><span className="font-bold">Error:</span> {errorMessage}</p>
            </div>
        )}

        <div className="flex items-center justify-center space-x-4 pt-4">
          <button
            onClick={handleMainButtonClick}
            disabled={isPlayButtonDisabled}
            className="flex-grow flex items-center justify-center space-x-2 px-6 py-4 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:scale-100"
          >
            {audioState === 'loading' ? <><Loader /> <span>Generating...</span></> :
             audioState === 'playing' ? <><PauseIcon /> <span>Pause</span></> :
             audioState === 'paused' ? <><PlayIcon /> <span>Resume</span></> :
             <><PlayIcon /> <span>Read Aloud</span></>}
          </button>
          
          {(audioState === 'playing' || audioState === 'paused' || audioState === 'finished') && (
            <button
                onClick={handleStop}
                className="p-4 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-colors duration-200"
                aria-label="Stop playback"
            >
                <StopIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
