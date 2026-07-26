import { useState } from 'react';
import { ToastProvider } from '@/components/Toast';
import { BillingModule } from '@/modules/BillingModule';
import { ExpenseModule } from '@/modules/ExpenseModule';
import { Dashboard } from '@/modules/Dashboard';
import { EmployeeModule } from '@/modules/EmployeeModule';
import { SaleModule } from '@/modules/SaleModule';
import { SettingsModule } from '@/modules/SettingsModule';
import { Login, type Role } from '@/modules/Login';
import { Scale, LayoutDashboard, Users, BarChart3, Wallet, Truck, LogOut, Settings } from 'lucide-react';

type EmployeeTab = 'billing' | 'expense';
type AdminTab = 'dashboard' | 'employees' | 'sales' | 'settings';

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [loggedInName, setLoggedInName] = useState<string | null>(null);
  const [loggedInEmployeeId, setLoggedInEmployeeId] = useState<number | null>(null);

  const [empTab, setEmpTab] = useState<EmployeeTab>('billing');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

  function handleLogin(newRole: Role, employeeName?: string, employeeId?: number) {
    setRole(newRole);
    if (newRole === 'employee') {
      setLoggedInName(employeeName || null);
      setLoggedInEmployeeId(employeeId ?? null);
    } else {
      setLoggedInName('Admin');
      setLoggedInEmployeeId(null);
    }
  }

  function handleLogout() {
    setRole(null);
    setLoggedInName(null);
    setLoggedInEmployeeId(null);
  }

  if (!role) {
    return (
      <ToastProvider>
        <Login onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-brand-50/30">
        <Header role={role} name={loggedInName} onLogout={handleLogout} />

        <div className="mx-auto max-w-6xl px-4 py-6">
          {role === 'employee' ? (
            <>
              <Tabs
                tabs={[
                  { id: 'billing', label: 'Billing', icon: <Truck size={16} /> },
                  { id: 'expense', label: 'Expense', icon: <Wallet size={16} /> },
                ]}
                active={empTab}
                onChange={(t) => setEmpTab(t as EmployeeTab)}
              />
              <div className="mt-6">
                {empTab === 'billing' ? (
                  <BillingModule
                    fixedEmployeeId={loggedInEmployeeId}
                    fixedEmployeeName={loggedInName}
                  />
                ) : (
                  <ExpenseModule
                    fixedEmployeeId={loggedInEmployeeId}
                    fixedEmployeeName={loggedInName}
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <Tabs
                tabs={[
                  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
                  { id: 'employees', label: 'Employees', icon: <Users size={16} /> },
                  { id: 'sales', label: 'Sale Reports', icon: <BarChart3 size={16} /> },
                  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
                ]}
                active={adminTab}
                onChange={(t) => setAdminTab(t as AdminTab)}
              />
              <div className="mt-6">
                {adminTab === 'dashboard' ? (
                  <Dashboard />
                ) : adminTab === 'employees' ? (
                  <EmployeeModule />
                ) : adminTab === 'sales' ? (
                  <SaleModule />
                ) : (
                  <SettingsModule />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}

function Header({ role, name, onLogout }: { role: Role; name: string | null; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-brand-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-brand-600 p-2 text-white shadow-sm">
            <Scale size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-brand-800">Weighbridge Manager</h1>
            <p className="text-xs text-brand-500">{role === 'admin' ? 'Admin Portal' : 'Employee Portal'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {name && (
            <div className="text-sm font-medium text-brand-700">
              Welcome, <span className="font-bold">{name}</span>
            </div>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; icon: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-brand-100 bg-white p-2 shadow-sm">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            active === t.id
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-brand-700 hover:bg-brand-50'
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}
