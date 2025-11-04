import { marked } from 'marked';
import DOMPurify from 'dompurify';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface SendMessageParams {
  message: string;
  sessionId: string;
}

const transformContent = (content: string): string => {
  return content.replace(
    /<em>(.*?)<\/em>/g,
    '<span style="font-weight: bold; color: #F28C06;">$1</span>'
  );
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param content - Raw HTML content
 * @returns Sanitized HTML safe for rendering
 */
const sanitizeHTML = (content: string): string => {
  if (typeof window === 'undefined') {
    // Server-side: return as-is (will be sanitized client-side)
    return content;
  }

  // Client-side: sanitize with DOMPurify
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'span', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'a', 'code', 'pre'],
    ALLOWED_ATTR: ['style', 'href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
};

const createAIMessages = (parsedContent: string): Message[] => {
  const messageParts = parsedContent.split('<hr>');

  return messageParts
    .filter((part) => part.trim())
    .map((part, index) => ({
      id: (Date.now() + index + 1).toString(),
      type: 'ai' as const,
      content: part.trim(),
      timestamp: new Date(),
    }));
};

export const sendMessage = async ({
  message,
  sessionId,
}: SendMessageParams): Promise<Message[]> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // ✅ Inclure les cookies de session pour l'authentification JWT
    body: JSON.stringify({
      message,
      sessionId,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  const data = await response.json();
  const parsedContent =
    (await marked.parse(data.response)) || 'Réponse reçue du webhook';
  const transformedContent = transformContent(parsedContent);
  const sanitizedContent = sanitizeHTML(transformedContent);

  return createAIMessages(sanitizedContent);
};

export const createUserMessage = (content: string): Message => ({
  id: Date.now().toString(),
  type: 'user',
  content,
  timestamp: new Date(),
});

export const createErrorMessage = (): Message => ({
  id: (Date.now() + 1).toString(),
  type: 'ai',
  content: 'Désolé, une erreur est survenue lors du traitement de votre demande.',
  timestamp: new Date(),
});

export const INITIAL_MESSAGE: Message = {
  id: '1',
  type: 'ai',
  content:
    "Bonjour ! Je suis votre assistant E2I AgentSecu. Comment puis-je vous aider aujourd'hui ?",
  timestamp: new Date(),
};
