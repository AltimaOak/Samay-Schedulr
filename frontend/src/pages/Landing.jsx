import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import heroImg from '../assets/landing-hero.jpg';
import { ThemeContext } from '../context/ThemeContext';

export default function Landing() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const features = [
    {
      title: "Syllabus Intelligence",
      description: "Upload your syllabus and let AI extract core topics and chapters automatically.",
      icon: "🧠",
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Personalized Roadmaps",
      description: "Get a time-wise daily study plan that adapts to your classes and deadlines.",
      icon: "📅",
      color: "from-orange-400 to-rose-500"
    },
    {
      title: "Smart Study Gaps",
      description: "AI identifies the best times for deep work based on your unique rhythm.",
      icon: "⚡",
      color: "from-purple-500 to-indigo-600"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Samay Schedulr" className="h-10 w-auto" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">How it Works</a>
            <Link to="/login" className="px-5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Login</Link>
            <Link to="/signup" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              AI-Powered Academic Planner
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tight mb-8 text-slate-900 dark:text-white">
              Master Your Time, <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
                Elevate Your Grades.
              </span>
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0">
              Samay Schedulr combines <b className="text-slate-700 dark:text-slate-200">NLP (Natural Language Processing)</b> and <b className="text-slate-700 dark:text-slate-200">AI Intelligence</b> to analyze your syllabus, parse timetables, and generate personalized study roadmaps—all in one smart platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/signup" className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all">
                Try for Free
              </Link>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-orange-500/20 rounded-3xl blur-3xl -z-10"></div>
            <img
              src={heroImg}
              alt="AI Concept"
              className="w-full h-auto rounded-3xl shadow-2xl border border-white/50 animate-float"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-[#1c1c2e] border-y border-slate-100 dark:border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl lg:text-5xl font-black mb-6 text-slate-900 dark:text-white">Built for Modern Students</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">Ditch the spreadsheets. Our AI analyzes your workload so you can focus on what actually matters—learning.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, idx) => (
              <div key={idx} className="p-10 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-3xl mb-8 shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="text-2xl font-black mb-4 text-slate-900 dark:text-white">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-[#09090b] transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl lg:text-5xl font-black mb-6 text-slate-900 dark:text-white">How It Works</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">Simplify your academic journey in four easy steps using our AI-driven approach.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden md:block absolute top-1/4 left-0 w-full h-0.5 bg-indigo-100 dark:bg-indigo-500/20 -z-0"></div>

            {[
              {
                step: "01",
                title: "Create Account",
                desc: "Sign up and link your academic profile in seconds.",
                icon: "🔗"
              },
              {
                step: "02",
                title: "Upload Syllabus",
                desc: "Drop your syllabus,timetable. AI handles the parsing.",
                icon: "📤"
              },
              {
                step: "03",
                title: "AI Analysis",
                desc: "NLP engine extracts topics, weights, and deadlines.",
                icon: "🧠"
              },
              {
                step: "04",
                title: "Get Roadmap",
                desc: "Follow your dynamic study plan and excel.",
                icon: "📚"
              }
            ].map((s, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border-2 border-indigo-50 dark:border-slate-700 shadow-xl flex items-center justify-center text-2xl mb-6 hover:scale-110 transition-transform">
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-tighter">Step {s.step}</div>
                <h3 className="text-xl font-black mb-3 text-slate-900 dark:text-white">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-4">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto p-12 lg:p-20 rounded-[3rem] bg-slate-900 relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <h2 className="text-4xl lg:text-6xl font-black text-white mb-8 relative z-10">
            Ready to reclaim your time?
          </h2>
          <p className="text-xl text-slate-400 mb-12 relative z-10 max-w-2xl mx-auto">
            Join thousands of students who are already using Samay Schedulr to stay ahead of their academic curve.
          </p>
          <Link to="/signup" className="inline-block px-12 py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-100 hover:scale-105 transition-all relative z-10 shadow-2xl">
            Register Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-white/10 dark:bg-[#09090b] transition-colors">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Samay Schedulr" className="h-8 w-auto opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer dark:invert" />
          </div>
          <div className="flex gap-8 text-sm font-semibold text-slate-400">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact Us</a>
          </div>
          <p className="text-sm text-slate-400">© 2026 Samay Schedulr. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        html {
          scroll-behavior: smooth;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
