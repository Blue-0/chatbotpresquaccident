import { useState, useEffect } from 'react';

/**
 * Generates a cryptographically secure random session ID
 * Uses crypto.getRandomValues() instead of Math.random()
 * @returns A 32-character hexadecimal session ID
 */
const generateSecureSessionId = (): string => {
  // Generate 16 random bytes (128 bits)
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  // Convert to hexadecimal string
  return Array.from(array, byte =>
    byte.toString(16).padStart(2, '0')
  ).join('');
};

export const useSessionId = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Générer ou récupérer l'ID de session côté client uniquement
    let id = localStorage.getItem('sessionId');
    if (!id) {
      // ✅ Utiliser la génération cryptographiquement sécurisée
      id = generateSecureSessionId();
      localStorage.setItem('sessionId', id);
    }
    setSessionId(id);
  }, []);

  return { sessionId: mounted ? sessionId : '', isLoaded: mounted };
};
