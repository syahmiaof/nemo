# Dummy, Mock dan Feature Incomplete Audit

## Beza antara demo dan defect

Orbit Analytics dan rekod contoh lain memang kandungan fiksyen Demo Mode. Probe masuk demo → nampak Orbit → kembali ke personal empty state → Orbit tiada telah lulus. Kandungan ini tidak dilabel defect.

## Dapatan confirmed

| Kawasan | Kategori | Bukti | Impak |
|---|---|---|---|
| Calendar event row | Nonfunctional interaction | Row click/key handler hanya route task, assignment, milestone; event tiada branch | QA-006 |
| Clock Format setting | Ineffective preference | Nilai `hourFormat` disimpan; paparan AppShell guna formatter tetap | QA-007 |
| Quick Search | Incomplete navigation | Hasil route ke list modul tanpa record ID/selection | QA-008 |
| Data & Privacy copy | Misleading copy | “No cloud sync” sedangkan Account & Sync panel tersedia | QA-009 |
| Ask Nemo | Intents terhad | Exact suggested prompts return counts; paraphrase umum jadi generic suggested list | QA-010 |
| Sync bulk upload | Silent remote write error | Return error Supabase tidak dibaca, counts tetap naik | QA-004 |
| Sync pull | Incomplete deletion propagation | Tombstone difilter keluar dan tak apply locally | QA-003 |

## Tidak diklasifikasi sebagai dummy

- Empty personal workspace adalah state sah; tidak ada rekod peribadi di dalam profile probe.
- Ask Nemo unknown prompt mengembalikan soalan cadangan, bukan mereka data palsu.
- Production route smoke 8/8 berjaya render; ia tidak membuktikan login/sync.
- Tiada TODO/FIXME placeholder dilaporkan tanpa bukti source search khusus; audit ini tidak mendakwa semua callbacks seluruh aplikasi telah klik.

## Bukti/UI gaps

`functional-probe-results.json` menyimpan respons assistant dan avatar/backup check. `interaction-results.json` merekod drawer dan theme. Keseluruhan interaksi semua 131 signature tidak dilaksanakan; semak matrix untuk batas liputan.
