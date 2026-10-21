# Full Interaction Test Matrix

## Kaedah

Inventory automatik mengumpul button, link, inputs, selects, tabs, switches, checkboxes dan menuitems pada 24 kombinasi route/tema di 390px. Ia merekod 1,275 instance dan 131 signature berbeza. Ia tidak klik setiap instance; coverage penuh tidak dituntut. Interaksi aktif dilakukan dalam profile Chromium disposable di build lokal 127.0.0.1:4174. Production hanya GET.

## Route / kawalan

| Route | Kawalan penting dalam inventory | Bukti interaksi | Persist selepas reload | Status / jurang |
|---|---|---|---|---|
| Overview | nav, quick-add, metric switch, task complete, card links | visual matrix; route rendering; demo switch manual | Demo isolation dipastikan | KPI semasa demo, bukan real analytics test |
| Projects | search/filter, create, view/layout, project actions | route & screenshot 3 tema | CRUD journey penuh tidak selesai dalam turn ini | Partial; linked task/milestone/delete relationships belum E2E |
| Tasks | filters, create/edit actions, priority/status, focus controls | 169 visible controls pada 320px matrix; route render | CRUD persistence full journey belum diulang | Partial; fixture-free bulk task scenario tidak dilakukan |
| Calendar | prev/next/today, view tabs, add event, day selection | source review + route render | event lifecycle belum | Event row click no-op (QA-006); week/month edge belum diuji |
| Academics | semester/subject/assignment controls | route render, 98 controls at 320px | full CRUD not run | Partial; cascading deletion/calendar projection belum verified |
| Goals | create/edit/delete, link task | route render, inventory | full lifecycle not run | Partial; derive progress & task links not E2E |
| Insights | range/filter/chart controls | route render and 3-theme images | N/A | Metric reconciliation/large dataset not run |
| Settings | theme tabs, profile/avatar, clock, data backup/restore, sync, demo | avatar upload→replace→reload→remove; backup export; theme snapshots | avatar persisted; export succeeded; theme snapshots | restore not performed; no production auth/sync |
| Global search | shortcut, query, result | source audit | no | destination is module route without record ID (QA-008) |
| Ask Nemo | drawer, question, send, suggested intents | 5 supported questions accurate; unknown returns suggestions | local data only | phrase coverage limited (QA-010) |
| More sheet / dialogs | open, close, Escape, focus | 1 dialog visible; Escape close and trigger focus restore; Tab reached close | N/A | Focus trap and all dialogs not comprehensively audited |
| Demo Mode | enter demo, return to personal | project Orbit shown in demo then absent in personal empty state | state isolation observed | manual probe passed; stale legacy selector causes E2E failure |

## Data journeys

- Lulus: theme application snapshots; avatar upload, replacement, persistence, removal, initials fallback; disposable demo backup export; Demo enter/exit isolation; supported Ask Nemo query/counts; assistant unknown query did not invent workspace rows.
- Belum selesai: project→milestone→task→complete→progress; academic assignment→Calendar; full task edit/delete; goal link; restore round trip; offline/reconnect; auth/session; sync on second device. Cloud-dependent tests blocked pending staging credential/project.
- Setiap record sementara yang dibuat untuk probe adalah dalam demo/browser context disposable; no owner IndexedDB clearing and no production write.

## Browser matrix

| Browser | 8 route mobile smoke | Result |
|---|---:|---|
| Chromium | 8/8 | no overflow, no console errors |
| Firefox | 8/8 | no overflow, no console errors |
| WebKit | 8/8 | no overflow, no console errors; effective `innerWidth` 384 on some routes |

Desktop full cross-engine interaction belum dibuat. Mobile smoke ialah 390×844.
