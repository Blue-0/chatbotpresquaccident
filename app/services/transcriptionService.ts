import { convertWebMToWav } from '@/app/utils/audioConverter';

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const convertedBlob = await convertWebMToWav(audioBlob);
  
  if (!convertedBlob) {
    console.warn('Audio conversion failed');
    return '';
  }

  const formData = new FormData();
  formData.append('audio', convertedBlob, 'audio.wav');

  const response = await fetch('/api/voxtral', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    console.error('Voxtral API error:', response.status);
    return '';
  }

  const result = await response.json();

  if (result.text && result.text.trim()) {
    return result.text.trim();
  }

  console.warn('Empty transcription result');
  return '';
};
