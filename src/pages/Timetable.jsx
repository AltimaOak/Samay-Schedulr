import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  getUserTimetable, 
  createTimetableEvent, 
  deleteTimetableEvent,
  uploadTimetableFile,
  getUserTimetableFiles,
  batchCreateEvents,
  deleteTimetableFile
} from '../services/timetableService';
import { useNotifications } from '../hooks/useNotifications';
import { getUserTasks } from '../services/tasksService';
import { getUserSyllabus } from '../services/syllabusService';
import { getUserPreferences, saveStudyPlan } from '../services/userService';
import { generateStudyPlan, extractEventsFromTimetable, getTimetableInsights } from '../services/aiService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Timetable() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [scanningId, setScanningId] = useState(null);
  const [currentClass, setCurrentClass] = useState(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ 
    courseName: '', 
    dayOfWeek: 0, 
    startTime: '09:00', 
    endTime: '10:00' 
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null); // 'Academic' or 'Exam'
  
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const { addNotification } = useNotifications();

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [timetableData, filesData] = await Promise.all([
        getUserTimetable(currentUser.uid),
        getUserTimetableFiles(currentUser.uid)
      ]);
      setEvents(timetableData);
      setFiles(filesData);
      detectCurrentClass(timetableData);
    } catch (err) {
      console.error(err);
      addNotification("Failed to load timetable data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const detectCurrentClass = (allEvents) => {
    const now = new Date();
    const currentDay = (now.getDay() === 0 ? 6 : now.getDay() - 1);
    const currentTimeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    
    const active = allEvents.find(e => {
      return Number(e.dayOfWeek) === currentDay && 
             currentTimeStr >= e.startTime && 
             currentTimeStr <= e.endTime;
    });
    setCurrentClass(active);
  };

  const handleAutoPlan = async (currentFiles) => {
    const hasAcademic = currentFiles.some(f => f.type === 'Academic');
    const hasExam = currentFiles.some(f => f.type === 'Exam');

    if (hasAcademic && hasExam) {
      try {
        const prefs = await getUserPreferences(currentUser.uid);
        addNotification("Timetables complete! Re-generating your study plan...", "info");
        
        const [tasks, syllabusFiles] = await Promise.all([
          getUserTasks(currentUser.uid),
          getUserSyllabus(currentUser.uid)
        ]);

        const plan = await generateStudyPlan({
          tasks: tasks.filter(t => t.status !== 'Completed'),
          todayClasses: events, 
          prefs,
          syllabusFiles
        });

        await saveStudyPlan(currentUser.uid, plan);
        addNotification("Auto-plan updated based on your new timetables! ✨", "info");
      } catch (err) {
        console.error("Auto-plan failed", err);
      }
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.courseName) return;

    try {
      setSaving(true);
      await createTimetableEvent({
        ...newEvent,
        userId: currentUser.uid
      });
      setShowAddForm(false);
      setNewEvent({ courseName: '', dayOfWeek: 0, startTime: '09:00', endTime: '10:00' });
      const data = await getUserTimetable(currentUser.uid);
      setEvents(data);
      addNotification(`Class "${newEvent.courseName}" added successfully.`, "info");
    } catch (err) {
      console.error(err);
      addNotification("Failed to save class.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm("Delete this class?")) {
      try {
        await deleteTimetableEvent(eventId);
        const data = await getUserTimetable(currentUser.uid);
        setEvents(data);
        addNotification("Class removed from schedule.", "info");
      } catch (err) {
        console.error(err);
        addNotification("Failed to delete class.", "error");
      }
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(type);
      const uploadedDoc = await uploadTimetableFile(currentUser.uid, type, file);
      const filesData = await getUserTimetableFiles(currentUser.uid);
      setFiles(filesData);
      addNotification(`${type} timetable uploaded! Parsing schedule with AI...`, "info");
      
      // AI Extraction (Pass the file object directly for fastest processing)
      const extractedEvents = await extractEventsFromTimetable(file);
      
      if (extractedEvents && extractedEvents.length > 0) {
        await batchCreateEvents(currentUser.uid, extractedEvents);
        addNotification(`Success! Extracted ${extractedEvents.length} classes from your ${type} timetable.`, "success");
        await loadData();
      } else {
        addNotification("AI couldn't find structured classes in that file, but it's saved for reference.", "warning");
      }

      // Check for auto-planning
      await handleAutoPlan(filesData);
    } catch (err) {
      console.error(err);
      addNotification("Failed to upload or analyze file.", "error");
    } finally {
      setUploading(null);
    }
  };

  const handleScanFile = async (file) => {
    try {
      setScanningId(file.id);
      addNotification(`AI is scanning ${file.fileName} for classes...`, "info");
      
      const extractedEvents = await extractEventsFromTimetable(file.fileUrl);
      
      if (extractedEvents && extractedEvents.length > 0) {
        await batchCreateEvents(currentUser.uid, extractedEvents);
        addNotification(`AI successfully detected ${extractedEvents.length} classes!`, "success");
        await loadData();
      } else {
        addNotification("AI couldn't detect any classes in this document. Please check the image quality.", "warning");
      }
    } catch (err) {
      console.error(err);
      addNotification("AI scan failed.", "error");
    } finally {
      setScanningId(null);
    }
  };

  const handleDeleteFile = async (fileId, type) => {
    if (window.confirm(`Delete this ${type} timetable?`)) {
      try {
        setDeletingFileId(fileId);
        await deleteTimetableFile(fileId);
        const filesData = await getUserTimetableFiles(currentUser.uid);
        setFiles(filesData);
        addNotification(`${type} timetable removed.`, "info");
      } catch (err) {
        console.error(err);
        addNotification("Failed to delete file.", "error");
      } finally {
        setDeletingFileId(null);
      }
    }
  };

  const handleGetInsights = async () => {
    if (events.length === 0) {
      addNotification("Add some classes first to get schedule insights!", "warning");
      return;
    }
    try {
      setLoadingInsights(true);
      const data = await getTimetableInsights(events);
      setInsights(data);
      addNotification("AI Strategy generated! 🎯", "success");
    } catch (err) {
      console.error(err);
      addNotification("Failed to generate insights.", "error");
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex justify-between items-center animate-fade">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Your Weekly Rhythm</h1>
          <p className="text-slate-500 font-semibold text-lg mt-3">Stay in sync with your lectures, labs, and exams. 🌊</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-lg flex items-center gap-2 ${
            showAddForm 
            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          {showAddForm ? '✕ Close' : '+ Add Class'}
        </button>
      </div>

      {currentClass && (
        <div className="glass-card p-6 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-between animate-pulse shadow-xl shadow-indigo-200">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl animate-bounce">🎓</div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Happening Now</p>
              <h2 className="text-2xl font-black tracking-tight">{currentClass.courseName}</h2>
              <p className="text-sm font-bold opacity-90">{currentClass.startTime} - {currentClass.endTime}</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
             <div className="bg-white/20 px-4 py-2 rounded-xl text-xs font-black uppercase">Live Session active</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="glass-card p-8 rounded-3xl flex items-center justify-between group animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Academic Timetable</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Main semester schedule</p>
            {files.find(f => f.type === 'Academic') && (
              <div className="flex items-center gap-3 mt-3">
                <button 
                  onClick={() => handleScanFile(files.find(f => f.type === 'Academic'))}
                  disabled={scanningId === files.find(f => f.type === 'Academic').id}
                  className="text-emerald-600 text-xs font-bold hover:underline inline-flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg"
                >
                  <span>✨</span> {scanningId === files.find(f => f.type === 'Academic').id ? 'Scanning...' : 'Detect Classes'}
                </button>
                <button 
                  onClick={() => setPreviewFile(files.find(f => f.type === 'Academic'))}
                  className="text-indigo-600 text-xs font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>👁️</span> View
                </button>
                <button 
                  onClick={() => handleDeleteFile(files.find(f => f.type === 'Academic').id, 'Academic')}
                  className="text-rose-500 text-xs font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>🗑️</span> Remove
                </button>
              </div>
            )}
          </div>
          <label className="bg-indigo-50 text-indigo-700 px-6 py-3 rounded-xl cursor-pointer hover:bg-indigo-100 transition-all font-bold shadow-sm shadow-indigo-100">
            {uploading === 'Academic' ? 'Uploading...' : 'Upload'}
            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'Academic')} disabled={uploading} />
          </label>
        </div>
        
        <div className="glass-card p-8 rounded-3xl flex items-center justify-between group animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Exam Timetable</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Final examination dates</p>
            {files.find(f => f.type === 'Exam') && (
              <div className="flex items-center gap-3 mt-3">
                <button 
                  onClick={() => handleScanFile(files.find(f => f.type === 'Exam'))}
                  disabled={scanningId === files.find(f => f.type === 'Exam').id}
                  className="text-emerald-600 text-xs font-bold hover:underline inline-flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg"
                >
                  <span>✨</span> {scanningId === files.find(f => f.type === 'Exam').id ? 'Scanning...' : 'Detect Classes'}
                </button>
                <button 
                  onClick={() => setPreviewFile(files.find(f => f.type === 'Exam'))}
                  className="text-indigo-600 text-xs font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>👁️</span> View
                </button>
                <button 
                  onClick={() => handleDeleteFile(files.find(f => f.type === 'Exam').id, 'Exam')}
                  className="text-rose-500 text-xs font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>🗑️</span> Remove
                </button>
              </div>
            )}
          </div>
          <label className="bg-indigo-50 text-indigo-700 px-6 py-3 rounded-xl cursor-pointer hover:bg-indigo-100 transition-all font-bold shadow-sm shadow-indigo-100">
            {uploading === 'Exam' ? 'Uploading...' : 'Upload'}
            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'Exam')} disabled={uploading} />
          </label>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleSaveEvent} className="glass-card p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-5 gap-6 items-end animate-slide-up">
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">Course Name</label>
            <input 
              type="text" 
              required
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              placeholder="e.g. Intro to Computer Science"
              value={newEvent.courseName}
              onChange={e => setNewEvent({...newEvent, courseName: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">Day</label>
            <select 
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold"
              value={newEvent.dayOfWeek}
              onChange={e => setNewEvent({...newEvent, dayOfWeek: Number(e.target.value)})}
            >
              {DAYS.map((day, idx) => (
                <option key={idx} value={idx}>{day}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Start</label>
              <input 
                type="time" 
                required
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold"
                value={newEvent.startTime}
                onChange={e => setNewEvent({...newEvent, startTime: e.target.value})}
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">End</label>
              <input 
                type="time" 
                required
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold"
                value={newEvent.endTime}
                onChange={e => setNewEvent({...newEvent, endTime: e.target.value})}
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={saving}
            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-black px-8 py-3.5 rounded-2xl h-[58px] transition-all shadow-lg shadow-green-100 hover:-translate-y-1"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade" style={{ animationDelay: '0.3s' }}>
          {DAYS.map((dayName, dayIndex) => {
            const dayEvents = events.filter(e => Number(e.dayOfWeek) === dayIndex);
            
            if (dayEvents.length === 0) return null;

            return (
              <div key={dayName} className="glass-card rounded-[2.5rem] overflow-hidden">
                <div className="bg-slate-900/5 px-8 py-4 font-black text-slate-400 uppercase tracking-[0.2em] text-xs">
                  {dayName}
                </div>
                <ul className="divide-y divide-slate-100/30">
                  {dayEvents.map((event, idx) => (
                    <li key={event.id} className="p-6 px-8 flex justify-between items-center hover:bg-white/40 group transition-all duration-300">
                      <div>
                        <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          {event.courseName}
                          {currentClass?.id === event.id && (
                            <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase font-black animate-pulse">Now</span>
                          )}
                        </h4>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100/50">
                            {event.startTime} - {event.endTime}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(event.id)}
                        className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          
          {events.length === 0 && !showAddForm && (
            <div className="p-24 rounded-[3rem] text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mb-8 text-5xl animate-blob">📅</div>
              <h3 className="text-3xl font-black text-slate-900 mb-3">Your Rhythm is Empty</h3>
              <p className="text-slate-500 max-w-sm font-semibold text-lg leading-relaxed">Add your classes manually or upload a timetable to let the digital mentor map out your week.</p>
            </div>
          )}
        </div>
      )}

      {/* View Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade" onClick={() => setPreviewFile(null)}></div>
          <div className="bg-white rounded-[3rem] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl relative z-10 animate-slide-up overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{previewFile.type} Timetable</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{previewFile.fileName}</p>
              </div>
              <button 
                onClick={() => setPreviewFile(null)}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl transition-all font-black"
              >✕</button>
            </div>
            
            <div className="flex-1 bg-slate-50 relative overflow-auto p-4 flex items-center justify-center">
               {previewFile.fileUrl.startsWith('data:image') ? (
                 <img src={previewFile.fileUrl} alt="Timetable Preview" className="max-w-full shadow-2xl rounded-xl" />
               ) : (
                 <iframe 
                   src={previewFile.fileUrl} 
                   className="w-full h-full rounded-2xl border-0 shadow-inner bg-white"
                   title="File Preview"
                 />
               )}
            </div>
            
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
               <a 
                 href={previewFile.fileUrl} 
                 download={previewFile.fileName}
                 className="bg-indigo-600 text-white font-black px-8 py-3.5 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
               >
                 Download Original
               </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
