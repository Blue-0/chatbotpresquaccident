'use client';

import { useState, useEffect } from 'react';

interface VoicewaveConfig {
  barCount: number;
  barGap: number;
  barWidth: number;
  width: number;
}

export const useResponsiveVoicewave = (): VoicewaveConfig => {
  const [config, setConfig] = useState<VoicewaveConfig>({
    barCount: 30,
    barGap: 3,
    barWidth: 6,
    width: 200,
  });

  useEffect(() => {
    const calculateConfig = () => {
      const screenWidth = window.innerWidth;
      
      // Calculer la largeur disponible pour les barres (en tenant compte des marges)
      let availableWidth: number;
      let barCount: number;
      let barGap: number;
      let barWidth: number;

      if (screenWidth < 640) {
        // Mobile (sm)
        availableWidth = screenWidth - 120; // Réserver espace pour les boutons
        barWidth = 4;
        barGap = 2;
        barCount = Math.max(5, Math.floor(availableWidth / (barWidth + barGap)));
      } else if (screenWidth < 768) {
        // Tablet petit (md)
        availableWidth = screenWidth - 150;
        barWidth = 5;
        barGap = 3;
        barCount = Math.max(20, Math.floor(availableWidth / (barWidth + barGap)));
      } else if (screenWidth < 1024) {
        // Tablet (lg)
        availableWidth = screenWidth - 200;
        barWidth = 6;
        barGap = 3;
        barCount = Math.max(25, Math.floor(availableWidth / (barWidth + barGap)));
      } else if (screenWidth < 1280) {
        // Desktop (xl)
        availableWidth = 400;
        barWidth = 7;
        barGap = 3;
        barCount = Math.max(30, Math.floor(availableWidth / (barWidth + barGap)));
      } else {
        // Large desktop (2xl)
        availableWidth = 500;
        barWidth = 8;
        barGap = 4;
        barCount = Math.max(35, Math.floor(availableWidth / (barWidth + barGap)));
      }

      // Limiter le nombre maximum pour éviter la surcharge
      barCount = Math.min(barCount, 50);
      
      // Calculer la largeur optimale basée sur les vraies dimensions
      const optimalWidth = Math.min(availableWidth, barCount * (barWidth + barGap) - barGap);

      setConfig({
        barCount,
        barGap,
        barWidth,
        width: optimalWidth,
      });
    };

    // Calculer au montage
    calculateConfig();

    // Recalculer lors du redimensionnement avec debounce
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculateConfig, 100);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return config;
};