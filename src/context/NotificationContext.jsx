import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserTasks } from '../services/tasksService';
import { getUserTimetable } from '../services/timetableService';
import { getUrgentNudge } from '../services/aiService';
import { getUserPreferences } from '../services/userService';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Logic to check for upcoming classes/tasks
  const checkReminders = useCallback(async () => {
    if (!currentUser) return;

    try {
      const [tasks, timetable] = await Promise.all([
        getUserTasks(currentUser.uid),
        getUserTimetable(currentUser.uid)
      ]);

      const now = new Date();
      const currentDay = (now.getDay() === 0 ? 6 : now.getDay() - 1); // 0=Mon, 6=Sun
      const currentTimeStr = now.toTimeString().slice(0, 5); // "HH:MM"

      // Check Timetable for classes starting soon (within 15 mins)
      const todaysClasses = timetable.filter(c => Number(c.dayOfWeek) === currentDay);
      todaysClasses.forEach(cls => {
        const [h, m] = cls.startTime.split(':').map(Number);
        const startTimeInMins = h * 60 + m;
        const currentMins = now.getHours() * 60 + now.getMinutes();
        
        const diff = startTimeInMins - currentMins;
        if (diff > 0 && diff <= 15) {
          addNotification(`Reminder: ${cls.courseName} starts in ${diff} minutes!`, 'warning');
        }
      });

      // Check Tasks due today
      const todayStr = now.toISOString().split('T')[0];
      const pendingTasks = tasks.filter(t => t.status !== 'Completed');
      const tasksDueSoon = pendingTasks.filter(t => t.dueDate.startsWith(todayStr));
      
      if (tasksDueSoon.length > 0) {
        addNotification(`You have ${tasksDueSoon.length} tasks due today!`, 'info');
      }

      // 🧠 Intelligence Layer: AI Nudge (Every few checks)
      if (pendingTasks.length > 0) {
        const nudge = await getUrgentNudge(pendingTasks);
        if (nudge) {
          addNotification(`🤖 AI Nudge: ${nudge}`, 'info');
        }
      }

    } catch (error) {
      console.error("Reminder check failed", error);
    }
  }, [currentUser, addNotification]);

  // Run check every 5 minutes
  useEffect(() => {
    if (currentUser) {
      checkReminders(); // Run once on load
      const interval = setInterval(checkReminders, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [currentUser, checkReminders]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
