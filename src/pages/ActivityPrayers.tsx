import React, { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check,
  Sunrise, 
  Sun, 
  CloudSun, 
  Sunset, 
  Moon
} from 'lucide-react';
import { usePrayerActivityStore, PrayerKey } from '../stores/usePrayerActivityStore';
import { useAppStore } from '../stores/useAppStore';
import { PrayerHeatmap } from '../components/PrayerHeatmap';
import { getPrayerTimes } from '../utils/prayerTimes';

const ActivityPrayers: React.FC = () => {
  const { language, location } = useAppStore();
  const { 
    selectedDate, 
    setSelectedDate, 
    togglePrayer, 
    setAllPrayers, 
    getPrayerRecord, 
    getPrayerCount, 
    getStats,
    resetAllData
  } = usePrayerActivityStore();

  const [isMaximized, setIsMaximized] = useState(window.innerWidth > 650);

  useEffect(() => {
    const handleResize = () => setIsMaximized(window.innerWidth > 650);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const stats = getStats();
  const todayStr = dayjs().format('YYYY-MM-DD');
  const isSelectedToday = selectedDate === todayStr;

  const currentRecord = getPrayerRecord(selectedDate);
  const currentCount = getPrayerCount(selectedDate);

  // Compute actual prayer schedule times if location is available
  const prayerTimesMap = useMemo(() => {
    if (!location) return null;
    try {
      const targetDate = dayjs(selectedDate).toDate();
      const times = getPrayerTimes(location.lat, location.lng, targetDate);
      return {
        fajr: dayjs(times.Fajr).format('HH:mm'),
        dhuhr: dayjs(times.Dhuhr).format('HH:mm'),
        asr: dayjs(times.Asr).format('HH:mm'),
        maghrib: dayjs(times.Maghrib).format('HH:mm'),
        isha: dayjs(times.Isha).format('HH:mm'),
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [location, selectedDate]);

  const prayerItems: Array<{
    key: PrayerKey;
    name: string;
    icon: React.ReactNode;
    time?: string;
  }> = [
    {
      key: 'fajr',
      name: language === 'id' ? 'Subuh' : 'Fajr',
      icon: <Sunrise size={17} />,
      time: prayerTimesMap?.fajr || '04:30',
    },
    {
      key: 'dhuhr',
      name: language === 'id' ? 'Dzuhur' : 'Dhuhr',
      icon: <Sun size={17} />,
      time: prayerTimesMap?.dhuhr || '11:55',
    },
    {
      key: 'asr',
      name: language === 'id' ? 'Ashar' : 'Asr',
      icon: <CloudSun size={17} />,
      time: prayerTimesMap?.asr || '15:15',
    },
    {
      key: 'maghrib',
      name: language === 'id' ? 'Maghrib' : 'Maghrib',
      icon: <Sunset size={17} />,
      time: prayerTimesMap?.maghrib || '17:58',
    },
    {
      key: 'isha',
      name: language === 'id' ? 'Isya' : 'Isha',
      icon: <Moon size={17} />,
      time: prayerTimesMap?.isha || '19:10',
    },
  ];

  const handlePrevDay = () => {
    const prev = dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD');
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = dayjs(selectedDate).add(1, 'day');
    if (!next.isAfter(dayjs(), 'day')) {
      setSelectedDate(next.format('YYYY-MM-DD'));
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px 0',
      position: 'relative',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: isMaximized ? '780px' : '440px',
        maxWidth: '92%',
        height: '100%',
        transition: 'width 0.25s ease'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginTop: '46px', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.3px' }}>
            {language === 'id' ? 'Aktivitas Sholat' : 'Prayer Activity'}
          </h1>
          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {language === 'id' ? 'Catatan konsistensi ibadah 5 waktu' : 'Daily 5-time prayer log and consistency'}
          </p>
        </div>

        {/* Scrollable Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingRight: '2px',
          paddingBottom: '75px'
        }}>
          {/* Subtle Stats Strip (No candy-colored cards) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            background: 'var(--glass-bg)',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            padding: '10px 14px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Streak
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                {stats.currentStreak} <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-muted)' }}>{language === 'id' ? 'hari' : 'd'}</span>
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                5/5 {language === 'id' ? 'Lengkap' : 'Full'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                {stats.perfectDays} <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-muted)' }}>{language === 'id' ? 'hari' : 'd'}</span>
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {language === 'id' ? 'Bulan Ini' : 'This Mo.'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                {stats.monthCompletionRate}%
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Total
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                {stats.totalCompleted}
              </div>
            </div>
          </div>

          {/* Activity Heatmap Panel */}
          <div style={{
            background: 'var(--glass-bg)',
            borderRadius: '16px',
            padding: '14px 16px 10px 16px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-main)' }}>
                {language === 'id' ? 'Riwayat Aktivitas' : 'Activity History'}
              </span>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                {language === 'id' ? 'Pilih kotak untuk mencatat' : 'Select a date'}
              </span>
            </div>

            <PrayerHeatmap
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
            />
          </div>

          {/* Daily Prayer Checklist Panel */}
          <div style={{
            background: 'var(--glass-bg)',
            borderRadius: '16px',
            padding: '14px 16px',
            border: '1px solid var(--border-color)'
          }}>
            {/* Date Switcher */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <button
                className="no-drag"
                onClick={handlePrevDay}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'var(--surface-color)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={15} />
              </button>

              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-main)' }}>
                  {dayjs(selectedDate).locale(language).format('dddd, D MMMM YYYY')}
                </span>
                {!isSelectedToday && (
                  <button
                    className="no-drag"
                    onClick={() => setSelectedDate(todayStr)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      marginLeft: '6px',
                      textDecoration: 'underline'
                    }}
                  >
                    ({language === 'id' ? 'Hari ini' : 'Today'})
                  </button>
                )}
              </div>

              <button
                className="no-drag"
                onClick={handleNextDay}
                disabled={isSelectedToday}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'var(--surface-color)',
                  border: '1px solid var(--border-color)',
                  color: isSelectedToday ? 'var(--text-muted)' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSelectedToday ? 'default' : 'pointer',
                  opacity: isSelectedToday ? 0.35 : 1
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Micro Progress Line */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11.5px',
              color: 'var(--text-muted)',
              marginBottom: '10px'
            }}>
              <span>{language === 'id' ? 'Progres' : 'Progress'}</span>
              <span style={{ fontWeight: '600', color: currentCount === 5 ? 'var(--primary)' : 'var(--text-main)' }}>
                {currentCount}/5
              </span>
            </div>

            {/* List of 5 Prayers (Cohesive Monochromatic Palette) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {prayerItems.map((prayer) => {
                const isCompleted = !!currentRecord[prayer.key];

                return (
                  <div
                    key={prayer.key}
                    className="no-drag"
                    onClick={() => togglePrayer(selectedDate, prayer.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      background: isCompleted 
                        ? 'rgba(15, 110, 86, 0.08)' 
                        : 'var(--surface-color)',
                      border: `1px solid ${isCompleted ? 'rgba(15, 110, 86, 0.25)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: isCompleted ? 'var(--primary)' : 'var(--bg-color)',
                        color: isCompleted ? 'white' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}>
                        {prayer.icon}
                      </div>
                      <div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: isCompleted ? '600' : '500',
                          color: isCompleted ? 'var(--primary)' : 'var(--text-main)',
                          lineHeight: '1.2'
                        }}>
                          {prayer.name}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          {prayer.time}
                        </div>
                      </div>
                    </div>

                    {/* Minimal Toggle Box */}
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '5px',
                      background: isCompleted ? 'var(--primary)' : 'transparent',
                      border: isCompleted ? 'none' : '1.5px solid var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      transition: 'all 0.15s ease'
                    }}>
                      {isCompleted ? <Check size={13} strokeWidth={3} /> : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              marginTop: '10px'
            }}>
              <button
                className="no-drag"
                onClick={() => setAllPrayers(selectedDate, false)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {language === 'id' ? 'Kosongkan' : 'Reset'}
              </button>

              <button
                className="no-drag"
                onClick={() => setAllPrayers(selectedDate, true)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {language === 'id' ? 'Tandai semua selesai' : 'Mark all completed'}
              </button>
            </div>
          </div>

          {/* Reset All Data Link */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 6px',
            fontSize: '10.5px',
            color: 'var(--text-muted)'
          }}>
            <span>{language === 'id' ? 'Tersimpan lokal di perangkat' : 'Saved locally'}</span>
            <button
              className="no-drag"
              onClick={() => {
                if (window.confirm(language === 'id' ? 'Hapus semua riwayat aktivitas sholat?' : 'Clear all prayer activity history?')) {
                  resetAllData();
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '10.5px',
                textDecoration: 'underline'
              }}
            >
              {language === 'id' ? 'Hapus riwayat' : 'Clear history'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityPrayers;
