import React, { useState, useEffect } from 'react';
import { Lock, Mail, UserCircle } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';

const LoginPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        // Enforce email verification ONLY for users created after this feature was added
        const creationTime = new Date(user.metadata.creationTime).getTime();
        const cutoffTime = new Date('2026-06-01T00:00:00Z').getTime(); // Enforce for new users
        
        if (creationTime > cutoffTime && !user.emailVerified) {
          await auth.signOut();
          setError('Please verify your email address before logging in. Check your inbox!');
          setLoading(false);
          return;
        }
        
        onLogin();
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        if (formData.name) {
          await updateProfile(userCredential.user, { displayName: formData.name });
        }
        // Send email verification
        await sendEmailVerification(userCredential.user);
        await auth.signOut(); // Force them to sign in after verifying
        
        setSuccessMsg('Account created! Please check your email to verify your account before logging in.');
        setIsLogin(true); // Switch to login view
      }
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };



  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onLogin();
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase: ', ''));
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      // Color shifting semi-transparent background
      background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2), rgba(59, 130, 246, 0.2))',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
    }}>
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .premium-input::placeholder {
            color: #71717a;
          }
          .premium-input:focus {
            border-color: #6366f1 !important;
            box-shadow: 0 0 0 3px rgba(99,102,241,0.2) !important;
          }
          .premium-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(99,102,241,0.4);
          }
          .google-btn:hover:not(:disabled) {
            background: rgba(255,255,255,0.1) !important;
          }
        `}
      </style>



      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '24px', zIndex: 1 }}>
        
        {/* Sleek Glass Card */}
        <div style={{ 
          background: 'rgba(24, 24, 27, 0.65)', 
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '48px 40px', 
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(99, 102, 241, 0.1) inset',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          
          <h1 style={{ 
            fontSize: '2.2rem', 
            marginBottom: '8px', 
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 800,
            background: 'linear-gradient(to right, #ffffff, #a5b4fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px'
          }}>
            Nova AI
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '0.95rem', marginBottom: '32px', textAlign: 'center' }}>
            Elevate your interview performance.
          </p>

          {error && (
            <div style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.85rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          {successMsg && (
            <div style={{ width: '100%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.85rem', textAlign: 'center' }}>
              {successMsg}
            </div>
          )}

              {/* Login / Signup Toggle for Email */}
              <div style={{ display: 'flex', width: '100%', gap: '16px', marginBottom: '24px', justifyContent: 'center' }}>
                <span onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }} style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: isLogin ? '#fff' : '#71717a', borderBottom: isLogin ? '2px solid #6366f1' : '2px solid transparent', paddingBottom: '4px', transition: 'all 0.2s' }}>Log In</span>
                <span onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }} style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: !isLogin ? '#fff' : '#71717a', borderBottom: !isLogin ? '2px solid #6366f1' : '2px solid transparent', paddingBottom: '4px', transition: 'all 0.2s' }}>Sign Up</span>
              </div>

              <form onSubmit={handleSubmitEmail} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {!isLogin && (
                  <div style={{ position: 'relative' }}>
                    <UserCircle size={18} color="#71717a" style={{ position: 'absolute', top: '14px', left: '14px' }} />
                    <input 
                      type="text" className="premium-input" placeholder="Full Name" required={!isLogin}
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 12px 12px 42px', fontSize: '14px', color: '#fff', outline: 'none', transition: 'all 0.2s ease' }}
                    />
                  </div>
                )}
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="#71717a" style={{ position: 'absolute', top: '14px', left: '14px' }} />
                  <input 
                    type="email" className="premium-input" placeholder="Email address" required
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 12px 12px 42px', fontSize: '14px', color: '#fff', outline: 'none', transition: 'all 0.2s ease' }}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#71717a" style={{ position: 'absolute', top: '14px', left: '14px' }} />
                  <input 
                    type="password" className="premium-input" placeholder="Password" required
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 12px 12px 42px', fontSize: '14px', color: '#fff', outline: 'none', transition: 'all 0.2s ease' }}
                  />
                </div>
                <button type="submit" className="premium-btn" disabled={loading} style={{ marginTop: '12px', padding: '14px', width: '100%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s ease', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
              </form>

          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '16px', margin: '28px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            <span style={{ color: '#71717a', fontSize: '12px', fontWeight: 500, letterSpacing: '1px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="google-btn"
            disabled={loading}
            style={{ 
              width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', 
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
              color: '#fff', fontWeight: 500, fontSize: '14px', padding: '12px', borderRadius: '12px',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
            Continue with Google
          </button>

          {isLogin && (
            <p style={{ marginTop: '32px', color: '#a1a1aa', fontSize: '13px', cursor: 'pointer', textAlign: 'center', transition: 'color 0.2s ease' }} onMouseOver={(e) => e.target.style.color='#fff'} onMouseOut={(e) => e.target.style.color='#a1a1aa'}>
              Forgot your password?
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
