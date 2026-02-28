'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { ChartData, TransitData, PLANET_COLORS, ASPECT_COLORS } from '@/types/astro';
import { Calendar } from 'lucide-react';

interface TransitWheelProps {
  natalChart: ChartData;
  transitDate?: Date;
  onDateChange?: (date: Date) => void;
  className?: string;
}

export const TransitWheel: React.FC<TransitWheelProps> = ({
  natalChart,
  transitDate = new Date(),
  onDateChange,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions] = useState({ width: 600, height: 600 });
  const [selectedDate, setSelectedDate] = useState(transitDate);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  useEffect(() => {
    if (!svgRef.current || !natalChart) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const center = { x: width / 2, y: height / 2 };
    const outerRadius = Math.min(width, height) * 0.4;
    const innerRadius = outerRadius * 0.65;

    const g = svg
      .append('g')
      .attr('transform', `translate(${center.x}, ${center.y})`);

    // Draw zodiac circle
    drawZodiacCircle(g, outerRadius);

    // Convert Record<string, Planet> to array format for drawing helpers
    const natalPlanetsArray = Object.entries(natalChart.planets).map(([name, p]) => ({
      ...p,
      name: name as import('@/types/astro').PlanetName,
      longitude: p.degrees, // map canonical 'degrees' → 'longitude' for drawing
    }));

    // Draw natal planets (inner ring)
    drawPlanets(g, natalPlanetsArray, innerRadius - 30, 'natal');

    // Draw transiting planets (outer ring)
    // Mock transit data for now - will be replaced with real data
    const transitPlanets = natalPlanetsArray.map(p => ({
      ...p,
      longitude: (p.longitude + 45) % 360, // Mock: shift by 45 degrees
    }));
    drawPlanets(g, transitPlanets, outerRadius + 20, 'transit');

    // Draw aspect lines
    drawAspects(g, natalPlanetsArray, transitPlanets, innerRadius - 30, outerRadius + 20);

    // Draw legend
    drawLegend(svg, width, height);
  }, [natalChart, selectedDate, dimensions]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`${className}`}
    >
      <div className="bg-[#0a0a1a] rounded-lg border border-[#1e2d4a] p-6">
        {/* Header with date picker */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[#c9a227] font-semibold text-lg mb-1">
              Transit Wheel
            </h3>
            <p className="text-[#64748b] text-sm">
              Outer: Transiting • Inner: Natal
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-[#64748b]" />
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={handleDateChange}
              className="bg-[#0f1729] border border-[#1e2d4a] text-[#e2e8f0] px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#7c3aed]"
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* SVG */}
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="mx-auto"
        />
      </div>
    </motion.div>
  );
};

function drawZodiacCircle(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  radius: number
) {
  const signs = [
    'Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir',
    'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis',
  ];

  // Zodiac circle
  g.append('circle')
    .attr('r', radius)
    .attr('fill', 'none')
    .attr('stroke', '#1e2d4a')
    .attr('stroke-width', 2);

  // Draw 12 divisions
  signs.forEach((sign, index) => {
    const angle = (index * 30 - 90) * (Math.PI / 180);
    const nextAngle = ((index + 1) * 30 - 90) * (Math.PI / 180);

    // Division line
    g.append('line')
      .attr('x1', radius * Math.cos(angle))
      .attr('y1', radius * Math.sin(angle))
      .attr('x2', (radius + 15) * Math.cos(angle))
      .attr('y2', (radius + 15) * Math.sin(angle))
      .attr('stroke', '#1e2d4a')
      .attr('stroke-width', 1);

    // Sign label
    const labelAngle = (angle + nextAngle) / 2;
    const labelRadius = radius + 35;
    g.append('text')
      .attr('x', labelRadius * Math.cos(labelAngle))
      .attr('y', labelRadius * Math.sin(labelAngle))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .text(sign);
  });
}

function drawPlanets(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  planets: { name: import("@/types/astro").PlanetName; longitude: number; [key: string]: any }[],
  radius: number,
  type: 'natal' | 'transit'
) {
  planets.forEach((planet, index) => {
    const angle = (planet.longitude - 90) * (Math.PI / 180);
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    const planetGroup = g
      .append('g')
      .attr('transform', `translate(${x}, ${y})`);

    // Planet circle
    planetGroup
      .append('circle')
      .attr('r', type === 'natal' ? 12 : 10)
      .attr('fill', PLANET_COLORS[planet.name])
      .attr('opacity', type === 'natal' ? 0.8 : 0.6)
      .attr('stroke', '#0a0a1a')
      .attr('stroke-width', 2);

    // Planet abbreviation
    planetGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#0a0a1a')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text(planet.name.substring(0, 2));

    // Animate entrance
    planetGroup
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay(index * 100)
      .style('opacity', 1);
  });
}

function drawAspects(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  natalPlanets: any[],
  transitPlanets: any[],
  natalRadius: number,
  transitRadius: number
) {
  const aspectsGroup = g.append('g').attr('class', 'aspects');

  natalPlanets.forEach((natalPlanet) => {
    transitPlanets.forEach((transitPlanet) => {
      const diff = Math.abs(natalPlanet.longitude - transitPlanet.longitude);
      const normalizedDiff = Math.min(diff, 360 - diff);

      let aspectType: keyof typeof ASPECT_COLORS | null = null;
      let orb = 0;

      // Check aspects (with 8 degree orb)
      if (normalizedDiff <= 8) {
        aspectType = 'conjunction';
        orb = normalizedDiff;
      } else if (Math.abs(normalizedDiff - 60) <= 6) {
        aspectType = 'sextile';
        orb = Math.abs(normalizedDiff - 60);
      } else if (Math.abs(normalizedDiff - 90) <= 8) {
        aspectType = 'square';
        orb = Math.abs(normalizedDiff - 90);
      } else if (Math.abs(normalizedDiff - 120) <= 8) {
        aspectType = 'trine';
        orb = Math.abs(normalizedDiff - 120);
      } else if (Math.abs(normalizedDiff - 180) <= 8) {
        aspectType = 'opposition';
        orb = Math.abs(normalizedDiff - 180);
      }

      if (aspectType) {
        const natalAngle = (natalPlanet.longitude - 90) * (Math.PI / 180);
        const transitAngle = (transitPlanet.longitude - 90) * (Math.PI / 180);

        const x1 = natalRadius * Math.cos(natalAngle);
        const y1 = natalRadius * Math.sin(natalAngle);
        const x2 = transitRadius * Math.cos(transitAngle);
        const y2 = transitRadius * Math.sin(transitAngle);

        aspectsGroup
          .append('line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2)
          .attr('stroke', ASPECT_COLORS[aspectType])
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3')
          .attr('opacity', 0.4)
          .append('title')
          .text(`${natalPlanet.name} ${aspectType} ${transitPlanet.name} (orb: ${orb.toFixed(1)}°)`);
      }
    });
  });
}

function drawLegend(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  width: number,
  height: number
) {
  const legendData = [
    { type: 'conjunction', color: ASPECT_COLORS.conjunction },
    { type: 'trine', color: ASPECT_COLORS.trine },
    { type: 'sextile', color: ASPECT_COLORS.sextile },
    { type: 'square', color: ASPECT_COLORS.square },
    { type: 'opposition', color: ASPECT_COLORS.opposition },
  ];

  const legend = svg
    .append('g')
    .attr('transform', `translate(${width - 150}, ${height - 150})`);

  legend
    .append('rect')
    .attr('width', 140)
    .attr('height', legendData.length * 25 + 20)
    .attr('fill', '#0f1729')
    .attr('stroke', '#1e2d4a')
    .attr('rx', 4);

  legendData.forEach((item, index) => {
    const y = 15 + index * 25;

    legend
      .append('line')
      .attr('x1', 10)
      .attr('y1', y)
      .attr('x2', 30)
      .attr('y2', y)
      .attr('stroke', item.color)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,3');

    legend
      .append('text')
      .attr('x', 40)
      .attr('y', y)
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '12px')
      .text(item.type);
  });
}
