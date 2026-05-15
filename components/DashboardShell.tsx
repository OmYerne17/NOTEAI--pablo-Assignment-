"use client";

import { NoteEditor } from "@/components/NoteEditor";
import { EmptyState } from "@/components/EmptyState";
import { useNoteStore } from "@/lib/store";

export function DashboardShell() {
  const { selectedNoteId } = useNoteStore();

  return (
    <div className="h-full w-full">
      {selectedNoteId ? <NoteEditor /> : <EmptyState />}
    </div>
  );
}
