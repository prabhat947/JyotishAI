"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Search,
  Loader2,
  Check,
  Sparkles,
  Zap,
  Globe,
  AlertTriangle,
  Key,
} from "lucide-react";
import {
  type LLMProvider,
  type ModelFidelity,
  GEMINI_MODELS,
  RECOMMENDED_MODELS,
  FIDELITY_COLORS,
  getModelFidelity,
  DEFAULT_MODEL,
  DEFAULT_OPENROUTER_MODEL,
} from "@/lib/llm/constants";
import {
  type ModelWithFidelity,
  getAvailableModels,
  searchModels,
  sortByFidelity,
} from "@/lib/llm/openrouter-models";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ModelSelection {
  provider: LLMProvider;
  model: string;
}

interface ModelSelectorProps {
  /** Current selection */
  value: ModelSelection;
  /** Called when selection changes */
  onChange: (selection: ModelSelection) => void;
  /** Compact mode — just a button that opens the full selector */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ModelSelector({
  value,
  onChange,
  compact = false,
  className = "",
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProvider] = useState<LLMProvider>(value.provider);
  const [selectedModel, setSelectedModel] = useState(value.model);
  const [searchQuery, setSearchQuery] = useState("");

  // OpenRouter models (fetched lazily)
  const [openRouterModels, setOpenRouterModels] = useState<ModelWithFidelity[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Sync external value changes
  useEffect(() => {
    setProvider(value.provider);
    setSelectedModel(value.model);
  }, [value.provider, value.model]);

  // Fetch OpenRouter models when needed
  const fetchModels = useCallback(async () => {
    if (openRouterModels.length > 0) return; // Already loaded
    setLoadingModels(true);
    try {
      const models = await getAvailableModels();
      setOpenRouterModels(sortByFidelity(models));
    } catch (error) {
      console.error("Failed to fetch models:", error);
    } finally {
      setLoadingModels(false);
    }
  }, [openRouterModels.length]);

  useEffect(() => {
    if (isOpen && provider === "openrouter") {
      fetchModels();
    }
  }, [isOpen, provider, fetchModels]);

  // Handle selection
  const handleSelect = (model: string) => {
    setSelectedModel(model);
    onChange({ provider, model });
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleProviderSwitch = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    // Auto-select default model for the new provider
    const defaultModel =
      newProvider === "google" ? DEFAULT_MODEL : DEFAULT_OPENROUTER_MODEL;
    setSelectedModel(defaultModel);
    onChange({ provider: newProvider, model: defaultModel });
  };

  // Current model display info
  const currentFidelity = getModelFidelity(selectedModel);
  const displayName = getDisplayName(selectedModel);

  // Filtered models for search
  const filteredOpenRouterModels = searchQuery
    ? searchModels(openRouterModels, searchQuery)
    : openRouterModels;

  // ---------------------------------------------------------------------------
  // Compact mode — just a trigger button
  // ---------------------------------------------------------------------------

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted/50 transition text-sm"
        >
          <ProviderIcon provider={provider} className="w-3.5 h-3.5" />
          <span className="font-medium">{displayName}</span>
          <FidelityBadge fidelity={currentFidelity} size="sm" />
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <ModelDropdown
              provider={provider}
              selectedModel={selectedModel}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onProviderSwitch={handleProviderSwitch}
              onSelect={handleSelect}
              onClose={() => { setIsOpen(false); setSearchQuery(""); }}
              openRouterModels={filteredOpenRouterModels}
              loadingModels={loadingModels}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Full mode — embedded card with provider tabs + model list
  // ---------------------------------------------------------------------------

  return (
    <div className={`glass rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold mb-3">AI Model</h3>

        {/* Provider tabs */}
        <div className="flex rounded-md border border-border overflow-hidden">
          <button
            onClick={() => handleProviderSwitch("google")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition ${
              provider === "google"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Google Gemini
          </button>
          <button
            onClick={() => handleProviderSwitch("openrouter")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition ${
              provider === "openrouter"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="w-4 h-4" />
            OpenRouter
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {provider === "google" ? (
          <GeminiModelList
            selectedModel={selectedModel}
            onSelect={handleSelect}
          />
        ) : (
          <OpenRouterModelList
            models={filteredOpenRouterModels}
            selectedModel={selectedModel}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelect={handleSelect}
            loading={loadingModels}
          />
        )}

        {/* Current selection summary */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ProviderIcon provider={provider} className="w-4 h-4" />
            <span className="text-sm font-medium">{displayName}</span>
          </div>
          <FidelityBadge fidelity={currentFidelity} />
        </div>

        {/* Low fidelity warning */}
        {currentFidelity.score < 70 && (
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-md bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400">
              This model may produce lower quality astrology reports. Consider
              using a higher-fidelity model for detailed analyses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GeminiModelList({
  selectedModel,
  onSelect,
}: {
  selectedModel: string;
  onSelect: (model: string) => void;
}) {
  return (
    <div className="space-y-2">
      {/* Recommended banner */}
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground">
          Direct Google API — free tier available
        </span>
      </div>

      {GEMINI_MODELS.map((model) => {
        const fidelity = getModelFidelity(model.id);
        const isSelected = selectedModel === model.id;

        return (
          <button
            key={model.id}
            onClick={() => onSelect(model.id)}
            className={`w-full flex items-start gap-3 p-3 rounded-md text-left transition ${
              isSelected
                ? "bg-primary/10 border border-primary/30"
                : "bg-card border border-border hover:border-primary/20 hover:bg-muted/30"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{model.name}</span>
                <FidelityBadge fidelity={fidelity} size="sm" />
                {model.freePerDay && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                    {model.freePerDay}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {model.description}
              </p>
            </div>
            {isSelected && <Check className="w-4 h-4 text-primary shrink-0 mt-1" />}
          </button>
        );
      })}
    </div>
  );
}

function OpenRouterModelList({
  models,
  selectedModel,
  searchQuery,
  onSearchChange,
  onSelect,
  loading,
}: {
  models: ModelWithFidelity[];
  selectedModel: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (model: string) => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-3">
      {/* Info banner */}
      <div className="flex items-center gap-2">
        <Key className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Requires OpenRouter API key — access any model
        </span>
      </div>

      {/* Recommended quick-picks */}
      <div className="flex flex-wrap gap-2">
        {RECOMMENDED_MODELS.filter((m) => m.provider === "openrouter").map((rec) => (
          <button
            key={rec.id}
            onClick={() => onSelect(rec.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
              selectedModel === rec.id
                ? "bg-primary/20 border border-primary/40 text-primary"
                : "bg-card border border-border hover:border-primary/20"
            }`}
          >
            <span>{rec.badge}</span>
            <span>{rec.name}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Model list */}
      <div className="max-h-60 overflow-y-auto space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading models...</span>
          </div>
        ) : models.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No models found matching &ldquo;{searchQuery}&rdquo;
          </p>
        ) : (
          models.slice(0, 50).map((model) => {
            const isSelected = selectedModel === model.id;
            return (
              <button
                key={model.id}
                onClick={() => onSelect(model.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition text-sm ${
                  isSelected
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/30"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{model.name || model.id}</span>
                    <FidelityBadge fidelity={model.fidelity} size="sm" />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{model.id}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/** Floating dropdown (for compact mode) */
function ModelDropdown({
  provider,
  selectedModel,
  searchQuery,
  onSearchChange,
  onProviderSwitch,
  onSelect,
  onClose,
  openRouterModels,
  loadingModels,
}: {
  provider: LLMProvider;
  selectedModel: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onProviderSwitch: (p: LLMProvider) => void;
  onSelect: (model: string) => void;
  onClose: () => void;
  openRouterModels: ModelWithFidelity[];
  loadingModels: boolean;
}) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 top-full mt-2 z-50 w-80 rounded-lg border border-border bg-card shadow-xl overflow-hidden"
      >
        {/* Provider tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => onProviderSwitch("google")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition ${
              provider === "google"
                ? "bg-primary/10 text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Gemini
          </button>
          <button
            onClick={() => onProviderSwitch("openrouter")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition ${
              provider === "openrouter"
                ? "bg-primary/10 text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            OpenRouter
          </button>
        </div>

        {/* Model list */}
        <div className="p-3 max-h-80 overflow-y-auto">
          {provider === "google" ? (
            <GeminiModelList selectedModel={selectedModel} onSelect={onSelect} />
          ) : (
            <OpenRouterModelList
              models={openRouterModels}
              selectedModel={selectedModel}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              onSelect={onSelect}
              loading={loadingModels}
            />
          )}
        </div>
      </motion.div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared atoms
// ---------------------------------------------------------------------------

function FidelityBadge({
  fidelity,
  size = "md",
}: {
  fidelity: ModelFidelity;
  size?: "sm" | "md";
}) {
  const colors = FIDELITY_COLORS[fidelity.tier];
  const sizeClasses =
    size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5";

  return (
    <span className={`rounded font-medium ${colors} ${sizeClasses}`}>
      {fidelity.score}%
    </span>
  );
}

function ProviderIcon({
  provider,
  className = "",
}: {
  provider: LLMProvider;
  className?: string;
}) {
  if (provider === "google") {
    return <Sparkles className={className} />;
  }
  return <Globe className={className} />;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getDisplayName(modelId: string): string {
  // Check Gemini models
  const gemini = GEMINI_MODELS.find((m) => m.id === modelId);
  if (gemini) return gemini.name;

  // Check recommended
  const rec = RECOMMENDED_MODELS.find((m) => m.id === modelId);
  if (rec) return rec.name;

  // Extract from OpenRouter format: "provider/model-name" → "Model Name"
  const parts = modelId.split("/");
  const name = parts[parts.length - 1];
  return name
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
