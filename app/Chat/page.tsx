'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    animateHeader,
    animateNewMessage,
    createMicPulse,
    resetScale,
} from '@/src/lib/animations';
import { Card, CardContent, CardFooter } from '@/src/components/ui/card';
import { useSessionId } from '@/app/hooks/useSessionId';
import { useAudioRecording } from '@/app/hooks/useAudioRecording';
import { useTextToSpeech } from '@/app/hooks/useTextToSpeech';
import { ParticlesBackground } from '@/app/components/ParticlesBackground';
import { ChatHeader } from '@/app/components/ChatHeader';
import { ChatMessage } from '@/app/components/ChatMessage';
import { ChatInput } from '@/app/components/ChatInput';
import { LoadingScreen } from '@/app/components/LoadingScreen';
import { AnimatedVoicewave } from '@/app/components/AnimatedVoicewave';
import { transcribeAudio } from '@/app/services/transcriptionService';
import {
    type Message,
    sendMessage,
    createUserMessage,
    createErrorMessage,
    INITIAL_MESSAGE,
} from '@/app/services/chatService';

export default function ChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { sessionId } = useSessionId();

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const micRef = useRef<HTMLButtonElement>(null);
    const micPulseRef = useRef<{ play?: () => void; pause?: () => void } | null>(
        null
    );

    // State
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [inputMessage, setInputMessage] = useState('');

    // Hooks
    const { isRecording, audioStream, startRecording, stopRecording } = useAudioRecording();
    const { isSpeaking, speak } = useTextToSpeech();

    // Authentication
    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/Login');
        }
    }, [session, status, router]);

    // Auto-scroll and animate new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        if (lastMessageRef.current) {
            requestAnimationFrame(() => {
                animateNewMessage(lastMessageRef.current!);
            });
        }
    }, [messages]);

    // Header animation
    useEffect(() => {
        if (headerRef.current) {
            animateHeader(headerRef.current);
        }
    }, []);

    // Microphone animation
    useEffect(() => {
        const el = micRef.current;
        if (!el) return;

        if (isRecording) {
            if (!micPulseRef.current) {
                micPulseRef.current = createMicPulse(el);
            }
            try {
                micPulseRef.current.play?.();
            } catch { }
        } else {
            try {
                micPulseRef.current?.pause?.();
            } catch { }
            resetScale(el);
        }
    }, [isRecording]);

    // Handlers
    const handleStopRecording = useCallback(async () => {
        setInputMessage('[Transcription en cours...]');
        const audioBlob = await stopRecording();

        if (audioBlob) {
            const transcription = await transcribeAudio(audioBlob);
            setInputMessage(transcription);
        } else {
            setInputMessage('');
        }
    }, [stopRecording]);

    const handleMicClick = useCallback(async () => {
        if (isRecording) {
            await handleStopRecording();
        } else {
            startRecording();
        }
    }, [isRecording, startRecording, handleStopRecording]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!inputMessage.trim()) return;

            const userMessage = createUserMessage(inputMessage);
            setMessages((prev) => [...prev, userMessage]);

            const currentMessage = inputMessage;
            setInputMessage('');

            try {
                const aiMessages = await sendMessage({
                    message: currentMessage,
                    sessionId,
                });
                setMessages((prev) => [...prev, ...aiMessages]);
            } catch (error) {
                console.error('Failed to send message:', error);
                const errorMessage = createErrorMessage();
                setMessages((prev) => [...prev, errorMessage]);
            }
        },
        [inputMessage, sessionId]
    );

    const handleSignOut = useCallback(async () => {
        await signOut({ callbackUrl: '/Login' });
    }, []);

    // Loading state
    if (status === 'loading') {
        return <LoadingScreen message="Vérification de votre session..." />;
    }

    // No session
    if (!session) {
        return null;
    }

    return (
        <div className="relative min-h-screen flex flex-col">
            {/* Particles Background */}
            <ParticlesBackground />

            {/* Main Chat Container */}
            <div className="relative z-10 flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
                <ChatHeader
                    userEmail={session.user?.email}
                    onSignOut={handleSignOut}
                    headerRef={headerRef}
                />

                {/* Messages Area */}
                <Card className="flex-1 mb-2 bg-white/95 shadow-lg border border-gray-200 flex flex-col">
                    <CardContent className="flex-1 p-6 overflow-y-auto max-h-[60vh]">
                        <div className="space-y-4">
                            {messages.map((message, idx) => (
                                <ChatMessage
                                    key={message.id}
                                    message={message}
                                    isLast={idx === messages.length - 1}
                                    isSpeaking={isSpeaking === message.id}
                                    onSpeak={speak}
                                    messageRef={
                                        idx === messages.length - 1 ? lastMessageRef : undefined
                                    }
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </CardContent>
                </Card>

                {/* Input Area */}
                <Card className="bg-transparent shadow-none border-0">
                    <CardFooter className="p-0 bg-transparent border-0">
                        <div className="w-full relative">
                            {/* Voicewave Overlay - Remplace l'input pendant l'enregistrement */}
                            {isRecording && (
                                <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/95 rounded-lg border border-gray-200 p-4">
                                    <AnimatedVoicewave
                                        isRecording={isRecording}
                                        audioStream={audioStream}
                                        onStop={handleStopRecording}
                                        width={320}
                                        height={70}
                                        barColor="#43bb8c"
                                        barCount={45}
                                        barGap={2}
                                        barRadius={3}
                                        style="rounded"
                                        barMinHeight={2}
                                        barMaxHeight={0.9}
                                        sensitivity={2}
                                        
                                    />
                                </div>
                            )}

                            {/* Input - Visible uniquement quand pas d'enregistrement */}
                            {!isRecording && (
                                <ChatInput
                                    value={inputMessage}
                                    onChange={setInputMessage}
                                    onSubmit={handleSubmit}
                                    isRecording={isRecording}
                                    onMicClick={handleMicClick}
                                    micRef={micRef}
                                />
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
