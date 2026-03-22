import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signup(email, password, name);
      navigate('/app');
    } catch (err) {
      setError('Failed to create an account. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] items-center justify-center p-4 selection:bg-indigo-100 italic-selection">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent)] pointer-events-none"></div>

      <div className="glass-card p-10 rounded-[2.5rem] max-w-md w-full animate-fade relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="text-center mb-10 relative z-10">
          <div className="inline-block p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200 mb-6 group hover:-translate-y-1 transition-transform cursor-pointer">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Samay Schedulr</h1>
          <p className="text-slate-500 font-medium">Elevate your academic journey today.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6 relative z-10">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-bold border border-rose-100 animate-slide-up">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              placeholder="e.g. Alex Johnson"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              placeholder="student@university.edu"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-black py-4 rounded-2xl disabled:opacity-50 transition-all duration-300 shadow-xl shadow-indigo-100 transform active:scale-[0.98] mt-4"
          >
            {loading ? "Initializing..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-slate-500 font-bold text-sm mt-10 relative z-10">
          Member already?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 underline underline-offset-4 decoration-2">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
