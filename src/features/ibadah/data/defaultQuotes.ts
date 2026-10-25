import { IslamicQuote } from '@/domain/types';

export const DEFAULT_ISLAMIC_QUOTES: IslamicQuote[] = [
  // SABAR
  {
    id: 'quote_sb_1',
    textArabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'Oleh itu, sesungguhnya bersama kesusahan ada kemudahan. Sesungguhnya bersama kesusahan ada kemudahan.',
    source: 'Surah Asy-Syarh: 5-6',
    category: 'sabar',
  },
  {
    id: 'quote_sb_2',
    textArabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    translation: 'Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.',
    source: 'Surah Al-Baqarah: 286',
    category: 'sabar',
  },
  {
    id: 'quote_sb_3',
    textArabic: 'وَاصْبِرْ لِحُكْمِ رَبِّكَ فَإِنَّكَ بِأَعْيُنِنَا',
    translation: 'Dan bersabarlah menunggu ketetapan Tuhanmu, kerana sesungguhnya engkau berada dalam pengawasan dan pemeliharaan Kami.',
    source: 'Surah At-Tur: 48',
    category: 'sabar',
  },
  {
    id: 'quote_sb_4',
    textArabic: 'إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ',
    translation: 'Sesungguhnya orang-orang yang bersabarlah sahaja yang akan disempurnakan pahala mereka tanpa batas hitungan.',
    source: 'Surah Az-Zumar: 10',
    category: 'sabar',
  },

  // SYUKUR
  {
    id: 'quote_sy_1',
    textArabic: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    translation: 'Demi sesungguhnya! Jika kamu bersyukur, nescaya Aku akan tambahi nikmat-Ku kepadamu.',
    source: 'Surah Ibrahim: 7',
    category: 'syukur',
  },
  {
    id: 'quote_sy_2',
    textArabic: 'وَإِن تَعُدُّوا نِعْمَةَ اللَّهِ لَا تُحْصُوهَا',
    translation: 'Dan jika kamu menghitung nikmat Allah, nescaya kamu tidak dapat menghitungnya.',
    source: 'Surah An-Nahl: 18',
    category: 'syukur',
  },
  {
    id: 'quote_sy_3',
    textArabic: 'مَنْ لَمْ يَشْكُرِ النَّاسَ لَمْ يَشْكُرِ اللَّهَ',
    translation: 'Barangsiapa yang tidak berterima kasih kepada manusia, dia tidak bersyukur kepada Allah.',
    source: 'Hadis Riwayat Abu Daud & At-Tirmidhi',
    category: 'syukur',
  },

  // REZEKI
  {
    id: 'quote_rz_1',
    textArabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا • وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ',
    translation: 'Barangsiapa yang bertakwa kepada Allah, nescaya Dia mengadakan baginya jalan keluar. Dan memberinya rezeki dari arah yang tidak disangka-sangkanya.',
    source: 'Surah At-Talaq: 2-3',
    category: 'rezeki',
  },
  {
    id: 'quote_rz_2',
    textArabic: 'وَمَا مِن دَابَّةٍ فِي الْأَرْضِ إِلَّا عَلَى اللَّهِ رِزْقُهَا',
    translation: 'Dan tiadalah sesuatupun dari makhluk yang bergerak di bumi melainkan Allah jua yang menanggung rezekinya.',
    source: 'Surah Hud: 6',
    category: 'rezeki',
  },
  {
    id: 'quote_rz_3',
    textArabic: 'لَوْ أَنَّكُمْ تَتَوَكَّلُونَ عَلَى اللَّهِ حَقَّ تَوَكُّلِهِ لَرَزَقَكُمْ كَمَا يَرْزُقُ الطَّيْرَ',
    translation: 'Kalaulah kamu bertawakal kepada Allah dengan sebenar-benar tawakal, nescaya kamu akan diberi rezeki sebagaimana burung diberi rezeki; ia keluar pagi dalam keadaan lapar dan pulang petang dalam keadaan kenyang.',
    source: 'Hadis Riwayat At-Tirmidhi (Sahih)',
    category: 'rezeki',
  },

  // TAUBAT
  {
    id: 'quote_tb_1',
    textArabic: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
    translation: 'Katakanlah: Wahai hamba-hamba-Ku yang melampaui batas terhadap diri mereka sendiri! Janganlah kamu berputus asa dari rahmat Allah. Sesungguhnya Allah mengampuni dosa-dosa semuanya.',
    source: 'Surah Az-Zumar: 53',
    category: 'taubat',
  },
  {
    id: 'quote_tb_2',
    textArabic: 'إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ',
    translation: 'Sesungguhnya Allah menyukai orang-orang yang bertaubat dan menyukai orang-orang yang menyucikan diri.',
    source: 'Surah Al-Baqarah: 222',
    category: 'taubat',
  },
  {
    id: 'quote_tb_3',
    textArabic: 'التَّائِبُ مِنَ الذَّنْبِ كَمَنْ لَا ذَنْبَ لَهُ',
    translation: 'Orang yang bertaubat dari dosanya adalah seperti orang yang tidak mempunyai dosa.',
    source: 'Hadis Riwayat Ibnu Majah (Hasan)',
    category: 'taubat',
  },

  // ISTIQAMAH
  {
    id: 'quote_is_1',
    textArabic: 'فَاسْتَقِمْ كَمَا أُمِرْتَ',
    translation: 'Maka tetaplah engkau (pada jalan yang lurus), sebagaimana diperintahkan kepadamu.',
    source: 'Surah Hud: 112',
    category: 'istiqamah',
  },
  {
    id: 'quote_is_2',
    textArabic: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    translation: 'Amalan yang paling dicintai oleh Allah adalah amalan yang berterusan (istiqamah) walaupun sedikit.',
    source: 'Hadis Riwayat Al-Bukhari & Muslim',
    category: 'istiqamah',
  },
  {
    id: 'quote_is_3',
    textArabic: 'قُلْ آمَنْتُ بِاللَّهِ ثُمَّ اسْتَقِمْ',
    translation: 'Katakanlah: Aku beriman kepada Allah, kemudian istiqamahlah (berpegang teguhlah padanya).',
    source: 'Hadis Riwayat Muslim',
    category: 'istiqamah',
  },
];
