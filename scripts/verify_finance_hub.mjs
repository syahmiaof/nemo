import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/1102514f-bdd3-4c27-a1bd-e5f999af1756';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
  });
  const page = await context.newPage();

  console.log('1. Navigating to /finance...');
  await page.goto('http://localhost:5173/finance', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take screenshot of honest zero-data state
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_desktop_finance_empty_state.png'), fullPage: true });
  console.log('Captured qa_desktop_finance_empty_state.png');

  // 2. Click "Kemas Kini Gaji & Hari Gaji"
  console.log('2. Opening financial profile modal...');
  await page.getByRole('button', { name: 'Kemas Kini Gaji & Hari Gaji' }).click();
  await page.waitForTimeout(500);

  // Fill in monthly net income RM4,500 and payday 25
  const incomeInput = page.getByPlaceholder('Contoh: 4500.00');
  await incomeInput.fill('4500');
  const paydayInput = page.getByPlaceholder('Contoh: 25');
  await paydayInput.fill('25');
  await page.getByRole('button', { name: 'Simpan Profil' }).click();
  await page.waitForTimeout(800);

  // 3. Add Monthly Commitment
  console.log('3. Adding Monthly Commitment (Sewa Kondominium)...');
  await page.getByRole('button', { name: 'Tambah Komitmen' }).click();
  await page.waitForTimeout(500);
  await page.getByPlaceholder('Contoh: Sewa Rumah / TNB / Time Internet').fill('Sewa Kondominium');
  await page.getByPlaceholder('Contoh: 150.00').fill('750');
  await page.getByRole('button', { name: 'Tambah Komitmen' }).last().click();
  await page.waitForTimeout(800);

  // 4. Add Debt
  console.log('4. Adding Debt (PTPTN)...');
  await page.getByRole('button', { name: 'Tambah Hutang' }).click();
  await page.waitForTimeout(500);
  await page.getByPlaceholder('Contoh: Pinjaman PTPTN / Kereta Myvi').fill('Pinjaman PTPTN Ijazah');
  await page.getByPlaceholder('Contoh: PTPTN / Maybank / Aeon Credit').fill('PTPTN');
  await page.getByPlaceholder('Contoh: 30000.00').fill('28000');
  await page.getByPlaceholder('Contoh: 18500.00').fill('14000');
  await page.getByPlaceholder('Contoh: 350.00').fill('250');
  await page.getByRole('button', { name: 'Daftar Pinjaman' }).click();
  await page.waitForTimeout(800);

  // 5. Add Wishlist Item
  console.log('5. Adding Wishlist Item...');
  await page.getByRole('button', { name: 'Tambah Hajat' }).click();
  await page.waitForTimeout(500);
  await page.getByPlaceholder('Contoh: Kasut Lari Nike / Monitor 4K / Beg Travel').fill('Sony WH-1000XM5');
  await page.getByPlaceholder('Contoh: 350.00').fill('1299');
  await page.getByRole('button', { name: 'Masukkan ke Senarai' }).click();
  await page.waitForTimeout(800);

  // 6. Add Savings Goal
  console.log('6. Adding Savings Goal...');
  await page.getByRole('button', { name: 'Cipta Tabung' }).click();
  await page.waitForTimeout(500);
  await page.getByPlaceholder('Contoh: Tabung Kecemasan 3 Bulan / Percutian Jepun').fill('Percutian Musim Sejuk Jepun');
  await page.getByPlaceholder('Contoh: 5000.00').fill('4500');
  await page.getByPlaceholder('Contoh: 500.00').fill('1500');
  await page.getByRole('button', { name: 'Cipta Tabung' }).last().click();
  await page.waitForTimeout(1000);

  // 7. Capture Desktop Populated View
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_desktop_finance_populated.png'), fullPage: true });
  console.log('Captured qa_desktop_finance_populated.png');

  // 8. Test Toggle Commitment
  console.log('8. Toggling commitment payment status...');
  const togglePaidBtn = page.getByTitle('Tandakan sudah dibayar');
  if (await togglePaidBtn.isVisible()) {
    await togglePaidBtn.click();
    await page.waitForTimeout(500);
  }

  // 9. Test Record Debt Payment
  console.log('9. Recording debt payment...');
  await page.getByRole('button', { name: 'Rekod Bayar' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Sahkan Bayaran' }).click();
  await page.waitForTimeout(800);

  // 10. Visit Insights page to verify Financial Vitality panel
  console.log('10. Checking /insights for Financial Vitality panel...');
  await page.goto('http://localhost:5173/insights', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_desktop_insights_finance.png'), fullPage: true });
  console.log('Captured qa_desktop_insights_finance.png');

  // 11. Mobile Viewport Test (iPhone 14)
  console.log('11. Testing Mobile Viewport (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/finance', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_mobile_finance.png'), fullPage: true });
  console.log('Captured qa_mobile_finance.png');

  console.log('All browser verifications completed successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Playwright verification error:', err);
  process.exit(1);
});
