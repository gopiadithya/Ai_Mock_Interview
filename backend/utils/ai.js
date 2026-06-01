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

// ---------------- ML PIPELINE ----------------
let extractor = null;
async function getExtractor() {
  if (extractor) return extractor;
  // Dynamically import to support CommonJS environment
  const { pipeline } = await import('@xenova/transformers');
  extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  return extractor;
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0, normA = 0.0, normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ---------------- PROFILE ANALYSIS ----------------
const analyzeProfile = async (resume, jd) => {
  const fallback = {
    matchedSkills: ["JavaScript", "React", "Node.js"],
    missingSkills: ["System Design", "Cloud"],
    matchPercentage: 65,
    skills: ["JavaScript", "React", "Node.js"]
  };
  
  try {
    // 1. Calculate Real Cosine Similarity Match using HuggingFace Model
    let matchPercentage = 50;
    try {
      const getExtractorModel = await getExtractor();
      // Ensure strings aren't too massive for the model context
      const resumeSlice = resume.slice(0, 1500); 
      const jdSlice = jd.slice(0, 1500);
      
      const out1 = await getExtractorModel(resumeSlice, { pooling: 'mean', normalize: true });
      const out2 = await getExtractorModel(jdSlice, { pooling: 'mean', normalize: true });
      
      const vec1 = Array.from(out1.data);
      const vec2 = Array.from(out2.data);
      
      let similarity = cosineSimilarity(vec1, vec2);
      matchPercentage = Math.round(Math.max(0, similarity) * 100);
      console.log(`[ML] Calculated Match Percentage: ${matchPercentage}%`);
    } catch (mlErr) {
      console.error("Transformers.js Error:", mlErr);
    }

    if (!openai) {
      fallback.matchPercentage = matchPercentage;
      return fallback;
    }

    // 2. Extract Exact Skills using LLM
    const prompt = `Analyze the following resume and job description.
CRITICAL RULE: You MUST ONLY extract skills that are EXPLICITLY MENTIONED in the Resume. Do not guess skills.
Compare those exact resume skills against the JD requirements.

Return a STRICTLY VALID JSON object with this exact schema:
{
  "matchedSkills": ["array of skills present in BOTH the resume and JD"],
  "missingSkills": ["array of skills required by JD but MISSING from resume"],
  "skills": ["array of ALL technical and soft skills actually found in the resume"]
}
Resume:\n${resume}\n\nJD:\n${jd}`;

    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    const parsed = JSON.parse(response.choices[0].message.content.trim());
    parsed.matchPercentage = matchPercentage; // Inject true ML score
    return parsed;
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
Candidate Skills: ${context.skills.join(", ")}
Target Job Role / Description: ${context.jobDescription || 'Software Engineer'}
Current Interview Stage: ${context.currentStage || 'General'}
Question Number: ${context.nextQuestionNumber || 1}
Current Difficulty: ${currentDifficulty}/5
Force Termination Flag: ${context.forceTerminationFlag === true ? 'TRUE (MUST END INTERVIEW)' : 'FALSE'}

Rules:
1. You MUST separate your response into two distinct parts: an evaluation and a question.
2. Be EXTREMELY concise. Your entire response (evaluation + question) MUST NOT exceed 2-3 short sentences. Act like a sharp, direct FAANG Senior Engineer.
3. The evaluation should dynamically and briefly respond to the candidate's last answer. If they gave code, review it instantly. CRITICAL RULE: NEVER mention the words "difficulty", "level", or "evaluate" in your spoken text.
4. Stage Rule: Your question MUST align with the "Current Interview Stage". For example, if the stage is "Scenario-Based Architecture", ask a system design question. If it is "Behavioral & Culture Fit", ask about teamwork/conflict.
5. Score Rule: You MUST output a "score" from 0 to 100 representing how well the candidate answered the last question (0 = completely wrong, 100 = perfect).
6. CRITICAL RULE: Ask EXACTLY ONE question at a time. Never ask multiple questions in a single response.
7. If the candidate asks you to repeat or explain the question, clarify and rephrase the SAME question. Do NOT move on to a new topic.
8. CODE EDITOR RULE: ONLY set "isCodeRequired" to true if you explicitly command the candidate to "write a function", "type out the code", or "code a solution". If you only ask them to "explain" or "design" verbally, set "isCodeRequired" to false!
9. You must implement ADAPTIVE DIFFICULTY. If they answered correctly, increase the difficulty score. If they struggled, decrease it. Keep this internal tracking hidden.
10. TERMINATION RULE: If the "Force Termination Flag" is TRUE above, you MUST set "isInterviewEnded" to true immediately and wrap up the interview politely.
11. Do NOT use markdown formatting (no bold, italics, etc) in your spoken text.
12. You MUST return your response as a strictly valid JSON object matching this exact schema:
{
  "evaluation": "string",
  "question": "string",
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