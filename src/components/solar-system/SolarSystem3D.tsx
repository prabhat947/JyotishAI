'use client';

import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { ChartData, PlanetName, PLANET_COLORS } from '@/types/astro';

interface SolarSystem3DProps {
  chartData: ChartData;
  showBirthPositions?: boolean;
  onPlanetSelect?: (planet: PlanetName) => void;
  className?: string;
}

const SolarSystem3D: React.FC<SolarSystem3DProps> = ({
  chartData,
  showBirthPositions = true,
  onPlanetSelect,
  className = '',
}) => {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetName | null>(null);

  const handlePlanetClick = (planet: PlanetName) => {
    setSelectedPlanet(planet);
    onPlanetSelect?.(planet);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className={`w-full h-[600px] bg-[#0a0a1a] rounded-lg border border-[#1e2d4a] overflow-hidden ${className}`}
    >
      <Canvas camera={{ position: [0, 5, 15], fov: 60 }}>
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <pointLight position={[0, 0, 0]} intensity={2} color="#ff9500" />

          {/* Stars background */}
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />

          {/* Sun */}
          <Sun />

          {/* Planets */}
          {Object.entries(chartData.planets).map(([name, planet]) => (
            <Planet
              key={name}
              planetName={name as PlanetName}
              planet={planet}
              showBirthPositions={showBirthPositions}
              isSelected={selectedPlanet === name}
              onClick={() => handlePlanetClick(name as PlanetName)}
            />
          ))}

          {/* Controls */}
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minDistance={10}
            maxDistance={50}
          />
        </Suspense>
      </Canvas>

      {/* Info overlay */}
      {selectedPlanet && (
        <div className="absolute top-4 left-4 bg-[#0f1729] border border-[#1e2d4a] rounded-lg p-4 max-w-xs">
          <h3
            className="text-lg font-bold mb-2"
            style={{ color: PLANET_COLORS[selectedPlanet] }}
          >
            {selectedPlanet}
          </h3>
          <p className="text-[#64748b] text-sm">
            Click planet to view details
          </p>
        </div>
      )}

      {/* Toggle button */}
      <div className="absolute bottom-4 right-4">
        <button className="bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#6d28d9] transition-colors">
          {showBirthPositions ? 'Birth Time' : 'Current Time'}
        </button>
      </div>
    </motion.div>
  );
};

export { SolarSystem3D };
export default SolarSystem3D;

const Sun: React.FC = () => {
  const sunRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={sunRef} position={[0, 0, 0]}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshStandardMaterial
        color="#ff9500"
        emissive="#ff9500"
        emissiveIntensity={1.5}
        toneMapped={false}
      />
      <Html distanceFactor={10}>
        <div className="bg-[#0a0a1a] px-2 py-1 rounded text-[#ff9500] text-xs font-bold whitespace-nowrap">
          Sun
        </div>
      </Html>
    </mesh>
  );
};

interface PlanetProps {
  planetName: PlanetName;
  planet: import("@/types/astro").Planet;
  showBirthPositions: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const Planet: React.FC<PlanetProps> = ({
  planetName,
  planet,
  showBirthPositions,
  isSelected,
  onClick,
}) => {
  const planetRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);

  // Planet size and orbit mappings (not to scale, for visualization)
  const planetSizes: Record<PlanetName, number> = {
    Mercury: 0.15,
    Venus: 0.25,
    Mars: 0.2,
    Jupiter: 0.5,
    Saturn: 0.45,
    Moon: 0.18,
    Sun: 0.8,
    Rahu: 0.15,
    Ketu: 0.15,
  };

  const orbitRadii: Record<PlanetName, number> = {
    Mercury: 2,
    Venus: 3,
    Mars: 4.5,
    Jupiter: 7,
    Saturn: 9,
    Moon: 1.5,
    Sun: 0,
    Rahu: 10,
    Ketu: 10,
  };

  const size = planetSizes[planetName] || 0.2;
  const orbitRadius = orbitRadii[planetName] || 5;
  const angle = (planet.degrees * Math.PI) / 180;

  useFrame(({ clock }) => {
    if (orbitRef.current && showBirthPositions) {
      // Slow rotation based on planet
      const speed = 0.1 / orbitRadius;
      orbitRef.current.rotation.y += speed * 0.01;
    }

    if (planetRef.current && isSelected) {
      // Pulse selected planet
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
      planetRef.current.scale.setScalar(scale);
    }
  });

  // Calculate position from longitude
  const x = orbitRadius * Math.cos(angle);
  const z = orbitRadius * Math.sin(angle);

  return (
    <group ref={orbitRef}>
      {/* Orbital ring */}
      {orbitRadius > 0 && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[orbitRadius - 0.02, orbitRadius + 0.02, 64]} />
          <meshBasicMaterial
            color={PLANET_COLORS[planetName]}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Planet */}
      <mesh
        ref={planetRef}
        position={[x, 0, z]}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={PLANET_COLORS[planetName]}
          emissive={PLANET_COLORS[planetName]}
          emissiveIntensity={isSelected ? 0.8 : 0.3}
        />
        <Html distanceFactor={10}>
          <div
            className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
              isSelected ? 'bg-[#7c3aed]' : 'bg-[#0a0a1a]'
            }`}
            style={{ color: PLANET_COLORS[planetName] }}
          >
            {planetName}
            {planet.retrograde && ' ℞'}
          </div>
        </Html>
      </mesh>
    </group>
  );
};
