import { GoogleGenAI, Modality } from "@google/genai";
import { Voice } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSpeech = async (text: string, voice: string): Promise<string | null> => {
  try {
    // A more advanced prompt to elicit a highly realistic and expressive performance.
    const promptedText = `تخيل أنك ممثل صوتي محترف تسجل كتابًا صوتيًا. يجب أن يكون أداؤك آسرًا، مع وقفات طبيعية، وعمق عاطفي، ونبرة صوت متنوعة تضفي حياة على النص. انتبه جيدًا لعلامات الترقيم لتوجيه إيقاعك. اقرأ النص التالي: ${text}`;
    
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

export const generateText = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for text generation:", error);
        throw new Error("فشل في إنشاء النص. الرجاء المحاولة مرة أخرى.");
    }
};

export const generateMultiSpeakerSpeech = async (
    text: string,
    speakers: { name: string, voice: Voice }[]
): Promise<string | null> => {
    if (speakers.length !== 2) {
        throw new Error("يجب تحديد متحدثين اثنين بالضبط.");
    }
    try {
        // A more advanced prompt for directing a realistic dialogue.
        const promptedText = `تخيل أنك مخرج صوتي. النص التالي هو حوار. تأكد من أن صوت كل متحدث مميز ومليء بالشخصية، ويعكس محادثة حقيقية وعفوية. يجب أن تبدو تفاعلاتهم أصيلة، مع إيقاع طبيعي وردود فعل عاطفية. هذا هو النص:\n${text}`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: promptedText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: speakers.map(s => ({
                            speaker: s.name,
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: s.voice }
                            }
                        }))
                    }
                }
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }

        return base64Audio;
    } catch (error) {
        console.error("Error calling Gemini API for multi-speaker speech:", error);
        throw new Error("فشل إنشاء الصوت. الرجاء المحاولة مرة أخرى.");
    }
};