import { useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserPreferences, saveUserPreferences } from '../services/userService';
import { useNotifications } from '../hooks/useNotifications';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState({ collegeHours: 6, sleepHours: 8, travelHours: 2 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      getUserPreferences(currentUser.uid).then(data => {
        if (data) setPrefs(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [currentUser]);

  const handleSaveConstraints = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveUserPreferences(currentUser.uid, prefs);
      addNotification('Study constraints updated successfully. AI will use these for new plans.', 'success');
    } catch (err) {
      addNotification('Failed to update preferences.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout();
      navigate('/login');
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading settings...</div>;

  return (
    <div className="p-8 w-full max-w-4xl mx-auto space-y-8 pb-24">
      <h1 className="text-4xl font-black text-slate-900 dark:text-white">Settings</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile Card */}
        <div className="glass-card p-8 rounded-[2.5rem]">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Profile Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-white/5">
                {currentUser?.displayName || 'Student'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-white/5">
                {currentUser?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Card */}
        <div className="glass-card p-8 rounded-[2.5rem] flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">App Preferences</h2>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <div className="font-bold text-slate-800">Notifications</div>
                <div className="text-sm text-slate-500">Currently enabled</div>
              </div>
              <div className="text-xl">✅</div>
            </div>
          </div>
        </div>

        {/* Study Constraints */}
        <div className="glass-card p-8 rounded-[2.5rem] md:col-span-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Study Constraints</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Set your daily hours to help the AI map out your free time accurately.</p>

          <form onSubmit={handleSaveConstraints} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sleep Hours</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white" 
                  value={prefs.sleepHours}
                  onChange={(e) => setPrefs({...prefs, sleepHours: e.target.value})}
                  required 
                  min="0" max="24"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">College/Work Hours</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white" 
                  value={prefs.collegeHours}
                  onChange={(e) => setPrefs({...prefs, collegeHours: e.target.value})}
                  required 
                  min="0" max="24"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Travel Hours</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white" 
                  value={prefs.travelHours || 2}
                  onChange={(e) => setPrefs({...prefs, travelHours: e.target.value})}
                  required 
                  min="0" max="24"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Constraints'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="glass-card p-8 rounded-[2.5rem] md:col-span-2 border-red-100 dark:border-red-900/30">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-6 flex items-center gap-2">
            ⚠️ Danger Zone
          </h2>
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">Session Management</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Log out of your account on this device</div>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-md"
            >
              Log Out
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
