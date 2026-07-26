import { useEffect, useMemo, useState } from 'react';
import { formatRupees, formatDateTime, toDateInput, type Sale, type PaymentMode, PAYMENT_MODE_LABELS } from '@/lib/supabase';
import { fetchApi } from '@/lib/api';
import { Download, Filter, Calendar, Smartphone, Banknote, Clock, LayoutGrid, X } from 'lucide-react';
import * as XLSX from 'xlsx';

type ModeFilter = 'all' | PaymentMode;
type DateFilter = 'today' | 'single' | 'range';

export function SaleModule() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [singleDate, setSingleDate] = useState(toDateInput(new Date()));
  const [fromDate, setFromDate] = useState(toDateInput(new Date()));
  const [toDate, setToDate] = useState(toDateInput(new Date()));
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    void load();
  }, [dateFilter, singleDate, fromDate, toDate, modeFilter]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter === 'single') {
        params.append('start_date', singleDate);
        params.append('end_date', singleDate);
      } else if (dateFilter === 'range') {
        params.append('start_date', fromDate);
        params.append('end_date', toDate);
      }

      if (modeFilter !== 'all') {
        params.append('payment_mode', modeFilter);
      }

      let endpoint = '/sales/';
      if (dateFilter === 'today' && modeFilter === 'all') {
        endpoint = '/sales/today';
      } else if (dateFilter === 'today') {
        const today = toDateInput(new Date());
        params.append('start_date', today);
        params.append('end_date', today);
      }

      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      const data = await fetchApi<Sale[]>(url);
      setSales(data ?? []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const totals = useMemo(() => {
    return sales.reduce(
      (acc, s) => {
        acc.total += s.amount;
        if (s.payment_mode === 'gpay') acc.gpay += s.amount;
        else if (s.payment_mode === 'cash') acc.cash += s.amount;
        else acc.credit += s.amount;
        return acc;
      },
      { total: 0, gpay: 0, cash: 0, credit: 0 }
    );
  }, [sales]);

  function downloadExcel() {
    const headers = ['Date & Time', 'Vehicle Number', 'Customer Name', 'Customer Number', 'Payment Mode', 'Amount (Rs)', 'Employee ID', 'Employee Name'];
    const rows = sales.map((s) => [
      formatDateTime(s.created_at),
      s.vehicle_number,
      s.customer_name,
      s.customer_number ?? '',
      PAYMENT_MODE_LABELS[s.payment_mode],
      s.amount,
      s.employee_id ?? '',
      s.employee_name ?? '',
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');

    XLSX.writeFile(workbook, `sales_report_${toDateInput(new Date())}.xlsx`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-brand-800">Sale Reports</h2>
        <button
          onClick={downloadExcel}
          disabled={sales.length === 0}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
        >
          <Download size={16} /> Download Excel
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-brand-700">
          <Filter size={16} /> Filters
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-600">Date Range</label>
            <div className="flex flex-wrap gap-1.5">
              {([
                { k: 'today', label: 'Today', icon: <Calendar size={13} /> },
                { k: 'single', label: 'Single Day', icon: <Calendar size={13} /> },
                { k: 'range', label: 'Date Range', icon: <Calendar size={13} /> },
              ] as const).map((opt) => (
                <button
                  key={opt.k}
                  onClick={() => setDateFilter(opt.k)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${dateFilter === opt.k
                      ? 'bg-brand-500 text-white'
                      : 'border border-brand-200 text-brand-700 hover:bg-brand-50'
                    }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {dateFilter === 'single' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-brand-600">Select Date</label>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="input"
              />
            </div>
          )}
          {dateFilter === 'range' && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-brand-600">From</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-brand-600">To</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input" />
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-600">Payment Mode</label>
            <div className="flex flex-wrap gap-1.5">
              {([
                { k: 'all', label: 'All', icon: <LayoutGrid size={13} /> },
                { k: 'gpay', label: 'GPay', icon: <Smartphone size={13} /> },
                { k: 'cash', label: 'Cash', icon: <Banknote size={13} /> },
                { k: 'credit', label: 'Credit', icon: <Clock size={13} /> },
              ] as const).map((opt) => (
                <button
                  key={opt.k}
                  onClick={() => setModeFilter(opt.k)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${modeFilter === opt.k
                      ? 'bg-brand-500 text-white'
                      : 'border border-brand-200 text-brand-700 hover:bg-brand-50'
                    }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          label="Total" value={formatRupees(totals.total)} count={sales.length} accent="brand"
          onClick={() => setModeFilter('all')}
          isActive={modeFilter === 'all'}
        />
        <SummaryTile
          label="GPay" value={formatRupees(totals.gpay)} accent="blue"
          onClick={() => setModeFilter('gpay')}
          isActive={modeFilter === 'gpay'}
        />
        <SummaryTile
          label="Cash" value={formatRupees(totals.cash)} accent="amber"
          onClick={() => setModeFilter('cash')}
          isActive={modeFilter === 'cash'}
        />
        <SummaryTile
          label="Credit" value={formatRupees(totals.credit)} accent="rose"
          onClick={() => setModeFilter('credit')}
          isActive={modeFilter === 'credit'}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-brand-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : sales.length === 0 ? (
          <p className="p-8 text-center text-sm text-brand-500">No sales found for the selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-100 bg-brand-50/50 text-brand-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date & Time</th>
                  <th className="px-4 py-3 font-semibold">Vehicle</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Mode</th>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedSale(s)}
                    className="cursor-pointer border-b border-brand-50 last:border-0 hover:bg-brand-50"
                  >
                    <td className="px-4 py-3 text-brand-600 whitespace-nowrap">{formatDateTime(s.created_at)}</td>
                    <td className="px-4 py-3 font-mono font-medium text-brand-800">{s.vehicle_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-800">{s.customer_name}</p>
                      <p className="text-xs text-brand-500">{s.customer_number ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ModeBadge mode={s.payment_mode} />
                    </td>
                    <td className="px-4 py-3 text-brand-600">
                      {s.employee_name ? `${s.employee_name}` : '—'}
                      {s.employee_id && <span className="block text-xs text-brand-400">{s.employee_id}</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-700">{formatRupees(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-fade-in rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-brand-100 pb-4">
              <h3 className="text-lg font-bold text-brand-800">Order Details</h3>
              <button
                onClick={() => setSelectedSale(null)}
                className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Date & Time" value={formatDateTime(selectedSale.created_at)} />
                <DetailItem label="Order ID" value={`#${selectedSale.id}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Vehicle Number" value={selectedSale.vehicle_number} className="font-mono text-lg" />
                <DetailItem label="Amount" value={formatRupees(selectedSale.amount)} className="text-lg font-bold text-brand-700" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Customer Name" value={selectedSale.customer_name} />
                <DetailItem label="Customer Phone" value={selectedSale.customer_number || '—'} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Payment Mode" value={PAYMENT_MODE_LABELS[selectedSale.payment_mode]} />
                <DetailItem label="Billed By" value={selectedSale.employee_name || 'Admin'} subValue={selectedSale.employee_id ? `ID: ${selectedSale.employee_id}` : ''} />
              </div>
            </div>

            <button
              onClick={() => setSelectedSale(null)}
              className="mt-6 w-full rounded-xl bg-brand-50 py-2.5 font-semibold text-brand-700 hover:bg-brand-100"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #bbf7d0;
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #14532d;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.15); }
      `}</style>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  count,
  accent,
  onClick,
  isActive,
}: {
  label: string;
  value: string;
  count?: number;
  accent: 'brand' | 'blue' | 'amber' | 'rose';
  onClick?: () => void;
  isActive?: boolean;
}) {
  const colors: Record<string, string> = {
    brand: 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100',
    blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  };

  const activeClass = isActive ? 'ring-2 ring-offset-2 ring-brand-500 shadow-md' : 'shadow-sm';

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${colors[accent]} ${activeClass}`}
    >
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {count !== undefined && <p className="mt-0.5 text-xs opacity-70">{count} orders</p>}
    </div>
  );
}

function ModeBadge({ mode }: { mode: PaymentMode }) {
  const colors: Record<PaymentMode, string> = {
    gpay: 'bg-blue-100 text-blue-700',
    cash: 'bg-amber-100 text-amber-700',
    credit: 'bg-rose-100 text-rose-700',
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[mode]}`}>
      {PAYMENT_MODE_LABELS[mode]}
    </span>
  );
}

function DetailItem({ label, value, subValue, className = '' }: { label: string; value: string; subValue?: string; className?: string }) {
  return (
    <div className="rounded-xl border border-brand-50 bg-brand-50/30 p-3">
      <p className="mb-1 text-xs font-semibold text-brand-500 uppercase tracking-wider">{label}</p>
      <p className={`text-brand-800 ${className}`}>{value}</p>
      {subValue && <p className="text-xs text-brand-400 mt-0.5">{subValue}</p>}
    </div>
  );
}
