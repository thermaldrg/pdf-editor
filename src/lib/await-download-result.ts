import type { DownloadResult } from '../types/download-result';
import '../types/electron-api';
import { isElectron } from './is-electron';

interface AwaitDownloadResultArgs {
  readonly fallbackFileName: string;
}

/**
 * Resolves with the outcome of the next download.
 *
 * In Electron, waits for the main process to report the user's choice in
 * the native save dialog. In plain browsers, resolves synchronously as
 * `completed` because there is no cross-browser way to observe the
 * download outcome after triggering an `<a download>` click.
 */
export function awaitDownloadResult({
  fallbackFileName,
}: AwaitDownloadResultArgs): Promise<DownloadResult> {
  const api = typeof window !== 'undefined' ? window.electronApi : undefined;
  if (!isElectron() || !api) {
    return Promise.resolve({
      state: 'completed',
      fileName: fallbackFileName,
      savedPath: null,
    });
  }
  return new Promise<DownloadResult>((resolve) => {
    api.onNextDownloadResult(resolve);
  });
}
