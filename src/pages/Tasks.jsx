import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserTasks, createTask, updateTask, deleteTask } from '../services/tasksService';
import { useNotifications } from '../hooks/useNotifications';

export default function Tasks() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'Medium' });
  const [creating, setCreating] = useState(false);

  const { addNotification } = useNotifications();

  useEffect(() => {
    if (currentUser) {
      loadTasks();
    }
  }, [currentUser]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const userTasks = await getUserTasks(currentUser.uid);
      setTasks(userTasks);
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.dueDate) return;

    try {
      setCreating(true);
      await createTask({
        ...newTask,
        status: 'Pending',
        userId: currentUser.uid
      });
      setShowAddForm(false);
      setNewTask({ title: '', dueDate: '', priority: 'Medium' });
      addNotification(`Task "${newTask.title}" created successfully!`, "info");
      await loadTasks(); 
    } catch (err) {
      console.error(err);
      addNotification("Failed to create task.", "error");
    } finally {
      setCreating(false);
    }
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';
      await updateTask(taskId, {
        status: newStatus
      });
      if (newStatus === 'Completed') {
        addNotification("Task marked as completed! 🏆", "info");
      }
      await loadTasks();
    } catch (err) {
      console.error(err);
      addNotification("Failed to update task.", "error");
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(taskId);
        addNotification("Task deleted.", "info");
        await loadTasks();
      } catch (err) {
        console.error(err);
        addNotification("Failed to delete task.", "error");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex justify-between items-center animate-fade">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Missions & Goals</h1>
          <p className="text-slate-500 font-semibold text-lg mt-3 italic">Small steps today, remarkably big results tomorrow. 🚀</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-lg flex items-center gap-2 ${
            showAddForm 
            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-slate-200/50' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          {showAddForm ? '✕ Close' : '+ New Task'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateTask} className="glass-card p-8 rounded-[2rem] flex flex-col md:flex-row gap-6 items-end animate-slide-up">
          <div className="flex-1 w-full space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">Task Title</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Physics Lab Report"
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              value={newTask.title}
              onChange={e => setNewTask({...newTask, title: e.target.value})}
            />
          </div>
          <div className="w-full md:w-1/4 space-y-2">
             <label className="block text-sm font-bold text-slate-700 ml-1">Due Date</label>
             <input 
              type="date" 
              required
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              value={newTask.dueDate}
              onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
            />
          </div>
          <div className="w-full md:w-1/4 space-y-2">
             <label className="block text-sm font-bold text-slate-700 ml-1">Priority</label>
             <select 
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              value={newTask.priority}
              onChange={e => setNewTask({...newTask, priority: e.target.value})}
             >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
             </select>
          </div>
          <button 
            type="submit"
            disabled={creating}
            className="w-full md:w-auto bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-2xl h-[58px] shadow-lg shadow-green-100 transition-all active:scale-95"
          >
            {creating ? 'Saving...' : 'Save Task'}
          </button>
        </form>
      )}

      <div className="glass-card rounded-[2.5rem] overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          <div className="p-20 text-center text-slate-500">
             <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
             Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-24 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mb-8 text-5xl animate-blob">✨</div>
            <h3 className="text-3xl font-black text-slate-900 mb-3">All Clear!</h3>
             <p className="text-slate-500 max-w-sm font-semibold text-lg leading-relaxed">Your mission board is empty. Take a deep breath and enjoy some well-deserved downtime.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100/50">
            {tasks.map((task, idx) => (
              <li key={task.id} className="p-6 flex items-center hover:bg-white/40 transition-all duration-300 group gap-6" style={{ animationDelay: `${0.1 + (idx * 0.05)}s` }}>
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={task.status === 'Completed'}
                    onChange={() => toggleTaskStatus(task.id, task.status)}
                    className="w-7 h-7 text-indigo-600 border-2 border-slate-200 rounded-xl focus:ring-indigo-500 cursor-pointer transition-all checked:bg-indigo-600"
                  />
                </div>
                
                <div className="flex-1">
                  <h4 className={`text-xl font-bold transition-all duration-300 ${task.status === 'Completed' ? 'text-slate-400 line-through opacity-60' : 'text-slate-800'}`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                      <span className="opacity-70">📅</span> {new Date(task.dueDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        task.priority === 'High' ? 'text-rose-700 bg-rose-50 border border-rose-100' : 
                        task.priority === 'Medium' ? 'text-amber-700 bg-amber-50 border border-amber-100' : 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                      }`}>
                      {task.priority + ' Priority'}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDelete(task.id)}
                  className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110"
                  title="Delete Task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
