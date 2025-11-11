import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSpeech = async (text: string, voice: string): Promise<string | null> => {
  try {
    // Add a prompt to encourage a more natural, human-like tone.
    const promptedText = `انطق بنبرة طبيعية وودودة: ${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: promptedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from API.");
    }
    
    return base64Audio;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("فشل إنشاء الصوت. الرجاء المحاولة مرة أخرى.");
  }
};
