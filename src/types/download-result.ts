/**
 * Outcome of a PDF download, forwarded from the Electron main process or
 * synthesized in browser environments where no save dialog is shown.
 */
export interface DownloadResult {
  readonly state: 'completed' | 'cancelled' | 'interrupted';
  readonly fileName: string;
  readonly savedPath: string | null;
}
