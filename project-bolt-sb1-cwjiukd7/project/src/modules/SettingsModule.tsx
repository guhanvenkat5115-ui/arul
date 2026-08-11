import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Settings, Save, Percent, Plus, Trash2, Tag } from 'lucide-react';

export interface TaxItem {
  id: string;
  name: string;
  percentage: number;
}

export function SettingsModule() {
  const { notify } = useToast();
  const [taxes, setTaxes] = useState<TaxItem[]>([]);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await fetchApi<{ taxes: TaxItem[], admin_username?: string, admin_password?: string }>('/settings/');
      setTaxes(data.taxes || []);
      if (data.admin_username) setAdminUsername(data.admin_username);
      if (data.admin_password) setAdminPassword(data.admin_password);
    } catch (e: any) {
      notify(e.message || 'Could not load settings.', 'error');
    } finally {
      setInitialLoad(false);
    }
  }

  function addTax() {
    setTaxes([...taxes, { id: Date.now().toString(), name: '', percentage: 0 }]);
  }

  function removeTax(id: string) {
    setTaxes(taxes.filter((t) => t.id !== id));
  }

  function updateTax(id: string, field: keyof TaxItem, value: any) {
    setTaxes(
      taxes.map((t) => {
        if (t.id === id) {
          return { ...t, [field]: value };
        }
        return t;
      })
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation
    for (const t of taxes) {
      if (!t.name.trim()) {
        notify('All taxes must have a name.', 'error');
        return;
      }
      if (t.percentage < 0) {
        notify('Tax percentage cannot be negative.', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      await fetchApi('/settings/', {
        method: 'PUT',
        body: JSON.stringify({ 
          taxes,
          admin_username: adminUsername || undefined,
          admin_password: adminPassword || undefined
        }),
      });
      notify('Settings saved successfully.', 'success');
    } catch (e: any) {
      notify(e.message || 'Could not save settings.', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (initialLoad) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-brand-50 pb-4">
          <div className="rounded-xl bg-brand-50 p-2 text-brand-600">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-800">System Settings</h2>
            <p className="text-sm text-brand-500">Manage global application configurations</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600">Custom Taxes</h3>
                <p className="mt-1 text-xs text-brand-500">Define taxes like CGST, SGST, etc. These apply automatically to all sales.</p>
              </div>
              <button
                type="button"
                onClick={addTax}
                className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50"
              >
                <Plus size={14} /> Add Tax
              </button>
            </div>
            
            <div className="space-y-3">
              {taxes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-brand-200 p-6 text-center text-sm text-brand-400">
                  No taxes defined. Click "Add Tax" to create one.
                </div>
              ) : (
                taxes.map((tax, index) => (
                  <div key={tax.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-brand-100">
                    <div className="flex-1">
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-brand-400">
                          <Tag size={14} />
                        </div>
                        <input
                          type="text"
                          value={tax.name}
                          onChange={(e) => updateTax(tax.id, 'name', e.target.value)}
                          placeholder="Tax Name (e.g. CGST)"
                          className="w-full rounded-lg border border-brand-100 bg-brand-50/50 py-2 pl-9 pr-3 text-sm font-medium text-brand-800 outline-none transition focus:border-brand-500 focus:bg-white"
                        />
                      </div>
                    </div>
                    <div className="w-32">
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-brand-400">
                          <Percent size={14} />
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tax.percentage}
                          onChange={(e) => updateTax(tax.id, 'percentage', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-brand-100 bg-brand-50/50 py-2 pl-9 pr-3 text-sm font-medium text-brand-800 outline-none transition focus:border-brand-500 focus:bg-white"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTax(tax.id)}
                      className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                      title="Remove Tax"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600">Admin Credentials</h3>
              <p className="mt-1 text-xs text-brand-500">Update the username and password used to access the admin portal.</p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-700">Admin Username</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full rounded-lg border border-brand-200 bg-white p-2.5 text-sm text-brand-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-700">Admin Password</label>
                <input
                  type="text"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-lg border border-brand-200 bg-white p-2.5 text-sm text-brand-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="Arul@20"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:opacity-60"
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
