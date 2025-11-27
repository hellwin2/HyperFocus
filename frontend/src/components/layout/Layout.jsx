import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, Timer, LogOut, Moon, Sun, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import '../../styles/layout.css';
import logo from '../../assets/IsotipoHyperfocus.png';

export default function Layout() {
  const { logout, user } = useAuthStore();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/sessions', label: 'Sessions', icon: Timer },
  ];

  return (
    <div className="layout-container">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="sidebar-header" style={{ marginBottom: 0 }}>
          <div className="logo-icon" style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src={logo} alt="HyperFocus Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>HyperFocus</h1>
        </div>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon" style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src={logo} alt="HyperFocus Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>HyperFocus</h1>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user?.name}</span>
            <button onClick={toggleTheme} className="theme-toggle">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="page-container">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={24} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button 
          onClick={logout}
          className="mobile-nav-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <LogOut size={24} />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}
