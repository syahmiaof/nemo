# Audit Mengikut Modul

Status menunjukkan kedalaman bukti, bukan rating kualiti mutlak.

| Modul | Semakan | Hasil | Baki yang perlu diuji |
|---|---|---|---|
| Overview | 3 tema, 10 saiz, route render, screenshots | Layout render stabil, tiada overflow; chart/right stack height tidak konsisten mengikut isi (QA-012) | KPI dengan data baru, action completion, chart interaction dan comparison |
| Projects & milestones | Source scan, route/theme snapshots | Route berfungsi pada render; CRUD relationships belum dijalankan hujung-ke-hujung | Create/edit/delete, cover, milestone, linked task progress, dangling refs |
| Tasks & Focus | Inventory/screenshot route semua saiz | Banyak controls kelihatan dan tiada overflow; CRUD full journey belum dikesan dalam run ini | Add/edit/complete/delete/filter, Focus cap, persistence, links |
| Calendar | Route render/source click handler | Event row tiada tindakan (QA-006) | month/year boundary, projection accuracy, event edit/delete, agenda mobile |
| Academics | Route render dan controls inventory | Tiada runtime failure; data flow belum E2E | Semester/subject/assignment CRUD, status, cascade, calendar projection |
| Goals | Route render 3 tema | Progress/task links belum disahkan dengan fixture | lifecycle, derive progress, complete status, task references |
| Insights | Route/screenshots 3 tema | Render stabil, chart data belum dibandingkan dengan source records | empty/large data, filters/tooltips, metric correctness |
| Settings/profile | Interaction probe | Avatar upload, replace, persistence, remove; backup export; 12/24 preference dead; privacy copy outdated | restore round-trip, all settings persistence, contrast every state |
| Search | Source review | Search result opens module route; record targeting missing (QA-008) | keyboard/results/persisted record details |
| Ask Nemo | Runtime intent probe | Supported intents return counts (5 due today, 6 overdue, 6 active projects, 14 complete this month, 4 active goals); unknown no hallucination | rephrasing, empty personal workspace, date/time boundaries |
| Auth & Sync | Source review only | Four major sync risks, P0 credential issue; no cloud writes | staging auth/session/RLS/offline/2-device/conflict tests |
| Demo Mode | Browser flow | Fictional Orbit appears in demo and disappears after return to personal empty state | CRUD separation and all settings/export across mode switches |
| PWA/offline | Manifest/network smoke source checks | Production root and manifest reachable at audit time; service worker offline behavior not tested | fresh-install/offline/reconnect/physical mobile/app icons |

Route screenshots are in `../artifacts/sprint53/` relative to this report directory (e.g. `../artifacts/sprint53/midnight-390-calendar.png`).
