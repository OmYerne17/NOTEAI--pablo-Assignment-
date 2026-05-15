"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNoteStore, NoteItem } from "@/lib/store";
import { useEffect, useRef, useState, useCallback } from "react";
import { Archive, ArchiveRestore, Check, ChevronDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Work", "Personal", "Learning", "Other"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Work: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Personal: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Learning: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Other: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

async function fetchNote(id: string): Promise<NoteItem> {
  const res = await fetch("/api/notes");
  if (!res.ok) throw new Error("Failed to fetch notes");
  const data = await res.json();
  return data.notes.find((n: NoteItem) => n._id === id);
}

async function patchNote(id: string, updates: Partial<NoteItem>): Promise<NoteItem> {
  const res = await fetch(`/api/notes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update note");
  const data = await res.json();
  return data.note;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function NoteEditor() {
  const { selectedNoteId } = useNoteStore();
  const queryClient = useQueryClient();

  const { data: notes = [] } = useQuery<NoteItem[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      const res = await fetch("/api/notes");
      if (!res.ok) throw new Error("Failed");
      const d = await res.json();
      return d.notes;
    },
  });

  const note = notes.find((n) => n._id === selectedNoteId) || null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState("Personal");
  const [tagInput, setTagInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Populate fields when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setTags(note.tags || []);
      setCategory(note.category || "Personal");
      setSaveStatus("idle");
      setIsDirty(false);
    }
  }, [note?._id]);

  const patchMutation = useMutation({
    mutationFn: (updates: Partial<NoteItem>) => patchNote(selectedNoteId!, updates),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const prev = queryClient.getQueryData<NoteItem[]>(["notes"]);
      queryClient.setQueryData<NoteItem[]>(["notes"], (old = []) =>
        old.map((n) => (n._id === selectedNoteId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["notes"], ctx.prev);
      setSaveStatus("idle");
    },
    onSuccess: () => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
  });

  const triggerSave = useCallback(
    (updates: Partial<NoteItem>) => {
      if (!selectedNoteId) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setSaveStatus("saving");
      saveTimeoutRef.current = setTimeout(() => {
        patchMutation.mutate(updates);
      }, 1500);
    },
    [selectedNoteId, patchMutation]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsDirty(true);
    triggerSave({ title: e.target.value, content, tags, category });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
    triggerSave({ title, content: e.target.value, tags, category });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (newTag && !tags.includes(newTag)) {
        const newTags = [...tags, newTag];
        setTags(newTags);
        setIsDirty(true);
        triggerSave({ title, content, tags: newTags, category });
      }
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      const newTags = tags.slice(0, -1);
      setTags(newTags);
      setIsDirty(true);
      triggerSave({ title, content, tags: newTags, category });
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    setIsDirty(true);
    triggerSave({ title, content, tags: newTags, category });
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setShowCategoryMenu(false);
    setIsDirty(true);
    triggerSave({ title, content, tags, category: cat });
  };

  const handleArchive = () => {
    if (!selectedNoteId) return;
    patchMutation.mutate({ isArchived: !note?.isArchived });
  };

  // Close category dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategoryMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!note) return null;

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Category selector */}
          <div className="relative" ref={categoryRef}>
            <button
              id="category-selector"
              onClick={() => setShowCategoryMenu((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all",
                CATEGORY_COLORS[category] || CATEGORY_COLORS.Other
              )}
            >
              {category}
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {showCategoryMenu && (
              <div className="absolute top-full left-0 mt-1 w-36 rounded-xl bg-zinc-900 border border-zinc-700/60 shadow-2xl shadow-black/50 py-1 z-50">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between",
                      category === cat ? "text-violet-400" : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                    )}
                  >
                    {cat}
                    {category === cat && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-zinc-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-emerald-500">
                <Check className="w-3 h-3" />
                Saved
              </span>
            )}
          </div>

          {/* Archive toggle */}
          <button
            id="archive-note-btn"
            onClick={handleArchive}
            title={note.isArchived ? "Unarchive note" : "Archive note"}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
              note.isArchived
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                : "bg-zinc-800/60 text-zinc-400 border-zinc-700/40 hover:text-zinc-200 hover:border-zinc-600"
            )}
          >
            {note.isArchived ? (
              <><ArchiveRestore className="w-3.5 h-3.5" /> Unarchive</>
            ) : (
              <><Archive className="w-3.5 h-3.5" /> Archive</>
            )}
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Title */}
        <input
          ref={titleRef}
          id="note-title-input"
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          className="w-full text-3xl font-bold bg-transparent border-none outline-none text-white placeholder:text-zinc-700 mb-4 leading-tight"
        />

        {/* Tags */}
        <div className="flex items-center flex-wrap gap-1.5 mb-5 min-h-[28px]">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 text-xs font-medium"
            >
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-violet-200 transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            id="tag-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={tags.length === 0 ? "Add tags (press Enter)..." : ""}
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-zinc-400 placeholder:text-zinc-600"
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800/60 mb-5" />

        {/* Content textarea */}
        <textarea
          id="note-content-textarea"
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing your note..."
          className="w-full flex-1 bg-transparent border-none outline-none text-zinc-300 text-base leading-relaxed resize-none placeholder:text-zinc-700 min-h-[calc(100vh-320px)]"
          spellCheck
        />
      </div>
    </div>
  );
}
