const { analyzeProfile, generateNextInteraction, evaluateFinalInterview, validateResumeDocument } = require('../utils/ai');
const admin = require('firebase-admin');
const pdfParse = typeof require('pdf-parse') === 'function' ? require('pdf-parse') : require('pdf-parse').PDFParse || require('pdf-parse').default;
const mammoth = require('mammoth');

const getDb = () => admin.firestore();

exports.setupInterview = async (req, res) => {
  try {
    const { candidateName, jobDescription } = req.body;
    let resumeText = req.body.resumeText || '';

    if (req.file) {
      if (req.file.originalname.endsWith('.pdf')) {
        const pdfData = await pdfParse(req.file.buffer);
        resumeText = pdfData.text;
      } else if (req.file.originalname.endsWith('.docx') || req.file.originalname.endsWith('.doc')) {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        resumeText = result.value;
      }
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ success: false, error: 'The uploaded document appears to be blank or invalid. Please upload a detailed resume.' });
    }

    // --- HYBRID VALIDATION PIPELINE ---
    const lowerText = resumeText.toLowerCase();
    let ruleScore = 0;

    // 1. Keyword check
    const resumeKeywords = [
      "education", "skills", "experience", "projects", "certifications", 
      "internship", "work experience", "technical skills", "achievements", 
      "linkedin", "github", "summary", "profile", "university", "college", "degree"
    ];
    resumeKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) ruleScore++;
    });

    // 1.5 Negative Keyword Check (Certificates, Awards)
    const negativeKeywords = ["certificate of completion", "this is to certify", "award", "diploma", "successfully completed"];
    negativeKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) ruleScore -= 3; // Heavily penalize certificates
    });

    // 2. Regex check
    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
    const phoneRegex = /(\+91)?[-. ]?[6-9]\d{9}/;
    if (emailRegex.test(resumeText)) ruleScore++;
    if (phoneRegex.test(resumeText)) ruleScore++;

    console.log(`[Validation] Rule Score for ${candidateName}: ${ruleScore}`);

    // 3. Decision Tree
    if (ruleScore <= 1) {
      return res.status(400).json({ success: false, error: 'Document rejected. It does not appear to be a resume. Please upload a valid CV.' });
    } else if (ruleScore >= 2 && ruleScore <= 4) {
      // Ambiguous: Fallback to AI
      console.log(`[Validation] Ambiguous Score (${ruleScore}). Triggering AI Validation...`);
      const aiValidation = await validateResumeDocument(resumeText);
      console.log(`[Validation] AI Result:`, aiValidation);

      if (!aiValidation.isResume || aiValidation.confidence < 80) {
        return res.status(400).json({ 
          success: false, 
          error: `Document rejected. AI determined it is not a resume (Confidence: ${aiValidation.confidence}%). Reason: ${aiValidation.reason}` 
        });
      }
    }
    // If score >= 5, bypass AI and accept instantly
    // --- END HYBRID VALIDATION ---

    const profileAnalysis = await analyzeProfile(resumeText, jobDescription);
    const extractedSkills = profileAnalysis.skills || profileAnalysis.matchedSkills || ["JavaScript"];

    const interviewData = {
      candidateName,
      resumeText,
      jobDescription,
      extractedSkills,
      profileAnalysis,
      status: 'setup',
      messages: [],
      metrics: { accuracy: 0, clarity: 0, relevance: 0, depth: 0 },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await getDb().collection('interviews').add(interviewData);
    res.json({ success: true, interviewId: docRef.id, extractedSkills, profileAnalysis });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.startInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = getDb().collection('interviews').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ success: false, error: 'Interview not found' });
    const interview = doc.data();

    // Fix: Only use 2-3 explicitly matched skills (Resume + JD overlap)
    const matchedSkills = interview.profileAnalysis?.matchedSkills || interview.extractedSkills || ["relevant technologies"];
    const topSkills = matchedSkills.slice(0, 3).join(', ');

    const initialPrompt = `Hello ${interview.candidateName}, I am Nova, your AI interviewer today. I see you have strong experience with ${topSkills}. Let's start with a brief introduction. Can you tell me about yourself?`;
    
    const initialMessage = {
      role: 'assistant',
      content: initialPrompt,
      difficulty: 1,
      score: 100, // Intro dummy score
      timestamp: new Date().toISOString()
    };

    await docRef.update({
      status: 'in-progress',
      startTime: admin.firestore.FieldValue.serverTimestamp(),
      messages: admin.firestore.FieldValue.arrayUnion(initialMessage)
    });

    res.json({ success: true, message: initialPrompt, difficulty: 1, isCodeRequired: false, isInterviewEnded: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.chat = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, duration, totalElapsedTime, codeSnippet } = req.body;

    const docRef = getDb().collection('interviews').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Interview not found' });
    const interview = doc.data();

    const userMessage = {
      role: 'user',
      content,
      duration,
      codeSnippet: codeSnippet || null,
      timestamp: new Date().toISOString()
    };

    const assistantMessages = interview.messages.filter(m => m.role === 'assistant');
    const lastMsg = assistantMessages[assistantMessages.length - 1];
    const currentDiff = lastMsg ? lastMsg.difficulty : 1;
    
    // Dynamic Stage Tracking
    const nextQuestionNumber = assistantMessages.length + 1;
    let currentStage = 'Introduction';
    if (nextQuestionNumber === 2) currentStage = 'Resume & Past Experience';
    else if (nextQuestionNumber >= 3 && nextQuestionNumber <= 6) currentStage = 'Core Technical';
    else if (nextQuestionNumber >= 7 && nextQuestionNumber <= 8) currentStage = 'Scenario-Based Architecture';
    else if (nextQuestionNumber >= 9) currentStage = 'Behavioral & Culture Fit';

    // Check performance threshold for early termination (3 consecutive fails < 40)
    let failedConsecutiveCount = 0;
    for (let i = assistantMessages.length - 1; i >= 0; i--) {
      if (assistantMessages[i].score < 40) failedConsecutiveCount++;
      else break;
    }

    // Check excellent performance (Avg > 90 after 6 questions)
    let avgScore = 0;
    if (assistantMessages.length >= 6) {
      const sum = assistantMessages.reduce((acc, curr) => acc + (curr.score || 50), 0);
      avgScore = sum / assistantMessages.length;
    }

    let forceTerminationFlag = false;
    if (totalElapsedTime > 1200) forceTerminationFlag = true; // 20 min hard limit
    if (nextQuestionNumber > 10) forceTerminationFlag = true; // 10 Q hard limit
    if (failedConsecutiveCount >= 3) forceTerminationFlag = true; // Poor performance
    if (avgScore > 90 && nextQuestionNumber >= 7) forceTerminationFlag = true; // Excellent performance

    // Generate the next interaction
    const allMessages = interview.messages.concat(userMessage);
    const aiResponseText = await generateNextInteraction({ 
      skills: interview.extractedSkills,
      jobDescription: interview.jobDescription,
      currentStage,
      nextQuestionNumber,
      forceTerminationFlag
    }, allMessages, currentDiff);

    let parsedAi = {};
    try {
      parsedAi = JSON.parse(aiResponseText);
    } catch (e) {
      console.error("Failed to parse AI JSON:", e);
      parsedAi = {
        evaluation: "Thank you for your answer.",
        question: aiResponseText,
        difficulty: currentDiff,
        score: 50,
        isCodeRequired: false,
        isInterviewEnded: forceTerminationFlag
      };
    }

    const spokenReply = `${parsedAi.evaluation} ${parsedAi.question}`;
    const displayQuestion = parsedAi.question;

    const assistantMessage = {
      role: 'assistant',
      content: spokenReply,
      displayQuestion: displayQuestion,
      difficulty: parsedAi.difficulty || currentDiff,
      score: parsedAi.score || 50,
      timestamp: new Date().toISOString()
    };

    await docRef.update({
      messages: admin.firestore.FieldValue.arrayUnion(userMessage, assistantMessage)
    });

    res.json({ 
      success: true, 
      reply: spokenReply, 
      displayQuestion: displayQuestion,
      difficulty: parsedAi.difficulty || currentDiff,
      isCodeRequired: parsedAi.isCodeRequired || false,
      isInterviewEnded: parsedAi.isInterviewEnded || forceTerminationFlag
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.evaluateInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = getDb().collection('interviews').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ success: false, error: 'Interview not found' });
    const interview = doc.data();

    const finalEval = await evaluateFinalInterview(interview);

    await docRef.update({
      status: 'completed',
      endTime: admin.firestore.FieldValue.serverTimestamp(),
      finalEvaluation: finalEval,
      metrics: finalEval.scores
    });

    res.json({ success: true, evaluation: finalEval });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
