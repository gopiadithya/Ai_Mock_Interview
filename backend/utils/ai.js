const { OpenAI } = require('openai');

let openai = null;
if (process.env.GROQ_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

// ---------------- MOCK FALLBACKS ----------------
const getMockNextInteraction = (messages) => {
  const userMessagesCount = messages.filter(m => m.role === 'user').length;
  
  let question = "That makes sense. Could you elaborate more on your previous experience with those technologies?";
  let isCodeRequired = false;
  let isInterviewEnded = false;

  if (userMessagesCount === 0) {
    question = "Welcome to the interview! Could you start by briefly introducing yourself?";
  } else if (userMessagesCount === 1) {
    question = "That's an interesting approach. Could you write a quick function to demonstrate that?";
    isCodeRequired = true;
  } else if (userMessagesCount === 2) {
    question = "Excellent. Let's talk about performance. How would you optimize that code?";
  } else if (userMessagesCount >= 4) {
    question = "Thank you for your time today. That concludes our technical interview!";
    isInterviewEnded = true;
  }
  
  return JSON.stringify({
    evaluation: "Good response.",
    question,
    difficulty: 2,
    score: 75,
    isCodeRequired,
    isInterviewEnded
  });
};

const getMockEvaluation = () => {
  return {
    scores: { accuracy: 8.5, clarity: 8.0, depth: 7.5, relevance: 9.0, timeManagement: 8.8, finalReadiness: 41.8 },
    feedback: "Solid foundation, but needs more depth.",
    strengths: ["Clear communication"],
    weaknesses: ["Lacks depth"]
  };
};

const analyzeProfile = async (resume, jd) => {
  const fallback = {
    matchedSkills: ["JavaScript", "React", "Node.js"],
    missingSkills: ["System Design", "Cloud"],
    matchPercentage: 65,
    skills: ["JavaScript", "React", "Node.js"],
    projects: [
      "E-Commerce Platform: Built using React and Node.js with payment gateway integration.",
      "Weather Dashboard: Developed a real-time weather tracking application."
    ]
  };
  
  if (!openai) {
    return fallback;
  }

  try {
    const prompt = `Analyze the following resume and job description.

CRITICAL RULES:
1. Skills Extraction: You MUST ONLY extract skills that are EXPLICITLY MENTIONED in the Resume. Do not guess or extrapolate.
2. Projects Extraction: You MUST extract all projects listed in the resume. Look under headings like "Projects", "Academic Projects", "Personal Projects", "Key Experience", "Work Experience", "Portfolio", etc. If there is a section about projects, extract EACH project name and a brief 1-sentence description (if available). Do not return an empty array if projects exist in the resume text!
3. Format output as a STRICTLY VALID JSON object with this exact schema:
{
  "matchedSkills": ["array of skills present in BOTH the resume and JD"],
  "missingSkills": ["array of skills required by JD but MISSING from resume"],
  "skills": ["array of ALL technical and soft skills actually found in the resume"],
  "projects": ["array of projects found in the resume (e.g. 'Project Title: Description of the project'). If no projects are found at all, return an empty array."],
  "matchPercentage": 75
}

Resume:\n${resume}\n\nJD:\n${jd}`;

    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    let cleanedResponse = response.choices[0].message.content.trim();
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedResponse = cleanedResponse.slice(firstBrace, lastBrace + 1);
    }
    
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("AI Error:", error);
    return fallback;
  }
};

// ---------------- RESUME VALIDATION ----------------
const validateResumeDocument = async (text) => {
  if (!openai) {
    return { isResume: true, confidence: 100, reason: "Mock fallback: Assumed valid" };
  }

  try {
    const prompt = `Analyze the following document text and strictly determine if it is a professional resume or curriculum vitae (CV).
CRITICAL RULES:
1. A valid resume MUST contain professional experience, education, or a list of technical skills.
2. If the document is a course certificate, an award, a diploma, a blank page, or a generic letter, you MUST return isResume: false.
3. Be extremely skeptical. If you are not 100% sure it is a resume, return isResume: false.

Return a STRICTLY VALID JSON object with this exact schema:
{
  "isResume": true/false,
  "confidence": 0-100,
  "reason": "short explanation"
}

Document Text:
${text.slice(0, 3000)}`;

    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content.trim());
  } catch (error) {
    console.error("AI Validation Error:", error);
    // If AI fails, err on the side of caution or allow it? We'll allow it with a warning.
    return { isResume: true, confidence: 85, reason: "AI API Error, bypassed validation." };
  }
};

