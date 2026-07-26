import { useEffect, useState } from 'react';
import { type Employee } from '@/lib/supabase';
import { fetchApi } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Users, UserPlus, Save, Trash2, Edit2, X } from 'lucide-react';

export function EmployeeModule() {
  const { notify } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const data = await fetchApi<Employee[]>('/employees/');
      setEmployees(data);
    } catch (e: any) {
      notify(e.message || 'Could not load employees.', 'error');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || (!editingId && !password.trim())) {
      notify('Please enter name, phone, and password (for new employees).', 'error');
      return;
    }
    setLoading(true);

    try {
      if (editingId) {
        // Update
        const body: Record<string, string> = {
          name: name.trim(),
          phone_number: phone.trim(),
          address: address.trim(),
        };
        if (password.trim()) {
          body.password = password.trim();
        }
        await fetchApi(`/employees/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        notify('Employee updated successfully.');
      } else {
        // Create
        await fetchApi('/employees/', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            phone_number: phone.trim(),
            address: address.trim(),
            password: password.trim(),
          }),
        });
        notify('Employee created successfully.');
      }
      resetForm();
      void load();
    } catch (err: any) {
      notify(err.message || 'An error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await fetchApi(`/employees/${id}`, { method: 'DELETE' });
      notify('Employee deleted successfully.');
      if (editingId === id) resetForm();
      void load();
    } catch (err: any) {
      notify(err.message || 'Could not delete employee.', 'error');
    }
  }

  function startEdit(emp: Employee) {
    setEditingId(emp.employee_id);
    setName(emp.name);
    setPhone(emp.phone_number);
    setAddress(emp.address || '');
    setPassword('');
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setPhone('');
    setAddress('');
    setPassword('');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="text-brand-600" size={22} />
              <h2 className="text-lg font-semibold text-brand-800">
                {editingId ? 'Edit Employee' : 'Add Employee'}
              </h2>
            </div>
            {editingId && (
              <button
                onClick={resetForm}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-500 hover:bg-brand-50 hover:text-brand-700"
              >
                <X size={14} /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Employee Name"
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">Phone Number (Username)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">Address (Optional)</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address"
                rows={2}
                className="input resize-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">
                {editingId ? 'New Password (Optional)' : 'Password'}
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingId ? 'Leave blank to keep current' : 'Password'}
                type="password"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
            >
              <Save size={18} />
              {loading ? 'Saving...' : editingId ? 'Update Employee' : 'Save Employee'}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="text-brand-600" size={18} />
            <h3 className="text-base font-semibold text-brand-800">Employee List</h3>
          </div>
          {employees.length === 0 ? (
            <p className="text-sm text-brand-500">No employees found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-100 text-brand-500">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Phone (Username)</th>
                    <th className="pb-3 font-medium">Address</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {employees.map((emp) => (
                    <tr key={emp.employee_id} className="group">
                      <td className="py-3 font-medium text-brand-800">{emp.name}</td>
                      <td className="py-3 text-brand-600">{emp.phone_number}</td>
                      <td className="py-3 text-brand-500">{emp.address || '-'}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() => startEdit(emp)}
                            className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.employee_id)}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
