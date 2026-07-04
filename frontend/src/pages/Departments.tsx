import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  Briefcase, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react';

export const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [headEmployeeId, setHeadEmployeeId] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptRes, empRes] = await Promise.all([
        api.get('/api/v1/departments'),
        api.get('/api/v1/employees'),
      ]);
      setDepartments(deptRes);
      setEmployees(empRes);
    } catch (err: any) {
      console.error('Failed to load departments', err);
      setError(err?.error?.message || err?.message || 'Failed to load department files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setIsEdit(false);
    setCurrentId(null);
    setName('');
    setCode('');
    setHeadEmployeeId('');
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (dept: any) => {
    setIsEdit(true);
    setCurrentId(dept.id);
    setName(dept.name);
    setCode(dept.code);
    setHeadEmployeeId(dept.headEmployeeId || '');
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setActionLoading(true);

    try {
      if (isEdit && currentId) {
        await api.put(`/api/v1/departments/${currentId}`, {
          name,
          code,
          headEmployeeId: headEmployeeId || null,
        });
        setSuccess('Department updated successfully.');
      } else {
        await api.post('/api/v1/departments', {
          name,
          code,
          headEmployeeId: headEmployeeId || null,
        });
        setSuccess('Department created successfully.');
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      console.error('Submit department failed', err);
      setError(err?.error?.message || err?.message || 'Failed to save department.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department? This will soft-delete it.')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/api/v1/departments/${id}`);
      setSuccess('Department deleted successfully.');
      await loadData();
    } catch (err: any) {
      console.error('Delete department failed', err);
      setError(err?.error?.message || err?.message || 'Failed to delete department.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-sans">Departments</h1>
          <p className="text-xs text-slate-400">Manage company departments and assign department heads</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-indigo-650 to-blue-600 hover:from-indigo-600 hover:to-blue-500 text-white font-semibold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-555/15 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Department</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{success}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-550 font-semibold">
                <th className="pb-3">Code</th>
                <th className="pb-3">Department Name</th>
                <th className="pb-3">Department Head</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-850/10 transition-colors">
                  <td className="py-3.5 text-indigo-400 font-semibold uppercase">{dept.code}</td>
                  <td className="py-3.5 text-slate-200 font-semibold">{dept.name}</td>
                  <td className="py-3.5 text-slate-400">
                    {dept.headEmployee ? `${dept.headEmployee.firstName} ${dept.headEmployee.lastName}` : '--'}
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(dept)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-250 border border-slate-700 transition-colors cursor-pointer"
                        title="Edit Department"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-rose-950/30 text-slate-400 hover:text-rose-450 border border-slate-700 hover:border-rose-900/30 transition-colors cursor-pointer"
                        title="Delete Department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL OVERLAY */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span>{isEdit ? 'Edit Department Details' : 'Create Department'}</span>
            </h3>

            {error && (
              <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Department Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Engineering"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Department Code (Unique)</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ENG"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Department Head (Manager)</label>
                <select
                  value={headEmployeeId}
                  onChange={(e) => setHeadEmployeeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none"
                >
                  <option value="">No Department Head Assigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.designation})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-gradient-to-r from-indigo-650 to-blue-600 hover:from-indigo-600 hover:to-blue-500 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 shadow-md shadow-indigo-555/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isEdit ? 'Save Changes' : 'Create Department'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
