
import { GoogleGenAI, Modality } from "@google/genai";

// API Key is automatically sourced from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateSpeech = async (text: string, voiceId: string): Promise<string> => {
  if (!text.trim()) {
    throw new Error('Input text cannot be empty.');
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with a natural, storytelling tone: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceId },
          },
        },
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
