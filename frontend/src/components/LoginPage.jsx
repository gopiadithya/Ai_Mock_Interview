import React, { useState } from 'react';
import { Lock, Mail, ChevronRight, UserCircle } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate authentication delay for hackathon demo realism
    setTimeout(() => {
      setLoading(false);
      // Mock authentication success!
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userName', formData.name || formData.email.split('@')[0]);
      onLogin();
    }, 1200);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Dynamic Background Elements */}
      <div className="nova-aura speaking" style={{ opacity: 0.15 }}></div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', position: 'relative', zIndex: 1, padding: '40px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', letterSpacing: '2px' }}>HACK2HIRE</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            AI-Powered Mock Interview Platform
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '12px' }}>
          <button 
            type="button"
            onClick={() => setIsLogin(true)}
            style={{ 
              flex: 1, background: isLogin ? 'var(--accent-primary)' : 'transparent', 
              boxShadow: isLogin ? '0 4px 15px rgba(59, 130, 246, 0.4)' : 'none',
              padding: '10px', transition: 'all 0.3s' 
            }}
          >
            Login
          </button>
          <button 
            type="button"
            onClick={() => setIsLogin(false)}
            style={{ 
              flex: 1, background: !isLogin ? 'var(--accent-primary)' : 'transparent', 
              boxShadow: !isLogin ? '0 4px 15px rgba(59, 130, 246, 0.4)' : 'none',
              padding: '10px', transition: 'all 0.3s' 
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {!isLogin && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                <UserCircle size={18} /> Full Name
              </label>
              <input 
                type="text" 
                placeholder="John Doe" 
                required={!isLogin}
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                style={{ marginBottom: 0 }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              <Mail size={18} /> Email Address
            </label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              style={{ marginBottom: 0 }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              <Lock size={18} /> Password
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              style={{ marginBottom: 0 }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '12px', padding: '16px', display: 'flex', justifyContent: 'center', 
              alignItems: 'center', gap: '10px', fontSize: '1.1rem' 
            }}
          >
            {loading ? (
              <div className="typing-dots"><span></span><span></span><span></span></div>
            ) : (
              <>
                {isLogin ? 'Authenticate' : 'Create Account'}
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </form>
        
        {isLogin && (
          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem', cursor: 'pointer' }}>
            Forgot password?
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
