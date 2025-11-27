import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Button, Card } from '../components/ui';
import { Play, Calendar, Clock, X, Zap } from 'lucide-react';
import { FocusTimer } from '../components/features';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Timer State
  const [showStartModal, setShowStartModal] = useState(false);
  const [targetDuration, setTargetDuration] = useState(null);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions/');
      setSessions(response.data);
      
      const active = response.data.find(s => !s.end_time);
      setActiveSession(active || null);
      
      if (active) {
        // Load saved duration for this session
        const savedDuration = localStorage.getItem(`session_${active.id}_duration`);
        if (savedDuration) {
          setTargetDuration(parseInt(savedDuration, 10));
        } else {
          setTargetDuration(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleStartSession = async (durationMinutes) => {
    try {
      const response = await api.post('/sessions/start', {
        // We could send expected duration to backend in future
      });
      
      const newSession = response.data;
      
      // Save duration locally
      if (durationMinutes) {
        localStorage.setItem(`session_${newSession.id}_duration`, durationMinutes.toString());
        setTargetDuration(durationMinutes);
      } else {
        setTargetDuration(null);
      }
      
      setShowStartModal(false);
      fetchSessions();
    } catch (error) {
      alert("Error starting session: " + error.response?.data?.detail);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      await api.post(`/sessions/${activeSession.id}/end`);
      // Cleanup local storage
      localStorage.removeItem(`session_${activeSession.id}_duration`);
      setTargetDuration(null);
      fetchSessions();
    } catch (error) {
      alert("Error ending session");
    }
  };

  const formatDuration = (start, end) => {
    if (!end) return 'Running...';
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diff = Math.floor((endTime - startTime) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Duration Options
  const DURATIONS = [
    { label: 'Pomodoro', minutes: 25 },
    { label: 'Short Focus', minutes: 15 },
    { label: 'Deep Work', minutes: 50 },
    { label: 'Long Session', minutes: 90 },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Sessions</h1>
        
        {!activeSession && (
          <Button 
            onClick={() => setShowStartModal(true)} 
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <Play size={18} /> Start Focus
          </Button>
        )}
      </div>

      {/* Active Session View */}
      {activeSession ? (
        <div style={{ marginBottom: '3rem' }}>
          <FocusTimer 
            startTime={activeSession.start_time} 
            targetDuration={targetDuration} 
            sessionId={activeSession.id}
            onEndSession={handleEndSession}
          />
        </div>
      ) : (
        /* Empty State or Placeholder when no session */
        <div style={{ 
          marginBottom: '3rem', 
          padding: '3rem', 
          textAlign: 'center', 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: 'var(--radius)',
          border: '2px dashed var(--border)'
        }}>
          <Zap size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ready to Focus?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Choose a duration and start tracking your deep work.
          </p>
          <Button onClick={() => setShowStartModal(true)}>Start Session</Button>
        </div>
      )}

      {/* History List */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Recent History</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sessions.filter(s => s.end_time).map((session) => (
          <Card key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                <Calendar size={20} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>{new Date(session.start_time).toLocaleDateString()}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {new Date(session.start_time).toLocaleTimeString()} - {new Date(session.end_time).toLocaleTimeString()}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Clock size={16} color="var(--text-muted)" />
              {formatDuration(session.start_time, session.end_time)}
            </div>
          </Card>
        ))}
        
        {!loading && sessions.length === 0 && !activeSession && (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
            No past sessions found.
          </div>
        )}
      </div>

      {/* Start Session Modal */}
      {showStartModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(4px)'
        }}>
          <Card style={{ width: '100%', maxWidth: '500px', padding: '2rem', margin: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Start Focus Session</h2>
              <button 
                onClick={() => setShowStartModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              {DURATIONS.map((opt) => (
                <button
                  key={opt.minutes}
                  onClick={() => handleStartSession(opt.minutes)}
                  style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  }}
                >
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {opt.minutes} min
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {opt.label}
                  </div>
                </button>
              ))}
            </div>

            <Button 
              onClick={() => handleStartSession(null)} 
              className="btn-outline"
              style={{ width: '100%', padding: '1rem' }}
            >
              Start Open-Ended Session
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
