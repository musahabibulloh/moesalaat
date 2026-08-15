import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { getNextPrayer, reverseGeocode } from '../utils/prayerTimes';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { MapPin, Clock, VolumeX } from 'lucide-react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import axios from 'axios';

dayjs.locale('id');

const Dashboard: React.FC = () => {
  const { location, setLocation, language, playAdhan, stopAdhan, isAdhanPlaying } = useAppStore();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [nextPrayer, setNextPrayer] = useState<any>(null);
  const [countdown, setCountdown] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (location) {
      const next = getNextPrayer(location.lat, location.lng);
      setNextPrayer(next);
    }
  }, [location, currentTime.date()]);

  useEffect(() => {
    if (nextPrayer && nextPrayer.time) {
      const updateCountdown = () => {
        const now = dayjs();
        const nextTime = dayjs(nextPrayer.time);
        const diff = nextTime.diff(now);
        
        if (diff <= 0) {
          triggerNotification(nextPrayer.name);
          if (location) {
            setNextPrayer(getNextPrayer(location.lat, location.lng));
          }
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      };

      const timer = setInterval(updateCountdown, 1000);
      updateCountdown();
      return () => clearInterval(timer);
    }
  }, [nextPrayer, location]);

  const translatePrayer = (name: string) => {
    const translations: Record<string, string> = {
      Fajr: 'Subuh', Sunrise: 'Syuruq', Dhuhr: 'Dzuhur', Asr: 'Ashar', Maghrib: 'Maghrib', Isha: 'Isya'
    };
    return translations[name] || name;
  };

  const triggerNotification = async (prayerName: string) => {
    const notificationsEnabled = useAppStore.getState().notificationsEnabled;
    if (!notificationsEnabled) return;

    // Play Adhan sound via the centralized store (can be stopped by user)
    try {
      await playAdhan();
    } catch (e) {
      console.log('Failed to play audio:', e);
    }

    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    
    if (permissionGranted) {
      sendNotification({
        title: `Waktu ${translatePrayer(prayerName)} Telah Tiba`,
        body: 'Mari segera menunaikan ibadah salat.',
      });
    }
  };

  const handleGetLocation = async () => {
    setIsSearchingLocation(false);
    // Attempt high-accuracy geolocation first
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const city = await reverseGeocode(lat, lng);
          setLocation(lat, lng, city);
        },
        async (err) => {
          console.warn("Geolocation denied or failed, falling back to IP geolocation", err);
          fallbackToIpGeolocation();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      fallbackToIpGeolocation();
    }
  };

  const fallbackToIpGeolocation = async () => {
    try {
      const response = await axios.get('http://ip-api.com/json/');
      if (response.data && response.data.status === 'success') {
        const { lat, lon, city } = response.data;
        setLocation(lat, lon, city);
      } else {
        throw new Error("IP Geolocation failed");
      }
    } catch (error) {
      console.error(error);
      alert("Gagal mendapatkan lokasi otomatis. Silakan cari kota Anda secara manual.");
    }
  };

  const searchLocation = async (query: string) => {
    if (!query) return;
    setSearching(true);
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
      setSearchResults(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* Location Badge */}
      <div 
        className="no-drag"
        style={{ 
          position: 'absolute', 
          top: '60px', 
          background: 'var(--glass-bg)',
          padding: '6px 16px',
          borderRadius: '24px',
          fontSize: '14px', 
          color: 'var(--text-muted)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          border: '1px solid var(--glass-border)',
          cursor: 'pointer',
          zIndex: 10
        }} 
        onClick={() => setIsSearchingLocation(true)}
      >
        <MapPin size={14} /> 
        {location ? location.city : (language === 'id' ? 'Atur Lokasi' : 'Set Location')}
      </div>

      {isSearchingLocation && (
        <div className="no-drag" style={{
          position: 'absolute',
          top: '95px',
          background: 'var(--surface-color)',
          padding: '16px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          zIndex: 50,
          width: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              autoFocus
              type="text" 
              placeholder={language === 'id' ? "Cari kota (misal: Jakarta)..." : "Search city..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchLocation(searchQuery)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', outline: 'none' }}
            />
            <button onClick={() => searchLocation(searchQuery)} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '0 12px', cursor: 'pointer', fontSize: '14px' }}>
              {language === 'id' ? 'Cari' : 'Search'}
            </button>
          </div>
          
          <button onClick={handleGetLocation} style={{ background: 'rgba(15, 110, 86, 0.1)', color: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '13px', cursor: 'pointer', marginTop: '4px', fontWeight: '500' }}>
            <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            {language === 'id' ? "Gunakan Lokasi Otomatis (GPS/IP)" : "Use Auto Location (GPS/IP)"}
          </button>

          {searching ? (
            <div style={{ textAlign: 'center', fontSize: '13px', padding: '12px', color: 'var(--text-muted)' }}>Mencari...</div>
          ) : (
            <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
              {searchResults.map((res: any, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    // Extract just the city/county name from display_name if possible
                    const cityParts = res.display_name.split(',');
                    const cityName = cityParts[0].trim();
                    setLocation(parseFloat(res.lat), parseFloat(res.lon), cityName);
                    setIsSearchingLocation(false);
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                  style={{ padding: '10px 12px', fontSize: '13px', cursor: 'pointer', borderRadius: '8px', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                >
                  {res.display_name}
                </div>
              ))}
            </div>
          )}
          
          <button onClick={() => setIsSearchingLocation(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '13px', marginTop: '8px' }}>
            {language === 'id' ? 'Tutup' : 'Close'}
          </button>
        </div>
      )}
      
      {/* Central Clock Widget */}
      <div style={{
        width: '380px', 
        height: '380px', 
        borderRadius: '50%', 
        background: 'radial-gradient(circle, var(--glass-bg) 0%, transparent 100%)',
        border: '6px solid var(--primary)',
        borderTopColor: 'var(--secondary)', /* Slight accent */
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        boxShadow: '0 0 40px rgba(15, 110, 86, 0.2)',
        position: 'relative',
        transform: 'translateY(-10px)'
      }}>
        {/* Decorative inner circle */}
        <div style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          border: '1px dashed var(--border-color)',
          animation: 'spin 60s linear infinite'
        }} />

        <style>
          {`
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}
        </style>

        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
            {nextPrayer ? translatePrayer(nextPrayer.name) : '...'}
          </div>
          
          <div style={{ fontSize: '18px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '8px', background: 'rgba(15, 110, 86, 0.1)', padding: '4px 16px', borderRadius: '16px' }}>
            {nextPrayer ? dayjs(nextPrayer.time).format('HH:mm') : '--:--'}
          </div>
          
          <div className="pulse-active" style={{ fontSize: '72px', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1', margin: '8px 0' }}>
            {countdown || '--:--'}
          </div>
          
          <div style={{ fontSize: '20px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <Clock size={18} /> {currentTime.format('HH:mm:ss')}
          </div>
        </div>
      </div>

      {/* Mini Prayer Times Arc (Optional, showing only 2 next prayers or just current date) */}
      <div style={{
        position: 'absolute',
        bottom: '120px',
        fontSize: '16px',
        color: 'var(--text-muted)',
        fontWeight: '500'
      }}>
        {currentTime.locale(language).format('dddd, D MMMM')}
      </div>

      {/* Stop Azhan Button - appears when azhan is playing */}
      {isAdhanPlaying && (
        <button
          className="no-drag"
          onClick={stopAdhan}
          style={{
            position: 'absolute',
            bottom: '80px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)',
            animation: 'pulse 1.5s infinite ease-in-out',
            zIndex: 20,
            transition: 'all 0.2s ease'
          }}
        >
          <VolumeX size={18} />
          {language === 'id' ? 'Stop Azhan' : 'Stop Adhan'}
        </button>
      )}
    </div>
  );
};

export default Dashboard;
