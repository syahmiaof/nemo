import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/1102514f-bdd3-4c27-a1bd-e5f999af1756';

async function run() {
  console.log('Starting preview server on port 4173...');
  let server;
  try {
    server = await preview({
      preview: {
        port: 4173,
      },
    });
  } catch (err) {
    console.log('Preview server could already be running or failed:', err.message);
  }

  const browser = await chromium.launch({ headless: true });

  try {
    // ----------------------------------------------------
    // Scenario 1: Short Laptop Viewport (1366 x 680)
    // ----------------------------------------------------
    console.log('Testing Scenario 1: Short Laptop Viewport (1366 x 680)...');
    const laptopContext = await browser.newContext({
      viewport: { width: 1366, height: 680 },
    });
    const laptopPage = await laptopContext.newPage();
    await laptopPage.goto('http://localhost:4173/overview', { waitUntil: 'networkidle' });
    await laptopPage.waitForTimeout(1000);

    // Dismiss splash / onboarding if any
    await laptopPage.keyboard.press('Escape');
    await laptopPage.waitForTimeout(500);

    // Ensure Roadmap section is in view
    const section = laptopPage.locator('section[aria-labelledby="journey-roadmap-title"]');
    await section.waitFor({ state: 'visible', timeout: 5000 });
    await section.scrollIntoViewIfNeeded();
    await laptopPage.waitForTimeout(600);

    // Make sure H2 (Jul - Dec) is selected if October is not visible
    const octEditBtn = laptopPage.locator('button[aria-label="Edit OCT roadmap"]').first();
    const isOctVisible = await octEditBtn.isVisible().catch(() => false);
    if (!isOctVisible) {
      console.log('OCT not immediately visible, switching to H2 tab...');
      const h2Tab = laptopPage.locator('button:has-text("H2 (Jul - Dec)")');
      if (await h2Tab.isVisible()) {
        await h2Tab.click();
        await laptopPage.waitForTimeout(500);
      }
    }

    await octEditBtn.waitFor({ state: 'visible', timeout: 5000 });
    await octEditBtn.click();
    await laptopPage.waitForTimeout(600);

    // Locate the modal dialog
    const modal = laptopPage.locator('div[role="dialog"][aria-labelledby="modal-title"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    const header = modal.locator('#modal-title');
    await header.waitFor({ state: 'visible', timeout: 3000 });
    const headerText = await header.innerText();
    console.log(`Modal header visible: "${headerText}"`);

    const cancelBtn = modal.locator('button:has-text("Cancel")');
    await cancelBtn.waitFor({ state: 'visible', timeout: 3000 });

    const saveBtn = modal.locator('button:has-text("Save Roadmap")');
    await saveBtn.waitFor({ state: 'visible', timeout: 3000 });

    // Assert positions within 680px height viewport
    const headerBox = await header.boundingBox();
    const saveBox = await saveBtn.boundingBox();
    console.log(`Laptop header pos: Y=${headerBox.y}, height=${headerBox.height}`);
    console.log(`Laptop save button pos: Y=${saveBox.y}, height=${saveBox.height}`);

    if (!headerBox || headerBox.y < 0) {
      throw new Error(`Header is clipped off the top! Y=${headerBox?.y}`);
    }
    if (!saveBox || saveBox.y + saveBox.height > 680) {
      throw new Error(`Save button is clipped off the bottom! bottom=${saveBox ? saveBox.y + saveBox.height : 'null'}`);
    }

    const laptopScreenshotPath = path.join(ARTIFACT_DIR, 'qa_laptop_roadmap_modal_fixed.png');
    await laptopPage.screenshot({
      path: laptopScreenshotPath,
      fullPage: false,
    });
    console.log(`✓ Laptop screenshot saved: ${laptopScreenshotPath}`);

    await cancelBtn.click();
    await laptopPage.waitForTimeout(400);
    await laptopContext.close();

    // ----------------------------------------------------
    // Scenario 2: Standard Desktop Viewport (1440 x 900)
    // ----------------------------------------------------
    console.log('Testing Scenario 2: Standard Desktop Viewport (1440 x 900)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto('http://localhost:4173/overview', { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1000);

    await desktopPage.keyboard.press('Escape');
    await desktopPage.waitForTimeout(500);

    const desktopSection = desktopPage.locator('section[aria-labelledby="journey-roadmap-title"]');
    await desktopSection.waitFor({ state: 'visible', timeout: 5000 });
    await desktopSection.scrollIntoViewIfNeeded();
    await desktopPage.waitForTimeout(600);

    const desktopOctEditBtn = desktopPage.locator('button[aria-label="Edit OCT roadmap"]').first();
    const isDesktopOctVisible = await desktopOctEditBtn.isVisible().catch(() => false);
    if (!isDesktopOctVisible) {
      const h2Tab = desktopPage.locator('button:has-text("H2 (Jul - Dec)")');
      if (await h2Tab.isVisible()) {
        await h2Tab.click();
        await desktopPage.waitForTimeout(500);
      }
    }

    await desktopOctEditBtn.waitFor({ state: 'visible', timeout: 5000 });
    await desktopOctEditBtn.click();
    await desktopPage.waitForTimeout(600);

    const desktopModal = desktopPage.locator('div[role="dialog"][aria-labelledby="modal-title"]');
    await desktopModal.waitFor({ state: 'visible', timeout: 5000 });

    const desktopHeader = desktopModal.locator('#modal-title');
    await desktopHeader.waitFor({ state: 'visible', timeout: 3000 });

    const desktopCancelBtn = desktopModal.locator('button:has-text("Cancel")');
    await desktopCancelBtn.waitFor({ state: 'visible', timeout: 3000 });

    const desktopSaveBtn = desktopModal.locator('button:has-text("Save Roadmap")');
    await desktopSaveBtn.waitFor({ state: 'visible', timeout: 3000 });

    const desktopScreenshotPath = path.join(ARTIFACT_DIR, 'qa_desktop_roadmap_modal_fixed.png');
    await desktopPage.screenshot({
      path: desktopScreenshotPath,
      fullPage: false,
    });
    console.log(`✓ Desktop screenshot saved: ${desktopScreenshotPath}`);

    await desktopCancelBtn.click();
    await desktopPage.waitForTimeout(400);
    await desktopContext.close();

    console.log('All verification assertions passed flawlessly!');
  } finally {
    await browser.close();
    if (server && server.httpServer) {
      server.httpServer.close();
      console.log('Preview server closed.');
    }
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
