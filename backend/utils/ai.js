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
    const prompt = `You are a professional resume parsing engine. Analyze the following resume text and job description (JD).

CRITICAL EXTRACTION RULES:
1. Skills Extraction: Extract technical and soft skills that are EXPLICITLY listed in the resume. Do not extrapolate.
2. Projects Extraction: You MUST extract projects, personal projects, academic projects, or professional systems/applications built.
   - Scan under headings like: Projects, Experience, Employment, Achievements, Portfolio, Research, Open Source.
   - If a candidate describes building, developing, designing, or implementing a system (e.g., "Built a web app using Node.js..."), extract that as a project.
   - Format each project as a single clear string: "Project Name: Brief 1-sentence description including key tech used".
   - Return at least 1-3 projects if any engineering activities are mentioned. Do not leave the array empty.
3. Output format: You MUST return a strictly valid JSON object matching this exact schema (no trailing commas, no extra text):
{
  "matchedSkills": ["skills matching both resume and JD"],
  "missingSkills": ["skills in JD but missing in resume"],
  "skills": ["all skills in resume"],
  "projects": ["list of projects matching the format 'Name: Description'"],
  "matchPercentage": 75
}

Resume Text:
${resume}

Job Description:
${jd}`;

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
    
    const parsed = JSON.parse(cleanedResponse);

    // --- JSON HEALING AND NORMALIZATION ---
    const normalized = {};
    for (const key of Object.keys(parsed)) {
      normalized[key.toLowerCase()] = parsed[key];
    }

    const result = {
      matchedSkills: normalized.matchedskills || normalized.matched_skills || normalized.skills_matched || [],
      missingSkills: normalized.missingskills || normalized.missing_skills || normalized.skills_missing || [],
      skills: normalized.skills || normalized.allskills || normalized.all_skills || [],
      projects: normalized.projects || normalized.projectlist || normalized.personal_projects || normalized.academic_projects || normalized.portfolio || normalized.work_projects || [],
      matchPercentage: normalized.matchpercentage || normalized.match_percentage || normalized.percentage || 50
    };

    // Ensure matchPercentage is a valid number
    if (typeof result.matchPercentage === 'string') {
      result.matchPercentage = parseInt(result.matchPercentage.replace(/[^0-9]/g, ''), 10) || 50;
    }

    // Normalize projects to an array of strings
    if (result.projects && !Array.isArray(result.projects)) {
      if (typeof result.projects === 'string') {
        result.projects = [result.projects];
      } else if (typeof result.projects === 'object') {
        const tempProjects = [];
        for (const title of Object.keys(result.projects)) {
          const val = result.projects[title];
          if (typeof val === 'string') {
            tempProjects.push(`${title}: ${val}`);
          } else if (typeof val === 'object' && val !== null) {
            const desc = val.description || val.desc || val.details || JSON.stringify(val);
            tempProjects.push(`${title}: ${desc}`);
          } else {
            tempProjects.push(title);
          }
        }
        result.projects = tempProjects;
      } else {
        result.projects = [];
      }
    }

    // If projects is an array, but contains objects instead of strings
    if (Array.isArray(result.projects)) {
      result.projects = result.projects.map(item => {
        if (typeof item === 'string') {
          return item;
        } else if (typeof item === 'object' && item !== null) {
          const title = item.title || item.name || item.projectName || Object.keys(item)[0] || 'Project';
          const desc = item.description || item.desc || item.details || item[title] || '';
          return desc ? `${title}: ${desc}` : title;
        }
        return String(item);
      });
    } else {
      result.projects = [];
    }

    // Strip empty/null elements from arrays
    result.matchedSkills = Array.isArray(result.matchedSkills) ? result.matchedSkills.filter(Boolean) : [];
    result.missingSkills = Array.isArray(result.missingSkills) ? result.missingSkills.filter(Boolean) : [];
    result.skills = Array.isArray(result.skills) ? result.skills.filter(Boolean) : [];
    result.projects = Array.isArray(result.projects) ? result.projects.filter(Boolean) : [];

    // --- REGEX FALLBACK PARSER ---
    // If LLM returned 0 projects, let's look for projects in the resume text manually using a regex!
    if (result.projects.length === 0) {
      console.log("[analyzeProfile] LLM returned 0 projects. Running Regex Fallback Parser...");
      const projectRegex = /(?:projects|academic projects|personal projects|key projects|portfolio|technical projects)([\s\S]*?)(?=\n\s*(?:skills|experience|education|employment|work history|certifications|achievements|languages|activities|interests|hobbies|$))/i;
      const match = resume.match(projectRegex);
      if (match && match[1]) {
        const projectSection = match[1].trim();
        // Split section by bullets or newlines
        const lines = projectSection.split(/\n+/).map(l => l.trim()).filter(l => l.length > 15);
        const extracted = [];
        
        let currentProject = "";
        for (const line of lines) {
          if (/^[-*•\d.]/.test(line)) {
            if (currentProject) {
              extracted.push(currentProject);
            }
            currentProject = line.replace(/^[-*•\d.\s]+/, '').trim();
          } else {
            if (currentProject) {
              currentProject += " " + line;
            } else {
              currentProject = line;
            }
          }
          if (extracted.length >= 3) break;
        }
        if (currentProject) {
          extracted.push(currentProject);
        }

        if (extracted.length > 0) {
          result.projects = extracted.slice(0, 3).map(p => {
            const clean = p.replace(/\s+/g, ' ').trim();
            if (clean.includes(':')) return clean;
            const colonIdx = clean.search(/(?:\bbuilt\b|\bdeveloped\b|\bcreated\b|\bdesigned\b|\busing\b)/i);
            if (colonIdx > 5) {
              return `${clean.substring(0, colonIdx).trim()}: ${clean.substring(colonIdx).trim()}`;
            }
            return clean;
          });
          console.log("[analyzeProfile] Regex Fallback Parser successfully extracted projects:", result.projects);
        }
      }
    }

    // Secondary fallback: if still zero, parse bullet points from work history as project items
    if (result.projects.length === 0) {
      console.log("[analyzeProfile] Second-stage fallback: Scanning experience bullets for projects...");
      const bullets = resume.match(/[-*•]\s+([^\n]{30,})/g);
      if (bullets && bullets.length > 0) {
        result.projects = bullets.slice(0, 3).map(b => {
          const clean = b.replace(/^[-*•\s]+/, '').replace(/\s+/g, ' ').trim();
          if (clean.includes(':')) return clean;
          return `Engineering Task: ${clean}`;
        });
      }
    }

    return result;
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

