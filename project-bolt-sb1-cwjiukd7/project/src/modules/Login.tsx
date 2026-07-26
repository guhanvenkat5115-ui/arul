import { useState } from 'react';
import { Lock, User, Scale, Shield, Users, ArrowLeft } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useToast } from '@/components/Toast';

export type Role = 'employee' | 'admin';

interface LoginProps {
  onLogin: (role: Role, employeeName?: string, employeeId?: number) => void;
}

export function Login({ onLogin }: LoginProps) {
  const { notify } = useToast();
  // null means showing the role selection screen
  const [role, setRole] = useState<Role | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      notify('Please enter both username and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchApi<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          role,
          username: username.trim(),
          password: password.trim(),
        }),
      });

      if (data.success) {
        notify(data.message, 'success');
        onLogin(data.role as Role, data.employee_name, data.employee_id);
      }
    } catch (e: any) {
      notify(e.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50/30 p-4">
      
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="mb-4 rounded-2xl bg-brand-600 p-4 text-white shadow-lg">
          <Scale size={40} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-900">Weighbridge Manager</h1>
        <p className="mt-2 text-brand-600">Secure Access Portal</p>
      </div>

      {!role ? (
        <div className="flex w-full max-w-2xl flex-col gap-6 sm:flex-row">
          {/* Admin Selection Card */}
          <button
            onClick={() => { setRole('admin'); setUsername(''); setPassword(''); }}
            className="group flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl border-2 border-transparent bg-white p-10 shadow-xl transition-all hover:border-brand-500 hover:shadow-2xl"
          >
            <div className="rounded-2xl bg-brand-100 p-5 text-brand-600 transition-transform group-hover:scale-110">
              <Shield size={48} />
            </div>
            <h2 className="text-xl font-bold text-brand-800">Admin Login</h2>
            <p className="text-sm text-brand-500">Access dashboard and management tools</p>
          </button>

          {/* Employee Selection Card */}
          <button
            onClick={() => { setRole('employee'); setUsername(''); setPassword(''); }}
            className="group flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl border-2 border-transparent bg-white p-10 shadow-xl transition-all hover:border-brand-500 hover:shadow-2xl"
          >
            <div className="rounded-2xl bg-brand-100 p-5 text-brand-600 transition-transform group-hover:scale-110">
              <Users size={48} />
            </div>
            <h2 className="text-xl font-bold text-brand-800">Employee Login</h2>
            <p className="text-sm text-brand-500">Access billing and expense entry</p>
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-3xl border border-brand-100 bg-white p-8 shadow-2xl">
          <div className="mb-8 flex items-center justify-between border-b border-brand-50 pb-4">
            <button 
              type="button"
              onClick={() => setRole(null)}
              className="flex items-center gap-2 rounded-lg text-sm font-semibold text-brand-500 transition hover:text-brand-700"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <h2 className="text-lg font-bold text-brand-800">
              {role === 'admin' ? 'Admin Portal' : 'Employee Portal'}
            </h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-700">
                {role === 'admin' ? 'Username' : 'Phone Number'}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-brand-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={role === 'admin' ? 'Enter admin username' : 'Enter your phone number'}
                  className="w-full rounded-xl border-2 border-brand-100 bg-brand-50/50 py-3 pl-11 pr-4 text-sm font-medium text-brand-800 outline-none transition focus:border-brand-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-700">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-brand-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border-2 border-brand-100 bg-brand-50/50 py-3 pl-11 pr-4 text-sm font-medium text-brand-800 outline-none transition focus:border-brand-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg transition hover:bg-brand-700 focus:ring-4 focus:ring-brand-500/30 disabled:opacity-70"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
