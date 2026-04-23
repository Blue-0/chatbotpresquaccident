import { useState, useCallback, useRef } from 'react';

/**
 * Extrait le texte brut depuis du contenu HTML.
 * Cible en priorité les éléments .leading-relaxed (corps des messages du chatbot).
 */
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

export const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsSpeaking(null);
    }, []);

    const speak = useCallback(async (messageContent: string, messageId: string) => {
        try {
            // Arrêter toute lecture en cours
            stop();

            const textContent = extractTextContent(messageContent);

            if (!textContent) {
                console.error('Texte vide pour le TTS');
                return;
            }

            setIsSpeaking(messageId);

            // ✅ Appel à la route Next.js /api/tts qui utilise Mistral AI
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: textContent }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})) as { error?: string };
                console.error('Erreur TTS API:', response.status, errorData);
                setIsSpeaking(null);
                return;
            }

            const data = await response.json() as { audio_data?: string; format?: string };

            if (!data.audio_data) {
                console.error('Pas de données audio reçues');
                setIsSpeaking(null);
                return;
            }

            // ✅ Décoder le base64 mp3 et lire avec HTMLAudioElement
            const audioBytes = atob(data.audio_data);
            const audioArray = new Uint8Array(audioBytes.length);
            for (let i = 0; i < audioBytes.length; i++) {
                audioArray[i] = audioBytes.charCodeAt(i);
            }
            const audioBlob = new Blob([audioArray], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setIsSpeaking(null);
                URL.revokeObjectURL(audioUrl); // Libérer la mémoire
            };

            audio.onerror = (e) => {
                console.error('Erreur lecture audio:', e);
                setIsSpeaking(null);
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();

        } catch (error) {
            console.error('Erreur TTS:', error);
            setIsSpeaking(null);
        }
    }, [stop]);

    return {
        isSpeaking,
        speak,
        stop,
    };
};
