'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { KundliChart } from '@/components/kundli/KundliChart';
import { PlanetInfoPanel } from '@/components/kundli/PlanetInfoPanel';
import { DashaTimeline } from '@/components/dasha/DashaTimeline';
import { YogaGrid } from '@/components/yoga/YogaGrid';
import { TransitWheel } from '@/components/transit/TransitWheel';
import type { ChartData, ChartStyle, PlanetName, HouseNumber } from '@/types/astro';

const SolarSystem3D = dynamic(
  () => import('@/components/solar-system/SolarSystem3D'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center text-muted-foreground bg-[#0a0a1a] rounded-lg border border-[#1e2d4a]">
        Loading 3D view...
      </div>
    ),
  }
);

type TabKey = 'overview' | 'chart' | 'dashas' | 'yogas' | 'transits' | '3d';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'chart', label: 'Chart' },
  { key: 'dashas', label: 'Dashas' },
  { key: 'yogas', label: 'Yogas' },
  { key: 'transits', label: 'Transits' },
  { key: '3d', label: '3D View' },
];

interface ProfileChartTabsProps {
  chartData: Record<string, unknown>;
  profileId: string;
}

export default function ProfileChartTabs({ chartData, profileId }: ProfileChartTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('north_indian');
  const [selectedPlanetName, setSelectedPlanetName] = useState<PlanetName | null>(null);

  // Cast the raw chart_data to ChartData type
  const chart = chartData as unknown as ChartData;

  const handlePlanetClick = (planetName: PlanetName) => {
    setSelectedPlanetName(planetName);
  };

  const handleHouseClick = (_houseNum: HouseNumber) => {
    // no-op for now
  };

  const selectedPlanet = selectedPlanetName ? chart.planets?.[selectedPlanetName] ?? null : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <OverviewTab chart={chart} />
        )}

        {activeTab === 'chart' && chart.planets && chart.houses && (
          <div>
            {/* Chart style toggle */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Style:</span>
              <button
                onClick={() => setChartStyle('north_indian')}
                className={`px-3 py-1 rounded text-sm ${
                  chartStyle === 'north_indian'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                North Indian
              </button>
              <button
                onClick={() => setChartStyle('south_indian')}
                className={`px-3 py-1 rounded text-sm ${
                  chartStyle === 'south_indian'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                South Indian
              </button>
            </div>
            <div className="flex justify-center">
              <KundliChart
                chartData={chart}
                style={chartStyle}
                onHouseClick={handleHouseClick}
                onPlanetClick={handlePlanetClick}
              />
            </div>
            {/* Planet info side panel */}
            <PlanetInfoPanel
              planet={selectedPlanet}
              planetName={selectedPlanetName}
              onClose={() => setSelectedPlanetName(null)}
            />
          </div>
        )}

        {activeTab === 'dashas' && chart.dashas && (
          <DashaTimeline dashas={chart.dashas} />
        )}

        {activeTab === 'yogas' && chart.yogas && (
          <YogaGrid yogas={chart.yogas} />
        )}

        {activeTab === 'transits' && chart.planets && chart.houses && (
          <TransitWheel natalChart={chart} />
        )}

        {activeTab === '3d' && chart.planets && (
          <SolarSystem3D chartData={chart} />
        )}
      </div>
    </motion.div>
  );
}

function OverviewTab({ chart }: { chart: ChartData }) {
  const planetEntries = chart.planets ? Object.entries(chart.planets) : [];

  return (
    <div className="space-y-6">
      {/* Planetary Positions Table */}
      <div className="glass rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Planetary Positions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Planet</th>
                <th className="pb-2 font-medium">Sign</th>
                <th className="pb-2 font-medium">Nakshatra</th>
                <th className="pb-2 font-medium">Pada</th>
                <th className="pb-2 font-medium">Degree</th>
                <th className="pb-2 font-medium">House</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {planetEntries.map(([name, p]) => (
                <tr key={name} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-2.5 font-medium">
                    {name}
                    {p.retrograde && <span className="ml-1 text-xs text-yellow-500">(R)</span>}
                  </td>
                  <td className="py-2.5">{p.sign}</td>
                  <td className="py-2.5">{p.nakshatra ?? '—'}</td>
                  <td className="py-2.5">{p.pada ?? '—'}</td>
                  <td className="py-2.5">{p.degrees?.toFixed(2) ?? '—'}°</td>
                  <td className="py-2.5">{p.house ?? '—'}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      p.combust ? 'bg-orange-500/20 text-orange-400' : 'bg-muted text-muted-foreground'
                    }`}>
                      {p.combust ? 'Combust' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current Dasha Summary */}
      {chart.dashas?.current && (
        <div className="glass rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Current Dasha Period</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-lg p-4 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Mahadasha</p>
              <p className="text-xl font-bold text-secondary">{chart.dashas.current.mahadasha}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Until {chart.dashas.current.mahadasha_end
                  ? new Date(chart.dashas.current.mahadasha_end).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div className="bg-card rounded-lg p-4 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Antardasha</p>
              <p className="text-xl font-bold text-secondary">{chart.dashas.current.antardasha}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Until {chart.dashas.current.antardasha_end
                  ? new Date(chart.dashas.current.antardasha_end).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Yoga Summary */}
      {chart.yogas && chart.yogas.length > 0 && (
        <div className="glass rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Detected Yogas ({chart.yogas.length})</h2>
          <div className="flex flex-wrap gap-2">
            {chart.yogas.slice(0, 8).map((yoga, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                style={{
                  borderColor: yoga.strength === 'Exceptional' ? '#c9a227' :
                              yoga.strength === 'Strong' ? '#7c3aed' :
                              yoga.strength === 'Moderate' ? '#0a84ff' : '#64748b',
                  color: yoga.strength === 'Exceptional' ? '#c9a227' :
                         yoga.strength === 'Strong' ? '#7c3aed' :
                         yoga.strength === 'Moderate' ? '#0a84ff' : '#64748b',
                }}
              >
                {yoga.name}
              </span>
            ))}
            {chart.yogas.length > 8 && (
              <span className="px-3 py-1.5 rounded-full text-xs text-muted-foreground border border-border">
                +{chart.yogas.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
