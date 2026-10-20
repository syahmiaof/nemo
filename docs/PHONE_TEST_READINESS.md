# Nemo Physical Phone Preview & Testing Guide

**Sprint:** 5.1 Hardening & Acceptance  
**Branch:** `sprint5-private-cloud-sync`  
**Purpose:** Provide step-by-step instructions for the owner to test real cross-device synchronization between laptop and physical phone safely, without touching or risking the live production domain (`https://nemo.syahmiaof.my`).

---

## 1. Safety & Data Protection Pre-requisites

> [!IMPORTANT]
> The live domain `https://nemo.syahmiaof.my` is currently hosting the stable single-device release. **Do NOT deploy or merge `sprint5-private-cloud-sync` to production yet.**
>
> All testing described below uses the branch preview running locally or over a private local network tunnel.

---

## 2. Setting Up Local Network Preview for Phone

To access the preview build on your phone while connected to the same Wi-Fi network:

### Step 1: Start Vite with Host Exposure
In your terminal on your laptop:
```bash
npm run dev -- --host
```
Vite will output network URLs, for example:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.50:5173/
```

### Step 2: Configure Environment Variables
Ensure your `.env.local` contains your Supabase project keys:
```env
VITE_SUPABASE_URL=https://koiugvkflppdvafpszrk.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Step 3: Configure Supabase Redirect URLs
In the Supabase Dashboard:
1. Go to **Authentication** → **URL Configuration**.
2. Add your local IP to **Redirect URLs**:
   ```
   http://192.168.1.50:5173/**
   ```
   *(Replace with your actual laptop IP shown by Vite)*

---

## 3. Step-by-Step Two-Device Acceptance Journey

### Phase A: Laptop Preparation
1. Open Chrome or Edge on your laptop at `http://localhost:5173`.
2. Go to **Settings** → **Account / Cloud Sync**.
3. Enter your approved email (`syahmiaof123@gmail.com`) and click **Send OTP / Magic Link**.
4. Check your inbox, enter the 6-digit code or click the confirmation link.
5. Confirm the sync indicator turns **Green ("Connected / Synced")**.
6. Create a test task:
   - Title: `Test Sync from Laptop #1`
   - Priority: `High`
   - Due Date: Today

### Phase B: Phone Verification
1. On your phone (connected to the same Wi-Fi), open Safari (iOS) or Chrome (Android).
2. Navigate to `http://192.168.1.50:5173`.
3. Go to **Settings** → **Account / Cloud Sync**.
4. Sign in with the exact same email (`syahmiaof123@gmail.com`) and verify OTP.
5. Wait 3 seconds for initial background sync.
6. Verify:
   - Does `Test Sync from Laptop #1` appear on your phone screen? (Expected: **Yes**)

### Phase C: Phone-to-Laptop Verification
1. On your phone, tap `Test Sync from Laptop #1` and mark it **Done**.
2. Create a new task on your phone:
   - Title: `Test Sync from Phone #2`
3. Look at your laptop screen:
   - Within 5 seconds (or upon tapping "Sync Now"), `Test Sync from Laptop #1` should update to **Done**, and `Test Sync from Phone #2` should appear!

### Phase D: Offline Verification
1. Turn on **Airplane Mode** on your phone.
2. Create task: `Offline on Phone #3`.
3. Notice that Nemo continues to work smoothly without errors.
4. Turn off **Airplane Mode**.
5. Once Wi-Fi reconnects, verify that `Offline on Phone #3` automatically syncs to your laptop.

---

## 4. Rollback & Cleanup

If you ever wish to clear test data from your local browser:
- In Nemo, go to **Settings** → **Storage & Data** → **Reset / Clear Test Data**.
- This will cleanly reset your local IndexedDB without affecting any other devices.
