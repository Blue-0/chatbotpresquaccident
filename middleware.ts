import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes qui nécessitent une authentification
const protectedRoutes = ['/Chat'];

// Routes publiques (pas besoin d'authentification)
const publicRoutes = ['/', '/Login'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ✅ Laisser passer les routes d'authentification NextAuth
    if (pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // ✅ Laisser passer les fichiers statiques
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // ✅ Vérifier si la route est protégée
    const isProtectedRoute = protectedRoutes.some(route => 
        pathname.startsWith(route)
    );

    // Si ce n'est pas une route protégée, laisser passer
    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    // ✅ Vérifier l'authentification avec le token JWT
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    // Si pas de token sur une route protégée, rediriger vers login
    if (!token) {
        console.log(`[MIDDLEWARE] Accès non autorisé à ${pathname} - Redirection vers /Login`);
        const loginUrl = new URL('/Login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // ✅ Utilisateur authentifié, laisser passer
    console.log(`[MIDDLEWARE] Accès autorisé à ${pathname} - User: ${token.email}`);
    return NextResponse.next();
}

// ✅ Configuration : sur quelles routes le middleware s'applique
export const config = {
    matcher: [
        /*
         * Match toutes les routes sauf :
         * - api/auth/* (NextAuth)
         * - _next/static (fichiers statiques)
         * - _next/image (optimisation images)
         * - favicon.ico
         * - fichiers avec extension (images, etc.)
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
};