<div align="center">
  <img src="https://img.shields.io/badge/Status-Hackathon_Submission-blue" alt="Hackathon Submission" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</div>

<h1 align="center">Nova AI: Next-Generation Mock Interview Platform 🚀</h1>

<p align="center">
  An advanced, state-based AI Mock Interview Platform that dynamically adapts to a candidate's resume and job description, extracts their real projects, and conducts a natural, time-bounded conversational technical evaluation.
</p>

---

## 🎥 Video Demonstration (Google Drive)

> 🔬 **Hackathon Evaluators:** Click the link below to watch the comprehensive screen-recorded walkthrough of our platform, highlighting our technical architecture, user flows, and real-time AI mock interview progression.

👉 **[WATCH THE GOOGLE DRIVE VIDEO DEMONSTRATION HERE](https://drive.google.com/file/d/1Ub2wwk6c9EHaWp-6syYGSL7yA6CMC4T5/view?usp=sharing)** 🎬

---

## 🧠 The Problem
Traditional technical mock interviews are manual, expensive, and fail to measure a candidate's conversational and architectural performance under strict, real-world time constraints. Candidates often struggle during live interviews not because they lack technical capabilities, but because they are unprepared for FAANG-level conversational schedules, project-specific grilling, and time management pressures.

## 💡 Our Solution: Nova AI
We built **Nova AI**, an autonomous, highly conversational technical interviewer that doesn't just read questions—it **evaluates, adapts, reacts, and grills** candidates like an elite senior engineer. 

Nova replicates the exact pressure of a real interview by enforcing a strict **15-minute time budget**, extracting the candidate's actual projects from their resume, running a real-time difficulty scaling algorithm, and grading their final readiness across five core software engineering dimensions.

---

## ⚙️ How It Works (System Workflow)
Nova AI is engineered as an end-to-end, high-fidelity conversational simulation pipeline:
1. **Document Upload & Extraction:** Candidates drag-and-drop their PDF/DOCX resume. Advanced parsers (`pdf-parse` and `mammoth`) extract the raw structured text on our Node.js backend.
2. **Hybrid Validation pre-Scanner:** The text is run through a strict pre-scanning module that evaluates section scoring (Education, Skills, Experience), looks for contact info, and applies negative keyword filters. Ambiguous uploads fall back to an LLM validation prompt to aggressively filter out Certificates, problem statements, or blank files.
3. **Dynamic Project & Skill Extraction:** If valid, Nova's Llama-3.1 model parses the document in real-time to extract Matched Skills (present in both resume and Job Description), Missing Skills (required by JD but missing), and all **Key Projects** listed in their resume.
4. **Adaptive Voice Simulation & Code Editor:** Candidates enter the Interview Room, featuring a pulsing animated Voice Aura and custom borderless floating subtitles. Subtitles and audio are parsed to be completely free of markdown tags or double dashes (`--`). The candidate progresses through 5 strict, time-boxed stages matching a FAANG timeline, with the option to manually open the integrated Monaco Code Editor to type and submit coding tasks when they are ready.
5. **Multi-Dimensional Analytics:** Upon completion, the backend compiles scores across 5 axes (Accuracy, Clarity, Depth, Relevance, and Time Management) to output a final Readiness Score out of 50, alongside strengths and weaknesses.

---

## ⚡ What Makes Nova AI Different (Platform Uniqueness)
Most mock interview platforms are either manual or built as simple question-generation templates. Nova AI is fundamentally different across four core engineering pillars:

| Capability | Existing AI Mock Platforms | Nova AI Mock Interview 🚀 |
| :--- | :--- | :--- |
| **Question Relevance** | Ask generic, pre-canned technical questions from a static dataset. | **Hyper-Personalized Project Grilling:** Nova actively reads the projects extracted from the candidate's resume and asks deep, architectural questions specifically about their own database and implementation choices. |
| **Conversational Tone** | Outputs raw text, markdown blocks (like ````json````), horizontal rules (`---`), and sounds like a rigid robot. | **Elitely Human-Like:** Implements an aggressive backend and frontend text parser that strips formatting to deliver natural, warm, and highly empathetic human-to-human speech that reacts directly to previous answers. |
| **Pacing & Progression** | Simple random lists of questions with no concept of stage timing or structured progression. | **Strict 5-Stage Timeline:** Dynamically tracks the interview across a strict 15-minute schedule (Introduction -> Resume Grilling -> Technical Monaco Coding -> Scenario Design -> Behavioral soft skills). |
| **Code Editor Usability** | Clunky auto-popups that disrupt the conversational flow and force-open coding fields. | **Manual Monaco Control:** The live Monaco editor is under the absolute, manual control of the candidate, opening and closing exactly when the user clicks the toggle button, mirroring real interview environments (CoderPad). |
| **Evaluation Accuracy** | Simple right-or-wrong grading that ignores speed, clarity, or length. | **Time-Weighted 5-Axis Metrics:** Evaluates time management, severely penalizing wordy, long-winded answers and actively rewarding concise, sharp engineering responses. |

---

## ✨ Core Hackathon-Winning Features

### 1. 📂 Real-Time Resume Projects Extraction
Nova AI doesn't ask generic, pre-canned questions. When a candidate uploads their CV, our backend dynamically parses and extracts their **actual listed projects** using advanced PDF and Word text parsers. These projects are displayed as premium blue tags on the setup dashboard, and the AI actively designs deep, highly customized questions specifically targeting the candidate's own architectural and database implementation!

### 2. 📅 Strict 15-Minute, 5-Stage FAANG Interview Timeline
The interview runs on a strict **15-minute overall limit** (900 seconds) and automatically structures questions into a standard, natural time-boxed questioning progression:
1. **Introduction [Target: 1.5 Min] (Questions 1-2):** A warm greeting and background introduction.
2. **Resume Questions [Target: 2.5 Min] (Questions 3-4):** Contextual grilling based on their dynamically extracted projects.
3. **Technical Questions [Target: 6.0 Min] (Questions 5-7):** Deep coding and data structures challenges.
4. **Scenario Questions [Target: 3.0 Min] (Questions 8-9):** System design and scalable database architecture scenarios.
5. **Behavioral Questions [Target: 1.5 Min] (Question 10):** SOFT skills and leadership evaluations.
6. **Feedback Generation [Target: 0.5 Min]:** Concluding comprehensive report compiles.

### 3. 🎙️ Natural Human-to-Human Conversational Flow
- **Sanitized Speech Buffer:** We engineered an aggressive backend text parser that strips away markdown backticks (````json````), horizontal rules (`---`), and symbols. Nova speaks naturally and conversationally, completely avoiding robotic indicators.
- **Borderless Captions:** The text display container has been made fully borderless and transparent, letting Nova's spoken subtitles float cleanly on top of the interactive animated aura visualization.
- **Zero-Lag Subtitles:** The progressive subtitles load immediately upon speech initialization, ensuring 100% voice-to-caption synchronization across all operating systems.

### 4. 💻 Full-Control Integrated Monaco Code Editor
Candidates have a fully integrated, live Monaco Code Editor in their browser. Open and close triggers are **100% manually controlled** by the user via a smooth round button toggle at the bottom of the screen—ensuring candidates write and compile their coding functions when they are ready.

### 5. 🛡️ Strict Hybrid Document Validation
Protects the AI from hallucination by filtering out certificate files, problem statements, or blank pages before letting candidates into the interview room:
- **Rule-Based Pre-Scanner:** Instantly scores and penalizes documents based on core CV sections (Education, Skills, Experience) and contact information, applying negative scoring to certification keywords.
- **AI Skepticism Layer:** Fallback-validates ambiguous documents through our Groq Llama-3.1 model to guarantee 100% data integrity.

### 6. 📊 Multi-Axis Radar Scoring & Analytics
Generates a comprehensive final evaluation report covering 5 objective dimensions graded out of 10:
1. **Accuracy**
2. **Clarity**
3. **Depth**
4. **Relevance**
5. **Time Management** (which actively penalizes long-winded answers and rewards conciseness).
Includes a Radar Chart visualization, final **Readiness Score out of 50**, and actionable strengths and weaknesses.

---

## 🛠 Tech Stack

**Frontend:**
- React (Vite)
- Tailwind & Vanilla CSS (Futuristic Glassmorphic Theme)
- Chart.js & Radar Charts (Visualization)
- Web Speech API (Low-latency real-time TTS/STT voice synthesis)
- Monaco Editor (Live Code Editing)

**Backend:**
- Node.js & Express
- Firebase Admin SDK (Google & Email Sign-In with email verification gates)
- Firebase Firestore (Conversation state, metrics, and document persistence)
- Groq Cloud API (Llama-3.1-8B-Instant for ultra-low latency, sub-second inference)
- PDF-Parse & Mammoth (High-fidelity resume document text extraction)

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)
- A Groq Cloud API Key
- Firebase Service Account Credentials JSON

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gopiadithya/Ai_Mock_Interview.git
   cd Ai_Mock_Interview
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file and specify:
   # PORT=5000
   # GROQ_API_KEY=your_groq_key
   # Place your firebase-service-account.json inside the backend root folder
   npm start
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   # Create a .env file and specify:
   # VITE_API_URL=http://localhost:5000
   npm run dev
   ```

4. **Open in Browser:** Navigate to `http://localhost:5173`

---

## 🤝 Team
- Built with ❤️ for the **Hack2Hire AI-Powered Interview Hackathon**
