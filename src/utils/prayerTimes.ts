import { PrayerTimes, Coordinates, CalculationMethod } from 'adhan';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import axios from 'axios';

dayjs.extend(customParseFormat);

export const getPrayerTimes = (lat: number, lng: number, date: Date = new Date()) => {
  const coordinates = new Coordinates(lat, lng);
  const params = CalculationMethod.Other();
  params.fajrAngle = 20;
  params.ishaAngle = 18;
  // Kemenag RI standard ihtiyat (safety) time is 2 minutes
  params.adjustments = { fajr: 2, sunrise: -2, dhuhr: 2, asr: 2, maghrib: 2, isha: 2 };
  
  const prayerTimes = new PrayerTimes(coordinates, date, params);
  
  return {
    Fajr: prayerTimes.fajr,
    Sunrise: prayerTimes.sunrise,
    Dhuhr: prayerTimes.dhuhr,
    Asr: prayerTimes.asr,
    Maghrib: prayerTimes.maghrib,
    Isha: prayerTimes.isha,
  };
};

export const getNextPrayer = (lat: number, lng: number) => {
  const coordinates = new Coordinates(lat, lng);
  const params = CalculationMethod.Other();
  params.fajrAngle = 20;
  params.ishaAngle = 18;
  params.adjustments = { fajr: 2, sunrise: -2, dhuhr: 2, asr: 2, maghrib: 2, isha: 2 };
  const date = new Date();
  
  const prayerTimes = new PrayerTimes(coordinates, date, params);
  
  const next = prayerTimes.nextPrayer();
  if (next === 'none') {
    // If all prayers are done today, get tomorrow's Fajr
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = new PrayerTimes(coordinates, tomorrow, params);
    return {
      name: 'Fajr',
      time: tomorrowTimes.fajr,
    };
  }
  
  return {
    name: next,
    time: prayerTimes.timeForPrayer(next),
  };
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: {
        'Accept-Language': 'id',
      }
    });
    
    const data = response.data;
    if (data && data.address) {
      return data.address.city || data.address.town || data.address.village || data.address.county || 'Lokasi Tidak Diketahui';
    }
    return 'Lokasi Tidak Diketahui';
  } catch (error) {
    console.error("Geocoding error", error);
    return 'Gagal memuat lokasi';
  }
};
