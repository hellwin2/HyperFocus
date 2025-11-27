import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { Card } from '../components/ui';
import { InsightsWidget } from '../components/features';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { Clock, AlertCircle, CheckCircle, Calendar, PieChart as PieIcon, Activity } from 'lucide-react';

// Apple Watch Activity Colors
const APPLE_COLORS = {
  move: '#FA114F',    // Red/Pink
  exercise: '#A0FF03', // Neon Green
  stand: '#00E0FF',   // Cyan/Blue
  purple: '#BF5AF2',  // Apple Purple
  orange: '#FF9500',  // Apple Orange
};

const PIE_COLORS = [APPLE_COLORS.move, APPLE_COLORS.exercise, APPLE_COLORS.stand, APPLE_COLORS.purple, APPLE_COLORS.orange];

export default function DashboardPage() {
  const { user } = useAuthStore();
  
  // State
  const [summary, setSummary] = useState(null);
  const [interruptionTypes, setInterruptionTypes] = useState([]);
  const [weeklyPattern, setWeeklyPattern] = useState([]);
  const [productiveHours, setProductiveHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');

  useEffect(() => {
    const fetchAllStats = async () => {
      setLoading(true);
      try {
        const [summaryRes, typesRes, weeklyRes, hoursRes] = await Promise.all([
          api.get(`/stats/summary?range=${range}`),
          api.get(`/stats/interruption-types?range=${range}`),
          api.get(`/stats/weekly-pattern?range=${range}`),
          api.get(`/stats/productive-hours?range=${range}`)
        ]);

        setSummary(summaryRes.data || {});
        
        // Extract and transform data
        const typesData = typesRes.data?.counts || {};
        const mappedTypes = Object.entries(typesData).map(([name, value]) => ({ name, value }));
        setInterruptionTypes(mappedTypes);

        setWeeklyPattern(Array.isArray(weeklyRes.data?.days) ? weeklyRes.data.days : []);
        setProductiveHours(Array.isArray(hoursRes.data?.hours) ? hoursRes.data.hours : []);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, [range]);

  if (loading) return <div>Loading dashboard...</div>;

  const cards = [
    { label: 'Total Sessions', value: summary?.total_sessions || 0, icon: Clock, color: 'text-blue-500' },
    { label: 'Interruptions', value: summary?.total_interruptions || 0, icon: AlertCircle, color: 'text-red-500' },
    { label: 'Effective Hours', value: (summary?.effective_time_seconds / 3600).toFixed(1) || 0, icon: CheckCircle, color: 'text-green-500' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Dashboard</h1>
        <select 
          value={range} 
          onChange={(e) => setRange(e.target.value)}
          style={{ 
            padding: '0.5rem', 
            borderRadius: 'var(--radius)', 
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)'
          }}
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>
      
      <InsightsWidget />
      
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>{card.label}</span>
                <Icon size={20} style={{ opacity: 0.7 }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{card.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Interruption Types - Pie Chart */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <PieIcon size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Interruption Types</h3>
          </div>
          <div style={{ height: '300px', width: '100%', minHeight: '300px' }}>
            {interruptionTypes && interruptionTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={interruptionTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {interruptionTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={false}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No interruption data available
              </div>
            )}
          </div>
        </Card>

        {/* Weekly Pattern - Bar Chart */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Weekly Activity</h3>
          </div>
          <div style={{ height: '300px', width: '100%', minHeight: '300px' }}>
            {weeklyPattern && weeklyPattern.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyPattern}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="sessions" fill={APPLE_COLORS.exercise} radius={[8, 8, 0, 0]} name="Work (h)" />
                  <Bar dataKey="lost" fill={APPLE_COLORS.move} radius={[8, 8, 0, 0]} name="Lost (h)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No weekly data available
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Productive Hours - Area Chart */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Activity size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Productivity by Hour</h3>
        </div>
        <div style={{ height: '300px', width: '100%', minHeight: '300px' }}>
          {productiveHours && productiveHours.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productiveHours}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="hour" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(h) => `${h}:00`} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={false}
                />
                <Area type="monotone" dataKey="productivity_score" stroke={APPLE_COLORS.stand} fill={APPLE_COLORS.stand} fillOpacity={0.2} name="Productivity Score" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              No productivity data available
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
