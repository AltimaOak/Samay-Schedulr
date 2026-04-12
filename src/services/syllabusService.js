import { db } from '../firebase';
import { 
  ref as dbRef, 
  push, 
  set, 
  get, 
  query,
  orderByChild,
  equalTo
} from 'firebase/database';

const SYLLABUS_PATH = 'syllabus';

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

// Upload a syllabus file and create a document (Stored in RTDB as Base64)
export const uploadSyllabus = async (userId, courseName, file) => {
  try {
    // 1. Convert file to Base64
    const base64Data = await fileToBase64(file);

    // 2. Save metadata and data to Realtime Database
    const listRef = dbRef(db, SYLLABUS_PATH);
    const newDocRef = push(listRef);

    const syllabusData = {
      userId,
      courseName,
      fileUrl: base64Data, // Now contains the actual file data as a Data URI
      topics: [], // To be populated by AI later
      fileName: file.name,
      uploadedAt: new Date().toISOString()
    };

    await set(newDocRef, syllabusData);
    
    return { id: newDocRef.key, ...syllabusData };
  } catch (error) {
    console.error("Error uploading syllabus to RTDB: ", error);
    throw error;
  }
};

// Get all uploaded syllabus docs for user
export const getUserSyllabus = async (userId) => {
  try {
    const listRef = dbRef(db, SYLLABUS_PATH);
    const snapshot = await get(listRef);
    const files = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const val = childSnapshot.val();
        if (val.userId === userId) {
          files.push({ id: childSnapshot.key, ...val });
        }
      });
    }
    
    return files;
  } catch (error) {
    console.error("Error fetching syllabus: ", error);
    throw error;
  }
};

// Delete a syllabus doc
export const deleteSyllabus = async (id) => {
  try {
    const docRef = dbRef(db, `${SYLLABUS_PATH}/${id}`);
    await set(docRef, null);
    return true;
  } catch (error) {
    console.error("Error deleting syllabus: ", error);
    throw error;
  }
};
// Update syllabus topics
export const updateSyllabusTopics = async (id, topics) => {
  try {
    const docRef = dbRef(db, `${SYLLABUS_PATH}/${id}`);
    const snapshot = await get(docRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      await set(docRef, { ...data, topics });
    }
    return true;
  } catch (error) {
    console.error("Error updating topics: ", error);
    throw error;
  }
};
