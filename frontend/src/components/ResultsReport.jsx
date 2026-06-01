import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play } from 'lucide-react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const AnimatedCounter = ({ endValue, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * endValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [endValue, duration]);

  return <>{count}</>;
};

const ResultsReport = ({ interviewId }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.post(`http://localhost:5000/api/interview/${interviewId}/evaluate`);
        if (res.data.success) {
          setReport(res.data.evaluation);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchResults();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '80px', margin: '40px auto', maxWidth: '800px' }}>
        <div className="typing-dots" style={{ marginBottom: '32px', transform: 'scale(2.5)' }}>
          <span></span><span></span><span></span>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 300, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Nova is compiling your executive report...
        </h2>
      </div>
    );
  }

  if (!report || !report.scores) return <div className="glass-panel">Error loading results.</div>;

  // Gauge Color Logic
  const readinessColor =
    report.scores.finalReadiness >= 40
      ? "#22c55e"
      : report.scores.finalReadiness >= 25
      ? "#f59e0b"
      : "#ef4444";

  // SHAP Values
  const metrics = [
    { name: 'Accuracy', value: report.scores.accuracy },
    { name: 'Relevance', value: report.scores.relevance },
    { name: 'Clarity', value: report.scores.clarity },
    { name: 'Depth', value: report.scores.depth },
    { name: 'Time', value: report.scores.timeManagement }
  ];
  const shapValues = metrics.map(m => ({
    name: m.name,
    score: m.value,
    impact: m.value - 5 
  })).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  // Radar Chart Config
  const radarData = {
    labels: ["Accuracy", "Relevance", "Clarity", "Depth", "Time"],
    datasets: [
      {
        label: "Performance",
        data: [
          report.scores.accuracy,
          report.scores.relevance,
          report.scores.clarity,
          report.scores.depth,
          report.scores.timeManagement
        ],
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(59, 130, 246, 1)"
      }
    ]
  };

  const radarOptions = {
    scales: {
      r: {
        angleLines: { color: "rgba(255, 255, 255, 0.1)" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        pointLabels: { color: "var(--text-secondary)", font: { size: 12 } },
        ticks: { display: false, min: 0, max: 10 }
      }
    },
    plugins: {
      legend: { display: false }
    },
    maintainAspectRatio: false
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", gap: "16px", padding: "24px", maxWidth: "1000px", margin: "0 auto", paddingBottom: "40px" }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '2rem', letterSpacing: '4px', textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0, paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'inline-block' }}>
          AI Interview Report
        </h1>
      </div>

      {/* Row 1: Score Gauge & Radar Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "16px" }}>
        
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', padding: '24px', height: '100%' }}>
          <h3 style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '24px' }}>Readiness Score</h3>
          <div style={{
            width: '180px', height: '180px', borderRadius: '50%',
            border: `12px solid ${readinessColor}`,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            boxShadow: `0 0 30px ${readinessColor}33`,
            background: 'rgba(0,0,0,0.2)',
            flexShrink: 0
          }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '3.5rem', margin: 0, lineHeight: 1, textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                <AnimatedCounter endValue={report.scores.finalReadiness * 2} />
              </h1>
              <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>/ 100</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <span className="tag" style={{ background: `${readinessColor}22`, color: readinessColor, border: `1px solid ${readinessColor}`, padding: '6px 16px', fontSize: '1rem' }}>
              {(report.scores.finalReadiness * 2) >= 80 ? 'READY' : (report.scores.finalReadiness * 2) >= 50 ? 'NEEDS IMPROVEMENT' : 'NOT READY'}
            </span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h3 style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '16px' }}>Performance Radar</h3>
          <div style={{ width: '100%', flex: 1, minHeight: '220px', position: 'relative' }}>
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>
        
      </div>

      {/* Row 2: Strengths & Weaknesses */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "16px" }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--success-color)', marginBottom: '16px', fontSize: '1.1rem' }}>Key Strengths</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {report.strengths.map((s, i) => (
              <div key={i} className="tag success" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>{s}</div>
            ))}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--warning-color)', marginBottom: '16px', fontSize: '1.1rem' }}>Needs Improvement</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {report.weaknesses.map((w, i) => (
              <div key={i} className="tag warning" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>{w}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: AI Feedback (Full Width) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '1.1rem' }}>AI Evaluation Summary</h3>
        <p style={{ color: 'var(--text-primary)', fontStyle: 'italic', margin: 0, lineHeight: 1.6, fontSize: '1.05rem' }}>
          "{report.feedback}"
        </p>
      </div>

      {/* Row 4: SHAP Impact (Full Width) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '1.1rem' }}>SHAP Feature Impact</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {shapValues.map((item) => {
            const isPositive = item.impact >= 0;
            const barColor = isPositive ? '#22c55e' : '#ef4444';
            return (
              <div key={item.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: '6px', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                  <span style={{ color: barColor, fontWeight: 'bold' }}>{isPositive ? '+' : ''}{item.impact.toFixed(1)}</span>
                </div>
                <div className="progress-container" style={{ height: '8px', background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, Math.abs(item.impact) * 20)}%`,
                      background: barColor,
                      boxShadow: `0 0 8px ${barColor}`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 5: CTA (Full Width) */}
      <div style={{ textAlign: 'center', padding: '16px 0', marginTop: 'auto' }}>
        <button onClick={() => window.location.reload()} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', padding: '16px 40px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}>
          <Play size={18} />
          Start New Interview
        </button>
      </div>

    </div>
  );
};

export default ResultsReport;
