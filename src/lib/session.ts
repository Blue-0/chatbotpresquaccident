// Hook pour gérer la session côté client uniquement
export function useSessionId(): string | null {
  if (typeof window === 'undefined') {
    return null; // Côté serveur, toujours null
  }
  
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

// Version synchrone (à éviter dans les composants)
export function getSessionId(): string {
  if (typeof window !== 'undefined') {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }
  
  return generateSessionId();
}

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function resetSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sessionId');
  }
}