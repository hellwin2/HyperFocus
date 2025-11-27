import { useState, useEffect, useMemo } from 'react';
import { Square, Plus, Minimize2, Maximize2, AlertCircle, X } from 'lucide-react';
import { Button, Card, Input } from '../ui';
import api from '../../api/axios';

export default function FocusTimer({ startTime, targetDuration, sessionId, onEndSession }) {
  const [elapsed, setElapsed] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Interruption State
  const [showInterruptionModal, setShowInterruptionModal] = useState(false);
  const [intType, setIntType] = useState('external'); // Phone, Email, Colleague
  const [intDesc, setIntDesc] = useState('');
  const [intDuration, setIntDuration] = useState(1); // Duration in minutes

  // Memoize start timestamp to prevent re-calculations
  // Ensure we treat the startTime as UTC by appending 'Z' if it's missing timezone info
  const startTimestamp = useMemo(() => {
    const timeStr = startTime.endsWith('Z') || startTime.includes('+') ? startTime : `${startTime}Z`;
    return new Date(timeStr).getTime();
  }, [startTime]);

  useEffect(() => {
    // Initial calculation
    const calculateElapsed = () => {
      const now = new Date().getTime();
      setElapsed(Math.floor((now - startTimestamp) / 1000));
    };
    
    calculateElapsed(); // Update immediately

    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTimestamp]);

  const handleLogInterruption = async (e) => {
    e.preventDefault();
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + intDuration * 60000); // Calculate end time based on duration
      
      await api.post('/interruptions/', {
        session_id: sessionId,
        type: intType,
        description: intDesc,
        start_time: now.toISOString(),
        end_time: endTime.toISOString()
      });
      setShowInterruptionModal(false);
      setIntDesc('');
      setIntDuration(1); // Reset to default
      // Removed alert as requested
    } catch (error) {
      console.error("Failed to log interruption", error);
      alert("Error logging interruption");
    }
  };

  // Calculate time display
  const totalSeconds = targetDuration ? targetDuration * 60 : 0;
  const remainingSeconds = targetDuration ? Math.max(0, totalSeconds - elapsed) : elapsed;
  const isOvertime = targetDuration && elapsed > totalSeconds;
  
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Progress Ring Calculation
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = targetDuration ? Math.max(0, (totalSeconds - elapsed) / totalSeconds) : 1;
  const strokeDashoffset = circumference - progress * circumference;

  if (isMinimized) {
    return (
      <Card style={{ 
        position: 'fixed', 
        bottom: '2rem', 
        right: '2rem', 
        zIndex: 50,
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--primary)',
        animation: 'slideIn 0.3s ease-out'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.25rem', fontVariantNumeric: 'tabular-nums' }}>
          {isOvertime ? '+' : ''}{formatTime(isOvertime ? elapsed - totalSeconds : remainingSeconds)}
        </div>
        <Button onClick={() => setIsMinimized(false)} className="btn-outline" style={{ padding: '0.25rem' }}>
          <Maximize2 size={16} />
        </Button>
      </Card>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '3rem 1rem',
      position: 'relative'
    }}>
      <Button 
        onClick={() => setIsMinimized(true)} 
        className="btn-outline"
        style={{ position: 'absolute', top: 0, right: 0, border: 'none' }}
      >
        <Minimize2 size={20} />
      </Button>

      {/* Timer Circle */}
      <div style={{ position: 'relative', width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Background Ring */}
        <svg width="300" height="300" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          <circle
            cx="150"
            cy="150"
            r={radius}
            stroke="var(--border)"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Progress Ring */}
          {targetDuration && (
            <circle
              cx="150"
              cy="150"
              r={radius}
              stroke={isOvertime ? 'var(--danger)' : 'var(--primary)'}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={isOvertime ? 0 : strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
            />
          )}
        </svg>

        {/* Time Display */}
        <div style={{ textAlign: 'center', zIndex: 10 }}>
          <div style={{ 
            fontSize: '4rem', 
            fontWeight: 'bold', 
            fontVariantNumeric: 'tabular-nums',
            color: isOvertime ? 'var(--danger)' : 'var(--text-primary)',
            textShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            {isOvertime ? '+' : ''}{formatTime(isOvertime ? elapsed - totalSeconds : remainingSeconds)}
          </div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>
            {isOvertime ? 'Overtime' : targetDuration ? 'Focusing...' : 'Deep Work'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
        <Button 
          onClick={() => setShowInterruptionModal(true)}
          className="btn-outline"
          style={{ 
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertCircle size={20} />
          Log Interruption
        </Button>

        <Button 
          onClick={onEndSession}
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            color: 'var(--danger)', 
            border: '1px solid var(--border)',
            padding: '0.75rem 2rem',
            fontSize: '1.1rem'
          }}
        >
          <Square size={20} style={{ marginRight: '0.5rem' }} fill="currentColor" />
          Stop Session
        </Button>
      </div>

      {/* Interruption Modal */}
      {showInterruptionModal && (
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
          <Card style={{ width: '100%', maxWidth: '400px', padding: '2rem', margin: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Log Interruption</h2>
              <button 
                onClick={() => setShowInterruptionModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleLogInterruption} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Type</label>
                <select 
                  value={intType}
                  onChange={(e) => setIntType(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius)', 
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="external">External (Phone, Colleague)</option>
                  <option value="digital">Digital (Email, Slack)</option>
                  <option value="internal">Internal (Daydreaming)</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <Input 
                placeholder="Description (e.g. Boss called)" 
                value={intDesc}
                onChange={(e) => setIntDesc(e.target.value)}
                required
              />

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Duration (minutes)</label>
                <Input 
                  type="number"
                  min="1"
                  value={intDuration}
                  onChange={(e) => setIntDuration(parseInt(e.target.value) || 1)}
                  required
                />
              </div>
              
              <Button type="submit">Save Log</Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
