'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Eye, FileText, User } from 'lucide-react';
import { Profile } from '@/types/astro';

interface ProfileCardProps {
  profile: Profile;
  onViewChart?: () => void;
  onGenerateReport?: () => void;
  className?: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onViewChart,
  onGenerateReport,
  className = '',
}) => {
  const relationColors = {
    self: '#c9a227', // gold
    spouse: '#ff3b30', // red
    parent: '#0a84ff', // blue
    child: '#34c759', // green
    sibling: '#ff9500', // orange
    other: '#64748b', // gray
  };

  const relationLabels = {
    self: 'Self',
    spouse: 'Spouse',
    parent: 'Parent',
    child: 'Child',
    sibling: 'Sibling',
    other: 'Other',
  };

  // Current dasha from chart data
  const currentDasha = profile.chartData?.dashas?.current?.mahadasha && profile.chartData?.dashas?.current?.antardasha
    ? `${profile.chartData.dashas.current.mahadasha}-${profile.chartData.dashas.current.antardasha}`
    : 'Not calculated';

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`group relative bg-[#0f1729] rounded-lg border border-[#1e2d4a] overflow-hidden ${className}`}
      style={{
        backdropFilter: 'blur(10px)',
        background: 'linear-gradient(135deg, #0f1729 0%, #0a0a1a 100%)',
      }}
    >
      {/* Glassmorphism overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(201, 162, 39, 0.1) 100%)',
        }}
      />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          {/* Avatar */}
          <div className="relative">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#7c3aed]"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                style={{
                  backgroundColor: `${relationColors[profile.relation]}20`,
                  borderColor: relationColors[profile.relation],
                }}
              >
                <User size={28} style={{ color: relationColors[profile.relation] }} />
              </div>
            )}

            {/* Relation badge */}
            <span
              className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                backgroundColor: relationColors[profile.relation],
                color: '#0a0a1a',
              }}
            >
              {relationLabels[profile.relation]}
            </span>
          </div>

          {/* Mini kundli thumbnail */}
          <div className="w-20 h-20 bg-[#0a0a1a] rounded border border-[#1e2d4a] flex items-center justify-center">
            <MiniKundli />
          </div>
        </div>

        {/* Name */}
        <h3 className="text-xl font-bold text-[#e2e8f0] mb-2">{profile.name}</h3>

        {/* Birth details */}
        <div className="space-y-1 mb-4">
          <p className="text-[#64748b] text-sm">
            {new Date(profile.birthData.dateOfBirth).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}{' '}
            • {profile.birthData.timeOfBirth}
          </p>
          <p className="text-[#64748b] text-sm">{profile.birthData.placeOfBirth}</p>
        </div>

        {/* Current dasha pill */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#7c3aed20] border border-[#7c3aed] rounded-full">
            <span className="text-[#7c3aed] text-xs font-semibold">Dasha:</span>
            <span className="text-[#e2e8f0] text-xs font-bold">{currentDasha}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewChart}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg hover:bg-[#6d28d9] transition-colors text-sm font-semibold"
          >
            <Eye size={16} />
            View Chart
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGenerateReport}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#0a0a1a] text-[#c9a227] border border-[#c9a227] rounded-lg hover:bg-[#c9a22720] transition-colors text-sm font-semibold"
          >
            <FileText size={16} />
            Report
          </motion.button>
        </div>
      </div>

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: '0 0 30px rgba(124, 58, 237, 0.3)',
        }}
      />
    </motion.div>
  );
};

const MiniKundli: React.FC = () => {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      {/* Diamond outline */}
      <path
        d="M 30,5 L 55,30 L 30,55 L 5,30 Z"
        fill="none"
        stroke="#1e2d4a"
        strokeWidth="1.5"
      />
      {/* Inner diamond */}
      <path
        d="M 30,15 L 45,30 L 30,45 L 15,30 Z"
        fill="none"
        stroke="#1e2d4a"
        strokeWidth="1"
      />
      {/* Diagonal lines */}
      <line x1="5" y1="5" x2="55" y2="55" stroke="#1e2d4a" strokeWidth="0.5" />
      <line x1="55" y1="5" x2="5" y2="55" stroke="#1e2d4a" strokeWidth="0.5" />
      {/* Lagna marker */}
      <text
        x="30"
        y="12"
        textAnchor="middle"
        fill="#7c3aed"
        fontSize="8"
        fontWeight="bold"
      >
        L
      </text>
      {/* Sample planet dots */}
      <circle cx="30" cy="20" r="1.5" fill="#c9a227" />
      <circle cx="40" cy="30" r="1.5" fill="#ff9500" />
      <circle cx="20" cy="40" r="1.5" fill="#0a84ff" />
    </svg>
  );
};
