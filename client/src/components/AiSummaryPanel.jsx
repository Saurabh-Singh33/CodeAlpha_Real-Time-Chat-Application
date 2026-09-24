import React, { useState, useEffect } from 'react';
import { 
  Bot, CheckCircle, Clock, Users, FileText, ListChecks, Target, AlertTriangle, RefreshCw, X, ArrowLeft, Download, Sparkles
} from 'lucide-react';

export default function AiSummaryPanel({ meetingId, onClose, onBackToRoom }) {
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Preparing transcript...');
  const [analysis, setAnalysis] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary'); // summary | keyPoints | decisions | actionItems | transcript
  const [isProcessing, setIsProcessing] = useState(false);

  const getServerUrl = () => {
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : `${window.location.protocol}//${window.location.hostname}:5000`;
  };

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${getServerUrl()}/api/ai-meeting/summary/${meetingId}`, {
        credentials: 'include'
      });
      const data = await res.json();

      if (data.expired || data.message?.includes('expired')) {
        setError('Summary for this meeting has expired.');
        setLoading(false);
        return;
      }

      if (res.ok && data.success) {
        setAnalysis(data.analysis);
        setChunks(data.chunks || []);
        
        if (data.analysis.status === 'completed') {
          setStatusMessage('Completed');
        } else if (data.analysis.status === 'failed') {
          setError(data.analysis.errorMessage || 'Failed to generate AI summary.');
        } else {
          // Still processing/analyzing
          setStatusMessage(data.analysis.status === 'transcribing' ? 'Transcribing...' : 'Analyzing...');
          pollStatus();
        }
      } else {
        // If summary doesn't exist yet, trigger process endpoint on-demand
        triggerProcessing();
      }
    } catch (err) {
      console.error('Error fetching AI summary:', err);
      setError('Unable to load AI summary. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const triggerProcessing = async () => {
    setIsProcessing(true);
    setError('');
    
    // Progressive Loading Steps
    const steps = [
      'Preparing transcript...',
      'Transcribing...',
      'Analyzing...',
      'Generating summary...'
    ];

    let stepIdx = 0;
    setStatusMessage(steps[0]);
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setStatusMessage(steps[stepIdx]);
    }, 2500);

    try {
      const res = await fetch(`${getServerUrl()}/api/ai-meeting/process/${meetingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();

      clearInterval(interval);

      if (res.ok && data.success) {
        setAnalysis(data.analysis);
        if (data.analysis?.status === 'completed') {
          setStatusMessage('Completed');
        } else {
          pollStatus();
        }
      } else {
        setError(data.message || 'AI processing encountered an issue.');
      }
    } catch (err) {
      clearInterval(interval);
      setError('Server request failed during AI processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const pollStatus = () => {
    let attempts = 0;
    const poller = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${getServerUrl()}/api/ai-meeting/summary/${meetingId}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.analysis) {
          setAnalysis(data.analysis);
          if (data.analysis.status === 'completed') {
            setStatusMessage('Completed');
            clearInterval(poller);
          } else if (data.analysis.status === 'failed') {
            setError(data.analysis.errorMessage || 'AI analysis failed');
            clearInterval(poller);
          } else {
            setStatusMessage(data.analysis.status === 'transcribing' ? 'Transcribing...' : 'Analyzing...');
          }
        }
      } catch (_e) {}

      if (attempts > 30) clearInterval(poller);
    }, 3000);
  };

  useEffect(() => {
    if (meetingId) {
      fetchSummary();
    }
  }, [meetingId]);

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds) return '00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(10, 15, 29, 0.95)',
      backdropFilter: 'blur(16px)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Top Header */}
      <div style={{
        padding: '1.25rem 2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onBackToRoom && (
            <button 
              onClick={onBackToRoom}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem' }}
            >
              <ArrowLeft size={16} /> Back to Meeting
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#EEF2FF',
              border: '1px solid #E0E7FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <Bot size={22} color="#4F46E5" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                AI Meeting Summary
                <span style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  border: '1px solid #C7D2FE',
                  fontWeight: 600
                }}>
                  Gemini Powered
                </span>
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Room ID: {meetingId}</span>
            </div>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              transition: 'color 0.2s'
            }}
          >
            <X size={22} />
          </button>
        )}
      </div>

      {/* Main Panel Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Metric Cards Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div className="glass-panel" style={{ padding: '1rem 1.25rem', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>
                <Clock size={14} color="#38bdf8" /> Duration
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatDuration(analysis?.duration)}</div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem 1.25rem', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>
                <Users size={14} color="#a855f7" /> Participants
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{analysis?.participantCount || 1} Person(s)</div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem 1.25rem', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>
                <FileText size={14} color="#34d399" /> Transcribed Chunks
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{analysis?.transcriptChunkCount || chunks.length || 0} Chunks</div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem 1.25rem', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>
                <Sparkles size={14} color="#f43f5e" /> Status
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: analysis?.status === 'completed' ? '#34d399' : '#f59e0b' }}>
                {analysis?.status ? analysis.status.toUpperCase() : 'PROCESSING'}
              </div>
            </div>
          </div>

          {/* Error / Quota Alert Banner */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={24} color="#ef4444" />
                <div>
                  <h4 style={{ margin: 0, color: '#f87171', fontSize: '1rem' }}>AI Processing Issue</h4>
                  <p style={{ margin: '4px 0 0 0', color: '#cbd5e1', fontSize: '0.875rem' }}>{error}</p>
                </div>
              </div>
              <button 
                className="btn btn-primary"
                onClick={triggerProcessing}
                disabled={isProcessing}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
              >
                <RefreshCw size={16} className={isProcessing ? 'spin' : ''} />
                {isProcessing ? 'Processing...' : 'Retry Processing'}
              </button>
            </div>
          )}

          {/* Progressive Loading State */}
          {(loading || isProcessing || analysis?.status === 'transcribing' || analysis?.status === 'analyzing') && !error && (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'rgba(30, 41, 59, 0.4)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '2rem'
            }}>
              <div style={{
                width: '54px',
                height: '54px',
                margin: '0 auto 1.5rem auto',
                borderRadius: '50%',
                border: '3px solid rgba(99, 102, 241, 0.2)',
                borderTopColor: '#6366f1',
                animation: 'spin 1s linear infinite'
              }}></div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>{statusMessage}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto' }}>
                Please wait while Gemini processes transcript chunks and extracts key insights. Your UI will update automatically.
              </p>
            </div>
          )}

          {/* Main AI Results Navigation Tabs */}
          {analysis && analysis.status === 'completed' && (
            <>
              <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '1.5rem',
                overflowX: 'auto'
              }}>
                {[
                  { id: 'summary', label: 'Executive Summary', icon: FileText },
                  { id: 'keyPoints', label: `Key Points (${analysis.keyPoints?.length || 0})`, icon: Target },
                  { id: 'decisions', label: `Decisions (${analysis.decisions?.length || 0})`, icon: CheckCircle },
                  { id: 'actionItems', label: `Action Items (${analysis.actionItems?.length || 0})`, icon: ListChecks },
                  { id: 'transcript', label: `Transcript Chunks (${chunks.length})`, icon: Bot }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 18px',
                        background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        border: 'none',
                        borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                        color: isActive ? '#818cf8' : '#94a3b8',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        borderRadius: '6px 6px 0 0',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Icon size={16} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Executive Summary */}
              {activeTab === 'summary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="glass-panel" style={{ padding: '1.75rem', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#818cf8' }}>Short Meeting Summary</h3>
                    <p style={{ lineHeight: '1.7', color: '#e2e8f0', fontSize: '0.95rem', margin: 0 }}>
                      {analysis.finalSummary || 'No summary text available.'}
                    </p>
                  </div>

                  {/* Section Summaries if available */}
                  {analysis.sectionSummaries && analysis.sectionSummaries.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h4 style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>20-Min Section Breakdown</h4>
                      {analysis.sectionSummaries.map((sec, idx) => (
                        <div key={idx} className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.4)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 600, color: '#38bdf8' }}>Section {sec.sectionIndex}: {sec.title || 'Discussion Block'}</span>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                              {sec.timeRange}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6' }}>{sec.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Key Discussion Points */}
              {activeTab === 'keyPoints' && (
                <div className="glass-panel" style={{ padding: '1.75rem', background: 'rgba(30, 41, 59, 0.5)' }}>
                  <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', color: '#38bdf8' }}>Key Discussion Points</h3>
                  {analysis.keyPoints && analysis.keyPoints.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {analysis.keyPoints.map((point, idx) => (
                        <li key={idx} style={{ color: '#e2e8f0', lineHeight: '1.6', fontSize: '0.95rem' }}>
                          {point}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: '#94a3b8' }}>No specific key discussion points identified.</p>
                  )}
                </div>
              )}

              {/* Tab 3: Decisions Made */}
              {activeTab === 'decisions' && (
                <div className="glass-panel" style={{ padding: '1.75rem', background: 'rgba(30, 41, 59, 0.5)' }}>
                  <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', color: '#34d399' }}>Decisions Made</h3>
                  {analysis.decisions && analysis.decisions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {analysis.decisions.map((decision, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '0.85rem 1rem',
                          background: 'rgba(52, 211, 153, 0.08)',
                          border: '1px solid rgba(52, 211, 153, 0.2)',
                          borderRadius: '8px'
                        }}>
                          <CheckCircle size={18} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.5' }}>{decision}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#94a3b8' }}>No explicit decisions recorded in this meeting.</p>
                  )}
                </div>
              )}

              {/* Tab 4: Action Items */}
              {activeTab === 'actionItems' && (
                <div className="glass-panel" style={{ padding: '1.75rem', background: 'rgba(30, 41, 59, 0.5)' }}>
                  <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', color: '#a855f7' }}>Action Items & Assignments</h3>
                  {analysis.actionItems && analysis.actionItems.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                            <th style={{ padding: '10px' }}>Person Responsible</th>
                            <th style={{ padding: '10px' }}>Task Description</th>
                            <th style={{ padding: '10px' }}>Deadline</th>
                            <th style={{ padding: '10px' }}>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.actionItems.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                                <span style={{
                                  background: item.person === 'Unassigned' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(168, 85, 247, 0.2)',
                                  color: item.person === 'Unassigned' ? '#cbd5e1' : '#c084fc',
                                  padding: '3px 10px',
                                  borderRadius: '12px',
                                  display: 'inline-block',
                                  fontSize: '0.8rem'
                                }}>
                                  {item.person}
                                </span>
                              </td>
                              <td style={{ padding: '12px 10px', color: '#e2e8f0', lineHeight: '1.5' }}>{item.task}</td>
                              <td style={{ padding: '12px 10px', color: '#94a3b8' }}>{item.deadline}</td>
                              <td style={{ padding: '12px 10px', color: '#38bdf8', fontFamily: 'monospace' }}>{item.timestamp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: '#94a3b8' }}>No action items detected in transcript.</p>
                  )}
                </div>
              )}

              {/* Tab 5: Transcript Chunks */}
              {activeTab === 'transcript' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#818cf8' }}>Stored Transcript Chunks</h3>
                  {chunks && chunks.length > 0 ? (
                    chunks.map((c, idx) => (
                      <div key={idx} className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
                          <span style={{ fontWeight: 600, color: '#38bdf8' }}>Chunk #{c.chunkNumber}</span>
                          <span>{formatDuration(c.startTime)} - {formatDuration(c.endTime)}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                          {c.transcript}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#94a3b8' }}>No individual transcript chunks found.</p>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
