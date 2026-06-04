import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Globe, Bell, BellOff, Power, PowerOff } from 'lucide-react';
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';

const Pengaturan: React.FC = () => {
  const { language, setLanguage, notificationsEnabled, setNotificationsEnabled } = useAppStore();

  const handleLanguageChange = (lang: 'id' | 'en') => {
    setLanguage(lang);
  };

  const handleNotificationToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const [autoStart, setAutoStart] = React.useState(false);

  React.useEffect(() => {
    const checkAutoStart = async () => {
      try {
        const enabled = await isEnabled();
        setAutoStart(enabled);
      } catch (e) {
        console.error('AutoStart check error:', e);
      }
    };
    checkAutoStart();
  }, []);

  const handleAutoStartToggle = async () => {
    try {
      if (autoStart) {
        await disable();
        setAutoStart(false);
      } else {
        await enable();
        setAutoStart(true);
      }
    } catch (e) {
      console.error('AutoStart toggle error:', e);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px', marginTop: '20px', color: 'var(--text-main)' }}>
        {language === 'id' ? 'Pengaturan' : 'Settings'}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '420px' }}>
        
        {/* Language */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', padding: '16px 20px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
            <Globe size={24} />
            <span style={{ fontSize: '18px', fontWeight: '500' }}>{language === 'id' ? 'Bahasa' : 'Language'}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleLanguageChange('id')} style={{ background: language === 'id' ? 'var(--primary)' : 'transparent', color: language === 'id' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '14px', padding: '6px 12px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.3s' }}>ID</button>
            <button onClick={() => handleLanguageChange('en')} style={{ background: language === 'en' ? 'var(--primary)' : 'transparent', color: language === 'en' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '14px', padding: '6px 12px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.3s' }}>EN</button>
          </div>
        </div>

        {/* Notifications */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', padding: '16px 20px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
            {notificationsEnabled ? <Bell size={24} color="var(--primary)" /> : <BellOff size={24} color="var(--text-muted)" />}
            <span style={{ fontSize: '18px', fontWeight: '500' }}>{language === 'id' ? 'Notifikasi' : 'Notifications'}</span>
          </div>
          <button className="no-drag" onClick={handleNotificationToggle} style={{ background: notificationsEnabled ? 'var(--primary)' : 'transparent', color: notificationsEnabled ? 'white' : 'var(--text-muted)', border: notificationsEnabled ? 'none' : '1px solid var(--border-color)', borderRadius: '14px', padding: '6px 16px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.3s' }}>
            {notificationsEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Auto Start */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', padding: '16px 20px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
            {autoStart ? <Power size={24} color="var(--primary)" /> : <PowerOff size={24} color="var(--text-muted)" />}
            <span style={{ fontSize: '18px', fontWeight: '500' }}>{language === 'id' ? 'Mulai Otomatis (Startup)' : 'Start on Boot'}</span>
          </div>
          <button className="no-drag" onClick={handleAutoStartToggle} style={{ background: autoStart ? 'var(--primary)' : 'transparent', color: autoStart ? 'white' : 'var(--text-muted)', border: autoStart ? 'none' : '1px solid var(--border-color)', borderRadius: '14px', padding: '6px 16px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.3s' }}>
            {autoStart ? 'ON' : 'OFF'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Pengaturan;
