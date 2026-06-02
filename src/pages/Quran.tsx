import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, ArrowLeft, Play, Pause, BookOpen } from 'lucide-react';
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

  useEffect(() => {
    fetchSurahs();
  }, []);

  const fetchSurahs = async () => {
    try {
      const response = await axios.get('https://equran.id/api/v2/surat');
      setSurahs(response.data.data);
    } catch (error) {
      console.error("Error fetching surahs:", error);
    } finally {
      setLoading(false);
    }
  };

  const openSurah = async (nomor: number) => {
    setLoadingDetail(true);
    setSelectedSurah(null); // Clear previous
    stopAudio();
    try {
      const response = await axios.get(`https://equran.id/api/v2/surat/${nomor}`);
      setSelectedSurah(response.data.data);
    } catch (error) {
      console.error("Error fetching surah details:", error);
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: '20px' }}>
      
      {!selectedSurah && !loadingDetail ? (
        // SURAH LIST VIEW
        <div className="animate-slide-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                {language === 'id' ? 'Al-Quran' : 'Quran'}
              </h1>
              <p style={{ color: 'var(--text-muted)' }}>
                {language === 'id' ? 'Baca dan dengarkan ayat-ayat suci Al-Quran' : 'Read and listen to the holy verses of the Quran'}
              </p>
            </div>
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', width: '300px' }}>
              <Search size={20} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
              <input 
                type="text" 
                placeholder={language === 'id' ? 'Cari surat atau arti...' : 'Search surah or meaning...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  border: 'none', 
                  background: 'transparent', 
                  outline: 'none', 
                  color: 'var(--text-main)',
                  width: '100%',
                  fontSize: '15px'
                }}
              />
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '20px',
            overflowY: 'auto',
            paddingRight: '10px'
          }}>
            {filteredSurahs.map((surah) => (
              <div 
                key={surah.nomor} 
                className="glass-panel"
                onClick={() => openSurah(surah.nomor)}
                style={{ 
                  padding: '20px', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  border: '1px solid var(--glass-border)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(15, 110, 86, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                }}
              >
                <div style={{ 
                  width: '46px', 
                  height: '46px', 
                  borderRadius: '12px', 
                  background: 'rgba(15, 110, 86, 0.1)', 
                  color: 'var(--primary)',
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  fontWeight: '600',
                  fontSize: '18px',
                  flexShrink: 0
                }}>
                  {surah.nomor}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {surah.namaLatin}
                    </h3>
                    <span style={{ fontSize: '20px', fontFamily: '"Amiri", "Scheherazade New", serif', color: 'var(--primary)', fontWeight: 'bold' }}>
                      {surah.nama}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{surah.arti}</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-color)' }}></span>
                    <span>{surah.jumlahAyat} Ayat</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : loadingDetail ? (
        <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '16px' }}>
          <div className="pulse-active" style={{ color: 'var(--primary)' }}>
            <BookOpen size={48} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Memuat Surat...</p>
        </div>
      ) : selectedSurah ? (
        // SURAH DETAIL VIEW
        <div className="animate-slide-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={goBack}
              className="glass-panel"
              style={{ 
                width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: 0
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{selectedSurah.namaLatin}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                {selectedSurah.arti} • {selectedSurah.tempatTurun} • {selectedSurah.jumlahAyat} Ayat
              </p>
            </div>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
            borderRadius: '20px',
            padding: '32px 24px',
            textAlign: 'center',
            color: 'white',
            marginBottom: '32px',
            boxShadow: '0 12px 32px rgba(15, 110, 86, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, transform: 'scale(2)' }}>
               <BookOpen size={120} />
            </div>
            <h1 style={{ fontSize: '42px', fontFamily: '"Amiri", serif', fontWeight: 'normal', marginBottom: '8px' }}>
              {selectedSurah.nama}
            </h1>
            <p style={{ fontSize: '16px', opacity: 0.9 }}>
              {selectedSurah.deskripsi.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
            </p>
          </div>

          <div style={{ overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {selectedSurah.ayat.map((ayah) => {
              const audioUrl = ayah.audio['01'] || ayah.audio['02']; // Default to first available audio
              const isPlaying = playingAudio === audioUrl;

              return (
                <div key={ayah.nomorAyat} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div style={{ 
                      width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(15, 110, 86, 0.1)',
                      color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                      fontWeight: '600', fontSize: '14px'
                    }}>
                      {ayah.nomorAyat}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={() => toggleAudio(audioUrl)}
                        style={{ 
                          width: '36px', height: '36px', borderRadius: '50%', 
                          background: isPlaying ? 'var(--primary)' : 'transparent',
                          color: isPlaying ? 'white' : 'var(--primary)',
                          border: `1px solid var(--primary)`, 
                          display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
                      </button>
                    </div>
                  </div>

                  <p style={{ 
                    fontSize: '32px', 
                    fontFamily: '"Amiri", "Scheherazade New", serif', 
                    textAlign: 'right', 
                    lineHeight: '2',
                    marginBottom: '20px',
                    color: 'var(--text-main)',
                    direction: 'rtl'
                  }}>
                    {ayah.teksArab}
                  </p>

                  <p style={{ fontSize: '16px', color: 'var(--primary)', marginBottom: '8px', fontWeight: '500' }}>
                    {ayah.teksLatin}
                  </p>
                  <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
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
