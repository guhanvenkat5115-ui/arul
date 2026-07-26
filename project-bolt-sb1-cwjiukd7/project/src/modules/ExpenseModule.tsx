import { useEffect, useState } from 'react';
import { formatRupees, type Employee, type Expense } from '@/lib/supabase';
import { fetchApi } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Receipt, CheckCircle2, Wallet } from 'lucide-react';

export function ExpenseModule({ fixedEmployeeId, fixedEmployeeName }: { fixedEmployeeId?: number | null, fixedEmployeeName?: string | null }) {
  const { notify } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recent, setRecent] = useState<Expense[]>([]);

  useEffect(() => {
    if (fixedEmployeeId === undefined || fixedEmployeeId === null) {
      void loadEmployees();
    }
    void loadRecent();
  }, [fixedEmployeeId]);

  async function loadEmployees() {
    try {
      const data = await fetchApi<Employee[]>('/employees/');
      setEmployees(data ?? []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadRecent() {
    try {
      const data = await fetchApi<Expense[]>('/expenses/?limit=5');
      setRecent(data ?? []);
    } catch (e) {
      console.error(e);
    }
  }

  const selectedEmployee = employees.find((e) => e.employee_id === Number(employeeId));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!reason.trim() || isNaN(amt) || amt <= 0) {
      notify('Please enter a reason and a valid amount.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await fetchApi('/expenses/', {
        method: 'POST',
        body: JSON.stringify({
          reason: reason.trim(),
          amount: amt,
          employee_id: fixedEmployeeId !== undefined && fixedEmployeeId !== null ? fixedEmployeeId : (selectedEmployee ? Number(selectedEmployee.employee_id) : null),
          employee_name: fixedEmployeeName !== undefined && fixedEmployeeName !== null ? fixedEmployeeName : (selectedEmployee?.name ?? 'Unknown'),
        })
      });
      setSubmitting(false);
      notify('Expense saved successfully.');
      setReason('');
      setAmount('');
      void loadRecent();
    } catch (e: any) {
      setSubmitting(false);
      notify(e.message || 'Could not save the expense. Please try again.', 'error');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Wallet className="text-brand-600" size={22} />
            <h2 className="text-lg font-semibold text-brand-800">New Expense Entry</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">Expense Reason</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Diesel, Maintenance, Tea"
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">Amount (Rs.)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input"
              />
            </div>
            {(fixedEmployeeId === undefined || fixedEmployeeId === null) && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-700">Employee (optional)</label>
                <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="input">
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.name} ({emp.phone_number})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
            >
              <CheckCircle2 size={18} />
              {submitting ? 'Saving...' : 'Submit Expense'}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="text-brand-600" size={18} />
            <h3 className="text-base font-semibold text-brand-800">Recent Expenses</h3>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-brand-500">No expenses recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((x) => (
                <li
                  key={x.id}
                  className="flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-brand-800">{x.reason}</p>
                    {x.employee_name && <p className="text-xs text-brand-500">by {x.employee_name}</p>}
                  </div>
                  <span className="font-semibold text-brand-700">{formatRupees(x.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #bbf7d0;
          background: white;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #14532d;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,.15);
        }
      `}</style>
    </div>
  );
}
