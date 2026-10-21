# GSAP Motion Audit

## Apa yang diperiksa

Source untuk `RouteTransition`, `TavolaTabs`, Settings card reveal, chart reveal, dialogs/drawers dan aurora CSS; 48 static screenshots dan interaksi drawer/theme. Tiada screen recording atau browser frame profiler yang tersedia untuk audit ini, jadi angka timing di bawah derivasi dari source, bukan hasil alat performance.

## Dapatan

- Route transitions: card exit ~0.19s dengan stagger 0.012s, sehingga elemen terakhir bermula sekitar 180ms; outlet swap sekitar 210ms. React GSAP context cleanup apabila `display.key` berubah boleh cancel tweens yang belum selesai. Potensi gangguan lebih jelas bila pengguna menukar route dengan cepat. QA-011, source-derived.
- Tab indicator: kedua edge tween mula pada position timeline sama dengan durasi berbeza (~0.36s dan ~0.55s). Berbanding choreography Tavola yang diperhatikan, fill/indicator terasa kurang satu gerakan yang terancang; ini penilaian motion, bukan functional failure.
- Settings entrance reveal memakai `.55s`, stagger `.045s`; route/page elements menggunakan tempo berbeza. Chart reveal disebut sekitar 1.4s dalam source review, jauh lebih perlahan berbanding target reference yang kelihatan sekitar 0.5–0.85s. Rasa keseluruhan boleh jadi tidak seragam.
- Drawer More: actual probe berjaya buka, Tab fokus ke butang Close, Escape tutup dan fokus kembali ke trigger. Ini membuktikan path asas, bukan semua dialog trap/restore behavior.
- Aurora background bergerak berterusan melalui CSS. Sama ada ia restart ketika route switch tidak diukur dengan performance recording; jangan claim continuity sudah verified.
- Reduced-motion: CSS menghormati media query untuk animasi CSS tertentu. GSAP timelines perlu ujian runtime berasingan untuk memastikan semua route/entrance memberi instant state.

## Cadangan

Gunakan satu motion scale bagi feedback, content reveal dan route change. Untuk route swap, satu timeline coordinator perlu menunggu exit atau interrupt dengan state akhir konsisten; pastikan navigation spam tidak meninggalkan opacity/transform inline. Sasaran penerimaan: interaksi mula respon segera, page transition sekitar 300–450ms maksimum, stagger hanya pada kumpulan kecil, dan reduced-motion tiada pergerakan besar. Ukur dengan rakaman Chromium dan Firefox; semak 60fps pada peranti sebenar sebelum mendakwa lancar.

## Penilaian

Editorial 6/10: ada motion sistematik dan GSAP cleanup diimplementasi, tetapi tempo berbeza dan race/cleanup route exit ialah risiko. Jank sebenar, long-session leaks dan mobile frame drops belum direkod.
