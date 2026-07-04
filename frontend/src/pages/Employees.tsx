import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  UserPlus, 
  Edit3, 
  Trash2, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Plus
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [roleName, setRoleName] = useState('EMPLOYEE');
  const [password, setPassword] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get('/api/v1/employees'),
        api.get('/api/v1/departments'),
      ]);
      setEmployees(empRes);
      setDepartments(deptRes);
    } catch (err: any) {
      console.error('Failed to load employee list', err);
      setError(err?.error?.message || err?.message || 'Failed to load employee files.');
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
    setFirstName('');
    setLastName('');
    setEmail('');
    setEmployeeCode('');
    setDesignation('');
    setDepartmentId('');
    setManagerId('');
    setDateOfJoining('');
    setStatus('ACTIVE');
    setRoleName('EMPLOYEE');
    setPassword('DemoPassword123!');
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (emp: any) => {
    setIsEdit(true);
    setCurrentId(emp.id);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setEmail(emp.email);
    setEmployeeCode(emp.employeeCode);
    setDesignation(emp.designation);
    setDepartmentId(emp.departmentId);
    setManagerId(emp.managerId || '');
    setDateOfJoining(emp.dateOfJoining ? emp.dateOfJoining.slice(0, 10) : '');
    setStatus(emp.status);
    setRoleName(emp.user?.role?.name || 'EMPLOYEE');
    setPassword(''); // No password change on standard edit
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
        await api.put(`/api/v1/employees/${currentId}`, {
          firstName,
          lastName,
          designation,
          departmentId,
          managerId: managerId || null,
          status,
          roleName,
        });
        setSuccess('Employee record updated successfully.');
        toast('success', 'Profile Updated', 'Employee record updated successfully.');
      } else {
        await api.post('/api/v1/employees', {
          firstName,
          lastName,
          email,
          employeeCode,
          designation,
          departmentId,
          managerId: managerId || null,
          dateOfJoining,
          status,
          roleName,
          password,
        });
        setSuccess('Employee registered successfully.');
        toast('success', 'Employee Registered', 'New employee profile created and portal access provisioned.');
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      console.error('Submit employee failed', err);
      setError(err?.error?.message || err?.message || 'Failed to save employee profile.');
      toast('error', 'Save Failed', err?.error?.message || err?.message || 'Failed to save employee profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee? This will soft-delete their record.')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/api/v1/employees/${id}`);
      setSuccess('Employee deleted successfully.');
      toast('info', 'Employee Removed', 'Employee record has been soft-deleted from the directory.');
      await loadData();
    } catch (err: any) {
      console.error('Delete employee failed', err);
      setError(err?.error?.message || err?.message || 'Failed to delete employee.');
      toast('error', 'Deletion Failed', err?.error?.message || err?.message || 'Failed to delete employee.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-6 bg-slate-800 rounded w-44 mb-2"></div>
            <div className="h-3 bg-slate-850 rounded w-72"></div>
          </div>
          <div className="h-9 w-36 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-4 pb-3 border-b border-slate-800">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (<div key={i} className="h-3 bg-slate-800 rounded"></div>))}
            </div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="grid grid-cols-7 gap-4 py-3">
                <div className="h-3 bg-slate-800 rounded"></div>
                <div className="space-y-1"><div className="h-3 bg-slate-800 rounded"></div><div className="h-2 bg-slate-850 rounded w-3/4"></div></div>
                <div className="h-3 bg-slate-800 rounded"></div>
                <div className="h-3 bg-slate-800 rounded"></div>
                <div className="h-3 bg-slate-800 rounded"></div>
                <div className="h-5 w-16 bg-slate-800 rounded"></div>
                <div className="flex justify-end gap-1"><div className="h-7 w-7 bg-slate-800 rounded"></div><div className="h-7 w-7 bg-slate-800 rounded"></div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-sans">Employee Directory</h1>
          <p className="text-xs text-slate-400">View and update user profiles, designations, and manager chains</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-indigo-650 to-blue-600 hover:from-indigo-600 hover:to-blue-500 text-white font-semibold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-550/15 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
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
                <th className="pb-3">Employee Code</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">Designation</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Manager</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-850/10 transition-colors">
                  <td className="py-3.5 text-indigo-400 font-semibold">{emp.employeeCode}</td>
                  <td className="py-3.5">
                    <p className="font-semibold text-slate-200">{emp.firstName} {emp.lastName}</p>
                    <span className="text-[10px] text-slate-500">{emp.email}</span>
                  </td>
                  <td className="py-3.5 text-slate-350">{emp.designation}</td>
                  <td className="py-3.5 text-slate-400">{emp.department?.name || '--'}</td>
                  <td className="py-3.5 text-slate-400">
                    {emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : '--'}
                  </td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${
                      emp.status === 'ACTIVE' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
                      'bg-rose-950/20 border-rose-500/20 text-rose-400'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-250 border border-slate-700 transition-colors cursor-pointer"
                        title="Edit Employee"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-rose-950/30 text-slate-400 hover:text-rose-450 border border-slate-700 hover:border-rose-900/30 transition-colors cursor-pointer"
                        title="Delete Employee"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>{isEdit ? 'Edit Employee Details' : 'Register New Employee'}</span>
            </h3>

            {error && (
              <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
              </div>

              {!isEdit && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.smith@company.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Employee Code (Unique)</label>
                    <input
                      type="text"
                      required
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                      placeholder="EMP-101"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Designation</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Software Engineer"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Department</label>
                  <select
                    required
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Manager (Reports To)</label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none"
                  >
                    <option value="">No Manager (Root)</option>
                    {employees
                      .filter((emp) => emp.id !== currentId) // Avoid reporting to self
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.designation})</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Employment Status</label>
                  <select
                    required
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="TERMINATED">TERMINATED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Portal RBAC Role</label>
                  <select
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="HR">HR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                {!isEdit ? (
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Portal Password</label>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Date of Joining</label>
                    <input
                      type="text"
                      disabled
                      value={dateOfJoining}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2.5 text-slate-500 outline-none cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              {!isEdit && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Date of Joining</label>
                  <input
                    type="date"
                    required
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-gradient-to-r from-indigo-650 to-blue-600 hover:from-indigo-600 hover:to-blue-500 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 shadow-md shadow-indigo-550/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isEdit ? 'Save Changes' : 'Register Profile'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
