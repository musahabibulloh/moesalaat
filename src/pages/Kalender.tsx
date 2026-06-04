import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { Calendar as CalendarIcon, Moon, ChevronLeft, ChevronRight, WifiOff, RefreshCw } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

const Kalender: React.FC = () => {
  const { language } = useAppStore();
  const [currentDate] = useState(dayjs());
  const [todayData, setTodayData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'today' | 'month'>('today');
  const [selectedMonthDate, setSelectedMonthDate] = useState(dayjs());
  const [monthData, setMonthData] = useState<any[]>([]);
  const [loadingMonth, setLoadingMonth] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.onLine) {
      setError(language === 'id' ? 'Anda harus terhubung ke internet untuk memuat Kalender.' : 'You must be connected to the internet to load the Calendar.');
      setLoading(false);
    } else {
      fetchToday();
    }

    const handleOnline = () => {
      setError(null);
      if (!todayData) fetchToday();
    };
    const handleOffline = () => {
      setError(language === 'id' ? 'Koneksi internet terputus.' : 'Internet connection lost.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentDate, language]);

  const fetchToday = async () => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = currentDate.format('DD-MM-YYYY');
      const response = await axios.get(`https://api.aladhan.com/v1/gToH/${dateStr}`);
      if (response.data && response.data.code === 200) {
        setTodayData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch calendar:', error);
      setError(language === 'id' ? 'Gagal memuat data. Pastikan Anda terhubung ke internet.' : 'Failed to load data. Please ensure you are connected to the internet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'month') {
      fetchMonth();
    }
  }, [viewMode, selectedMonthDate]);

  const fetchMonth = async () => {
    if (!navigator.onLine) {
      alert(language === 'id' ? 'Anda harus terhubung ke internet untuk memuat bulan ini.' : 'You must be connected to the internet to load this month.');
      return;
    }
    setLoadingMonth(true);
    try {
      const response = await axios.get(`https://api.aladhan.com/v1/gToHCalendar/${selectedMonthDate.format('M')}/${selectedMonthDate.format('YYYY')}`);
      if (response.data && response.data.code === 200) {
        setMonthData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch month calendar:', error);
      alert(language === 'id' ? 'Gagal memuat data bulan ini. Pastikan koneksi stabil.' : 'Failed to load this month. Ensure stable connection.');
    } finally {
      setLoadingMonth(false);
    }
  };

  const getHijriMonthName = (enName: string) => {
    if (language === 'en') return enName;
    const translations: Record<string, string> = {
      "Muharram": "Muharram",
      "Safar": "Safar",
      "Rabi' al-awwal": "Rabiul Awal",
      "Rabi' al-thani": "Rabiul Akhir",
      "Jumada al-awwal": "Jumadil Awal",
      "Jumada al-thani": "Jumadil Akhir",
      "Rajab": "Rajab",
      "Sha'ban": "Sya'ban",
      "Ramadan": "Ramadan",
      "Shawwal": "Syawal",
      "Dhu al-Qi'dah": "Dzulqa'dah",
      "Dhu al-Hijjah": "Dzulhijjah"
    };
    return translations[enName] || enName;
  };

  const renderCalendarGrid = () => {
    if (loadingMonth) {
      return (
        <div className="pulse-active" style={{ color: 'var(--primary)' }}>
          <Moon size={48} />
        </div>
      );
    }

    const days = ['Ahd', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const headers = language === 'id' ? days : daysEn;
    
    const startDay = selectedMonthDate.startOf('month').day();
    const blanks = Array(startDay).fill(null);
    
    // Check what hijri months are in this gregorian month
    const hijriMonths = Array.from(new Set(monthData.map(d => d.hijri.month.en)));
    const hijriMonthsStr = hijriMonths.map(m => getHijriMonthName(m as string)).join(' / ');
    const hijriYears = Array.from(new Set(monthData.map(d => d.hijri.year))).join(' / ');

    return (
      <div className="no-drag" style={{ width: '460px', padding: '24px', background: 'var(--glass-bg)', borderRadius: '32px', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button onClick={() => setSelectedMonthDate(selectedMonthDate.subtract(1, 'month'))} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-main)', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <ChevronLeft size={18} />
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>
              {selectedMonthDate.locale(language).format('MMMM YYYY')}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--secondary)', fontWeight: '600' }}>
              {hijriMonthsStr} {hijriYears}
            </div>
          </div>
          
          <button onClick={() => setSelectedMonthDate(selectedMonthDate.add(1, 'month'))} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-main)', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <ChevronRight size={18} />
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px' }}>
          {headers.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>{d}</div>
          ))}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {blanks.map((_, i) => <div key={`blank-${i}`} />)}
          
          {monthData.map((dayData, index) => {
            const isToday = dayData.gregorian.date === currentDate.format('DD-MM-YYYY');
            return (
              <div key={index} style={{
                background: isToday ? 'var(--primary)' : 'var(--surface-color)',
                color: isToday ? 'white' : 'var(--text-main)',
                borderRadius: '12px',
                padding: '6px 2px',
                textAlign: 'center',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isToday ? '0 4px 12px rgba(15, 110, 86, 0.3)' : 'none'
              }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: '1' }}>{dayData.gregorian.day}</div>
                <div style={{ fontSize: '11px', marginTop: '4px', color: isToday ? 'rgba(255,255,255,0.85)' : 'var(--secondary)', fontWeight: '500' }}>
                  {dayData.hijri.day}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (error && !todayData && viewMode === 'today') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 40px', textAlign: 'center' }}>
        <div style={{ background: 'var(--glass-bg)', padding: '24px', borderRadius: '24px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'var(--glass-shadow)' }}>
          <WifiOff size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>
            {language === 'id' ? 'Tidak Ada Internet' : 'No Internet'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            {error}
          </div>
          <button 
            className="no-drag"
            onClick={fetchToday}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}
          >
            <RefreshCw size={16} />
            {language === 'id' ? 'Coba Lagi' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      
      {/* Toggle View Buttons */}
      <div className="no-drag" style={{ position: 'absolute', top: '50px', zIndex: 10 }}>
        <div style={{ display: 'flex', background: 'var(--glass-bg)', borderRadius: '24px', border: '1px solid var(--glass-border)', overflow: 'hidden', boxShadow: 'var(--glass-shadow)' }}>
          <button 
            onClick={() => setViewMode('today')}
            style={{ padding: '8px 20px', background: viewMode === 'today' ? 'var(--primary)' : 'transparent', color: viewMode === 'today' ? 'white' : 'var(--text-main)', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.3s' }}
          >
            {language === 'id' ? 'Hari Ini' : 'Today'}
          </button>
          <button 
            onClick={() => setViewMode('month')}
            style={{ padding: '8px 20px', background: viewMode === 'month' ? 'var(--primary)' : 'transparent', color: viewMode === 'month' ? 'white' : 'var(--text-main)', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.3s' }}
          >
            {language === 'id' ? 'Bulan Ini' : 'This Month'}
          </button>
        </div>
      </div>

      {viewMode === 'today' ? (
        loading ? (
          <div className="pulse-active" style={{ color: 'var(--primary)' }}>
            <Moon size={48} />
          </div>
        ) : (
          <div style={{
            width: '380px', height: '380px', borderRadius: '50%', 
            background: 'radial-gradient(circle, var(--glass-bg) 0%, transparent 100%)',
            border: '6px solid var(--secondary)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(201, 168, 76, 0.2)',
            position: 'relative', transform: 'translateY(10px)'
          }}>
            <CalendarIcon size={32} style={{ color: 'var(--secondary)', marginBottom: '12px' }} />
            
            <div style={{ fontSize: '96px', fontWeight: 'bold', color: 'var(--primary)', lineHeight: '1', marginBottom: '8px' }}>
               {todayData?.hijri?.day}
            </div>
            
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-main)', textAlign: 'center', padding: '0 20px' }}>
               {todayData?.hijri?.month?.en ? getHijriMonthName(todayData.hijri.month.en) : ''} {todayData?.hijri?.year}
            </div>
            
            <div style={{ fontSize: '16px', color: 'var(--text-muted)', marginTop: '12px' }}>
               {currentDate.locale(language).format('D MMMM YYYY')}
            </div>
            
            {todayData?.hijri?.holidays?.length > 0 && (
              <div style={{ marginTop: '16px', fontSize: '14px', background: 'var(--primary)', color: 'white', padding: '6px 16px', borderRadius: '16px', textAlign: 'center', maxWidth: '240px' }}>
                 {todayData.hijri.holidays[0]}
              </div>
            )}
          </div>
        )
      ) : (
        <div style={{ transform: 'translateY(20px)' }}>
          {renderCalendarGrid()}
        </div>
      )}
    </div>
  );
};

export default Kalender;
