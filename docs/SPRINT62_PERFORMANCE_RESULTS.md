# Spark V2 — measured performance

Measured on this Windows host using Playwright Chromium, production builds, demo data, 50 manual transitions and no video during measurement. Baseline is the pre-edit `a77bd2f` build; final is the isolated Spark build with `index-n00FGnaj.js`. The 51 source/destination quotes and card bounds match across each before/after pair.

| Metric | Desktop before | Desktop V2 | Mobile before | Mobile V2 |
|---|---:|---:|---:|---:|
| Viewport | 1440×900 | 1440×900 | 390×844 | 390×844 |
| Frame interval median | 66.6 ms | 66.6 ms | 33.3 ms | 33.3 ms |
| Frame interval p95 | 83.3 ms | 66.8 ms | 33.4 ms | 50.1 ms |
| Main-thread task time, whole measurement | 5.108 s | 6.840 s | 11.100 s | 11.792 s |
| Long tasks | 0 | 0 | 0 | 1 (92 ms) |
| Glyph extractions | 100 | 51 | 100 | 51 |
| Idle Canvas redraws / 750 ms | 0 | 0 | 0 | 0 |
| JS heap before GC-normalized run | 7,666,232 B | 7,680,392 B | 7,673,812 B | 7,690,776 B |
| JS heap after 50 transitions and GC | 8,335,400 B | 8,744,644 B | 8,333,260 B | 8,659,388 B |
| Page exceptions | 0 | 0 | 0 | 0 |

## Interpretation

The result is not universally faster. Desktop frame p95 improved, while mobile p95 worsened by about one frame and one long task was recorded. Total CPU task time increased. V2 also animates for 2 seconds instead of the old 1.7 seconds, so the total work is not duration-normalized. These measurements include surrounding application work and instrumentation, not solely the renderer. The host did not sustain 60 fps in either baseline or final; no 60 fps claim is made.

Final runs add GC checkpoints after transitions 10, 25 and 50. Baseline runs collected GC only at the endpoints. The mobile 92 ms task has not been attributed with a trace; it must not be asserted to originate from Spark or from GC without evidence.

The final renderer reduced glyph extraction by 49% through reuse of the previous target. It batches the glyph coverage into at most two mask draws and dust into bounded paths. The earlier individual-tile V2 attempt used 16.256 seconds of desktop task time across 50 transitions; it was rejected and optimized to 6.840 seconds. That is an internal prototype improvement, not the baseline-to-final improvement.

## Bounded memory evidence

| Checkpoint | Desktop V2 heap | Mobile V2 heap |
|---|---:|---:|
| Cycle 10 | 8,597,524 B | 8,487,852 B |
| Cycle 25 | 8,655,220 B | 8,554,544 B |
| Cycle 50 | 8,744,632 B | 8,659,328 B |

The retained geometry cache is capped at 12. Growth between cycle 10 and 50 was about 147 KB desktop / 171 KB mobile, rather than one retained geometry per transition. This short run supports bounded caching; it is not proof of zero memory leaks under every workload. Browser tests additionally verify the detached canvas becomes 1×1 and remount creates one renderer.

## WebKit limitation

Windows Playwright WebKit launched, but the full Nemo page was not a valid smooth-animation test environment. A diagnostic of the actual app observed only three requestAnimationFrame callbacks over six seconds. GSAP was unpaused and document visibility was normal, but its ticker advanced only 99 ms because of long scheduling gaps. Both the baseline capture attempt and V2 attempts timed out. See `evidence/sprint62/webkit-diagnostic/timing.json`.

Safari/iPhone acceptance remains open. Chromium mobile emulation is not a physical iPhone test. The performance gate should not be described as fully passed; local owner review and native-device confirmation are still required.

## Raw evidence and reproduction

- `evidence/sprint62/baseline-desktop/metrics.json`
- `evidence/sprint62/baseline-mobile/metrics.json`
- `evidence/sprint62/release-desktop/metrics.json`
- `evidence/sprint62/release-mobile/metrics.json`
- `tests/qa/spark-v2-capture.mjs`: set `SPARK_URL` to the relevant production preview, then run `node tests/qa/spark-v2-capture.mjs release desktop 50 perf` or `release mobile 50 perf`.

No production account or production data was used. Subsequent recordings were waived by the owner in favor of local visual review.
