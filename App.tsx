import React, { useState, useEffect, useCallback } from 'react';
import { generateSpeech } from './services/geminiService';
import { decode, decodeAudioData, createWavBlob } from './utils/audio';
import { VOICES, VoiceOption } from './constants';
import VoiceSelector from './components/VoiceSelector';
import TextAreaInput from './components/TextAreaInput';
import GenerateButton from './components/GenerateButton';
import DownloadButton from './components/DownloadButton';
import { Voice } from './types';

const App: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<Voice>(Voice.KORE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);

  useEffect(() => {
    const initAudioContext = () => {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioContext(context);
        document.body.removeEventListener('click', initAudioContext);
    };

    if (!audioContext) {
        document.body.addEventListener('click', initAudioContext);
    }

    return () => {
        document.body.removeEventListener('click', initAudioContext);
        audioContext?.close();
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playAudio = useCallback(async (base64Audio: string) => {
    if (!audioContext) {
      setError("لم يتم تفعيل مشغل الصوت. الرجاء النقر في أي مكان على الصفحة لتفعيله.");
      return;
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    try {
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (e) {
      console.error("Error playing audio:", e);
      setError("فشل تشغيل الصوت. قد تكون البيانات غير صالحة.");
    }
  }, [audioContext]);


  const handleGenerateSpeech = useCallback(async () => {
    if (!text.trim()) {
      setError("الرجاء إدخال نص لتحويله.");
      return;
    }
    if (!audioContext) {
        setError("لم يتم تفعيل مشغل الصوت. الرجاء النقر في أي مكان على الصفحة لتفعيله.");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);
    setAudioData(null);

    try {
      const base64Audio = await generateSpeech(text, selectedVoice);
      if (base64Audio) {
        setAudioData(base64Audio);
        await playAudio(base64Audio);
      } else {
        setError("فشل إنشاء الصوت. لم يتم استلام بيانات صوتية.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setIsLoading(false);
    }
  }, [text, selectedVoice, audioContext, playAudio]);

  const handleDownload = useCallback(() => {
    if (!audioData) return;
    try {
        const audioBytes = decode(audioData);
        const wavBlob = createWavBlob(audioBytes, 1, 24000, 16);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'speech.wav';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (e) {
        console.error("Error creating download link:", e);
        setError("فشل إنشاء ملف التحميل.");
    }
  }, [audioData]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-[Cairo]">
      <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 border border-gray-700">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-400">محول النص إلى صوت</h1>
          <p className="text-gray-400 mt-2">مدعوم بواسطة Gemini API</p>
        </header>
        
        <main className="space-y-6">
          <TextAreaInput
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <VoiceSelector
            voices={VOICES}
            selectedValue={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value as Voice)}
          />
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center">
              <p>{error}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            <GenerateButton
              isLoading={isLoading}
              onClick={handleGenerateSpeech}
              disabled={!text.trim() || isLoading}
            />
            {audioData && !isLoading && (
              <DownloadButton
                onClick={handleDownload}
                disabled={isLoading}
              />
            )}
          </div>
        </main>

        <footer className="text-center text-gray-500 text-sm pt-4 border-t border-gray-700">
          <p>&copy; {new Date().getFullYear()} - تم إنشاؤه بواسطة مهندس React خبير</p>
        </footer>
      </div>
    </div>
  );
};

export default App;