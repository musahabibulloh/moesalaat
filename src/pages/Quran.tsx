import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ArrowLeft, Play, Pause, BookOpen, WifiOff, RefreshCw } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

interface Surah {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
  audioFull: Record<string, string>;
}

interface Ayat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: Record<string, string>;
}

interface SurahDetail extends Surah {
  ayat: Ayat[];
}

const Quran: React.FC = () => {
  const { language } = useAppStore();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedSurah, setSelectedSurah] = useState<SurahDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(window.innerWidth > 650);

  useEffect(() => {
    const handleResize = () => setIsMaximized(window.innerWidth > 650);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!navigator.onLine) {
      setError(language === 'id' ? 'Anda harus terhubung ke internet untuk memuat Al-Quran.' : 'You must be connected to the internet to load the Quran.');
      setLoading(false);
    } else {
      fetchSurahs();
    }

    const handleOnline = () => {
      setError(null);
      if (surahs.length === 0) fetchSurahs();
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
  }, [language]);

  const fetchSurahs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://equran.id/api/v2/surat');
      setSurahs(response.data.data);
    } catch (error) {
      console.error("Error fetching surahs:", error);
      setError(language === 'id' ? 'Gagal memuat data. Pastikan Anda terhubung ke internet.' : 'Failed to load data. Please ensure you are connected to the internet.');
    } finally {
      setLoading(false);
    }
  };

  const openSurah = async (nomor: number) => {
    if (!navigator.onLine) {
      alert(language === 'id' ? 'Anda harus terhubung ke internet untuk membuka Surah ini.' : 'You must be connected to the internet to open this Surah.');
      return;
    }
    
    setLoadingDetail(true);
    setSelectedSurah(null); // Clear previous
    stopAudio();
    try {
      const response = await axios.get(`https://equran.id/api/v2/surat/${nomor}`);
      setSelectedSurah(response.data.data);
    } catch (error) {
      console.error("Error fetching surah details:", error);
      alert(language === 'id' ? 'Gagal memuat ayat. Pastikan koneksi internet stabil.' : 'Failed to load ayahs. Ensure your internet connection is stable.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const goBack = () => {
    setSelectedSurah(null);
    stopAudio();
  };

  const toggleAudio = (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      stopAudio();
    } else {
      stopAudio();
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingAudio(null);
      audio.play();
      audioRef.current = audio;
      setPlayingAudio(audioUrl);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingAudio(null);
    }
  };

  const filteredSurahs = surahs.filter(s => 
    s.namaLatin.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.arti.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error && !selectedSurah && surahs.length === 0) {
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
            onClick={fetchSurahs}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}
          >
            <RefreshCw size={16} />
            {language === 'id' ? 'Coba Lagi' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="pulse-active" style={{ color: 'var(--primary)' }}>
          <BookOpen size={48} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', position: 'relative' }}>
      
      {!selectedSurah && !loadingDetail ? (
        // SURAH LIST VIEW
        <div style={{ display: 'flex', flexDirection: 'column', width: isMaximized ? '800px' : '420px', maxWidth: '90%', height: '100%', transition: 'width 0.3s' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px', marginTop: '50px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 'bold' }}>{language === 'id' ? 'Al-Quran' : 'Quran'}</h1>
          </div>
          
          <input 
            type="text" 
            placeholder={language === 'id' ? 'Cari surat...' : 'Search surah...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '20px',
              padding: '8px 16px', color: 'var(--text-main)', fontSize: '12px', marginBottom: '12px',
              outline: 'none', width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          />

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px', paddingBottom: '60px' }}>
            {filteredSurahs.map((surah) => (
              <div 
                key={surah.nomor} 
                className="no-drag"
                onClick={() => openSurah(surah.nomor)}
                style={{ 
                  background: 'var(--glass-bg)', padding: '12px', borderRadius: '16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>
                  {surah.nomor}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{surah.namaLatin}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{surah.arti}</div>
                </div>
                <div style={{ fontSize: '22px', color: 'var(--primary)', fontFamily: '"Amiri", serif' }}>
                  {surah.nama}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : loadingDetail ? (
        <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '16px' }}>
          <div className="pulse-active" style={{ color: 'var(--primary)' }}>
            <BookOpen size={40} />
          </div>
        </div>
      ) : selectedSurah ? (
        // SURAH DETAIL VIEW
        <div style={{ display: 'flex', flexDirection: 'column', width: isMaximized ? '900px' : '460px', maxWidth: '95%', height: '100%', transition: 'width 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', marginTop: '50px', justifyContent: 'center', position: 'relative' }}>
            <button 
              onClick={goBack}
              style={{ position: 'absolute', left: 0, background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--primary)' }}>{selectedSurah.namaLatin}</h2>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px', paddingBottom: '60px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedSurah.ayat.map((ayah) => {
              const audioUrl = ayah.audio['01'] || ayah.audio['02']; // Default to first available audio
              const isPlaying = playingAudio === audioUrl;

              return (
                <div key={ayah.nomorAyat} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', background: 'var(--glass-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ 
                      width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(15, 110, 86, 0.1)',
                      color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                      fontWeight: '600', fontSize: '11px'
                    }}>
                      {ayah.nomorAyat}
                    </div>
                    
                    <button 
                      onClick={() => toggleAudio(audioUrl)}
                      style={{ 
                        width: '28px', height: '28px', borderRadius: '50%', 
                        background: isPlaying ? 'var(--primary)' : 'transparent',
                        color: isPlaying ? 'white' : 'var(--primary)',
                        border: `1px solid var(--primary)`, 
                        display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isPlaying ? <Pause size={12} /> : <Play size={12} style={{ marginLeft: '2px' }} />}
                    </button>
                  </div>

                  <p style={{ 
                    fontSize: isMaximized ? '32px' : '22px', 
                    fontFamily: '"Amiri", "Scheherazade New", serif', 
                    textAlign: 'right', 
                    lineHeight: '1.8',
                    marginBottom: '12px',
                    color: 'var(--text-main)',
                    direction: 'rtl',
                    transition: 'font-size 0.3s'
                  }}>
                    {ayah.teksArab}
                  </p>

                  <p style={{ fontSize: isMaximized ? '14px' : '11px', color: 'var(--text-muted)', lineHeight: '1.5', transition: 'font-size 0.3s' }}>
                    {ayah.teksIndonesia}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Quran;
