import { test, expect } from '@playwright/test';

test.describe('Sprint 2 — Privacy & Local-First Network Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.getByRole('button', { name: 'Skip customization' });
    try {
      await skipBtn.waitFor({ state: 'visible', timeout: 3500 });
      await skipBtn.click();
      await skipBtn.waitFor({ state: 'hidden', timeout: 3500 });
    } catch {
      // already completed/dismissed
    }
  });

  test('asserts zero data egress, zero analytics/trackers, and total local-first execution', async ({ page }) => {
    const interceptedRequests: Array<{ url: string; method: string; postData?: string | null }> = [];

    // Intercept all outgoing network requests
    page.on('request', (request) => {
      interceptedRequests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData(),
      });
    });

    // 1. Visit projects and create sensitive project
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const privateTitle = `Confidential Client Project ${Date.now()}`;
    await page.getByRole('button', { name: 'New Project' }).first().click();
    await page.getByLabel('Project Title').fill(privateTitle);
    await page.getByLabel('Client').fill('Top Secret Enterprise Client');
    await page.getByRole('button', { name: 'Create Project' }).click();
    await expect(page.getByText(privateTitle, { exact: true })).toBeVisible();

    // 2. Create confidential task
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    const privateTask = `Confidential Security Audit Task ${Date.now()}`;
    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByLabel('Task Title').fill(privateTask);
    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page.getByText(privateTask, { exact: true })).toBeVisible();

    // 3. Export backup from settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Click 'Data & Backups' tab
    await page.getByRole('tab', { name: /Data & Backups/i }).click();

    // Click 'Export Backup'
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export Backup/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/nemo_backup_.*\.json/);

    // 4. Audit all intercepted requests
    const thirdPartyRequests = interceptedRequests.filter((req) => {
      const url = new URL(req.url);
      // Disallow external domains, telemetry, and tracking endpoints
      return !url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1');
    });

    // Verify ZERO requests to tracking/telemetry/analytics services
    const forbiddenPatterns = [
      'google-analytics.com',
      'doubleclick.net',
      'segment.io',
      'mixpanel.com',
      'sentry.io',
      'hotjar.com',
      'clarity.ms',
      'amplitude.com',
      'facebook.net',
      'intercom.io',
      'datadog',
      'posthog',
    ];

    for (const req of interceptedRequests) {
      for (const pattern of forbiddenPatterns) {
        expect(req.url).not.toContain(pattern);
      }
    }

    // Verify no user payload or task titles ever appeared in POST/PUT request bodies
    const egressedData = interceptedRequests.filter(
      (r) => r.postData && (r.postData.includes(privateTitle) || r.postData.includes(privateTask))
    );
    expect(egressedData).toHaveLength(0);

    // Filter out Google fonts preconnect/stylesheet if any, verify all data requests are purely local
    const dataEgressRequests = thirdPartyRequests.filter((req) => !req.url.includes('fonts.'));
    expect(dataEgressRequests).toHaveLength(0);
  });
});
