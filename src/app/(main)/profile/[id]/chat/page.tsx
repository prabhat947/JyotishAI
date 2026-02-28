'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { ChatInterface } from '@/components/chat/ChatInterface';
import type { ChatMessage, Profile } from '@/types/astro';

export default function ProfileChatPage() {
  const params = useParams();
  const profileId = params.id as string;
  const supabase = createBrowserClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }

      // Map to Profile type
      const profileMapped: Profile = {
        id: profileData.id,
        userId: profileData.user_id,
        name: profileData.name,
        relation: (profileData.relation || 'other') as import('@/types/astro').Relation,
        birthData: {
          name: profileData.name,
          dateOfBirth: new Date(profileData.birth_date),
          timeOfBirth: profileData.birth_time,
          placeOfBirth: profileData.birth_place,
          latitude: profileData.latitude,
          longitude: profileData.longitude,
          timezone: profileData.timezone || 'Asia/Kolkata',
        },
        chartData: profileData.chart_data ? (profileData.chart_data as any) : undefined,
        createdAt: new Date(profileData.created_at ?? Date.now()),
        updatedAt: new Date(profileData.updated_at ?? profileData.created_at ?? Date.now()),
      };
      setProfile(profileMapped);

      // Fetch or create chat session
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1);

      let sid: string;

      if (sessions && sessions.length > 0) {
        sid = sessions[0].id;
      } else {
        // Create new session
        const { data: newSession } = await supabase
          .from('chat_sessions')
          .insert({ profile_id: profileId })
          .select()
          .single();

        sid = newSession?.id ?? '';
      }

      setSessionId(sid);

      // Fetch existing messages
      if (sid) {
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sid)
          .order('created_at', { ascending: true });

        if (messages) {
          setInitialMessages(
            messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              sources: m.sources || undefined,
              createdAt: new Date(m.created_at),
            }))
          );
        }
      }

      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Profile not found</p>
        <Link href="/dashboard" className="text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <Link
          href={`/profile/${profileId}`}
          className="p-2 rounded-md hover:bg-muted/50 transition text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">AI Chart Chat</h1>
          <p className="text-muted-foreground text-sm">{profile.name}</p>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 min-h-0">
        <ChatInterface
          profile={profile}
          profileId={profileId}
          sessionId={sessionId ?? undefined}
          initialMessages={initialMessages}
          className="h-full"
        />
      </div>
    </motion.div>
  );
}
