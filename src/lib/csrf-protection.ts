/**
 * CSRF Protection utilities for API routes
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates the origin header to prevent CSRF attacks
 * Checks if the request comes from an allowed origin
 *
 * @param request - The incoming Next.js request
 * @returns NextResponse with error if invalid, null if valid
 */
export function validateOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // 🔍 DEBUG: Afficher les headers
  console.log('🔍 [CSRF] Origin:', origin);
  console.log('🔍 [CSRF] Referer:', referer);
  console.log('🔍 [CSRF] Host:', host);
  console.log('🔍 [CSRF] NODE_ENV:', process.env.NODE_ENV);
  console.log('🔍 [CSRF] NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

  // Get allowed origins from environment or use default
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const allowedOrigins = nextAuthUrl ? [nextAuthUrl] : [];

  // Toujours ajouter le domaine actuel (basé sur le header host)
  if (host) {
    allowedOrigins.push(
      `https://${host}`,
      `http://${host}`
    );
  }

  // Add localhost variants for development
  if (process.env.NODE_ENV === 'development') {
    // Détecter le port actuel depuis le header host
    const currentPort = host?.split(':')[1] || '3000';

    allowedOrigins.push(
      `http://localhost:${currentPort}`,
      `https://localhost:${currentPort}`,
      `http://127.0.0.1:${currentPort}`,
      `https://127.0.0.1:${currentPort}`,
      // Fallback pour le port par défaut
      'http://localhost:3000',
      'https://localhost:3000',
      'http://127.0.0.1:3000',
      'https://127.0.0.1:3000'
    );
  }

  console.log('🔍 [CSRF] Allowed origins:', allowedOrigins);

  // If origin is present, validate it
  if (origin) {
    const isAllowed = allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        const originUrl = new URL(origin);
        const match = allowedUrl.origin === originUrl.origin;
        console.log(`🔍 [CSRF] Comparing ${originUrl.origin} === ${allowedUrl.origin}: ${match}`);
        return match;
      } catch (error) {
        console.error('🔍 [CSRF] Error parsing URL:', error);
        return false;
      }
    });

    console.log('🔍 [CSRF] Origin validation result:', isAllowed);

    if (!isAllowed) {
      console.error('❌ [CSRF] Origin BLOCKED:', origin);
      return NextResponse.json(
        { error: 'Origine non autorisée - Requête bloquée' },
        { status: 403 }
      );
    }
  }

  // If no origin but referer is present, validate referer
  if (!origin && referer) {
    const isAllowed = allowedOrigins.some(allowed => {
      const match = referer.startsWith(allowed);
      console.log(`🔍 [CSRF] Referer check: ${referer}.startsWith(${allowed}): ${match}`);
      return match;
    });

    console.log('🔍 [CSRF] Referer validation result:', isAllowed);

    if (!isAllowed) {
      console.error('❌ [CSRF] Referer BLOCKED:', referer);
      return NextResponse.json(
        { error: 'Referer non autorisé - Requête bloquée' },
        { status: 403 }
      );
    }
  }

  // For same-origin requests, both origin and referer might be null
  // This is acceptable for same-site requests
  console.log('✅ [CSRF] Validation PASSED');
  return null;
}

/**
 * Middleware-style CSRF protection wrapper
 * Use this to wrap API route handlers
 *
 * @param handler - The API route handler function
 * @returns Wrapped handler with CSRF protection
 */
export function withCsrfProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Validate origin first
    const originError = validateOrigin(request);
    if (originError) {
      return originError;
    }

    // If validation passes, call the original handler
    return handler(request);
  };
}
