import { db } from '../firebase';
import { ref, set, get, update } from 'firebase/database';

const PREFERENCES_PATH = 'userPreferences';

// Save or update user daily constraints
export const saveUserPreferences = async (userId, preferences) => {
  try {
    const prefRef = ref(db, `${PREFERENCES_PATH}/${userId}`);
    const data = {
      ...preferences,
      updatedAt: new Date().toISOString()
    };
    await set(prefRef, data);
    return data;
  } catch (error) {
    console.error("Error saving preferences: ", error);
    throw error;
  }
};

// Get user daily constraints
export const getUserPreferences = async (userId) => {
  try {
    const prefRef = ref(db, `${PREFERENCES_PATH}/${userId}`);
    const snapshot = await get(prefRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Error fetching preferences: ", error);
    throw error;
  }
};

// Save an AI generated study plan
export const saveStudyPlan = async (userId, plan) => {
  try {
    const planRef = ref(db, `studyPlans/${userId}`);
    await set(planRef, {
      ...plan,
      generatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error saving study plan: ", error);
    throw error;
  }
};

// Get the latest study plan
export const getStudyPlan = async (userId) => {
  try {
    const planRef = ref(db, `studyPlans/${userId}`);
    const snapshot = await get(planRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Error fetching study plan: ", error);
    throw error;
  }
};
