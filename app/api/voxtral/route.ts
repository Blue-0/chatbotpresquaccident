import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        
        if (!audioFile) {
            return NextResponse.json({ error: "Fichier audio requis" }, { status: 400 });
        }

        console.log("=== DEBUG VOXTRAL (MISTRAL AI) ===");
        console.log("Taille du fichier audio:", audioFile.size, "bytes");
        console.log("Type MIME:", audioFile.type);
        console.log("Nom du fichier:", audioFile.name);

        // Configuration selon la documentation Mistral AI
        const apiKey = process.env.MISTRAL_API_KEY;
        const baseUrl = process.env.VOXTRAL_BASE_URL || "https://api.mistral.ai";
        
        console.log("URL Mistral configurée:", baseUrl);
        
        if (!apiKey) {
            console.error("MISTRAL_API_KEY manquante");
            // Fallback en mode développement
            if (process.env.NODE_ENV === 'development') {
                return NextResponse.json({ 
                    text: "Transcription de test - Clé API Mistral manquante",
                    confidence: 0.5,
                    endpoint_used: "fallback"
                });
            }
            return NextResponse.json({ 
                error: "Clé API Mistral requise",
                suggestion: "Configurez MISTRAL_API_KEY dans vos variables d'environnement"
            }, { status: 401 });
        }
        
        // Créer un FormData selon la documentation Mistral AI
        const mistralFormData = new FormData();
        mistralFormData.append('file', audioFile, 'audio.wav');
        mistralFormData.append('model', 'voxtral-mini-latest'); // Modèle correct selon votre indication
        mistralFormData.append('language', 'fr'); // Langue française
        mistralFormData.append('response_format', 'json'); // Format de réponse
        
        console.log("Tentative de transcription avec Voxtral (voxtral-mini-latest)...");
        
        try {
            const endpoint = '/v1/audio/transcriptions';
            console.log(`Appel API Mistral: ${baseUrl}${endpoint}`);
            
            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: mistralFormData,
            });

            console.log(`Réponse Mistral:`, response.status, response.statusText);
            
            if (response.ok) {
                const result = await response.json();
                console.log("Résultat transcription Mistral:", result);
                
                // Format de réponse selon Mistral AI (similaire à OpenAI)
                const transcribedText = result.text || result.transcript || '';
                
                if (!transcribedText || transcribedText.trim().length === 0) {
                    console.log("Réponse Mistral reçue mais texte vide:", result);
                    return NextResponse.json({ 
                        error: "Transcription vide",
                        details: result 
                    }, { status: 400 });
                }
                
                console.log("Transcription Voxtral réussie:", transcribedText);
                return NextResponse.json({ 
                    text: transcribedText.trim(),
                    confidence: result.confidence || 1.0,
                    language: result.language || 'fr',
                    duration: result.duration,
                    model_used: 'voxtral-mini-latest',
                    endpoint_used: "mistral-ai"
                });
            } else {
                const errorText = await response.text();
                console.error(`Erreur API Mistral:`, response.status, errorText);
                
                // Fallback en mode développement
                if (process.env.NODE_ENV === 'development') {
                    return NextResponse.json({ 
                        text: "Test de transcription vocale - API Mistral indisponible",
                        confidence: 0.5,
                        endpoint_used: "fallback",
                        error_details: errorText
                    });
                }
                
                return NextResponse.json({ 
                    error: "Erreur API Mistral", 
                    details: errorText,
                    status: response.status
                }, { status: response.status });
            }
        } catch (fetchError) {
            console.error("Erreur fetch Mistral:", fetchError);
            
            // Fallback en mode développement
            if (process.env.NODE_ENV === 'development') {
                return NextResponse.json({ 
                    text: "Test de transcription - Erreur réseau Mistral",
                    confidence: 0.5,
                    endpoint_used: "fallback"
                });
            }
            
            return NextResponse.json({ 
                error: "Erreur de connexion à Mistral AI",
                details: fetchError instanceof Error ? fetchError.message : 'Network error'
            }, { status: 503 });
        }
    } catch (error) {
        console.error("Erreur transcription complète:", error);
        console.error("Stack:", error instanceof Error ? error.stack : 'No stack');
        return NextResponse.json({ 
            error: "Erreur serveur transcription", 
            details: error instanceof Error ? error.message : "Erreur inconnue" 
        }, { status: 500 });
    }
}
