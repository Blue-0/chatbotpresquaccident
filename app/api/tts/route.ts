import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return new Response(JSON.stringify({ error: "Message requis pour la synthèse vocale" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            console.error("ELEVENLABS_API_KEY manquante");
            return new Response(JSON.stringify({
                error: "Clé API ElevenLabs requise",
                suggestion: "Configurez ELEVENLABS_API_KEY dans vos variables d'environnement"
            }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        const cleanedMessage = message
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();

        if (!cleanedMessage || cleanedMessage.length === 0) {
            return new Response(JSON.stringify({ error: "Message vide après nettoyage" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const messageLength = cleanedMessage.length;
        console.log(`TTS ElevenLabs demandé pour un message de ${messageLength} caractères`);
        console.log("Message à synthétiser:", cleanedMessage.substring(0, 200) + (cleanedMessage.length > 200 ? "..." : ""));

        const startTime = Date.now();

        try {
            const elevenlabs = new ElevenLabsClient({
                apiKey: apiKey
            });

            const voiceId = process.env.ELEVENLABS_VOICE_ID || "ohItIVrXTBI80RrUECOD";

            console.log(`Génération audio avec ElevenLabs streaming (voix: ${voiceId})...`);

            const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
                text: cleanedMessage,
                modelId: "eleven_turbo_v2_5",
                voiceSettings: {
                    stability: 0.5,
                    similarityBoost: 0.8,
                    style: 0.0,
                    useSpeakerBoost: true
                },
                outputFormat: "mp3_44100_128"
            });

            const processingTime = Date.now() - startTime;
            console.log(`ElevenLabs streaming initié en ${processingTime}ms`);

            const chunks: Uint8Array[] = [];
            const reader = audioStream.getReader();
            let result;
            while (!(result = await reader.read()).done) {
                chunks.push(result.value);
            }
            reader.releaseLock();

            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const audioBuffer = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                audioBuffer.set(chunk, offset);
                offset += chunk.length;
            }

            const finalProcessingTime = Date.now() - startTime;

            if (audioBuffer.length === 0) {
                console.error("Audio buffer vide généré par ElevenLabs");
                return new Response(JSON.stringify({
                    error: "Aucun audio généré par ElevenLabs",
                    messageLength: messageLength,
                    processingTime: finalProcessingTime
                }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                });
            }

            console.log(`Audio ElevenLabs streaming généré: ${audioBuffer.length} bytes en ${finalProcessingTime}ms`);

            return new Response(audioBuffer, {
                status: 200,
                headers: {
                    "Content-Type": "audio/mpeg",
                    "Content-Disposition": "inline; filename=tts.mp3",
                    "Cache-Control": "no-store",
                    "X-Processing-Time": finalProcessingTime.toString(),
                    "X-Message-Length": messageLength.toString(),
                    "X-Voice-Provider": "ElevenLabs",
                    "X-Voice-ID": voiceId,
                    "X-Stream-Method": "convertAsStream"
                },
            });

        } catch (elevenlabsError) {
            const processingTime = Date.now() - startTime;
            console.error("Erreur ElevenLabs streaming:", elevenlabsError);

            if (elevenlabsError instanceof Error) {
                let errorMessage = "Erreur lors de la génération audio avec ElevenLabs";
                let statusCode = 500;

                if (elevenlabsError.message.includes('quota') || elevenlabsError.message.includes('insufficient_quota')) {
                    errorMessage = "Quota ElevenLabs dépassé";
                    statusCode = 429;
                } else if (elevenlabsError.message.includes('unauthorized') || elevenlabsError.message.includes('401')) {
                    errorMessage = "Clé API ElevenLabs invalide";
                    statusCode = 401;
                } else if (elevenlabsError.message.includes('voice') || elevenlabsError.message.includes('not_found')) {
                    errorMessage = "ID de voix ElevenLabs invalide";
                    statusCode = 400;
                } else if (elevenlabsError.message.includes('timeout')) {
                    errorMessage = "⏰ ElevenLabs met trop de temps à répondre";
                    statusCode = 504;
                } else if (elevenlabsError.message.includes('rate_limit')) {
                    errorMessage = "Limite de taux ElevenLabs dépassée";
                    statusCode = 429;
                }

                return new Response(JSON.stringify({
                    error: errorMessage,
                    details: elevenlabsError.message,
                    processingTime: processingTime,
                    messageLength: messageLength,
                    provider: "ElevenLabs"
                }), {
                    status: statusCode,
                    headers: { "Content-Type": "application/json" }
                });
            }

            return new Response(JSON.stringify({
                error: "Erreur inconnue avec ElevenLabs",
                details: String(elevenlabsError),
                processingTime: processingTime
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

    } catch (error) {
        console.error("Erreur TTS ElevenLabs complète:", error);

        return new Response(JSON.stringify({
            error: "Erreur serveur lors du traitement TTS ElevenLabs",
            details: error instanceof Error ? error.message : "Erreur inconnue"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
