import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Card } from '../ui';
import { Lightbulb, AlertTriangle, TrendingUp, Info } from 'lucide-react';

export default function InsightsWidget() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await api.get('/stats/insights');
        setInsights(response.data);
      } catch (error) {
        console.error("Failed to fetch insights", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) return null;
  if (!insights.length) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'productivity': return <TrendingUp size={20} color="var(--success)" />;
      case 'warning': return <AlertTriangle size={20} color="var(--warning)" />;
      case 'success': return <Lightbulb size={20} color="var(--primary)" />;
      default: return <Info size={20} color="var(--text-secondary)" />;
    }
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Lightbulb size={24} color="var(--warning)" fill="var(--warning)" style={{ opacity: 0.2 }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>AI Insights</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {insights.map((insight, index) => (
          <Card key={index} style={{ 
            borderLeft: `4px solid ${
              insight.type === 'warning' ? 'var(--warning)' : 
              insight.type === 'productivity' ? 'var(--success)' : 
              'var(--primary)'
            }` 
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ 
                padding: '0.5rem', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {getIcon(insight.type)}
              </div>
              <div>
                <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{insight.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {insight.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
