import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Interaction States
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setIsShaking(false);

    try {
      await login(email, password);
      toast('success', 'Authentication Successful', 'Welcome back to your Chronos HRMS dashboard.');
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      const errMsg = err?.error?.message || err?.message || 'Invalid email or password.';
      setError(errMsg);
      setIsShaking(true);
      toast('error', 'Login Failed', errMsg);
      // Reset shake class after animation completes
      setTimeout(() => setIsShaking(false), 400);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill demo accounts helper
  const handleSelectRole = (role: 'admin' | 'manager' | 'employee') => {
    setError(null);
    setEmail(`${role}@demo.com`);
    setPassword('DemoPassword123!');
    toast('info', 'Demo Profile Loaded', `Pre-filled credentials for the ${role.toUpperCase()} role.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Handcrafted animated background mesh */}
      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -left-[30%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-violet-650/15 to-transparent blur-[160px] animate-[pulse_8s_infinite_alternate]"></div>
        <div className="absolute -bottom-[40%] -right-[30%] w-[80%] h-[80%] rounded-full bg-gradient-to-tl from-fuchsia-650/10 to-transparent blur-[160px] animate-[pulse_10s_infinite_alternate]"></div>
        {/* Subtle grid layer */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div 
        className={`w-full max-w-[420px] bg-slate-900/40 backdrop-blur-2xl border border-slate-800/70 rounded-2xl p-8 shadow-[0_0_50px_0_rgba(0,0,0,0.6)] relative z-10 ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Glowing border accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>

        {/* Branding Title */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-650 to-fuchsia-600 mx-auto flex items-center justify-center shadow-lg shadow-violet-555/15 mb-4 relative group">
            <ShieldCheck className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-violet-650 to-fuchsia-600 blur-md -z-10 opacity-50 group-hover:opacity-75 transition-opacity"></div>
          </div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center justify-center gap-1.5">
            CHRONOS <span className="text-xs font-bold text-violet-400 border border-violet-500/30 px-1.5 py-0.5 rounded-md">HRMS</span>
          </h1>
          <p className="text-slate-400 text-[11px] mt-2 font-medium">
            ERP-Grade Access Portal & Security Gated Hub
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-300 text-[11px] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-violet-400 transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@demo.com"
                className="w-full bg-slate-950/60 border border-slate-850 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/20 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-700 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400">
              Security Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-violet-400 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-850 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/20 rounded-xl py-3 pl-10 pr-10 text-xs text-slate-100 placeholder:text-slate-700 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-slate-350 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-650 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-500 text-white font-bold py-3 rounded-xl text-xs transition-all duration-300 shadow-md shadow-violet-555/10 hover:shadow-violet-555/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>VERIFYING PROFILE...</span>
              </>
            ) : (
              <span>SIGN IN TO PORTAL</span>
            )}
          </button>
        </form>

        {/* Handcrafted Quick Demo Selectors */}
        <div className="mt-8 pt-6 border-t border-slate-850">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-bold mb-3">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span>LOAD DEMO SECURITY profiles</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSelectRole('admin')}
              className="py-2 px-1 text-[10px] font-bold text-slate-350 hover:text-white bg-slate-950/40 hover:bg-slate-950 border border-slate-850 hover:border-violet-500/40 rounded-lg transition-all cursor-pointer"
            >
              ADMIN
            </button>
            <button
              onClick={() => handleSelectRole('manager')}
              className="py-2 px-1 text-[10px] font-bold text-slate-350 hover:text-white bg-slate-950/40 hover:bg-slate-950 border border-slate-850 hover:border-violet-500/40 rounded-lg transition-all cursor-pointer"
            >
              MANAGER
            </button>
            <button
              onClick={() => handleSelectRole('employee')}
              className="py-2 px-1 text-[10px] font-bold text-slate-350 hover:text-white bg-slate-950/40 hover:bg-slate-950 border border-slate-850 hover:border-violet-500/40 rounded-lg transition-all cursor-pointer"
            >
              EMPLOYEE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
