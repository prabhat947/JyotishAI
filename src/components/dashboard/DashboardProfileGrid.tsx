'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProfileCard } from './ProfileCard';
import type { Profile, Relation } from '@/types/astro';

interface SupabaseProfile {
  id: string;
  user_id: string;
  name: string;
  relation: string | null;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  latitude: number;
  longitude: number;
  timezone: string;
  chart_data: unknown;
  photo_url?: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

interface DashboardProfileGridProps {
  profiles: SupabaseProfile[];
}

export default function DashboardProfileGrid({ profiles }: DashboardProfileGridProps) {
  const router = useRouter();

  const mapToProfile = (p: SupabaseProfile): Profile => ({
    id: p.id,
    userId: p.user_id,
    name: p.name,
    relation: (p.relation || 'other') as Relation,
    birthData: {
      name: p.name,
      dateOfBirth: new Date(p.birth_date),
      timeOfBirth: p.birth_time,
      placeOfBirth: p.birth_place,
      latitude: p.latitude,
      longitude: p.longitude,
      timezone: p.timezone || 'Asia/Kolkata',
    },
    chartData: p.chart_data ? (p.chart_data as any) : undefined,
    photoUrl: p.photo_url ?? undefined,
    createdAt: new Date(p.created_at ?? Date.now()),
    updatedAt: new Date(p.updated_at ?? p.created_at ?? Date.now()),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {profiles.map((p) => (
        <ProfileCard
          key={p.id}
          profile={mapToProfile(p)}
          onViewChart={() => router.push(`/profile/${p.id}`)}
          onGenerateReport={() => router.push(`/profile/${p.id}/reports`)}
        />
      ))}
    </div>
  );
}
