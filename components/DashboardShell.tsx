"use client";

import { useSession, signOut } from "next-auth/react";
import { NotesList } from "@/components/NotesList";
import { NoteEditor } from "@/components/NoteEditor";
import { EmptyState } from "@/components/EmptyState";
import { useNoteStore } from "@/lib/store";
import { LogOut, User } from "lucide-react";

export function DashboardShell() {
  const { selectedNoteId } = useNoteStore();
  const { data: session } = useSession();

  const avatarName = session?.user?.name || session?.user?.email || "U";
  const initials = avatarName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside className="w-[280px] shrink-0 flex flex-col h-full border-r border-zinc-800/60 bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex-1 overflow-hidden flex flex-col">
          <NotesList />
        </div>

        {/* User footer */}
        <div className="border-t border-zinc-800/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-violet-900/40">
              {initials || <User className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">
                {session?.user?.name || "User"}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {session?.user?.email}
              </p>
            </div>
            <button
              id="logout-btn"
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all duration-150"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN PANEL */}
      <main className="flex-1 h-full overflow-hidden">
        {selectedNoteId ? <NoteEditor /> : <EmptyState />}
      </main>
    </div>
  );
}
