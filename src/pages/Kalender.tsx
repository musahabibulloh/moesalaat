import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Moon } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

interface HijriDate {
  date: string;
  day: string;
  month: { en: string; ar: string; number: number };
  year: string;
  holidays: string[];
}

interface GregorianDate {
  date: string;
  day: string;
  month: { en: string; number: number };
  year: string;
}

interface DayData {
  hijri: HijriDate;
  gregorian: GregorianDate;
}

const Kalender: React.FC = () => {
  const { language } = useAppStore();
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [calendarData, setCalendarData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  const month = currentDate.month() + 1; // 1-12
  const year = currentDate.year();

  useEffect(() => {
    fetchCalendarData(month, year);
  }, [month, year]);

  const fetchCalendarData = async (m: number, y: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://api.aladhan.com/v1/gToHCalendar/${m}/${y}`);
      if (response.data && response.data.code === 200) {
        setCalendarData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(currentDate.add(1, 'month'));
  const prevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const goToToday = () => setCurrentDate(dayjs());

  // Calendar Grid calculation
  const startDay = dayjs(new Date(year, month - 1, 1)).day(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = calendarData.length;
  
  // Fill empty slots for previous month
  const emptySlots = Array.from({ length: startDay }, (_, i) => i);
  
  const weekdays = language === 'id' 
    ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  return (
    <div className="animate-slide-in" style={{ paddingBottom: '40px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
            {language === 'id' ? 'Kalender Hijriah' : 'Hijri Calendar'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {language === 'id' ? 'Konversi tanggal Masehi ke penanggalan Hijriah' : 'Convert Gregorian dates to the Hijri calendar'}
          </p>
        </div>
        
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '8px', gap: '12px' }}>
          <button onClick={prevMonth} className="nav-item" style={{ width: '40px', height: '40px', padding: 0, justifyContent: 'center' }}>
            <ChevronLeft size={20} />
          </button>
          
          <div style={{ width: '180px', textAlign: 'center', fontWeight: '600', fontSize: '18px' }}>
            {currentDate.format('MMMM YYYY')}
          </div>
          
          <button onClick={nextMonth} className="nav-item" style={{ width: '40px', height: '40px', padding: 0, justifyContent: 'center' }}>
            <ChevronRight size={20} />
          </button>
          
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>
          
          <button onClick={goToToday} className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={16} /> {language === 'id' ? 'Hari Ini' : 'Today'}
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
        {/* Weekday Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {weekdays.map((day, idx) => (
            <div key={day} style={{ 
              textAlign: 'center', 
              fontWeight: '600', 
              color: idx === 0 ? '#ef4444' : 'var(--text-muted)',
              padding: '12px 0',
              borderBottom: '2px solid var(--border-color)'
            }}>
              {day}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
             <div className="pulse-active" style={{ color: 'var(--primary)' }}>
               <Moon size={48} />
             </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', flex: 1, gridAutoRows: '1fr' }}>
            {emptySlots.map(slot => (
              <div key={`empty-${slot}`} style={{ borderRadius: '12px', background: 'transparent' }}></div>
            ))}
            
            {calendarData.map((data, idx) => {
              const isToday = dayjs().format('DD-MM-YYYY') === data.gregorian.date;
              const isSunday = (startDay + idx) % 7 === 0;
              
              return (
                <div 
                  key={data.gregorian.date}
                  style={{
                    position: 'relative',
                    borderRadius: '12px',
                    padding: '12px',
                    border: isToday ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: isToday ? 'rgba(15, 110, 86, 0.05)' : 'var(--surface-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '100px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isToday ? 'var(--primary)' : 'var(--border-color)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ 
                      fontSize: '20px', 
                      fontWeight: '700', 
                      color: isSunday ? '#ef4444' : 'var(--text-main)'
                    }}>
                      {parseInt(data.gregorian.day, 10)}
                    </span>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: 'var(--primary)',
                      fontFamily: '"Amiri", serif'
                    }}>
                      {parseInt(data.hijri.day, 10)}
                    </span>
                  </div>
                  
                  <div style={{ marginTop: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                      {getHijriMonthName(data.hijri.month.en)} {data.hijri.year}
                    </div>
                    {data.hijri.holidays.length > 0 && (
                      <div style={{ 
                        fontSize: '10px', 
                        color: 'white', 
                        background: 'var(--secondary)', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginTop: '4px'
                      }}>
                        {data.hijri.holidays[0]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Kalender;
