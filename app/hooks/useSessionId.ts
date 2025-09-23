import { useState, useEffect } from 'react';

export const useSessionId = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Générer ou récupérer l'ID de session côté client uniquement
    let id = localStorage.getItem('sessionId');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('sessionId', id);
    }
    setSessionId(id);
  }, []);

  return { sessionId: mounted ? sessionId : '', isLoaded: mounted };
};
