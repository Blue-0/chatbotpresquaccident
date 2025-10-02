import { useState, useRef, useCallback } from 'react';

const AUDIO_CONFIG = {
  channelCount: 1,
  sampleRate: 16000,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  audioBitsPerSecond: 64000,
  minBlobSize: 1000,
};

export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONFIG,
      });

      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: AUDIO_CONFIG.audioBitsPerSecond,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        stopRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      if (
        error instanceof Error &&
        error.name === 'NotAllowedError'
      ) {
        alert(
          "Permission microphone refusée. Veuillez autoriser l'accès dans les paramètres de votre navigateur."
        );
      }
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || !isRecording) return null;

    await new Promise<void>((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve();
        return;
      }

      mediaRecorderRef.current.onstop = () => resolve();
      mediaRecorderRef.current.stop();
    });

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);

    if (audioChunksRef.current.length > 0) {
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = [];
      return audioBlob;
    }

    return null;
  }, [isRecording]);

  return {
    isRecording,
    audioStream: streamRef.current,
    startRecording,
    stopRecording,
  };
};
