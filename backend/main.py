import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from pydantic import BaseModel
from typing import List, Optional
import json
import base64
import traceback

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Study Academic Planner API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("CRITICAL ERROR: GEMINI_API_KEY not found in environment!")
else:
    print("GEMINI_API_KEY loaded successfully.")
    
genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "models/gemini-flash-latest"
print(f"USING MODEL: {MODEL_NAME}")

from typing import List, Optional, Any

class StudyPlanRequest(BaseModel):
    tasks: Optional[List[Any]] = []
    todayClasses: Optional[List[Any]] = []
    prefs: Optional[dict] = {}
    syllabusFiles: Optional[List[Any]] = []

class TopicSuggestionRequest(BaseModel):
    topic: str
    courseName: str

@app.get("/")
async def root():
    return {"message": "Study Academic Planner API is running"}

import traceback

@app.post("/analyze-syllabus")
async def analyze_syllabus(courseName: str = Form(...), file: UploadFile = File(...)):
    try:
        print(f"Analyzing syllabus for course: {courseName}")
        content = await file.read()
        mime_type = file.content_type
        print(f"File received: {file.filename}, Type: {mime_type}, Size: {len(content)} bytes")
        
        model = genai.GenerativeModel(MODEL_NAME)
        
        prompt = f"""Act as a pedagogical expert and NLP analyzer. 
        Thoroughly scan the uploaded syllabus for the course "{courseName}".
        
        TASKS:
        1. Identify the high-level chapters or modules.
        2. Extract 5-10 specific, granular academic topics that represent the core of this course.
        3. Ensure topics are concise (2-4 words each).
        
        CRITICAL: Return ONLY a PURE JSON ARRAY of strings.
        Example: ["Quantum Mechanics Basics", "Schrödinger Equation", "Atomic Orbitals"]"""
        
        response = model.generate_content([
            prompt,
            {"mime_type": mime_type, "data": content}
        ])
        
        text = response.text
        print(f"AI Response: {text}")
        
        # Robust JSON extraction
        start = text.find('[')
        end = text.rfind(']') + 1
        if start == -1 or end == 0:
            raise ValueError(f"AI response did not contain a valid JSON array: {text}")
            
        json_match = json.loads(text[start:end])
        return {"topics": json_match}
    except Exception as e:
        print(f"ERROR in /analyze-syllabus: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-plan")
async def generate_plan(request: StudyPlanRequest):
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        
        prefs = request.prefs or {}
        tasks = request.tasks or []
        today_classes = request.todayClasses or []
        syllabus_files_input = request.syllabusFiles or []
        
        free_hours = 24 - int(prefs.get('sleepHours', 8)) - int(prefs.get('collegeHours', 6))
        
        # Prefer selectedTopics if available, otherwise fallback to topics
        syllabus_data = []
        for f in syllabus_files_input:
            course = f.get('courseName')
            # Use selectedTopics if they exist, otherwise use all topics
            active_topics = f.get('selectedTopics') or f.get('topics') or []
            syllabus_data.append({'course': course, 'topics': active_topics})

        prompt = f"""Act as an expert academic coach. Generate a highly personalized, TIME-WISE daily study roadmap based on:
        - User Constraints: Sleep {prefs.get('sleepHours', 8)}h, College/Work {prefs.get('collegeHours', 6)}h.
        - Today's Classes: {json.dumps(today_classes)}
        - Pending Tasks: {json.dumps(tasks)}
        - Core Focus Areas (from Syllabus): {json.dumps(syllabus_data)}

        The plan MUST:
        1. STRECTLY AVOID scheduling any study sessions during the times listed in "Today's Classes". These are blocked academic hours.
        2. Only use the remaining available {free_hours} free hours for study tasks.
        3. Suggest specific time slots (e.g., 04:00 PM - 05:00 PM) for each activity.
        4. Prioritize urgent tasks and the focus areas from the syllabus.
        5. Include short breaks between sessions.
        
        Return the response as a valid JSON object matching this structure:
        {{
          "summary": "Full sentence summary...",
          "dailySchedule": [
            {{"time": "HH:MM AM/PM", "activity": "Specific task/topic session"}}
          ]
        }}"""
        
        response = model.generate_content(prompt)
        text = response.text
        
        # Robust JSON extraction
        start = text.find('{')
        end = text.rfind('}') + 1
        if start == -1 or end == 0:
            return {"summary": "AI was unable to generate a valid plan.", "dailySchedule": []}
            
        json_match = json.loads(text[start:end])
        
        # Ensure dailySchedule is present
        if "dailySchedule" not in json_match or not isinstance(json_match["dailySchedule"], list):
            json_match["dailySchedule"] = []
            
        return json_match
    except Exception as e:
        print(f"ERROR in /generate-plan: {str(e)}")
        traceback.print_exc()
        return {"summary": "An error occurred while generating your plan.", "dailySchedule": []}

