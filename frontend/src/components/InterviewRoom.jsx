import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, MicOff, Clock, ShieldAlert, PhoneOff, Code } from 'lucide-react';
import Editor from '@monaco-editor/react';

const InterviewRoom = ({ interviewId, onFinish }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(90); // 90 seconds max per question
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // Code Editor state
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeContent, setCodeContent] = useState('');
  
  const currentQStartTime = useRef(0);
  const recognitionRef = useRef(null);

  useEffect(() => {
    currentQStartTime.current = Date.now();
  }, []);

  // Global Elapsed Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Toast for time cutoff
  const [toast, setToast] = useState('');
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const sendResponse = async (text, code) => {
    setTranscript('');
    setCodeContent('');
    
    const duration = (Date.now() - currentQStartTime.current) / 1000;
    
    let displayContent = text;
    if (code) displayContent += `\n\n[Code Submitted]`;
    setMessages(prev => [...prev, { role: 'user', content: displayContent }]);
    
    setLoading(true);
 
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${API_BASE}/api/interview/${interviewId}/chat`, {
        content: text || "I have submitted the code.",
        duration,
        totalElapsedTime: elapsedTime,
        codeSnippet: code || null
      });
      
      if (res.data.success) {
        if (res.data.isInterviewEnded) {
          onFinish();
          return;
        }
        
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply, displayContent: res.data.displayQuestion }]);
        setDifficulty(res.data.difficulty);
        
        currentQStartTime.current = Date.now();
        speakText(res.data.reply, res.data.displayQuestion);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const toggleMic = React.useCallback(() => {
    if (!recognitionRef.current) {
      alert("Your browser does not support Speech Recognition. Please use Chrome.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (transcript.trim() || codeContent.trim()) {
        sendResponse(transcript, codeContent);
      }
    } else {
      setTranscript('');
      setTimeLeft(90); // Reset timer if manually toggling on
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening, transcript, codeContent]);

  // Strict 90-second Countdown Timer
  useEffect(() => {
    let timer;
    if (isListening && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isListening && timeLeft === 0) {
      // Auto-submit when time expires
      toggleMic();
      showToast("Time's up! Auto-submitting your answer.");
    }
    return () => clearInterval(timer);
  }, [isListening, timeLeft, toggleMic]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, []);

  const [displayedCaption, setDisplayedCaption] = useState('');

  const speakText = (fullText, questionText) => {
    // Sanitize fullText and questionText from any remaining dashes, backticks or weird LLM symbols
    const sanitizedFullText = fullText.replace(/---/g, '').replace(/--/g, '').replace(/`/g, '').trim();
    const sanitizedQuestionText = questionText ? questionText.replace(/---/g, '').replace(/--/g, '').replace(/`/g, '').trim() : '';

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sanitizedFullText);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google UK English Female') || v.name.includes('Zira') || v.name.includes('Samantha'));
      if (preferredVoice) utterance.voice = preferredVoice;
      
      // Set the full text caption IMMEDIATELY to prevent voice coming before text!
      setDisplayedCaption(sanitizedFullText); 
      setIsSpeaking(true); // Set true immediately to prevent flashing the full text
      
      utterance.onstart = () => setIsSpeaking(true);
      
      utterance.onend = () => {
        setDisplayedCaption(sanitizedFullText);
        setIsSpeaking(false);
        // Automatically turn on microphone to listen to answer
        if (recognitionRef.current) {
          try {
            setTranscript('');
            setTimeLeft(90); // Reset timer for new question
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {
            // Ignore if already started
          }
        }
      };
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    window.speechSynthesis.onvoiceschanged = () => {};
  }, []);

  useEffect(() => {
    const startInterview = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await axios.post(`${API_BASE}/api/interview/${interviewId}/start`);
        if (res.data.success) {
          setMessages([{ role: 'assistant', content: res.data.message, displayContent: res.data.message }]);
          setDifficulty(res.data.difficulty);
          currentQStartTime.current = Date.now();
          speakText(res.data.message, res.data.message);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    startInterview();
    
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [interviewId]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');

  // Generate random values once
  const [floatingSymbols] = useState(() => [...Array(15)].map(() => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 20}s`,
    duration: `${15 + Math.random() * 10}s`,
    symbol: ['{ }', '< >', '()', ';;', '=>', '[]', '/*'][Math.floor(Math.random() * 7)]
  })));

  // Calculate current stage index dynamically
  const assistantCount = messages.filter(m => m.role === 'assistant').length;
  let activeStageIdx = 0; // Intro
  if (assistantCount >= 2 && assistantCount <= 3) activeStageIdx = 1; // Resume
  else if (assistantCount >= 4 && assistantCount <= 6) activeStageIdx = 2; // Technical
  else if (assistantCount >= 7 && assistantCount <= 8) activeStageIdx = 3; // Scenario
  else if (assistantCount >= 9) activeStageIdx = 4; // Behavioral

  const stages = [
    { label: 'Introduction', countRange: 'Q1-2' },
    { label: 'Resume Projects', countRange: 'Q3-4' },
    { label: 'Technical Monaco', countRange: 'Q5-7' },
    { label: 'Scenario Round', countRange: 'Q8-9' },
    { label: 'Behavioral Fit', countRange: 'Q10' }
  ];

  return (
    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', padding: 0 }}>
      {/* Floating Engineering Symbols */}
      {floatingSymbols.map((item, i) => (
        <div key={i} className="floating-symbol" style={{ 
          left: item.left, 
          animationDelay: item.delay,
          animationDuration: item.duration
        }}>
          {item.symbol}
        </div>
      ))}

      {/* Nova Aura Background */}
      <div className={`nova-aura ${isSpeaking ? 'speaking' : ''}`} />

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container" style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 1000 }}>
          <div className="toast">
            <ShieldAlert size={20} />
            {toast}
          </div>
        </div>
      )}

      {/* Strict Countdown Timer Bar */}
      {isListening && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.1)', zIndex: 10 }}>
          <div style={{ 
            height: '100%', 
            width: `${(timeLeft / 90) * 100}%`,
            background: timeLeft > 30 ? 'var(--success-color)' : timeLeft > 10 ? 'var(--warning-color)' : 'var(--error-color)',
            transition: 'width 1s linear, background-color 0.3s ease'
          }} />
        </div>
      )}

      {/* Header Room Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.05)', marginTop: isListening ? '4px' : '0' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '12px', height: '12px', borderRadius: '50%', 
            background: isSpeaking ? 'var(--accent-primary)' : '#555', 
            boxShadow: isSpeaking ? '0 0 12px var(--accent-primary)' : 'none',
            transition: 'all 0.3s ease'
          }}></div>
          Nova AI Room
        </h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <ShieldAlert size={18} color="var(--warning-color)"/>
            Level {difficulty}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
            <Clock size={18} />
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>

      {/* Interactive Timeline Stepper */}
      <div style={{ padding: '16px 24px 0 24px', zIndex: 1 }}>
        <div className="stage-stepper">
          {stages.map((stage, idx) => {
            let statusClass = '';
            if (idx === activeStageIdx) statusClass = 'active';
            else if (idx < activeStageIdx) statusClass = 'completed';

            return (
              <div key={idx} className={`stage-step ${statusClass}`}>
                <div className="stage-node">{idx + 1}</div>
                <div className="stage-label">{stage.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Working Panel */}
      <div style={{ flex: 1, display: 'flex', zIndex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: Voice Assistant Screen */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center', transition: 'all 0.4s ease' }}>
          
          {/* Animated soundwave widget */}
          <div className={`soundwave-container ${isSpeaking ? 'speaking' : isListening ? 'listening' : ''}`}>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="soundwave-bar" />
            ))}
          </div>

          <div style={{ background: 'transparent', padding: '16px 32px', border: 'none', maxWidth: '750px', width: '100%', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: 'none' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div className="typing-dots" style={{ transform: 'scale(1.2)' }}>
                  <span></span><span></span><span></span>
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nova is analyzing...</span>
              </div>
            ) : (
              <h2 style={{ 
                fontSize: showCodeEditor ? '1.15rem' : '1.35rem', 
                lineHeight: 1.6, fontWeight: 400, margin: 0,
                textShadow: '0 2px 10px rgba(0,0,0,0.5)', transition: 'all 0.3s ease'
              }}>
                "{isSpeaking ? displayedCaption : (lastAssistantMsg?.displayContent || lastAssistantMsg?.content)}"
              </h2>
            )}
          </div>
        </div>

        {/* Right Side: Monaco Code Editor */}
        {showCodeEditor && (
          <div style={{ flex: '1', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', padding: '20px', animation: 'slideInRight 0.4s ease' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '16px', fontSize: '1.1rem' }}>
              <Code size={20} />
              Interactive Monaco Code Workspace
            </h3>
            <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={codeContent}
                onChange={(value) => setCodeContent(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  padding: { top: 16 }
                }}
              />
            </div>
          </div>
        )}

      </div>

      {/* Speech transcript output banner */}
      <div style={{ minHeight: '50px', padding: '0 24px', textAlign: 'center', color: 'var(--text-primary)', zIndex: 1, fontSize: '1.1rem', fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isListening ? (
          <p style={{ fontStyle: 'italic', color: 'var(--success-color)' }}>{transcript || "Listening..."}</p>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>Tap the mic to reply when Nova is ready.</p>
        )}
      </div>

      {/* Floating Panel Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', padding: '24px', zIndex: 1, background: 'rgba(13, 17, 23, 0.4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          onClick={() => setShowCodeEditor(!showCodeEditor)}
          style={{ 
            width: '60px', height: '60px', borderRadius: '50%', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            background: showCodeEditor ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff', padding: 0,
            boxShadow: showCodeEditor ? '0 4px 20px rgba(59,130,246,0.4)' : '0 4px 20px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
            alignSelf: 'center'
          }}
          title="Toggle Code Workspace"
        >
          <Code size={24} color={showCodeEditor ? "#fff" : "var(--accent-primary)"} />
        </button>

        <button 
          onClick={toggleMic}
          disabled={loading}
          style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            background: isListening ? 'var(--error-color)' : 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff', padding: 0,
            animation: isListening ? 'pulse-mic 2s infinite' : 'none',
            boxShadow: isListening ? 'none' : '0 4px 20px rgba(0,0,0,0.3)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {isListening ? <MicOff size={32} /> : <Mic size={32} color="var(--accent-primary)" />}
        </button>

        <button 
          onClick={onFinish}
          style={{ 
            width: '60px', height: '60px', borderRadius: '50%', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            background: 'var(--error-color)',
            border: 'none',
            color: '#fff', padding: 0,
            boxShadow: '0 4px 20px rgba(248, 81, 73, 0.4)',
            transition: 'all 0.3s ease',
            alignSelf: 'center'
          }}
          title="End Interview"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};

export default InterviewRoom;
