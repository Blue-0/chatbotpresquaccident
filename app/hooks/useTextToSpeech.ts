import { useState, useCallback } from 'react';

const TTS_CONFIG = {
  rate: 0.9,
  pitch: 1.0,
  volume: 1.0,
};

const extractTextContent = (htmlContent: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  const leadingRelaxedElements = tempDiv.querySelectorAll('.leading-relaxed');

  let textContent = '';
  if (leadingRelaxedElements.length > 0) {
    leadingRelaxedElements.forEach((element) => {
      textContent += element.textContent || '';
    });
  } else {
    textContent = tempDiv.textContent || '';
  }

  return textContent.replace(/\s+/g, ' ').trim();
};

const findFrenchVoice = (): SpeechSynthesisVoice | null => {
  const voices = speechSynthesis.getVoices();
  return (
    voices.find(
      (voice) =>
        voice.lang.startsWith('fr') ||
        voice.name.toLowerCase().includes('french') ||
        voice.name.toLowerCase().includes('français')
    ) || null
  );
};

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);

  const speak = useCallback((messageContent: string, messageId: string) => {
    try {
      if (!('speechSynthesis' in window)) {
        alert('Votre navigateur ne supporte pas la synthèse vocale');
        return;
      }

      speechSynthesis.cancel();

      const textContent = extractTextContent(messageContent);

      if (!textContent) {
        console.error('Empty text for TTS');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(textContent);
      const frenchVoice = findFrenchVoice();

      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }

      utterance.rate = TTS_CONFIG.rate;
      utterance.pitch = TTS_CONFIG.pitch;
      utterance.volume = TTS_CONFIG.volume;

      utterance.onstart = () => setIsSpeaking(messageId);
      utterance.onend = () => setIsSpeaking(null);
      utterance.onerror = () => setIsSpeaking(null);

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(null);
    }
  }, []);

  return {
    isSpeaking,
    speak,
  };
};
