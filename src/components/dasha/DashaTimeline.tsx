'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { DashaPeriod, CurrentDasha, DashaBalance, PlanetName, PLANET_COLORS } from '@/types/astro';

interface DashaData {
  balance_at_birth: DashaBalance;
  sequence: DashaPeriod[];
  current: CurrentDasha;
}

interface DashaTimelineProps {
  dashas: DashaData;
  currentDate?: Date;
  onPeriodClick?: (period: DashaPeriod) => void;
  className?: string;
}

export const DashaTimeline: React.FC<DashaTimelineProps> = ({
  dashas,
  currentDate = new Date(),
  onPeriodClick,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 300 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 300,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !dashas.sequence.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 40, right: 20, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Time scale
    const allDashas = dashas.sequence;
    const minDate = d3.min(allDashas, d => new Date(d.start)) || new Date();
    const maxDate = d3.max(allDashas, d => new Date(d.end)) || new Date();

    const xScale = d3
      .scaleTime()
      .domain([minDate, maxDate])
      .range([0, innerWidth]);

    // Draw X axis
    const xAxis = d3.axisBottom(xScale).ticks(10);
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '12px');

    g.selectAll('.domain, .tick line')
      .attr('stroke', '#1e2d4a');

    // Mahadasha blocks
    const mahadashaHeight = innerHeight * 0.4;
    allDashas.forEach((mahadasha, index) => {
      const startX = xScale(new Date(mahadasha.start));
      const endX = xScale(new Date(mahadasha.end));
      const blockWidth = endX - startX;

      const mahadashaGroup = g
        .append('g')
        .style('cursor', onPeriodClick ? 'pointer' : 'default')
        .on('click', () => onPeriodClick?.(mahadasha));

      // Mahadasha block
      mahadashaGroup
        .append('rect')
        .attr('x', startX)
        .attr('y', 20)
        .attr('width', blockWidth)
        .attr('height', mahadashaHeight)
        .attr('fill', PLANET_COLORS[mahadasha.planet as PlanetName] ?? '#64748b')
        .attr('opacity', 0.3)
        .attr('stroke', PLANET_COLORS[mahadasha.planet as PlanetName] ?? '#64748b')
        .attr('stroke-width', 2)
        .attr('rx', 4)
        .on('mouseenter', function () {
          d3.select(this).attr('opacity', 0.5);
        })
        .on('mouseleave', function () {
          d3.select(this).attr('opacity', 0.3);
        });

      // Mahadasha label
      if (blockWidth > 50) {
        mahadashaGroup
          .append('text')
          .attr('x', startX + blockWidth / 2)
          .attr('y', 20 + mahadashaHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#e2e8f0')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .style('pointer-events', 'none')
          .text(mahadasha.planet);
      }

      // Animate block entrance
      mahadashaGroup
        .select('rect')
        .attr('width', 0)
        .transition()
        .duration(1000)
        .delay(index * 100)
        .attr('width', blockWidth)
        .ease(d3.easeElasticOut);
    });

    // Current date marker
    const currentX = xScale(currentDate);
    if (currentX >= 0 && currentX <= innerWidth) {
      const markerGroup = g.append('g');

      // Pulsing line
      markerGroup
        .append('line')
        .attr('x1', currentX)
        .attr('y1', 0)
        .attr('x2', currentX)
        .attr('y2', innerHeight + 20)
        .attr('stroke', '#c9a227')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '5,5')
        .style('opacity', 0.8);

      // Pulse animation
      markerGroup
        .select('line')
        .transition()
        .duration(1500)
        .ease(d3.easeSinInOut)
        .style('opacity', 0.3)
        .transition()
        .duration(1500)
        .ease(d3.easeSinInOut)
        .style('opacity', 0.8)
        .on('end', function repeat() {
          d3.select(this)
            .transition()
            .duration(1500)
            .ease(d3.easeSinInOut)
            .style('opacity', 0.3)
            .transition()
            .duration(1500)
            .ease(d3.easeSinInOut)
            .style('opacity', 0.8)
            .on('end', repeat);
        });

      // Current marker circle
      markerGroup
        .append('circle')
        .attr('cx', currentX)
        .attr('cy', -10)
        .attr('r', 8)
        .attr('fill', '#c9a227')
        .attr('stroke', '#0a0a1a')
        .attr('stroke-width', 2);

      // "Today" label
      markerGroup
        .append('text')
        .attr('x', currentX)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#c9a227')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text('Today');
    }

    // Current dasha info
    const currentInfo = `Current: ${dashas.current.mahadasha}-${dashas.current.antardasha} (until ${new Date(
      dashas.current.antardasha_end
    ).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`;

    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#7c3aed')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(currentInfo);

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      .on('zoom', (event) => {
        g.attr('transform', `translate(${margin.left}, ${margin.top}) ${event.transform}`);
      });

    svg.call(zoom);
  }, [dashas, currentDate, dimensions, onPeriodClick]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full ${className}`}
    >
      <div className="bg-[#0a0a1a] rounded-lg border border-[#1e2d4a] p-4">
        <div className="mb-4">
          <h3 className="text-[#c9a227] font-semibold text-lg mb-1">
            Vimshottari Dasha Timeline
          </h3>
          <p className="text-[#64748b] text-sm">
            Scroll to zoom • Click any period for details
          </p>
        </div>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full"
        />
      </div>
    </motion.div>
  );
};
