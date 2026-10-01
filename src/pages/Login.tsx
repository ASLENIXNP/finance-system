import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Lock, Mail, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Supabase Auth logic will go here
    // For now, simple redirect
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent/5 blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-white shadow-xl shadow-accent/20">
            <FileText size={32} />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight text-primary uppercase">
          ASLENIX
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-500 tracking-wider uppercase">
          Billing & Finance System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="bg-white py-10 px-4 shadow-2xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm" 
                  placeholder="admin@aslenix.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="text-sm">
                  <a href="#" className="font-medium text-accent hover:text-accent-hover transition-colors">Forgot your password?</a>
                </div>
              </div>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all hover:shadow-lg hover:shadow-accent/30"
              >
                Sign in to Dashboard
                <ArrowRight size={18} />
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-center text-xs text-slate-500">
              Only authorized personnel of Aslenix Tech and Solution are allowed to access this system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
