import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAppStore } from './stores/useAppStore';
import Dashboard from './pages/Dashboard';
import Quran from './pages/Quran';
import Kalender from './pages/Kalender';
import Pengaturan from './pages/Pengaturan';
import { LayoutGrid, Calendar, BookOpen, Settings, Moon, Sun } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { theme, toggleTheme, language } = useAppStore();

  const navItems = [
    { path: '/', icon: <LayoutGrid size={20} />, label: language === 'id' ? 'Dashboard' : 'Dashboard' },
    { path: '/kalender', icon: <Calendar size={20} />, label: language === 'id' ? 'Kalender Hijriah' : 'Hijri Calendar' },
    { path: '/quran', icon: <BookOpen size={20} />, label: language === 'id' ? 'Al-Quran' : 'Quran' },
    { path: '/pengaturan', icon: <Settings size={20} />, label: language === 'id' ? 'Pengaturan' : 'Settings' },
  ];

  return (
    <div className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '32px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
          <BookOpen size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.2' }}>Azhan<br/><span style={{ color: 'var(--primary)' }}>Desktop</span></h2>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {navItems.map((item) => (
          <Link to={item.path} key={item.path} style={{ textDecoration: 'none' }}>
            <button className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
              {item.icon}
              {item.label}
            </button>
          </Link>
        ))}
      </div>

      <div style={{ padding: '16px 0', borderTop: '1px solid var(--border-color)' }}>
        <button className="nav-item" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          {theme === 'light' 
            ? (language === 'id' ? 'Mode Gelap' : 'Dark Mode') 
            : (language === 'id' ? 'Mode Terang' : 'Light Mode')}
        </button>
      </div>
    </div>
  );
};

const ComingSoon = ({ title }: { title: string }) => (
  <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: 'var(--text-muted)' }}>
    <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>{title}</h1>
    <p>Akan segera hadir di fase berikutnya.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/kalender" element={<Kalender />} />
            <Route path="/quran" element={<Quran />} />
            <Route path="/pengaturan" element={<Pengaturan />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
