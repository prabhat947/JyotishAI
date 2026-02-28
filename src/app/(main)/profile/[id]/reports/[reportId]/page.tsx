'use client';

import React, { useState, useEffect } from 'react';
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

      const reportData: Report = {
        id: data.id,
        profileId: data.profile_id,
        type: data.report_type as ReportType,
        language: (data.language || 'en') as Language,
        model: data.model_used || 'unknown',
        content: data.content || '',
        generatedAt: new Date(data.created_at ?? Date.now()),
        isFavorite: data.is_favorite || false,
      };

      // If still generating, set up SSE to watch it complete
      if (data.generation_status === 'generating') {
        setStreamContent(data.content || '');
        watchGeneration(reportData);
      } else {
        setReport(reportData);
      }

      setLoading(false);
    }

    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const watchGeneration = async (initialReport: Report) => {
    try {
      const response = await fetch(`/api/v1/reports/${reportId}/stream`);
      if (!response.ok) {
        // Stream not available, just use current content
        setReport(initialReport);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = initialReport.content || '';

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
              setReport({ ...initialReport, content: fullContent });
              return;
            }
          } catch {
            // SSE parse error, skip
          }
        }
      }

      setReport({ ...initialReport, content: fullContent });
    } catch {
      setReport(initialReport);
    }
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
        <div className="glass rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Streaming report content...</span>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border max-h-[70vh] overflow-y-auto">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {streamContent}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Report not found</p>
        <Link
          href={`/profile/${profileId}/reports`}
          className="text-primary hover:underline"
        >
          Back to Reports
        </Link>
      </div>
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
          Download PDF
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
