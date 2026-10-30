import { create } from 'zustand';
import dayjs from 'dayjs';

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface DailyPrayerRecord {
  fajr?: boolean;
  dhuhr?: boolean;
  asr?: boolean;
  maghrib?: boolean;
  isha?: boolean;
}

export type PrayerActivityMap = Record<string, DailyPrayerRecord>;

interface PrayerStats {
  currentStreak: number;
  bestStreak: number;
  totalCompleted: number;
  perfectDays: number;
  monthCompletionRate: number;
}

interface PrayerActivityState {
  activities: PrayerActivityMap;
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  togglePrayer: (date: string, prayer: PrayerKey) => void;
  setAllPrayers: (date: string, completed: boolean) => void;
  getPrayerCount: (date: string) => number;
  getPrayerRecord: (date: string) => DailyPrayerRecord;
  getStats: () => PrayerStats;
  resetAllData: () => void;
}

const STORAGE_KEY = 'azhan_prayer_records';

// Helper to calculate prayer count (0-5)
export const calculatePrayerCount = (record?: DailyPrayerRecord): number => {
  if (!record) return 0;
  let count = 0;
  if (record.fajr) count++;
  if (record.dhuhr) count++;
  if (record.asr) count++;
  if (record.maghrib) count++;
  if (record.isha) count++;
  return count;
};

const loadInitialActivities = (): PrayerActivityMap => {
  try {
    // Clear old test/sample key if present to ensure 100% real user data
    if (localStorage.getItem('prayer_activities_data')) {
      localStorage.removeItem('prayer_activities_data');
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse prayer activities from localStorage', e);
  }
  
  // Real data only: starts empty
  return {};
};

export const usePrayerActivityStore = create<PrayerActivityState>((set, get) => ({
  activities: loadInitialActivities(),
  selectedDate: dayjs().format('YYYY-MM-DD'),

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  togglePrayer: (date: string, prayer: PrayerKey) => {
    set((state) => {
      const currentDay = state.activities[date] || {};
      const updatedDay: DailyPrayerRecord = {
        ...currentDay,
        [prayer]: !currentDay[prayer]
      };

      const newActivities = {
        ...state.activities,
        [date]: updatedDay
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newActivities));
      } catch (e) {
        console.error('Failed to save activities:', e);
      }

      return { activities: newActivities };
    });
  },

  setAllPrayers: (date: string, completed: boolean) => {
    set((state) => {
      const updatedDay: DailyPrayerRecord = {
        fajr: completed,
        dhuhr: completed,
        asr: completed,
        maghrib: completed,
        isha: completed
      };

      const newActivities = {
        ...state.activities,
        [date]: updatedDay
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newActivities));
      } catch (e) {
        console.error('Failed to save activities:', e);
      }

      return { activities: newActivities };
    });
  },

  getPrayerCount: (date: string) => {
    const record = get().activities[date];
    return calculatePrayerCount(record);
  },

  getPrayerRecord: (date: string) => {
    return get().activities[date] || {};
  },

  getStats: () => {
    const { activities } = get();
    const today = dayjs();
    
    let totalCompleted = 0;
    let perfectDays = 0;
    
    // Calculate total completed & perfect days across all recorded days
    Object.values(activities).forEach((record) => {
      const count = calculatePrayerCount(record);
      totalCompleted += count;
      if (count === 5) {
        perfectDays++;
      }
    });

    // Calculate current streak (consecutive days with at least 1 prayer done)
    let currentStreak = 0;
    let checkDate = today;
    
    // If today has 0 prayers yet, check if yesterday had prayers to maintain streak
    const todayCount = calculatePrayerCount(activities[today.format('YYYY-MM-DD')]);
    if (todayCount === 0) {
      checkDate = today.subtract(1, 'day');
    }

    while (true) {
      const dateStr = checkDate.format('YYYY-MM-DD');
      const count = calculatePrayerCount(activities[dateStr]);
      if (count > 0) {
        currentStreak++;
        checkDate = checkDate.subtract(1, 'day');
      } else {
        break;
      }
    }

    // Best streak
    let bestStreak = currentStreak;
    const sortedDates = Object.keys(activities).sort();
    let tempStreak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
      const count = calculatePrayerCount(activities[sortedDates[i]]);
      if (count > 0) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Monthly completion rate (current month)
    const startOfMonth = today.startOf('month');
    const daysPassedInMonth = today.date();
    let monthPrayers = 0;
    for (let d = 1; d <= daysPassedInMonth; d++) {
      const dateStr = startOfMonth.date(d).format('YYYY-MM-DD');
      monthPrayers += calculatePrayerCount(activities[dateStr]);
    }
    const maxPossibleMonthPrayers = daysPassedInMonth * 5;
    const monthCompletionRate = maxPossibleMonthPrayers > 0 
      ? Math.round((monthPrayers / maxPossibleMonthPrayers) * 100) 
      : 0;

    return {
      currentStreak,
      bestStreak,
      totalCompleted,
      perfectDays,
      monthCompletionRate
    };
  },

  resetAllData: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ activities: {} });
  }
}));
