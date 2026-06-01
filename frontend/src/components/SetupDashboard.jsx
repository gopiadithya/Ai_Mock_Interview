import React, { useState, useRef } from 'react';
import axios from 'axios';
import { User, FileText, Briefcase, ChevronRight, UploadCloud, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const SetupDashboard = ({ onSetupComplete }) => {
  const [formData, setFormData] = useState({ candidateName: '', jobDescription: '' });
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        setResumeFile(file);
      } else {
        showToast('Only PDF and DOC/DOCX files are supported.');
      }
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      showToast('Please upload a resume first.');
      return;
    }
    
    setLoading(true);
    const submitData = new FormData();
    submitData.append('candidateName', formData.candidateName);
    submitData.append('jobDescription', formData.jobDescription);
    submitData.append('resumeFile', resumeFile);

    try {
      const res = await axios.post('http://localhost:5000/api/interview/setup', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        // Render the analysis dashboard instead of immediately jumping into the interview
        setAnalysisResult({
          ...res.data.profileAnalysis,
          interviewId: res.data.interviewId
        });
      }
    } catch (error) {
      console.error('Setup failed', error);
      showToast(error.response?.data?.error || 'Setup failed. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (analysisResult) {
    const { matchedSkills = [], missingSkills = [], matchPercentage = 0, interviewId } = analysisResult;
    
    // Determine color based on match percentage
    let strokeColor = 'var(--accent-primary)';
    if (matchPercentage >= 80) strokeColor = '#10b981'; // Green
    else if (matchPercentage >= 50) strokeColor = '#f59e0b'; // Orange
    else strokeColor = '#ef4444'; // Red

    return (
      <div className="glass-panel" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '40px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Pre-Interview Analysis</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Here is how your resume stacks up against the Target Job Description.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center', marginBottom: '32px' }}>
          {/* Circular Progress Bar */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '200px', height: '200px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="3"
                  strokeDasharray={`${matchPercentage}, 100`}
                  style={{ transition: 'stroke-dasharray 1s ease-out' }}
                />
              </svg>
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: '3rem', fontWeight: 600, color: strokeColor }}>{matchPercentage}%</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Match</span>
              </div>
            </div>
          </div>

          <div>
            {/* Matched Skills */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '12px' }}>
                <CheckCircle size={18} /> Matched Skills
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {matchedSkills.length > 0 ? matchedSkills.map((skill, i) => (
                  <span key={i} style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '16px', fontSize: '0.9rem' }}>
                    {skill}
                  </span>
                )) : <span style={{ color: 'var(--text-secondary)' }}>No exact skill matches found.</span>}
              </div>
            </div>

            {/* Missing Skills */}
            <div style={{ marginBottom: '0' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '12px' }}>
                <XCircle size={18} /> Missing from Resume
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {missingSkills.length > 0 ? missingSkills.map((skill, i) => (
                  <span key={i} style={{ padding: '6px 12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderRadius: '16px', fontSize: '0.9rem' }}>
                    {skill}
                  </span>
                )) : <span style={{ color: 'var(--text-secondary)' }}>You meet all listed skill requirements!</span>}
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => onSetupComplete(interviewId)} 
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px' }}
        >
          Proceed to Interview
          <ChevronRight size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', position: 'relative', padding: '40px' }}>
      
      {loading && (
        <div className="loader-overlay">
          <div className="typing-dots" style={{ marginBottom: '16px', transform: 'scale(1.5)' }}>
            <span></span><span></span><span></span>
          </div>
          <h3 style={{ margin: 0 }}>Scanning Profile & Initializing AI...</h3>
        </div>
      )}

      <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <User size={28} color="var(--accent-primary)" />
        Candidate Setup
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', textAlign: 'center' }}>
        Provide your details and the target job description to configure Nova.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Full Name</label>
              <input 
                type="text" 
                placeholder="Jane Doe"
                required
                value={formData.candidateName}
                onChange={e => setFormData({...formData, candidateName: e.target.value})}
                style={{ marginBottom: 0 }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: 500 }}>
                <FileText size={18} />
                Resume Document
              </label>
              <div 
                className={`drop-zone ${dragActive ? 'active' : ''} ${resumeFile ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  height: '180px', 
                  minHeight: '180px',
                  maxHeight: '180px',
                  marginBottom: 0, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  padding: '20px',
                  overflow: 'hidden'
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={e => setResumeFile(e.target.files[0])}
                />
                <UploadCloud size={40} color={resumeFile ? 'var(--success-color)' : 'var(--text-secondary)'} style={{ flexShrink: 0, marginBottom: '12px' }} />
                {resumeFile ? (
                  <p style={{ color: 'var(--success-color)', fontWeight: 500, margin: 0, textAlign: 'center', wordBreak: 'break-all', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{resumeFile.name}</p>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>Click or Drag & Drop your PDF/DOCX here</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: 500 }}>
              <Briefcase size={18} />
              Target Job Description
            </label>
            <textarea 
              placeholder="Paste the job description..."
              required
              style={{ flex: 1, resize: 'none', marginBottom: 0 }}
              value={formData.jobDescription}
              onChange={e => setFormData({...formData, jobDescription: e.target.value})}
            />
          </div>

        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button type="submit" disabled={loading} style={{ width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px' }}>
            Analyze Resume
            <ChevronRight size={20} />
          </button>
        </div>
      </form>

      {toast && (
        <div className="toast-container">
          <div className="toast">
            <AlertCircle size={20} />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupDashboard;
