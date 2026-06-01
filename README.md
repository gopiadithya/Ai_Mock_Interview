<div align="center">
  <img src="https://img.shields.io/badge/Status-Hackathon_Submission-blue" alt="Hackathon Submission" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</div>

<h1 align="center">Hack2Hire: Nova AI Mock Interview Platform 🚀</h1>

<p align="center">
  An advanced, state-based AI Mock Interview Platform that dynamically adapts to a candidate's resume and job description to provide a realistic, high-pressure FAANG-style interview experience.
</p>

## 🎥 Live Demo / Screen Recording

> **Hackathon Evaluators:** Watch the live demonstration of the platform in action below.

[👉 **Click here to watch the Screen Recording Demo**](#) *(Add your Unstop/YouTube video link here!)*

---

## 🧠 The Problem
Traditional mock interviews are manual, subjective, and fail to measure a candidate's performance under strict time constraints. Candidates often fail real interviews not because they lack technical skills, but because they lack structured interview preparedness and the ability to adapt to varying difficulty levels.

## 💡 Our Solution: Nova AI
We built **Nova**, an autonomous AI interviewer that doesn't just ask questions—it **thinks, adapts, evaluates, and decides**. 

Nova perfectly simulates real-world interviews by enforcing strict state machines, applying real-time difficulty scaling, punishing poor time management, and validating candidate resumes against specific job descriptions before the interview even starts.

---

## ✨ Key Features & Capabilities

### 1. Hybrid Resume Document Validation
Protecting the AI from hallucination. Nova utilizes a custom Hybrid Validation Pipeline:
- **Rule-Based Pre-Scanner:** Instantly penalizes empty PDFs, generic course certificates, or awards using regex and negative keywords.
- **AI Skepticism Layer:** If the document is ambiguous, it is passed to a strict Llama-3-8B validation prompt that aggressively filters out non-resume documents before allowing the user into the interview room.

### 2. Adaptive Difficulty & State Tracking
Nova tracks the interview through 4 dynamic stages (Introduction -> Past Experience -> Core Technical -> Scenario Architecture).
- **Adaptive Difficulty:** Tracks performance internally from Level 1 to 5. If the candidate answers well, the difficulty dynamically scales up. If they struggle, it stabilizes.

### 3. Strict Time Constraints & Penalties
- **Real-time 90-Second Countdown:** A visual UI countdown strictly enforces time management. If a candidate speaks for more than 90 seconds, their microphone is forcibly cut off and their incomplete answer is auto-submitted.
- **Penalty Application:** The final evaluation severely penalizes candidates who consistently exceed 90 seconds per answer.

### 4. Early Interview Termination
Nova doesn't waste time. The system will forcefully end the interview early if:
- The candidate fails 3 consecutive questions (Score < 40).
- The candidate performs exceptionally well early on (Avg Score > 90 across 6 questions).
- The hard time limit (20 minutes) is reached.

### 5. Multi-Axis Objective Scoring & SHAP
The Executive Dashboard generates a final **Readiness Score (0-100)** calculated across 5 objective axes:
1. Accuracy
2. Clarity
3. Depth
4. Relevance
5. Time Management

It also features a **SHAP Feature Impact chart** visualizing exactly which axes positively or negatively impacted the candidate's final Readiness Score.

---

## 🛠 Tech Stack

**Frontend:**
- React (Vite)
- Tailwind & Vanilla CSS (Glassmorphism UI)
- Chart.js & React-Chartjs-2 (Radar Charts)
- Web Speech API (Real-time STT / TTS Voice interactions)

**Backend:**
- Node.js & Express
- Firebase Firestore (State & Conversation persistence)
- Groq Cloud API (Llama-3-8B-Instant for ultra-low latency inference)
- PDF-Parse & Mammoth (Document Extraction)
- Transformers.js (Local ML Cosine Similarity matching)

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)
- A Groq Cloud API Key
- Firebase Service Account JSON

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/hack2hire-nova.git
   cd hack2hire-nova
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file and add your GROQ_API_KEY=your_key
   # Add your firebase-service-account.json to the backend root
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open in Browser:** Navigate to `http://localhost:5173`

---

## 🤝 Team
- Built with ❤️ for the **Hack2Hire AI-Powered Interview Hackathon**
