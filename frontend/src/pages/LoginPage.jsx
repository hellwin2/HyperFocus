import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Card } from '../components/ui';
import logo from '../assets/IsotipoHyperfocus.png';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    const success = await login(data.email, data.password);
    if (success) {
      navigate('/');
    }
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Login to your HyperFocus account</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              {...register('password', { required: 'Password is required' })} 
              placeholder="••••••••"
            />
            {errors.password && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.password.message}</span>}
          </div>

          <Button type="submit" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>



        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ fontWeight: 500 }}>Sign up</Link>
        </div>
      </Card>
    </div>
  );
}
