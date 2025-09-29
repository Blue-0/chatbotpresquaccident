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
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState<string | null>(null);

    // Auto-scroll vers le bas à chaque nouveau message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
    const handleNativeTTS = (messageContent: string, messageId: string) => {
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
                const parsedContent = await marked.parse(data.response) || 'Réponse reçue du webhook';
                
                // Diviser le message si il contient la séquence "\n\n---\n"
                const messageParts = parsedContent.split('\n\n---\n');
                
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
                                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">E2I AgentSecu</CardTitle>                                <CardDescription className="text-gray-600 max-sm:hidden">
                                    Assistant IA pour vos questions de sécurité
                                </CardDescription>
                            </div>
                            <SessionId />
                        </div>
                        <CardContent className="text-gray-600 text-sm sm:hidden block p-0">
                            Assistant IA pour vos questions de sécurité
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