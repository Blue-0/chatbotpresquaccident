'use client';

import React, { useEffect, useRef } from 'react';


interface VoicewaveProps {
    isRecording?: boolean;
    audioStream?: MediaStream | null;
    width?: number;
    height?: number;
    barColor?: string;
    barCount?: number;
    barWidth?: number;
    barGap?: number;
    barRadius?: number;
    barMinHeight?: number;
    barMaxHeight?: number;
    backgroundColor?: string;
    showBackground?: boolean;
    style?: 'bars' | 'rounded' | 'line';
    sensitivity?: number;
}
export const Voicewave: React.FC<VoicewaveProps> = ({
    isRecording = false,
    audioStream = null,
    width = 100,
    height = 60,
    barColor = '#43bb8c',
    barCount = 40,
    barWidth, // Pas de valeur par défaut - sera calculé si non fourni
    barGap = 2,
    barRadius = 2,
    barMinHeight = 4,
    barMaxHeight = 0.8,
    backgroundColor = 'transparent',
    showBackground = false,
    style = 'rounded',
    sensitivity = 1,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const analyserRef = useRef<AnalyserNode | undefined>(undefined);
    const dataArrayRef = useRef<Uint8Array | undefined>(undefined);

    // Calculer la largeur de barre de manière propre et responsive
    const calculatedBarWidth = React.useMemo(() => {
        // Si barWidth est explicitement fourni, l'utiliser
        if (barWidth && barWidth > 0) {
            return barWidth;
        }
        // Sinon, calculer automatiquement pour s'adapter à l'espace disponible
        return Math.max(2, (width - (barCount - 1) * barGap) / barCount);
    }, [barWidth, width, barCount, barGap]);

    useEffect(() => {
        if (!isRecording || !audioStream) {
            // Arrêter l'animation si pas d'enregistrement
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            // Dessiner les barres au repos
            drawIdleBars();
            return;
        }

        // Créer le contexte audio
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(audioStream);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;

        // Démarrer l'animation
        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            source.disconnect();
            audioContext.close();
        };
    }, [isRecording, audioStream]);

    const drawRoundedRect = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
    ) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    };

    const drawIdleBars = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        if (showBackground) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);
        } else {
            ctx.clearRect(0, 0, width, height);
        }

        ctx.fillStyle = barColor;

        const totalBarWidth = calculatedBarWidth + barGap;

        for (let i = 0; i < barCount; i++) {
            const x = i * totalBarWidth;
            const barHeight = barMinHeight;
            const y = (height - barHeight) / 2;

            if (style === 'rounded' && barRadius > 0) {
                drawRoundedRect(ctx, x, y, calculatedBarWidth, barHeight, barRadius);
            } else if (style === 'line') {
                ctx.fillRect(x + calculatedBarWidth / 2 - 1, y, 2, barHeight);
            } else {
                ctx.fillRect(x, y, calculatedBarWidth, barHeight);
            }
        }
    };

    const draw = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // @ts-expect-error - TypeScript ArrayBuffer type issue
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Background
        if (showBackground) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);
        } else {
            ctx.clearRect(0, 0, width, height);
        }

        ctx.fillStyle = barColor;

        const totalBarWidth = calculatedBarWidth + barGap;
        const dataStep = Math.floor(dataArrayRef.current.length / barCount);

        for (let i = 0; i < barCount; i++) {
            const dataIndex = i * dataStep;
            const value = dataArrayRef.current[dataIndex];
            const normalizedValue = (value / 255) * sensitivity;
            const maxBarHeight = height * barMaxHeight;
            const barHeight = Math.max(
                barMinHeight,
                Math.min(normalizedValue * maxBarHeight, maxBarHeight)
            );
            const x = i * totalBarWidth;
            const y = (height - barHeight) / 2;

            if (style === 'rounded' && barRadius > 0) {
                drawRoundedRect(ctx, x, y, calculatedBarWidth, barHeight, barRadius);
            } else if (style === 'line') {
                ctx.fillRect(x + calculatedBarWidth / 2 - 1, y, 2, barHeight);
            } else {
                ctx.fillRect(x, y, calculatedBarWidth, barHeight);
            }
        }

        animationRef.current = requestAnimationFrame(draw);
    };

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="rounded-lg"
        />
    );
};

export default Voicewave;
