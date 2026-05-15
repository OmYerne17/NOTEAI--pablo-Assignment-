"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "@/lib/time";
import { FileText, Calendar, User, Tag, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SharedNote {
  title: string;
  content: string;
  tags: string[];
  summary?: string;
  updatedAt: string;
  authorName: string;
}

export default function SharedNotePage() {
  const { shareId } = useParams();
  const [note, setNote] = useState<SharedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSharedNote() {
      try {
        const res = await fetch(`/api/shared/${shareId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load note");
        } else {
          setNote(data.note);
        }
      } catch (err) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    if (shareId) fetchSharedNote();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800">
          <FileText className="w-8 h-8 text-zinc-700" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Note Unavailable</h1>
        <p className="text-zinc-500 max-w-md mb-8">
          This note may have been deleted, or the owner has revoked public access.
        </p>
        <Link 
          href="/" 
          className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all"
        >
          Go to NoteAI
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 selection:bg-violet-500/30">
      {/* Navbar / Header */}
      <nav className="border-b border-zinc-800/60 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/20">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">NoteAI</span>
          </div>
          <Link 
            href="/login" 
            className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-20">
        {/* Note Header */}
        <header className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            {note.title || "Untitled Note"}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium text-zinc-300">{note.authorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Updated {formatDistanceToNow(note.updatedAt)}</span>
            </div>
          </div>
        </header>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {note.tags.map(tag => (
              <span 
                key={tag} 
                className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <article className="prose prose-invert prose-zinc max-w-none mb-16">
          <div className="whitespace-pre-wrap text-lg leading-relaxed text-zinc-300">
            {note.content || <span className="italic text-zinc-600">No content available.</span>}
          </div>
        </article>

        {/* AI Summary Section */}
        {note.summary && (
          <section className="mb-16">
            <div className="p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-violet-600/10 to-indigo-600/5 border border-violet-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <Sparkles className="w-5 h-5 text-violet-500/40" />
              </div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                AI Summary
              </h2>
              <p className="text-zinc-300 leading-relaxed italic">
                "{note.summary}"
              </p>
            </div>
          </section>
        )}

        {/* CTA Footer */}
        <footer className="pt-12 border-t border-zinc-800/60">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-white mb-4">Capture your own ideas with NoteAI</h3>
            <p className="text-zinc-500 mb-8 max-w-md">
              Join thousands of users organizing their thoughts with AI-powered summaries and smart tagging.
            </p>
            <Link 
              href="/signup" 
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-black font-bold transition-all hover:bg-zinc-200 active:scale-95"
            >
              Create your own notes
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