STRICT 15-MINUTE INTERVIEW TIMELINE & QUESTION PROGRESSION ORDER:
1. Introduction [Target: 1.5 min] (Questions 1-2) — Warm greeting and background introduction.
2. Resume Questions [Target: 2.5 min] (Questions 3-4) — Deep architectural/engineering questions specific to the "Candidate Projects" listed above.
3. Technical Questions [Target: 6.0 min] (Questions 5-7) — Algorithmic coding tasks where you command code writing and set "isCodeRequired" to true.
4. Scenario Questions [Target: 3.0 min] (Questions 8-9) — System design and scalable database architecture questions.
5. Behavioral Questions [Target: 1.5 min] (Question 10) — Situational soft skills questions.
6. Feedback Generation [Target: 0.5 min] (End of interview) — Concluding report.

HUMAN-TO-HUMAN INTERACTION CONSTRAINTS:
1. Act EXACTLY like an elite, friendly, yet highly critical human senior engineer. Avoid robotic transitions, placeholders, or formulaic statements.
2. React deeply and specifically to the candidate's last answer in your "evaluation" (e.g., if they explained virtual DOM, say: "Nice breakdown of how the reconciliation process avoids costly layout reflows..."). Be conversational and warm but maintain high standards.
3. Keep your total response (evaluation + question) concise: 2-3 natural sentences. Do not write long blocks of text.
4. Stage Rule (MUST ALIGN WITH THE CURRENT INTERVIEW STAGE: "${context.currentStage}"):
   - "Introduction": Welcome the candidate warmly and ask them to briefly introduce themselves.
   - "Resume Questions": You MUST look at the "Candidate Projects" and "Candidate Skills" listed above. Ask a specific, highly targeted question about one of their real-world projects and their architectural decisions.
   - "Technical Questions": You MUST present a hands-on coding challenge or algorithmic task (e.g. "Write a function to find the longest substring without repeating characters"). You MUST command them to write code in the live editor, and you MUST set "isCodeRequired" to true for these questions!
   - "Scenario Questions": You MUST ask a system design or architectural scenario question (e.g. "How would you design a scalable real-time notification service?"). Ask them to explain the database selection and API scaling trade-offs. Keep "isCodeRequired" to false.
   - "Behavioral Questions": You MUST ask a classic behavioral question (deadlines, learning from failure, conflict within a team) to test their culture fit. Keep "isCodeRequired" to false.
5. Score Rule: You MUST output a "score" from 0 to 100 representing how well the candidate answered the last question (0 = completely wrong, 100 = perfect).
6. CRITICAL ONE-QUESTION RULE: Ask EXACTLY ONE single, clear, and direct question at a time. Do NOT use conjunctions or list formats to stack multiple sub-questions (e.g., do NOT ask "How does X work, and what are its benefits?"). Choose ONLY ONE specific question to ask per turn and end it with exactly one question mark. If you ask more than one question, the candidate will fail to respond, so you MUST keep it strictly to one question mark per turn!
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