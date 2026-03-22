import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const { currentUser } = useAuth();
  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/50 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between p-4 px-8 z-10">
            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent md:hidden">StudyPlanner+</h2>
            <div className="flex items-center gap-3 ml-auto">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-none">{currentUser?.displayName || 'Student'}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Academic Profile</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-inner flex items-center justify-center text-white font-bold shrink-0 border-2 border-white shadow-lg">
                {(currentUser?.displayName || 'S').charAt(0)}
              </div>
            </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 animate-fade">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
