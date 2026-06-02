import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { getPrayerTimes, getNextPrayer, reverseGeocode } from '../utils/prayerTimes';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { MapPin, Clock, Sun, Sunrise, Sunset, Moon, Search, X, Bell } from 'lucide-react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import axios from 'axios';

dayjs.locale('id');

const Dashboard: React.FC = () => {
  const { location, setLocation, language } = useAppStore();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [nextPrayer, setNextPrayer] = useState<any>(null);
  const [countdown, setCountdown] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  
  // Manual Location State
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (location) {
      const times = getPrayerTimes(location.lat, location.lng);
      setPrayerTimes(times);
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

    // Play Adhan sound
    try {
      const audio = new Audio('https://www.islamcan.com/audio/adhan/azan1.mp3');
      await audio.play();
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
    setIsLocating(true);
    
    // Attempt high-accuracy geolocation first
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const city = await reverseGeocode(lat, lng);
          setLocation(lat, lng, city);
          setIsLocating(false);
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
    } finally {
      setIsLocating(false);
    }
  };

  const searchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLocating(true);
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&accept-language=id`);
      if (response.data && response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        const simpleName = display_name.split(',')[0];
        setLocation(parseFloat(lat), parseFloat(lon), simpleName);
        setIsEditingLocation(false);
        setSearchQuery('');
      } else {
        alert("Kota tidak ditemukan. Coba masukkan nama kota yang lebih spesifik.");
      }
    } catch (error) {
      alert("Gagal mencari lokasi. Periksa koneksi internet Anda.");
    } finally {
      setIsLocating(false);
    }
  };

  const formatTime = (date: Date) => dayjs(date).format('HH:mm');
  const getIcon = (name: string) => {
    switch (name) {
      case 'Fajr': return <Moon className="w-8 h-8 opacity-70" />;
      case 'Sunrise': return <Sunrise className="w-8 h-8 opacity-70" />;
      case 'Dhuhr': return <Sun className="w-8 h-8 opacity-70" />;
      case 'Asr': return <Sun className="w-8 h-8 opacity-70" />;
      case 'Maghrib': return <Sunset className="w-8 h-8 opacity-70" />;
      case 'Isha': return <Moon className="w-8 h-8 opacity-70" />;
      default: return <Clock className="w-8 h-8 opacity-70" />;
    }
  };

  return (
    <div className="animate-slide-in" style={{ paddingBottom: '40px' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>{currentTime.locale(language).format('dddd, D MMMM YYYY')}</p>
        </div>
        
        <div className="glass-panel" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px', minWidth: '300px' }}>
          <MapPin size={20} color="var(--primary)" />
          
          <div style={{ flex: 1 }}>
            {isEditingLocation ? (
              <form onSubmit={searchLocation} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'id' ? "Cari nama kota..." : "Search city name..."}
                  autoFocus
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-color)',
                    background: 'var(--surface-color)',
                    color: 'var(--text-main)',
                    width: '100%',
                    outline: 'none'
                  }}
                />
                <button type="button" onClick={() => setIsEditingLocation(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={16} />
                </button>
              </form>
            ) : (
              <>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{language === 'id' ? 'Lokasi Saat Ini' : 'Current Location'}</div>
                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {location ? location.city : (language === 'id' ? 'Belum diatur' : 'Not set')}
                  <button 
                    onClick={() => setIsEditingLocation(true)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}
                    title={language === 'id' ? 'Ubah Lokasi Manual' : 'Change Location Manually'}
                  >
                    <Search size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
          
          {!isEditingLocation && (
            <button 
              className="btn-primary" 
              style={{ padding: '8px 16px', fontSize: '12px', whiteSpace: 'nowrap' }}
              onClick={handleGetLocation}
              disabled={isLocating}
            >
              {isLocating 
                ? (language === 'id' ? 'Mencari...' : 'Locating...') 
                : 'Auto GPS'}
            </button>
          )}
        </div>
      </div>

      {/* Main Clock & Countdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative background element */}
          <div style={{ position: 'absolute', width: '200px', height: '200px', background: 'var(--primary)', opacity: '0.05', borderRadius: '50%', top: '-50px', right: '-50px' }}></div>
          
          <div style={{ fontSize: '64px', fontWeight: '700', lineHeight: '1', color: 'var(--primary)', marginBottom: '8px' }}>
            {currentTime.format('HH:mm')}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-muted)' }}>
            {currentTime.format('ss')} {language === 'id' ? 'Detik' : 'Seconds'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', color: 'white', position: 'relative' }}>
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', opacity: 0.9 }}>
            {language === 'id' ? 'Menuju' : 'Towards'} {nextPrayer ? translatePrayer(nextPrayer.name) : '...'}
          </div>
          <div className="pulse-active" style={{ fontSize: '56px', fontWeight: '700', lineHeight: '1' }}>
            {countdown || '--:--:--'}
          </div>
        </div>
      </div>

      {/* Prayer Times Grid */}
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
        {language === 'id' ? 'Jadwal Salat Hari Ini' : "Today's Prayer Times"}
      </h2>
      
      {!location ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {language === 'id' ? 'Silakan atur lokasi terlebih dahulu untuk melihat jadwal salat.' : 'Please set your location first to view prayer times.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayerName) => {
            const isNext = nextPrayer?.name === prayerName;
            
            return (
              <div 
                key={prayerName} 
                className="glass-panel"
                style={{ 
                  padding: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  border: isNext ? '2px solid var(--secondary)' : '',
                  transform: isNext ? 'translateY(-4px)' : '',
                  transition: 'all 0.3s ease',
                  background: isNext ? 'rgba(201, 168, 76, 0.05)' : ''
                }}
              >
                <div style={{ color: isNext ? 'var(--secondary)' : 'var(--primary)', marginBottom: '12px' }}>
                  {getIcon(prayerName)}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                  {translatePrayer(prayerName)}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: isNext ? 'var(--secondary)' : 'var(--text-main)' }}>
                  {prayerTimes ? formatTime(prayerTimes[prayerName]) : '--:--'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
