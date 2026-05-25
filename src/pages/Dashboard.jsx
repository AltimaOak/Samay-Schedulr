import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserTasks, updateTask } from '../services/tasksService';
import { getUserTimetable } from '../services/timetableService';
import { getUserSyllabus } from '../services/syllabusService';
import { getUserPreferences, saveUserPreferences, getStudyPlan, saveStudyPlan } from '../services/userService';
import { generateStudyPlan } from '../services/aiService';
import { useNotifications } from '../hooks/useNotifications';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [fullTimetable, setFullTimetable] = useState([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    let day = new Date().getDay() - 1;
    return day < 0 ? 6 : day;
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [prefs, setPrefs] = useState({ collegeHours: 6, sleepHours: 8, freeHours: 4, travelHours: 2 });
  const [showPrefForm, setShowPrefForm] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [studyPlan, setStudyPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showDaysModal, setShowDaysModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState(14);

  const scrollContainerRef = useRef(null);

  const scrollRoadmap = (direction) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = direction === 'left' ? -350 : 350;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const { addNotification } = useNotifications();

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        // Prevent default vertical page scroll only when scrolling inside the roadmap
        e.preventDefault();
        container.scrollBy({ left: e.deltaY * 1.5, behavior: 'smooth' });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [studyPlan]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [fetchedTasks, fetchedTimetable, fetchedSyllabi, fetchedPrefs, savedPlan] = await Promise.all([
        getUserTasks(currentUser.uid),
        getUserTimetable(currentUser.uid),
        getUserSyllabus(currentUser.uid),
        getUserPreferences(currentUser.uid),
        getStudyPlan(currentUser.uid)
      ]);

      setTasks(fetchedTasks.filter(t => t.status !== 'Completed').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
      
      setFullTimetable(fetchedTimetable);
      const date = new Date();
      let currentDayIndex = date.getDay() - 1; 
      if (currentDayIndex < 0) currentDayIndex = 6;
      setTodayClasses(fetchedTimetable.filter(e => Number(e.dayOfWeek) === currentDayIndex).sort((a, b) => a.startTime.localeCompare(b.startTime)));
      
      setFiles(fetchedSyllabi);
      if (fetchedPrefs) setPrefs(fetchedPrefs);
      if (savedPlan) setStudyPlan(savedPlan);

    } catch (error) {
      console.error("Dashboard data error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async (daysToPlan = 14) => {
    try {
      setGenerating(true);
      const plan = await generateStudyPlan({
        tasks,
        timetable: fullTimetable,
        prefs,
        syllabusFiles: files,
        days: Number(daysToPlan)
      });
      
      await saveStudyPlan(currentUser.uid, plan);
      setStudyPlan(plan);
      addNotification("New study plan generated! ✨", "info");
    } catch (err) {
      console.error(err);
      addNotification("Failed to generate plan. Please verify the AI status.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdatePrefs = async (e) => {
    e.preventDefault();
    try {
      setSavingPrefs(true);
      await saveUserPreferences(currentUser.uid, prefs);
      setShowPrefForm(false);
      addNotification("Study constraints updated successfully.", "info");
    } catch (err) {
      console.error(err);
      addNotification("Failed to update constraints.", "error");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleDeletePlan = async () => {
    if (window.confirm("Clear your current study plan?")) {
      await saveStudyPlan(currentUser.uid, null);
      setStudyPlan(null);
      addNotification("Study plan reset.", "info");
    }
  };

  const markTaskCompleted = async (taskId) => {
    await updateTask(taskId, { status: 'Completed' });
    loadDashboardData();
  };

  const totalUsedHours = Number(prefs.collegeHours) + Number(prefs.sleepHours) + Number(prefs.travelHours || 2);
  const remainingHours = 24 - totalUsedHours;

  const displayClasses = fullTimetable.filter(e => Number(e.dayOfWeek) === selectedDayIndex).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {getGreeting()}, {currentUser?.displayName?.split(' ')[0] || 'Friend'}! ✨
          </h1>
          <p className="text-slate-500 font-semibold text-lg mt-3 flex items-center gap-2">
            Let's make today remarkably productive. What's our focus?
          </p>
        </div>
        <button 
          onClick={() => setShowPrefForm(!showPrefForm)}
          className="bg-white/90 backdrop-blur-md border border-slate-200/80 text-slate-700 px-6 py-3.5 rounded-2xl text-sm font-bold hover:bg-white shadow-xl shadow-slate-200/50 transition-all duration-500 flex items-center gap-2 group hover:-translate-y-1"
        >
          <span className="group-hover:rotate-90 transition-transform duration-500">⚙️</span> Adjust Your Routine
        </button>
      </div>

      {showPrefForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade">
          <form onSubmit={handleUpdatePrefs} className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full animate-slide-up">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Study Plan Constraints</h3>
            <p className="text-slate-500 text-sm mb-8">Refine your daily routine to help the AI generate the perfect study breakdown.</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">College/Work Hours</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                    value={prefs.collegeHours}
                    onChange={e => setPrefs({...prefs, collegeHours: e.target.value})}
                  />
                  <span className="absolute right-4 top-3.5 text-slate-400 font-medium">hrs</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Sleep Hours</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                    value={prefs.sleepHours}
                    onChange={e => setPrefs({...prefs, sleepHours: e.target.value})}
                  />
                  <span className="absolute right-4 top-3.5 text-slate-400 font-medium">hrs</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Travel Hours</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                    value={prefs.travelHours || 2}
                    onChange={e => setPrefs({...prefs, travelHours: e.target.value})}
                  />
                  <span className="absolute right-4 top-3.5 text-slate-400 font-medium">hrs</span>
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                type="button"
                onClick={() => setShowPrefForm(false)}
                className="flex-1 px-4 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={savingPrefs}
                className="flex-1 bg-indigo-600 text-white font-bold px-4 py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {savingPrefs ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDaysModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade">
          <div className="bg-slate-900 border border-slate-800 text-white p-8 rounded-[2rem] shadow-2xl max-w-xl w-full animate-slide-up relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-2xl">
                  🪄
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white">Roadmap Duration</h3>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Choose how many days you would like the AI to plan.</p>
                </div>
              </div>

              {/* Pre-set Quick Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { days: 3, label: '3 Days', desc: 'Sprint 🚀', color: 'border-cyan-500/30 hover:border-cyan-400' },
                  { days: 7, label: '7 Days', desc: 'Weekly 📅', color: 'border-emerald-500/30 hover:border-emerald-400' },
                  { days: 14, label: '14 Days', desc: 'Bi-Weekly 🎓', color: 'border-indigo-500/30 hover:border-indigo-400' },
                  { days: 30, label: '30 Days', desc: 'Monthly 🏆', color: 'border-purple-500/30 hover:border-purple-400' }
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => setSelectedDays(item.days)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-300 ${
                      selectedDays === item.days
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : `bg-slate-950/40 border-slate-800 hover:bg-slate-950/60`
                    }`}
                  >
                    <span className="block font-black text-lg text-white">{item.label}</span>
                    <span className="block text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{item.desc}</span>
                  </button>
                ))}
              </div>

              {/* Slider for Custom Range */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Custom Duration</span>
                  <span className="text-indigo-400 font-black text-lg bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                    {selectedDays} {selectedDays === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={selectedDays}
                  onChange={(e) => setSelectedDays(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-2 px-1">
                  <span>1 Day</span>
                  <span>15 Days</span>
                  <span>30 Days</span>
                  <span>45 Days</span>
                  <span>60 Days</span>
                </div>
              </div>

              {/* Summary Stats / Net Hours Estimate */}
              <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-2xl p-4 mb-8 flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Estimated Study Time</span>
                  <span className="text-[11px] font-bold text-slate-400">Based on your daily net slot ({remainingHours}h)</span>
                </div>
                <span className="text-2xl font-black text-white bg-indigo-600/15 border border-indigo-500/20 px-4 py-1.5 rounded-xl shadow-inner">
                  ~{remainingHours * selectedDays} hrs
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowDaysModal(false)}
                  className="flex-1 px-4 py-4 text-slate-400 font-bold hover:text-white hover:bg-white/5 rounded-2xl transition duration-300 border border-transparent hover:border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDaysModal(false);
                    handleGeneratePlan(selectedDays);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-indigo-900/40 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] active:translate-y-0"
                >
                  Build My Roadmap 🪄
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center p-20">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-8 rounded-3xl flex flex-col h-full min-h-[420px] animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex justify-between items-center mb-6 text-indigo-700 border-b border-indigo-50 pb-4">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="p-2 bg-indigo-50 rounded-xl">📅</span> Classes Overview
              </h2>
              <select 
                className="bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold border border-indigo-100 outline-none text-indigo-600 cursor-pointer hover:bg-indigo-100 transition"
                value={selectedDayIndex}
                onChange={(e) => setSelectedDayIndex(Number(e.target.value))}
              >
                {daysOfWeek.map((day, idx) => (
                  <option key={idx} value={idx}>{day}</option>
                ))}
              </select>
            </div>
            <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {displayClasses.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <span className="text-4xl">☕</span>
                  <p className="font-medium">No classes today. Enjoy your break!</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {displayClasses.map((cls, idx) => (
                    <li key={idx} className="p-4 bg-white/50 border border-indigo-100 rounded-2xl flex justify-between items-center hover:bg-white hover:border-indigo-200 transition-all duration-300 hover:shadow-sm">
                      <span className="font-bold text-slate-800">{cls.courseName}</span>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50/80 px-3 py-1.5 rounded-full border border-indigo-100">
                        {cls.startTime} - {cls.endTime}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl flex flex-col h-full min-h-[420px] animate-slide-up" style={{ animationDelay: '0.2s' }}>
             <h2 className="text-2xl font-bold mb-6 text-rose-600 flex items-center gap-3">
               <span className="p-2 bg-rose-50 rounded-xl">🎯</span> Things to Tackle
             </h2>
             <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {tasks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <span className="text-4xl">🎉</span>
                  <p className="font-medium">All caught up! Nothing to do.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {tasks.slice(0, 5).map(task => (
                    <li key={task.id} className="p-4 bg-white/50 border border-rose-100 rounded-2xl flex items-start gap-4 hover:bg-white hover:border-rose-200 transition-all duration-300 hover:shadow-sm group">
                      <input 
                        type="checkbox" 
                        onChange={() => markTaskCompleted(task.id)}
                        className="mt-1 w-5 h-5 text-rose-500 rounded-lg border-rose-200 focus:ring-rose-500 cursor-pointer" 
                      />
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 block">{task.title}</span>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 px-2 py-0.5 bg-rose-50 rounded-md">
                             Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                           </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
             </div>
          </div>
          
          <div className="lg:col-span-2 glass-card p-8 rounded-[2rem] border-indigo-100 shadow-xl shadow-indigo-100/50 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-4">
                  <span className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">🌿</span> Your Study Roadmap
                </h2>
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-2 ml-14">Created by your AI Mentor</div>
              </div>
              <button 
                onClick={handleDeletePlan}
                disabled={!studyPlan}
                className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all disabled:opacity-0"
                title="Delete Study Plan"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 rounded-[2.5rem] p-1 shadow-2xl shadow-indigo-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>
              
              <div className="bg-slate-900/10 backdrop-blur-md rounded-[2.3rem] p-8 md:p-12 relative z-10">
                <div className="flex flex-col xl:flex-row gap-12 items-start">
                  
                  <div className="flex-1 w-full">
                    <div className="flex items-start gap-5 mb-8">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl border border-white/20 shadow-inner">🧠</div>
                      <div className="flex-1">
                        <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Mentor's Strategy</p>
                        <p className="text-xl md:text-2xl text-white font-bold leading-snug tracking-tight">
                          "{studyPlan ? studyPlan.summary : (
                            files.length > 0 && files[0].topics && files[0].topics.length > 0 ? (
                              `Focus on mastering ${files[0].courseName} today. I recommend diving deep into ${files[0].topics.slice(0, 2).join(' and ')} during your ${remainingHours}h window.`
                            ) : (
                              `Set your daily constraints and upload a syllabus to receive your custom study roadmap for today's ${remainingHours}h slot.`
                            )
                          )}"
                        </p>
                      </div>
                    </div>
                    
                    {studyPlan && studyPlan.twoWeekSchedule && studyPlan.twoWeekSchedule.length > 0 && (
                      <div className="relative group/scroll">
                        {/* Left Scroll Button */}
                        <button 
                          type="button"
                          onClick={() => scrollRoadmap('left')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-950/80 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center border border-white/10 shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 z-30 opacity-60 hover:opacity-100"
                          title="Scroll Left"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>

                        <div 
                          ref={scrollContainerRef}
                          className="flex overflow-x-auto gap-4 mb-2 pb-4 snap-x scroll-smooth custom-scrollbar"
                        >
                          {studyPlan.twoWeekSchedule.map((dayObj, dayIdx) => (
                            <div key={dayIdx} className="min-w-[280px] sm:min-w-[320px] bg-white/10 backdrop-blur-md p-6 rounded-[1.5rem] border border-white/10 snap-center">
                              <h4 className="text-white font-black mb-4 border-b border-white/10 pb-2">{dayObj.dayLabel}</h4>
                              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar flex flex-col">
                                {(dayObj.dailySchedule || []).map((item, idx) => (
                                  <div key={idx} className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5 transition-all hover:bg-white/10">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{item.time}</span>
                                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)]"></div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-200 leading-snug block">{item.activity}</span>
                                  </div>
                                ))}
                                {(!dayObj.dailySchedule || dayObj.dailySchedule.length === 0) && (
                                  <div className="text-white/50 text-xs text-center py-4 italic font-medium">No tasks scheduled for this day</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Right Scroll Button */}
                        <button 
                          type="button"
                          onClick={() => scrollRoadmap('right')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-950/80 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center border border-white/10 shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 z-30 opacity-60 hover:opacity-100"
                          title="Scroll Right"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                      </div>
                    )}

                    {studyPlan && (!studyPlan.twoWeekSchedule || studyPlan.twoWeekSchedule.length === 0) && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem] p-6 text-center text-slate-200 mt-6 max-w-xl mx-auto backdrop-blur-sm animate-fade">
                        <div className="text-3xl mb-3">🔑</div>
                        <h4 className="font-extrabold text-white text-lg">API Configuration Required</h4>
                        <p className="text-sm mt-2 leading-relaxed text-slate-300">
                          The study plan generation failed. This usually means the backend server doesn't have a valid Gemini API key configured.
                        </p>
                        <div className="bg-slate-950/40 p-4 rounded-xl text-left font-mono text-xs text-rose-300 border border-rose-500/10 mt-4 leading-normal">
                          Please verify your <span className="text-white font-bold">.env</span> file in the project folder contains a valid key:<br/>
                          <span className="text-emerald-400">GEMINI_API_KEY=AIzaSy...</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 mt-10">
                      <button 
                        onClick={() => setShowDaysModal(true)}
                        disabled={generating}
                        className="bg-white text-indigo-700 px-8 py-4 rounded-[1.2rem] font-black hover:bg-white hover:scale-105 transition-all duration-300 shadow-xl shadow-indigo-900/30 flex items-center gap-3 active:scale-95 disabled:opacity-50"
                      >
                        {generating ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-700 rounded-full animate-spin"></div>
                            Consulting AI...
                          </div>
                        ) : (
                          <>
                            {studyPlan ? 'Refresh My Strategy 🪄' : 'Generate Study plan ✨'}
                          </>
                        )}
                      </button>
                      
                      <button 
                        className="bg-white/10 border border-white/20 text-white px-8 py-4 rounded-[1.2rem] font-bold hover:bg-white/20 transition-all flex items-center gap-2"
                        onClick={() => addNotification("Mentor's advice: Take a 5-min walk between sessions!", "info")}
                      >
                        💡 Get Quick Tip
                      </button>
                    </div>
                  </div>

                  <div className="w-full xl:w-72 bg-white/10 backdrop-blur-lg p-6 rounded-[1.5rem] border border-white/20">
                    <h4 className="font-extrabold text-indigo-100 uppercase tracking-widest text-[10px] mb-6">Today's Energy Balance</h4>
                    <div className="space-y-5">
                      <div className="flex justify-between items-end">
                        <span className="text-white/70 text-sm font-medium">Academic Load</span> 
                        <span className="font-bold text-white">{prefs.collegeHours}h</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-400 h-full" style={{ width: `${(prefs.collegeHours / 24) * 100}%` }}></div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <span className="text-white/70 text-sm font-medium">Physical Recovery</span> 
                        <span className="font-bold text-white">{prefs.sleepHours}h</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-400 h-full" style={{ width: `${(prefs.sleepHours / 24) * 100}%` }}></div>
                      </div>

                      <div className="flex justify-between items-end">
                        <span className="text-white/70 text-sm font-medium">Travel</span> 
                        <span className="font-bold text-white">{prefs.travelHours || 2}h</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full" style={{ width: `${((Number(prefs.travelHours) || 2) / 24) * 100}%` }}></div>
                      </div>

                      <div className="pt-6 border-t border-white/10 mt-6 flex flex-col gap-1">
                        <span className="text-white/50 text-[10px] uppercase tracking-widest font-black">Net Study Window</span>
                        <span className="text-4xl font-extrabold text-white tracking-tight">{remainingHours}h</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

