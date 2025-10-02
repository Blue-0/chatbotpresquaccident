import React, { useRef, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isRecording: boolean;
  onMicClick: () => void;
  micRef: React.RefObject<HTMLButtonElement | null>;
}

const MIN_HEIGHT = 44;
const MAX_HEIGHT = 120;

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  isRecording,
  onMicClick,
  micRef,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = `${MIN_HEIGHT}px`;
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, MAX_HEIGHT)}px`;
    }
  }, [value]);

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex gap-2 items-end bg-gray-50 rounded-3xl p-2 border-2 border-gray-200 focus-within:border-[#43bb8c] transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tapez votre message ici..."
          className="flex-1 min-h-[44px] bg-transparent border-none focus:ring-0 focus:outline-none text-gray-800 resize-none"
        />
        <Button
          type="submit"
          disabled={!value.trim()}
          className="bg-[#43bb8c] hover:bg-[#3aa078] disabled:bg-gray-400 text-white px-4 py-2 h-[44px] rounded-full transition-colors"
        >
          ⬆️
        </Button>
        <Button
          ref={micRef}
          type="button"
          variant="outline"
          className="border-[#43bb8c] text-[#43bb8c] hover:bg-[#43bb8c] hover:text-white transition-colors px-4 py-2 h-[44px] rounded-full"
          onClick={onMicClick}
        >
          {isRecording ? '⏹️' : '🎤'}
        </Button>
      </div>
    </form>
  );
};
