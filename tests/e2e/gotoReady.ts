import type { Page } from '@playwright/test';

const onboardingHandled = new WeakSet<Page>();

/** Hard loads intentionally replay Nemo's intro; dismiss it before exercising page controls. */
export async function dismissBlockingIntro(page: Page) {
  const welcome = page.getByRole('dialog', { name: 'Welcome to Nemo' });
  await welcome.waitFor({ state: 'visible', timeout: 1200 }).catch(() => undefined);
  if (await welcome.isVisible()) {
    await welcome.click();
    await welcome.waitFor({ state: 'hidden', timeout: 5000 });
  }
  if (!onboardingHandled.has(page)) {
    const onboarding = page.getByRole('button', { name: 'Skip customization' });
    await onboarding.waitFor({ state: 'visible', timeout: 1200 }).catch(() => undefined);
    if (await onboarding.isVisible()) {
      await onboarding.click();
      await onboarding.waitFor({ state: 'hidden', timeout: 5000 });
    }
    onboardingHandled.add(page);
  }
}

export async function gotoReady(page: Page, url: string) {
  await page.goto(url);
  await dismissBlockingIntro(page);
}
