import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationCenter() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => (
        <div 
          key={notif.id}
          className={`
            pointer-events-auto p-4 rounded-xl shadow-lg border flex items-center justify-between
            animate-in slide-in-from-right-full fade-in duration-300
            ${notif.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 
              notif.type === 'info' ? 'bg-indigo-50 border-indigo-100 text-indigo-800' : 
              'bg-blue-50 border-blue-100 text-blue-800'}
          `}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {notif.type === 'warning' ? '🔔' : '📅'}
            </span>
            <p className="text-sm font-medium">{notif.message}</p>
          </div>
          <button 
            onClick={() => removeNotification(notif.id)}
            className="ml-4 text-gray-400 hover:text-gray-600 p-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
