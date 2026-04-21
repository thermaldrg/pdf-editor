import { useCallback, useState } from 'react';
import { loadPdf } from '../lib/load-pdf';
import type { LoadedPdf } from '../types/pdf';

export interface PdfDocumentApi {
  readonly pdf: LoadedPdf | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly openFile: (file: File) => Promise<void>;
  readonly closeFile: () => void;
}

export function usePdfDocument(): PdfDocumentApi {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const openFile = useCallback(async (file: File): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded: LoadedPdf = await loadPdf({ file });
      setPdf(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PDF');
      setPdf(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeFile = useCallback((): void => {
    setPdf(null);
    setError(null);
  }, []);

  return { pdf, isLoading, error, openFile, closeFile };
}
