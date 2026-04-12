import { db } from '../firebase';
import { 
  ref, 
  push, 
  set, 
  update, 
  remove, 
  get, 
  child,
  query,
  orderByChild,
  equalTo
} from 'firebase/database';

const TASKS_PATH = 'tasks';

// Create a new task
export const createTask = async (taskData) => {
  try {
    const tasksListRef = ref(db, TASKS_PATH);
    const newTaskRef = push(tasksListRef);
    
    const taskPayload = {
      ...taskData,
      createdAt: new Date().toISOString()
    };
    
    await set(newTaskRef, taskPayload);
    return { id: newTaskRef.key, ...taskPayload };
  } catch (error) {
    console.error("Error adding task: ", error);
    throw error;
  }
};

// Get all tasks for a specific user
export const getUserTasks = async (userId) => {
  try {
    const tasksRef = ref(db, TASKS_PATH);
    const userTasksQuery = query(tasksRef, orderByChild('userId'), equalTo(userId));
    
    const snapshot = await get(userTasksQuery);
    const tasks = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        tasks.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
    }
    
    // Sort tasks locally
    return tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)); 
  } catch (error) {
    console.error("Error fetching tasks: ", error);
    throw error;
  }
};

// Update an existing task status or details
export const updateTask = async (taskId, updatedData) => {
  try {
    const taskRef = ref(db, `${TASKS_PATH}/${taskId}`);
    await update(taskRef, updatedData);
    return true;
  } catch (error) {
    console.error("Error updating task: ", error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId) => {
  try {
    const taskRef = ref(db, `${TASKS_PATH}/${taskId}`);
    await remove(taskRef);
    return true;
  } catch (error) {
    console.error("Error deleting task: ", error);
    throw error;
  }
};
