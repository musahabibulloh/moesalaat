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
  // Adhan audio controls
  adhanVolume: number;
  setAdhanVolume: (volume: number) => void;
  isAdhanPlaying: boolean;
  _adhanAudio: HTMLAudioElement | null;
  playAdhan: () => Promise<void>;
  stopAdhan: () => void;
}

export const useAppStore = create<AppState>((set, get) => {
  // Load from localStorage if exists
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
  const savedLocation = localStorage.getItem('location');
  const savedMethod = localStorage.getItem('calcMethod');
  const savedVolume = localStorage.getItem('adhanVolume');

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
    },
    // Adhan audio controls
    adhanVolume: savedVolume !== null ? parseFloat(savedVolume) : 0.8,
    setAdhanVolume: (volume) => {
      localStorage.setItem('adhanVolume', String(volume));
      // Also update volume on currently playing audio if any
      const audio = get()._adhanAudio;
      if (audio) {
        audio.volume = volume;
      }
      set({ adhanVolume: volume });
    },
    isAdhanPlaying: false,
    _adhanAudio: null,
    playAdhan: async () => {
      // Stop any existing audio first
      const existing = get()._adhanAudio;
      if (existing) {
        existing.pause();
        existing.currentTime = 0;
      }

      try {
        const audio = new Audio('https://www.islamcan.com/audio/adhan/azan1.mp3');
        audio.volume = get().adhanVolume;

        // When audio ends naturally, clean up state
        audio.addEventListener('ended', () => {
          set({ isAdhanPlaying: false, _adhanAudio: null });
        });

        // Handle errors
        audio.addEventListener('error', () => {
          console.error('Failed to play adhan audio');
          set({ isAdhanPlaying: false, _adhanAudio: null });
        });

        await audio.play();
        set({ isAdhanPlaying: true, _adhanAudio: audio });
      } catch (e) {
        console.log('Failed to play audio:', e);
        set({ isAdhanPlaying: false, _adhanAudio: null });
      }
    },
    stopAdhan: () => {
      const audio = get()._adhanAudio;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      set({ isAdhanPlaying: false, _adhanAudio: null });
    },
  };
});
