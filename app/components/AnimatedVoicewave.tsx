'use client';

import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import Voicewave from './Voicewave';
import { Button } from '@/src/components/ui/button';
import { Square } from 'lucide-react';

interface AnimatedVoicewaveProps {
  isRecording: boolean;
  audioStream: MediaStream | null;
  onStop?: () => void;
  width?: number;
  height?: number;
  barColor?: string;
  barCount?: number;
  barGap?: number;
  barRadius?: number;
  style?: 'bars' | 'rounded' | 'line';
  barMinHeight?: number;
  barMaxHeight?: number;
  sensitivity?: number;
}

export function AnimatedVoicewave({
  isRecording,
  audioStream,
  onStop,
  width = 320,
  height = 70,
  barColor = '#43bb8c',
  barCount = 45,
  barGap = 2,
  barRadius = 3,
  style = 'rounded',
  barMinHeight = 2,
  barMaxHeight = 0.9,
  sensitivity = 2,
}: AnimatedVoicewaveProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;

    if (isRecording) {
      // Animation d'apparition - commencer visible
      wrapperRef.current.style.opacity = '1';
      animate(wrapperRef.current, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 400,
        easing: 'easeOutCubic',
      });
    }
  }, [isRecording]);

  if (!isRecording) return null;

  return (
    <div
      ref={wrapperRef}
      className="flex flex-col items-center gap-4"
    >
      {/* Bouton Stop intégré en haut */}
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onStop}
        className="gap-2 shadow-lg mb-2"
      >
        <Square className="size-3 fill-current" />
        Stop
      </Button>

      <Voicewave
        audioStream={audioStream}
        isRecording={isRecording}
        width={width}
        height={height}
        barColor={barColor}
        barCount={barCount}
        barGap={barGap}
        barRadius={barRadius}
        style={style}
        barMinHeight={barMinHeight}
        barMaxHeight={barMaxHeight}
        sensitivity={sensitivity}
      />

      {/* Bouton Stop en bas (double) */}
      <Button
        type="button"
        variant="destructive"
        size="lg"
        onClick={onStop}
        className="gap-2 shadow-lg"
      >
        <Square className="size-4 fill-current" />
        Arrêter l'enregistrement
      </Button>
    </div>
  );
}

export default AnimatedVoicewave;
