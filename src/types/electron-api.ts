import type { DownloadResult } from './download-result';

/**
 * Surface exposed by the Electron preload script to the renderer through
 * `contextBridge.exposeInMainWorld`.
 */
export interface ElectronApi {
  readonly onNextDownloadResult: (
    callback: (result: DownloadResult) => void,
  ) => () => void;
}

declare global {
  interface Window {
    readonly electronApi?: ElectronApi;
  }
}
