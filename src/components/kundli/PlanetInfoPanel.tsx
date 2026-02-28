'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Planet, PlanetName, PLANET_COLORS } from '@/types/astro';

interface PlanetInfoPanelProps {
  planet: Planet | null;
  planetName: PlanetName | null;
  onClose: () => void;
  aspects?: Array<{ planet: PlanetName; type: string; orb: number }>;
}

export const PlanetInfoPanel: React.FC<PlanetInfoPanelProps> = ({
  planet,
  planetName,
  onClose,
  aspects = [],
}) => {
  if (!planet || !planetName) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-96 bg-[#0f1729] border-l border-[#1e2d4a] shadow-2xl z-50 overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: PLANET_COLORS[planetName] }}
              >
                {planetName}
                {planet.retrograde && (
                  <span className="ml-2 text-[#ff3b30] text-xl">℞</span>
                )}
              </h2>
              <p className="text-[#64748b] text-sm">Planet Details</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#1e2d4a] rounded-lg transition-colors"
            >
              <X size={20} className="text-[#e2e8f0]" />
            </button>
          </div>

          {/* Position Info */}
          <div className="space-y-4">
            <InfoRow label="Sign" value={planet.sign} />
            <InfoRow
              label="Degrees"
              value={`${Math.floor(planet.degrees)}° ${Math.floor((planet.degrees % 1) * 60)}'`}
            />
            <InfoRow label="House" value={`${planet.house}th House`} />

            {/* Combust Status */}
            {planet.combust && (
              <div className="flex items-center justify-between py-3 border-b border-[#1e2d4a]">
                <span className="text-[#64748b] text-sm">Status</span>
                <span className="font-semibold px-3 py-1 rounded-full text-sm bg-[#ff950020] text-[#ff9500]">
                  Combust
                </span>
              </div>
            )}

            {/* Nakshatra */}
            <div className="bg-[#0a0a1a] rounded-lg p-4 border border-[#1e2d4a]">
              <h3 className="text-[#c9a227] font-semibold mb-3">Nakshatra</h3>
              <InfoRow label="Name" value={planet.nakshatra} compact />
              <InfoRow label="Pada" value={planet.pada.toString()} compact />
              <InfoRow label="Sign Lord" value={planet.lord} compact />
            </div>

            {/* Retrograde Status */}
            {planet.retrograde && (
              <div className="bg-[#ff3b3010] border border-[#ff3b30] rounded-lg p-4">
                <h3 className="text-[#ff3b30] font-semibold mb-2">Retrograde</h3>
                <p className="text-[#e2e8f0] text-sm">
                  This planet is moving backward in apparent motion, intensifying its
                  karmic lessons and requiring internal reflection.
                </p>
              </div>
            )}

            {/* Aspects */}
            {aspects.length > 0 && (
              <div className="mt-6">
                <h3 className="text-[#c9a227] font-semibold mb-3">Aspects</h3>
                <div className="space-y-2">
                  {aspects.map((aspect, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-[#0a0a1a] rounded-lg border border-[#1e2d4a]"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="font-semibold"
                          style={{ color: PLANET_COLORS[aspect.planet] }}
                        >
                          {aspect.planet}
                        </span>
                        <span className="text-[#64748b] text-sm">
                          {aspect.type}
                        </span>
                      </div>
                      <span className="text-[#64748b] text-xs">
                        {aspect.orb.toFixed(2)}°
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const InfoRow: React.FC<{
  label: string;
  value: string;
  compact?: boolean;
  tooltip?: string;
}> = ({ label, value, compact = false, tooltip }) => (
  <div
    className={`flex items-center justify-between ${
      compact ? 'py-1' : 'py-3 border-b border-[#1e2d4a]'
    }`}
    title={tooltip}
  >
    <span className="text-[#64748b] text-sm">{label}</span>
    <span className="text-[#e2e8f0] font-semibold">{value}</span>
  </div>
);
