import React from 'react';
import Particles from '@/src/components/Particles';

interface LoadingScreenProps {
  message: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  return (
    <div className="relative min-h-screen flex justify-center items-center">
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={['#43bb8c']}
          particleCount={300}
          particleSpread={6}
          speed={0.05}
          particleBaseSize={80}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={false}
        />
      </div>
      <div className="relative z-10 text-lg text-gray-600">{message}</div>
    </div>
  );
};
