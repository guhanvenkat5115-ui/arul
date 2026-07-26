import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: 'brand' | 'blue' | 'amber' | 'rose' | 'slate';
  sub?: string;
}

const accents: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100 text-slate-600',
};

export function StatCard({ label, value, icon, accent = 'brand', sub }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600/70">{label}</p>
          <p className="mt-1 text-2xl font-bold text-brand-800">{value}</p>
          {sub && <p className="mt-1 text-xs text-brand-500">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ${accents[accent]}`}>{icon}</div>
      </div>
    </div>
  );
}
