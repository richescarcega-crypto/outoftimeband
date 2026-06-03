import { test, expect } from '@playwright/test';
import {
  BROWSER_STUB_SCRIPT,
  TEST_LOCAL_STORAGE,
} from '../helpers/browser-stubs.mjs';
import {
  isAllowedConsoleMessage,
  isAllowedPageError,
} from '../helpers/console-allowlist.mjs';

const R941_VERSION_MARKER = '2026-06-01-r941-display-mode-rollback';
const FORBIDDEN_SCRIPT = 'oot_display_r940.js';

test.describe('r941 runtime smoke baseline', () => {
  test.beforeEach(async ({ page }) => {
    const unexpectedPageErrors = [];

    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.includes(FORBIDDEN_SCRIPT)) {
        return route.abort('blockedbyclient');
      }
      if (url.includes('cdn.onesignal.com') || url.includes('www.gstatic.com/firebasejs/')) {
        return route.abort('blockedbyclient');
      }
      return route.continue();
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isAllowedConsoleMessage(msg.text())) {
        console.warn(`[console.error] ${msg.text()}`);
      }
    });

    page.on('pageerror', (error) => {
      if (!isAllowedPageError(error.message)) {
        unexpectedPageErrors.push(error.message);
      }
    });

    await page.addInitScript(BROWSER_STUB_SCRIPT);
    await page.addInitScript((storage) => {
      for (const [key, value] of Object.entries(storage)) {
        window.localStorage.setItem(key, value);
      }
    }, TEST_LOCAL_STORAGE);

    await page.goto('/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => typeof window.WHATS_NEW_VERSION === 'string', null, {
      timeout: 90000,
    });
    await page.waitForFunction(() => {
      const home = document.getElementById('sc-home');
      return !!home && home.classList.contains('on');
    }, null, { timeout: 90000 });

    expect(unexpectedPageErrors, 'unexpected page errors during boot').toEqual([]);
  });

  test('exposes r941 version marker after boot', async ({ page }) => {
    const version = await page.evaluate(() => window.WHATS_NEW_VERSION);
    expect(version).toBe(R941_VERSION_MARKER);
  });

  test('does not request oot_display_r940.js', async ({ page }) => {
    const requests = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name));
    const forbidden = requests.filter((url) => url.includes(FORBIDDEN_SCRIPT));
    expect(forbidden).toEqual([]);
  });

  test('Build Version globals exist after script load', async ({ page }) => {
    const globals = await page.evaluate(() => ({
      showVersionModal: typeof window.showVersionModal,
      closeVersionModal: typeof window.closeVersionModal,
      copyVersionToClipboard: typeof window._copyVersionToClipboard,
    }));

    expect(globals.showVersionModal).toBe('function');
    expect(globals.closeVersionModal).toBe('function');
    expect(globals.copyVersionToClipboard).toBe('function');
  });

  test('Build Version modal opens and shows r941 running version', async ({ page }) => {
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.showVersionModal());

    const modal = page.locator('#version-modal');
    await expect(modal).toBeVisible();

    const runningVersion = page.locator('#version-modal-string');
    await expect(runningVersion).toContainText('r941');

    await page.evaluate(() => window.closeVersionModal());
    await expect(modal).toBeHidden();
  });

  test('OOT namespace and Home shell render after boot', async ({ page }) => {
    const shell = await page.evaluate(() => ({
      hasOot: typeof window.OOT === 'object' && window.OOT !== null,
      tabs: !!document.getElementById('tabs'),
      home: !!document.getElementById('sc-home'),
      homeActive: document.getElementById('sc-home')?.classList.contains('on') === true,
      namePickerHidden: (() => {
        const overlay = document.getElementById('name-picker-overlay');
        if (!overlay) return true;
        return overlay.style.display === 'none' || overlay.style.display === '';
      })(),
    }));

    expect(shell.hasOot).toBe(true);
    expect(shell.tabs).toBe(true);
    expect(shell.home).toBe(true);
    expect(shell.homeActive).toBe(true);
    expect(shell.namePickerHidden).toBe(true);
  });
});
