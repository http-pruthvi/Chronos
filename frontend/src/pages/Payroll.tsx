import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  DollarSign, 
  Plus, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Play,
  Lock,
  Eye,
  FileText,
  AlertTriangle,
  X
} from 'lucide-react';


export const Payroll: React.FC = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  
  // Anomalies Modal
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [showAnomaliesModal, setShowAnomaliesModal] = useState<boolean>(false);
  const [anomaliesLoading, setAnomaliesLoading] = useState<boolean>(false);

  // Payslip Detail Modal
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [showPayslipModal, setShowPayslipModal] = useState<boolean>(false);

  // Form Field State
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  // Global Page States
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchRuns = async () => {
    try {
      const list = await api.get('/api/v1/payroll/runs');
      setRuns(list);
    } catch (err: any) {
      console.error('Failed to fetch payroll runs', err);
      setError(err?.error?.message || err?.message || 'Failed to fetch payroll history.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchRuns();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setActionLoading('create');
    try {
      const response = await api.post('/api/v1/payroll/runs', { month, year });
      setSuccess(`Payroll run for ${month}/${year} created in DRAFT status.`);
      await fetchRuns();
      handleSelectRun(response.id);
    } catch (err: any) {
      console.error('Failed to create run', err);
      setError(err?.error?.message || err?.message || 'Failed to create run.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectRun = async (id: string) => {
    setActionLoading('select-' + id);
    setError(null);
    setSuccess(null);
    try {
      const runDetails = await api.get(`/api/v1/payroll/runs/${id}`);
      setSelectedRun(runDetails);
    } catch (err: any) {
      console.error('Failed to fetch run details', err);
      setError('Failed to fetch details for the selected payroll run.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcessRun = async (id: string) => {
    setActionLoading('process');
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/api/v1/payroll/runs/${id}/process`);
      setSuccess(`Calculations completed! Generated employee payslips successfully.`);
      await fetchRuns();
      await handleSelectRun(id);
    } catch (err: any) {
      console.error('Processing run failed', err);
      setError(err?.error?.message || err?.message || 'Failed to process run.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayRun = async (id: string) => {
    if (!window.confirm('Are you sure you want to lock and pay this run? This action is irreversible.')) return;
    setActionLoading('pay');
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/api/v1/payroll/runs/${id}/pay`);
      setSuccess(`Payroll run locked and paid successfully.`);
      await fetchRuns();
      await handleSelectRun(id);
    } catch (err: any) {
      console.error('Paying run failed', err);
      setError(err?.error?.message || err?.message || 'Failed to complete transaction.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewAnomalies = async (id: string) => {
    setAnomaliesLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const list = await api.get(`/api/v1/payroll/runs/${id}/anomalies`);
      setAnomalies(list);
      setShowAnomaliesModal(true);
    } catch (err: any) {
      console.error('Failed to fetch anomalies', err);
      setError('Failed to load payroll anomalies list.');
    } finally {
      setAnomaliesLoading(false);
    }
  };

  const handleViewPayslipDetails = (payslip: any) => {
    setSelectedPayslip(payslip);
    setShowPayslipModal(true);
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
      {/* Notifications banner */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Create & History List */}
        <div className="space-y-6 lg:col-span-1">
          {/* Create Run Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-400" />
              <span>New Payroll Run</span>
            </h3>
            
            <form onSubmit={handleCreateRun} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Month (1-12)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Year</label>
                  <input
                    type="number"
                    required
                    min={2000}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading === 'create'}
                className="w-full bg-gradient-to-r from-violet-650 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-500 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 shadow-md shadow-violet-555/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading === 'create' && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Create Run</span>
              </button>
            </form>
          </div>

          {/* Runs History List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-violet-400" />
              <span>Payroll Runs History</span>
            </h3>

            {runs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No payroll cycles executed yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {runs.map((run) => {
                  const isSelected = selectedRun?.id === run.id;
                  return (
                    <div
                      key={run.id}
                      onClick={() => handleSelectRun(run.id)}
                      className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-between text-xs ${
                        isSelected 
                          ? 'bg-violet-950/10 border-violet-500/40' 
                          : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-slate-250">Period: {run.month}/{run.year}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Processed: {run.processedAt ? new Date(run.processedAt).toLocaleDateString() : '--'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          run.status === 'PAID' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
                          run.status === 'PROCESSED' ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-400' :
                          'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                          {run.status}
                        </span>
                        {actionLoading === 'select-' + run.id && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400 ml-auto mt-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Selected Run Operations & Generated Payslips */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedRun ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs shadow-md h-full flex flex-col items-center justify-center space-y-2">
              <FileText className="w-8 h-8 text-slate-650 mb-2" />
              <span>Select a payroll run from the history list or create a new run to view details and process payslips.</span>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6">
              {/* Header and Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h2 className="font-bold text-sm text-slate-200">
                    Payroll Run: {selectedRun.month}/{selectedRun.year}
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Status: <span className="font-semibold text-slate-305">{selectedRun.status}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Action buttons based on status */}
                  {selectedRun.status === 'DRAFT' && (
                    <button
                      onClick={() => handleProcessRun(selectedRun.id)}
                      disabled={actionLoading === 'process'}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-650 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-500 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === 'process' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span>Process Payroll</span>
                    </button>
                  )}

                  {selectedRun.status === 'PROCESSED' && (
                    <>
                      <button
                        onClick={() => handleViewAnomalies(selectedRun.id)}
                        disabled={anomaliesLoading}
                        className="px-3 py-1.5 rounded-lg bg-amber-950/20 hover:bg-amber-900/30 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {anomaliesLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        <span>Check Anomalies</span>
                      </button>

                      <button
                        onClick={() => handlePayRun(selectedRun.id)}
                        disabled={actionLoading === 'pay'}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-650 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === 'pay' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                        <span>Mark Paid</span>
                      </button>
                    </>
                  )}

                  {selectedRun.status === 'PAID' && (
                    <div className="px-3 py-1 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>LOCKED & PAID</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Payslips */}
              <div>
                <h3 className="text-xs font-semibold text-slate-350 mb-3">Generated Payslips</h3>
                
                {selectedRun.payslips?.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No payslips generated for this run yet. Press Process Payroll above.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                          <th className="pb-2">Employee</th>
                          <th className="pb-2">Gross Pay</th>
                          <th className="pb-2">Deductions</th>
                          <th className="pb-2">Net Pay</th>
                          <th className="pb-2 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {selectedRun.payslips?.map((slip: any) => (
                          <tr key={slip.id} className="hover:bg-slate-850/10 transition-colors">
                            <td className="py-2.5">
                              <p className="font-semibold text-slate-300">{slip.employee?.firstName} {slip.employee?.lastName}</p>
                              <span className="text-[9px] text-slate-550">{slip.employee?.employeeCode}</span>
                            </td>
                            <td className="py-2.5 text-slate-350">${Number(slip.grossPay).toLocaleString()}</td>
                            <td className="py-2.5 text-rose-450">${Number(slip.totalDeductions).toLocaleString()}</td>
                            <td className="py-2.5 text-emerald-400 font-bold">${Number(slip.netPay).toLocaleString()}</td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => handleViewPayslipDetails(slip)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-450 hover:text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                                title="View Component Items"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ANOMALIES MODAL */}
      {showAnomaliesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowAnomaliesModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500 animate-bounce" />
              <span>Z-Score Anomalies Report</span>
            </h3>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              The following payslips deviate by more than 15% or 1.96 standard deviations (z-score check) compared to their trailing 3-month average.
            </p>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/40 text-xs pr-1">
              {anomalies.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-medium">
                  No payroll anomalies detected.
                </div>
              ) : (
                anomalies.map((an, index) => (
                  <div key={index} className="py-3.5 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-200">{an.employeeName} ({an.employeeCode})</span>
                      <span className="text-amber-400 font-semibold">${an.currentNetPay.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-450">
                      <span>3-Month Avg: ${an.averageNetPay.toLocaleString()}</span>
                      <span>Dev: {an.deviationPercent}% (Z-Score: {an.zScore})</span>
                    </div>
                    <p className="text-[10px] text-amber-450/90 font-medium">
                      Reason: {an.reason}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAYSLIP DETAIL MODAL */}
      {showPayslipModal && selectedPayslip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowPayslipModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center border-b border-slate-800 pb-4">
              <h3 className="text-sm font-bold text-slate-100">
                Payslip: {selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}
              </h3>
              <span className="text-[10px] text-slate-500 uppercase mt-1 inline-block">
                Employee Code: {selectedPayslip.employee?.employeeCode}
              </span>
            </div>

            {/* Line Items Breakdown */}
            <div className="space-y-4 text-xs">
              <h4 className="font-semibold text-slate-350">Earnings & Deductions Breakdown</h4>
              
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {selectedPayslip.lineItems?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-850/50">
                    <div>
                      <span className="font-medium text-slate-300 block">{item.name}</span>
                      <span className="text-[9px] text-slate-500 uppercase">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold ${item.type === 'EARNING' ? 'text-slate-200' : 'text-rose-450'}`}>
                        {item.type === 'EARNING' ? '+' : '-'}${Number(item.proratedValue).toLocaleString()}
                      </span>
                      {Number(item.originalValue) !== Number(item.proratedValue) && (
                        <span className="text-[8px] text-slate-550 block mt-0.5">
                          Base: ${Number(item.originalValue).toLocaleString()} (Prorated)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total calculations */}
              <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-450">
                  <span>Gross Pay</span>
                  <span>${Number(selectedPayslip.grossPay).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-450">
                  <span>Total Deductions</span>
                  <span className="text-rose-450">-${Number(selectedPayslip.totalDeductions).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-emerald-400 border-t border-slate-850/80 pt-2">
                  <span>Net Salary</span>
                  <span>${Number(selectedPayslip.netPay).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
