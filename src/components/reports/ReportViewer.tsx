'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Download, Share2, Clock } from 'lucide-react';
import { Report, Language, ReportType } from '@/types/astro';
import ReactMarkdown from 'react-markdown';

interface ReportViewerProps {
  report: Report;
  onDownloadPDF?: () => void;
  onShare?: () => void;
  className?: string;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  onDownloadPDF,
  onShare,
  className = '',
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Parse markdown content into sections based on H2 headings
  const sections = parseContentIntoSections(report.content);

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(sections.map((s) => s.title)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const reportTypeLabels: Record<ReportType, string> = {
    in_depth: 'In-Depth Horoscope',
    career: 'Career & Business',
    wealth: 'Wealth & Fortune',
    yearly: 'Yearly Horoscope',
    transit_jupiter: 'Jupiter Transit',
    transit_saturn: 'Saturn Transit',
    transit_rahu_ketu: 'Rahu-Ketu Transit',
    numerology: 'Numerology Report',
    gem_recommendation: 'Gem Recommendation',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`bg-[#0a0a1a] rounded-lg border border-[#1e2d4a] ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-[#1e2d4a]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-[#c9a227]">
                {reportTypeLabels[report.type]}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  report.language === 'en'
                    ? 'bg-[#0a84ff20] text-[#0a84ff]'
                    : 'bg-[#34c75920] text-[#34c759]'
                }`}
              >
                {report.language === 'en' ? 'English' : 'हिंदी'}
              </span>
            </div>
            <p className="text-[#64748b] text-sm">
              Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadPDF}
              className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg hover:bg-[#6d28d9] transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              PDF
            </button>
            <button
              onClick={onShare}
              className="px-4 py-2 bg-[#0f1729] text-[#e2e8f0] border border-[#1e2d4a] rounded-lg hover:border-[#7c3aed] transition-colors flex items-center gap-2"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>

        {/* Section controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={expandAll}
            className="text-[#64748b] hover:text-[#e2e8f0] text-sm transition-colors"
          >
            Expand All
          </button>
          <span className="text-[#1e2d4a]">|</span>
          <button
            onClick={collapseAll}
            className="text-[#64748b] hover:text-[#e2e8f0] text-sm transition-colors"
          >
            Collapse All
          </button>
          <span className="text-[#1e2d4a]">|</span>
          <span className="text-[#64748b] text-sm">
            {sections.length} sections
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {sections.map((section, index) => (
          <Section
            key={index}
            section={section}
            isExpanded={expandedSections.has(section.title)}
            onToggle={() => toggleSection(section.title)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-[#1e2d4a] bg-[#0f1729]">
        <div className="flex items-center justify-between text-sm text-[#64748b]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>Model: {report.model}</span>
            </div>
          </div>
          <div>
            Report ID: {report.id.substring(0, 8)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface SectionProps {
  section: { title: string; content: string };
  isExpanded: boolean;
  onToggle: () => void;
}

const Section: React.FC<SectionProps> = ({ section, isExpanded, onToggle }) => {
  return (
    <div className="border border-[#1e2d4a] rounded-lg overflow-hidden">
      {/* Section header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between bg-[#0f1729] hover:bg-[#1e2d4a] transition-colors"
      >
        <h3 className="text-lg font-semibold text-[#e2e8f0]">{section.title}</h3>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-[#64748b]" />
        </motion.div>
      </button>

      {/* Section content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-2xl font-bold text-[#c9a227] mb-4" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-xl font-bold text-[#7c3aed] mb-3" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-[#e2e8f0] mb-4 leading-relaxed" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-inside text-[#e2e8f0] mb-4 space-y-2" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside text-[#e2e8f0] mb-4 space-y-2" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-[#e2e8f0]" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="text-[#c9a227] font-bold" {...props} />
                  ),
                  em: ({ node, ...props }) => (
                    <em className="text-[#7c3aed] italic" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-[#7c3aed] pl-4 italic text-[#64748b] my-4"
                      {...props}
                    />
                  ),
                }}
              >
                {section.content}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function parseContentIntoSections(content: string): Array<{ title: string; content: string }> {
  const lines = content.split('\n');
  const sections: Array<{ title: string; content: string }> = [];
  let currentSection: { title: string; content: string } | null = null;

  for (const line of lines) {
    // Check if line is an H2 heading
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.replace('## ', '').trim(),
        content: '',
      };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // If no sections found, create a single section with all content
  if (sections.length === 0) {
    sections.push({
      title: 'Report',
      content: content,
    });
  }

  return sections;
}
