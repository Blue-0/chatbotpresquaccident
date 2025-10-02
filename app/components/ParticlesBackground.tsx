import React from 'react';
import Particles from '@/src/components/Particles';

const PARTICLES_CONFIG = {
  particleColors: ['#43bb8c'],
  particleCount: 300,
  particleSpread: 6,
  speed: 0.05,
  particleBaseSize: 80,
  moveParticlesOnHover: false,
  alphaParticles: true,
  disableRotation: false,
};

export const ParticlesBackground = React.memo(() => {
  return (
    <div className="absolute inset-0 z-0">
      <Particles {...PARTICLES_CONFIG} />
    </div>
  );
});

ParticlesBackground.displayName = 'ParticlesBackground';
