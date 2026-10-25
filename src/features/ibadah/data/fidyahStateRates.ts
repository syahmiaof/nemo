export interface FidyahStateRate {
  state: string;
  ratePerDay: number; // in MYR (standard rate per day / 1 cupak)
  premiumRate?: number; // for premium rice grade (e.g. Basmati)
  notes?: string;
  officialZakatUrl?: string;
}

export const OFFICIAL_FIDYAH_STATE_RATES: FidyahStateRate[] = [
  {
    state: 'Selangor (LZS)',
    ratePerDay: 4.00,
    premiumRate: 8.00,
    notes: 'Kadar standard 1 cupak beras Super Spesial Tempatan (RM 4.00) atau Beras Wangi/Basmati (RM 8.00)',
    officialZakatUrl: 'https://www.zakatselangor.com.my',
  },
  {
    state: 'Wilayah Persekutuan (PPZ-MAIWP)',
    ratePerDay: 4.00,
    premiumRate: 8.00,
    notes: 'Kuala Lumpur, Putrajaya, Labuan. Kadar 1 cupak beras RM 4.00',
    officialZakatUrl: 'https://www.zakat.com.my',
  },
  {
    state: 'Johor (MAINJ)',
    ratePerDay: 4.00,
    notes: 'Kadar rasmi Majlis Agama Islam Negeri Johor',
    officialZakatUrl: 'https://www.maij.gov.my',
  },
  {
    state: 'Perak (MAIPk)',
    ratePerDay: 4.00,
    notes: 'Kadar rasmi Majlis Agama Islam dan Adat Melayu Perak',
    officialZakatUrl: 'https://www.maiamp.gov.my',
  },
  {
    state: 'Pulau Pinang (Zakat Pulau Pinang)',
    ratePerDay: 4.00,
    notes: 'Kadar 1 cupak beras negeri Pulau Pinang',
    officialZakatUrl: 'https://www.zakatpenang.com',
  },
  {
    state: 'Kedah (LZNK)',
    ratePerDay: 4.00,
    notes: 'Lembaga Zakat Negeri Kedah',
    officialZakatUrl: 'https://www.zakatkedah.com.my',
  },
  {
    state: 'Negeri Sembilan (PZNS)',
    ratePerDay: 4.00,
    notes: 'Perbadanan Baitulmal Negeri Sembilan',
    officialZakatUrl: 'https://www.zakatns2u.biz',
  },
  {
    state: 'Melaka (Zakat Melaka)',
    ratePerDay: 4.00,
    notes: 'Zakat Melaka',
    officialZakatUrl: 'https://www.izakat.com',
  },
  {
    state: 'Pahang (MUIP)',
    ratePerDay: 4.00,
    notes: 'Majlis Ugama Islam dan Adat Resam Melayu Pahang',
    officialZakatUrl: 'https://zakatpahang.my',
  },
  {
    state: 'Terengganu (MAIDAM)',
    ratePerDay: 4.00,
    notes: 'Majlis Agama Islam dan Adat Melayu Terengganu',
    officialZakatUrl: 'https://maidam.gov.my',
  },
  {
    state: 'Kelantan (MAIK)',
    ratePerDay: 4.00,
    notes: 'Majlis Agama Islam dan Adat Istiadat Melayu Kelantan',
    officialZakatUrl: 'https://www.e-maik.my',
  },
  {
    state: 'Perlis (MAIPs)',
    ratePerDay: 4.00,
    notes: 'Majlis Agama Islam dan Adat Istiadat Melayu Perlis',
    officialZakatUrl: 'https://www.maips.gov.my',
  },
  {
    state: 'Sabah (MUIS)',
    ratePerDay: 4.00,
    notes: 'Majlis Ugama Islam Sabah',
    officialZakatUrl: 'https://zakat.muis.gov.my',
  },
  {
    state: 'Sarawak (TBS)',
    ratePerDay: 4.00,
    notes: 'Tabung Baitulmal Sarawak',
    officialZakatUrl: 'https://www.tbs.org.my',
  },
];
