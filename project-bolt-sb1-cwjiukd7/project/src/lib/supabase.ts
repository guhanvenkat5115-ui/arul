
export type PaymentMode = 'gpay' | 'cash' | 'credit';

export interface Employee {
  employee_id: number;
  name: string;
  phone_number: string;
  address: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  vehicle_number: string;
  customer_name: string;
  customer_number: string | null;
  payment_mode: PaymentMode;
  amount: number;
  employee_id: string | null;
  employee_name: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  reason: string;
  amount: number;
  employee_id: string | null;
  employee_name: string | null;
  created_at: string;
}

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  gpay: 'GPay',
  cash: 'Cash',
  credit: 'Credit',
};

export function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
