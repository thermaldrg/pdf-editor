/**
 * Returns true when the renderer is running inside an Electron window.
 *
 * Detection is based on the `Electron/<version>` token that Chromium adds to
 * the user agent string in Electron renderers. Cheap, synchronous, and works
 * without a preload bridge.
 */
export function isElectron(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.toLowerCase().includes('electron');
}
