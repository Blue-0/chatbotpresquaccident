import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const base = process.env.BARK_BASE_URL || "http://bark:8001";
        
        const response = await fetch(`${base}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Erreur lors de la génération TTS" }, { status: 500 });
        }

        const audioBuffer = await response.arrayBuffer();
        
        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/wav",
                "Content-Disposition": "inline; filename=audio.wav",
            },
        });
    } catch (error) {
        console.error("Erreur TTS:", error);
        return NextResponse.json({ error: "Erreur serveur TTS" }, { status: 500 });
    }
}
