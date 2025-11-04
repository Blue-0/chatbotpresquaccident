'use client';

import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { ChatHeader } from '@/app/components/ChatHeader';
import { ChatMessage } from '@/app/components/ChatMessage';
import { ChatInput } from '@/app/components/ChatInput';
import { AnimatedVoicewave } from '@/app/components/AnimatedVoicewave';
import { LoadingScreen } from '@/app/components/LoadingScreen';

type DemoMessage = {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
};

const INITIAL_MESSAGES: DemoMessage[] = [
  {
    id: 'ai-1',
    type: 'ai',
    content: 'Bonjour !<br/>Comment puis-je vous aider aujourd\'hui ?',
    timestamp: new Date('2024-01-01T09:00:00Z'),
  },
  {
    id: 'user-1',
    type: 'user',
    content: 'Peux-tu me rappeler les consignes incendie ?',
    timestamp: new Date('2024-01-01T09:02:00Z'),
  },
];

type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

function Section({ title, description, children }: SectionProps) {
  return (
    <Card className="border border-gray-200 bg-white/95 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-gray-600">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export default function StyleguidePage() {
  const headerRef = useRef<HTMLDivElement>(null);
  const micRef = useRef<HTMLButtonElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<DemoMessage[]>(() => [
    ...INITIAL_MESSAGES,
  ]);
  const [draft, setDraft] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;

    const formatted = draft.trim().replace(/\n/g, '<br/>');

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        type: 'user',
        content: formatted,
        timestamp: new Date(),
      },
    ]);
    setDraft('');
  };

  const handleSpeak = (_content: string, id: string) => {
    setSpeakingId(id);
    window.setTimeout(() => setSpeakingId(null), 1200);
  };

  const toggleRecording = () => {
    setIsRecording((prev) => !prev);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold text-gray-900">Styleguide</h1>
          <p className="text-gray-600">
            Apercu interactif des composants du chat. Modifie-les ici avant de
            toucher aux pages prod.
          </p>
        </header>

        <Section
          title="ChatHeader"
          description="Barre de tete avec session et bouton de sortie."
        >
          <ChatHeader
            userEmail="demo.user@entreprise.fr"
            onSignOut={() => window.alert('Sign out (mock)')}
            headerRef={headerRef}
          />
        </Section>

        <Section
          title="ChatMessage"
          description="Visualisation des bulles utilisateur et IA, boutons de synthese vocale."
        >
          <div className="space-y-3">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLast={index === messages.length - 1}
                isSpeaking={speakingId === message.id}
                onSpeak={handleSpeak}
                messageRef={
                  index === messages.length - 1 ? lastMessageRef : undefined
                }
              />
            ))}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                handleSpeak(
                  messages[messages.length - 1]?.content ?? '',
                  messages[messages.length - 1]?.id ?? ''
                )
              }
            >
              Simuler la lecture du dernier message
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setMessages([
                  ...INITIAL_MESSAGES,
                  {
                    id: 'ai-variant',
                    type: 'ai',
                    content:
                      'Voici une reponse alternative avec une mise en forme <strong>HTML</strong>.',
                    timestamp: new Date(),
                  },
                ])
              }
            >
              Recharger les mocks
            </Button>
          </div>
        </Section>

        <Section
          title="ChatInput"
          description="Formulaire d\'envoi avec controle du micro."
        >
          <ChatInput
            value={draft}
            onChange={setDraft}
            onSubmit={handleSubmit}
            isRecording={isRecording}
            onMicClick={toggleRecording}
            micRef={micRef}
          />
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
            <p>
              Etat local&nbsp;: message courant ={' '}
              <code className="font-mono text-xs text-gray-800">
                {draft || '""'}
              </code>
            </p>
            <p>
              Micro en cours =&nbsp;
              <strong>{isRecording ? 'oui' : 'non'}</strong>
            </p>
          </div>
        </Section>

        <Section
          title="AnimatedVoicewave"
          description="Animation affichee pendant un enregistrement audio."
        >
          <div className="flex flex-wrap items-center gap-4">
            <Button type="button" variant="outline" onClick={toggleRecording}>
              {isRecording
                ? 'Arreter la simulation micro'
                : 'Demarrer la simulation micro'}
            </Button>
            <AnimatedVoicewave
              isRecording={isRecording}
              audioStream={null}
              onStop={() => setIsRecording(false)}
              width={360}
              height={60}
              barCount={48}
              barGap={3}
              barRadius={3}
              barMinHeight={6}
              sensitivity={2}
            />
          </div>
        </Section>

        <Section
          title="LoadingScreen"
          description="Ecran plein affichant le fond particules + message."
        >
          <div className="relative h-[420px] overflow-hidden rounded-xl border border-gray-200">
            <LoadingScreen message="Chargement de la session demo..." />
          </div>
        </Section>
      </div>
    </main>
  );
}
