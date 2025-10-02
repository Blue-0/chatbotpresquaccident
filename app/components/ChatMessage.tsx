import React from 'react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  isSpeaking: boolean;
  onSpeak: (content: string, id: string) => void;
  messageRef?: React.RefObject<HTMLDivElement | null>;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLast,
  isSpeaking,
  onSpeak,
  messageRef,
}) => {
  const isUser = message.type === 'user';

  return (
    <div
      ref={isLast ? messageRef : undefined}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className="relative group max-w-[80%]">
        <div
          className={`p-4 rounded-2xl ${
            isUser
              ? 'bg-[#43bb8c] text-white rounded-br-md'
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
          }`}
        >
          <div
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: message.content }}
          />
          <span
            className={`text-xs mt-2 block ${
              isUser ? 'text-green-100' : 'text-gray-500'
            }`}
          >
            {message.timestamp.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div
          className={`absolute -top-2 ${
            isUser ? '-left-12' : '-right-12'
          } opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
        >
          <button
            onClick={() => onSpeak(message.content, message.id)}
            disabled={isSpeaking}
            className="bg-white shadow-lg rounded-full p-2 border border-gray-200
              hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Écouter avec la voix du navigateur"
          >
            {isSpeaking ? (
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
  );
};
