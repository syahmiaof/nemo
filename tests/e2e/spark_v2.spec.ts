import { test, expect, type Page } from "@playwright/test";
import { gotoReady } from "./gotoReady";
const selector = 'section[aria-label="Spark of focus motivational quote"]';
const card = (page: Page) => page.locator(selector);
async function ready(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem("nemo:workspace-mode", "demo"),
  );
  await gotoReady(page, "/overview");
  await card(page).scrollIntoViewIfNeeded();
  await page.mouse.move(1, 1);
  await card(page)
    .getByRole("button", { name: "Pause quote rotation" })
    .dispatchEvent("click");
  await page.waitForTimeout(2200);
}
async function next(page: Page) {
  await card(page)
    .getByRole("button", { name: "Next motivational quote" })
    .dispatchEvent("click");
  await expect(card(page).locator("canvas")).toHaveAttribute(
    "data-motion-phase",
    /.+/,
  );
}

test("real glyph morph hides the source on mobile and reconstructs readable text with no idle canvas draws", async ({
  page,
}) => {
  await ready(page);
  const quote = card(page).locator("p").first(),
    before = await quote.textContent();
  const box = await card(page).boundingBox();
  await next(page);
  await expect(quote).toHaveCSS("opacity", "0");
  await expect(quote).not.toHaveText(before!);
  await expect(quote).toHaveCSS("opacity", "1");
  await expect(card(page).locator("canvas")).not.toHaveAttribute(
    "data-motion-phase",
    /.+/,
  );
  const after = await card(page).boundingBox();
  expect(Math.abs(after!.height - box!.height)).toBeLessThanOrEqual(1);
  expect(
    await card(page)
      .locator("canvas")
      .evaluate((e) => ({ width: (e as HTMLCanvasElement).width, height: (e as HTMLCanvasElement).height })),
  ).toEqual({ width: 1, height: 1 });
});

test("manual pause, focus and hidden tab suspend a running morph and resume it", async ({
  page,
}) => {
  await ready(page);
  await next(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(100);
  const canvas = card(page).locator("canvas");
  const paused = await canvas.evaluate((e) => (e as HTMLCanvasElement).toDataURL());
  await page.waitForTimeout(400);
  expect(await canvas.evaluate((e) => (e as HTMLCanvasElement).toDataURL())).toBe(paused);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await card(page)
    .getByRole("button", { name: "Resume quote rotation" })
    .focus();
  await page.waitForTimeout(100);
  const focusFrame = await canvas.evaluate((e) => (e as HTMLCanvasElement).toDataURL());
  await page.waitForTimeout(300);
  expect(await canvas.evaluate((e) => (e as HTMLCanvasElement).toDataURL())).toBe(focusFrame);
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
  });
  await card(page).scrollIntoViewIfNeeded();
  await page.mouse.move(1, 1);
  await expect(card(page).locator("p").first()).toHaveCSS("opacity", "1");
});

test("the pause button freezes an in-flight morph until resume", async ({ page }) => {
  await ready(page);
  await card(page).getByRole('button', {name:'Resume quote rotation'}).dispatchEvent('click');
  await next(page);
  await card(page).getByRole('button', {name:'Pause quote rotation'}).dispatchEvent('click');
  const canvas = card(page).locator('canvas');
  await page.waitForTimeout(100);
  const frozen = await canvas.evaluate(e => (e as HTMLCanvasElement).toDataURL());
  await page.waitForTimeout(350);
  expect(await canvas.evaluate(e => (e as HTMLCanvasElement).toDataURL())).toBe(frozen);
  await card(page).getByRole('button', {name:'Resume quote rotation'}).dispatchEvent('click');
  await expect(card(page).locator('p').first()).toHaveCSS('opacity','1');
});

test("offscreen card suspends its canvas and resizing completes safely with fresh wrapping", async ({
  page,
}) => {
  await ready(page);
  await next(page);
  await page.evaluate(() =>
    document.querySelector("main")?.scrollIntoView({ block: "start" }),
  );
  // Physically translate only the test subject outside the viewport to exercise
  // IntersectionObserver even on desktop where the whole Overview fits.
  await card(page).evaluate((e) => {
    e.style.transform = "translateY(2000px)";
  });
  await page.waitForTimeout(150);
  const canvas = card(page).locator("canvas"),
    snapshot = await canvas.evaluate((e) => (e as HTMLCanvasElement).toDataURL());
  await page.waitForTimeout(350);
  expect(await canvas.evaluate((e) => (e as HTMLCanvasElement).toDataURL())).toBe(snapshot);
  await card(page).evaluate((e) => {
    e.style.transform = "";
  });
  await card(page).scrollIntoViewIfNeeded();
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(card(page).locator("p").first()).toHaveCSS("opacity", "1");
  expect(
    await card(page)
      .locator("p")
      .first()
      .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
  ).toBe(true);
});

test("rapid navigation disposes the old canvas and remount creates one renderer", async ({
  page,
}) => {
  await ready(page);
  await next(page);
  const detached = await card(page).locator('canvas').elementHandle();
  await page.locator('a[href="/projects"]').first().dispatchEvent("click");
  await expect(card(page)).toHaveCount(0);
  expect(await detached!.evaluate(e => ({width:(e as HTMLCanvasElement).width, height:(e as HTMLCanvasElement).height})))
    .toEqual({width:1,height:1});
  await page.locator('a[href="/overview"]').first().dispatchEvent("click");
  await expect(card(page)).toHaveCount(1);
  await card(page).scrollIntoViewIfNeeded();
  await expect(card(page).locator("canvas")).toHaveCount(1);
  await expect(card(page).locator("p").first()).toHaveCSS("opacity", "1");
});

test("reduced motion stays as accessible DOM typography without creating a particle field", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  const quote = card(page).locator("p").first(),
    old = await quote.textContent();
  await card(page)
    .getByRole("button", { name: "Next motivational quote" })
    .dispatchEvent("click");
  await expect(quote).not.toHaveText(old!);
  await expect(quote).toHaveCSS("opacity", "1");
  await expect(card(page).locator("canvas")).not.toHaveAttribute(
    "data-motion-phase",
    /.+/,
  );
  expect(await card(page).locator("[aria-live]").count()).toBe(0);
});

