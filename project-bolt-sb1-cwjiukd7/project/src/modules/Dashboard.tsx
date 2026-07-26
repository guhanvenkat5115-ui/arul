import { formatRupees } from '@/lib/supabase';
import { fetchApi } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Banknote,
  Smartphone,
  Clock,
  CalendarDays,
  Scale,
  ArrowRight,
} from 'lucide-react';

interface DayStats {
  total: number;
  gpay: number;
  cash: number;
  credit: number;
  count: number;
}

function emptyStats(): DayStats {
  return { total: 0, gpay: 0, cash: 0, credit: 0, count: 0 };
}

export function Dashboard() {
  const [todayStats, setTodayStats] = useState<DayStats>(emptyStats());
  const [yesterdayStats, setYesterdayStats] = useState<DayStats>(emptyStats());
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [weekAvg, setWeekAvg] = useState(0);
  const [monthAvg, setMonthAvg] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchApi<any>('/admin/dashboard');

      setTodayStats({
        total: data.total_sale_today,
        gpay: data.gpay.amount,
        cash: data.cash.amount,
        credit: data.credit.amount,
        count: data.total_orders_today,
      });

      setYesterdayStats({
        total: data.yesterday_total_sale,
        gpay: 0,
        cash: 0,
        credit: 0,
        count: 0,
      });

      setTodayExpenses(data.total_expense_today);
      setWeekAvg(data.average_week_sale);
      setMonthAvg(data.average_month_sale);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const openingBalance = todayStats.cash - todayExpenses;
  const diff = todayStats.total - yesterdayStats.total;
  const diffPct = yesterdayStats.total > 0 ? ((diff / yesterdayStats.total) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-brand-800">Dashboard Overview</h2>
        <p className="text-sm text-brand-500">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Opening Balance highlight */}
      <div className="overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-brand-50/90">
              <Scale size={16} /> Opening Balance (Cash on hand)
            </p>
            <p className="mt-2 text-4xl font-bold">{formatRupees(openingBalance)}</p>
            <p className="mt-2 text-sm text-brand-50/80">
              Today's cash sales {formatRupees(todayStats.cash)} minus today's expenses {formatRupees(todayExpenses)}
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
              <Wallet size={36} />
            </div>
          </div>
        </div>
      </div>

      {/* Today's sales */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-600">
          <CalendarDays size={16} /> Today's Sales
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Sales"
            value={formatRupees(todayStats.total)}
            sub={`${todayStats.count} orders`}
            icon={<TrendingUp size={20} />}
            accent="brand"
          />
          <StatCard
            label="GPay"
            value={formatRupees(todayStats.gpay)}
            icon={<Smartphone size={20} />}
            accent="blue"
          />
          <StatCard
            label="Cash"
            value={formatRupees(todayStats.cash)}
            icon={<Banknote size={20} />}
            accent="amber"
          />
          <StatCard
            label="Credit"
            value={formatRupees(todayStats.credit)}
            icon={<Clock size={20} />}
            accent="rose"
          />
        </div>
      </div>

      {/* Comparison + averages */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-600">
          <TrendingUp size={16} /> Trends
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-brand-600/70">Today vs Yesterday</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-2xl font-bold text-brand-800">{formatRupees(todayStats.total)}</span>
              <span
                className={`mb-1 flex items-center gap-0.5 text-sm font-semibold ${
                  diff >= 0 ? 'text-brand-600' : 'text-rose-500'
                }`}
              >
                {diff >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {diffPct}%
              </span>
            </div>
            <p className="mt-1 text-xs text-brand-500">
              Yesterday: {formatRupees(yesterdayStats.total)}
            </p>
          </div>
          <StatCard
            label="Weekly Average (per day)"
            value={formatRupees(weekAvg)}
            icon={<CalendarDays size={20} />}
            accent="brand"
          />
          <StatCard
            label="Monthly Average (per day)"
            value={formatRupees(monthAvg)}
            icon={<CalendarDays size={20} />}
            accent="slate"
          />
        </div>
      </div>

      {/* Payment breakdown bar */}
      <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-brand-700">Today's Payment Mix</h3>
        <PaymentBar stats={todayStats} />
      </div>

      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-3 text-xs text-brand-600">
        <ArrowRight size={14} />
        Records auto-delete after 31 days to keep the database tidy.
      </div>
    </div>
  );
}

function PaymentBar({ stats }: { stats: DayStats }) {
  const total = stats.total || 1;
  const gpayPct = (stats.gpay / total) * 100;
  const cashPct = (stats.cash / total) * 100;
  const creditPct = (stats.credit / total) * 100;
  return (
    <div>
      <div className="flex h-8 w-full overflow-hidden rounded-lg">
        <div className="bg-blue-500" style={{ width: `${gpayPct}%` }} title="GPay" />
        <div className="bg-amber-500" style={{ width: `${cashPct}%` }} title="Cash" />
        <div className="bg-rose-400" style={{ width: `${creditPct}%` }} title="Credit" />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs">
        <Legend color="bg-blue-500" label="GPay" value={formatRupees(stats.gpay)} />
        <Legend color="bg-amber-500" label="Cash" value={formatRupees(stats.cash)} />
        <Legend color="bg-rose-400" label="Credit" value={formatRupees(stats.credit)} />
      </div>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5 text-brand-700">
      <span className={`h-3 w-3 rounded ${color}`} />
      {label}: <strong>{value}</strong>
    </span>
  );
}
