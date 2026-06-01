# 🚀 Nova AI — Intelligent Mock Interview Platform

<p align="center">
  <strong>AI-powered mock interviews tailored to your resume, projects, and target job role.</strong>
</p>

<p align="center">
  Nova AI simulates realistic technical interviews using conversational AI, adaptive questioning, resume analysis, and performance analytics to help candidates prepare for real-world software engineering interviews.
</p>

---

## 🎥 Demo

### Live Platform Walkthrough

Watch the complete demonstration showcasing:

* Resume-based interview generation
* Real-time voice interaction
* Adaptive question difficulty
* Coding assessment workflow
* AI-generated performance reports

**Live Platform:** [https://ai-mock-interview-pi-five.vercel.app/](https://ai-mock-interview-pi-five.vercel.app/)

**Demo Video:** [https://drive.google.com/file/d/1Ub2wwk6c9EHaWp-6syYGSL7yA6CMC4T5/view](https://drive.google.com/file/d/1Ub2wwk6c9EHaWp-6syYGSL7yA6CMC4T5/view)

---

# 📌 Overview

Technical interviews often fail to reflect real-world interview pressure, conversational depth, and project-specific discussions.

Nova AI addresses this challenge by conducting personalized mock interviews that:

* Analyze candidate resumes
* Extract real project experience
* Generate contextual technical questions
* Evaluate communication and technical depth
* Deliver actionable performance feedback

The platform behaves like an experienced interviewer rather than a static question generator.

---

# ✨ Key Features

## 📄 Resume-Aware Interview Generation

Nova AI automatically parses uploaded resumes and identifies:

* Projects
* Skills
* Experience
* Technical stack

The interview dynamically adapts to the candidate's background instead of relying on generic question banks.

---

## ⏱ Structured Interview Flow

Each interview follows a carefully designed timeline that mirrors real technical interviews.

| Stage                | Focus Area                      | Duration |
| -------------------- | ------------------------------- | -------- |
| Introduction         | Background & Icebreaker         | 1.5 min  |
| Resume Discussion    | Project Deep Dive               | 2.5 min  |
| Technical Assessment | DSA & Core Concepts             | 6 min    |
| Scenario Round       | System Design & Problem Solving | 3 min    |
| Behavioral Round     | Leadership & Communication      | 1.5 min  |
| Feedback Generation  | Final Evaluation                | 30 sec   |

Total Interview Duration: **15 Minutes**

---

## 🎙 Real-Time Voice Interaction

Features include:

* Speech-to-Text transcription
* Text-to-Speech responses
* Live subtitles
* Natural conversational flow
* Low-latency AI responses

The experience closely resembles a real human interviewer.

---

## 💻 Integrated Coding Environment

Built-in Monaco Editor provides:

* Real-time coding support
* Manual editor controls
* Interview-friendly coding workspace
* Seamless transition between discussion and implementation

---

## 🛡 Resume Validation Pipeline

To ensure document quality, Nova AI performs:

### Rule-Based Validation

Checks for:

* Education
* Skills
* Experience
* Contact Information

### AI Validation Layer

Uses LLM-based verification to distinguish genuine resumes from:

* Certificates
* Blank documents
* Irrelevant files
* Non-resume submissions

---

## 📊 AI Performance Analytics

After every interview, Nova AI generates a detailed report covering:

### Evaluation Metrics

* Accuracy
* Clarity
* Technical Depth
* Relevance
* Time Management

### Deliverables

* Radar Chart Visualization
* Readiness Score
* Strength Analysis
* Improvement Suggestions
* Personalized Feedback

---

# 🏗 Architecture

```text
Resume Upload
      │
      ▼
Document Parsing
(PDF / DOCX)
      │
      ▼
Project & Skill Extraction
      │
      ▼
Adaptive Interview Engine
      │
      ▼
Voice Interaction Layer
      │
      ▼
Response Evaluation
      │
      ▼
Performance Analytics
```

---

# 🛠 Tech Stack

## Frontend

* React (Vite)
* Tailwind CSS
* Chart.js
* Monaco Editor
* Web Speech API

## Backend

* Node.js
* Express.js
* Firebase Admin SDK
* Firebase Firestore
* Groq API (Llama 3.1)
* PDF-Parse
* Mammoth

## Authentication

* Google Sign-In
* Email Authentication
* Email Verification

---

# 🚀 Getting Started

## Prerequisites

* Node.js v18+
* Firebase Project
* Groq API Key

---

## Clone Repository

```bash
git clone https://github.com/gopiadithya/Ai_Mock_Interview.git

cd Ai_Mock_Interview
```

---

## Backend Setup

```bash
cd backend

npm install
```

Create a `.env` file:

```env
PORT=5000

GROQ_API_KEY=your_groq_api_key
```

Add:

```text
firebase-service-account.json
```

to the backend root directory.

Start the server:

```bash
npm start
```

---

## Frontend Setup

```bash
cd frontend

npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

Run:

```bash
npm run dev
```

---

## Access Application

Open:

```text
http://localhost:5173
```

---

# 🎯 Future Enhancements

* Multi-language interview support
* Video interview analysis
* AI-powered coding evaluation
* Company-specific interview tracks
* Interview replay and coaching
* Team hiring dashboards

---

# 🤝 Team

Built for the **Hack2Hire AI-Powered Interview Hackathon**.

---

## ⭐ Why Nova AI?

Nova AI goes beyond traditional mock interview platforms by combining:

✅ Resume Intelligence
✅ Adaptive Questioning
✅ Voice-Based Conversations
✅ Technical Evaluation
✅ Real-Time Analytics

to create an interview experience that closely mirrors modern software engineering interviews.

---
