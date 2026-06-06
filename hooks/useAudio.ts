import { useState, useRef, useCallback } from 'react';

type Language = 'PL' | 'ENG' | 'UKR';

export const useAudio = (lang: Language) => {
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [dictatingField, setDictatingField] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  const handleTTS = useCallback((text: string, id: string = 'tts') => {
    if ('speechSynthesis' in window) {
      if (audioLoadingId === id) {
        window.speechSynthesis.cancel();
        setAudioLoadingId(null);
        return;
      }
      setAudioLoadingId(id);

      const utterance = new SpeechSynthesisUtterance(text);
      if (lang === 'PL') utterance.lang = 'pl-PL';
      else if (lang === 'UKR') utterance.lang = 'uk-UA';
      else utterance.lang = 'en-US';

      utterance.onend = () => setAudioLoadingId(null);
      utterance.onerror = () => setAudioLoadingId(null);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [audioLoadingId, lang]);

  const handleDictate = useCallback((fieldName: string, onTranscript: (text: string) => void) => {
    if (dictatingField) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'UKR' ? 'uk-UA' : lang === 'PL' ? 'pl-PL' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setDictatingField(fieldName);
    recognition.onend = () => setDictatingField(null);
    recognition.onresult = (event: any) => {
      onTranscript(event.results[0][0].transcript);
    };
    recognition.onerror = () => setDictatingField(null);

    recognitionRef.current = recognition;
    recognition.start();
  }, [dictatingField, lang]);

  return { audioLoadingId, dictatingField, handleTTS, handleDictate };
};
