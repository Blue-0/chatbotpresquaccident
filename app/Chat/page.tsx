'use client';
import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Particles from "@/src/components/Particles";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/src/components/ui/card";
import {Button} from "@/src/components/ui/button";
import {SessionId} from "@/app/components/sessionid";
import { useSessionId } from "@/app/hooks/useSessionId";
import {marked} from "marked";

interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

export default function ChatPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { sessionId } = useSessionId();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'ai',
            content: 'Bonjour ! Je suis votre assistant E2I AgentSecu. Comment puis-je vous aider aujourd\'hui ?',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const transcriptionBufferRef = useRef<string>('');
    const pendingTranscriptionsRef = useRef<Set<number>>(new Set());
    const recognitionRef = useRef<any>(null);
    const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);

    // Rediriger vers login si pas de session
    useEffect(() => {
        if (status === 'loading') return // Encore en chargement

        if (!session) {
            router.push('/Login')
            return
        }
    }, [session, status, router])

    // Auto-scroll vers le bas à chaque nouveau message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-resize du textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '44px'; // Reset à la hauteur minimale
            const scrollHeight = textareaRef.current.scrollHeight;
            const maxHeight = 120; // Hauteur maximale (environ 4 lignes)
            textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        }
    }, [inputMessage]);

    // Fonction optimisée pour démarrer l'enregistrement Voxtral selon les bonnes pratiques Mistral AI
    const startVoxtralLiveTranscription = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1, // Mono recommandé par Mistral
                    sampleRate: 16000, // 16kHz optimal pour Voxtral
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true // Ajout pour stabiliser le volume
                }
            });
            
            // Configuration optimisée selon la doc Mistral AI
            const supportedMimeTypes = [
                'audio/wav',
                'audio/mp4', // M4A supporté
                'audio/webm;codecs=opus', // Fallback à convertir
                'audio/webm'
            ];
            
            let selectedMimeType = 'audio/webm'; // Fallback à convertir
            for (const mimeType of supportedMimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    selectedMimeType = mimeType;
                    break;
                }
            }

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: selectedMimeType,
                audioBitsPerSecond: 64000 // Augmenté pour meilleure qualité (recommandation Mistral)
            });

            console.log('🎤 Format audio sélectionné:', selectedMimeType);

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            transcriptionBufferRef.current = '';
            pendingTranscriptionsRef.current.clear();

            let segmentCounter = 0;
            // Optimisation selon Mistral : segments de 5-10 secondes pour meilleure précision
            const SEGMENT_DURATION = 8000; // 8 secondes (dans la plage optimale 5-30s)
            const MIN_AUDIO_SIZE = 8192; // Taille minimale augmentée pour éviter segments trop courts
            const MAX_CONCURRENT_TRANSCRIPTIONS = 2; // Limité selon les bonnes pratiques

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > MIN_AUDIO_SIZE) {
                    audioChunksRef.current.push(event.data);
                    
                    // Respect des limites de concurrence recommandées
                    if (pendingTranscriptionsRef.current.size < MAX_CONCURRENT_TRANSCRIPTIONS) {
                        const audioBlob = new Blob([event.data], { type: selectedMimeType });
                        
                        // Vérification de la taille selon les limites Mistral (25MB max)
                        if (audioBlob.size > 25 * 1024 * 1024) {
                            console.warn(`⚠️ Segment trop volumineux: ${audioBlob.size} bytes (max 25MB)`);
                            return;
                        }
                        
                        const currentSegmentId = segmentCounter++;
                        pendingTranscriptionsRef.current.add(currentSegmentId);
                        
                        // Transcription asynchrone optimisée
                        transcribeSegmentWithVoxtralOptimized(audioBlob, currentSegmentId, selectedMimeType)
                            .finally(() => {
                                pendingTranscriptionsRef.current.delete(currentSegmentId);
                            });
                    } else {
                        console.log('🔄 Transcriptions en cours, segment ignoré (évite surcharge API)');
                    }
                }
            };

            mediaRecorder.onstop = async () => {
                console.log('🎤 Enregistrement Voxtral terminé');
                setIsRecording(false);
                setIsTranscribing(false);
                
                // Attendre que toutes les transcriptions en cours se terminent
                const waitForPendingTranscriptions = () => {
                    return new Promise<void>((resolve) => {
                        const checkInterval = setInterval(() => {
                            if (pendingTranscriptionsRef.current.size === 0) {
                                clearInterval(checkInterval);
                                resolve();
                            }
                        }, 100);
                        
                        // Timeout après 5 secondes
                        setTimeout(() => {
                            clearInterval(checkInterval);
                            resolve();
                        }, 5000);
                    });
                };
                
                await waitForPendingTranscriptions();
                
                // Nettoyer le texte final et appliquer le buffer
                const finalText = transcriptionBufferRef.current.trim();
                if (finalText) {
                    setInputMessage(prev => {
                        const cleanedPrev = prev.replace(/\[Transcription en cours\.\.\.\]/g, '').trim();
                        return cleanedPrev ? `${cleanedPrev} ${finalText}` : finalText;
                    });
                }
                transcriptionBufferRef.current = '';
                
                // Arrêter le stream
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.onerror = (event) => {
                console.error('❌ Erreur MediaRecorder:', event);
                setIsRecording(false);
                setIsTranscribing(false);
                pendingTranscriptionsRef.current.clear();
                // Arrêter le stream en cas d'erreur
                stream.getTracks().forEach(track => track.stop());
            };

            // Démarrer l'enregistrement
            mediaRecorder.start();
            setIsRecording(true);
            setIsTranscribing(true);
            
            // Créer des segments optimisés selon les recommandations Mistral
            const segmentInterval = setInterval(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.requestData();
                }
            }, SEGMENT_DURATION);

            // Stocker l'interval pour le nettoyer
            mediaRecorderRef.current.segmentInterval = segmentInterval;

            console.log('🎤 Enregistrement Voxtral optimisé démarré:', {
                segmentDuration: SEGMENT_DURATION + 'ms (recommandation Mistral: 5-30s)',
                minAudioSize: MIN_AUDIO_SIZE + ' bytes',
                maxConcurrent: MAX_CONCURRENT_TRANSCRIPTIONS,
                sampleRate: '16kHz',
                bitrate: '64kbps'
            });
            
        } catch (error) {
            console.error('Erreur lors du démarrage de l\'enregistrement Voxtral:', error);
            if (error.name === 'NotAllowedError') {
                alert('Permission microphone refusée. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.');
            } else {
                alert('Erreur microphone. Vérifiez votre équipement audio.');
            }
            setIsRecording(false);
            setIsTranscribing(false);
        }
    };

    // Fonction corrigée pour convertir WebM vers WAV compatible avec Mistral AI
    const convertWebMToWav = async (webmBlob: Blob): Promise<Blob> => {
        try {
            console.log('🔄 Début conversion WebM vers WAV conforme Mistral...');
            
            // Configuration AudioContext optimale selon Mistral AI
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000, // 16kHz recommandé par Mistral
                latencyHint: 'playback'
            });
            
            const arrayBuffer = await webmBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            console.log('📊 AudioBuffer analysé:', {
                sampleRate: audioBuffer.sampleRate,
                numberOfChannels: audioBuffer.numberOfChannels,
                length: audioBuffer.length,
                duration: audioBuffer.duration + 's'
            });
            
            // Paramètres WAV stricts selon spécifications Mistral
            const targetSampleRate = 16000;
            const numberOfChannels = 1; // Mono obligatoire
            const bitsPerSample = 16; // PCM 16-bit
            const bytesPerSample = bitsPerSample / 8;
            const blockAlign = numberOfChannels * bytesPerSample;
            const byteRate = targetSampleRate * blockAlign;
            
            // Resampling et conversion en mono
            const inputChannelData = audioBuffer.getChannelData(0);
            const inputSampleRate = audioBuffer.sampleRate;
            const resampleRatio = targetSampleRate / inputSampleRate;
            const outputLength = Math.floor(audioBuffer.length * resampleRatio);
            const outputSamples = new Float32Array(outputLength);
            
            // Resampling avec interpolation linéaire améliorée
            for (let i = 0; i < outputLength; i++) {
                const sourceIndex = i / resampleRatio;
                const index = Math.floor(sourceIndex);
                const fraction = sourceIndex - index;
                
                if (index + 1 < inputChannelData.length) {
                    outputSamples[i] = inputChannelData[index] * (1 - fraction) + 
                                      inputChannelData[index + 1] * fraction;
                } else {
                    outputSamples[i] = inputChannelData[Math.min(index, inputChannelData.length - 1)] || 0;
                }
            }
            
            // Calcul des tailles pour le format WAV
            const dataSize = outputLength * bytesPerSample;
            const fileSize = 36 + dataSize;
            
            // Création du buffer WAV avec header complet et correct
            const buffer = new ArrayBuffer(44 + dataSize);
            const view = new DataView(buffer);
            
            // Fonction utilitaire pour écrire des chaînes ASCII
            const writeString = (offset: number, string: string) => {
                for (let i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            };
            
            // Header RIFF/WAV complet selon standard WAV
            writeString(0, 'RIFF');                           // ChunkID (4 bytes)
            view.setUint32(4, fileSize, true);                // ChunkSize (4 bytes, little-endian)
            writeString(8, 'WAVE');                           // Format (4 bytes)
            
            // Subchunk1 (fmt)
            writeString(12, 'fmt ');                          // Subchunk1ID (4 bytes)
            view.setUint32(16, 16, true);                     // Subchunk1Size (4 bytes)
            view.setUint16(20, 1, true);                      // AudioFormat (2 bytes) - PCM = 1
            view.setUint16(22, numberOfChannels, true);       // NumChannels (2 bytes)
            view.setUint32(24, targetSampleRate, true);       // SampleRate (4 bytes)
            view.setUint32(28, byteRate, true);               // ByteRate (4 bytes)
            view.setUint16(32, blockAlign, true);             // BlockAlign (2 bytes)
            view.setUint16(34, bitsPerSample, true);          // BitsPerSample (2 bytes)
            
            // Subchunk2 (data)
            writeString(36, 'data');                          // Subchunk2ID (4 bytes)
            view.setUint32(40, dataSize, true);               // Subchunk2Size (4 bytes)
            
            // Conversion des échantillons en PCM 16-bit
            let offset = 44;
            for (let i = 0; i < outputLength; i++) {
                // Clamp et conversion en entier 16-bit signé
                let sample = Math.max(-1, Math.min(1, outputSamples[i]));
                const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset, Math.round(intSample), true); // Little-endian
                offset += 2;
            }
            
            // Validation du fichier WAV généré
            const wavBlob = new Blob([buffer], { 
                type: 'audio/wav'
            });
            
            console.log('✅ Conversion WAV réussie:', {
                inputFormat: 'WebM',
                outputFormat: 'WAV PCM 16-bit',
                inputSize: webmBlob.size + ' bytes',
                outputSize: wavBlob.size + ' bytes',
                sampleRate: targetSampleRate + 'Hz',
                channels: numberOfChannels,
                duration: (outputLength / targetSampleRate).toFixed(2) + 's',
                compression: 'Aucune (PCM)'
            });
            
            return wavBlob;
            
        } catch (error) {
            console.error('❌ Erreur conversion WebM vers WAV:', error);
            // Ne plus utiliser de fallback, lancer l'erreur pour diagnostic
            throw new Error(`Conversion impossible: ${error.message}`);
        }
    };

    // Fonction optimisée pour la transcription avec conversion WAV
    const transcribeSegmentWithVoxtralOptimized = async (audioBlob: Blob, segmentId: number, originalMimeType: string, retryCount = 0) => {
        const MAX_RETRIES = 2;
        
        try {
            console.log(`📝 Transcription segment ${segmentId} (${audioBlob.size} bytes, ${originalMimeType}) - Tentative ${retryCount + 1}`);
            
            let processedBlob = audioBlob;
            let fileName = `segment_${segmentId}.wav`;
            
            // Convertir WebM vers WAV si nécessaire
            if (originalMimeType.includes('webm')) {
                console.log(`🔄 Conversion WebM vers WAV pour segment ${segmentId}...`);
                processedBlob = await convertWebMToWav(audioBlob);
                console.log(`✅ Conversion terminée, nouvelle taille: ${processedBlob.size} bytes`);
            } else if (originalMimeType.includes('wav')) {
                fileName = `segment_${segmentId}.wav`;
            }

            const formData = new FormData();
            formData.append('audio', processedBlob, fileName);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout 15s pour la conversion

            const response = await fetch('/api/voxtral', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Segment ${segmentId} transcrit:`, result.text?.substring(0, 50) + '...');
                
                if (result.text && result.text.trim()) {
                    const cleanText = result.text.trim();
                    
                    // Buffer intelligent pour éviter les doublons et organiser le texte
                    transcriptionBufferRef.current = (transcriptionBufferRef.current + ' ' + cleanText).trim();
                    
                    // Mise à jour de l'affichage avec buffer
                    setInputMessage(prev => {
                        const baseText = prev.replace(/\[Transcription en cours...\]/g, '').trim();
                        // Utiliser le buffer pour un texte plus cohérent
                        return (baseText ? baseText + ' ' : '') + transcriptionBufferRef.current + ' [Transcription en cours...]';
                    });
                }
            } else if (response.status === 429 && retryCount < MAX_RETRIES) {
                // Rate limiting : attendre et réessayer
                console.warn(`⚠️ Rate limit segment ${segmentId}, retry dans 1s...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return transcribeSegmentWithVoxtralOptimized(audioBlob, segmentId, originalMimeType, retryCount + 1);
            } else {
                console.warn(`⚠️ Erreur transcription segment ${segmentId}:`, response.status, response.statusText);
                const errorText = await response.text();
                console.warn('Détails erreur:', errorText);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn(`⏰ Timeout segment ${segmentId}`);
            } else if (retryCount < MAX_RETRIES) {
                console.warn(`🔄 Retry segment ${segmentId} (${error.message})`);
                await new Promise(resolve => setTimeout(resolve, 500));
                return transcribeSegmentWithVoxtralOptimized(audioBlob, segmentId, originalMimeType, retryCount + 1);
            } else {
                console.error(`❌ Échec définitif segment ${segmentId}:`, error.message);
            }
        }
    };

    // Fonction pour arrêter l'enregistrement Voxtral de manière propre
    const stopVoxtralLiveTranscription = () => {
        if (mediaRecorderRef.current && isRecording) {
            // Nettoyer l'interval des segments
            if (mediaRecorderRef.current.segmentInterval) {
                clearInterval(mediaRecorderRef.current.segmentInterval);
                delete mediaRecorderRef.current.segmentInterval;
            }
            
            // Arrêter l'enregistrement (déclenchera automatiquement onstop)
            mediaRecorderRef.current.stop();
            console.log('🛑 Arrêt demandé pour l\'enregistrement Voxtral optimisé');
        }
    };

    // Système hybride : Web Speech API pour le temps réel + Voxtral pour la précision
    const startHybridLiveTranscription = async () => {
        // Vérifier la disponibilité de Web Speech API
        const hasWebSpeech = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
        
        if (hasWebSpeech) {
            // Démarrer la transcription en temps réel avec Web Speech API
            startWebSpeechTranscription();
        }
        
        // En parallèle, démarrer l'enregistrement Voxtral pour validation
        await startVoxtralBackgroundRecording();
    };

    // Transcription instantanée avec Web Speech API
    const startWebSpeechTranscription = () => {
        try {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'fr-FR';

            let finalTranscript = '';

            recognition.onstart = () => {
                console.log('🎤 Transcription temps réel démarrée (Web Speech)');
                setIsLiveTranscribing(true);
            };

            recognition.onresult = (event) => {
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript = transcript;
                    }
                }

                // Mise à jour en temps réel de l'input
                const baseText = inputMessage.replace(/\[.*?\].*$/, '').trim();
                let displayText = baseText + (baseText ? ' ' : '') + finalTranscript;
                
                if (interimTranscript) {
                    displayText += `[En cours...] ${interimTranscript}`;
                }
                
                setInputMessage(displayText);
            };

            recognition.onend = () => {
                console.log('🎤 Transcription temps réel terminée');
                setIsLiveTranscribing(false);
                
                // Nettoyer le texte final
                const cleanedText = inputMessage.replace(/\[.*?\].*$/, '').trim();
                setInputMessage(cleanedText);
            };

            recognition.onerror = (event) => {
                console.error('❌ Erreur Web Speech:', event.error);
                setIsLiveTranscribing(false);
                
                if (event.error === 'not-allowed') {
                    console.warn('Permission refusée pour Web Speech, utilisation Voxtral uniquement');
                }
            };

            recognition.start();
            recognitionRef.current = recognition;
            
        } catch (error) {
            console.error('Web Speech non disponible, utilisation Voxtral uniquement:', error);
        }
    };

    // Enregistrement Voxtral en arrière-plan pour validation
    const startVoxtralBackgroundRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            const supportedMimeTypes = [
                'audio/wav',
                'audio/mp4',
                'audio/webm;codecs=opus',
                'audio/webm'
            ];
            
            let selectedMimeType = 'audio/webm';
            for (const mimeType of supportedMimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    selectedMimeType = mimeType;
                    break;
                }
            }

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: selectedMimeType,
                audioBitsPerSecond: 64000
            });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            // Enregistrement complet pour validation finale avec Voxtral
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                console.log('🎤 Enregistrement Voxtral terminé, validation finale...');
                
                // Créer le fichier audio complet
                const completeAudioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
                
                if (completeAudioBlob.size > 8192) { // Vérifier qu'il y a assez d'audio
                    try {
                        // Valider avec Voxtral
                        await validateWithVoxtral(completeAudioBlob, selectedMimeType);
                    } catch (error) {
                        console.warn('Validation Voxtral échouée, conservant Web Speech:', error);
                    }
                }
                
                setIsRecording(false);
                setIsTranscribing(false);
                
                // Arrêter le stream
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.onerror = (event) => {
                console.error('❌ Erreur MediaRecorder:', event);
                setIsRecording(false);
                setIsTranscribing(false);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setIsTranscribing(true);

            console.log('📹 Enregistrement Voxtral de validation démarré');
            
        } catch (error) {
            console.error('Erreur enregistrement Voxtral:', error);
            if (error.name === 'NotAllowedError') {
                alert('Permission microphone refusée. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.');
            }
            setIsRecording(false);
            setIsTranscribing(false);
        }
    };

    // Validation finale avec Voxtral
    const validateWithVoxtral = async (audioBlob: Blob, mimeType: string) => {
        try {
            console.log('🔍 Validation finale avec Voxtral...');
            
            let processedBlob = audioBlob;
            
            if (mimeType.includes('webm')) {
                processedBlob = await convertWebMToWav(audioBlob);
            }

            const formData = new FormData();
            formData.append('audio', processedBlob, 'validation.wav');

            const response = await fetch('/api/voxtral', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.text && result.text.trim()) {
                    console.log('✅ Validation Voxtral:', result.text);
                    
                    // Remplacer le texte par la version Voxtral si très différente
                    const currentText = inputMessage.replace(/\[.*?\].*$/, '').trim();
                    const voxtralText = result.text.trim();
                    
                    // Si Voxtral donne un résultat significativement différent, proposer de l'utiliser
                    if (voxtralText.length > currentText.length * 1.2 || voxtralText.length < currentText.length * 0.8) {
                        console.log('📝 Différence significative détectée, suggestion Voxtral');
                        // Optionnel : on peut ajouter une logique pour proposer le texte Voxtral
                    }
                }
            }
        } catch (error) {
            console.warn('Validation Voxtral échouée:', error);
        }
    };

    // Arrêter la transcription hybride
    const stopHybridLiveTranscription = () => {
        // Arrêter Web Speech API
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        
        // Arrêter l'enregistrement Voxtral
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
        
        setIsLiveTranscribing(false);
    };

    // Fonction pour gérer le clic sur le bouton microphone
    const handleMicClick = () => {
        if (isRecording) {
            stopHybridLiveTranscription();
        } else {
            startHybridLiveTranscription();
        }
    };

    // Fonction pour gérer le TTS natif du navigateur
    const handleNativeTTS = (messageContent: string, messageId: string) => {
        try {
            // Vérifier si le navigateur supporte la synthèse vocale
            if (!('speechSynthesis' in window)) {
                alert('Votre navigateur ne supporte pas la synthèse vocale');
                return;
            }

            // Arrêter toute synthèse en cours
            speechSynthesis.cancel();

            // Créer un élément temporaire pour parser le HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = messageContent;
            
            // Récupérer spécifiquement le contenu des éléments avec la classe "leading-relaxed"
            const leadingRelaxedElements = tempDiv.querySelectorAll('.leading-relaxed');
            
            let textContent = '';
            if (leadingRelaxedElements.length > 0) {
                // Extraire le texte de tous les éléments leading-relaxed
                leadingRelaxedElements.forEach(element => {
                    textContent += element.textContent || '';
                });
            } else {
                // Fallback : utiliser tout le contenu si pas d'élément leading-relaxed trouvé
                textContent = tempDiv.textContent || '';
            }
            
            // Nettoyer le texte
            textContent = textContent
                .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
                .trim();

            if (!textContent || textContent.length === 0) {
                console.error('Texte vide pour TTS natif');
                return;
            }

            console.log('🟠 TTS natif pour message:', messageId);
            console.log('Texte à synthétiser:', textContent.substring(0, 100) + (textContent.length > 100 ? "..." : ""));

            // Créer l'utterance pour la synthèse vocale
            const utterance = new SpeechSynthesisUtterance(textContent);
            
            // Configuration de la voix (essayer de trouver une voix française)
            const voices = speechSynthesis.getVoices();
            const frenchVoice = voices.find(voice => 
                voice.lang.startsWith('fr') || 
                voice.name.toLowerCase().includes('french') ||
                voice.name.toLowerCase().includes('français')
            );
            
            if (frenchVoice) {
                utterance.voice = frenchVoice;
                console.log('🎤 Voix française trouvée:', frenchVoice.name);
            } else {
                console.log('🎤 Aucune voix française trouvée, utilisation de la voix par défaut');
            }

            // Configuration des paramètres
            utterance.rate = 0.9; // Vitesse légèrement ralentie
            utterance.pitch = 1.0; // Ton normal
            utterance.volume = 1.0; // Volume maximal

            // Gestionnaires d'événements
            utterance.onstart = () => {
                console.log('🟠 Synthèse vocale native démarrée');
                setIsSpeaking(messageId);
            };

            utterance.onend = () => {
                console.log('🟠 Synthèse vocale native terminée');
                setIsSpeaking(null);
            };

            utterance.onerror = (event) => {
                console.error('❌ Erreur synthèse vocale native:', event.error);
                setIsSpeaking(null);
            };

            // Démarrer la synthèse
            speechSynthesis.speak(utterance);

        } catch (error) {
            console.error('❌ Erreur TTS natif:', error);
            setIsSpeaking(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentMessage = inputMessage;
        setInputMessage('');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: currentMessage,
                    sessionId: sessionId,
                    timestamp: new Date().toISOString()
                })
            });
        
            if (response.ok) {
                const data = await response.json();
                let parsedContent = await marked.parse(data.response) || 'Réponse reçue du webhook';
                
                // Transformer les balises <em> en balises avec style personnalisé pour les messages du bot
                parsedContent = parsedContent.replace(/<em>(.*?)<\/em>/g, '<span style="font-weight: bold; color: #F28C06;">$1</span>');
                
                // Diviser le message si il contient la balise <hr>
                const messageParts = parsedContent.split('<hr>');
                
                if (messageParts.length > 1) {
                    // Plusieurs messages à créer
                    messageParts.forEach((part, index) => {
                        if (part.trim()) { // Ne pas créer de message vide
                            const aiMessage: Message = {
                                id: (Date.now() + index + 1).toString(),
                                type: 'ai',
                                content: part.trim(),
                                timestamp: new Date()
                            };
                            setMessages(prev => [...prev, aiMessage]);
                        }
                    });
                } else {
                    // Message unique
                    const aiMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        type: 'ai',
                        content: parsedContent,
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, aiMessage]);
                }
            } else {
                throw new Error('Erreur lors de l\'appel au webhook');
            }
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: 'Désolé, une erreur est survenue lors du traitement de votre demande.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    // Afficher un loader pendant la vérification
    if (status === 'loading') {
        return (
            <div className="relative min-h-screen flex justify-center items-center">
                <div className="absolute inset-0 z-0">
                    <Particles
                        particleColors={['#43bb8c']}
                        particleCount={300}
                        particleSpread={6}
                        speed={0.05}
                        particleBaseSize={80}
                        moveParticlesOnHover={false}
                        alphaParticles={true}
                        disableRotation={false}
                    />
                </div>
                <div className="relative z-10 text-lg text-gray-600">
                    Vérification de votre session...
                </div>
            </div>
        )
    }

    // Si pas de session, ne rien afficher (la redirection va se faire)
    if (!session) {
        return null
    }

    // Fonction de déconnexion
    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/Login' })
    }

    return (
        <div className="relative min-h-screen flex flex-col">
            {/* Particles Background */}
            <div className="absolute inset-0 z-0">
                <Particles
                    particleColors={['#43bb8c']}
                    particleCount={300}
                    particleSpread={6}
                    speed={0.05}
                    particleBaseSize={80}
                    moveParticlesOnHover={false}
                    alphaParticles={true}
                    disableRotation={false}
                />
            </div>

            {/* Main Chat Container */}
            <div className="relative z-10 flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
                
                {/* Header Card */}
                <Card className="mb-2 bg-white/95 shadow-lg border border-gray-200">
                    <CardHeader className="pb-3 bg-transparent border-gray-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">
                                    E2I AgentSecu
                                </CardTitle>
                                <CardDescription className="text-gray-600 max-sm:hidden">
                                    Assistant IA pour vos questions de sécurité
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">

                                <Button
                                    onClick={handleSignOut}
                                    className="text-xs"
                                >
                                    <SessionId />
                                </Button>
                            </div>
                        </div>
                        <CardContent className="text-gray-600 text-sm sm:hidden block p-0">
                            Assistant IA - {session.user?.email}
                        </CardContent>
                    </CardHeader>
                </Card>

                {/* Messages Area */}
                <Card className="flex-1 mb-2 bg-white/95 shadow-lg border border-gray-200 flex flex-col">
                    <CardContent className="flex-1 p-6 overflow-y-auto max-h-[60vh]">
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className="relative group max-w-[80%]">
                                        <div
                                            className={`p-4 rounded-2xl ${
                                                message.type === 'user'
                                                    ? 'bg-[#43bb8c] text-white rounded-br-md'
                                                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                            }`}
                                        >
                                            <div 
                                                className="text-sm leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: message.content }}
                                            />
                                            <span className={`text-xs mt-2 block ${
                                                message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                                            }`}>
                                                {message.timestamp.toLocaleTimeString('fr-FR', { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </span>
                                        </div>
                                        
                                        {/* Bouton TTS Natif du navigateur */}
                                        <div className={`absolute -top-2 ${message.type === 'user' ? '-left-12' : '-right-12'} 
                                            opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                                            <button
                                                onClick={() => handleNativeTTS(message.content, message.id)}
                                                disabled={isSpeaking === message.id}
                                                className="bg-white shadow-lg rounded-full p-2 border border-gray-200
                                                    hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Écouter avec la voix du navigateur (gratuit et rapide)"
                                            >
                                                {isSpeaking === message.id ? (
                                                    <div className="w-4 h-4 animate-pulse">
                                                        <span className="text-orange-600 text-sm">🟠</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-orange-600 text-sm">🟠</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </CardContent>
                </Card>

                {/* Input Area */}
                <Card className="bg-transparent shadow-none border-0">
                    <CardFooter className="p-0 bg-transparent border-0">
                        <form onSubmit={handleSubmit} className="w-full">
                            <div className="flex gap-2 items-end bg-gray-50 rounded-3xl p-2 border-2 border-gray-200 focus-within:border-[#43bb8c] transition-colors">
                                <textarea
                                    ref={textareaRef}
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Tapez votre message ici..."
                                    className="flex-1 min-h-[44px] bg-transparent border-none focus:ring-0 focus:outline-none text-gray-800 resize-none"
                                />
                                <Button
                                    type="submit"
                                    disabled={!inputMessage.trim()}
                                    className="bg-[#43bb8c] hover:bg-[#3aa078] disabled:bg-gray-400 text-white px-4 py-2 h-[44px] rounded-full transition-colors"
                                >
                                    ⬆️
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-[#43bb8c] text-[#43bb8c] hover:bg-[#43bb8c] hover:text-white transition-colors px-4 py-2 h-[44px] rounded-full"
                                    onClick={handleMicClick}
                                    disabled={isTranscribing}
                                >
                                    {isRecording ? '⏹️' : '🎤'}
                                </Button>
                            </div>
                        </form>

                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

