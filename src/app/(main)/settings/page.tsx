"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Check } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import ModelSelector, { type ModelSelection } from "@/components/model-selector";
import { DEFAULT_PROVIDER, DEFAULT_MODEL } from "@/lib/llm/constants";
import type { LLMProvider } from "@/lib/llm/constants";

interface UserPrefs {
  ayanamsha: string;
  chart_style: string;
  default_language: string;
  preferred_provider: LLMProvider;
  preferred_model: string;
  alert_enabled: boolean;
  alert_orb: number;
  whatsapp_digest_enabled: boolean;
  email_digest_enabled: boolean;
  email_digest_day: string;
}

const DEFAULT_PREFS: UserPrefs = {
  ayanamsha: "lahiri",
  chart_style: "north_indian",
  default_language: "en",
  preferred_provider: DEFAULT_PROVIDER,
  preferred_model: DEFAULT_MODEL,
  alert_enabled: true,
  alert_orb: 2.0,
  whatsapp_digest_enabled: false,
  email_digest_enabled: false,
  email_digest_day: "sunday",
};

export default function SettingsPage() {
  const supabase = createBrowserClient();
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setPrefs({
          ayanamsha: data.ayanamsha || DEFAULT_PREFS.ayanamsha,
          chart_style: data.chart_style || DEFAULT_PREFS.chart_style,
          default_language: data.default_language || DEFAULT_PREFS.default_language,
          preferred_provider: (data.preferred_provider as LLMProvider) || DEFAULT_PREFS.preferred_provider,
          preferred_model: data.preferred_model || DEFAULT_PREFS.preferred_model,
          alert_enabled: data.alert_enabled ?? DEFAULT_PREFS.alert_enabled,
          alert_orb: data.alert_orb ?? DEFAULT_PREFS.alert_orb,
          whatsapp_digest_enabled: data.whatsapp_digest_enabled ?? DEFAULT_PREFS.whatsapp_digest_enabled,
          email_digest_enabled: data.email_digest_enabled ?? DEFAULT_PREFS.email_digest_enabled,
          email_digest_day: data.email_digest_day || DEFAULT_PREFS.email_digest_day,
        });
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_preferences").upsert(
      { user_id: user.id, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = <K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleModelChange = (selection: ModelSelection) => {
    setPrefs((prev) => ({
      ...prev,
      preferred_provider: selection.provider,
      preferred_model: selection.model,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and account</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition disabled:opacity-50"
        >
          {saved ? (
            <><Check className="w-4 h-4" /> Saved</>
          ) : saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Calculation Preferences */}
        <div className="glass rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Calculation Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Ayanamsha</label>
              <select value={prefs.ayanamsha} onChange={(e) => update("ayanamsha", e.target.value)} className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="lahiri">Lahiri (Chitrapaksha)</option>
                <option value="raman">Raman</option>
                <option value="krishnamurti">Krishnamurti (KP)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chart Style</label>
              <select value={prefs.chart_style} onChange={(e) => update("chart_style", e.target.value)} className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="north_indian">North Indian</option>
                <option value="south_indian">South Indian</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Model Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModelSelector
            value={{
              provider: prefs.preferred_provider,
              model: prefs.preferred_model,
            }}
            onChange={handleModelChange}
          />

          {/* Language */}
          <div className="glass rounded-lg p-6">
            <h3 className="text-sm font-semibold mb-4">Language</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Default Report Language</label>
              <select
                value={prefs.default_language}
                onChange={(e) => update("default_language", e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Choose the default language for AI-generated reports and chat responses
              </p>
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="glass rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Alerts & Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Transit Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified about significant transits</p>
              </div>
              <input type="checkbox" checked={prefs.alert_enabled} onChange={(e) => update("alert_enabled", e.target.checked)} className="w-5 h-5 rounded accent-primary" />
            </label>
            {prefs.alert_enabled && (
              <div>
                <label className="block text-sm font-medium mb-2">Alert Orb: {prefs.alert_orb}°</label>
                <input type="range" min={0.5} max={5} step={0.5} value={prefs.alert_orb} onChange={(e) => update("alert_orb", parseFloat(e.target.value))} className="w-full accent-primary" />
              </div>
            )}
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Digest</p>
                <p className="text-sm text-muted-foreground">Weekly summary via email</p>
              </div>
              <input type="checkbox" checked={prefs.email_digest_enabled} onChange={(e) => update("email_digest_enabled", e.target.checked)} className="w-5 h-5 rounded accent-primary" />
            </label>
            {prefs.email_digest_enabled && (
              <div>
                <label className="block text-sm font-medium mb-2">Delivery Day</label>
                <select value={prefs.email_digest_day} onChange={(e) => update("email_digest_day", e.target.value)} className="px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="sunday">Sunday</option>
                  <option value="monday">Monday</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
