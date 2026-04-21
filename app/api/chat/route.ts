import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { validateOrigin } from '@/src/lib/csrf-protection';

// ─── Round-robin webhook pool ────────────────────────────────────────────────
// Ce Map mémorise quel webhook est assigné à chaque sessionId.
// Le compteur global garantit une distribution strictement 1→2→3→1→...
const sessionWebhookMap = new Map<string, number>();
let webhookCounter = 0;

function getWebhookUrls(): string[] {
    const urls = [
        process.env.N8N_WEBHOOK_URL_1,
        process.env.N8N_WEBHOOK_URL_2,
        process.env.N8N_WEBHOOK_URL_3,
    ];

    const missing = urls
        .map((url, i) => (!url ? `N8N_WEBHOOK_URL_${i + 1}` : null))
        .filter(Boolean);

    if (missing.length > 0) {
        throw new Error(
            `Variables d'environnement manquantes : ${missing.join(', ')}`
        );
    }

    return urls as string[];
}

function resolveWebhookForSession(sessionId: string): string {
    const webhookUrls = getWebhookUrls();

    if (!sessionWebhookMap.has(sessionId)) {
        // Nouvelle session : assigner le prochain webhook en round-robin
        const index = webhookCounter % webhookUrls.length;
        sessionWebhookMap.set(sessionId, index);
        webhookCounter++;
        console.log(
            `🔄 Session "${sessionId}" → webhook #${index + 1} (round-robin)`
        );
    }

    const index = sessionWebhookMap.get(sessionId)!;
    return webhookUrls[index];
}
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        // ✅ Protection CSRF - Valider l'origine
        const csrfError = validateOrigin(request);
        if (csrfError) {
            return csrfError;
        }

        // ✅ Vérifier l'authentification
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        });

        if (!token) {
            return NextResponse.json(
                { error: 'Non autorisé - Authentification requise' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Injecter le nom de l'utilisateur dans le payload
        const payload = {
            ...body,
            userName: token.name || 'Utilisateur'
        };

        console.log('📤 Envoi vers n8n:', payload);

        // Résoudre le webhook pour cette session (round-robin, persisté par sessionId)
        const sessionId: string = body.sessionId || token.sub || 'default';
        const webhookUrl = resolveWebhookForSession(sessionId);
        console.log('🔗 Webhook URL sélectionné:', webhookUrl);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        console.log('🔍 Status de la réponse n8n:', response.status);
        console.log('🔍 Headers de la réponse:', response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Erreur webhook n8n: ${response.status} - ${errorText}`);

            return NextResponse.json(
                {
                    error: `Erreur webhook n8n: ${response.status}`,
                    response: 'Désolé, je ne peux pas traiter votre demande pour le moment.'
                },
                { status: 500 }
            );
        }

        // Vérifier si la réponse contient du JSON valide
        const contentType = response.headers.get('content-type');
        console.log('🔍 Content-Type:', contentType);

        let data;
        if (contentType?.includes('application/json')) {
            try {
                // Lire le texte brut d'abord pour debug
                const textData = await response.text();
                console.log('📝 Réponse brute de n8n:', textData.substring(0, 200));

                // Si le texte est vide, retourner un message par défaut
                if (!textData || textData.trim() === '') {
                    console.warn('⚠️ Réponse JSON vide de n8n');
                    data = { response: 'Réponse reçue (vide)' };
                } else {
                    // Essayer de parser le JSON
                    data = JSON.parse(textData);
                }
            } catch (parseError) {
                console.error('❌ Erreur parsing JSON:', parseError);
                data = { response: 'Erreur de traitement de la réponse' };
            }
        } else {
            const textData = await response.text();
            console.log('📝 Réponse texte de n8n:', textData);
            data = { response: textData };
        }

        console.log('✅ Réponse de n8n:', data);

        return NextResponse.json(data);

    } catch (error) {
        console.error('💥 Erreur API chat:', error);

        // Si c'est une erreur de fetch (réseau, timeout, etc.)
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return NextResponse.json(
                {
                    error: 'Erreur de connexion au webhook',
                    response: 'Problème de connexion avec le serveur. Veuillez réessayer.'
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                error: 'Erreur interne du serveur',
                response: 'Une erreur inattendue s\'est produite.'
            },
            { status: 500 }
        );
    }
}
