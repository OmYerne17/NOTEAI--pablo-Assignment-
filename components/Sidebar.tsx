"use client";

import { useSession, signOut } from "next-auth/react";
import { NotesList } from "@/components/NotesList";
import { 
  LogOut, 
  User, 
  LayoutDashboard, 
  BarChart3, 
  FileText, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Plus
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNoteStore } from "@/lib/store";

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { setSelectedNoteId } = useNoteStore();

  useEffect(() => setMounted(true), []);

  // Keyboard shortcut Ctrl/Cmd + N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        createNoteMutation.mutate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const createNoteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notes", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({}) 
      });
      if (!res.ok) throw new Error("Failed to create note");
      const data = await res.json();
      return data.note;
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNoteId(newNote._id);
      router.push("/dashboard");
      toast.success("New note created!");
      setIsOpen(false);
    },
    onError: () => {
      toast.error("Failed to create note");
    }
  });

  const avatarName = session?.user?.name || session?.user?.email || "U";
  const initials = avatarName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navItems = [
    { name: "Notes", href: "/dashboard", icon: FileText },
    { name: "Insights", href: "/dashboard/insights", icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0f0f1a] border-b border-zinc-800/60 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">NoteAI</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-zinc-400 hover:text-white"
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0f0f1a] border-r border-white/10 transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col h-full",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand & Nav */}
        <div className="p-4 space-y-4">
          <div className="hidden lg:flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/20">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-base text-white tracking-tight leading-none">NoteAI</h1>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-violet-600/10 text-violet-400 border border-violet-500/20" 
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-violet-400" : "text-zinc-500")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-hidden flex flex-col border-t border-zinc-800/40">
          <NotesList hideBrand />
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800/60 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-xs font-medium text-zinc-200 truncate">{session?.user?.name || "User"}</p>
                <p className="text-[10px] text-zinc-500 truncate">{session?.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-xs font-medium"
            >
              {mounted && (theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />)}
              {mounted && (theme === "dark" ? "Light Mode" : "Dark Mode")}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
