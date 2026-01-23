"use client";

import { Progress } from "@/components/ui/progress";
import { Zap, Database, Users } from "lucide-react";

export function LimitsDisplay() {
  // Mock data - replace with real data fetching later
  const limits = {
    leads: { used: 342, total: 500, label: "Leads" },
    credits: { used: 850, total: 1000, label: "AI Credits" },
  };

  return (
    <div className="space-y-4 rounded-xl border border-white/5 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
        <Zap className="h-3 w-3 text-indigo-400" />
        <span>Plan Usage</span>
      </div>

      <div className="space-y-3">
        {/* Leads Limit */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 flex items-center gap-1.5">
               <Users className="h-3 w-3 text-zinc-500" /> {limits.leads.label}
            </span>
            <span className="text-zinc-400">
              {limits.leads.used}/{limits.leads.total}
            </span>
          </div>
          <Progress 
            value={(limits.leads.used / limits.leads.total) * 100} 
            className="h-1.5 bg-zinc-800" 
            // indicatorClassName="bg-indigo-500" // Requires custom prop or cn override in component
          />
        </div>

        {/* AI Credits Limit */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 flex items-center gap-1.5">
               <Zap className="h-3 w-3 text-zinc-500" /> {limits.credits.label}
            </span>
            <span className="text-zinc-400">
              {limits.credits.used}/{limits.credits.total}
            </span>
          </div>
          <Progress 
            value={(limits.credits.used / limits.credits.total) * 100} 
            className="h-1.5 bg-zinc-800"
          />
        </div>
      </div>
    </div>
  );
}
