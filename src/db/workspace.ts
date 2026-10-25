import { db, ensureSettings, type NemoDatabase } from './nemoDb';
import { DEMO_DATABASE_NAME } from './workspaceMode';
import { createDemoFixtures } from '@/demo/fixtures';

export { getWorkspaceMode, switchWorkspace } from './workspaceMode';

/** Transaction-level guard prevents fixtures or reset from targeting a real database. */
export async function seedDemoWorkspace(database: NemoDatabase, reset = false, anchor = new Date()): Promise<void> {
  if (database.name !== DEMO_DATABASE_NAME) throw new Error('Demo operations are only permitted in the demo database.');
  // Prepare artwork and validate before opening a transaction.
  const fixtures = createDemoFixtures(anchor);
  await database.transaction('rw', database.tables, async () => {
    // This check occurs inside the transaction, including when multiple tabs initialize together.
    if (!reset && await database.settings.get('default')) return;
    if (reset) {
      for (const table of database.tables) await table.clear();
    } else {
      // Never silently overwrite an unrecognized, partially populated namespace.
      for (const table of database.tables) {
        if (await table.count()) throw new Error('Demo storage contains unrecognized data. Use Reset demo to replace it.');
      }
    }
    await database.settings.add(fixtures.settings);
    await database.projects.bulkAdd(fixtures.projects);
    await database.tasks.bulkAdd(fixtures.tasks);
    await database.milestones.bulkAdd(fixtures.milestones);
    await database.semesters.bulkAdd(fixtures.semesters);
    await database.subjects.bulkAdd(fixtures.subjects);
    await database.assignments.bulkAdd(fixtures.assignments);
    await database.calendarEvents.bulkAdd(fixtures.calendarEvents);
    await database.goals.bulkAdd(fixtures.goals);
    await database.goalTaskLinks.bulkAdd(fixtures.goalTaskLinks);
    await database.focusSelections.bulkAdd(fixtures.focusSelections);
    await database.assetBlobs.bulkAdd(fixtures.assetBlobs);
    if (fixtures.hydrationLogs?.length) await database.hydrationLogs.bulkAdd(fixtures.hydrationLogs);
    if (fixtures.dietLogs?.length) await database.dietLogs.bulkAdd(fixtures.dietLogs);
    if (fixtures.workoutLogs?.length) await database.workoutLogs.bulkAdd(fixtures.workoutLogs);
    if (fixtures.bodyMetrics?.length) await database.bodyMetrics.bulkAdd(fixtures.bodyMetrics);
    if (fixtures.financialProfiles?.length) await database.financialProfiles.bulkAdd(fixtures.financialProfiles);
    if (fixtures.financialCommitments?.length) await database.financialCommitments.bulkAdd(fixtures.financialCommitments);
    if (fixtures.debts?.length) await database.debts.bulkAdd(fixtures.debts);
    if (fixtures.debtPayments?.length) await database.debtPayments.bulkAdd(fixtures.debtPayments);
    if (fixtures.wishlistItems?.length) await database.wishlistItems.bulkAdd(fixtures.wishlistItems);
    if (fixtures.savingsGoals?.length) await database.savingsGoals.bulkAdd(fixtures.savingsGoals);
    if (fixtures.savingsDeposits?.length) await database.savingsDeposits.bulkAdd(fixtures.savingsDeposits);
    if (fixtures.visionItems?.length) await database.visionItems.bulkAdd(fixtures.visionItems);
    if (fixtures.monthlyRoadmaps?.length) await database.monthlyRoadmaps.bulkAdd(fixtures.monthlyRoadmaps);
    if (fixtures.incomeItems?.length) await database.incomeItems.bulkAdd(fixtures.incomeItems);
    if (fixtures.ibadahDailyLogs?.length) await database.ibadahDailyLogs.bulkAdd(fixtures.ibadahDailyLogs);
    if (fixtures.qadhaPrayers?.length) await database.qadhaPrayers.bulkAdd(fixtures.qadhaPrayers);
    if (fixtures.qadhaFastings?.length) await database.qadhaFastings.bulkAdd(fixtures.qadhaFastings);
  });
}

export async function initializeWorkspace(): Promise<void> {
  if (db.name === DEMO_DATABASE_NAME) await seedDemoWorkspace(db);
  else await ensureSettings();
}

export async function resetDemoWorkspace(): Promise<void> {
  await seedDemoWorkspace(db, true);
}
