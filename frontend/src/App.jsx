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

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  React.useEffect(() => {
    import('./firebase').then(({ auth }) => {
      import('firebase/auth').then(({ onAuthStateChanged }) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            setIsAuthenticated(true);
            if (!user.displayName) {
              try {
                await user.reload();
              } catch (e) {
                console.error("Error reloading user:", e);
              }
            }
            const updatedUser = auth.currentUser || user;
            setUserName(updatedUser.displayName || updatedUser.email.split('@')[0]);
          } else {
            setIsAuthenticated(false);
            setUserName('');
          }
          setAuthLoading(false);
        });
        return () => unsubscribe();
      });
    });
  }, []);

  const handleLogin = () => {
    // Relying on onAuthStateChanged to update state
  };

  const handleLogout = async () => {
    try {
      const { auth } = await import('./firebase');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      setStage('setup');
    } catch (err) {
      console.error(err);
    }
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

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#09090b' }}>
        <div className="typing-dots" style={{ transform: 'scale(1.5)', zIndex: 10 }}><span></span><span></span><span></span></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <InteractiveBackground />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="app-container">
      <InteractiveBackground />
      <header className="header" style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
              Nova AI
            </h1>
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
        {stage === 'setup' && <SetupDashboard onSetupComplete={handleSetupComplete} defaultName={userName} />}
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
