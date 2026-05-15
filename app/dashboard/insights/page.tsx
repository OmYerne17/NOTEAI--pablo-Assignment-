"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  FileText, 
  Sparkles, 
  Calendar, 
  Tag, 
  RefreshCcw, 
  TrendingUp,
  Clock,
  ArrowRight,
  BarChart3,
  ChevronDown
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/time";
import { useNoteStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface InsightData {
  totalNotes: number;
  notesThisWeek: number;
  recentlyEdited: Array<{
    _id: string;
    title: string;
    updatedAt: string;
  }>;
  topTags: Array<{
    name: string;
    count: number;
  }>;
  aiUsageCount: number;
  activity: Array<{
    label: string;
    date: string;
    count: number;
  }>;
  range: string;
}

export default function InsightsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setSelectedNoteId } = useNoteStore();
  const [range, setRange] = useState("weekly");

  const { data, isLoading, isFetching } = useQuery<InsightData>({
    queryKey: ["insights", range],
    queryFn: async () => {
      const res = await fetch(`/api/insights?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch insights");
      return res.json();
    }
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["insights"] });
  };

  const navigateToNote = (id: string) => {
    setSelectedNoteId(id);
    router.push("/dashboard");
  };

  if (isLoading) {
    return <InsightsSkeleton />;
  }

  if (!data) return null;

  const maxActivity = Math.max(...data.activity.map(d => d.count), 1);
  const maxTagUsage = Math.max(...data.topTags.map(t => t.count), 1);

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-6 lg:p-8 scroll-smooth">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-violet-500" />
              Productivity Insights
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Track your progress and AI engagement across your notes.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCcw className={cn("w-4 h-4", isFetching && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        {/* Row 1: Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Notes" 
            value={data.totalNotes} 
            icon={FileText} 
            color="bg-blue-500" 
          />
          <StatCard 
            title="AI Summaries" 
            value={data.aiUsageCount} 
            icon={Sparkles} 
            color="bg-violet-500" 
          />
          <StatCard 
            title="Notes Last 7 Days" 
            value={data.notesThisWeek} 
            icon={Calendar} 
            color="bg-emerald-500" 
          />
          <StatCard 
            title="Unique Tags" 
            value={data.topTags.length} 
            icon={Tag} 
            color="bg-amber-500" 
          />
        </div>

        {/* Row 2: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Bar Chart */}
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-zinc-200 font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                {range.charAt(0).toUpperCase() + range.slice(1)} Activity
              </h3>
              
              <div className="flex bg-zinc-800/50 p-1 rounded-lg border border-zinc-700/50">
                {["daily", "weekly", "monthly"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                      range === r 
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-end justify-between h-48 gap-1 px-1">
              {data.activity.map((item, i) => {
                const heightPercent = (item.count / maxActivity) * 100;
                // Only show every Nth label for monthly to avoid overlap
                const shouldShowLabel = 
                  range === "weekly" || 
                  (range === "daily" && i % 4 === 0) || 
                  (range === "monthly" && i % 5 === 0);
                
                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center gap-3 group h-full">
                    <div className="relative w-full flex justify-center items-end h-full">
                      <div 
                        className={cn(
                          "w-full bg-gradient-to-t transition-all duration-500 ease-out shadow-lg shadow-violet-900/10",
                          range === "monthly" ? "max-w-[8px]" : "max-w-[24px]",
                          item.count > 0 ? "from-violet-600/40 to-violet-500 group-hover:from-violet-500 group-hover:to-violet-400 rounded-t-lg" : "bg-zinc-800/30 rounded-t-sm"
                        )}
                        style={{ height: `${Math.max(heightPercent, 2)}%` }}
                      >
                        {item.count > 0 && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-zinc-700 shadow-xl z-10">
                            {item.count} {item.count === 1 ? 'note' : 'notes'} ({item.label})
                          </div>
                        )}
                      </div>
                    </div>
                    {shouldShowLabel && (
                      <span className="text-[9px] font-bold text-zinc-600 group-hover:text-zinc-400 transition-colors uppercase tracking-tight whitespace-nowrap">
                        {item.label.split(',')[0]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Tags Horizontal Chart */}
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-zinc-200 font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                Top Tags
              </h3>
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-md">Usage Count</span>
            </div>

            <div className="space-y-5">
              {data.topTags.length > 0 ? data.topTags.map((tag) => (
                <div key={tag.name} className="space-y-1.5 group">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors uppercase tracking-wider">#{tag.name}</span>
                    <span className="text-zinc-500 font-medium">{tag.count} notes</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-800/30">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700 ease-out shadow-sm shadow-amber-900/20"
                      style={{ width: `${(tag.count / maxTagUsage) * 100}%` }}
                    />
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-600 text-sm italic">
                  No tags used yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Recently Edited Notes */}
        <div className="space-y-4">
          <h3 className="text-zinc-200 font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Recently Edited
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recentlyEdited.length > 0 ? data.recentlyEdited.map((note) => (
              <button
                key={note._id}
                onClick={() => navigateToNote(note._id)}
                className="flex flex-col gap-3 p-4 bg-zinc-900/40 border border-zinc-800/60 hover:border-violet-500/30 hover:bg-zinc-800/60 rounded-2xl transition-all group text-left shadow-lg hover:shadow-violet-950/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                    {note.title || "Untitled Note"}
                  </h4>
                  <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-violet-500 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
                <div className="mt-auto flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(note.updatedAt)}
                </div>
              </button>
            )) : (
              <div className="col-span-full py-12 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-600">
                <FileText className="w-8 h-8 mb-2 opacity-20" />
                <p>No notes edited recently</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-5 backdrop-blur-sm shadow-xl hover:bg-zinc-900 transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2 rounded-xl bg-opacity-10", color.replace('bg-', 'text-'))}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{title}</p>
        <h2 className="text-3xl font-black text-white group-hover:scale-105 transition-transform origin-left">{value}</h2>
      </div>
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-6 lg:p-8 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-zinc-900 rounded-lg" />
            <div className="h-4 w-96 bg-zinc-900 rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-zinc-900 rounded-xl" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-zinc-900 rounded-2xl border border-zinc-800/60" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-zinc-900 rounded-2xl border border-zinc-800/60" />
          <div className="h-72 bg-zinc-900 rounded-2xl border border-zinc-800/60" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-zinc-900 rounded-2xl border border-zinc-800/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
