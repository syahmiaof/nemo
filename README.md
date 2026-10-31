<div align="center">
  <h1>nemo. — Track it, finish it.</h1>
  <p><strong>Workspace peribadi untuk projek, tugasan, pengajian dan matlamat.</strong></p>
  <p>
    <a href="https://nemo.syahmiaof.my"><img src="https://img.shields.io/badge/Demo-Live-60E1B5?style=for-the-badge&logoColor=60E1B5&labelColor=101713" alt="Demo Live" /></a>
    <a href="https://github.com/syahmiaof/nemo"><img src="https://img.shields.io/badge/Source-GitHub-60E1B5?style=for-the-badge&logo=github&logoColor=60E1B5&labelColor=101713" alt="GitHub Source" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-All_Rights_Reserved-60E1B5?style=for-the-badge&logoColor=60E1B5&labelColor=101713" alt="License: All Rights Reserved" /></a>
    <a href="https://github.com/syahmiaof/nemo/actions"><img src="https://img.shields.io/badge/Tests-357_Passed-60E1B5?style=for-the-badge&logo=vitest&logoColor=60E1B5&labelColor=101713" alt="Tests Passed" /></a>
    <a href="https://syahmiaof.my"><img src="https://img.shields.io/badge/Author-syahmiaof-60E1B5?style=for-the-badge&logo=vercel&logoColor=60E1B5&labelColor=101713" alt="Author" /></a>
  </p>

  <img src="public/brand/nemo-og.png" alt="Nemo social preview" width="100%" style="border-radius: 8px; box-shadow: 0 0 30px rgba(96,225,181,0.2);" />

  <br/><br/>

  <p><strong>Local-first personal productivity operating system storing data securely in IndexedDB with optional Supabase cloud synchronisation.</strong></p>

  <p><a href="https://nemo.syahmiaof.my">Live Workspace</a> • <a href="#-project-overview">Overview</a> • <a href="#-what-is-implemented">Features</a> • <a href="#-tech-stack">Tech Stack</a> • <a href="#-structure">Structure</a></p>
</div>

---

## 💎 Project Overview

- **Functionality**: Local-first personal productivity operating system featuring 10 core routes (Projects, Tasks, Academics, Calendar, Goals, Health, Finance) powered by client-side IndexedDB with optional Supabase cloud synchronization.
- **Aesthetic Value**: Aurora-themed dark UI with micro-interactions, responsive command pallet, three-slot Today's Focus hierarchy, and reduced-motion graceful degradation.
- **Business Value**: Delivers complete data sovereignty and zero-latency offline operation with zero subscription overhead for student and executive workflows.

---

## ✨ What is Implemented

- **10 Core Workspace Routes**: Overview, Projects, Tasks, Academics, Calendar, Goals, Health, Finance, Insights and Settings routes.
- **Task & Goal Hierarchy**: Canonical tasks linked to projects and goals, with a focused three-slot Today's Focus view.
- **Intelligent Projections**: Calendar projections and temporal insights dynamically derived from workspace records.
- **Data Sovereignty**: Local backup/restore engine, illustrative demo workspace, and offline PWA service worker caching.
- **Hybrid Cloud Synchronization**: Optional account and bidirectional sync integration via Supabase; local operation does not require sign-in.
- **Ergonomic Interaction**: Responsive navigation, command palette quick-add/search, and OS reduced-motion accessibility handling.

---

## 🛠️ Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/React_18-101713?style=for-the-badge&logo=react&logoColor=60E1B5&labelColor=101713" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-101713?style=for-the-badge&logo=typescript&logoColor=60E1B5&labelColor=101713" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-101713?style=for-the-badge&logo=vite&logoColor=60E1B5&labelColor=101713" alt="Vite" />
  <img src="https://img.shields.io/badge/IndexedDB_(Dexie)-101713?style=for-the-badge&logoColor=60E1B5&labelColor=101713" alt="IndexedDB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-101713?style=for-the-badge&logo=tailwindcss&logoColor=60E1B5&labelColor=101713" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-101713?style=for-the-badge&logo=supabase&logoColor=60E1B5&labelColor=101713" alt="Supabase" />
  <img src="https://img.shields.io/badge/Playwright-101713?style=for-the-badge&logo=playwright&logoColor=60E1B5&labelColor=101713" alt="Playwright" />
  <img src="https://img.shields.io/badge/Vitest-101713?style=for-the-badge&logo=vitest&logoColor=60E1B5&labelColor=101713" alt="Vitest" />
</p>

---

## 📁 Structure

- `src/app/` — routes, shell and responsive navigation.
- `src/features/` — workspace screens, widgets, and account management UI.
- `src/db/` and `src/domain/` — local records, schemas, and domain types.
- `src/sync/` — optional Supabase synchronization client.
- `tests/` and `docs/` — comprehensive automated test suites and architectural documentation.

---

## 🔒 Data & Boundaries

Workspace data is stored on the device unless account sync is configured and used. Browser storage can be cleared, so export a backup for important local records. Demo data is illustrative; Health and Finance views are workspace tools, not professional financial advice.

---

## 📜 License

Hak cipta terpelihara (c) 2026 **Muhammad Syahmi (syahmiaof)**. Dilesenkan di bawah [Proprietary All Rights Reserved](LICENSE).

---

## 👑 Builder

**Muhammad Syahmi (syahmiaof)**  
- Portfolio: [syahmiaof.my](https://syahmiaof.my)  
- GitHub: [@syahmiaof](https://github.com/syahmiaof)  
- Live Workspace: [nemo.syahmiaof.my](https://nemo.syahmiaof.my)
