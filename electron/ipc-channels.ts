/**
 * IPC channel names shared between the Electron main process and the
 * preload bridge. Kept in one file so the two sides cannot drift.
 */
export const DOWNLOAD_RESULT_CHANNEL = 'download:result' as const;
