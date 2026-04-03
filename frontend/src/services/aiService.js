import { db } from '../firebase';
import { ref, update } from 'firebase/database';

const SYLLABUS_PATH = 'syllabus';

const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Generate a full study plan using Python Backend
 */
export const generateStudyPlan = async (userContext) => {
  const response = await fetch(`${BASE_URL}/generate-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userContext)
  });
  if (!response.ok) throw new Error('Failed to generate study plan');
  return await response.json();
};

/**
 * Analyze syllabus file using Python Backend
 */
export const extractTopicsFromSyllabus = async (syllabusId, courseName, fileOrData) => {
  const formData = new FormData();
  formData.append('courseName', courseName);
  
  if (typeof fileOrData === 'string' && fileOrData.startsWith('data:')) {
    const res = await fetch(fileOrData);
    const blob = await res.blob();
    formData.append('file', blob, 'syllabus.pdf');
  } else {
    formData.append('file', fileOrData);
  }

  const response = await fetch(`${BASE_URL}/analyze-syllabus`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) throw new Error('Failed to analyze syllabus');
  const data = await response.json();
  
  // Update Firebase for compatibility with existing flow
  const { db } = await import('../firebase');
  const { ref, update } = await import('firebase/database');
  const syllabusRef = ref(db, `syllabus/${syllabusId}`);
  await update(syllabusRef, { topics: data.topics });
  
  return data.topics;
};

/**
 * Get a specific study strategy for a syllabus topic
 */
export const getTopicSuggestion = async (topic, courseName) => {
  const response = await fetch(`${BASE_URL}/topic-suggestion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, courseName })
  });
  if (!response.ok) throw new Error('Failed to get topic suggestion');
  const data = await response.json();
  return data.suggestion;
};

/**
 * Extract structured events from a timetable file
 */
export const extractEventsFromTimetable = async (fileOrData) => {
  const formData = new FormData();
  
  if (typeof fileOrData === 'string' && fileOrData.startsWith('data:')) {
    const res = await fetch(fileOrData);
    const blob = await res.blob();
    formData.append('file', blob, 'timetable.png');
  } else {
    formData.append('file', fileOrData);
  }

  const response = await fetch(`${BASE_URL}/parse-timetable`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) throw new Error('Failed to parse timetable');
  return await response.json();
};

export const getUrgentNudge = async (tasks) => {
  if (!tasks || tasks.length === 0) return null;
  try {
    const response = await fetch(`${BASE_URL}/urgent-nudge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks })
    });
    if (!response.ok) throw new Error('Failed to fetch nudge');
    const data = await response.json();
    return data.nudge;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getTimetableInsights = async (events) => {
  try {
    const response = await fetch(`${BASE_URL}/timetable-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events })
    });
    if (!response.ok) throw new Error('Failed to fetch insights');
    const data = await response.json();
    return data.insights;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
