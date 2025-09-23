import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        console.log('📤 Envoi vers n8n:', body);
        
        // Appel vers votre webhook n8n depuis le serveur Next.js
        const response = await fetch('https://n8n.e2i-ia.fr/webhook/chatbot', {
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
            data = await response.json();
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
