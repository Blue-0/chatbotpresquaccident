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
        
        // Essayer différents noms de modèles selon la documentation Mistral
        const possibleModels = [
            'voxtral-mini-latest',           
            'mistral-large',       // Version simple
            'large-latest'         // Version courte
        ];
        
        mistralFormData.append('model', possibleModels[0]); // Commencer par whisper-1
        mistralFormData.append('language', 'fr'); // Langue française
        mistralFormData.append('response_format', 'json'); // Format de réponse
        
        console.log("Tentative de transcription avec Mistral AI...");
        console.log("Modèles à tester:", possibleModels);
        
        // Essayer chaque modèle jusqu'à ce qu'un fonctionne
        for (const modelName of possibleModels) {
            try {
                console.log(`Test du modèle: ${modelName}`);
                
                const testFormData = new FormData();
                testFormData.append('file', audioFile, 'audio.wav');
                testFormData.append('model', modelName);
                testFormData.append('language', 'fr');
                testFormData.append('response_format', 'json');
                
                const endpoint = '/v1/audio/transcriptions';
                console.log(`Appel API Mistral: ${baseUrl}${endpoint}`);
                
                const response = await fetch(`${baseUrl}${endpoint}`, {
                    method: "POST",
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: testFormData,
                });

                console.log(`Réponse Mistral avec ${modelName}:`, response.status, response.statusText);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log("Résultat transcription Mistral:", result);
                    
                    // Format de réponse selon Mistral AI (similaire à OpenAI)
                    const transcribedText = result.text || result.transcript || '';
                    
                    if (transcribedText && transcribedText.trim().length > 0) {
                        console.log("Transcription Mistral réussie avec", modelName, ":", transcribedText);
                        return NextResponse.json({ 
                            text: transcribedText.trim(),
                            confidence: result.confidence || 1.0,
                            language: result.language || 'fr',
                            duration: result.duration,
                            model_used: modelName,
                            endpoint_used: "mistral-ai"
                        });
                    }
                } else {
                    const errorText = await response.text();
                    console.log(`Modèle ${modelName} échoué:`, response.status, errorText);
                    
                    // Si c'est une erreur de modèle, continuer avec le suivant
                    if (response.status === 400 && errorText.includes('model')) {
                        continue;
                    }
                    
                    // Pour d'autres erreurs, sortir de la boucle
                    throw new Error(`Erreur API: ${response.status} - ${errorText}`);
                }
            } catch (modelError) {
                console.error(`Erreur avec modèle ${modelName}:`, modelError);
                // Continuer avec le modèle suivant
                continue;
            }
        }
        
        // Si aucun modèle n'a fonctionné
        console.log("Aucun modèle Mistral n'a fonctionné, utilisation du fallback");
        
        // Fallback en mode développement
        if (process.env.NODE_ENV === 'development') {
            return NextResponse.json({ 
                text: "Transcription de test - Aucun modèle Mistral valide trouvé",
                confidence: 0.5,
                endpoint_used: "fallback"
            });
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
