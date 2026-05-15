"use client";

import { Plus, Sparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNoteStore, NoteItem } from "@/lib/store";

async function createNote(): Promise<NoteItem> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error("Failed to create note");
  const data = await res.json();
  return data.note;
}

export function EmptyState() {
  const { setSelectedNoteId } = useNoteStore();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: (newNote) => {
      queryClient.setQueryData<NoteItem[]>(["notes"], (old = []) => [newNote, ...old]);
      setSelectedNoteId(newNote._id);
    },
  });

  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-center px-6">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/20 flex items-center justify-center mx-auto shadow-2xl shadow-violet-950/50">
          <Sparkles className="w-12 h-12 text-violet-500/70" />
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-violet-500/30 blur-sm" />
        <div className="absolute -bottom-2 -left-3 w-3 h-3 rounded-full bg-indigo-500/30 blur-sm" />
      </div>

      <h2 className="text-xl font-semibold text-white mb-2">No note selected</h2>
      <p className="text-zinc-500 text-sm max-w-xs leading-relaxed mb-8">
        Select a note from the sidebar to start editing, or create a new one to capture your thoughts.
      </p>

      <button
        id="empty-state-new-note-btn"
        onClick={() => createMutation.mutate()}
        disabled={createMutation.isPending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all duration-150 shadow-lg shadow-violet-900/40 disabled:opacity-60 active:scale-95"
      >
        <Plus className="w-4 h-4" />
        Create a new note
      </button>
    </div>
  );
}