// ---------------- NEXT INTERACTION (Dynamic Feedback + Question) ----------------
const generateNextInteraction = async (context, messages, currentDifficulty) => {
  if (!openai) {
    console.error("OpenAI (Groq) is NULL! Using mock fallback. GROQ_API_KEY is:", process.env.GROQ_API_KEY ? "Set" : "Not Set");
    return getMockNextInteraction(messages);
  }

  try {
    const systemPrompt = `You are Nova, an expert AI technical interviewer at a top-tier FAANG company.
Candidate Skills: ${context.skills ? context.skills.join(", ") : "Not specified"}
Candidate Projects: ${context.projects && context.projects.length > 0 ? context.projects.join(" | ") : "No direct projects listed"}
Target Job Role / Description: ${context.jobDescription || 'Software Engineer'}
Current Interview Stage: ${context.currentStage || 'General'}
Question Number: ${context.nextQuestionNumber || 1}
Current Difficulty: ${currentDifficulty}/5
Force Termination Flag: ${context.forceTerminationFlag === true ? 'TRUE (MUST END INTERVIEW)' : 'FALSE'}

HUMAN-TO-HUMAN INTERACTION CONSTRAINTS:
1. Act EXACTLY like an elite, friendly, yet highly critical human senior engineer. Avoid robotic transitions, placeholders, or formulaic statements.
2. React deeply and specifically to the candidate's last answer in your "evaluation" (e.g., if they explained virtual DOM, say: "Nice breakdown of how the reconciliation process avoids costly layout reflows..."). Be conversational and warm but maintain high standards.
3. Keep your total response (evaluation + question) concise: 2-3 natural sentences. Do not write long blocks of text.
4. Stage Rule (MUST FOLLOW THE STAGE TIMELINE):
   - "Introduction": Welcome them warmly, introduce yourself, and ask them to introduce themselves.
   - "Resume Questions": Look at the "Candidate Projects" and "Candidate Skills" listed above. Ask a specific, deep question about one of their exact listed projects or experience. (E.g. "I see you built the E-commerce Platform; how did you handle state sync across microservices?").
   - "Technical Questions": Ask specific technical questions on coding, data structures, or performance optimization.
   - "Scenario Questions": Present a realistic high-level system design or architectural scenario relevant to their skills.
   - "Behavioral Questions": Ask a classic behavioral question (team conflicts, deadlines, learning from failure).
5. Score Rule: You MUST output a "score" from 0 to 100 representing how well the candidate answered the last question (0 = completely wrong, 100 = perfect).
6. Ask EXACTLY ONE question at a time. Never ask multiple questions in a single turn.
7. If the candidate asks you to repeat or clarify the question, explain it naturally without changing the topic or moving to the next stage.
8. CODE EDITOR RULE: ONLY set "isCodeRequired" to true if you explicitly command the candidate to write code.
9. If the "Force Termination Flag" is TRUE, politely conclude the interview and set "isInterviewEnded" to true.
10. Do NOT use markdown formatting (no bold, italics, etc) in your evaluation or question text.

Return your response as a STRICTLY VALID JSON object matching this exact schema:
{
  "evaluation": "natural conversational human feedback on their last answer",
  "question": "your next specific question aligned with the current stage",
  "difficulty": number,
  "score": number,
  "isCodeRequired": boolean,
  "isInterviewEnded": boolean
}`;

    const groqMessages = [
      { role: "system", content: systemPrompt }
    ];

    for (const m of messages) {
      let content = m.content;
      if (m.codeSnippet) content += `\n[Candidate wrote code]:\n${m.codeSnippet}`;
      groqMessages.push({ role: m.role, content });
    }

    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: groqMessages,
      response_format: { type: "json_object" }
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("AI Error generating interaction:", error);
    return getMockNextInteraction(messages);
  }
};

// ---------------- FINAL EVALUATION ----------------
const evaluateFinalInterview = async (interview) => {
  if (!openai) return getMockEvaluation();

  try {
    const transcript = interview.messages.map(m => {
      let content = m.role.toUpperCase() + ': ' + m.content;
      if (m.codeSnippet) content += `\n[Code]:\n${m.codeSnippet}`;
      if (m.duration) content += `\n[Response Duration: ${Math.round(m.duration)} seconds]`;
      return content;
    }).join("\n\n");

    const prompt = `Evaluate the interview transcript. Score from 0-10: accuracy, clarity, depth, relevance, timeManagement. Calculate finalReadiness = sum of all 5 scores (out of 50).
CRITICAL TIME MANAGEMENT RULE: For the timeManagement score, severely penalize answers that took longer than 90 seconds. Reward concise answers under 60 seconds.
Return ONLY valid JSON:
{
  "scores": { "accuracy": 0, "clarity": 0, "depth": 0, "relevance": 0, "timeManagement": 0, "finalReadiness": 0 },
  "feedback": "string",
  "strengths": ["string"],
  "weaknesses": ["string"]
}
Transcript:\n${transcript}`;

    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }]
    });

    const text = response.choices[0].message.content;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return getMockEvaluation();
  } catch (error) {
    console.error("AI Error:", error);
    return getMockEvaluation();
  }
};

module.exports = {
  analyzeProfile,
  generateNextInteraction,
  evaluateFinalInterview,
  validateResumeDocument
};