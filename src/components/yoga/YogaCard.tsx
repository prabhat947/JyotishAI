'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Yoga, YOGA_TYPE_COLORS, STRENGTH_COLORS } from '@/types/astro';

interface YogaCardProps {
  yoga: Yoga;
  onClick?: () => void;
}

export const YogaCard: React.FC<YogaCardProps> = ({ yoga, onClick }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
    onClick?.();
  };

  const glowColor = STRENGTH_COLORS[yoga.strength as import('@/types/astro').YogaStrength] ?? '#64748b';
  const typeColor = YOGA_TYPE_COLORS[yoga.type as import('@/types/astro').YogaType] ?? '#64748b';

  return (
    <motion.div
      className="relative h-64 cursor-pointer perspective-1000"
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      style={{
        perspective: '1000px',
      }}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front Side */}
        <div
          className="absolute w-full h-full rounded-lg p-6 border-2"
          style={{
            backfaceVisibility: 'hidden',
            backgroundColor: '#0f1729',
            borderColor: glowColor,
            boxShadow: `0 0 20px ${glowColor}40`,
          }}
        >
          <div className="h-full flex flex-col justify-between">
            {/* Type Badge */}
            <div className="flex items-center justify-between">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: `${typeColor}20`,
                  color: typeColor,
                }}
              >
                {yoga.type}
              </span>
              <span
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: `${glowColor}20`,
                  color: glowColor,
                }}
              >
                {yoga.strength}
              </span>
            </div>

            {/* Yoga Name */}
            <div className="text-center flex-1 flex items-center justify-center">
              <h3 className="text-2xl font-bold text-[#e2e8f0] leading-tight">
                {yoga.name}
              </h3>
            </div>

            {/* Planets */}
            <div className="flex flex-wrap gap-2 justify-center">
              {yoga.planets.map((planet, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-[#0a0a1a] rounded text-xs text-[#64748b] border border-[#1e2d4a]"
                >
                  {planet}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div
          className="absolute w-full h-full rounded-lg p-6 border-2"
          style={{
            backfaceVisibility: 'hidden',
            backgroundColor: '#0f1729',
            borderColor: glowColor,
            boxShadow: `0 0 20px ${glowColor}40`,
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-4">
              <h4 className="text-lg font-bold text-[#c9a227] mb-1">
                Description
              </h4>
            </div>

            {/* Description */}
            <div className="flex-1 overflow-y-auto">
              <p className="text-[#e2e8f0] text-sm leading-relaxed mb-4">
                {yoga.description}
              </p>
              <div className="bg-[#0a0a1a] rounded-lg p-3 border border-[#1e2d4a]">
                <p className="text-[#7c3aed] font-semibold text-xs mb-2">Effect:</p>
                <p className="text-[#64748b] text-xs">{yoga.effect}</p>
              </div>
            </div>

            {/* Classical Source */}
          </div>
        </div>
      </motion.div>

      {/* Flip hint */}
      <motion.div
        className="absolute bottom-2 right-2 text-[#64748b] text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: isFlipped ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        Click to flip
      </motion.div>
    </motion.div>
  );
};
