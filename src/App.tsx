import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAppStore } from './stores/useAppStore';
import Dashboard from './pages/Dashboard';
import Quran from './pages/Quran';
import Kalender from './pages/Kalender';
import Pengaturan from './pages/Pengaturan';
import { LayoutGrid, Calendar, BookOpen, Settings, Moon, Sun, X, Minus, Square } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { enable, isEnabled } from '@tauri-apps/plugin-autostart';

const WindowControls = () => {
  const appWindow = getCurrentWindow();
  
  return (
    <div style={{
      position: 'absolute',
      top: '15px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '8px',
      zIndex: 100
    }}>
      <button onClick={() => appWindow.minimize()} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'var(--glass-bg)', color: 'var(--text-main)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: 'var(--glass-shadow)' }}>
        <Minus size={14} />
      </button>
      <button onClick={() => appWindow.toggleMaximize()} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'var(--glass-bg)', color: 'var(--text-main)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: 'var(--glass-shadow)' }}>
        <Square size={12} />
      </button>
      <button onClick={() => appWindow.close()} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#ef4444', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)' }}>
        <X size={14} />
      </button>
    </div>
  );
};

const CircularNav = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useAppStore();

  const navItems = [
    { path: '/', icon: <LayoutGrid size={18} /> },
    { path: '/kalender', icon: <Calendar size={18} /> },
    { path: '/quran', icon: <BookOpen size={18} /> },
    { path: '/pengaturan', icon: <Settings size={18} /> },
  ];

  return (
    <div style={{
      position: 'absolute',
      bottom: '15px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '8px',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(10px)',
      padding: '8px 16px',
      borderRadius: '30px',
      boxShadow: 'var(--glass-shadow)',
      zIndex: 100,
      border: '1px solid var(--glass-border)'
    }}>
      {navItems.map((item) => (
        <Link to={item.path} key={item.path} style={{ textDecoration: 'none' }}>
          <button style={{
            background: location.pathname === item.path ? 'var(--primary)' : 'transparent',
            color: location.pathname === item.path ? 'white' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            {item.icon}
          </button>
        </Link>
      ))}
      <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 4px' }} />
      <button onClick={toggleTheme} style={{
        background: 'transparent',
        color: 'var(--text-muted)',
        border: 'none',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}>
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [scale, setScale] = React.useState(1);
  const [isMaximized, setIsMaximized] = React.useState(false);
  const [showAutoStartPrompt, setShowAutoStartPrompt] = React.useState(false);
  const appWindow = getCurrentWindow();

  React.useEffect(() => {
    const checkPrompt = async () => {
      const hasPrompted = localStorage.getItem('hasPromptedAutoStart');
      if (!hasPrompted) {
        try {
          const autoStartEnabled = await isEnabled();
          if (!autoStartEnabled) {
            setShowAutoStartPrompt(true);
          } else {
            localStorage.setItem('hasPromptedAutoStart', 'true');
          }
        } catch (e) {
          console.error('Failed to check autostart:', e);
          localStorage.setItem('hasPromptedAutoStart', 'true');
        }
      }
    };
    // Slight delay so it doesn't jarringly block the immediate first render
    setTimeout(checkPrompt, 2000);
  }, []);

  const handleAutoStartResponse = async (accept: boolean) => {
    if (accept) {
      try {
        await enable();
      } catch (e) {
        console.error('Failed to enable autostart:', e);
      }
    }
    localStorage.setItem('hasPromptedAutoStart', 'true');
    setShowAutoStartPrompt(false);
  };

  React.useEffect(() => {
    const checkMaximized = async () => {
      try {
        const maximized = await appWindow.isMaximized();
        setIsMaximized(maximized);
        
        if (!maximized) {
          const minSize = Math.min(window.innerWidth, window.innerHeight);
          setScale(minSize / 620);
        } else {
          setScale(1);
        }
      } catch (e) {
        console.error(e);
      }
    };

    const handleResize = () => {
      checkMaximized();
    };
    
    window.addEventListener('resize', handleResize);
    checkMaximized(); // Initialize
    
    // Also listen to window resize events natively from Tauri
    const unlisten = appWindow.onResized(() => {
      checkMaximized();
    });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      unlisten.then(f => f());
    };
  }, []);

  const handleDrag = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't drag if clicking buttons, inputs, links, or their children
    if (
      target.tagName !== 'BUTTON' && 
      target.tagName !== 'INPUT' && 
      target.tagName !== 'A' && 
      !target.closest('button') && 
      !target.closest('a') &&
      !target.closest('.no-drag')
    ) {
      if (e.buttons === 1) { // Only left click
        appWindow.startDragging();
      }
    }
  };

  return (
    <Router>
      <div 
        className={`app-container drag-area ${isMaximized ? 'maximized' : ''}`} 
        onMouseDown={handleDrag}
        style={{
          transform: isMaximized ? 'none' : `scale(${scale})`,
          transformOrigin: 'center center',
          width: isMaximized ? '100vw' : '600px',
          height: isMaximized ? '100vh' : '600px',
          borderRadius: isMaximized ? '0' : '50%'
        }}
      >
        <WindowControls />
        <div className="main-content drag-area" onMouseDown={handleDrag}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/kalender" element={<Kalender />} />
            <Route path="/quran" element={<Quran />} />
            <Route path="/pengaturan" element={<Pengaturan />} />
          </Routes>
        </div>
        <CircularNav />

        {showAutoStartPrompt && (
          <div className="no-drag" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: isMaximized ? '0' : '50%' }}>
            <div style={{ background: 'var(--glass-bg)', padding: '24px', borderRadius: '24px', width: '70%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '12px' }}>
                Mulai Otomatis?
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '24px', lineHeight: '1.5' }}>
                Apakah Anda ingin MOESALAAT otomatis berjalan di latar belakang setiap kali komputer Anda dinyalakan?
                <br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Anda selalu bisa mengubah ini nanti di Pengaturan)</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={() => handleAutoStartResponse(false)} style={{ padding: '10px 16px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)', cursor: 'pointer', flex: 1, fontWeight: '600', transition: 'all 0.2s' }}>
                  Tidak, Terima Kasih
                </button>
                <button onClick={() => handleAutoStartResponse(true)} style={{ padding: '10px 16px', borderRadius: '16px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', flex: 1, fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(15, 110, 86, 0.3)' }}>
                  Ya, Tentu!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
