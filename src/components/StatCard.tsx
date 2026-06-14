import type { ReactNode } from "react";

export function StatCard({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between text-slate-400">
        <span className="text-sm uppercase tracking-[0.25em]">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
    </div>
  );
}
