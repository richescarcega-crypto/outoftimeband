/**
 * Known benign console/page messages during headless r941 smoke runs.
 * Test-only helper — does not modify app code.
 */

export const ALLOWED_CONSOLE_PATTERNS = [
  /Failed to load resource/i,
  /net::ERR_/i,
  /OneSignal/i,
  /firebase/i,
  /gstatic\.com/i,
  /cdn\.onesignal\.com/i,
  /Service Worker/i,
  /Manifest/i,
  /favicon/i,
  /404/i,
];

export const ALLOWED_PAGE_ERROR_PATTERNS = [
  /Unexpected token '<'/i,
  /oot_version_r941\.js/i,
  /oot_compat_r941\.js/i,
];

export function isAllowedConsoleMessage(text) {
  if (!text) return true;
  return ALLOWED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text));
}

export function isAllowedPageError(text) {
  if (!text) return true;
  return ALLOWED_PAGE_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}
