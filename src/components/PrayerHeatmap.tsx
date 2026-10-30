import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { usePrayerActivityStore, calculatePrayerCount, DailyPrayerRecord } from '../stores/usePrayerActivityStore';
import { useAppStore } from '../stores/useAppStore';

interface PrayerHeatmapProps {
  onSelectDate?: (dateStr: string) => void;
  selectedDate?: string;
}

// GitHub's genuine contribution color progression (calibrated for 0 to 5)
export const HEATMAP_COLORS_LIGHT = [
  '#ebedf0', // 0: None
  '#9be9a8', // 1: Low
  '#40c463', // 2: Medium-low
  '#30a14e', // 3: Medium
  '#216e39', // 4: High
  '#0f6e56', // 5: Full (Primary emerald)
];

export const HEATMAP_COLORS_DARK = [
  '#161b22', // 0: None
  '#0e4429', // 1: Low
  '#006d32', // 2: Medium-low
  '#26a641', // 3: Medium
  '#39d353', // 4: High
  '#10b981', // 5: Full (Vibrant emerald)
];

export const PrayerHeatmap: React.FC<PrayerHeatmapProps> = ({ onSelectDate, selectedDate }) => {
  const { activities } = usePrayerActivityStore();
  const { theme, language } = useAppStore();
  const [hoveredDay, setHoveredDay] = useState<{
    dateStr: string;
    count: number;
    record: DailyPrayerRecord;
    x: number;
    y: number;
  } | null>(null);

  const colors = theme === 'dark' ? HEATMAP_COLORS_DARK : HEATMAP_COLORS_LIGHT;

  const { weeks, monthLabels } = useMemo(() => {
    const today = dayjs();
    const totalWeeks = 19;
    
    const endOfWeek = today.endOf('week');
    const startDate = endOfWeek.subtract(totalWeeks * 7 - 1, 'day').startOf('day');

    const generatedWeeks: Array<Array<{ date: dayjs.Dayjs; dateStr: string; count: number; record: DailyPrayerRecord; isFuture: boolean }>> = [];
    const months: Array<{ name: string; weekIndex: number }> = [];
    let lastMonth = -1;

    let current = startDate;
    for (let w = 0; w < totalWeeks; w++) {
      const daysInWeek = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = current.format('YYYY-MM-DD');
        const record = activities[dateStr] || {};
        const count = calculatePrayerCount(record);
        const isFuture = current.isAfter(today, 'day');

        const currentMonth = current.month();
        if (d === 0 && currentMonth !== lastMonth) {
          months.push({
            name: current.locale(language).format('MMM'),
            weekIndex: w
          });
          lastMonth = currentMonth;
        }

        daysInWeek.push({
          date: current,
          dateStr,
          count: isFuture ? 0 : count,
          record,
          isFuture
        });
        current = current.add(1, 'day');
      }
      generatedWeeks.push(daysInWeek);
    }

    return { weeks: generatedWeeks, monthLabels: months };
  }, [activities, language]);

  const prayerNames: Record<string, string> = {
    fajr: language === 'id' ? 'Subuh' : 'Fajr',
    dhuhr: language === 'id' ? 'Dzuhur' : 'Dhuhr',
    asr: language === 'id' ? 'Ashar' : 'Asr',
    maghrib: language === 'id' ? 'Maghrib' : 'Maghrib',
    isha: language === 'id' ? 'Isya' : 'Isha'
  };

  const dayLabels = language === 'id' 
    ? ['', 'Sen', '', 'Rab', '', 'Jum', ''] 
    : ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div style={{ width: '100%' }}>
      {/* Scrollable Grid Canvas */}
      <div 
        className="no-drag"
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '2px 0 6px 0',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <div style={{ display: 'inline-block', minWidth: 'max-content' }}>
          {/* Months Header */}
          <div style={{ display: 'flex', marginLeft: '24px', height: '16px', position: 'relative', marginBottom: '4px' }}>
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${m.weekIndex * 14}px`,
                  fontSize: '10px',
                  fontWeight: '500',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {m.name}
              </span>
            ))}
          </div>

          {/* Matrix (Weekday labels + Cells) */}
          <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-start' }}>
            {/* Weekdays */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5px', marginRight: '3px' }}>
              {dayLabels.map((label, idx) => (
                <div
                  key={idx}
                  style={{
                    height: '11px',
                    fontSize: '8.5px',
                    lineHeight: '11px',
                    color: 'var(--text-muted)',
                    textAlign: 'right',
                    width: '18px',
                    userSelect: 'none'
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Columns of weeks */}
            <div style={{ display: 'flex', gap: '2.5px' }}>
              {weeks.map((week, wIdx) => (
                <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2.5px' }}>
                  {week.map((day) => {
                    const isSelected = selectedDate === day.dateStr;
                    const isToday = day.date.isSame(dayjs(), 'day');
                    const cellColor = day.isFuture 
                      ? (theme === 'dark' ? '#0d1117' : '#f6f8fa')
                      : colors[day.count];

                    return (
                      <div
                        key={day.dateStr}
                        onClick={() => {
                          if (!day.isFuture && onSelectDate) {
                            onSelectDate(day.dateStr);
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (!day.isFuture) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredDay({
                              dateStr: day.dateStr,
                              count: day.count,
                              record: day.record,
                              x: rect.left + rect.width / 2,
                              y: rect.top
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                        style={{
                          width: '11px',
                          height: '11px',
                          borderRadius: '2px',
                          backgroundColor: cellColor,
                          outline: isSelected ? '2px solid var(--secondary)' : 'none',
                          outlineOffset: '1px',
                          border: isToday 
                            ? '1px solid var(--primary)' 
                            : `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(27,31,35,0.06)'}`,
                          cursor: day.isFuture ? 'default' : 'pointer',
                          transition: 'transform 0.1s ease',
                          zIndex: isSelected ? 3 : 1
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Discrete Tooltip */}
      {hoveredDay && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y - 8}px`,
            transform: 'translate(-50%, -100%)',
            background: 'var(--surface-color)',
            color: 'var(--text-main)',
            padding: '6px 10px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            border: '1px solid var(--border-color)',
            fontSize: '11px',
            pointerEvents: 'none',
            zIndex: 9999,
            whiteSpace: 'nowrap',
            textAlign: 'center'
          }}
        >
          <div style={{ fontWeight: '600' }}>
            {hoveredDay.count}/5 {language === 'id' ? 'sholat selesai' : 'prayers completed'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {dayjs(hoveredDay.dateStr).locale(language).format('dddd, D MMMM YYYY')}
          </div>
          {hoveredDay.count > 0 && (
            <div style={{ fontSize: '9.5px', color: 'var(--primary)', marginTop: '2px' }}>
              {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const)
                .filter(k => hoveredDay.record[k])
                .map(k => prayerNames[k])
                .join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Discrete Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginTop: '8px',
          paddingRight: '6px',
          gap: '6px',
          fontSize: '10.5px',
          color: 'var(--text-muted)'
        }}
      >
        <span>{language === 'id' ? '0 sholat' : '0 prayers'}</span>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {colors.map((color, level) => (
            <div
              key={level}
              title={`${level}/5`}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                backgroundColor: color,
                border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
              }}
            />
          ))}
        </div>
        <span>{language === 'id' ? '5 sholat' : '5 prayers'}</span>
      </div>
    </div>
  );
};
