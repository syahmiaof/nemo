# Accessibility Report

Ini audit terhad, bukan pengesahan WCAG 2.2 AA penuh.

## Bukti

- Browser matrix menunjukkan nav dan route render; 320×640–1920×1080 tiada horizontal overflow/control offscreen.
- More drawer: dialog muncul; Tab membawa fokus ke Close; Escape menutup; fokus pulang ke trigger.
- Keyboard End pada Settings memfokus tab terakhir “About & Notice” dan `aria-selected=true`; legacy E2E masih mengharap “Demo Mode”.
- Avatar flow ada input file dan fallback initials “AM”.
- Tidak dijalankan: axe/contrast computation, screen reader NVDA/VoiceOver, full keyboard traversal semua route, zoom 200/400%, browser forced-colors, touch-target measurement, error announcement/live regions.

## Risiko/semakan seterusnya

- Jangan anggap satu dialog mengesahkan semua modal ada focus trap/restore.
- Contrast text/border atas glass dan disabled/error states belum diukur; visual darkness sahaja tidak cukup untuk tuntutan WCAG.
- Semak tab order terhadap bottom navigation, chart controls, icon-only buttons dan tooltip labels.
- Pastikan reduced-motion setting/media query juga memendekkan GSAP timeline, bukan hanya CSS keyframes.
- Audit form errors diumumkan secara programatik, labels/description, focus ke field salah dan status sync/assistant yang berubah.

Verdict: semakan keyboard asas lulus untuk drawer dan tab focus scenario; accessibility compliance keseluruhan **belum ditentukan**.
