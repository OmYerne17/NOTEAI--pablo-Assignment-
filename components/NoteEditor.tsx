"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNoteStore, NoteItem } from "@/lib/store";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { 
  Archive, 
  ArchiveRestore, 
  Check, 
  ChevronDown, 
  Loader2, 
  X, 
  Share2, 
  Link as LinkIcon, 
  Copy, 
  Trash2, 
  Globe,
  Eye,
  Edit3,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AiPanel } from "@/components/AiPanel";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const CATEGORIES = ["Work", "Personal", "Learning", "Other"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Work: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Personal: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Learning: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Other: "bg-zinc-500/15 text-zinc-400 border-zinc-700/40",
};

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

export function NoteEditor() {
  const { selectedNoteId, setSelectedNoteId } = useNoteStore();
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [copying, setCopying] = useState(false);
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
      setIsPreview(false);
    }
  }, [note?._id]);

  const patchMutation = useMutation({
    mutationFn: (updates: Partial<NoteItem>) => {
      if (!selectedNoteId) throw new Error("No note selected");
      return patchNote(selectedNoteId, updates);
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const prev = queryClient.getQueryData<NoteItem[]>(["notes"]);
      queryClient.setQueryData<NoteItem[]>(["notes"], (old = []) =>
        old.map((n) => (n._id === selectedNoteId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n))
      );
      return { prev };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["notes"], ctx.prev);
      setSaveStatus("idle");
      toast.error(err.message || "Failed to save note");
    },
    onSuccess: () => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      // Optional: only toast on manual trigger or significant events
    },
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/notes/${selectedNoteId}/share`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to share");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData<NoteItem[]>(["notes"], (old = []) =>
        old?.map(n => n._id === selectedNoteId ? { ...n, isPublic: true, shareId: data.shareId } : n)
      );
      setShowShareModal(true);
      toast.success("Public link generated!");
    },
    onError: () => toast.error("Failed to generate public link")
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/notes/${selectedNoteId}/share`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke share");
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData<NoteItem[]>(["notes"], (old = []) =>
        old?.map(n => n._id === selectedNoteId ? { ...n, isPublic: false, shareId: undefined } : n)
      );
      setShowShareModal(false);
      toast.success("Public access revoked");
    },
    onError: () => toast.error("Failed to revoke access")
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/notes/${selectedNoteId}?permanent=true`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNoteId(null);
      toast.success("Note permanently deleted");
    },
    onError: () => toast.error("Failed to delete note")
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
    triggerSave({ title: e.target.value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    triggerSave({ content: e.target.value });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (newTag && !tags.includes(newTag)) {
        const newTags = [...tags, newTag];
        setTags(newTags);
        triggerSave({ tags: newTags });
      }
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      const newTags = tags.slice(0, -1);
      setTags(newTags);
      triggerSave({ tags: newTags });
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    triggerSave({ tags: newTags });
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setShowCategoryMenu(false);
    triggerSave({ category: cat });
  };

  const handleArchive = () => {
    if (!selectedNoteId) return;
    const nextState = !note?.isArchived;
    patchMutation.mutate({ isArchived: nextState });
    toast.success(nextState ? "Note archived" : "Note restored");
  };

  const handleDelete = () => {
    if (!selectedNoteId) return;
    if (window.confirm("Are you sure you want to permanently delete this note? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const handleShareClick = () => {
    if (note?.isPublic) {
      setShowShareModal(true);
    } else {
      shareMutation.mutate();
    }
  };

  const handleCopyLink = () => {
    if (!note?.shareId) return;
    const url = `${window.location.origin}/share/${note.shareId}`;
    navigator.clipboard.writeText(url);
    setCopying(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopying(false), 2000);
  };

  const handleApplyTitle = (newTitle: string) => {
    setTitle(newTitle);
    triggerSave({ title: newTitle });
  };

  const stats = useMemo(() => {
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    return { chars, words };
  }, [content]);

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
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {/* Category selector */}
          <div className="relative" ref={categoryRef}>
            <button
              onClick={() => setShowCategoryMenu((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all uppercase tracking-tight",
                CATEGORY_COLORS[category] || CATEGORY_COLORS.Other
              )}
            >
              {category}
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {showCategoryMenu && (
              <div className="absolute top-full left-0 mt-1 w-36 rounded-xl bg-zinc-900 border border-zinc-700/60 shadow-2xl py-1 z-50">
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

          <div className="h-4 w-px bg-zinc-800/60 mx-1" />

          {/* Markdown Toggle */}
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border",
              isPreview 
                ? "bg-violet-500/10 text-violet-400 border-violet-500/30" 
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
            )}
            title={isPreview ? "Edit mode" : "Markdown preview"}
          >
            {isPreview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {isPreview ? "Edit" : "Preview"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status */}
          <div className="flex items-center gap-1.5 text-xs min-w-[70px] justify-end">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-zinc-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                <Check className="w-3 h-3" />
                Saved
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-zinc-800/60 mx-1" />

          {/* Share button */}
          <button
            onClick={handleShareClick}
            disabled={shareMutation.isPending}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
              note.isPublic
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white hover:bg-zinc-700 hover:border-zinc-600"
            )}
          >
            {shareMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : note.isPublic ? (
              <><Globe className="w-3.5 h-3.5" /> Public</>
            ) : (
              <><Share2 className="w-3.5 h-3.5" /> Share</>
            )}
          </button>

          {/* AI Insights Button */}
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            title="Generate AI Insights"
            className="text-violet-400 hover:text-violet-300 hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.8)] transition-all duration-200 p-2 rounded-lg hover:bg-violet-500/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {/* Archive toggle */}
          <button
            onClick={handleArchive}
            title={note.isArchived ? "Restore note" : "Archive note"}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all",
              note.isArchived
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                : "bg-zinc-800/60 text-zinc-400 border-zinc-700/40 hover:text-zinc-200 hover:border-zinc-600"
            )}
          >
            {note.isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDelete}
            title="Delete permanently"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
          >
            {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto px-8 py-6 relative">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Note"
            className="w-full text-3xl font-black bg-transparent border-none outline-none text-white placeholder:text-zinc-800 mb-4 leading-tight"
          />

          {/* Tags */}
          <div className="flex items-center flex-wrap gap-1.5 mb-8 min-h-[28px]">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-black uppercase tracking-widest"
              >
                #{tag}
                <button onClick={() => removeTag(tag)} className="hover:text-violet-200 ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={tags.length === 0 ? "Add tags..." : ""}
              className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-xs text-zinc-500 placeholder:text-zinc-700"
            />
          </div>

          <div className="h-px bg-zinc-800/40 mb-8" />

          {/* Content Area */}
          <div className="min-h-[500px]">
            {isPreview ? (
              <div className="prose prose-invert prose-zinc max-w-none">
                <ReactMarkdown>{content || "*No content yet...*"}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="Start writing your thoughts..."
                className="w-full h-full min-h-[500px] bg-transparent border-none outline-none text-zinc-300 text-lg leading-relaxed resize-none placeholder:text-zinc-800"
                spellCheck
              />
            )}
          </div>

          <AiPanel
            noteId={note._id}
            noteTitle={title}
            noteContent={content}
            initialSummary={note.summary}
            initialActionItems={note.actionItems}
            initialSuggestedTitle={note.suggestedTitle}
            onApplyTitle={handleApplyTitle}
            isOpen={showAiPanel}
            setIsOpen={setShowAiPanel}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-2 border-t border-zinc-800/40 bg-zinc-950 flex items-center justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span>{stats.words} words</span>
          <span className="w-1 h-1 rounded-full bg-zinc-800" />
          <span>{stats.chars} characters</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-700">Auto-saved to cloud</span>
        </div>
      </footer>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowShareModal(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-8 shadow-2xl animate-in zoom-in duration-200">
            <button onClick={() => setShowShareModal(false)} className="absolute top-6 right-6 p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-500"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><Globe className="w-5 h-5 text-emerald-400" /></div>
              <h2 className="text-xl font-bold text-white">Public Sharing</h2>
            </div>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">Anyone with this link can view this note. Private metadata stays hidden.</p>
            <div className="flex items-center gap-2 mb-8">
              <div className="flex-1 px-4 py-3 rounded-2xl bg-black border border-zinc-800 text-zinc-400 text-xs font-mono truncate">{window.location.origin}/share/{note.shareId}</div>
              <button onClick={handleCopyLink} className="px-4 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all active:scale-95">{copying ? "Copied" : "Copy"}</button>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-zinc-800/60">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Link Active</span>
              <button onClick={() => revokeMutation.mutate()} disabled={revokeMutation.isPending} className="text-[10px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-widest flex items-center gap-2">{revokeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Revoke access</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
