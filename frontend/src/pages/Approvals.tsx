import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  Check, 
  X, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Approvals: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPendingRequests = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/leave-requests/pending');
      setRequests(response);
    } catch (err: any) {
      console.error('Failed to load pending requests', err);
      setError(err?.error?.message || err?.message || 'Failed to load pending requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [user]);

  const handleDecide = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id + '-' + action);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/api/v1/leave-requests/${id}/${action}`);
      setSuccess(`Leave request ${action}d successfully.`);
      
      // Refresh list
      const response = await api.get('/api/v1/leave-requests/pending');
      setRequests(response);
    } catch (err: any) {
      console.error(`Failed to ${action} leave request`, err);
      setError(err?.error?.message || err?.message || `Failed to ${action} leave request.`);
    } finally {
      setActionLoading(null);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 font-sans">Pending Leave Approvals</h1>
        <p className="text-xs text-slate-400">Review and decide on leave applications submitted by your team reports</p>
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

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        {requests.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-slate-950 rounded-full border border-slate-800 text-slate-650 mb-2">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 font-medium">All caught up! No pending leave requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-550 font-semibold">
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Leave Type</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Days</th>
                  <th className="pb-3">Reason</th>
                  <th className="pb-3 text-right">Decide</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-850/10 transition-colors">
                    <td className="py-4">
                      <p className="font-semibold text-slate-300">{req.employee?.firstName} {req.employee?.lastName}</p>
                      <span className="text-[10px] text-slate-500">{req.employee?.email}</span>
                    </td>
                    <td className="py-4 text-slate-350 font-medium">{req.leaveType?.name}</td>
                    <td className="py-4 text-slate-400">
                      {new Date(req.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(req.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 text-slate-200 font-bold">{Number(req.days)}</td>
                    <td className="py-4 text-slate-400 max-w-xs truncate" title={req.reason}>
                      {req.reason || '--'}
                    </td>
                    <td className="py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleDecide(req.id, 'approve')}
                          disabled={!!actionLoading}
                          className="px-2.5 py-1 rounded bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === req.id + '-approve' ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleDecide(req.id, 'reject')}
                          disabled={!!actionLoading}
                          className="px-2.5 py-1 rounded bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/20 hover:border-rose-500/40 text-rose-450 text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === req.id + '-reject' ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          <span>Reject</span>
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
  );
};

export default Approvals;
