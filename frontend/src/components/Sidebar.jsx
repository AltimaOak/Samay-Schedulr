import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import logo from '../assets/logo.png';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const menus = [
    { title: "Dashboard", path: "/app", icon: "🏠" },
    { title: "Timetable", path: "/app/timetable", icon: "📅" },
    { title: "Tasks", path: "/app/tasks", icon: "📝" },
    { title: "Syllabus", path: "/app/syllabus", icon: "📄" },
    { title: "Settings", path: "/app/settings", icon: "⚙️" }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className="w-64 h-screen bg-card-bg backdrop-blur-xl border-r border-slate-200/60 flex flex-col hidden md:flex shrink-0">
      <div className="p-6 mb-2">
        <Link to="/" className="block">
          <img 
            src={logo} 
            alt="Samay Schedulr" 
            className="w-full h-auto hover:scale-105 transition-transform duration-300" 
          />
        </Link>
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {menus.map((menu, index) => (
            <li key={index}>
              <Link
                to={menu.path}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black transition-all duration-300 ${location.pathname === menu.path
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100/50 -translate-y-0.5"
                    : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                  }`}
              >
                <span className="text-xl">{menu.icon}</span>
                <span>{menu.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-6 border-t border-slate-100 flex flex-col gap-3">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 p-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
        >
          <span>{isDarkMode ? '☀️ Light' : '🌙 Dark'}</span>
          {isDarkMode ? 'Mode' : 'Mode'}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white p-3 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
        >
          <span>🚪</span>
          Log Out
        </button>
      </div>
    </div>
  );
}
