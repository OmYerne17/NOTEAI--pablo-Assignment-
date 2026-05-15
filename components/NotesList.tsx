"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNoteStore, NoteItem } from "@/lib/store";
import { formatDistanceToNow } from "@/lib/time";
import { 
  FileText, 
  Plus, 
  Search, 
  Archive, 
  Tag, 
  ChevronDown, 
  Clock, 
  Calendar, 
  X,
  RotateCcw,
  CheckCircle2
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// --- Types & Constants ---

interface FetchNotesParams {
  search: string;
  tags: string[];
  sort: string;
  archived: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Work: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Personal: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Learning: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Other: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

// --- API Helpers ---

async function fetchNotes({ search, tags, sort, archived }: FetchNotesParams): Promise<NoteItem[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (tags.length > 0) params.append("tags", tags.join(","));
  if (sort) params.append("sort", sort);
  if (archived) params.append("archived", "true");

  const res = await fetch(`/api/notes?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch notes");
  const data = await res.json();
  return data.notes;
}

async function createNote(): Promise<NoteItem> {
  const res = await fetch("/api/notes", { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify({}) 
  });
  if (!res.ok) throw new Error("Failed to create note");
  const data = await res.json();
  return data.note;
}

// --- Components ---

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-violet-500/40 text-white rounded-sm px-0.5">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function NotesList({ hideBrand = false }: { hideBrand?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { selectedNoteId, setSelectedNoteId } = useNoteStore();

  // --- URL State Initialization ---
  const initialSearch = searchParams.get("search") || "";
  const initialTags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
  const initialSort = searchParams.get("sort") || "updatedAt";
  const initialArchived = searchParams.get("archived") === "true";

  // --- Local States ---
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [activeTags, setActiveTags] = useState<string[]>(initialTags);
  const [sort, setSort] = useState(initialSort);
  const [showArchived, setShowArchived] = useState(initialArchived);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // --- Debounce Effect ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // --- URL Persistence Effect ---
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (activeTags.length > 0) params.set("tags", activeTags.join(","));
    if (sort !== "updatedAt") params.set("sort", sort);
    if (showArchived) params.set("archived", "true");

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    router.replace(url);
  }, [debouncedSearch, activeTags, sort, showArchived, pathname, router]);

  // --- React Query ---
  const { data: notes = [], isLoading, isFetching } = useQuery({
    queryKey: ["notes", { search: debouncedSearch, tags: activeTags, sort, archived: showArchived }],
    queryFn: () => fetchNotes({ search: debouncedSearch, tags: activeTags, sort, archived: showArchived }),
  });

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNoteId(newNote._id);
    },
  });

  // --- Tag Aggregation ---
  // We get all unique tags from the user's notes. To make this feel reactive, 
  // we could fetch all tags separately, but here we'll use what we have in the current view 
  // or cache the full tag list if possible.
  const allTags = useMemo(() => {
    // In a real app, you might want a separate /api/tags endpoint.
    // For now, we'll extract from current results, but this has the "disappearing tag" issue.
    // To solve it partially, we keep track of tags we've seen.
    return Array.from(new Set(notes.flatMap((n) => n.tags))).filter(Boolean);
  }, [notes]);

  const toggleTag = (tag: string) => {
    setActiveTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchInput("");
    setActiveTags([]);
    setSort("updatedAt");
    setShowArchived(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/40">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 border-b border-zinc-800/40">
        <div className="flex items-center justify-between mb-5">
          {!hideBrand ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/20">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base text-white tracking-tight leading-none">NoteAI</h1>
                <p className="text-[10px] text-zinc-500 font-medium mt-1">
                  {isLoading ? "Loading..." : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'} found`}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              {isLoading ? "Loading..." : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'} found`}
            </p>
          )}
          <button
            id="new-note-btn"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all duration-200 disabled:opacity-60 shadow-lg shadow-violet-900/30 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            New Note
          </button>
        </div>
      </div>

        {/* Search & Sort Row */}
        <div className="flex gap-2 mb-4 px-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              id="notes-search"
              type="text"
              placeholder="Search content..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all shadow-inner"
            />
            {searchInput && (
              <button 
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-zinc-700 text-zinc-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="relative">
            <button
              id="sort-menu-btn"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className={cn(
                "p-2.5 rounded-xl border transition-all flex items-center justify-center",
                isSortOpen 
                  ? "bg-zinc-800 border-violet-500/50 text-violet-400" 
                  : "bg-zinc-800/80 border-zinc-700/50 text-zinc-400 hover:text-zinc-200"
              )}
              title="Sort notes"
            >
              {sort === "updatedAt" ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
            </button>

            {isSortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-zinc-800 border border-zinc-700 shadow-2xl z-20 py-1.5 overflow-hidden">
                  <button
                    onClick={() => { setSort("updatedAt"); setIsSortOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-zinc-700 transition-colors",
                      sort === "updatedAt" ? "text-violet-400 font-medium" : "text-zinc-400"
                    )}
                  >
                    <Clock className="w-3.5 h-3.5" /> Last Updated
                  </button>
                  <button
                    onClick={() => { setSort("createdAt"); setIsSortOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-zinc-700 transition-colors",
                      sort === "createdAt" ? "text-violet-400 font-medium" : "text-zinc-400"
                    )}
                  >
                    <Calendar className="w-3.5 h-3.5" /> Date Created
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer group">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={showArchived}
                onChange={() => setShowArchived(!showArchived)}
              />
              <div className="w-8 h-4.5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-zinc-500 peer-checked:after:bg-violet-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-violet-500/20 border border-zinc-700 peer-checked:border-violet-500/30"></div>
              <span className="ml-2 text-[11px] font-medium text-zinc-500 group-hover:text-zinc-400 transition-colors">Show Archived</span>
            </label>
          </div>

          {(debouncedSearch || activeTags.length > 0 || showArchived) && (
            <button 
              onClick={clearFilters}
              className="text-[10px] font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" /> Reset
            </button>
          )}
        </div>
      

      {/* Tag pills - scrollable */}
      {allTags.length > 0 && (
        <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar mask-fade-right">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap uppercase tracking-wider",
                activeTags.includes(tag)
                  ? "bg-violet-500/20 text-violet-300 border-violet-500/40 ring-1 ring-violet-500/20"
                  : "bg-zinc-800/40 text-zinc-500 border-zinc-700/50 hover:border-zinc-600 hover:text-zinc-300"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {isLoading ? (
          <div className="space-y-3 px-1 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-zinc-800/30 animate-pulse border border-zinc-800/50" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700/30">
              <Search className="w-7 h-7 text-zinc-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-300">No notes match your search</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[180px] mx-auto">Try adjusting your filters or search keywords to find what you're looking for.</p>
            </div>
            <button 
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700/50 transition-all"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          notes.map((note) => (
            <button
              key={note._id}
              id={`note-item-${note._id}`}
              onClick={() => setSelectedNoteId(note._id)}
              className={cn(
                "w-full text-left p-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden border",
                selectedNoteId === note._id
                  ? "bg-violet-600/10 border-violet-500/40 shadow-sm shadow-violet-900/10"
                  : "bg-transparent border-transparent hover:bg-zinc-800/40 hover:border-zinc-800"
              )}
            >
              {selectedNoteId === note._id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 rounded-r-full" />
              )}
              
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <span className={cn(
                  "text-sm font-bold truncate leading-tight tracking-tight",
                  selectedNoteId === note._id ? "text-white" : "text-zinc-200 group-hover:text-white"
                )}>
                  <Highlight text={note.title || "Untitled Note"} query={debouncedSearch} />
                </span>
                {note.isArchived && (
                  <Archive className="w-3 h-3 text-amber-500/60 shrink-0" />
                )}
              </div>
              
              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3 font-medium">
                {note.content ? note.content : "No content yet..."}
              </p>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-1.5 overflow-hidden">
                  {note.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider",
                      activeTags.includes(tag) 
                        ? "bg-violet-500/20 text-violet-300" 
                        : "bg-zinc-800/60 text-zinc-500 group-hover:text-zinc-400"
                    )}>
                      #{tag}
                    </span>
                  ))}
                  {note.tags.length > 2 && (
                    <span className="text-[9px] font-bold text-zinc-600">+{note.tags.length - 2}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-medium shrink-0">
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  {formatDistanceToNow(note.updatedAt)}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
      
      {/* Refetch Indicator */}
      {isFetching && !isLoading && (
        <div className="absolute bottom-4 right-4 animate-spin">
          <RotateCcw className="w-3 h-3 text-violet-500/40" />
        </div>
      )}
    </div>
  );
}
