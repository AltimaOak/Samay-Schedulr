import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { ref, set, get } from 'firebase/database';
import { uploadSyllabus, getUserSyllabus, deleteSyllabus, updateSyllabusTopics } from '../services/syllabusService';
import { extractTopicsFromSyllabus, getTopicSuggestion } from '../services/aiService';
import { useNotifications } from '../hooks/useNotifications';
import { getUserPreferences } from '../services/userService';

export default function Syllabus() {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extractingId, setExtractingId] = useState(null);
  const [courseName, setCourseName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // AI Tip Modal State
  const [activeTopic, setActiveTopic] = useState(null);
  const [aiTip, setAiTip] = useState('');
  const [loadingTip, setLoadingTip] = useState(false);
  
  // View/Preview Modal State
  const [previewFile, setPreviewFile] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [addingTopicId, setAddingTopicId] = useState(null);
  const [newTopicText, setNewTopicText] = useState('');

  const { addNotification } = useNotifications();

  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser]);

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([loadSyllabus(), loadPrefs()]);
    setLoading(false);
  };

  const loadPrefs = async () => {
    try {
      await getUserPreferences(currentUser.uid);
    } catch (err) {
      console.error("Failed to load preferences", err);
    }
  };

  const loadSyllabus = async () => {
    try {
      const data = await getUserSyllabus(currentUser.uid);
      setFiles(data);
    } catch (err) {
      console.error(err);
      addNotification("Failed to load syllabus files.", "error");
    }
  };

  const handleExtractTopics = async (syllabusId, name, fileToAnalyze) => {
    try {
      setExtractingId(syllabusId);
      addNotification(`Analyzing ${name} syllabus...`, "info");
      const topics = await extractTopicsFromSyllabus(syllabusId, name, fileToAnalyze);
      
      // Initialize with all topics selected
      const docRef = ref(db, `syllabus/${syllabusId}`);
      const snapshot = await get(docRef);
      if (snapshot.exists()) {
        await set(docRef, { ...snapshot.val(), topics, selectedTopics: topics });
      }
      
      addNotification(`Analysis complete for ${name}!`, "info");
      await loadSyllabus(); 
    } catch (err) {
      console.error("Extraction failed", err);
      addNotification("AI analysis failed. Please verify the document.", "error");
    } finally {
      setExtractingId(null);
    }
  };

  const handleTopicClick = async (topic, course) => {
    setActiveTopic(topic);
    setAiTip('');
    setLoadingTip(true);
    try {
      const tip = await getTopicSuggestion(topic, course);
      setAiTip(tip);
    } catch (err) {
      setAiTip("Failed to fetch study trick. Please try again.");
    } finally {
      setLoadingTip(false);
    }
  };

  const handleDeleteSyllabus = async (id) => {
    if (!window.confirm("Are you sure you want to delete this syllabus? This cannot be undone.")) return;
    try {
      setDeletingId(id);
      await deleteSyllabus(id);
      addNotification("Syllabus deleted successfully.", "success");
      await loadSyllabus();
    } catch (err) {
      console.error(err);
      addNotification("Failed to delete syllabus.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateTopics = async (syllabusId, updatedTopics) => {
    try {
      await updateSyllabusTopics(syllabusId, updatedTopics);
      await loadSyllabus();
      addNotification("Topics updated successfully.", "info");
    } catch (err) {
      console.error(err);
      addNotification("Failed to update topics.", "error");
    }
  };

  const handleDeleteTopic = async (syllabusId, topicToDelete) => {
    const syllabus = files.find(f => f.id === syllabusId);
    if (!syllabus) return;
    const updatedTopics = (syllabus.topics || []).filter(t => t !== topicToDelete);
    const selectedTopics = (syllabus.selectedTopics || []).filter(t => t !== topicToDelete);
    
    try {
      const docRef = ref(db, `syllabus/${syllabusId}`);
      await set(docRef, { ...syllabus, topics: updatedTopics, selectedTopics });
      await loadSyllabus();
      addNotification("Topic removed.", "info");
    } catch (err) {
      console.error(err);
      addNotification("Failed to remove topic.", "error");
    }
  };

  const handleToggleTopicSelection = async (syllabusId, topic) => {
    const syllabus = files.find(f => f.id === syllabusId);
    if (!syllabus) return;
    
    let selectedTopics = syllabus.selectedTopics || [];
    if (selectedTopics.includes(topic)) {
      selectedTopics = selectedTopics.filter(t => t !== topic);
    } else {
      selectedTopics = [...selectedTopics, topic];
    }
    
    try {
      const docRef = ref(db, `syllabus/${syllabusId}`);
      await set(docRef, { ...syllabus, selectedTopics });
      await loadSyllabus();
      addNotification("Focus topics updated.", "info");
    } catch (err) {
      console.error(err);
      addNotification("Failed to toggle selection.", "error");
    }
  };

  const handleAddFieldTopic = async (syllabusId) => {
    if (!newTopicText.trim()) return;
    const syllabus = files.find(f => f.id === syllabusId);
    if (!syllabus) return;
    const updatedTopics = [...(syllabus.topics || []), newTopicText.trim()];
    const selectedTopics = [...(syllabus.selectedTopics || []), newTopicText.trim()]; // Auto-select new topics
    
    try {
      const docRef = ref(db, `syllabus/${syllabusId}`);
      await set(docRef, { ...syllabus, topics: updatedTopics, selectedTopics });
      await loadSyllabus();
      setNewTopicText('');
      setAddingTopicId(null);
      addNotification("Topic added and selected.", "info");
    } catch (err) {
      console.error(err);
      addNotification("Failed to add topic.", "error");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!courseName || !selectedFile) {
      addNotification("Add course name and select a file.", "warning");
      return;
    }

    try {
      setUploading(true);
      const uploadedDoc = await uploadSyllabus(currentUser.uid, courseName, selectedFile);
      setCourseName('');
      document.getElementById('file-upload').value = null;
      addNotification("Syllabus uploaded! Starting AI analysis...", "info");
      
      // Auto-trigger analysis
      await handleExtractTopics(uploadedDoc.id, courseName, selectedFile);
      setSelectedFile(null);
      await loadSyllabus();
    } catch (err) {
      console.error(err);
      addNotification("Failed to upload syllabus.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="animate-fade">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">The Knowledge Map</h1>
        <p className="text-slate-500 font-semibold text-lg mt-3">Upload your syllabus and let's map out your path to mastery, together. 🗺️</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Upload Form */}
        <div className="lg:col-span-1 glass-card p-8 rounded-[2rem] h-fit animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 rounded-lg text-lg">📤</span> Upload Document
          </h2>
          
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 ml-1 mb-2">Course Name</label>
              <input 
                type="text" 
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                placeholder="e.g. Data Structures"
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">File (PDF/DOC)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-[2rem] px-4 py-10 text-center hover:bg-slate-50 transition-all group">
                <input 
                  id="file-upload"
                  type="file" 
                  accept=".pdf,.doc,.docx"
                  required
                  className="hidden"
                  onChange={e => setSelectedFile(e.target.files[0])}
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="text-3xl mb-3 opacity-50 group-hover:scale-110 transition-transform">📄</div>
                  <span className="text-indigo-600 font-bold hover:underline mb-1 block">
                    {selectedFile ? selectedFile.name : 'Select file'}
                  </span>
                  {!selectedFile && <p className="text-xs text-slate-400 font-medium italic">PDF or Word documents only</p>}
                </label>
              </div>
            </div>

            <button 
              type="submit"
              disabled={uploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black px-6 py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100 hover:-translate-y-1 active:scale-95"
            >
              {uploading ? 'Uploading...' : 'Upload Syllabus'}
            </button>
          </form>
        </div>

        {/* Uploaded Documents List */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-[2.5rem] overflow-hidden min-h-[500px] animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-slate-900/5 border-b border-slate-100/50 px-8 py-5 font-black text-slate-400 uppercase tracking-[0.2em] text-xs">
              Knowledge Base
            </div>
            
            {loading ? (
               <div className="p-20 text-center flex flex-col items-center">
                 <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                 <p className="font-medium text-slate-500">Retrieving syllabus data...</p>
               </div>
            ) : files.length === 0 ? (
               <div className="p-20 text-center flex flex-col items-center">
                 <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-8 text-4xl animate-bounce">📁</div>
                 <h3 className="text-2xl font-bold text-slate-800 mb-2">No Syllabus Uploaded</h3>
                 <p className="text-slate-500 max-w-xs mx-auto font-medium">Add a syllabus on the left to allow the AI to extract key concepts and customize your sessions.</p>
               </div>
            ) : (
               <ul className="divide-y divide-slate-100/30">
                 {files.map((file, idx) => (
                   <li key={file.id} className="p-8 px-10 hover:bg-white/40 transition-all duration-300 transform group" style={{ animationDelay: `${0.2 + (idx * 0.1)}s` }}>
                     <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-2xl font-black text-slate-800 tracking-tight">{file.courseName}</h4>
                          <a href={file.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 hover:underline inline-flex items-center gap-2 mt-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100/50">
                            <span>📎</span> {file.fileName}
                          </a>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(file.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                           <button 
                             onClick={() => handleDeleteSyllabus(file.id)}
                             disabled={deletingId === file.id}
                             className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-sm border border-rose-100 disabled:opacity-50"
                             title="Delete Syllabus"
                           >
                             {deletingId === file.id ? '...' : '🗑️'}
                           </button>
                        </div>
                     </div>
                     
                     <div className="bg-white/60 p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-16 -mt-16 pointer-events-none"></div>
                        
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 relative z-10">AI Analytical Insights</h5>
                        
                        {file.topics && file.topics.length > 0 ? (
                          <div className="flex flex-wrap gap-2.5 relative z-10">
                            {file.topics.map((t, idx) => {
                              const isSelected = (file.selectedTopics || []).includes(t);
                              return (
                                <div key={idx} className="group/topic relative">
                                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-indigo-100 hover:border-indigo-400 transition-all">
                                    <input 
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleTopicSelection(file.id, t)}
                                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <button 
                                      onClick={() => handleTopicClick(t, file.courseName)}
                                      className={`text-xs font-bold transition-all cursor-pointer active:scale-95 ${isSelected ? 'text-indigo-700' : 'text-slate-400'}`}
                                    >
                                      {t}
                                    </button>
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTopic(file.id, t); }}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover/topic:opacity-100 transition-opacity shadow-lg z-20"
                                    title="Remove Topic"
                                  >✕</button>
                                </div>
                              );
                            })}
                            
                            {addingTopicId === file.id ? (
                              <div className="flex items-center gap-2 animate-fade">
                                <input 
                                  autoFocus
                                  className="bg-white px-3 py-1.5 rounded-xl border border-indigo-400 text-xs font-bold text-indigo-700 w-32 outline-none"
                                  value={newTopicText}
                                  onChange={e => setNewTopicText(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleAddFieldTopic(file.id)}
                                  placeholder="New topic..."
                                />
                                <button onClick={() => handleAddFieldTopic(file.id)} className="text-emerald-500 font-black">✓</button>
                                <button onClick={() => setAddingTopicId(null)} className="text-rose-500 font-black">✕</button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setAddingTopicId(file.id)}
                                className="bg-indigo-50/50 px-4 py-1.5 rounded-xl border border-dashed border-indigo-300 text-xs font-bold text-indigo-400 hover:bg-indigo-50 hover:border-indigo-400 transition-all"
                              >
                                + Add Topic
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex justify-between items-center w-full relative z-10">
                            <span className="text-sm text-slate-500 font-medium italic">Topics are ready for deep analysis.</span>
                            <button 
                              onClick={() => handleExtractTopics(file.id, file.courseName, file.fileUrl)}
                              disabled={extractingId === file.id}
                              className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all duration-300 disabled:opacity-50"
                            >
                              {extractingId === file.id ? 'Analyzing...' : 'Execute AI Parse'}
                            </button>
                          </div>
                        )}
                     </div>
                   </li>
                 ))}
               </ul>
            )}
          </div>
        </div>

      </div>

      {/* AI Strategy Modal */}
      {activeTopic && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade" onClick={() => setActiveTopic(null)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative z-10 animate-slide-up">
            <button 
              onClick={() => setActiveTopic(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold p-2"
            >✕</button>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-6">💡</div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight px-4">Study Trick for {activeTopic}</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Personalized Strategy</p>
              
              <div className="mt-8 bg-indigo-50/50 p-6 rounded-3xl w-full text-slate-700 font-medium leading-relaxed italic border border-indigo-100">
                {loadingTip ? (
                  <div className="flex items-center justify-center gap-3 text-indigo-500 font-bold">
                    <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    Thinking...
                  </div>
                ) : (
                  <span>"{aiTip}"</span>
                )}
              </div>

              <div className="mt-8 flex gap-3 w-full">
                <button 
                  onClick={() => setActiveTopic(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition-all"
                >
                  Got it!
                </button>
                <button 
                  onClick={() => {
                    const msg = `I want to plan a 1-hour session focusing on ${activeTopic}. Can you update my plan?`;
                    addNotification("Suggestion submitted to AI Coach! Check Dashboard for updates.", "success");
                    setActiveTopic(null);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100"
                >
                  Let's Plan it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade" onClick={() => setPreviewFile(null)}></div>
          <div className="bg-white rounded-[3rem] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl relative z-10 animate-slide-up overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{previewFile.courseName}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{previewFile.fileName}</p>
              </div>
              <button 
                onClick={() => setPreviewFile(null)}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl transition-all font-black"
              >✕</button>
            </div>
            
            <div className="flex-1 bg-slate-50 relative overflow-auto p-4 flex items-center justify-center">
               {previewFile.fileUrl.startsWith('data:image') ? (
                 <img src={previewFile.fileUrl} alt="Syllabus Preview" className="max-w-full shadow-2xl rounded-xl" />
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
