import { db } from '../firebase';
import { 
  ref, 
  push, 
  set, 
  update, 
  remove, 
  get, 
  query,
  orderByChild,
  equalTo
} from 'firebase/database';

const TIMETABLE_PATH = 'timetable';
const TIMETABLE_FILES_PATH = 'timetables';

/**
 * Helper to convert file to Base64 string
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Upload Academic or Exam timetable file (Stored in RTDB as Base64)
export const uploadTimetableFile = async (userId, type, file) => {
  try {
    // 1. Convert file to Base64
    const base64Data = await fileToBase64(file);

    // 2. Save metadata and data to RTDB
    const listRef = ref(db, TIMETABLE_FILES_PATH);
    const newDocRef = push(listRef);
    const fileData = {
      userId,
      type, // 'Academic' or 'Exam'
      fileUrl: base64Data, // Now contains the actual file data as a Data URI
      fileName: file.name,
      uploadedAt: new Date().toISOString()
    };

    await set(newDocRef, fileData);
    return { id: newDocRef.key, ...fileData };
  } catch (error) {
    console.error("Error uploading timetable file to RTDB: ", error);
    throw error;
  }
};

// Get uploaded timetable files for user
export const getUserTimetableFiles = async (userId) => {
  try {
    const listRef = ref(db, TIMETABLE_FILES_PATH);
    const snapshot = await get(listRef);
    const files = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const val = child.val();
        if (val.userId === userId) {
          files.push({ id: child.key, ...val });
        }
      });
    }
    return files;
  } catch (error) {
    console.error("Error fetching timetable files: ", error);
    throw error;
  }
};

// Create a new timetable event (e.g., repeating class)
export const createTimetableEvent = async (eventData) => {
  try {
    const listRef = ref(db, TIMETABLE_PATH);
    const newEventRef = push(listRef);
    
    const eventPayload = {
      ...eventData,
      createdAt: new Date().toISOString()
    };
    
    await set(newEventRef, eventPayload);
    return { id: newEventRef.key, ...eventPayload };
  } catch (error) {
    console.error("Error adding timetable event: ", error);
    throw error;
  }
};

// Get all timetable events for a specific user
export const getUserTimetable = async (userId) => {
  try {
    const timetableRef = ref(db, TIMETABLE_PATH);
    const snapshot = await get(timetableRef);
    const events = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const val = childSnapshot.val();
        if (val.userId === userId) {
          events.push({ id: childSnapshot.key, ...val });
        }
      });
    }
    
    // Sort by day of week locally
    return events.sort((a, b) => Number(a.dayOfWeek) - Number(b.dayOfWeek)); 
  } catch (error) {
    console.error("Error fetching timetable: ", error);
    throw error;
  }
};

// Update an existing event
export const updateTimetableEvent = async (eventId, updatedData) => {
  try {
    const eventRef = ref(db, `${TIMETABLE_PATH}/${eventId}`);
    await update(eventRef, updatedData);
    return true;
  } catch (error) {
    console.error("Error updating event: ", error);
    throw error;
  }
};

// Delete a class/event
export const deleteTimetableEvent = async (eventId) => {
  try {
    const eventRef = ref(db, `${TIMETABLE_PATH}/${eventId}`);
    await remove(eventRef);
    return true;
  } catch (error) {
    console.error("Error deleting event: ", error);
    throw error;
  }
};

// Create multiple timetable events at once (useful for AI imports)
export const batchCreateEvents = async (userId, events) => {
  try {
    const listRef = ref(db, TIMETABLE_PATH);
    const promises = events.map(event => {
      const newEventRef = push(listRef);
      return set(newEventRef, {
        ...event,
        userId,
        createdAt: new Date().toISOString()
      });
    });
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error("Error batch creating events:", error);
    throw error;
  }
};

// Delete an uploaded timetable file
export const deleteTimetableFile = async (id) => {
  try {
    const docRef = ref(db, `${TIMETABLE_FILES_PATH}/${id}`);
    await set(docRef, null);
    return true;
  } catch (error) {
    console.error("Error deleting timetable file: ", error);
    throw error;
  }
};
