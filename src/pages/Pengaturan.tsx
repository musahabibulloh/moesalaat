import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Globe, Bell, BellOff } from 'lucide-react';

const Pengaturan: React.FC = () => {
  const { language, setLanguage, notificationsEnabled, setNotificationsEnabled } = useAppStore();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as 'id' | 'en');
  };

  const handleNotificationToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const t = {
    title: language === 'id' ? 'Pengaturan' : 'Settings',
    description: language === 'id' ? 'Atur preferensi aplikasi Anda di sini.' : 'Manage your application preferences here.',
    langLabel: language === 'id' ? 'Bahasa Aplikasi' : 'App Language',
    langDesc: language === 'id' ? 'Pilih bahasa antarmuka aplikasi.' : 'Choose the interface language.',
    notifLabel: language === 'id' ? 'Notifikasi Azan' : 'Adhan Notifications',
    notifDesc: language === 'id' ? 'Hidupkan atau matikan suara dan popup notifikasi saat waktu salat.' : 'Turn adhan sounds and popup notifications on or off.',
    on: language === 'id' ? 'Aktif' : 'On',
    off: language === 'id' ? 'Mati' : 'Off',
  };

  return (
    <div className="animate-slide-in" style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>{t.title}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{t.description}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
        {/* Language Setting */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(15, 110, 86, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)', flexShrink: 0 }}>
            <Globe size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>{t.langLabel}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>{t.langDesc}</p>
            <select 
              value={language} 
              onChange={handleLanguageChange}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--surface-color)',
                color: 'var(--text-main)',
                fontSize: '15px',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Notifications Setting */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: notificationsEnabled ? 'rgba(15, 110, 86, 0.1)' : 'rgba(239, 68, 68, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: notificationsEnabled ? 'var(--primary)' : '#ef4444', flexShrink: 0, transition: 'all 0.3s ease' }}>
            {notificationsEnabled ? <Bell size={24} /> : <BellOff size={24} />}
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>{t.notifLabel}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t.notifDesc}</p>
            </div>
            
            <button 
              onClick={handleNotificationToggle}
              style={{
                background: notificationsEnabled ? 'var(--primary)' : 'var(--surface-color)',
                border: notificationsEnabled ? 'none' : '1px solid var(--border-color)',
                color: notificationsEnabled ? 'white' : 'var(--text-main)',
                padding: '8px 20px',
                borderRadius: '20px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: notificationsEnabled ? '0 4px 12px rgba(15, 110, 86, 0.2)' : 'none'
              }}
            >
              {notificationsEnabled ? t.on : t.off}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Pengaturan;
