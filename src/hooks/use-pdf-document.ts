import { useCallback, useState } from 'react';
import { loadPdf, PdfPasswordRequiredError } from '../lib/load-pdf';
import type { LoadedPdf } from '../types/pdf';

export interface PdfPasswordPrompt {
  readonly fileName: string;
  readonly isIncorrect: boolean;
  readonly errorMessage: string | null;
  readonly isSubmitting: boolean;
}

export interface PdfDocumentApi {
  readonly pdf: LoadedPdf | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly passwordPrompt: PdfPasswordPrompt | null;
  readonly openFile: (file: File) => Promise<void>;
  readonly submitPassword: (password: string) => Promise<void>;
  readonly cancelPasswordPrompt: () => void;
  readonly closeFile: () => void;
}

interface PendingFile {
  readonly file: File;
  readonly isIncorrect: boolean;
}

export function usePdfDocument(): PdfDocumentApi {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] =
    useState<boolean>(false);

  const tryLoad = useCallback(
    async (file: File): Promise<LoadResult> => {
      try {
        const loaded: LoadedPdf = await loadPdf({ file });
        return { kind: 'loaded', pdf: loaded };
      } catch (err) {
        if (err instanceof PdfPasswordRequiredError) {
          return { kind: 'needs-password', isIncorrect: err.isIncorrect };
        }
        const message: string =
          err instanceof Error ? err.message : 'Failed to load PDF';
        return { kind: 'failed', message };
      }
    },
    [],
  );

  const openFile = useCallback(
    async (file: File): Promise<void> => {
      setIsLoading(true);
      setError(null);
      setPending(null);
      setPasswordError(null);
      const result: LoadResult = await tryLoad(file);
      if (result.kind === 'loaded') {
        setPdf(result.pdf);
      } else if (result.kind === 'needs-password') {
        setPending({ file, isIncorrect: result.isIncorrect });
        setPdf(null);
      } else {
        setError(result.message);
        setPdf(null);
      }
      setIsLoading(false);
    },
    [tryLoad],
  );

  const submitPassword = useCallback(
    async (password: string): Promise<void> => {
      const current: PendingFile | null = pending;
      if (!current) return;
      setIsSubmittingPassword(true);
      setPasswordError(null);
      try {
        const decryptedFile: File = await decryptToFile({
          file: current.file,
          password,
        });
        const result: LoadResult = await tryLoad(decryptedFile);
        if (result.kind === 'loaded') {
          setPdf(result.pdf);
          setPending(null);
        } else if (result.kind === 'needs-password') {
          setPending({ file: current.file, isIncorrect: true });
          setPasswordError('Incorrect password.');
        } else {
          setPasswordError(result.message);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'IncorrectPdfPasswordError') {
          setPending({ file: current.file, isIncorrect: true });
          setPasswordError('Incorrect password.');
          return;
        }
        setPasswordError(
          err instanceof Error
            ? err.message
            : 'Could not unlock PDF with that password.',
        );
      } finally {
        setIsSubmittingPassword(false);
      }
    },
    [pending, tryLoad],
  );

  const cancelPasswordPrompt = useCallback((): void => {
    if (isSubmittingPassword) return;
    setPending(null);
    setPasswordError(null);
  }, [isSubmittingPassword]);

  const closeFile = useCallback((): void => {
    setPdf(null);
    setError(null);
    setPending(null);
    setPasswordError(null);
  }, []);

  const passwordPrompt: PdfPasswordPrompt | null = pending
    ? {
        fileName: pending.file.name,
        isIncorrect: pending.isIncorrect,
        errorMessage: passwordError,
        isSubmitting: isSubmittingPassword,
      }
    : null;

  return {
    pdf,
    isLoading,
    error,
    passwordPrompt,
    openFile,
    submitPassword,
    cancelPasswordPrompt,
    closeFile,
  };
}

type LoadResult =
  | { readonly kind: 'loaded'; readonly pdf: LoadedPdf }
  | { readonly kind: 'needs-password'; readonly isIncorrect: boolean }
  | { readonly kind: 'failed'; readonly message: string };

interface DecryptToFileArgs {
  readonly file: File;
  readonly password: string;
}

async function decryptToFile({
  file,
  password,
}: DecryptToFileArgs): Promise<File> {
  const sourceBytes: ArrayBuffer = await file.arrayBuffer();
  const { decryptPdfBytes } = await import('../lib/decrypt-pdf');
  const decrypted: Uint8Array = await decryptPdfBytes({
    bytes: sourceBytes,
    password,
  });
  return new File([decrypted as BlobPart], file.name, {
    type: 'application/pdf',
  });
}
