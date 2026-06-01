import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import SetupDashboard from './components/SetupDashboard';
import InterviewRoom from './components/InterviewRoom';
import ResultsReport from './components/ResultsReport';
import InteractiveBackground from './components/InteractiveBackground';
import './index.css';

function App() {
  const [stage, setStage] = useState('setup'); // setup, interview, results
  const [interviewId, setInterviewId] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');

  const handleLogin = () => {
    setIsAuthenticated(true);
    setUserName(localStorage.getItem('userName') || 'User');
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setStage('setup');
  };

  const handleSetupComplete = (id) => {
    setInterviewId(id);
    setStage('interview');
  };

  const handleInterviewFinish = () => {
    setStage('results');
  };

  const handleRestart = () => {
    setInterviewId(null);
    setStage('setup');
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <InteractiveBackground />
        <LoginPage onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <InteractiveBackground />
      <header className="header" style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '1.8rem' }}>AI Mock Interview Pro</h1>
          <p style={{ margin: 0 }}>Master your next interview with adaptive AI simulations.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Welcome, <strong style={{ color: 'var(--accent-primary)' }}>{userName}</strong></span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', fontSize: '0.9rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: 'none' }}>
            Logout
          </button>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {stage === 'setup' && <SetupDashboard onSetupComplete={handleSetupComplete} />}
        {stage === 'interview' && (
          <InterviewRoom 
            interviewId={interviewId} 
            onFinish={handleInterviewFinish} 
          />
        )}
        {stage === 'results' && (
          <ResultsReport 
            interviewId={interviewId} 
            onRestart={handleRestart} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
