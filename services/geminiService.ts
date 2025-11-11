import { GoogleGenAI, Modality } from "@google/genai";
import { Speaker } from '../types';

// API Key is automatically sourced from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateSpeech = async (text: string, speakers: Speaker[]): Promise<string> => {
  if (!text.trim()) {
    throw new Error('Input text cannot be empty.');
  }
  if (speakers.length === 0) {
    throw new Error('At least one speaker must be configured.');
  }

  let speechConfig;
  let prompt = text;

  if (speakers.length >= 2) {
    // For multi-speaker, the prompt should contain the dialogue with speaker names.
    // The Gemini API documentation suggests including a preamble in the prompt itself.
    const speakerNames = speakers.map(s => s.name).join(' and ');
    prompt = `TTS the following conversation between ${speakerNames}:\n${text}`;
    speechConfig = {
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs: speakers.map(speaker => ({
          speaker: speaker.name,
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: speaker.voiceId },
          },
        })),
      },
    };
  } else {
    // Single speaker
    prompt = `Say with a natural, storytelling tone: ${text}`;
    speechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: speakers[0].voiceId },
      },
    };
  }


  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig,
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      const blockReason = response.candidates?.[0]?.finishReason;
      if (blockReason === 'SAFETY') {
         throw new Error("The request was blocked for safety reasons. Please modify the text and try again.");
      }
      throw new Error("No audio data was received from the API. The response may have been empty or blocked.");
    }
    
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate speech: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating speech.");
  }
};
