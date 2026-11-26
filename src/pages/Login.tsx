import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const SUPERADMIN_EMAIL = import.meta.env.VITE_SUPERADMIN_EMAIL || 'aslenixtech@gmail.com';
const SUPERADMIN_PW = import.meta.env.VITE_SUPERADMIN_PASSWORD || 'aslenix@3212';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const inputEmail = email.trim().toLowerCase();
    const inputPassword = password.trim();

    const isSuperAdminEmail =
      inputEmail === 'aslenixtech@gmail.com' ||
      inputEmail === SUPERADMIN_EMAIL.toLowerCase() ||
      inputEmail === 'admin' ||
      inputEmail === 'superadmin';

    const isSuperAdminPassword =
      inputPassword === 'aslenix@3212' ||
      inputPassword === 'aslenix3212' ||
      inputPassword === SUPERADMIN_PW;

    const isSuperAdmin = isSuperAdminEmail && isSuperAdminPassword;

    // Fast-path for Super Admin: instant access even if Supabase is offline or fails to fetch
    if (isSuperAdmin) {
      localStorage.setItem('demo_user', JSON.stringify({
        id: 'superadmin-master-id',
        email: 'aslenixtech@gmail.com',
        role: 'super_admin',
        full_name: 'Super Admin',
        remember: rememberMe,
      }));

      // Non-blocking background session attempt (try entered password, then alternate)
      void (async () => {
        const candidates = Array.from(new Set([inputPassword, 'aslenix@3212', 'aslenix3212']));
        for (const candidate of candidates) {
          try {
            const { data, error: bgErr } = await supabase.auth.signInWithPassword({
              email: 'aslenixtech@gmail.com',
              password: candidate,
            });
            if (!bgErr && data?.session) break;
          } catch {
            // Ignore offline network error
          }
        }
      })();

      navigate('/');
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: inputEmail,
        password: inputPassword,
      });

      if (!authError && data.user) {
        localStorage.setItem('demo_user', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          role: 'super_admin',
          full_name: 'Super Admin',
          remember: rememberMe,
        }));
        navigate('/');
        return;
      }

      if (authError) throw authError;
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
        setError('Unable to connect to Supabase server. Please verify your internet connection or use the Super Admin credentials.');
      } else {
        setError(msg || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#f3f5ff_42%,#faf5ff_100%)] selection:bg-indigo-500/20 selection:text-indigo-700">
      {/* Soft Ambient Background Glow Orbs matching Attendance Theme */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full blur-[130px] opacity-35"
        style={{ background: 'linear-gradient(135deg, #c4daff 0%, #e5ccff 55%, #fce7f3 100%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full blur-[130px] opacity-35"
        style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 55%, #f3e8ff 100%)' }}
      />

      {/* Centered Login Card */}
      <div className="relative z-20 w-full max-w-[440px] mx-auto animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.12)] rounded-3xl p-6 sm:p-10 transition-all">

          {/* Logo & Header */}
          <div className="text-center mb-7">
            <div className="flex justify-center mb-4">
              <img
                src="/logo.png"
                alt="Aslenix Logo"
                className="h-24 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105 duration-300"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-[#c4daff] to-[#e5ccff] text-[#0f172a] border border-[#c4daff]/90 mb-3 shadow-2xs">
              <ShieldCheck size={13} className="text-[#0f172a]" />
              <span>FINANCE & IRD COMPLIANCE</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sign in to your ASLENIX financial workspace
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4 sm:space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="p-3.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={17} />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3.5 py-3 border border-slate-200 bg-white hover:border-slate-300 rounded-xl shadow-2xs placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 text-sm font-medium transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setError('Contact your system administrator to reset credentials.')}
                  className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={17} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={checkCapsLock}
                  onKeyUp={checkCapsLock}
                  className="appearance-none block w-full pl-10 pr-11 py-3 border border-slate-200 bg-white hover:border-slate-300 rounded-xl shadow-2xs placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 text-sm font-medium transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Caps Lock Alert */}
              {capsLockActive && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <AlertCircle size={14} className="shrink-0 text-amber-500" />
                  <span>Caps Lock is ON</span>
                </div>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500/20 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-600">Keep me signed in</span>
              </label>

              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 size={12} className="text-emerald-600" />
                SSL Encrypted
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full h-12 flex justify-center items-center gap-2 px-4 rounded-xl text-sm font-bold text-[#0f172a] shadow-xs hover:shadow-md hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer border border-[#c4daff]/90"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-[#0f172a]" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Dashboard</span>
                    <ArrowRight size={17} className="text-[#0f172a]" />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Security & IRD Notice Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>Nepal Tax & IRD Compliant System</span>
            </div>
            <p className="text-center text-[11px] text-slate-400 leading-relaxed">
              Only authorized personnel of Aslenix Tech and Solution are allowed to access this system.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
