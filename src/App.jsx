import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import logoImg from './assets/logo.png';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Tasks from './pages/Tasks';
import Syllabus from './pages/Syllabus';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationCenter from './components/NotificationCenter';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const [appLoading, setAppLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [step, setStep] = useState(1); // 1 = Logo only, 2 = Logo + Name
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Step 1 -> Step 2 after 1 second
    const step2Timer = setTimeout(() => {
      setStep(2);
    }, 1000);

    // Progress bar animation starts when Step 2 begins
    let progressTimer;
    const progressStartTimer = setTimeout(() => {
      progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressTimer);
            return 100;
          }
          return prev + 8;
        });
      }, 70);
    }, 1000);

    // Fade out and remove preloader
    const fadeTimer = setTimeout(() => setFadeOut(true), 2300);
    const removeTimer = setTimeout(() => setAppLoading(false), 2600);

    return () => {
      clearTimeout(step2Timer);
      clearTimeout(progressStartTimer);
      if (progressTimer) clearInterval(progressTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          {appLoading && (
            <div className={`fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-[9999] transition-all duration-500 ease-in-out ${
              fadeOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'
            }`}>
              {/* Logo Image Container (Pulsing smoothly) */}
              <div className="relative max-w-[280px] sm:max-w-[340px] px-6 flex items-center justify-center transition-all duration-700">
                <div className="absolute w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl animate-pulse"></div>
                <img 
                  src={logoImg} 
                  alt="Samay Schedulr Logo" 
                  className={`w-full h-auto object-contain relative z-10 transition-all duration-700 ${
                    step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`} 
                />
              </div>

              {/* Loading progress bar (Fades and scales in on Step 2) */}
              <div className={`w-48 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-10 border border-slate-300/30 p-[1px] shadow-inner transition-all duration-700 ${
                step >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}>
                <div 
                  className="bg-gradient-to-r from-amber-500 to-indigo-600 h-full rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {/* Progress Bar Status Word */}
              <p className={`text-[10px] font-black text-indigo-500/80 uppercase tracking-[0.2em] mt-3.5 leading-none transition-all duration-500 select-none ${
                step >= 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}>
                {progress < 25 && "Initializing Samay..."}
                {progress >= 25 && progress < 50 && "Syncing routine slots..."}
                {progress >= 50 && progress < 75 && "Structuring study modules..."}
                {progress >= 75 && progress < 95 && "Refining custom roadmap..."}
                {progress >= 95 && "Ready! ✨"}
              </p>
            </div>
          )}

          <Router>
            <NotificationCenter />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              <Route path="/app" element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="timetable" element={<Timetable />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="syllabus" element={<Syllabus />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

