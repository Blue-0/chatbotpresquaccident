import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // Validation des données d'entrée
        if (!body.text || typeof body.text !== 'string' || body.text.trim().length === 0) {
            return NextResponse.json({ error: "Le texte est requis et ne peut pas être vide" }, { status: 400 });
        }

        const base = process.env.BARK_BASE_URL || "http://51.178.39.172:8001";
        
        console.log("Tentative de connexion à Bark:", base);
        console.log("Texte à synthétiser:", body.text.substring(0, 100) + "...");
        
        const response = await fetch(`${base}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: body.text.trim(),
                voice: body.voice || "fr_speaker_0", // Voix par défaut pour Bark
                ...body
            }),
        });

        if (!response.ok) {
            console.error("Erreur Bark:", response.status, response.statusText);
            return NextResponse.json({ 
                error: `Erreur Bark: ${response.status} - ${response.statusText}` 
            }, { status: response.status });
        }

        const audioBuffer = await response.arrayBuffer();
        
        if (audioBuffer.byteLength === 0) {
            return NextResponse.json({ error: "Audio généré vide" }, { status: 500 });
        }
        
        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/wav",
                "Content-Disposition": "inline; filename=audio.wav",
                "Cache-Control": "no-cache",
            },
        });
    } catch (error) {
        console.error("Erreur TTS complète:", error);
        return NextResponse.json({ 
            error: "Erreur serveur TTS", 
            details: error instanceof Error ? error.message : "Erreur inconnue" 
        }, { status: 500 });
    }
}
