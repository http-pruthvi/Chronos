import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  Users, 
  CalendarCheck, 
  FileText, 
  Wallet, 
  Sparkles, 
  TrendingUp,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let endpoint = '/api/v1/dashboard/employee';
      if (user.role === 'ADMIN' || user.role === 'HR') {
        endpoint = '/api/v1/dashboard/admin';
      } else if (user.role === 'MANAGER') {
        endpoint = '/api/v1/dashboard/manager';
      }
      const response = await api.get(endpoint);
      setData(response);
    } catch (err: any) {
      console.error('Failed to load dashboard data', err);
      setError(err?.error?.message || err?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-6 bg-slate-800 rounded w-48 mb-2"></div>
            <div className="h-3 bg-slate-850 rounded w-64"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-2 bg-slate-800 rounded w-20"></div>
                <div className="h-7 bg-slate-800 rounded w-12"></div>
                <div className="h-2 bg-slate-850 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-slate-800 rounded-lg"></div>
            </div>
          ))}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="h-4 bg-slate-800 rounded w-48"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 bg-slate-800 rounded w-28"></div>
                <div className="h-3 bg-slate-800 rounded w-20"></div>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-300 text-sm flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  // --- RENDER 1: ADMIN/HR ---
  if (user?.role === 'ADMIN' || user?.role === 'HR') {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Analytics Overview</h1>
            <p className="text-xs text-slate-400">Real-time organizational KPI tracking</p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Active Year: {new Date().getFullYear()}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">Headcount</span>
              <span className="text-2xl font-bold text-slate-100 block mt-1">{data?.totalEmployees}</span>
              <span className="text-[10px] text-emerald-400 mt-1 inline-block">Active staff</span>
            </div>
            <div className="p-3 bg-indigo-950/30 rounded-lg text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">Attendance Rate</span>
              <span className="text-2xl font-bold text-slate-100 block mt-1">{data?.todayAttendancePercent}%</span>
              <span className="text-[10px] text-slate-400 mt-1 inline-block">Clocked in today</span>
            </div>
            <div className="p-3 bg-emerald-950/30 rounded-lg text-emerald-400">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">Pending Leaves</span>
              <span className="text-2xl font-bold text-slate-100 block mt-1">{data?.pendingLeaveRequestsCount}</span>
              <span className="text-[10px] text-amber-400 mt-1 inline-block">Needs review</span>
            </div>
            <div className="p-3 bg-amber-950/30 rounded-lg text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">Payroll Status</span>
              <span className="text-sm font-bold text-slate-100 block mt-2 px-2 py-0.5 rounded bg-slate-800 text-center w-fit">
                {data?.currentMonthPayrollStatus || 'DRAFT'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 inline-block">This month</span>
            </div>
            <div className="p-3 bg-indigo-950/30 rounded-lg text-indigo-400">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Headcount by Department */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg shadow-black/10">
          <h3 className="text-sm font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Headcount by Department</span>
          </h3>

          <div className="space-y-4">
            {data?.headcountByDepartment?.map((dept: any) => {
              const maxCount = Math.max(...data.headcountByDepartment.map((d: any) => d.count), 1);
              const percentage = Math.round((dept.count / maxCount) * 100);
              return (
                <div key={dept.departmentId} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-300">{dept.departmentName}</span>
                    <span className="font-semibold text-slate-100">{dept.count} Employees</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER 2: MANAGER ---
  if (user?.role === 'MANAGER') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Team Dashboard</h1>
          <p className="text-xs text-slate-400">Manage direct reports, attendance status, and pending approvals</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">Team size</span>
              <span className="text-2xl font-bold text-slate-100 mt-1 block">{data?.teamSize}</span>
            </div>
            <div className="p-3 bg-indigo-950/30 rounded-lg text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">Pending Team Approvals</span>
              <span className="text-2xl font-bold text-slate-100 mt-1 block">{data?.teamPendingLeavesCount}</span>
            </div>
            <div className="p-3 bg-amber-950/30 rounded-lg text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">Clocked In Today</span>
              <span className="text-2xl font-bold text-slate-100 mt-1 block">
                {data?.teamAttendanceToday?.filter((t: any) => t.checkIn !== null).length || 0}
              </span>
            </div>
            <div className="p-3 bg-emerald-950/30 rounded-lg text-emerald-400">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Team Attendance Today */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Today's Team Attendance</h3>
            {data?.teamAttendanceToday?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No attendance records submitted today</p>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto pr-1">
                {data?.teamAttendanceToday?.map((record: any) => (
                  <div key={record.employeeId} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-slate-350">{record.name}</p>
                      <span className="text-[10px] text-slate-500">{record.designation}</span>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${
                        record.status === 'PRESENT' ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400' :
                        record.status === 'LATE' ? 'bg-amber-950/30 border-amber-500/20 text-amber-400' :
                        record.status === 'HALF_DAY' ? 'bg-indigo-950/30 border-indigo-500/20 text-indigo-400' :
                        'bg-rose-950/30 border-rose-500/20 text-rose-400'
                      }`}>
                        {record.status}
                      </span>
                      {record.checkIn && (
                        <p className="text-[9px] text-slate-500 mt-1">In: {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Leave Calendar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Team Leave Calendar (This Month)</h3>
            {data?.teamLeaveCalendar?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No active approved leaves this month</p>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto pr-1">
                {data?.teamLeaveCalendar?.map((leave: any) => (
                  <div key={leave.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-slate-350">{leave.employeeName}</p>
                      <span className="text-[10px] text-slate-500">Type: {leave.leaveType}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-200 font-semibold">{leave.days} Days</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER 3: EMPLOYEE (Default) ---
  const presentStats = data?.attendanceStats || { presentDays: 0, lateDays: 0, halfDays: 0, absentDays: 0, streakDays: 0 };
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/30 to-blue-900/20 border border-indigo-850/30 flex items-center justify-between shadow-lg shadow-indigo-550/5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold text-slate-100">Welcome, {user?.firstName}!</h1>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
            Have questions about leave policies or attendance times? Simply ask our <Link to="/ai-assistant" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">AI Policy Assistant</Link> anytime.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-center p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">Clocking Streak</span>
          <span className="text-2xl font-black text-indigo-400 mt-1">{presentStats.streakDays} Days</span>
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <h3 className="text-sm font-semibold text-slate-200 mb-6 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>My Leave Balances ({new Date().getFullYear()})</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.leaveBalances?.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6 col-span-3">No leave balances allocated for this year</p>
          ) : (
            data?.leaveBalances?.map((bal: any) => {
              const percentage = Math.round((bal.used / bal.allocated) * 100) || 0;
              return (
                <div key={bal.leaveType} className="p-4 bg-slate-950 rounded-lg border border-slate-850 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs text-slate-250 truncate">{bal.leaveType}</span>
                    <span className="text-[10px] text-slate-400">{bal.available} / {bal.allocated} Available</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full" 
                      style={{ width: `${100 - percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] text-slate-500 block">Used: {bal.used} days</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">My Attendance (This Month)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-850 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">PRESENT</span>
              <span className="text-xl font-bold text-emerald-400 block mt-1">{presentStats.presentDays} Days</span>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-850 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">LATE</span>
              <span className="text-xl font-bold text-amber-400 block mt-1">{presentStats.lateDays} Days</span>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-850 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">HALF DAYS</span>
              <span className="text-xl font-bold text-indigo-400 block mt-1">{presentStats.halfDays} Days</span>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-850 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">ABSENT</span>
              <span className="text-xl font-bold text-rose-450 block mt-1">{presentStats.absentDays} Days</span>
            </div>
          </div>
        </div>

        {/* Payslips */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Recent Payslips</h3>
            {data?.lastPayslips?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No payslips generated yet</p>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto pr-1">
                {data?.lastPayslips?.map((slip: any) => (
                  <div key={slip.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-300">Period: {slip.month}/{slip.year}</p>
                      <span className="text-[9px] text-slate-500">Net Pay: ${slip.netPay.toLocaleString()}</span>
                    </div>
                    <Link
                      to={`/payroll`}
                      className="px-3 py-1 bg-slate-800 hover:bg-indigo-950/40 border border-slate-700 hover:border-indigo-800/40 text-indigo-400 hover:text-indigo-300 rounded text-[10px] font-semibold transition-all duration-200"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
