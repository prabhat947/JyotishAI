'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { YogaCard } from './YogaCard';
import { Yoga, YogaType } from '@/types/astro';

interface YogaGridProps {
  yogas: Yoga[];
  className?: string;
}

export const YogaGrid: React.FC<YogaGridProps> = ({ yogas, className = '' }) => {
  const [selectedType, setSelectedType] = useState<YogaType | 'All'>('All');
  const [sortBy, setSortBy] = useState<'strength' | 'name'>('strength');

  const yogaTypes: Array<YogaType | 'All'> = [
    'All',
    'Raj',
    'Dhana',
    'Arishta',
    'Pancha Mahapurusha',
    'Other',
  ];

  const strengthOrder = {
    Exceptional: 4,
    Strong: 3,
    Moderate: 2,
    Weak: 1,
  };

  const filteredAndSortedYogas = useMemo(() => {
    let filtered = yogas;

    // Filter by type
    if (selectedType !== 'All') {
      filtered = yogas.filter((yoga) => yoga.type === selectedType);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'strength') {
        return (strengthOrder[b.strength as keyof typeof strengthOrder] ?? 0) - (strengthOrder[a.strength as keyof typeof strengthOrder] ?? 0);
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [yogas, selectedType, sortBy]);

  return (
    <div className={`${className}`}>
      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Type Filter */}
        <div>
          <label className="text-[#64748b] text-sm mb-2 block">Filter by Type</label>
          <div className="flex flex-wrap gap-2">
            {yogaTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedType === type
                    ? 'bg-[#7c3aed] text-white border-2 border-[#7c3aed]'
                    : 'bg-[#0f1729] text-[#64748b] border border-[#1e2d4a] hover:border-[#7c3aed]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-4">
          <label className="text-[#64748b] text-sm">Sort by:</label>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('strength')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'strength'
                  ? 'bg-[#c9a227] text-[#0a0a1a] font-semibold'
                  : 'bg-[#0f1729] text-[#64748b] border border-[#1e2d4a]'
              }`}
            >
              Strength
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'name'
                  ? 'bg-[#c9a227] text-[#0a0a1a] font-semibold'
                  : 'bg-[#0f1729] text-[#64748b] border border-[#1e2d4a]'
              }`}
            >
              Name
            </button>
          </div>
        </div>

        {/* Count */}
        <div className="text-[#64748b] text-sm">
          Showing {filteredAndSortedYogas.length} of {yogas.length} yogas
        </div>
      </div>

      {/* Grid */}
      {filteredAndSortedYogas.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          layout
        >
          {filteredAndSortedYogas.map((yoga, index) => (
            <motion.div
              key={`${yoga.name}-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <YogaCard yoga={yoga} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

const EmptyState: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 text-center"
  >
    <div className="relative w-32 h-32 mb-6">
      {/* Cosmic illustration */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#c9a227] opacity-20"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute inset-4 rounded-full bg-[#0a0a1a] border-2 border-[#1e2d4a]"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl">✨</span>
      </div>
    </div>
    <h3 className="text-xl font-bold text-[#e2e8f0] mb-2">No Yogas Found</h3>
    <p className="text-[#64748b] max-w-md">
      No yogas match the selected filters. Try adjusting your filter selection.
    </p>
  </motion.div>
);
