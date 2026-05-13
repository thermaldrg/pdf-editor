import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import { DOWNLOAD_RESULT_CHANNEL } from './ipc-channels';

type DownloadResultState = 'completed' | 'cancelled' | 'interrupted';

interface DownloadResult {
  readonly state: DownloadResultState;
  readonly fileName: string;
  readonly savedPath: string | null;
}

/**
 * Subscribes to the next download outcome emitted by the main process and
 * auto-unsubscribes as soon as one arrives. Returns a disposer so callers
 * can cancel the subscription early (e.g. on component unmount).
 */
function onNextDownloadResult(
  callback: (result: DownloadResult) => void,
): () => void {
  const handler = (_event: IpcRendererEvent, payload: DownloadResult): void => {
    ipcRenderer.removeListener(DOWNLOAD_RESULT_CHANNEL, handler);
    callback(payload);
  };
  ipcRenderer.on(DOWNLOAD_RESULT_CHANNEL, handler);
  return (): void => {
    ipcRenderer.removeListener(DOWNLOAD_RESULT_CHANNEL, handler);
  };
}

contextBridge.exposeInMainWorld('electronApi', { onNextDownloadResult });
