"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2, CheckSquare, AlignLeft, Type, Check, X } from "lucide-react";
import { useState } from "react";
import { NoteItem } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AiPanelProps {
  noteId: string;
  noteTitle: string;
  noteContent: string;
  initialSummary?: string;
  initialActionItems?: string[];
  initialSuggestedTitle?: string;
  onApplyTitle: (title: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

async function generateSummary(id: string) {
  const res = await fetch(`/api/notes/${id}/generate-summary`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to generate AI insights");
  }
  return res.json();
}

export function AiPanel({
  noteId,
  noteTitle,
  noteContent,
  initialSummary,
  initialActionItems,
  initialSuggestedTitle,
  onApplyTitle,
  isOpen,
  setIsOpen,
}: AiPanelProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState(initialSummary || "");
  const [actionItems, setActionItems] = useState(initialActionItems || []);
  const [suggestedTitle, setSuggestedTitle] = useState(initialSuggestedTitle || "");

  const totalContentLength = (noteTitle + noteContent).length;
  const canGenerate = totalContentLength >= 50;

  const mutation = useMutation({
    mutationFn: () => generateSummary(noteId),
    onSuccess: (data) => {
      setSummary(data.summary);
      setActionItems(data.actionItems);
      setSuggestedTitle(data.suggestedTitle);
      setError(null);
      queryClient.setQueryData<NoteItem[]>(["notes"], (old = []) =>
        old.map((n) =>
          n._id === noteId
            ? {
                ...n,
                summary: data.summary,
                actionItems: data.actionItems,
                suggestedTitle: data.suggestedTitle,
              }
            : n
        )
      );
      toast.success("AI insights generated successfully!");
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message || "Failed to generate AI insights");
    },
  });

  const handleGenerate = () => {
    setIsOpen(true);
    mutation.mutate();
  };

  const handleApplyTitle = () => {
    if (suggestedTitle) {
      onApplyTitle(suggestedTitle);
      toast.success("Title applied!");
    }
  };

  if (!isOpen && !summary && !actionItems.length && !suggestedTitle) {
    return (
      <div className="mt-8 border-t border-zinc-800/60 pt-6 pb-2">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || mutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
          Generate AI Insights
        </button>
        {!canGenerate && (
          <p className="mt-2 text-xs text-zinc-500">
            Write at least 50 characters to enable AI insights.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-zinc-800/60 pt-6 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-violet-300">
          <Sparkles className="w-4 h-4 text-violet-400" /> AI Insights
        </h3>
        <div className="flex items-center gap-2">
          {mutation.isPending ? (
            <span className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...
            </span>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              Regenerate
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {mutation.isPending && !summary ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 animate-pulse">
              <div className="w-24 h-4 bg-zinc-800 rounded mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-zinc-800 rounded w-5/6" />
                <div className="h-3 bg-zinc-800 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 flex flex-col">
            <h4 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-3 uppercase tracking-wider">
              <AlignLeft className="w-3.5 h-3.5" /> Summary
            </h4>
            <p className="text-sm text-zinc-300 leading-relaxed flex-1">
              {summary || "No summary available."}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 flex flex-col">
            <h4 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-3 uppercase tracking-wider">
              <CheckSquare className="w-3.5 h-3.5" /> Action Items
            </h4>
            {actionItems && actionItems.length > 0 ? (
              <ul className="space-y-2 flex-1">
                {actionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="w-4 h-4 mt-0.5 rounded-sm border border-zinc-600 flex items-center justify-center shrink-0" />
                    <span className="leading-tight">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500 italic flex-1">No action items found.</p>
            )}
          </div>

          <div className="rounded-xl border border-violet-900/30 bg-violet-950/10 p-4 flex flex-col">
            <h4 className="text-xs font-semibold text-violet-400 flex items-center gap-1.5 mb-3 uppercase tracking-wider">
              <Type className="w-3.5 h-3.5" /> Suggested Title
            </h4>
            <p className="text-base font-medium text-white mb-4 flex-1">
              {suggestedTitle || "No title suggested."}
            </p>
            {suggestedTitle && suggestedTitle !== noteTitle && (
              <button
                onClick={handleApplyTitle}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Apply Title
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
