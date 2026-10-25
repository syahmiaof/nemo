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
    notes: 'Standard rate for 1 cupak of Super Special Local Rice (RM 4.00) or Fragrant/Basmati Rice (RM 8.00)',
    officialZakatUrl: 'https://www.zakatselangor.com.my',
  },
  {
    state: 'Wilayah Persekutuan (PPZ-MAIWP)',
    ratePerDay: 4.00,
    premiumRate: 8.00,
    notes: 'Kuala Lumpur, Putrajaya, Labuan. Standard rate of 1 cupak of rice is RM 4.00',
    officialZakatUrl: 'https://www.zakat.com.my',
  },
  {
    state: 'Johor (MAINJ)',
    ratePerDay: 4.00,
    notes: 'Official rate by Johor State Islamic Religious Council',
    officialZakatUrl: 'https://www.maij.gov.my',
  },
  {
    state: 'Perak (MAIPk)',
    ratePerDay: 4.00,
    notes: 'Official rate by Perak Islamic Religious and Malay Customs Council',
    officialZakatUrl: 'https://www.maiamp.gov.my',
  },
  {
    state: 'Pulau Pinang (Zakat Pulau Pinang)',
    ratePerDay: 4.00,
    notes: 'Standard 1 cupak rice rate for Penang State',
    officialZakatUrl: 'https://www.zakatpenang.com',
  },
  {
    state: 'Kedah (LZNK)',
    ratePerDay: 4.00,
    notes: 'Kedah State Zakat Board official rate',
    officialZakatUrl: 'https://www.zakatkedah.com.my',
  },
  {
    state: 'Negeri Sembilan (PZNS)',
    ratePerDay: 4.00,
    notes: 'Negeri Sembilan Baitulmal Corporation official rate',
    officialZakatUrl: 'https://www.zakatns2u.biz',
  },
  {
    state: 'Melaka (Zakat Melaka)',
    ratePerDay: 4.00,
    notes: 'Melaka Zakat Board official rate',
    officialZakatUrl: 'https://www.izakat.com',
  },
  {
    state: 'Pahang (MUIP)',
    ratePerDay: 4.00,
    notes: 'Pahang Islamic Religious and Malay Customs Council',
    officialZakatUrl: 'https://zakatpahang.my',
  },
  {
    state: 'Terengganu (MAIDAM)',
    ratePerDay: 4.00,
    notes: 'Terengganu Islamic Religious and Malay Customs Council',
    officialZakatUrl: 'https://maidam.gov.my',
  },
  {
    state: 'Kelantan (MAIK)',
    ratePerDay: 4.00,
    notes: 'Kelantan Islamic Religious and Malay Customs Council',
    officialZakatUrl: 'https://www.e-maik.my',
  },
  {
    state: 'Perlis (MAIPs)',
    ratePerDay: 4.00,
    notes: 'Perlis Islamic Religious and Malay Customs Council',
    officialZakatUrl: 'https://www.maips.gov.my',
  },
  {
    state: 'Sabah (MUIS)',
    ratePerDay: 4.00,
    notes: 'Sabah Islamic Religious Council official rate',
    officialZakatUrl: 'https://zakat.muis.gov.my',
  },
  {
    state: 'Sarawak (TBS)',
    ratePerDay: 4.00,
    notes: 'Sarawak Baitulmal Fund official rate',
    officialZakatUrl: 'https://www.tbs.org.my',
  },
];
