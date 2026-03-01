'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { ReportViewer } from '@/components/reports/ReportViewer';
import type { Report, ReportType, Language } from '@/types/astro';

export default function ReportViewPage() {
  const params = useParams();
  const profileId = params.id as string;
  const reportId = params.reportId as string;
  const supabase = createBrowserClient();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamContent, setStreamContent] = useState('');

  const buildReport = useCallback((data: Record<string, unknown>): Report => ({
    id: data.id as string,
    profileId: data.profile_id as string,
    type: data.report_type as ReportType,
    language: ((data.language as string) || 'en') as Language,
    model: (data.model_used as string) || 'unknown',
    content: (data.content as string) || '',
    generatedAt: new Date((data.created_at as string) ?? Date.now()),
    isFavorite: (data.is_favorite as boolean) || false,
  }), []);

  useEffect(() => {
    async function fetchReport() {
      const { data, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (fetchError || !data) {
        setError('Report not found');
        setLoading(false);
        return;
      }

      const reportData = buildReport(data);

      if (data.generation_status === 'generating') {
        setStreamContent(data.content || '');
        setLoading(false);
        pollForCompletion(reportData);
      } else {
        setReport(reportData);
        setLoading(false);
      }
    }

    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const pollForCompletion = async (initialReport: Report) => {
    const maxAttempts = 150; // 5 minutes at 2s intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;

      const { data } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (!data) break;

      if (data.content) {
        setStreamContent(data.content);
      }

      if (data.generation_status === 'complete' || data.generation_status === 'failed') {
        setReport({ ...initialReport, content: data.content || '' });
        return;
      }
    }

    // Timeout — show whatever we have
    setReport(initialReport);
  };

  const handleDownloadPDF = () => {
    window.open(`/api/v1/reports/${reportId}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Link
          href={`/profile/${profileId}/reports`}
          className="text-primary hover:underline"
        >
          Back to Reports
        </Link>
      </div>
    );
  }

  // If report is still generating, show streaming view
  if (!report && streamContent) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`/profile/${profileId}/reports`}
            className="p-2 rounded-md hover:bg-muted/50 transition text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Report Generating...</h1>
            <p className="text-muted-foreground text-sm">Please wait while the report is being generated</p>
          </div>
        </div>
        <div className="glass rounded-lg p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Generating report content...</span>
          </div>
          <div className="bg-card rounded-lg p-4 md:p-6 border border-border max-h-[70vh] overflow-y-auto">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {streamContent}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Empty content fallback
  if (!report || !report.content || report.content.trim() === '') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`/profile/${profileId}/reports`}
            className="p-2 rounded-md hover:bg-muted/50 transition text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Report Content Unavailable</h1>
            <p className="text-muted-foreground text-sm">The report may not have generated correctly.</p>
          </div>
        </div>
        <div className="glass rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">No content found for this report. Try regenerating it.</p>
          <Link
            href={`/profile/${profileId}/reports`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition"
          >
            Back to Reports
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/profile/${profileId}/reports`}
          className="p-2 rounded-md hover:bg-muted/50 transition text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            <Link href={`/profile/${profileId}/reports`} className="hover:text-foreground transition">
              Reports
            </Link>
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download</span> PDF
        </button>
      </div>

      {/* Report Content */}
      <ReportViewer
        report={report}
        onDownloadPDF={handleDownloadPDF}
      />
    </motion.div>
  );
}
