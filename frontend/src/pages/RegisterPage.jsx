import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Card } from '../components/ui';
import logo from '../assets/IsotipoHyperfocus.png';
import { useState, useEffect } from 'react';

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const { register: registerUser, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  
  const password = watch('password', '');
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    let score = 0;
    if (!password) {
      setStrength(0);
      return;
    }
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    setStrength(score);
  }, [password]);

  const onSubmit = async (data) => {
    if (strength < 5) return; // Enforce max strength
    const success = await registerUser(data.name, data.email, data.password);
    if (success) {
      navigate('/login');
    }
  };

  const getStrengthColor = () => {
    if (strength <= 2) return 'var(--danger)';
    if (strength <= 4) return '#FFBB28'; // Orange/Yellow
    return 'var(--success)';
  };

  const getStrengthLabel = () => {
    if (strength === 0) return '';
    if (strength <= 2) return 'Weak';
    if (strength <= 4) return 'Medium';
    return 'Strong';
  };

  return (
    <div style={{ 
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'var(--bg-secondary)',
      zIndex: 9999
    }}>
      <Card className="w-full max-w-md" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={logo} alt="HyperFocus" style={{ width: '64px', height: '64px', margin: '0 auto 1rem', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Create an account</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Start tracking your focus today</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Full Name</label>
            <Input 
              {...register('name', { required: 'Name is required' })} 
              placeholder="John Doe"
            />
            {errors.name && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.name.message}</span>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
            <Input 
              type="email" 
              {...register('email', { required: 'Email is required' })} 
              placeholder="you@example.com"
            />
            {errors.email && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.email.message}</span>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
            <Input 
              type="password" 
              {...register('password', { 
                required: 'Password is required', 
                validate: () => strength >= 5 || "Password must be strong (8+ chars, uppercase, lowercase, number, special)"
              })} 
              placeholder="••••••••"
            />
            
            {/* Strength Meter */}
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '4px', height: '4px' }}>
              {[1, 2, 3, 4, 5].map((level) => (
                <div 
                  key={level} 
                  style={{ 
                    flex: 1, 
                    borderRadius: '2px', 
                    backgroundColor: strength >= level ? getStrengthColor() : 'var(--border)',
                    transition: 'background-color 0.3s'
                  }} 
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {strength < 5 && "Must contain Upper, Lower, Number, Special"}
              </span>
              <span style={{ fontSize: '0.75rem', color: getStrengthColor(), fontWeight: 600 }}>
                {getStrengthLabel()}
              </span>
            </div>

            {errors.password && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.password.message}</span>}
          </div>

          <Button type="submit" disabled={isLoading || strength < 5} style={{ marginTop: '0.5rem' }}>
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>



        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 500 }}>Login</Link>
        </div>
      </Card>
    </div>
  );
}
