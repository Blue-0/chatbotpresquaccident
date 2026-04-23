import { NextRequest, NextResponse } from "next/server";
import { getToken } from 'next-auth/jwt';
import { validateOrigin } from '@/src/lib/csrf-protection';

// Voix Mistral configurée
const DEFAULT_VOICE_ID = '5a271406-039d-46fe-835b-fbbb00eaf08d';

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

        // ✅ Valider la clé API Mistral
        const apiKey = process.env.MISTRAL_API_KEY;
        if (!apiKey) {
            console.error('MISTRAL_API_KEY manquante');
            return NextResponse.json({
                error: "Service temporairement indisponible"
            }, { status: 503 });
        }

        // ✅ Lire le corps de la requête
        const body = await request.json();
        const { text, voice_id } = body as { text?: string; voice_id?: string };

        if (!text || text.trim().length === 0) {
            return NextResponse.json({
                error: "Le texte est requis"
            }, { status: 400 });
        }

        // Limiter la taille du texte (Mistral recommande < 4096 tokens)
        if (text.length > 4096) {
            return NextResponse.json({
                error: "Texte trop long",
                details: "Maximum 4096 caractères"
            }, { status: 400 });
        }

        const baseUrl = process.env.VOXTRAL_BASE_URL || "https://api.mistral.ai";
        const endpoint = '/v1/audio/speech';

        console.log("=== TTS Mistral AI ===");
        console.log("Longueur du texte:", text.length, "caractères");
        console.log("Voice ID:", voice_id || DEFAULT_VOICE_ID);

        // ✅ Appel à l'API Mistral TTS selon la documentation officielle
        // Doc: https://docs.mistral.ai/api/endpoint/audio/speech
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: text.trim(),
                voice_id: voice_id || DEFAULT_VOICE_ID,
                response_format: 'mp3',
                stream: false,
            }),
        });

        console.log("Réponse Mistral TTS:", response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Erreur API Mistral TTS:", response.status, errorText);

            // Fallback en mode développement
            if (process.env.NODE_ENV === 'development') {
                return NextResponse.json({
                    error: "API Mistral TTS indisponible en développement",
                    details: errorText,
                    status: response.status
                }, { status: response.status });
            }

            return NextResponse.json({
                error: "Erreur lors de la synthèse vocale",
                details: errorText,
                status: response.status
            }, { status: response.status });
        }

        // ✅ Réponse Mistral : { "audio_data": "<base64 mp3>" }
        const result = await response.json() as { audio_data?: string };

        if (!result.audio_data) {
            console.error("Réponse Mistral TTS sans audio_data:", result);
            return NextResponse.json({
                error: "Aucune donnée audio reçue de Mistral"
            }, { status: 502 });
        }

        console.log("✅ TTS Mistral réussi, taille audio base64:", result.audio_data.length);

        // ✅ Retourner l'audio base64 et les métadonnées au client
        return NextResponse.json({
            audio_data: result.audio_data,  // base64 mp3
            format: 'mp3',
            voice_id: voice_id || DEFAULT_VOICE_ID,
        });

    } catch (error) {
        console.error('Erreur TTS:', error);
        return NextResponse.json({
            error: "Erreur lors de la synthèse vocale"
        }, { status: 500 });
    }
}
