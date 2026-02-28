'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { ChartData, ChartStyle, HouseNumber, PlanetName, PLANET_COLORS } from '@/types/astro';

interface KundliChartProps {
  chartData: ChartData;
  style?: ChartStyle;
  onHouseClick?: (houseNum: HouseNumber) => void;
  onPlanetClick?: (planet: PlanetName) => void;
  className?: string;
}

export const KundliChart: React.FC<KundliChartProps> = ({
  chartData,
  style = 'north_indian',
  onHouseClick,
  onPlanetClick,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions] = useState({ width: 600, height: 600 });

  useEffect(() => {
    if (!svgRef.current || !chartData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const center = { x: width / 2, y: height / 2 };
    const size = Math.min(width, height) * 0.85;

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${center.x}, ${center.y})`);

    if (style === 'north_indian') {
      renderNorthIndianChart(g, chartData, size, onHouseClick, onPlanetClick);
    } else {
      renderSouthIndianChart(g, chartData, size, onHouseClick, onPlanetClick);
    }
  }, [chartData, style, dimensions, onHouseClick, onPlanetClick]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative ${className}`}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="bg-[#0a0a1a] rounded-lg border border-[#1e2d4a]"
      />
    </motion.div>
  );
};

function renderNorthIndianChart(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  chartData: ChartData,
  size: number,
  onHouseClick?: (houseNum: HouseNumber) => void,
  onPlanetClick?: (planet: PlanetName) => void
) {
  const half = size / 2;

  // North Indian - Diamond layout
  // The outer square has corners at (-half,-half), (half,-half), (half,half), (-half,half).
  // The inner diamond has vertices at (0,-half), (half,0), (0,half), (-half,0).
  // This creates 4 inner triangles (houses 1,4,7,10) and 8 outer triangles (houses 2,3,5,6,8,9,11,12).
  //
  // Standard layout:
  // House 1:  top center (inner triangle between top diamond vertex and top edge of square)
  // House 2:  top-right outer triangle
  // House 3:  right-top outer triangle
  // House 4:  right center (inner triangle between right diamond vertex and right edge)
  // House 5:  right-bottom outer triangle
  // House 6:  bottom-right outer triangle
  // House 7:  bottom center (inner triangle between bottom diamond vertex and bottom edge)
  // House 8:  bottom-left outer triangle
  // House 9:  left-bottom outer triangle
  // House 10: left center (inner triangle between left diamond vertex and left edge)
  // House 11: left-top outer triangle
  // House 12: top-left outer triangle

  const housePositions: Record<number, { x: number; y: number; rotate: number }> = {
    1:  { x: 0,              y: -half * 0.35, rotate: 0 },   // top center triangle
    2:  { x: half * 0.55,    y: -half * 0.78, rotate: 0 },   // top-right corner
    3:  { x: half * 0.78,    y: -half * 0.55, rotate: 0 },   // right-top corner
    4:  { x: half * 0.35,    y: 0,            rotate: 0 },   // right center triangle
    5:  { x: half * 0.78,    y: half * 0.55,  rotate: 0 },   // right-bottom corner
    6:  { x: half * 0.55,    y: half * 0.78,  rotate: 0 },   // bottom-right corner
    7:  { x: 0,              y: half * 0.35,  rotate: 0 },   // bottom center triangle
    8:  { x: -half * 0.55,   y: half * 0.78,  rotate: 0 },   // bottom-left corner
    9:  { x: -half * 0.78,   y: half * 0.55,  rotate: 0 },   // left-bottom corner
    10: { x: -half * 0.35,   y: 0,            rotate: 0 },   // left center triangle
    11: { x: -half * 0.78,   y: -half * 0.55, rotate: 0 },   // left-top corner
    12: { x: -half * 0.55,   y: -half * 0.78, rotate: 0 },   // top-left corner
  };

  // Draw outer square
  const squarePath = `
    M ${-half},${-half}
    L ${half},${-half}
    L ${half},${half}
    L ${-half},${half}
    Z
  `;
  g.append('path')
    .attr('d', squarePath)
    .attr('fill', 'none')
    .attr('stroke', '#1e2d4a')
    .attr('stroke-width', 2);

  // Draw inner diamond (inscribed in the square)
  const diamondPath = `
    M 0,${-half}
    L ${half},0
    L 0,${half}
    L ${-half},0
    Z
  `;
  g.append('path')
    .attr('d', diamondPath)
    .attr('fill', 'none')
    .attr('stroke', '#1e2d4a')
    .attr('stroke-width', 2);

  // Draw diagonal lines connecting square corners to create all 12 house regions
  g.append('line')
    .attr('x1', -half).attr('y1', -half)
    .attr('x2', half).attr('y2', half)
    .attr('stroke', '#1e2d4a')
    .attr('stroke-width', 1);
  g.append('line')
    .attr('x1', half).attr('y1', -half)
    .attr('x2', -half).attr('y2', half)
    .attr('stroke', '#1e2d4a')
    .attr('stroke-width', 1);

  // Render houses (houses is Record<string, House>)
  Object.entries(chartData.houses).forEach(([houseNumStr, house]) => {
    const houseNum = parseInt(houseNumStr, 10);
    const pos = housePositions[houseNum];
    if (!pos) return;

    const houseGroup = g
      .append('g')
      .attr('transform', `translate(${pos.x}, ${pos.y})`)
      .style('cursor', onHouseClick ? 'pointer' : 'default')
      .on('click', () => onHouseClick?.(houseNum as HouseNumber));

    // House number (small, top-left of region)
    houseGroup
      .append('text')
      .attr('x', -15)
      .attr('y', -18)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text(houseNum);

    // Sign abbreviation
    houseGroup
      .append('text')
      .attr('x', 15)
      .attr('y', -18)
      .attr('text-anchor', 'middle')
      .attr('fill', '#c9a227')
      .attr('font-size', '11px')
      .text(house.sign.substring(0, 3));

    // Lagna marker
    if (house.sign === chartData.lagna.sign) {
      houseGroup
        .append('text')
        .attr('x', 0)
        .attr('y', -4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#7c3aed')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text('L');
    }

    // Planets in this house (planets is Record<string, Planet>)
    const planetsInHouse = Object.entries(chartData.planets)
      .filter(([, p]) => p.house === houseNum)
      .map(([name]) => name as PlanetName);

    planetsInHouse.forEach((planetName, index) => {
      const planet = chartData.planets[planetName];
      const col = index % 2;
      const row = Math.floor(index / 2);
      const planetGroup = houseGroup
        .append('g')
        .attr('transform', `translate(${-10 + col * 20}, ${8 + row * 16})`)
        .style('cursor', onPlanetClick ? 'pointer' : 'default')
        .on('click', (event) => {
          event.stopPropagation();
          onPlanetClick?.(planetName);
        });

      // Planet abbreviation
      planetGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', PLANET_COLORS[planetName])
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(planetName.substring(0, 2));

      // Retrograde marker
      if (planet.retrograde) {
        planetGroup
          .append('text')
          .attr('x', 10)
          .attr('y', -4)
          .attr('fill', '#ff3b30')
          .attr('font-size', '9px')
          .text('\u211E');
      }

      // Animate planet entrance
      planetGroup
        .style('opacity', 0)
        .transition()
        .duration(800)
        .delay(index * 100)
        .style('opacity', 1)
        .ease(d3.easeBounceOut);
    });
  });
}

function renderSouthIndianChart(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  chartData: ChartData,
  size: number,
  onHouseClick?: (houseNum: HouseNumber) => void,
  onPlanetClick?: (planet: PlanetName) => void
) {
  const cellSize = size / 4;
  const startX = -size / 2;
  const startY = -size / 2;

  // South Indian - 4x4 grid with diagonal
  // Fixed house layout (doesn't rotate)
  const houseLayout = [
    [12, 1, 2, 3],
    [11, null, null, 4],
    [10, null, null, 5],
    [9, 8, 7, 6],
  ];

  // Draw grid
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = startX + col * cellSize;
      const y = startY + row * cellSize;

      // Cell background
      g.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', 'none')
        .attr('stroke', '#1e2d4a')
        .attr('stroke-width', 2);

      const houseNum = houseLayout[row][col];
      if (houseNum === null) continue;

      const house = chartData.houses[houseNum.toString()];
      if (!house) continue;

      const houseGroup = g
        .append('g')
        .style('cursor', onHouseClick ? 'pointer' : 'default')
        .on('click', () => onHouseClick?.(houseNum as HouseNumber));

      // House number
      houseGroup
        .append('text')
        .attr('x', x + 10)
        .attr('y', y + 20)
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(houseNum);

      // Sign
      houseGroup
        .append('text')
        .attr('x', x + cellSize - 10)
        .attr('y', y + 20)
        .attr('text-anchor', 'end')
        .attr('fill', '#c9a227')
        .attr('font-size', '11px')
        .text(house.sign.substring(0, 3));

      // Lagna marker
      if (house.sign === chartData.lagna.sign) {
        houseGroup
          .append('text')
          .attr('x', x + cellSize / 2)
          .attr('y', y + 35)
          .attr('text-anchor', 'middle')
          .attr('fill', '#7c3aed')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .text('L');
      }

      // Planets in this house (planets is Record<string, Planet>)
      const planetsInHouse = Object.entries(chartData.planets)
        .filter(([, p]) => p.house === houseNum)
        .map(([name]) => name as PlanetName);

      planetsInHouse.forEach((planetName, index) => {
        const planet = chartData.planets[planetName];
        const planetGroup = houseGroup
          .append('g')
          .style('cursor', onPlanetClick ? 'pointer' : 'default')
          .on('click', (event) => {
            event.stopPropagation();
            onPlanetClick?.(planetName);
          });

        const planetX = x + 10 + (index % 2) * 30;
        const planetY = y + 50 + Math.floor(index / 2) * 18;

        planetGroup
          .append('text')
          .attr('x', planetX)
          .attr('y', planetY)
          .attr('fill', PLANET_COLORS[planetName])
          .attr('font-size', '13px')
          .attr('font-weight', 'bold')
          .text(planetName.substring(0, 2));

        if (planet.retrograde) {
          planetGroup
            .append('text')
            .attr('x', planetX + 12)
            .attr('y', planetY - 5)
            .attr('fill', '#ff3b30')
            .attr('font-size', '9px')
            .text('℞');
        }

        // Animate entrance
        planetGroup
          .style('opacity', 0)
          .transition()
          .duration(800)
          .delay(index * 100)
          .style('opacity', 1)
          .ease(d3.easeBounceOut);
      });
    }
  }

  // Draw center diagonal lines
  const centerStart = startX + cellSize;
  const centerEnd = startX + 3 * cellSize;
  g.append('line')
    .attr('x1', centerStart).attr('y1', centerStart)
    .attr('x2', centerEnd).attr('y2', centerEnd)
    .attr('stroke', '#1e2d4a')
    .attr('stroke-width', 2);
  g.append('line')
    .attr('x1', centerEnd).attr('y1', centerStart)
    .attr('x2', centerStart).attr('y2', centerEnd)
    .attr('stroke', '#1e2d4a')
    .attr('stroke-width', 2);
}
