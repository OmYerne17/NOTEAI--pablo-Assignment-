"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNoteStore, NoteItem } from "@/lib/store";
import { formatDistanceToNow } from "@/lib/time";
import { FileText, Plus, Search, Archive, Tag } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

async function fetchNotes(): Promise<NoteItem[]> {
  const res = await fetch("/api/notes");
  if (!res.ok) throw new Error("Failed to fetch notes");
  const data = await res.json();
  return data.notes;
}

async function createNote(): Promise<NoteItem> {
  const res = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  if (!res.ok) throw new Error("Failed to create note");
  const data = await res.json();
  return data.note;
}

const CATEGORY_COLORS: Record<string, string> = {
  Work: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Personal: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Learning: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Other: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export function NotesList() {
  const { selectedNoteId, setSelectedNoteId } = useNoteStore();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: fetchNotes,
  });

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: (newNote) => {
      queryClient.setQueryData<NoteItem[]>(["notes"], (old = []) => [newNote, ...old]);
      setSelectedNoteId(newNote._id);
    },
  });

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).filter(Boolean);

  const filtered = notes.filter((note) => {
    const matchSearch =
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase());
    const matchTag = activeTag ? note.tags.includes(activeTag) : true;
    return matchSearch && matchTag;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-white tracking-tight">NoteAI</span>
          </div>
          <button
            id="new-note-btn"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all duration-150 disabled:opacity-60 shadow-sm shadow-violet-900/50"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            id="notes-search"
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          />
        </div>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all",
              activeTag === null
                ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                : "bg-zinc-800/60 text-zinc-500 border-zinc-700/40 hover:text-zinc-300"
            )}
          >
            <Tag className="w-2.5 h-2.5" /> All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={cn(
                "px-2 py-0.5 rounded-full text-xs border transition-all",
                activeTag === tag
                  ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                  : "bg-zinc-800/60 text-zinc-500 border-zinc-700/40 hover:text-zinc-300"
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="px-3 mb-2">
        <div className="h-px bg-zinc-800/80" />
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col gap-2 px-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
              <Archive className="w-5 h-5 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500">
              {search ? "No notes match your search" : "No notes yet. Create one!"}
            </p>
          </div>
        ) : (
          filtered.map((note) => (
            <button
              key={note._id}
              id={`note-item-${note._id}`}
              onClick={() => setSelectedNoteId(note._id)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 group",
                selectedNoteId === note._id
                  ? "bg-violet-600/20 border border-violet-500/30"
                  : "hover:bg-zinc-800/60 border border-transparent"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className={cn(
                  "text-sm font-medium truncate leading-snug",
                  selectedNoteId === note._id ? "text-white" : "text-zinc-200 group-hover:text-white"
                )}>
                  {note.title || "Untitled Note"}
                </span>
                {note.category && (
                  <span className={cn(
                    "shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                    CATEGORY_COLORS[note.category] || CATEGORY_COLORS.Other
                  )}>
                    {note.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 truncate leading-relaxed">
                {note.content ? note.content.slice(0, 60) : "No content yet..."}
              </p>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex gap-1 flex-wrap">
                  {note.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] text-zinc-600 bg-zinc-800/80 px-1.5 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                  {note.tags.length > 2 && (
                    <span className="text-[10px] text-zinc-600">+{note.tags.length - 2}</span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-600 shrink-0">
                  {formatDistanceToNow(note.updatedAt)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
