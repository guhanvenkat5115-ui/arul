import { useEffect, useState } from 'react';
import { formatRupees, type Employee, type Sale, type PaymentMode, PAYMENT_MODE_LABELS } from '@/lib/supabase';
import { fetchApi } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Truck, User, Phone, Wallet, CheckCircle2, Receipt } from 'lucide-react';
import type { TaxItem } from '@/modules/SettingsModule';

export function BillingModule({ fixedEmployeeId, fixedEmployeeName }: { fixedEmployeeId?: number | null, fixedEmployeeName?: string | null }) {
  const { notify } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [amount, setAmount] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recent, setRecent] = useState<Sale[]>([]);
  const [taxes, setTaxes] = useState<TaxItem[]>([]);

  useEffect(() => {
    if (fixedEmployeeId === undefined || fixedEmployeeId === null) {
      void loadEmployees();
    }
    void loadRecent();
    void loadTaxes();
  }, [fixedEmployeeId]);

  async function loadTaxes() {
    try {
      const data = await fetchApi<{ taxes: TaxItem[] }>('/settings/');
      setTaxes(data.taxes || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadEmployees() {
    try {
      const data = await fetchApi<Employee[]>('/employees/');
      setEmployees(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadRecent() {
    try {
      const data = await fetchApi<Sale[]>('/billing/?limit=5');
      setRecent(data);
    } catch (e) {
      console.error(e);
    }
  }

  const selectedEmployee = employees.find((e) => e.employee_id === Number(employeeId));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!vehicleNumber.trim() || !customerName.trim() || isNaN(amt) || amt <= 0) {
      notify('Please fill vehicle number, customer name and a valid amount.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await fetchApi('/billing/', {
        method: 'POST',
        body: JSON.stringify({
          vehicle_number: vehicleNumber.trim().toUpperCase(),
          customer_name: customerName.trim(),
          customer_number: customerNumber.trim() || null,
          payment_mode: paymentMode,
          amount: Number((amt * (1 + (taxes.reduce((acc, t) => acc + t.percentage, 0)) / 100)).toFixed(2)),
          employee_id: fixedEmployeeId !== undefined && fixedEmployeeId !== null ? fixedEmployeeId : (selectedEmployee ? Number(selectedEmployee.employee_id) : null),
          employee_name: fixedEmployeeName !== undefined && fixedEmployeeName !== null ? fixedEmployeeName : (selectedEmployee?.name ?? null),
        }),
      });
      setSubmitting(false);
      notify('Sale saved successfully.');
      setVehicleNumber('');
      setCustomerName('');
      setCustomerNumber('');
      setAmount('');
      setPaymentMode('cash');
      void loadRecent();
    } catch (e: any) {
      setSubmitting(false);
      notify(e.message || 'Could not save the sale. Please try again.', 'error');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Receipt className="text-brand-600" size={22} />
            <h2 className="text-lg font-semibold text-brand-800">New Billing Entry</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vehicle Number" icon={<Truck size={16} />}>
                <input
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. TN 45 AB 1234"
                  className="input"
                />
              </Field>
              <Field label="Customer Name" icon={<User size={16} />}>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="input"
                />
              </Field>
              <Field label="Customer Number" icon={<Phone size={16} />}>
                <input
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  placeholder="Phone number"
                  className="input"
                />
              </Field>
              <Field label="Amount (Rs.)" icon={<Wallet size={16} />}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="input"
                />
                {taxes.length > 0 && amount && !isNaN(parseFloat(amount)) && (
                  <div className="mt-2 space-y-1 text-xs text-brand-600">
                    {taxes.map((t) => (
                      <p key={t.id}>+ {t.name} ({t.percentage}%) = <span className="font-semibold">{formatRupees(parseFloat(amount) * (t.percentage / 100))}</span></p>
                    ))}
                    <p className="border-t border-brand-100 pt-1 text-[13px] font-bold text-brand-700">
                      Final Total: {formatRupees(parseFloat(amount) * (1 + (taxes.reduce((acc, t) => acc + t.percentage, 0)) / 100))}
                    </p>
                  </div>
                )}
              </Field>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(PAYMENT_MODE_LABELS) as PaymentMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${paymentMode === mode
                        ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                        : 'border-brand-200 bg-white text-brand-700 hover:bg-brand-50'
                      }`}
                  >
                    {PAYMENT_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>

            {(fixedEmployeeId === undefined || fixedEmployeeId === null) && (
              <Field label="Employee (optional)">
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="input"
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.name} ({emp.phone_number})
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
            >
              <CheckCircle2 size={18} />
              {submitting ? 'Saving...' : 'Submit Sale'}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-brand-800">Recent Entries</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-brand-500">No sales recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-brand-800">{s.vehicle_number}</p>
                    <p className="text-xs text-brand-500">
                      {s.customer_name} · {PAYMENT_MODE_LABELS[s.payment_mode]}
                    </p>
                  </div>
                  <span className="font-semibold text-brand-700">{formatRupees(s.amount)}</span>
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

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-brand-700">
        {icon && <span className="text-brand-500">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}
