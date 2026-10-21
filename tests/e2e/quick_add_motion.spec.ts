import { expect, test } from '@playwright/test';
import { gotoReady } from './gotoReady';

test('Quick Add type tabs animate, retain independent drafts, and support arrow keys', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoReady(page, '/overview');
  await page.getByRole('button', { name: 'Quick Add', exact: true }).click();

  const dialog = page.getByRole('dialog', { name: 'Quick Add' });
  const tabs = dialog.getByRole('tablist', { name: 'Commitment type' });
  const taskTab = tabs.getByRole('tab', { name: 'task' });
  const projectTab = tabs.getByRole('tab', { name: 'project' });
  const assignmentTab = tabs.getByRole('tab', { name: 'assignment' });
  const taskTitle = dialog.getByLabel('Task Title');
  const projectTitle = dialog.getByLabel('Project Title');
  const assignmentTitle = dialog.getByLabel('Assignment Title');

  await taskTitle.fill('Task draft stays here');
  await projectTab.click();
  await dialog.screenshot({ path: 'docs/evidence/sprint61/quickadd-tab-transition.png' });
  await expect(projectTitle).toBeVisible();
  await expect(projectTitle).toHaveValue('');
  await projectTitle.fill('Project draft stays here');
  await assignmentTab.click();
  await assignmentTitle.fill('Assignment draft stays here');

  await taskTab.click();
  await expect(taskTitle).toHaveValue('Task draft stays here');
  await projectTab.click();
  await expect(projectTitle).toHaveValue('Project draft stays here');

  const assignmentIndicator = dialog.locator('[role="tablist"] > span[aria-hidden="true"]');
  const transformBeforeKeyboard = await assignmentIndicator.evaluate((element) => getComputedStyle(element).transform);
  await projectTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(assignmentTab).toHaveAttribute('aria-selected', 'true');
  await expect(assignmentTitle).toHaveValue('Assignment draft stays here');
  await expect.poll(() => assignmentIndicator.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(transformBeforeKeyboard);
});

test('Quick Add creates each supported commitment type in the isolated demo workspace', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem('nemo:workspace-mode', 'demo'));
  await gotoReady(page, '/academics');
  await page.getByRole('button', { name: 'New Semester' }).click();
  await page.getByLabel('Semester Name').fill('Quick Add QA Semester');
  await page.getByRole('dialog').getByRole('button', { name: 'Create Semester' }).click();
  await expect(page.getByText('Semester created')).toBeVisible();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByLabel('Subject Title').fill('Quick Add Test Subject');
  await page.getByLabel('Subject Code').fill('QA-101');
  await page.getByRole('dialog').getByRole('button', { name: 'Add Subject' }).click();
  await expect(page.getByText('Quick Add Test Subject')).toBeVisible();
  await gotoReady(page, '/overview');

  const openQuickAdd = async () => {
    await page.getByRole('button', { name: 'Quick Add', exact: true }).click();
    return page.getByRole('dialog', { name: 'Quick Add' });
  };
  const create = async (type: 'task' | 'project' | 'assignment' | 'event', title: string) => {
    const dialog = await openQuickAdd();
    await dialog.getByRole('tab', { name: type, exact: true }).click();
    await dialog.getByLabel(`${type[0].toUpperCase()}${type.slice(1)} Title`).fill(title);
    await dialog.getByRole('button', { name: `Create ${type[0].toUpperCase()}${type.slice(1)}`, exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(`${type[0].toUpperCase()}${type.slice(1)} created`, { exact: true })).toBeVisible();
  };

  await create('task', 'Quick Add task acceptance');
  await create('project', 'Quick Add project acceptance');
  await create('assignment', 'Quick Add assignment acceptance');
  await create('event', 'Quick Add event acceptance');
});
