# CSS Effects Expert Critique

## Pemerhatian berasaskan UI semasa

Nemo mempunyai identiti midnight navy, peach/mint accents, translucent panels, token theme dan aurora background; ia nampak tersusun dan premium pada screenshots 1440px. Glass treatment menggunakan blur besar secara konsisten (contohnya 26px saturate 165% untuk base, 24px pada surfaces tertentu), dengan modal blur 10px. Ini memberi kedalaman tetapi kadang-kadang menjadikan semua panel sama penting dan mengurangkan perbezaan surface hierarchy.

Daylight menukar canvas/surface kepada cerah. Assistant drawer kekal dark navy ketika Daylight dipilih dalam probe (`interaction-results.json`), menjadikannya komponen yang terasa asing berbanding setting theme yang lain. Mungkin sengaja untuk fokus, tetapi tiada theme token behavior yang menerangkan pengecualian tersebut.

Aurora menggunakan blob besar berblur yang bergerak perlahan; visualnya menarik tetapi 75vw/70vw layer dan blur sekitar 80px ialah risiko kos compositing pada telefon sederhana. Tiada frame profiler atau GPU timing dikumpul, maka ia **risiko teknikal**, bukan dakwaan jank terbukti. `prefers-reduced-motion` mengurangkan/menyahaktifkan kesan motion global berdasarkan CSS source, tetapi behavior setiap GSAP timeline perlu acceptance check tersendiri.

## Tavola → Nemo

Tavola reference mempunyai nav lebih besar, card edge lebih jelas, mint/peach contrast yang berfungsi sebagai state, serta dua kolum Overview yang terasa padat. Nemo sudah ada palette depth dan panel treatment, tetapi nav header secara relatif lebih kecil pada viewport desktop dan banyak permukaan berkongsi blur/radius. Overview chart panel meregang selari stack focus kanan; visual matrix `midnight-1440-overview.png` menunjukkan chart graph area rendah berbanding ketinggian keseluruhan panel. Tiada kod/asset Tavola disalin.

## Cadangan spesifik (belum dilaksana)

- Kekalkan blur 20–26px hanya pada permukaan overlay; permukaan statik gunakan translucent fill + rim stroke untuk beza hierarchy dan kurangkan luas backdrop sampling.
- Audit CSS custom properties per tema: setiap theme perlu surface/border/text/state yang sepadan; assistant drawer patut ikut theme atau diberi keputusan produk yang jelas.
- Kecilkan kawasan aurora dan blur pada touch/coarse pointer atau reduced-data/performance mode; ukur dengan trace sebelum menetapkan threshold.
- Bezakan card utama, secondary panel dan utility control melalui nilai border luminance serta shadow, bukan menambah glow di semua tempat.
- Tambah hover/focus states yang tidak bergantung pada warna sahaja dan pastikan outline kelihatan atas glass surface.
- Pada Overview, tetapkan chart plot height dan align metrics/right stack mengikut design; jangan stretch chart container secara tersirat.
- Banding screenshot pada 320/390/768/1440 dengan token overlay; semak contrast sebenar termasuk disabled/error state.

## Skor

Editorial 7/10 berdasarkan 48 screenshot tiga tema dan CSS source review. Frame pacing, compositing layers dan peranti low-end belum diukur; jangan anggap skor ini benchmark prestasi.
