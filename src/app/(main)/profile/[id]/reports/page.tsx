'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, Eye, RefreshCw, Loader2, Globe, Languages } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { ReportType, Language } from '@/types/astro';

const REPORT_TYPES: {
  id: ReportType;
  label: string;
  description: string;
  icon: string;
}[] = [
  { id: 'in_depth', label: 'In-Depth Horoscope', description: 'Complete life analysis', icon: '\uD83D\uDCDC' },
  { id: 'career', label: 'Career & Business', description: 'Career aptitude & business potential', icon: '\uD83D\uDCBC' },
  { id: 'wealth', label: 'Wealth & Fortune', description: 'Dhana yogas & investment periods', icon: '\uD83D\uDCB0' },
  { id: 'yearly', label: 'Yearly Horoscope', description: 'Month-by-month predictions', icon: '\uD83D\uDCC5' },
  { id: 'transit_jupiter', label: 'Jupiter Transit', description: 'Jupiter transit effects', icon: '\uD83E\uDE90' },
  { id: 'transit_saturn', label: 'Saturn Transit', description: 'Sade Sati & Saturn effects', icon: '\u2696\uFE0F' },
  { id: 'transit_rahu_ketu', label: 'Rahu-Ketu Transit', description: 'Nodal axis karmic themes', icon: '\uD83C\uDF11' },
  { id: 'numerology', label: 'Numerology Report', description: 'Birth number & destiny analysis', icon: '\uD83D\uDD22' },
  { id: 'gem_recommendation', label: 'Gem Recommendation', description: 'Shadbala & gem analysis', icon: '\uD83D\uDC8E' },
];

interface ReportRow {
  id: string;
  profile_id: string;
  report_type: string;
  language: string;
  model_used: string | null;
  content: string | null;
  generation_status: string | null;
  created_at: string | null;
}

export default function ProfileReportsPage() {
  const params = useParams();
  const profileId = params.id as string;
  const supabase = createBrowserClient();

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [model, setModel] = useState<'claude' | 'gemini'>('claude');
  const [generatingType, setGeneratingType] = useState<ReportType | null>(null);
  const [streamContent, setStreamContent] = useState('');
  const [profileName, setProfileName] = useState('');

  const fetchReports = useCallback(async () => {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });
    if (data) setReports(data as ReportRow[]);
    setLoading(false);
  }, [profileId, supabase]);

  useEffect(() => {
    fetchReports();
    // Fetch profile name
    supabase
      .from('profiles')
      .select('name')
      .eq('id', profileId)
      .single()
      .then(({ data }) => {
        if (data) setProfileName(data.name);
      });
  }, [profileId, supabase, fetchReports]);

  const getReportForType = (type: ReportType) => {
    return reports.find((r) => r.report_type === type);
  };

  const handleGenerate = async (reportType: ReportType) => {
    setGeneratingType(reportType);
    setStreamContent('');

    try {
      const response = await fetch('/api/v1/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          reportType,
          language,
          model: model === 'claude' ? 'claude-sonnet-4-5' : 'gemini-2.0-flash',
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullContent += data.content;
              setStreamContent(fullContent);
            }
            if (data.done) {
              // Report is complete
              break;
            }
          } catch {
            // SSE parse error, skip
          }
        }
      }

      // Refresh list
      await fetchReports();
    } catch (err) {
      console.error('Report generation error:', err);
    } finally {
      setGeneratingType(null);
      setStreamContent('');
    }
  };

  const handleDownloadPDF = async (reportId: string) => {
    window.open(`/api/v1/reports/${reportId}/pdf`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/profile/${profileId}`}
          className="p-2 rounded-md hover:bg-muted/50 transition text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-0.5">Reports</h1>
          <p className="text-muted-foreground text-sm">
            {profileName && <span>{profileName} &mdash; </span>}
            Generate and view horoscope reports
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Language Toggle */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 text-sm font-medium transition ${
                language === 'en'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1.5 text-sm font-medium transition ${
                language === 'hi'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              Hindi
            </button>
          </div>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-muted-foreground" />
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setModel('claude')}
              className={`px-3 py-1.5 text-sm font-medium transition ${
                model === 'claude'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              Claude
            </button>
            <button
              onClick={() => setModel('gemini')}
              className={`px-3 py-1.5 text-sm font-medium transition ${
                model === 'gemini'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              Gemini
            </button>
          </div>
        </div>
      </div>

      {/* Streaming Progress */}
      <AnimatePresence>
        {generatingType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="glass rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <h3 className="text-lg font-semibold">
                  Generating {REPORT_TYPES.find((r) => r.id === generatingType)?.label}...
                </h3>
              </div>
              <div className="bg-card rounded-lg p-4 border border-border max-h-64 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-wrap font-mono">
                  {streamContent || 'Starting generation...'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reports Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TYPES.map((type) => {
            const existingReport = getReportForType(type.id);
            const isGenerating = generatingType === type.id;

            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`glass rounded-lg p-5 transition ${
                  isGenerating ? 'ring-2 ring-primary/50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-2xl mb-2 block">{type.icon}</span>
                    <h3 className="text-base font-semibold">{type.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {type.description}
                    </p>
                  </div>
                </div>

                {existingReport ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          existingReport.language === 'en'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        {existingReport.language === 'en' ? 'EN' : 'HI'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(existingReport.created_at ?? Date.now()).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/profile/${profileId}/reports/${existingReport.id}`}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-secondary/20 text-secondary rounded-md text-xs font-medium hover:bg-secondary/30 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                      <button
                        onClick={() => handleDownloadPDF(existingReport.id)}
                        className="flex items-center justify-center gap-1 px-3 py-2 border border-border rounded-md text-xs font-medium hover:bg-muted/50 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                      <button
                        onClick={() => handleGenerate(type.id)}
                        disabled={isGenerating}
                        className="flex items-center justify-center gap-1 px-3 py-2 border border-border rounded-md text-xs font-medium hover:bg-muted/50 transition disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleGenerate(type.id)}
                    disabled={isGenerating}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate'
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
