import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  FileText, 
  Send, 
  Trash2, 
  Loader2, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

export const Leaves: React.FC = () => {
  const [balances, setBalances] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  
  // Form State
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Page States
  const [loading, setLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [balRes, reqRes, typesRes] = await Promise.all([
        api.get('/api/v1/leave-balances/me'),
        api.get('/api/v1/leave-requests/me'),
        api.get('/api/v1/leave-types'),
      ]);
      setBalances(balRes);
      setRequests(reqRes);
      setLeaveTypes(typesRes);
    } catch (err: any) {
      console.error('Failed to load leaves data', err);
      setError(err?.error?.message || err?.message || 'Failed to load leave records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitLoading(true);

    try {
      await api.post('/api/v1/leave-requests', {
        leaveTypeId,
        startDate,
        endDate,
        reason,
      });

      setSuccess('Leave request applied successfully!');
      setLeaveTypeId('');
      setStartDate('');
      setEndDate('');
      setReason('');
      
      // Refresh balances and list
      const [balRes, reqRes] = await Promise.all([
        api.get('/api/v1/leave-balances/me'),
        api.get('/api/v1/leave-requests/me'),
      ]);
      setBalances(balRes);
      setRequests(reqRes);
    } catch (err: any) {
      console.error('Apply leave error', err);
      setError(err?.error?.message || err?.message || 'Failed to submit leave request.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/api/v1/leave-requests/${id}/cancel`);
      setSuccess('Leave request cancelled successfully.');
      
      // Refresh balances and list
      const [balRes, reqRes] = await Promise.all([
        api.get('/api/v1/leave-balances/me'),
        api.get('/api/v1/leave-requests/me'),
      ]);
      setBalances(balRes);
      setRequests(reqRes);
    } catch (err: any) {
      console.error('Cancel leave error', err);
      setError(err?.error?.message || err?.message || 'Failed to cancel leave request.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Balances Display */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <h3 className="text-sm font-semibold text-slate-200 mb-6 flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-400" />
          <span>My Leave Balances</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {balances.map((bal: any) => {
            const allocated = Number(bal.allocated);
            const used = Number(bal.used);
            const available = allocated - used;
            const percentage = Math.round((used / allocated) * 100) || 0;

            return (
              <div key={bal.id} className="p-4 bg-slate-950 rounded-lg border border-slate-850 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-xs text-slate-250 truncate">{bal.leaveType?.name}</span>
                  <span className="text-[10px] text-slate-400">{available} / {allocated} Available</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full" 
                    style={{ width: `${100 - percentage}%` }}
                  ></div>
                </div>
                <span className="text-[9px] text-slate-500 block">Used: {used} days</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Apply Form & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Apply Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md h-fit">
          <h3 className="text-sm font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <Send className="w-4 h-4 text-violet-400" />
            <span>Apply for Leave</span>
          </h3>

          {error && (
            <div className="mb-4 p-4 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 rounded-lg bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{success}</span>
            </div>
          )}

          <form onSubmit={handleApply} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-350 font-semibold mb-1.5">Leave Type</label>
              <select
                required
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-slate-200 outline-none"
              >
                <option value="">Select Type</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-350 font-semibold mb-1.5">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-350 font-semibold mb-1.5">End Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-slate-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-350 font-semibold mb-1.5">Reason</label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Details of your request..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-slate-200 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-gradient-to-r from-violet-650 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-500 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 shadow-md shadow-violet-500/10 hover:shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Submit Application</span>
            </button>
          </form>
        </div>

        {/* Request History */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-200 mb-6">Leave Requests History</h3>

          {requests.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-12">No leave applications found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Duration</th>
                    <th className="pb-3">Days</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Approver</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-850/10 transition-colors">
                      <td className="py-3.5 font-medium text-slate-300">{req.leaveType?.name}</td>
                      <td className="py-3.5 text-slate-400">
                        {new Date(req.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(req.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3.5 text-slate-200 font-semibold">{Number(req.days)}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${
                          req.status === 'APPROVED' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
                          req.status === 'PENDING' ? 'bg-amber-950/20 border-amber-500/20 text-amber-400' :
                          req.status === 'CANCELLED' ? 'bg-slate-900 border-slate-850 text-slate-500' :
                          'bg-rose-950/20 border-rose-500/20 text-rose-400'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400">
                        {req.approver ? `${req.approver.firstName} ${req.approver.lastName}` : '--'}
                      </td>
                      <td className="py-3.5 text-right">
                        {req.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(req.id)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-rose-950/30 text-slate-400 hover:text-rose-450 border border-slate-700 hover:border-rose-900/30 transition-all duration-150 cursor-pointer"
                            title="Cancel Application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaves;
