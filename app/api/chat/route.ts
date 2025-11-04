import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { validateOrigin } from '@/src/lib/csrf-protection';

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

        console.log('📤 Envoi vers n8n:', body);

        // Appel vers votre webhook n8n depuis le serveur Next.js
        // Utiliser la variable d'environnement ou fallback
        const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.e2i-ia.fr/webhook/chatbot';
        console.log('🔗 Webhook URL:', webhookUrl);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
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
                console.log('📝 Réponse brute de n8n:', textData.substring(0, 200)); // Premiers 200 chars

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
                // Si le parsing échoue, utiliser un message par défaut
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
