import React, { useState, useEffect, useCallback } from 'react';
import { generateSpeech, generateText, generateMultiSpeakerSpeech } from './services/geminiService';
import { decode, decodeAudioData, createWavBlob, createReverbImpulseResponse } from './utils/audio';
import { VOICES } from './constants';
import VoiceSelector from './components/VoiceSelector';
import TextAreaInput from './components/TextAreaInput';
import GenerateButton from './components/GenerateButton';
import DownloadButton from './components/DownloadButton';
import PlayButton from './components/PlayButton';
import EffectSelector from './components/EffectSelector';
import { Voice } from './types';

type Tab = 'tts' | 'dialogue' | 'story';
type Effect = 'none' | 'reverb' | 'echo';

const App: React.FC = () => {
  // Common State
  const [activeTab, setActiveTab] = useState<Tab>('tts');
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [audioEffect, setAudioEffect] = useState<Effect>('none');
  const [reverbBuffer, setReverbBuffer] = useState<AudioBuffer | null>(null);

  // TTS State
  const [ttsText, setTtsText] = useState<string>('مرحباً');
  const [ttsVoice, setTtsVoice] = useState<Voice>(Voice.KORE);
  
  // Story State
  const [storyPrompt, setStoryPrompt] = useState<string>('');
  const [generatedStory, setGeneratedStory] = useState<string>('');
  const [storyVoice, setStoryVoice] = useState<Voice>(Voice.FENRIR);

  // Dialogue State
  const [dialogueTopic, setDialogueTopic] = useState<string>('');
  const [generatedDialogue, setGeneratedDialogue] = useState<string>('');
  const [speaker1, setSpeaker1] = useState({ name: 'جو', voice: Voice.PUCK });
  const [speaker2, setSpeaker2] = useState({ name: 'جين', voice: Voice.KORE });

  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContext) {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioContext(context);
        // Pre-generate reverb impulse response to avoid doing it on every play
        setReverbBuffer(createReverbImpulseResponse(context));
      }
    };
    document.body.addEventListener('click', initAudioContext, { once: true });
    return () => {
      document.body.removeEventListener('click', initAudioContext);
      audioContext?.close();
    };
  }, [audioContext]);

  const playAudio = useCallback(async (base64Audio: string) => {
    if (!audioContext || !reverbBuffer) {
      setError("لم يتم تفعيل مشغل الصوت. الرجاء النقر في أي مكان على الصفحة لتفعيله.");
      return;
    }
    if (audioContext.state === 'suspended') await audioContext.resume();
    
    try {
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // --- Audio Effects Graph ---
      if (audioEffect === 'none') {
        source.connect(audioContext.destination);
      } else if (audioEffect === 'reverb') {
        const convolver = audioContext.createConvolver();
        convolver.buffer = reverbBuffer;
        source.connect(convolver);
        convolver.connect(audioContext.destination);
      } else if (audioEffect === 'echo') {
        const delay = audioContext.createDelay(0.4);
        delay.delayTime.value = 0.4;
        const feedback = audioContext.createGain();
        feedback.gain.value = 0.5;

        // Create the feedback loop
        source.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);

        // Connect both dry (original) and wet (effect) signals to the output
        source.connect(audioContext.destination);
        delay.connect(audioContext.destination);
      }
      
      source.start();
    } catch (e) {
      console.error("Error playing audio:", e);
      setError("فشل تشغيل الصوت. قد تكون البيانات غير صالحة.");
    }
  }, [audioContext, audioEffect, reverbBuffer]);

  const handlePlayAudio = useCallback(async () => {
    if (audioData) {
        await playAudio(audioData);
    }
  }, [audioData, playAudio]);

  const handleDownload = useCallback(() => {
    if (!audioData) return;
    try {
        const audioBytes = decode(audioData);
        const wavBlob = createWavBlob(audioBytes, 1, 24000, 16);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'speech.wav';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (e) {
        console.error("Error creating download link:", e);
        setError("فشل إنشاء ملف التحميل.");
    }
  }, [audioData]);

  const resetState = () => {
    setIsLoading(true);
    setError(null);
    setAudioData(null);
    setGeneratedStory('');
    setGeneratedDialogue('');
  };

  const handleGenerateSpeech = useCallback(async () => {
    if (!ttsText.trim()) {
      setError("الرجاء إدخال نص لتحويله.");
      return;
    }
    resetState();
    try {
      const base64Audio = await generateSpeech(ttsText, ttsVoice);
      if (base64Audio) {
        setAudioData(base64Audio);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setIsLoading(false);
    }
  }, [ttsText, ttsVoice]);

  const handleGenerateStory = useCallback(async () => {
    if (!storyPrompt.trim()) {
      setError("الرجاء إدخال فكرة للقصة.");
      return;
    }
    resetState();
    try {
      const story = await generateText(`اكتب قصة قصيرة جداً وممتعة باللغة العربية بناءً على هذا الموضوع: "${storyPrompt}"`);
      setGeneratedStory(story);
      const base64Audio = await generateSpeech(story, storyVoice);
      if (base64Audio) {
        setAudioData(base64Audio);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setIsLoading(false);
    }
  }, [storyPrompt, storyVoice]);

  const handleGenerateDialogue = useCallback(async () => {
    if (!dialogueTopic.trim()) {
      setError("الرجاء إدخال موضوع للحوار.");
      return;
    }
    resetState();
    try {
      const prompt = `اكتب حوارًا قصيرًا وموجزًا باللغة العربية بين ${speaker1.name} و ${speaker2.name} عن ${dialogueTopic}. يجب أن يكون الحوار بهذا التنسيق الدقيق:\n${speaker1.name}: ...\n${speaker2.name}: ...`;
      const dialogue = await generateText(prompt);
      setGeneratedDialogue(dialogue);
      
      const base64Audio = await generateMultiSpeakerSpeech(dialogue, [speaker1, speaker2]);
      if (base64Audio) {
        setAudioData(base64Audio);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setIsLoading(false);
    }
  }, [dialogueTopic, speaker1, speaker2]);

  const renderTtsTab = () => (
    <div className="space-y-6">
      <TextAreaInput
        label="النص المراد تحويله"
        placeholder="اكتب شيئًا هنا... جرب استخدام الفواصل والنقاط لتحسين النطق."
        value={ttsText}
        onChange={(e) => setTtsText(e.target.value)}
      />
      <VoiceSelector
        voices={VOICES}
        selectedValue={ttsVoice}
        onChange={(e) => setTtsVoice(e.target.value as Voice)}
      />
      <GenerateButton onClick={handleGenerateSpeech} disabled={!ttsText.trim() || isLoading} isLoading={isLoading}>
        توليد الصوت
      </GenerateButton>
    </div>
  );

  const renderStoryTab = () => (
    <div className="space-y-6">
        <TextAreaInput
            label="فكرة القصة"
            placeholder="مثال: فارس شجاع وتنين صديق..."
            value={storyPrompt}
            onChange={(e) => setStoryPrompt(e.target.value)}
        />
        <VoiceSelector
            label="صوت الراوي"
            voices={VOICES}
            selectedValue={storyVoice}
            onChange={(e) => setStoryVoice(e.target.value as Voice)}
        />
        {generatedStory && !isLoading && (
            <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 max-h-40 overflow-y-auto">
                <p className="text-gray-300 whitespace-pre-wrap">{generatedStory}</p>
            </div>
        )}
        <GenerateButton onClick={handleGenerateStory} disabled={!storyPrompt.trim() || isLoading} isLoading={isLoading}>
           توليد القصة
        </GenerateButton>
    </div>
  );

  const renderDialogueTab = () => (
    <div className="space-y-6">
      <TextAreaInput
        label="موضوع الحوار"
        placeholder="مثال: التخطيط لرحلة..."
        rows={3}
        value={dialogueTopic}
        onChange={(e) => setDialogueTopic(e.target.value)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-700/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-cyan-400">المتحدث الأول</h3>
            <input type="text" value={speaker1.name} onChange={(e) => setSpeaker1(s => ({...s, name: e.target.value}))} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-cyan-500"/>
            <VoiceSelector label="صوت المتحدث الأول" voices={VOICES} selectedValue={speaker1.voice} onChange={(e) => setSpeaker1(s => ({...s, voice: e.target.value as Voice}))} />
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-cyan-400">المتحدث الثاني</h3>
            <input type="text" value={speaker2.name} onChange={(e) => setSpeaker2(s => ({...s, name: e.target.value}))} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-cyan-500"/>
            <VoiceSelector label="صوت المتحدث الثاني" voices={VOICES} selectedValue={speaker2.voice} onChange={(e) => setSpeaker2(s => ({...s, voice: e.target.value as Voice}))} />
        </div>
      </div>
      {generatedDialogue && !isLoading && (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 max-h-40 overflow-y-auto">
            <p className="text-gray-300 whitespace-pre-wrap">{generatedDialogue}</p>
        </div>
      )}
      <GenerateButton onClick={handleGenerateDialogue} disabled={!dialogueTopic.trim() || isLoading} isLoading={isLoading}>
            توليد الحوار
      </GenerateButton>
    </div>
  );

  const renderTabContent = () => {
    switch(activeTab) {
      case 'story': return renderStoryTab();
      case 'dialogue': return renderDialogueTab();
      case 'tts':
      default: return renderTtsTab();
    }
  };
  
  const TabButton: React.FC<{tabId: Tab; label: string}> = ({ tabId, label }) => (
    <button
      onClick={() => { setActiveTab(tabId); setError(null); setAudioData(null); }}
      className={`px-4 py-3 text-sm font-medium flex-1 md:flex-none rounded-t-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 ${
        activeTab === tabId
          ? 'bg-gray-800 border-b-2 border-cyan-400 text-cyan-400'
          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-[Cairo]">
      <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        <header className="text-center p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-400">مولّد الصوت بالذكاء الاصطناعي</h1>
          <p className="text-gray-400 mt-2">مدعوم بواسطة Gemini API</p>
        </header>

        <nav className="flex justify-center border-y border-gray-700 bg-gray-900/50 px-2 pt-2">
            <TabButton tabId="tts" label="تحويل النص إلى صوت" />
            <TabButton tabId="dialogue" label="توليد حوار" />
            <TabButton tabId="story" label="توليد قصة" />
        </nav>
        
        <main className="p-6 md:p-8 space-y-6">
          {renderTabContent()}
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center mt-6">
              <p>{error}</p>
            </div>
          )}
          {audioData && !isLoading && (
            <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
              <EffectSelector 
                selectedValue={audioEffect}
                onChange={(e) => setAudioEffect(e.target.value as Effect)}
              />
              <PlayButton onClick={handlePlayAudio} disabled={isLoading} />
              <DownloadButton onClick={handleDownload} disabled={isLoading} />
            </div>
          )}
        </main>

        <footer className="text-center text-gray-500 text-sm p-4 border-t border-gray-700 bg-gray-900/50">
          <p>&copy; {new Date().getFullYear()} - تم إنشاؤه بواسطة مهندس React خبير</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
