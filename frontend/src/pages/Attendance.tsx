import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  Clock, 
  MapPin, 
  UserCheck, 
  UserX, 
  Loader2, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString());
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Digital clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayRecord = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const record = await api.get('/api/v1/attendance/today');
      setTodayRecord(record);
    } catch (err: any) {
      console.error('Failed to fetch today record', err);
      // It might return 404 if no record exists yet, which is expected!
      if (err?.status !== 404) {
        setError(err?.error?.message || err?.message || 'Failed to fetch attendance state.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayRecord();
  }, [user]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/v1/attendance/check-in');
      setTodayRecord(response);
      toast('success', 'Clock In Recorded', 'Your attendance check-in has been logged successfully.');
    } catch (err: any) {
      console.error('Check-in error', err);
      setError(err?.error?.message || err?.message || 'Check-in failed.');
      toast('error', 'Check-In Failed', err?.error?.message || err?.message || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/v1/attendance/check-out');
      setTodayRecord(response);
      toast('success', 'Clock Out Recorded', 'Your shift has been logged. Have a great evening!');
    } catch (err: any) {
      console.error('Check-out error', err);
      setError(err?.error?.message || err?.message || 'Check-out failed.');
      toast('error', 'Check-Out Failed', err?.error?.message || err?.message || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto space-y-8 animate-pulse">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto"></div>
          <div className="h-8 bg-slate-800 rounded-lg w-48 mx-auto"></div>
          <div className="h-3 bg-slate-850 rounded w-56 mx-auto"></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="h-4 bg-slate-800 rounded w-32 mx-auto"></div>
          <div className="h-12 bg-slate-800 rounded-xl"></div>
          <div className="h-3 bg-slate-850 rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  const isCheckedIn = !!todayRecord?.checkIn;
  const isCheckedOut = !!todayRecord?.checkOut;

  return (
    <div className="max-w-md mx-auto space-y-8">
      {/* Clock & Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-4 bg-slate-900 border border-slate-800 rounded-full text-indigo-400 mb-2">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 tabular-nums">{time}</h1>
        <p className="text-xs text-slate-400">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Action Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/30 space-y-6 relative overflow-hidden">
        {/* Glow behind card */}
        <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl"></div>

        <div className="text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Attendance Status</span>
          <div className="flex justify-center mt-2">
            {!isCheckedIn ? (
              <span className="px-3 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-bold">
                NOT CHECKED IN
              </span>
            ) : isCheckedOut ? (
              <span className="px-3 py-1 rounded bg-emerald-950/20 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold">
                COMPLETED
              </span>
            ) : (
              <span className="px-3 py-1 rounded bg-amber-950/20 border border-amber-500/20 text-[10px] text-amber-400 font-bold animate-pulse">
                ACTIVE SHIFT
              </span>
            )}
          </div>
        </div>

        {/* Shift details */}
        {isCheckedIn && (
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800/80 text-xs">
            <div className="text-center space-y-1">
              <span className="text-slate-500 block">Check In</span>
              <span className="font-semibold text-slate-200 block">
                {new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${
                todayRecord.status === 'LATE' ? 'bg-amber-950/25 border-amber-500/20 text-amber-400' : 'bg-emerald-950/25 border-emerald-500/20 text-emerald-400'
              }`}>
                {todayRecord.status === 'LATE' ? 'LATE FLAG' : 'ON TIME'}
              </span>
            </div>
            <div className="text-center space-y-1 border-l border-slate-800/80">
              <span className="text-slate-500 block">Check Out</span>
              <span className="font-semibold text-slate-200 block">
                {isCheckedOut
                  ? new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : '--:--:--'}
              </span>
              {isCheckedOut && (
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  Worked: {todayRecord.workedMinutes} mins
                </span>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-indigo-650 to-blue-600 hover:from-indigo-600 hover:to-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-300 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              <span>Clock In</span>
            </button>
          ) : !isCheckedOut ? (
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="w-full bg-slate-800 hover:bg-rose-950/30 text-slate-200 hover:text-rose-450 border border-slate-700 hover:border-rose-900/30 font-semibold py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserX className="w-4 h-4" />
              )}
              <span>Clock Out</span>
            </button>
          ) : (
            <div className="py-2.5 px-4 bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center justify-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Shift logged successfully today.</span>
            </div>
          )}
        </div>

        {/* Geolocation disclaimer */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
          <MapPin className="w-3.5 h-3.5" />
          <span>Security logs: Clocking coordinates recorded.</span>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
