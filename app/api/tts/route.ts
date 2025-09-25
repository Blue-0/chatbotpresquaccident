// app/api/tts/route.ts
export const runtime = "node"; // force Node runtime si besoin

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return new Response(JSON.stringify({ error: "Message requis" }), { status: 400 });
        }

        // URL du conteneur orpheus-tts dans votre réseau Docker
        // Utilisez le nom du service Docker ou l'IP du conteneur
        const ttsUrl = process.env.TTS_URL || "http://orpheus-tts:3001"; // Nom du service Docker
        
        console.log("Appel TTS vers:", ttsUrl + "/synthesize");
        console.log("Message à synthétiser:", message.substring(0, 100) + "...");

        // Appelle ton FastAPI (le conteneur orpheus-tts)
        const resp = await fetch(ttsUrl + "/synthesize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });

        console.log("Réponse TTS:", resp.status, resp.statusText);

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error("Erreur TTS:", errorText);
            return new Response(JSON.stringify({ 
                error: "TTS failed", 
                details: errorText,
                status: resp.status 
            }), { status: 500 });
        }

        // Proxy le flux audio au client (audio/wav)
        const audioBuf = await resp.arrayBuffer();
        
        if (audioBuf.byteLength === 0) {
            console.error("Audio buffer vide");
            return new Response(JSON.stringify({ error: "Audio vide généré" }), { status: 500 });
        }

        console.log("Audio généré:", audioBuf.byteLength, "bytes");
        
        return new Response(audioBuf, {
            status: 200,
            headers: {
                "Content-Type": "audio/wav",
                "Content-Disposition": "inline; filename=tts.wav",
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Erreur TTS complète:", error);
        return new Response(JSON.stringify({ 
            error: "Erreur serveur TTS",
            details: error instanceof Error ? error.message : "Erreur inconnue"
        }), { status: 500 });
    }
}
