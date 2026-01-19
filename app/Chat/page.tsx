'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { AIChatInput } from "@/components/ui/ai-chat-input"
import { useRouter } from 'next/navigation';
import {
    animateHeader,
    animateNewMessage,
    createMicPulse,
    resetScale,
} from '@/src/lib/animations';
import { Card, CardContent } from '@/src/components/ui/card';
import { useSessionId } from '@/app/hooks/useSessionId';
import { useAudioRecording } from '@/app/hooks/useAudioRecording';
import { useTextToSpeech } from '@/app/hooks/useTextToSpeech';
import { ParticlesBackground } from '@/app/components/ParticlesBackground';
import { ChatHeader } from '@/app/components/ChatHeader';
import { ChatMessage } from '@/app/components/ChatMessage';
import { LoadingScreen } from '@/app/components/LoadingScreen';
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
    const { isRecording, startRecording, stopRecording } = useAudioRecording();
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
        // Utiliser l'URL de base pour éviter les problèmes de redirection
        const baseUrl = window.location.origin;
        await signOut({ callbackUrl: `${baseUrl}/Login`, redirect: true });
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
            <div className="relative z-10 flex-1 flex flex-col max-w-4xl mx-auto w-full p-3">
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

                {/* Input Area - Barre unifiée */}
                <Card className="bg-transparent py-0 shadow-none border-0">
                    <AIChatInput
                        value={inputMessage}
                        onChange={setInputMessage}
                        onSubmit={handleSubmit}
                        onMicClick={handleMicClick}
                        isRecording={isRecording}
                    />
                </Card>
            </div>
        </div>
    );
}