@app.post("/topic-suggestion")
async def topic_suggestion(request: TopicSuggestionRequest):
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        prompt = f"""I am studying "{request.topic}" for my "{request.courseName}" course. 
        Can you give me a very concise (2-3 sentences) study strategy or trick to master this specific topic? 
        Make it encouraging and practical."""
        
        response = model.generate_content(prompt)
        return {"suggestion": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/urgent-nudge")
async def urgent_nudge(request: dict):
    try:
        tasks = request.get('tasks', [])
        if not tasks:
            return {"nudge": None}
            
        model = genai.GenerativeModel(MODEL_NAME)
        tasks_summary = ", ".join([f"{t.get('title')} (Due: {t.get('dueDate')})" for t in tasks])
        
        prompt = f"""Act as a witty, supportive academic mentor. 
        User has these pending tasks: {tasks_summary}
        
        Provide ONE very short, catchy motivational "nudge" (under 15 words).
        Focus on the most urgent or important task. 
        Be human, not robotic. 
        Examples: "That Physics lab won't write itself—tackle it now for a stress-free evening!" or "CS assignment is looming, 30 mins of focus starts now!" """
        
        response = model.generate_content(prompt)
        return {"nudge": response.text.strip()}
    except Exception as e:
        print(f"ERROR in /urgent-nudge: {str(e)}")
        return {"nudge": "Keep going, you're doing great!"}
@app.post("/parse-timetable")
async def parse_timetable(file: UploadFile = File(...)):
    try:
        content = await file.read()
        mime_type = file.content_type
        
        model = genai.GenerativeModel(MODEL_NAME)
        prompt = """Act as a document analyzer. Extract all class schedules from the uploaded timetable image or PDF.
        For each class, identify:
        - courseName: The name of the subject or course.
        - dayOfWeek: 0 for Monday, 1 for Tuesday, 2 for Wednesday, 3 for Thursday, 4 for Friday, 5 for Saturday, 6 for Sunday.
        - startTime: HH:MM (24-hour format).
        - endTime: HH:MM (24-hour format).

        Return ONLY a PURE JSON ARRAY of objects.
        Example: [{"courseName": "Math", "dayOfWeek": 0, "startTime": "09:00", "endTime": "10:30"}]"""
        
        response = model.generate_content([
            prompt,
            {"mime_type": mime_type, "data": content}
        ])
        
        text = response.text
        # Robust JSON extraction
        start = text.find('[')
        end = text.rfind(']') + 1
        if start == -1 or end == 0:
            return []
            
        json_match = json.loads(text[start:end])
        return json_match
    except Exception as e:
        print(f"ERROR in /parse-timetable: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/timetable-insights")
async def timetable_insights(request: dict):
    try:
        events = request.get('events', [])
        if not events:
            return {"insights": "No classes detected yet. Upload your timetable to get personalized insights!"}
            
        model = genai.GenerativeModel(MODEL_NAME)
        
        # Format events for AI readability
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        schedule_lines = []
        for day_idx in range(7):
            day_events = [e for e in events if int(e.get('dayOfWeek', -1)) == day_idx]
            if day_events:
                events_str = ", ".join([f"{e.get('courseName')} ({e.get('startTime')}-{e.get('endTime')})" for e in day_events])
                schedule_lines.append(f"{days[day_idx]}: {events_str}")

        schedule_str = "\n".join(schedule_lines)

        prompt = f"""Act as a productivity and time-management expert. 
        Analyze this weekly college schedule:
        {schedule_str}
        
        Provide 3-4 highly specific "Smart Study Gaps" or "Weekly Rhythm Tips".
        Example: "Your Tuesday morning is completely free until 11 AM—this is your 'Deep Work Zone' for complex subjects."
        
        Keep it concise, encouraging, and humanized. Use bullet points."""
        
        response = model.generate_content(prompt)
        return {"insights": response.text}
    except Exception as e:
        print(f"ERROR in /timetable-insights: {str(e)}")
        traceback.print_exc()
        return {"insights": "AI is momentarily resting. Please try again in a few minutes."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
