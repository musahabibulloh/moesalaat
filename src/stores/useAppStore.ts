import { create } from 'zustand';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  location: {
    lat: number;
    lng: number;
    city: string;
  } | null;
  setLocation: (lat: number, lng: number, city: string) => void;
  calculationMethod: string;
  setCalculationMethod: (method: string) => void;
  language: 'id' | 'en';
  setLanguage: (lang: 'id' | 'en') => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => {
  // Load from localStorage if exists
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
  const savedLocation = localStorage.getItem('location');
  const savedMethod = localStorage.getItem('calcMethod');

  return {
    theme: savedTheme || 'light',
    toggleTheme: () => set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      return { theme: newTheme };
    }),
    location: savedLocation ? JSON.parse(savedLocation) : null,
    setLocation: (lat, lng, city) => {
      const newLocation = { lat, lng, city };
      localStorage.setItem('location', JSON.stringify(newLocation));
      set({ location: newLocation });
    },
    calculationMethod: savedMethod || 'Singapore', // Using Singapore as default for now, can be Kemenag
    setCalculationMethod: (method) => {
      localStorage.setItem('calcMethod', method);
      set({ calculationMethod: method });
    },
    language: (localStorage.getItem('language') as 'id' | 'en') || 'id',
    setLanguage: (lang) => {
      localStorage.setItem('language', lang);
      set({ language: lang });
    },
    notificationsEnabled: localStorage.getItem('notificationsEnabled') !== 'false',
    setNotificationsEnabled: (enabled) => {
      localStorage.setItem('notificationsEnabled', String(enabled));
      set({ notificationsEnabled: enabled });
    }
  };
});
