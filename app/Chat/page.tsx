'use client';
import React, { useState, useRef, useEffect } from "react";
import Particles from "@/src/components/Particles";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/src/components/ui/card";
import {Input} from "@/src/components/ui/input";
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
    const { sessionId } = useSessionId();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'ai',
            content: 'Bonjour ! Je suis votre assistant E2I AgentSecu. Comment puis-je vous aider aujourd\'hui ?',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [loadingTTS, setLoadingTTS] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);

    // Auto-scroll vers le bas à chaque nouveau message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fonction pour gérer le TTS avec ElevenLabs
    const handleTTS = async (messageContent: string, messageId: string) => {
        setLoadingTTS(messageId);
        
        try {
            const startTime = Date.now();
            
            console.log('🔊 Demande TTS ElevenLabs pour message ID:', messageId);
            console.log('Contenu:', messageContent.substring(0, 100) + (messageContent.length > 100 ? "..." : ""));
            
            // Timeout côté client généreux pour ElevenLabs (peut être lent)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes pour ElevenLabs
            
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: messageContent // ElevenLabs gère le nettoyage côté serveur
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const processingTime = Date.now() - startTime;

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                
                if (contentType && (contentType.includes('audio/') || contentType.includes('audio/mpeg'))) {
                    const audioBlob = await response.blob();
                    
                    if (audioBlob.size === 0) {
                        console.error('❌ Audio blob vide reçu d\'ElevenLabs');
                        return;
                    }
                    
                    // Informations détaillées sur la génération ElevenLabs
                    const serverProcessingTime = response.headers.get('X-Processing-Time');
                    const messageLength = response.headers.get('X-Message-Length');
                    const voiceProvider = response.headers.get('X-Voice-Provider');
                    const voiceId = response.headers.get('X-Voice-ID');
                    
                    console.log(`🎵 Audio ElevenLabs reçu: ${audioBlob.size} bytes`);
                    console.log(`⏱️ Traité en: ${serverProcessingTime}ms pour ${messageLength} caractères`);
                    console.log(`🎤 Voix: ${voiceId} (${voiceProvider})`);
                    
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    
                    // ElevenLabs génère du MP3, qui est généralement compatible
                    audio.play().catch(error => {
                        console.error('❌ Erreur lors de la lecture audio ElevenLabs:', error);
                    });
                    
                    // Nettoyer l'URL après la lecture
                    audio.addEventListener('ended', () => {
                        URL.revokeObjectURL(audioUrl);
                        console.log('🗑️ Ressources audio nettoyées');
                    });
                    
                    // Nettoyer en cas d'erreur aussi
                    audio.addEventListener('error', (e) => {
                        URL.revokeObjectURL(audioUrl);
                        console.error('❌ Erreur de lecture audio:', e);
                    });
                } else {
                    // Si ce n'est pas de l'audio, c'est une erreur JSON d'ElevenLabs
                    const errorData = await response.json();
                    console.error('❌ Erreur ElevenLabs:', errorData);
                    
                    // Messages d'erreur spécifiques à ElevenLabs
                    if (errorData.error?.includes('quota')) {
                        console.error('💳 Quota ElevenLabs dépassé - vérifiez votre plan');
                    } else if (errorData.error?.includes('voice')) {
                        console.error('🎤 ID de voix ElevenLabs invalide');
                    } else if (errorData.error?.includes('unauthorized')) {
                        console.error('🔑 Clé API ElevenLabs invalide');
                    } else {
                        console.error('🔊 Erreur de synthèse vocale ElevenLabs:', errorData.error);
                    }
                }
            } else {
                const errorData = await response.json().catch(() => ({ 
                    error: 'Erreur inconnue',
                    details: `Status: ${response.status}`
                }));
                
                console.error('❌ Erreur lors de la génération ElevenLabs:', errorData.error);
                
                // Messages d'erreur spécifiques selon le statut HTTP
                if (response.status === 429) {
                    console.error('💳 Quota ElevenLabs dépassé');
                    if (errorData.messageLength) {
                        console.error(`📝 Longueur du message: ${errorData.messageLength} caractères`);
                    }
                } else if (response.status === 401) {
                    console.error('🔑 Authentification ElevenLabs échouée - vérifiez votre clé API');
                } else if (response.status === 400) {
                    console.error('📝 Requête invalide pour ElevenLabs');
                } else if (response.status >= 500) {
                    console.error('🔧 Problème du serveur ElevenLabs');
                } else {
                    console.error('❌ Erreur ElevenLabs:', errorData.error);
                }
                
                // Log du temps de traitement si disponible
                if (errorData.processingTime) {
                    console.error(`⏱️ Temps écoulé: ${errorData.processingTime}ms`);
                }
            }
        } catch (error) {
            console.error('❌ Erreur TTS ElevenLabs complète:', error);
            
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    console.error('⏰ TTS ElevenLabs annulé - Délai d\'attente dépassé côté client');
                } else {
                    console.error('🔊 Erreur TTS ElevenLabs:', error.message);
                }
            }
        } finally {
            setLoadingTTS(null);
        }
    };

    // Fonction pour démarrer l'enregistrement vocal
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                await transcribeAudio(audioBlob);
                
                // Arrêter le stream
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            console.log('Enregistrement démarré...');
            
        } catch (error) {
            console.error('Erreur lors du démarrage de l\'enregistrement:', error);
            alert('Erreur : Impossible d\'accéder au microphone. Vérifiez les permissions.');
        }
    };

    // Fonction pour arrêter l'enregistrement
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            console.log('Enregistrement arrêté...');
        }
    };

    // Fonction pour transcription avec Voxtral
    const transcribeAudio = async (audioBlob: Blob) => {
        setIsTranscribing(true);
        
        try {
            console.log("=== DEBUG CLIENT TRANSCRIPTION ===");
            console.log("Taille audio blob:", audioBlob.size, "bytes");
            console.log("Type audio blob:", audioBlob.type);
            
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');

            console.log('Envoi vers Voxtral pour transcription...');
            
            const response = await fetch('/api/voxtral', {
                method: 'POST',
                body: formData
            });

            console.log('Réponse API:', response.status, response.statusText);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Transcription reçue:', result);
                
                if (result.text && result.text.trim()) {
                    // Ajouter le texte transcrit à l'input
                    setInputMessage(prev => prev + (prev ? ' ' : '') + result.text);
                    console.log('Texte ajouté à l\'input:', result.text);
                } else {
                    console.error('Texte de transcription vide');
                    alert('La transcription n\'a pas donné de résultat textuel');
                }
                
            } else {
                const errorData = await response.json().catch(async () => {
                    const text = await response.text();
                    return { error: 'Erreur de parsing JSON', details: text };
                });
                console.error('Erreur détaillée de transcription:', errorData);
                alert(`Erreur de transcription: ${errorData.error} - ${errorData.details || ''}`);
            }
        } catch (error) {
            console.error('Erreur transcription complète:', error);
            console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
            alert(`Erreur lors de la transcription: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        } finally {
            setIsTranscribing(false);
        }
    };

    // Fonction pour gérer le clic sur le bouton microphone
    const handleMicClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // Fonction pour gérer le TTS natif du navigateur
    const handleNativeTTS = async (messageContent: string, messageId: string) => {
        try {
            // Vérifier si le navigateur supporte la synthèse vocale
            if (!('speechSynthesis' in window)) {
                alert('Votre navigateur ne supporte pas la synthèse vocale');
                return;
            }

            // Arrêter toute synthèse en cours
            speechSynthesis.cancel();

            // Nettoyer le contenu HTML pour ne garder que le texte
            const textContent = messageContent
                .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
                .replace(/&nbsp;/g, ' ') // Remplacer les espaces insécables
                .replace(/&amp;/g, '&') // Décoder les entités HTML
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
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
            utterance.rate = 0.9; // Vitesse légèrement ralentie pour une meilleure compréhension
            utterance.pitch = 1.0; // Ton normal
            utterance.volume = 1.0; // Volume maximal

            // Gestionnaires d'événements
            utterance.onstart = () => {
                console.log('🟠 Synthèse vocale native démarrée');
                setLoadingTTS(messageId); // Réutiliser l'état de loading
            };

            utterance.onend = () => {
                console.log('🟠 Synthèse vocale native terminée');
                setLoadingTTS(null);
            };

            utterance.onerror = (event) => {
                console.error('❌ Erreur synthèse vocale native:', event.error);
                setLoadingTTS(null);
            };

            // Démarrer la synthèse
            speechSynthesis.speak(utterance);

        } catch (error) {
            console.error('❌ Erreur TTS natif:', error);
            setLoadingTTS(null);
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
        const currentMessage = inputMessage; // Stocker le message avant de vider l'input
        setInputMessage('');

        // Appel à l'API locale qui fera le proxy vers n8n
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
                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'ai',
                    content: await marked.parse(data.response) || 'Réponse reçue du webhook',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMessage]);
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
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-2xl font-bold text-gray-800">E2I AgentSecu</CardTitle>
                                <CardDescription className="text-gray-600">
                                    Assistant IA pour vos questions de sécurité
                                </CardDescription>
                            </div>
                            <SessionId />
                        </div>
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
                                        
                                        {/* Boutons TTS */}
                                        <div className={`absolute -top-2 ${message.type === 'user' ? '-left-16' : '-right-16'} 
                                            opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                            flex gap-1`}>
                                            
                                            {/* Bouton TTS ElevenLabs */}
                                            <button
                                                onClick={() => handleTTS(message.content, message.id)}
                                                disabled={loadingTTS === message.id}
                                                className="bg-white shadow-lg rounded-full p-2 border border-gray-200
                                                    hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Écouter avec ElevenLabs (haute qualité)"
                                            >
                                                {loadingTTS === message.id ? (
                                                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#43bb8c]"></div>
                                                ) : (
                                                    <span className="text-gray-600 text-sm">🔊</span>
                                                )}
                                            </button>
                                            
                                            {/* Bouton TTS Natif du navigateur */}
                                            <button
                                                onClick={() => handleNativeTTS(message.content, message.id)}
                                                disabled={loadingTTS === message.id}
                                                className="bg-white shadow-lg rounded-full p-2 border border-gray-200
                                                    hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Écouter avec la voix du téléphone/navigateur (gratuit et rapide)"
                                            >
                                                <span className="text-orange-600 text-sm">🟠</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} /> {/* Référence pour le défilement automatique */}
                        </div>
                    </CardContent>
                </Card>

                {/* Input Area */}
                <Card className="bg-white/95 shadow-lg border border-gray-200">
                    <CardFooter className="p-4">
                        <form onSubmit={handleSubmit} className="w-full">
                            <div className="flex gap-2 items-end bg-gray-50 rounded-3xl p-2 border-2 border-gray-200 focus-within:border-[#43bb8c] transition-colors">
                                <Input
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Tapez votre message ici..."
                                    className="flex-1 min-h-[44px] bg-transparent border-none focus:ring-0 focus:outline-none text-gray-800"
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